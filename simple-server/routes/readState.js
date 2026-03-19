const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Limit writes to avoid accidental rapid-fire updates.
const readStateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120
});

// Upsert "last read" timestamp for a channel.
// POST /api/v1/read-state/channels/:channelId
router.post(
  '/channels/:channelId',
  authenticateToken,
  readStateRateLimiter,
  async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user.id;

      // Check channel access first.
      const access = await Channel.hasAccess(channelId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this server'
        });
      }

      const lastReadAt = new Date().toISOString();
      const id = `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO channel_read_state (id, user_id, channel_id, last_read_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, channel_id)
        DO UPDATE SET
          last_read_at = GREATEST(channel_read_state.last_read_at, EXCLUDED.last_read_at),
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [id, userId, channelId, lastReadAt]);

      // Invalidate any cached previews/summaries for this user/channel.
      // Cache entries are not scoped by `last_read_at`, so keeping them would risk stale results.
      await pool.query(
        'DELETE FROM channel_previews WHERE user_id = $1 AND channel_id = $2',
        [userId, channelId]
      );
      await pool.query(
        'DELETE FROM channel_summaries WHERE user_id = $1 AND channel_id = $2',
        [userId, channelId]
      );

      return res.status(200).json({
        success: true,
        data: { lastReadAt }
      });
    } catch (error) {
      console.error('Error updating read state:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update read state',
        error: error.message
      });
    }
  }
);

// Fetch all channel last-read timestamps for the current user.
// GET /api/v1/read-state/channels
router.get(
  '/channels',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT channel_id, last_read_at
        FROM channel_read_state
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);

      return res.status(200).json({
        success: true,
        data: {
          channelReadStates: result.rows.map((row) => ({
            channelId: row.channel_id,
            lastReadAt: row.last_read_at
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching read states:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch read state',
        error: error.message
      });
    }
  }
);

// Check if current user is a participant in a DM.
const hasDmAccess = async (dmId, userId) => {
  const query = `
    SELECT 1
    FROM direct_messages
    WHERE id = $1
      AND $2 = ANY(participants)
    LIMIT 1
  `;
  const result = await pool.query(query, [dmId, userId]);
  return result.rows[0] || null;
};

// Upsert "last read" timestamp for a direct message.
// POST /api/v1/read-state/dms/:dmId
router.post(
  '/dms/:dmId',
  authenticateToken,
  readStateRateLimiter,
  async (req, res) => {
    try {
      const { dmId } = req.params;
      const userId = req.user.id;

      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a participant of this direct message'
        });
      }

      const lastReadAt = new Date().toISOString();
      const id = `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO direct_message_read_state (id, user_id, dm_id, last_read_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, dm_id)
        DO UPDATE SET
          last_read_at = GREATEST(direct_message_read_state.last_read_at, EXCLUDED.last_read_at),
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [id, userId, dmId, lastReadAt]);

      // Invalidate cached DM previews for this user/DM to avoid staleness.
      await pool.query(
        'DELETE FROM direct_message_previews WHERE user_id = $1 AND dm_id = $2',
        [userId, dmId]
      );

      // Manual summaries can also become stale after marking read.
      await pool.query(
        'DELETE FROM direct_message_summaries WHERE user_id = $1 AND dm_id = $2',
        [userId, dmId]
      );

      return res.status(200).json({
        success: true,
        data: { lastReadAt }
      });
    } catch (error) {
      console.error('Error updating DM read state:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update DM read state',
        error: error.message
      });
    }
  }
);

// Fetch all DM last-read timestamps for the current user.
// GET /api/v1/read-state/dms
router.get(
  '/dms',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT dm_id, last_read_at
        FROM direct_message_read_state
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);

      return res.status(200).json({
        success: true,
        data: {
          dmReadStates: result.rows.map((row) => ({
            dmId: row.dm_id,
            lastReadAt: row.last_read_at
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching DM read states:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch DM read state',
        error: error.message
      });
    }
  }
);

module.exports = router;

