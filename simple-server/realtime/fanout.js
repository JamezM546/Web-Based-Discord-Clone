const { safeBroadcastFromEnv } = require('./broadcast');
const { channelRoomId, dmRoomId } = require('./roomIds');

function roomIdForMessageRow(row) {
  if (!row) return null;
  if (row.channel_id) return channelRoomId(row.channel_id);
  if (row.dm_id) return dmRoomId(row.dm_id);
  return null;
}

function fanoutMessageCreated(messageRow) {
  const roomId = roomIdForMessageRow(messageRow);
  if (!roomId) return;
  return safeBroadcastFromEnv(roomId, {
    type: 'messageCreated',
    data: { roomId, message: messageRow },
  });
}

function fanoutMessageUpdated(messageRow) {
  const roomId = roomIdForMessageRow(messageRow);
  if (!roomId) return;
  return safeBroadcastFromEnv(roomId, {
    type: 'messageUpdated',
    data: { roomId, message: messageRow },
  });
}

function fanoutMessageDeleted({ messageId, channelId, dmId }) {
  const roomId = channelId ? channelRoomId(channelId) : dmId ? dmRoomId(dmId) : null;
  if (!roomId) return;
  return safeBroadcastFromEnv(roomId, {
    type: 'messageDeleted',
    data: { roomId, messageId },
  });
}

function fanoutReactionToggled({ messageId, channelId, dmId, reactions }) {
  const roomId = channelId ? channelRoomId(channelId) : dmId ? dmRoomId(dmId) : null;
  if (!roomId) return;
  return safeBroadcastFromEnv(roomId, {
    type: 'reactionToggled',
    data: { roomId, messageId, reactions },
  });
}

module.exports = {
  fanoutMessageCreated,
  fanoutMessageUpdated,
  fanoutMessageDeleted,
  fanoutReactionToggled,
  roomIdForMessageRow,
};
