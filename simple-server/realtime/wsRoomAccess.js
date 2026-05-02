const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const { parseRoomId } = require('./roomIds');

async function assertUserMayJoinRoom(userId, roomId) {
  const parsed = parseRoomId(roomId);
  if (!parsed) {
    const err = new Error('Invalid roomId');
    err.code = 'BAD_ROOM';
    throw err;
  }

  if (parsed.kind === 'channel') {
    const row = await Channel.hasAccess(parsed.id, userId);
    if (!row) {
      const err = new Error('Forbidden: not a member of this channel');
      err.code = 'FORBIDDEN';
      throw err;
    }
    return;
  }

  const dmAccess = await pool.query(
    'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
    [parsed.id, userId]
  );
  if (dmAccess.rowCount === 0) {
    const err = new Error('Forbidden: not a participant in this DM');
    err.code = 'FORBIDDEN';
    throw err;
  }
}

module.exports = { assertUserMayJoinRoom };
