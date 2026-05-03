#!/usr/bin/env node
// Local development WebSocket server + HTTP publish endpoint
// Run with: node ws/dev-ws-server.js (from simple-server)

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.DEV_WS_PORT ? Number(process.env.DEV_WS_PORT) : 8081;

// Map roomId -> Set of ws
const rooms = new Map();
// Map ws -> Set of roomId
const clientRooms = new Map();

function addClientToRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  if (!clientRooms.has(ws)) clientRooms.set(ws, new Set());
  clientRooms.get(ws).add(roomId);
}

function removeClientFromRoom(ws, roomId) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(ws);
    if (rooms.get(roomId).size === 0) rooms.delete(roomId);
  }
  if (clientRooms.has(ws)) {
    clientRooms.get(ws).delete(roomId);
    if (clientRooms.get(ws).size === 0) clientRooms.delete(ws);
  }
}

function broadcastToRoom(roomId, payload) {
  const set = rooms.get(roomId);
  if (!set) return 0;
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
  return set.size;
}

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const { action, data } = msg || {};
    if (!action) return;
    if (action === 'join' && data && data.roomId) {
      addClientToRoom(ws, data.roomId);
      ws.send(JSON.stringify({ type: 'system', data: { joined: data.roomId } }));
    } else if (action === 'leave' && data && data.roomId) {
      removeClientFromRoom(ws, data.roomId);
      ws.send(JSON.stringify({ type: 'system', data: { left: data.roomId } }));
    } else if (action === 'typing:start' && data && data.roomId) {
      // broadcast typing start to room
      broadcastToRoom(data.roomId, { type: 'typing:start', data: { roomId: data.roomId, user: data.user } });
    } else if (action === 'typing:stop' && data && data.roomId) {
      broadcastToRoom(data.roomId, { type: 'typing:stop', data: { roomId: data.roomId, userId: data.userId } });
    } else if (action === 'reaction:add' && data) {
      broadcastToRoom(data.roomId || data.messageId, { type: 'reaction:add', data });
    }
  });

  ws.on('close', () => {
    // cleanup
    const roomsForClient = clientRooms.get(ws);
    if (roomsForClient) {
      for (const r of roomsForClient) {
        removeClientFromRoom(ws, r);
      }
    }
    clientRooms.delete(ws);
  });
});

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/publish') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { roomId, payload } = JSON.parse(body);
        const count = broadcastToRoom(roomId, payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sent: count }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // upgrade to ws
  res.writeHead(404);
  res.end();
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, () => {
  console.log(`Dev WebSocket server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint (ws): ws://localhost:${PORT}`);
});
