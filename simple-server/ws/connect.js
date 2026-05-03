const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const doc = new AWS.DynamoDB.DocumentClient();
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

function validateAndGetUserId(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload && payload.id ? payload.id : (payload && payload.userId ? payload.userId : null);
  } catch (err) {
    console.warn('Invalid token on websocket connect', err && err.message);
    return null;
  }
}

exports.handler = async (event) => {
  const { requestContext } = event;
  const connectionId = requestContext && requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: 'Missing connectionId' };

  const token = (event.queryStringParameters || {}).auth || null;
  const userId = validateAndGetUserId(token);

  const item = {
    connectionId,
    userId: userId || null,
    rooms: [],
    createdAt: new Date().toISOString()
  };

  try {
    await doc.put({ TableName: CONNECTIONS_TABLE, Item: item }).promise();
    return { statusCode: 200, body: 'connected' };
  } catch (err) {
    console.error('Failed to put connection', err);
    return { statusCode: 500, body: 'failed' };
  }
};
