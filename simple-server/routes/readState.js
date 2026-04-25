const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Check if user is a participant in a DM
const hasDmAccess = async (dmId, userId) => {
  const result = await pool.query(
    'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
    [dmId, userId]
  );
  return !!result.rows[0];
};

/**
 * PUT /api/read-state
 * Body: { channelId } OR { dmId }
 *
 * Upserts last_read_at = NOW() for the authenticated user in either
 * channel_read_state or direct_message_read_state.
 * This syncs the frontend's local read position to the DB so the backend
 * preview/summary routes use an accurate "since" when no ?since is provided.
 */
router.put('/', authenticateToken, async (req, res) => {
  const { channelId, dmId } = req.body;
  const userId = req.user.id;

  if (!channelId && !dmId) {
    return res.status(400).json({
      success: false,
      message: 'Provide either channelId or dmId'
    });
  }

  try {
    if (channelId) {
      // Verify the user has access to this channel before writing read state
      const access = await Channel.hasAccess(channelId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this channel'
        });
      }

      const channelRowId = `crs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        `INSERT INTO channel_read_state (id, user_id, channel_id, last_read_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, channel_id)
         DO UPDATE SET last_read_at = NOW(), updated_at = NOW()`,
        [channelRowId, userId, channelId]
      );
    } else {
      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a participant of this DM'
        });
      }

      const dmRowId = `drs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        `INSERT INTO direct_message_read_state (id, user_id, dm_id, last_read_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, dm_id)
         DO UPDATE SET last_read_at = NOW(), updated_at = NOW()`,
        [dmRowId, userId, dmId]
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating read state:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update read state',
      error: error.message
    });
  }
});

module.exports = router;
