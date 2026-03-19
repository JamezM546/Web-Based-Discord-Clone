const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { generateChannelPreview } = require('../services/groqService');

const router = express.Router();

// Preview API: 60 requests/minute per user
const previewRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60
});

const getLastReadAt = async (userId, channelId) => {
  const query = `
    SELECT last_read_at 
    FROM channel_read_state
    WHERE user_id = $1 AND channel_id = $2
  `;

  const result = await pool.query(query, [userId, channelId]);
  return result.rows[0] ? result.rows[0].last_read_at : null;
};

const getCachedPreview = async (userId, channelId) => {
  const query = `
    SELECT *
    FROM channel_previews
    WHERE user_id = $1
      AND channel_id = $2
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY generated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, channelId]);
  return result.rows[0] || null;
};

const storePreview = async (userId, channelId, preview, ttlMs) => {
  const id = `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + ttlMs);

  const query = `
    INSERT INTO channel_previews (
      id, user_id, channel_id, unread_count, time_range, highlights, last_message_time, generated_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
  `;

  await pool.query(query, [
    id,
    userId,
    channelId,
    preview.unreadCount,
    preview.timeRange,
    JSON.stringify(preview.highlights),
    preview.lastMessageTime,
    expiresAt
  ]);
};

const getCachedDmPreview = async (userId, dmId) => {
  const query = `
    SELECT *
    FROM direct_message_previews
    WHERE user_id = $1
      AND dm_id = $2
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY generated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, dmId]);
  return result.rows[0] || null;
};

const storeDmPreview = async (userId, dmId, preview, ttlMs) => {
  const id = `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + ttlMs);

  const query = `
    INSERT INTO direct_message_previews (
      id, user_id, dm_id, unread_count, time_range, highlights, last_message_time, generated_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
  `;

  await pool.query(query, [
    id,
    userId,
    dmId,
    preview.unreadCount,
    preview.timeRange,
    JSON.stringify(preview.highlights),
    preview.lastMessageTime,
    expiresAt
  ]);
};

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

// GET /api/v1/previews/channels/:channelId
router.get(
  '/channels/:channelId',
  authenticateToken,
  previewRateLimiter,
  async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user.id;
      const maxHighlights = Math.min(
        parseInt(req.query.maxHighlights, 10) || 5,
        5
      );

      // Check channel access
      const access = await Channel.hasAccess(channelId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this server'
        });
      }

      // Check cache first (5 minute TTL)
      try {
        const cached = await getCachedPreview(userId, channelId);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: {
              source: 'cache',
              unreadCount: cached.unread_count,
              timeRange: cached.time_range,
              highlights: cached.highlights,
              lastMessageTime: cached.last_message_time
            }
          });
        }
      } catch (cacheError) {
        console.error('Error reading preview cache:', cacheError);
      }

      const lastReadAt = await getLastReadAt(userId, channelId);
      const since = lastReadAt || new Date(Date.now() - 60 * 60 * 1000);

      const unreadStats = await Message.getUnreadStats(channelId, since);

      if (!unreadStats.unreadCount || unreadStats.unreadCount === 0) {
        return res.status(200).json({
          success: true,
          data: {
            source: 'live',
            unreadCount: 0,
            timeRange: null,
            highlights: [],
            lastMessageTime: null
          }
        });
      }

      // Fetch a small slice of unread messages for preview generation
      const previewMessagesLimit = Math.min(unreadStats.unreadCount, 50);
      const messages = await Message.findSinceChannelId(
        channelId,
        since,
        previewMessagesLimit
      );

      const channel = await Channel.findById(channelId);
      const channelName = channel ? channel.name : null;

      const groqResult = await generateChannelPreview({
        channelName,
        messages,
        unreadCount: unreadStats.unreadCount,
        maxHighlights
      });

      const timeRange = unreadStats.firstUnreadAt && unreadStats.lastUnreadAt
        ? `${unreadStats.firstUnreadAt.toISOString()} - ${unreadStats.lastUnreadAt.toISOString()}`
        : null;

      const preview = {
        unreadCount: unreadStats.unreadCount,
        timeRange,
        highlights: groqResult.highlights,
        lastMessageTime: unreadStats.lastUnreadAt
          ? unreadStats.lastUnreadAt.toISOString()
          : null
      };

      try {
        // Cache for 5 minutes as per architecture
        await storePreview(userId, channelId, preview, 5 * 60 * 1000);
      } catch (cacheStoreError) {
        console.error('Error storing preview cache:', cacheStoreError);
      }

      return res.status(200).json({
        success: true,
        data: {
          source: 'live',
          ...preview
        }
      });
    } catch (error) {
      console.error('Error generating channel preview:', error);

      const status = error.message && error.message.includes('Groq API')
        ? 502
        : 500;

      return res.status(status).json({
        success: false,
        message: 'Failed to generate preview',
        error: error.message
      });
    }
  }
);

