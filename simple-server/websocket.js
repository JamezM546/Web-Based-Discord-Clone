const { createRealtimeRuntime } = require('./websocket/runtime');

const createWebSocketLambdaHandler = ({ store, sendToConnection }) => {
  const runtime = createRealtimeRuntime({
    store,
    sendToConnection,
  });

  return async (event) => {
    const routeKey = event?.requestContext?.routeKey || '$default';
    const connectionId = event?.requestContext?.connectionId;

    try {
      if (routeKey === '$connect' || routeKey === '$disconnect') {
        await runtime.dispatchRoute({
          routeKey,
          connectionId,
          data: event.body ? JSON.parse(event.body) : null,
        });
      } else {
        const body = event.body ? JSON.parse(event.body) : {};
        await runtime.dispatchAction({
          connectionId,
          message: body,
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          message: error.message || 'Websocket route failed',
        }),
      };
    }
  };
};

module.exports = {
  createWebSocketLambdaHandler,
  createRealtimeRuntime,
};
