/**
 * API Gateway WebSocket (v2) Lambda entry. Deploy with `serverless deploy` (see serverless.yml).
 */
const jwt = require('jsonwebtoken');
const {
  putConnectionRecord,
  getConnectionRecord,
  deleteConnectionRecord,
  markConnectionAuthenticated,
  putRoomMembership,
  deleteRoomMembership,
  deleteAllMembershipsForConnection,
} = require('./realtime/dynamo');
const { safeBroadcastFromWsEvent } = require('./realtime/broadcast');
const { assertUserMayJoinRoom } = require('./realtime/wsRoomAccess');
const { parseRoomId } = require('./realtime/roomIds');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(obj) {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(obj) };
}

/**
 * WebSocket payloads may arrive base64-encoded when `isBase64Encoded` is true.
 * Non-200 Lambda responses are not delivered to the browser as WS frames — prefer 200 + `{ type: 'error' }`.
 */
function parseBody(event) {
  let raw = event?.body;
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object') return raw;
  if (event?.isBase64Encoded && typeof raw === 'string') {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function handleAuth(connectionId, body) {
  const token = body?.data?.token;
  if (!token || typeof token !== 'string') {
    return jsonResponse({ type: 'error', data: { code: 'AUTH_REQUIRED', message: 'Missing token' } });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string') {
    console.error('wsHandler auth: JWT_SECRET is missing on this Lambda');
    return jsonResponse({
      type: 'error',
      data: { code: 'SERVER_MISCONFIG', message: 'WebSocket auth is not configured (JWT_SECRET)' },
    });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (e) {
    console.warn('wsHandler auth: jwt.verify failed', e?.message || e);
    return jsonResponse({ type: 'error', data: { code: 'AUTH_INVALID', message: 'Invalid or expired token' } });
  }
  const userId = decoded.id;
  if (!userId) {
    return jsonResponse({ type: 'error', data: { code: 'AUTH_INVALID', message: 'Invalid token payload' } });
  }
  try {
    await markConnectionAuthenticated(connectionId, userId, decoded.username || '');
  } catch (e) {
    console.error('wsHandler auth: DynamoDB markConnectionAuthenticated failed', e);
    return jsonResponse({
      type: 'error',
      data: {
        code: 'AUTH_PERSIST_FAILED',
        message: 'Could not save connection state (check WS_CONNECTIONS_TABLE and IAM)',
      },
    });
  }
  return jsonResponse({
    type: 'authOk',
    data: { userId, username: decoded.username, email: decoded.email },
  });
}

async function requireAuthedConnection(connectionId) {
  const rec = await getConnectionRecord(connectionId);
  if (!rec || !rec.authenticated || !rec.userId) {
    const err = new Error('Not authenticated');
    err.code = 'UNAUTHENTICATED';
    throw err;
  }
  return rec;
}

async function handleJoinRoom(connectionId, body) {
  const roomId = body?.data?.roomId;
  if (!roomId || typeof roomId !== 'string') {
    return jsonResponse({ type: 'error', data: { code: 'BAD_REQUEST', message: 'roomId required' } });
  }
  if (!parseRoomId(roomId)) {
    return jsonResponse({ type: 'error', data: { code: 'BAD_ROOM', message: 'Invalid roomId' } });
  }

  let rec;
  try {
    rec = await requireAuthedConnection(connectionId);
    await assertUserMayJoinRoom(rec.userId, roomId);
  } catch (e) {
    if (e.code === 'UNAUTHENTICATED') {
      return jsonResponse({ type: 'error', data: { code: 'UNAUTHENTICATED', message: e.message } });
    }
    if (e.code === 'FORBIDDEN' || e.code === 'BAD_ROOM') {
      return jsonResponse({ type: 'error', data: { code: e.code, message: e.message } });
    }
    console.error('joinRoom access check failed', e);
    return jsonResponse({ type: 'error', data: { code: 'SERVER_ERROR', message: 'Join failed' } });
  }

  await putRoomMembership({ roomId, connectionId, userId: rec.userId });
  return jsonResponse({ type: 'joinOk', data: { roomId } });
}

async function handleLeaveRoom(connectionId, body) {
  const roomId = body?.data?.roomId;
  if (!roomId || typeof roomId !== 'string') {
    return jsonResponse({ type: 'error', data: { code: 'BAD_REQUEST', message: 'roomId required' } });
  }
  try {
    await requireAuthedConnection(connectionId);
  } catch (e) {
    return jsonResponse({ type: 'error', data: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
  }
  await deleteRoomMembership({ roomId, connectionId });
  return jsonResponse({ type: 'leaveOk', data: { roomId } });
}

async function handleTyping(event, connectionId, body, started) {
  const roomId = body?.data?.roomId;
  if (!roomId || typeof roomId !== 'string') {
    return jsonResponse({ type: 'error', data: { code: 'BAD_REQUEST', message: 'roomId required' } });
  }

  let rec;
  try {
    rec = await requireAuthedConnection(connectionId);
  } catch {
    return jsonResponse({ type: 'error', data: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
  }

  const type = started ? 'typingStarted' : 'typingStopped';
  const username = (rec.username && String(rec.username)) || body?.data?.username || undefined;
  const payload = {
    type,
    data: {
      roomId,
      userId: rec.userId,
      username,
    },
  };

  await safeBroadcastFromWsEvent(event, roomId, payload, connectionId);
  return jsonResponse({ type: started ? 'typingStartOk' : 'typingStopOk', data: { roomId } });
}

async function handleDefault(event) {
  const connectionId = event.requestContext?.connectionId;
  const body = parseBody(event);
  const action = body.action;

  switch (action) {
    case 'auth':
      return handleAuth(connectionId, body);
    case 'joinRoom':
      return handleJoinRoom(connectionId, body);
    case 'leaveRoom':
      return handleLeaveRoom(connectionId, body);
    case 'typingStart':
      return handleTyping(event, connectionId, body, true);
    case 'typingStop':
      return handleTyping(event, connectionId, body, false);
    default:
      return jsonResponse({ type: 'error', data: { code: 'UNKNOWN_ACTION', message: action || 'missing action' } });
  }
}

exports.handler = async (event) => {
  const routeKey = event.requestContext?.routeKey;
  const connectionId = event.requestContext?.connectionId;

  try {
    if (routeKey === '$connect') {
      await putConnectionRecord({
        connectionId,
        authenticated: false,
        connectedAt: new Date().toISOString(),
      });
      return { statusCode: 200, headers: JSON_HEADERS, body: 'Connected' };
    }

    if (routeKey === '$disconnect') {
      await deleteAllMembershipsForConnection(connectionId);
      await deleteConnectionRecord(connectionId);
      return { statusCode: 200, headers: JSON_HEADERS, body: 'Disconnected' };
    }

    // Same stack uses RouteSelectionExpression: $request.body.action → routeKey matches `action`
    const actionRoutes = new Set([
      '$default',
      'auth',
      'joinRoom',
      'leaveRoom',
      'typingStart',
      'typingStop',
    ]);
    if (actionRoutes.has(routeKey)) {
      return handleDefault(event);
    }

    return jsonResponse({ type: 'error', data: { code: 'UNKNOWN_ROUTE', message: routeKey } });
  } catch (err) {
    console.error('wsHandler error', routeKey, err);
    // API Gateway does not forward non-200 Lambda bodies as WebSocket messages — always return 200 + JSON.
    return jsonResponse({
      type: 'error',
      data: { code: 'INTERNAL', message: 'Internal error' },
    });
  }
};
