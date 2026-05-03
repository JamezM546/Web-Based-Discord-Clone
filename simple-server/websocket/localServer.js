const crypto = require('crypto');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const { createRealtimeRuntime } = require('./runtime');

const createLocalWebSocketServer = ({ server }) => {
  const sockets = new Map();

  const runtime = createRealtimeRuntime({
    sendToConnection: async (connectionId, payload) => {
      const socket = sockets.get(connectionId);
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('Socket is not open');
      }

      socket.send(JSON.stringify(payload));
    },
  });

  const websocketServer = new WebSocketServer({
    server,
    path: '/ws',
  });

  websocketServer.on('connection', async (socket) => {
    const connectionId = crypto.randomUUID();
    sockets.set(connectionId, socket);

    try {
      await runtime.dispatchRoute({
        routeKey: '$connect',
        connectionId,
        data: null,
      });
    } catch (error) {
      socket.send(
        JSON.stringify({
          type: 'error',
          data: { message: error.message || 'Failed to initialize websocket connection' },
        })
      );
      socket.close();
      return;
    }

    socket.on('message', async (rawBuffer) => {
      try {
        const parsed = JSON.parse(rawBuffer.toString());
        await runtime.dispatchAction({
          connectionId,
          message: parsed,
        });
      } catch (error) {
        try {
          socket.send(
            JSON.stringify({
              type: 'error',
              data: { message: error.message || 'Failed to process websocket action' },
            })
          );
        } catch (_) {
          // Ignore downstream send failures during error handling.
        }
      }
    });

    socket.on('close', async () => {
      sockets.delete(connectionId);
      await runtime.dispatchRoute({
        routeKey: '$disconnect',
        connectionId,
        data: null,
      });
    });
  });

  return {
    websocketServer,
    runtime,
  };
};

module.exports = {
  createLocalWebSocketServer,
};
