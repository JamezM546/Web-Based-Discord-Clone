/**
 * Canonical room ids for WebSocket membership and fanout.
 * Use everywhere: join/leave, broadcasts, logs.
 */

const CHANNEL_PREFIX = 'channel:';
const DM_PREFIX = 'dm:';

function channelRoomId(channelId) {
  return `${CHANNEL_PREFIX}${channelId}`;
}

function dmRoomId(dmId) {
  return `${DM_PREFIX}${dmId}`;
}

function parseRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') return null;
  if (roomId.startsWith(CHANNEL_PREFIX)) {
    const id = roomId.slice(CHANNEL_PREFIX.length);
    return id ? { kind: 'channel', id, roomId } : null;
  }
  if (roomId.startsWith(DM_PREFIX)) {
    const id = roomId.slice(DM_PREFIX.length);
    return id ? { kind: 'dm', id, roomId } : null;
  }
  return null;
}

module.exports = {
  channelRoomId,
  dmRoomId,
  parseRoomId,
  CHANNEL_PREFIX,
  DM_PREFIX,
};
