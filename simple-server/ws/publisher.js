const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const DEV_WS_URL = process.env.DEV_WS_URL || null; // e.g. http://localhost:8081 for local dev adapter

function httpPost(urlStr, obj) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const data = JSON.stringify(obj);
      const lib = u.protocol === 'https:' ? require('https') : require('http');
      const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };
      const req = lib.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => body += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ status: res.statusCode, body });
          return reject(new Error('HTTP ' + res.statusCode + ' ' + body));
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function getConnectionsForRoom(roomId) {
  if (!CONNECTIONS_TABLE) throw new Error('CONNECTIONS_TABLE not configured');

  // Prefer a GSI named 'roomId-index' if available
  try {
    const res = await DynamoDB.query({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'roomId-index',
      KeyConditionExpression: 'roomId = :r',
      ExpressionAttributeValues: { ':r': roomId }
    }).promise();
    return (res.Items || []).map(i => i.connectionId);
  } catch (err) {
    // Fallback to scan+filter for small tables / dev
    console.warn('roomId-index not available, falling back to scan', err && err.message);
    const res = await DynamoDB.scan({ TableName: CONNECTIONS_TABLE }).promise();
    const items = (res.Items || []).filter(i => Array.isArray(i.rooms) ? i.rooms.includes(roomId) : String(i.roomId) === String(roomId));
    return items.map(i => i.connectionId);
  }
}

async function postToConnection(domain, stage, connectionId, payload) {
  if (!domain) throw new Error('WS API domain not configured');
  const apigw = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `${domain}/${stage}`
  });

  try {
    await apigw.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload)
    }).promise();
  } catch (err) {
    // 410 = stale connection
    if (err && err.statusCode === 410) {
      try {
        await DynamoDB.delete({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
      } catch (delErr) {
        console.error('Failed to remove stale connection', connectionId, delErr);
      }
    } else {
      console.error('postToConnection error', err);
    }
  }
}

async function publishToRoom(domain, stage, roomId, payload) {
  // Dev adapter: POST to local dev WS server which handles broadcasting
  if (DEV_WS_URL) {
    try {
      const url = `${DEV_WS_URL.replace(/\/$/, '')}/publish`;
      if (typeof fetch === 'function') {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, payload })
        });
      } else {
        // fallback to a small http/https POST implementation for Node runtimes without global fetch
        await httpPost(url, { roomId, payload });
      }
      return 0;
    } catch (err) {
      console.warn('Dev WS publish failed', err && err.message);
      return 0;
    }
  }

  const connectionIds = await getConnectionsForRoom(roomId);
  if (!connectionIds || connectionIds.length === 0) return 0;
  await Promise.all(connectionIds.map(id => postToConnection(domain, stage, id, payload)));
  return connectionIds.length;
}

module.exports = { getConnectionsForRoom, postToConnection, publishToRoom };
