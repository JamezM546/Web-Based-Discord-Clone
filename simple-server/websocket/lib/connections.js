const createInMemoryRealtimeStore = () => {
  const connections = new Map();
  const roomMembers = new Map();
  const connectionRooms = new Map();

  const getRoomConnectionSet = (roomId) => {
    if (!roomMembers.has(roomId)) {
      roomMembers.set(roomId, new Set());
    }
    return roomMembers.get(roomId);
  };

  const getConnectionRoomSet = (connectionId) => {
    if (!connectionRooms.has(connectionId)) {
      connectionRooms.set(connectionId, new Set());
    }
    return connectionRooms.get(connectionId);
  };

  return {
    async registerConnection(connectionId, metadata = {}) {
      connections.set(connectionId, {
        connectionId,
        authenticated: false,
        connectedAt: new Date().toISOString(),
        ...metadata,
      });
      return connections.get(connectionId);
    },

    async getConnection(connectionId) {
      return connections.get(connectionId) || null;
    },

    async authenticateConnection(connectionId, authData) {
      const current = connections.get(connectionId);
      if (!current) return null;

      const next = {
        ...current,
        authenticated: true,
        authenticatedAt: new Date().toISOString(),
        ...authData,
      };

      connections.set(connectionId, next);
      return next;
    },

    async removeConnection(connectionId) {
      const rooms = await this.removeConnectionMemberships(connectionId);
      connections.delete(connectionId);
      connectionRooms.delete(connectionId);
      return rooms;
    },

    async addConnectionToRoom(roomId, connectionId, membershipData = {}) {
      getRoomConnectionSet(roomId).add(connectionId);
      getConnectionRoomSet(connectionId).add(roomId);

      const connection = connections.get(connectionId);
      if (!connection) return null;

      const next = {
        ...connection,
        userId: membershipData.userId || connection.userId,
      };

      connections.set(connectionId, next);
      return next;
    },

    async removeConnectionFromRoom(roomId, connectionId) {
      const roomSet = roomMembers.get(roomId);
      if (roomSet) {
        roomSet.delete(connectionId);
        if (roomSet.size === 0) {
          roomMembers.delete(roomId);
        }
      }

      const connectionSet = connectionRooms.get(connectionId);
      if (connectionSet) {
        connectionSet.delete(roomId);
        if (connectionSet.size === 0) {
          connectionRooms.delete(connectionId);
        }
      }
    },

    async removeConnectionMemberships(connectionId) {
      const rooms = Array.from(connectionRooms.get(connectionId) || []);
      await Promise.all(rooms.map((roomId) => this.removeConnectionFromRoom(roomId, connectionId)));
      return rooms;
    },

    async getRoomMembers(roomId) {
      return Array.from(roomMembers.get(roomId) || []).map((connectionId) => connections.get(connectionId)).filter(Boolean);
    },

    async listConnectionRooms(connectionId) {
      return Array.from(connectionRooms.get(connectionId) || []);
    },
  };
};

module.exports = {
  createInMemoryRealtimeStore,
};
