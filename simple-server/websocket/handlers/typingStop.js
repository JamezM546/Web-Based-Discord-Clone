const { isSupportedRoomId } = require('../lib/rooms');

module.exports = async ({ connectionId, data, runtime }) => {
  const roomId = data?.roomId;
  if (!isSupportedRoomId(roomId)) {
    throw new Error('A valid roomId is required');
  }

  const connection = runtime.requireAuthenticatedConnection(connectionId);
  await runtime.broadcastToRoom(
    roomId,
    {
      type: 'typingStopped',
      data: {
        roomId,
        userId: connection.userId,
      },
    },
    { excludeConnectionId: connectionId }
  );

  return null;
};
