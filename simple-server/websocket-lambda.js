const { setRealtimeRuntime } = require('./websocket/gateway');
const { createWebSocketLambdaHandler } = require('./websocket');
const { createAwsRealtimeRuntime } = require('./websocket/awsRuntime');

const runtime = createAwsRealtimeRuntime();
setRealtimeRuntime(runtime);

exports.handler = createWebSocketLambdaHandler({
  store: runtime.store,
  sendToConnection: runtime.sendToConnection,
});
