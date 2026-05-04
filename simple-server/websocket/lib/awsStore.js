const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const createDynamoDbRealtimeStore = ({
  region = process.env.AWS_REGION,
  connectionsTableName = process.env.WS_CONNECTIONS_TABLE,
  roomMembershipsTableName = process.env.WS_ROOM_MEMBERSHIPS_TABLE,
  connectionRoomsIndexName = process.env.WS_CONNECTION_ROOMS_INDEX || 'connectionId-roomId-index',
  documentClient,
} = {}) => {
  if (!connectionsTableName) {
    throw new Error('WS_CONNECTIONS_TABLE is required for the DynamoDB realtime store');
  }
  if (!roomMembershipsTableName) {
    throw new Error('WS_ROOM_MEMBERSHIPS_TABLE is required for the DynamoDB realtime store');
  }

  const client =
    documentClient ||
    DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region,
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      }
    );

  const putConnection = async (item) => {
    await client.send(
      new PutCommand({
        TableName: connectionsTableName,
        Item: item,
      })
    );
    return item;
  };

  const deleteMembershipBatch = async (rooms, connectionId) => {
    if (!rooms.length) return;

    const requestItems = rooms.map((roomId) => ({
      DeleteRequest: {
        Key: {
          roomId,
          connectionId,
        },
      },
    }));

    for (let index = 0; index < requestItems.length; index += 25) {
      await client.send(
        new BatchWriteCommand({
          RequestItems: {
            [roomMembershipsTableName]: requestItems.slice(index, index + 25),
          },
        })
      );
    }
  };

  return {
    async registerConnection(connectionId, metadata = {}) {
      const item = {
        connectionId,
        authenticated: false,
        connectedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        ...metadata,
      };
      return putConnection(item);
    },

    async getConnection(connectionId) {
      const response = await client.send(
        new GetCommand({
          TableName: connectionsTableName,
          Key: {
            connectionId,
          },
        })
      );
      return response.Item || null;
    },

    async authenticateConnection(connectionId, authData) {
      const current = await this.getConnection(connectionId);
      if (!current) return null;

      const next = {
        ...current,
        authenticated: true,
        authenticatedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        ...authData,
      };
      return putConnection(next);
    },

    async removeConnection(connectionId) {
      const rooms = await this.removeConnectionMemberships(connectionId);
      await client.send(
        new DeleteCommand({
          TableName: connectionsTableName,
          Key: {
            connectionId,
          },
        })
      );
      return rooms;
    },

    async addConnectionToRoom(roomId, connectionId, membershipData = {}) {
      await client.send(
        new PutCommand({
          TableName: roomMembershipsTableName,
          Item: {
            roomId,
            connectionId,
            userId: membershipData.userId || null,
            joinedAt: new Date().toISOString(),
          },
        })
      );

      const existingConnection = await this.getConnection(connectionId);
      if (!existingConnection) return null;

      const next = {
        ...existingConnection,
        userId: membershipData.userId || existingConnection.userId,
        lastSeenAt: new Date().toISOString(),
      };
      return putConnection(next);
    },

    async removeConnectionFromRoom(roomId, connectionId) {
      await client.send(
        new DeleteCommand({
          TableName: roomMembershipsTableName,
          Key: {
            roomId,
            connectionId,
          },
        })
      );
    },

    async removeConnectionMemberships(connectionId) {
      const rooms = await this.listConnectionRooms(connectionId);
      await deleteMembershipBatch(rooms, connectionId);
      return rooms;
    },

    async getRoomMembers(roomId) {
      const response = await client.send(
        new QueryCommand({
          TableName: roomMembershipsTableName,
          KeyConditionExpression: 'roomId = :roomId',
          ExpressionAttributeValues: {
            ':roomId': roomId,
          },
        })
      );

      return (response.Items || []).map((item) => ({
        connectionId: item.connectionId,
        userId: item.userId || null,
      }));
    },

    async listConnectionRooms(connectionId) {
      const response = await client.send(
        new QueryCommand({
          TableName: roomMembershipsTableName,
          IndexName: connectionRoomsIndexName,
          KeyConditionExpression: 'connectionId = :connectionId',
          ExpressionAttributeValues: {
            ':connectionId': connectionId,
          },
        })
      );

      return (response.Items || []).map((item) => item.roomId);
    },
  };
};

module.exports = {
  createDynamoDbRealtimeStore,
};
