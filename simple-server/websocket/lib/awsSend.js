const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const createApiGatewayConnectionSender = ({
  endpoint = process.env.WEBSOCKET_API_ENDPOINT,
  apiId = process.env.WEBSOCKET_API_ID,
  stage = process.env.WEBSOCKET_STAGE,
  region = process.env.AWS_REGION,
} = {}) => {
  const resolvedEndpoint =
    endpoint || (apiId && stage && region ? `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}` : null);

  if (!resolvedEndpoint) {
    throw new Error('WEBSOCKET_API_ENDPOINT or WEBSOCKET_API_ID/WEBSOCKET_STAGE/AWS_REGION is required');
  }

  const client = new ApiGatewayManagementApiClient({
    endpoint: resolvedEndpoint,
    region,
  });

  return async (connectionId, payload) => {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      })
    );
  };
};

module.exports = {
  createApiGatewayConnectionSender,
};
