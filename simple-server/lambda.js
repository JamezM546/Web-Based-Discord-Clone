/**
 * AWS Lambda entrypoint. Configure handler as `lambda.handler`.
 * Uses serverless-http to map API Gateway proxy events to Express.
 */
require('dotenv').config();
const serverless = require('serverless-http');
const { app, initAll } = require('./server');

let initPromise;

function ensureInit() {
  if (!initPromise) {
    initPromise = initAll();
  }
  return initPromise;
}

const httpHandler = serverless(app);

exports.handler = async (event, context) => {
  // Allow the Lambda process to freeze with pooled PG clients still idle
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureInit();
  return httpHandler(event, context);
};
