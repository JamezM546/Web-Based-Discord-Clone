const { isSupportedRoomId } = require('../lib/rooms');

module.exports = async ({ connectionId, data, runtime }) => {
  const roomId = data?.roomId;
  if (!isSupportedRoomId(roomId)) {
    throw new Error('A valid roomId is required');
  }

  const connection = runtime.requireAuthenticatedConnection(connectionId);
  runtime.store.addConnectionToRoom(roomId, connectionId, {
    userId: connection.userId,
  });

  return {
    type: 'roomJoined',
    data: {
      roomId,
    },
  };
};
