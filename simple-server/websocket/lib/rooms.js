const CHANNEL_ROOM_PREFIX = 'channel:';
const DM_ROOM_PREFIX = 'dm:';
const USER_ROOM_PREFIX = 'user:';

const createChannelRoomId = (channelId) => `${CHANNEL_ROOM_PREFIX}${channelId}`;
const createDmRoomId = (dmId) => `${DM_ROOM_PREFIX}${dmId}`;
const createUserRoomId = (userId) => `${USER_ROOM_PREFIX}${userId}`;

const isSupportedRoomId = (roomId) =>
  typeof roomId === 'string' &&
  (
    roomId.startsWith(CHANNEL_ROOM_PREFIX) ||
    roomId.startsWith(DM_ROOM_PREFIX) ||
    roomId.startsWith(USER_ROOM_PREFIX)
  );

const getMessageRoomId = (message) => {
  if (message.channel_id) return createChannelRoomId(message.channel_id);
  if (message.dm_id) return createDmRoomId(message.dm_id);
  return null;
};

const getMessageScope = (message) => ({
  roomId: getMessageRoomId(message),
  channelId: message.channel_id || null,
  dmId: message.dm_id || null,
});

module.exports = {
  createChannelRoomId,
  createDmRoomId,
  createUserRoomId,
  getMessageRoomId,
  getMessageScope,
  isSupportedRoomId,
};
