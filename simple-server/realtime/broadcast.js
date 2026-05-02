const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');
const {
  deleteRoomMembership,
  deleteConnectionRecord,
  queryMembershipsByRoom,
} = require('./dynamo');

function buildManagementClient(endpoint) {
  if (!endpoint) return null;
  const normalized = endpoint.startsWith('https://') ? endpoint : `https://${endpoint}`;
  return new ApiGatewayManagementApiClient({ endpoint: normalized });
}

function managementEndpointFromWsEvent(event) {
  const { domainName, stage } = event.requestContext || {};
  if (!domainName || !stage) return null;
  return `https://${domainName}/${stage}`;
}

/**
 * Broadcast a JSON envelope to every connection in a room.
 * @param {string} roomId e.g. channel:c1
 * @param {object} envelope { type, data }
 * @param {{ endpoint: string, excludeConnectionId?: string }} options Management API URL (include stage path)
 */
async function broadcastToRoom(roomId, envelope, options) {
  const endpoint = options.endpoint;
  const excludeConnectionId = options.excludeConnectionId;
  if (!endpoint) {
    console.warn('[realtime] broadcastToRoom skipped: no management endpoint');
    return;
  }

  const mgmt = buildManagementClient(endpoint);
  const members = await queryMembershipsByRoom(roomId);
  const body = JSON.stringify(envelope);

  for (const m of members) {
    const connectionId = m.connectionId;
    if (!connectionId) continue;
    if (excludeConnectionId && connectionId === excludeConnectionId) continue;
    try {
      await mgmt.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(body, 'utf8'),
        })
      );
    } catch (err) {
      const status = err?.$metadata?.httpStatusCode || err?.statusCode;
      const name = err?.name || err?.code;
      if (status === 410 || name === 'GoneException') {
        try {
          await deleteRoomMembership({ roomId, connectionId });
          await deleteConnectionRecord(connectionId);
        } catch (cleanupErr) {
          console.error('[realtime] cleanup stale connection failed', cleanupErr);
        }
      } else {
        console.error('[realtime] PostToConnection failed', { connectionId, name, status, message: err?.message });
      }
    }
  }
}

/**
 * Used by REST Lambda: fanout after successful RDS writes. Never throws to callers.
 */
async function safeBroadcastFromEnv(roomId, envelope) {
  const endpoint = (process.env.WS_MANAGEMENT_API_ENDPOINT || '').trim();
  if (!endpoint || !(process.env.WS_ROOM_MEMBERSHIPS_TABLE || '').trim()) {
    return;
  }
  try {
    await broadcastToRoom(roomId, envelope, { endpoint });
  } catch (err) {
    console.error('[realtime] safeBroadcastFromEnv failed', { roomId, message: err?.message });
  }
}

/**
 * Used by WebSocket Lambda handlers (typing, etc.).
 */
async function safeBroadcastFromWsEvent(event, roomId, envelope, excludeConnectionId) {
  const endpoint = managementEndpointFromWsEvent(event);
  if (!endpoint) {
    console.warn('[realtime] safeBroadcastFromWsEvent: could not derive endpoint');
    return;
  }
  try {
    await broadcastToRoom(roomId, envelope, { endpoint, excludeConnectionId });
  } catch (err) {
    console.error('[realtime] safeBroadcastFromWsEvent failed', { roomId, message: err?.message });
  }
}

module.exports = {
  broadcastToRoom,
  safeBroadcastFromEnv,
  safeBroadcastFromWsEvent,
  managementEndpointFromWsEvent,
  buildManagementClient,
};