// GET /api/v1/previews/dms/:dmId
router.get(
  '/dms/:dmId',
  authenticateToken,
  previewRateLimiter,
  async (req, res) => {
    try {
      const { dmId } = req.params;
      const userId = req.user.id;

      const maxHighlights = Math.min(
        parseInt(req.query.maxHighlights, 10) || 5,
        5
      );

      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a participant of this direct message'
        });
      }

      // Check cache first (5 minute TTL via expires_at)
      try {
        const cached = await getCachedDmPreview(userId, dmId);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: {
              source: 'cache',
              unreadCount: cached.unread_count,
              timeRange: cached.time_range,
              highlights: cached.highlights,
              lastMessageTime: cached.last_message_time
            }
          });
        }
      } catch (cacheError) {
        console.error('Error reading DM preview cache:', cacheError);
      }

      const lastReadAtQuery = `
        SELECT last_read_at
        FROM direct_message_read_state
        WHERE user_id = $1 AND dm_id = $2
      `;
      const lastReadAtResult = await pool.query(lastReadAtQuery, [userId, dmId]);
      const lastReadAt = lastReadAtResult.rows[0] ? lastReadAtResult.rows[0].last_read_at : null;
      const since = lastReadAt || new Date(Date.now() - 60 * 60 * 1000);

      const unreadStats = await Message.getDmUnreadStats(dmId, since);

      if (!unreadStats.unreadCount || unreadStats.unreadCount === 0) {
        return res.status(200).json({
          success: true,
          data: {
            source: 'live',
            unreadCount: 0,
            timeRange: null,
            highlights: [],
            lastMessageTime: null
          }
        });
      }

      // Fetch a small slice of unread messages for preview generation
      const previewMessagesLimit = Math.min(unreadStats.unreadCount, 50);
      const messages = await Message.findSinceDmId(dmId, since, previewMessagesLimit);

      const groqResult = await generateChannelPreview({
        channelName: null,
        messages,
        unreadCount: unreadStats.unreadCount,
        maxHighlights
      });

      const timeRange = unreadStats.firstUnreadAt && unreadStats.lastUnreadAt
        ? `${unreadStats.firstUnreadAt.toISOString()} - ${unreadStats.lastUnreadAt.toISOString()}`
        : null;

      const preview = {
        unreadCount: unreadStats.unreadCount,
        timeRange,
        highlights: groqResult.highlights,
        lastMessageTime: unreadStats.lastUnreadAt ? unreadStats.lastUnreadAt.toISOString() : null
      };

      try {
        await storeDmPreview(userId, dmId, preview, 5 * 60 * 1000);
      } catch (cacheStoreError) {
        console.error('Error storing DM preview cache:', cacheStoreError);
      }

      return res.status(200).json({
        success: true,
        data: {
          source: 'live',
          ...preview
        }
      });
    } catch (error) {
      console.error('Error generating DM preview:', error);
      const status = error.message && error.message.includes('Groq API')
        ? 502
        : 500;

      return res.status(status).json({
        success: false,
        message: 'Failed to generate DM preview',
        error: error.message
      });
    }
  }
);

module.exports = router;

