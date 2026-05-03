const { verifyRealtimeToken } = require('../lib/auth');
const { createUserRoomId } = require('../lib/rooms');

module.exports = async ({ connectionId, data, runtime }) => {
  const token = data?.token;
  const user = verifyRealtimeToken(token);
  const connection = runtime.store.authenticateConnection(connectionId, {
    userId: user.id,
    username: user.username || null,
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  runtime.store.addConnectionToRoom(createUserRoomId(user.id), connectionId, {
    userId: user.id,
  });

  return {
    type: 'authSuccess',
    data: {
      userId: user.id,
    },
  };
};
