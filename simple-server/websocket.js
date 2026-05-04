const { createRealtimeRuntime } = require('./websocket/runtime');
const { getRouteHandler, getActionHandler } = require('./websocket/lib/routes');
const { createInMemoryRealtimeStore } = require('./websocket/lib/connections');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const apiGatewayManagement = new ApiGatewayManagementApiClient({
  endpoint: process.env.APIGW_MANAGEMENT_ENDPOINT,
});

const sendToConnection = async (connectionId, data) => {
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(data),
    });
    await apiGatewayManagement.send(command);
  } catch (error) {
    if (error.name === 'GoneException') {
      // Connection is stale, remove it
      console.log(`Connection ${connectionId} is stale`);
    } else {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
};

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

      // Return 200 for successful route handling
      return { statusCode: 200 };
    } catch (error) {
      console.error('WebSocket handler error:', error);
      // Return error code (connection will be rejected or message discarded)
      return { statusCode: 400 };
    }
  };
};

// AWS Lambda handler export - entry point for API Gateway WebSocket
const handler = async (event, context) => {
  // Allow the Lambda process to freeze with pooled PG clients still idle
  context.callbackWaitsForEmptyEventLoop = false;

  console.log('WebSocket event received:', {
    routeKey: event?.requestContext?.routeKey,
    connectionId: event?.requestContext?.connectionId,
    eventType: event?.requestContext?.eventType,
  });

  try {
    // Create the proper in-memory store
    const store = createInMemoryRealtimeStore();
    
    // Create and use WebSocket handler
    const wsHandler = createWebSocketLambdaHandler({
      store,
      sendToConnection,
    });

    const result = await wsHandler(event);
    console.log('WebSocket handler result:', result);
    return result;
  } catch (error) {
    console.error('Uncaught error in WebSocket handler:', error);
    return { statusCode: 500 };
  }
};

module.exports = {
  createWebSocketLambdaHandler,
  createRealtimeRuntime,
  handler,
};
