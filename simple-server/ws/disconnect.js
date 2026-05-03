const AWS = require('aws-sdk');
const doc = new AWS.DynamoDB.DocumentClient();
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  try {
    const { requestContext } = event;
    const connectionId = requestContext && requestContext.connectionId;
    if (!connectionId) return { statusCode: 400, body: 'Missing connectionId' };

    await doc.delete({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
    return { statusCode: 200, body: 'disconnected' };
  } catch (err) {
    console.error('Disconnect handler error', err);
    return { statusCode: 500, body: 'error' };
  }
};
