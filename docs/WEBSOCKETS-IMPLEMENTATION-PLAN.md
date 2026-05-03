# WebSockets Implementation Plan — Real-time Chat

Last updated: 2026-05-02

## Recommendation (short)
- Use API Gateway WebSocket API + Lambda + DynamoDB to enable real-time chat and related events. This is the simplest, most effective option given this repository already uses Express + Lambda REST handlers (`simple-server`) and the frontend already expects a `useWebSocket` hook.

Why not AppSync: AppSync (GraphQL subscriptions) is excellent, but it would require converting the current REST message flow and models to GraphQL. Since this project already packages Express Lambdas and the frontend posts to `/api/messages`, implementing an API Gateway WebSocket integration lets us keep existing HTTP persistence and add broadcasting with minimal refactor.

## High-level architecture

- Frontend (Vite/React): `src/app/components/chat/ChatComponent.tsx` will use a new hook `src/app/hooks/useWebSocket.tsx` to open a `wss://` connection, join rooms (channels/DMs), listen for events, and expose actions (startTyping, addReaction, etc.).
- HTTP Backend (existing `simple-server`): keeps POST `/api/messages` for persisting messages. After persistence, that route will call a new WS publisher helper to broadcast the message to currently connected users.
- WebSocket infra (API Gateway WebSocket): client connects to `wss://{api-id}.execute-api.{region}.amazonaws.com/{stage}`. API Gateway routes `$connect` and `$disconnect` invoke small Lambda handlers that record/clean connection metadata in DynamoDB (table: `WebSocketConnections`).
- Broadcasting: the HTTP Lambda (message creation) or a dedicated WS message Lambda will use `ApiGatewayManagementApi.postToConnection()` to deliver messages to connectionIds retrieved from DynamoDB.

Diagram (simplified):

- Client (browser) <--> API Gateway WebSocket <--> $connect/$disconnect Lambdas <--> DynamoDB (connections)
                             ^
                             | (postToConnection)
                   HTTP Lambda (POST /api/messages) -- DynamoDB (messages)

## AWS resources to create

- API Gateway WebSocket API (name: `ChatWebSocket`)
  - Routes: `$connect`, `$disconnect`, (optionally `$default` or `sendMessage` if you want WS-originated writes)
- DynamoDB table: `WebSocketConnections`
  - Primary key: `connectionId` (string)
  - Attributes: `userId` (string), `rooms` (list or string-set), `createdAt` (ISO timestamp)
  - Optional GSI: `roomId -> connectionId` (if storing items per-room makes broadcasting queries cheaper)
- Lambda functions:
  - `wsConnect` — validate JWT, store connection metadata (connectionId, userId)
  - `wsDisconnect` — remove connection metadata
  - `optional wsMessageHandler` — if you want clients to send messages via WS; otherwise keep HTTP route
- IAM roles/policies: allow the connect/disconnect lambdas to read/write the DynamoDB table; allow the HTTP Lambda to call `execute-api:ManageConnections` (postToConnection).

## Changes / Files to add or edit (concrete)

Backend (simple-server)
- Add: `simple-server/ws/connect.js` — Lambda handler for `$connect` that validates the Authorization token (JWT/Cognito) and writes a connection record to `WebSocketConnections`.
- Add: `simple-server/ws/disconnect.js` — Lambda handler for `$disconnect` to remove the connection record.
- Add: `simple-server/ws/publisher.js` — helper used by HTTP message route to broadcast to room connectionIds. Uses `AWS.ApiGatewayManagementApi.postToConnection()`.
- Edit: `simple-server/routes/messages.js` (modify POST `/` handler) — after message persistence, call `publisher.publishToRoom(roomId, payload)` so connected clients receive the event immediately.

Frontend (src)
- Add: `src/app/hooks/useWebSocket.tsx` — hook encapsulating WebSocket lifecycle: connect, reconnection logic, `joinRoom(roomId)`, `leaveRoom(roomId)`, `startTyping(roomId)`, `stopTyping(roomId)`, `addReaction(messageId, emoji)`, and event callbacks. `ChatComponent.tsx` already imports and expects such a hook.
- Add: `src/app/services/websocketService.ts` — shared types and thin helpers for message shapes and fallback transports.
- Verify: `src/app/components/chat/ChatComponent.tsx` — already imports `useWebSocket` and uses `addReaction`/`startTyping` etc. (no change required if hook API matches expectations).

Infrastructure / Deployment files (instructions)
- Document steps in repo docs (this file) and update `docs/DEPLOYMENT-README.md` to include the new WebSocket resources and environment variables for the HTTP Lambda: `WS_API_DOMAIN`, `WS_API_STAGE`, `CONNECTIONS_TABLE`.

## Minimal code snippets (copy into files above)

1) `simple-server/ws/publisher.js` (Node.js — run inside Lambda with aws-sdk v2 available)

```javascript
const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE; // WebSocketConnections

async function getConnectionsForRoom(roomId) {
  // Depending on data model, query by GSI or scan small table. Prefer a room->connection mapping.
  const res = await DynamoDB.query({
    TableName: CONNECTIONS_TABLE,
    IndexName: 'roomId-index', // optional GSI if you store per-room items
    KeyConditionExpression: 'roomId = :r',
    ExpressionAttributeValues: { ':r': roomId }
  }).promise();
  return (res.Items || []).map(i => i.connectionId);
}

async function postToConnection(domain, stage, connectionId, payload) {
  const apigw = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `${domain}/${stage}`
  });

  try {
    await apigw.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload)
    }).promise();
  } catch (err) {
    // 410 = stale connection, caller should remove it
    if (err.statusCode === 410) {
      // Remove stale connection from DB
      await DynamoDB.delete({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
    } else {
      console.error('postToConnection error', err);
    }
  }
}

module.exports = { getConnectionsForRoom, postToConnection };
```

