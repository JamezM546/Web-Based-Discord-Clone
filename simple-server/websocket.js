const { createRealtimeRuntime } = require('./websocket/runtime');
const { getRouteHandler, getActionHandler } = require('./websocket/lib/routes');

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
        const handler = getRouteHandler(routeKey);
        await handler({
          connectionId,
          data: event.body ? JSON.parse(event.body) : null,
          runtime,
        });
      } else {
        const body = event.body ? JSON.parse(event.body) : {};
        const handler = getActionHandler(body.action);
        await handler({
          connectionId,
          data: body.data,
          runtime,
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
