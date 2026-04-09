"use strict";
const serverless = require('serverless-http');
const { app, initAll } = require('./server');

// Wrap the Express app with serverless-http
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Allow Lambda to keep connections open between invocations
  context.callbackWaitsForEmptyEventLoop = false;

  // Initialize DB and seed data only once per cold start
  if (!global.__SIMPLE_SERVER_INIT_DONE) {
    try {
      await initAll();
      global.__SIMPLE_SERVER_INIT_DONE = true;
      console.log('Initialization complete (cold start)');
    } catch (err) {
      console.error('Initialization failed:', err);
      throw err;
    }
  }

  return handler(event, context);
};
