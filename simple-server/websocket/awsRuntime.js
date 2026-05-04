const { createRealtimeRuntime } = require('./runtime');
const { createDynamoDbRealtimeStore } = require('./lib/awsStore');
const { createApiGatewayConnectionSender } = require('./lib/awsSend');

const isAwsRealtimeEnabled = () =>
  Boolean(process.env.WS_CONNECTIONS_TABLE && process.env.WS_ROOM_MEMBERSHIPS_TABLE);

const createAwsRealtimeRuntime = () => {
  const store = createDynamoDbRealtimeStore();
  const sendToConnection = createApiGatewayConnectionSender();

  return createRealtimeRuntime({
    store,
    sendToConnection,
  });
};

module.exports = {
  createAwsRealtimeRuntime,
  isAwsRealtimeEnabled,
};
