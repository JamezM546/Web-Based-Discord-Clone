const { isSupportedRoomId } = require('../lib/rooms');

module.exports = async ({ connectionId, data, runtime }) => {
  const roomId = data?.roomId;
  if (!isSupportedRoomId(roomId)) {
    throw new Error('A valid roomId is required');
  }

  await runtime.requireAuthenticatedConnection(connectionId);
  await runtime.store.removeConnectionFromRoom(roomId, connectionId);

  return {
    type: 'roomLeft',
    data: {
      roomId,
    },
  };
};
