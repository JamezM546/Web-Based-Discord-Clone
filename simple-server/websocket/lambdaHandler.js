const WebSocketHandler = require('./websocketHandler');

// Main Lambda handler for API Gateway WebSocket events
exports.handler = async (event, context) => {
  console.log('WebSocket Lambda event:', JSON.stringify(event, null, 2));
  
  const wsHandler = new WebSocketHandler();
  
  try {
    // Route based on event type
    switch (event.requestContext?.routeKey) {
      case '$connect':
        return await wsHandler.handleConnect(event);
      
      case '$disconnect':
        return await wsHandler.handleDisconnect(event);
      
      case '$default':
        // Custom route for all WebSocket messages
        return await wsHandler.handleRouteMessage(event);
      
      default:
        console.log('Unknown route key:', event.requestContext?.routeKey);
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('WebSocket Lambda handler error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