2) Edit `simple-server/routes/messages.js` — after creating message (near where `res.status(201)` is prepared), add:

```javascript
const { getConnectionsForRoom, postToConnection } = require('../ws/publisher');

// after messageWithAuthor is ready
const roomId = messageWithAuthor.channel_id ? `channel:${messageWithAuthor.channel_id}` : `dm:${messageWithAuthor.dm_id}`;
const domain = process.env.WS_API_DOMAIN; // e.g. '{api-id}.execute-api.{region}.amazonaws.com'
const stage = process.env.WS_API_STAGE || 'prod';
const payload = { type: 'message:create', data: { roomId, message: messageWithAuthor } };

const connectionIds = await getConnectionsForRoom(roomId);
await Promise.all(connectionIds.map(id => postToConnection(domain, stage, id, payload)));
```

3) `$connect` Lambda (simplified): validate JWT, then store an item in `WebSocketConnections` mapping connectionId -> userId and optionally store membership.

```javascript
const AWS = require('aws-sdk');
const doc = new AWS.DynamoDB.DocumentClient();
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  const { requestContext } = event;
  const connectionId = requestContext.connectionId;

  // Example: token passed as query param ?auth={jwt}
  const token = (event.queryStringParameters || {}).auth;
  // Validate token (Cognito JWT or your JWT secret) and extract userId
  const userId = validateAndGetUserId(token);

  await doc.put({ TableName: CONNECTIONS_TABLE, Item: {
    connectionId,
    userId,
    rooms: [],
    createdAt: new Date().toISOString()
  }}).promise();

  return { statusCode: 200, body: 'connected' };
};
```

4) Frontend hook `src/app/hooks/useWebSocket.tsx` (outline)

```ts
import { useEffect, useCallback, useRef, useState } from 'react';

export function useWebSocket(handlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const url = `wss://${process.env.VITE_WS_API_DOMAIN}/${process.env.VITE_WS_API_STAGE}?auth=${token}`;
    const ws = new WebSocket(url);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      // dispatch to handlers based on msg.type
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const joinRoom = useCallback((roomId) => {
    wsRef.current?.send(JSON.stringify({ action: 'join', data: { roomId } }));
  }, []);

  // implement leaveRoom, startTyping, stopTyping, addReaction similarly

  return { isConnected, joinRoom, leaveRoom: () => {}, startTyping: () => {}, stopTyping: () => {}, addReaction: () => {}, removeReaction: () => {} };
}
```

Notes: the hook should match the callbacks that `ChatComponent.tsx` already expects: `onMessageCreate`, `onMessageUpdate`, `onMessageDelete`, `onUserTyping`, `onUserStopTyping`, `onReactionAdd`.

## Auth & Security

- Use the same JWT/Cognito tokens the Express API uses. Pass token during the WebSocket `$connect` (querystring or headers if supported by your chosen integration) and validate it inside `$connect` Lambda. Save the resulting `userId` against the `connectionId` in DynamoDB.
- Limit broadcasts: when querying connections for room, ensure only members receive events (your `$connect` can store the user's server memberships on connect, or HTTP message publisher can filter by membership).

## Persistence & ordering

- Continue persisting messages in Postgres (current `Message` model). Use timestamps and message ids already generated.
- Broadcast the fully hydrated message object (including author display name and reactions) after DB write to avoid clients receiving incomplete/temporary objects.

## Local dev & testing

- Local WebSocket testing can use a small `ws`-based server when running locally (dev-only) or you can deploy the WebSocket API to a dev stage and test using the app hosted on Amplify.
- Add env vars for local dev in `simple-server/.env.test` / `.env` and for production Amplify build environment: `WS_API_DOMAIN`, `WS_API_STAGE`, `CONNECTIONS_TABLE`.

## Deployment steps (summary)

1. Create DynamoDB table `WebSocketConnections` and add required IAM policies to allow lambdas to access it.
2. Create API Gateway WebSocket API (`ChatWebSocket`) with `$connect` and `$disconnect` routes and attach `wsConnect` and `wsDisconnect` Lambdas.
3. Deploy Lambdas (package with `npm run package:lambda` or use SAM/CloudFormation). Ensure `wsConnect` and `wsDisconnect` have `CONNECTIONS_TABLE` env var.
4. Update `simple-server` HTTP Lambda environment with `WS_API_DOMAIN` (e.g. `{api-id}.execute-api.{region}.amazonaws.com`) and `WS_API_STAGE` so it can call Management API.
5. Add frontend envs: `VITE_WS_API_DOMAIN` and `VITE_WS_API_STAGE` (used by `useWebSocket` to connect). Deploy frontend via Amplify.

## Why this is the best fit for this repo

- Minimal changes to server-side persistence: we keep `POST /api/messages` and only add broadcasting.
- Frontend already expects a modular `useWebSocket` API — we only need to implement it and wire it to the deployed `wss://` endpoint.
- Leverages AWS-managed scaling (API Gateway, Lambda, DynamoDB) without migrating to GraphQL.

---

If you want, I can now:

1. Scaffold the frontend files: `src/app/hooks/useWebSocket.tsx` and `src/app/services/websocketService.ts` with working code and tests.
2. Add the backend helper `simple-server/ws/publisher.js` and patch `simple-server/routes/messages.js` to call it.
3. Draft minimal `$connect` and `$disconnect` Lambda handlers and a sample CloudFormation/SAM snippet that provisions the WebSocket API + DynamoDB.

Which steps should I do next? (pick any combination of 1/2/3 or ask for an alternative)
