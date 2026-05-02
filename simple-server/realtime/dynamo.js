const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function connectionsTable() {
  const name = process.env.WS_CONNECTIONS_TABLE;
  if (!name) throw new Error('WS_CONNECTIONS_TABLE is not set');
  return name;
}

function membershipsTable() {
  const name = process.env.WS_ROOM_MEMBERSHIPS_TABLE;
  if (!name) throw new Error('WS_ROOM_MEMBERSHIPS_TABLE is not set');
  return name;
}

function defaultTtlSeconds() {
  return Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
}

async function putConnectionRecord({ connectionId, authenticated, userId, connectedAt }) {
  await client.send(
    new PutCommand({
      TableName: connectionsTable(),
      Item: {
        connectionId,
        authenticated: !!authenticated,
        userId: userId || undefined,
        connectedAt: connectedAt || new Date().toISOString(),
        ttl: defaultTtlSeconds(),
      },
    })
  );
}

async function getConnectionRecord(connectionId) {
  const out = await client.send(
    new GetCommand({
      TableName: connectionsTable(),
      Key: { connectionId },
    })
  );
  return out.Item || null;
}

async function deleteConnectionRecord(connectionId) {
  await client.send(
    new DeleteCommand({
      TableName: connectionsTable(),
      Key: { connectionId },
    })
  );
}

async function markConnectionAuthenticated(connectionId, userId, username) {
  await client.send(
    new UpdateCommand({
      TableName: connectionsTable(),
      Key: { connectionId },
      UpdateExpression: 'SET authenticated = :a, userId = :u, username = :n, #ttl = :t',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':a': true,
        ':u': userId,
        ':n': username || '',
        ':t': defaultTtlSeconds(),
      },
    })
  );
}

async function putRoomMembership({ roomId, connectionId, userId }) {
  await client.send(
    new PutCommand({
      TableName: membershipsTable(),
      Item: {
        roomId,
        connectionId,
        userId,
        joinedAt: new Date().toISOString(),
        ttl: defaultTtlSeconds(),
      },
    })
  );
}

async function deleteRoomMembership({ roomId, connectionId }) {
  await client.send(
    new DeleteCommand({
      TableName: membershipsTable(),
      Key: { roomId, connectionId },
    })
  );
}

async function queryMembershipsByRoom(roomId) {
  const out = await client.send(
    new QueryCommand({
      TableName: membershipsTable(),
      KeyConditionExpression: 'roomId = :r',
      ExpressionAttributeValues: { ':r': roomId },
    })
  );
  return out.Items || [];
}

const MEMBERSHIP_BY_CONNECTION_INDEX = 'connectionId-index';

async function queryMembershipsByConnection(connectionId) {
  const out = await client.send(
    new QueryCommand({
      TableName: membershipsTable(),
      IndexName: MEMBERSHIP_BY_CONNECTION_INDEX,
      KeyConditionExpression: 'connectionId = :c',
      ExpressionAttributeValues: { ':c': connectionId },
    })
  );
  return out.Items || [];
}

async function deleteAllMembershipsForConnection(connectionId) {
  const items = await queryMembershipsByConnection(connectionId);
  await Promise.all(
    items.map((item) =>
      client.send(
        new DeleteCommand({
          TableName: membershipsTable(),
          Key: { roomId: item.roomId, connectionId: item.connectionId },
        })
      )
    )
  );
}

module.exports = {
  client,
  putConnectionRecord,
  getConnectionRecord,
  deleteConnectionRecord,
  markConnectionAuthenticated,
  putRoomMembership,
  deleteRoomMembership,
  queryMembershipsByRoom,
  queryMembershipsByConnection,
  deleteAllMembershipsForConnection,
  MEMBERSHIP_BY_CONNECTION_INDEX,
};
