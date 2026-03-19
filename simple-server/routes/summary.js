const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { validate, summaryRequestSchema, dmSummaryRequestSchema } = require('../utils/validation');
const { generateChannelSummary } = require('../services/groqService');

const router = express.Router();

// Summary API: 10 requests/minute per user
const summaryRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10
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

const getCachedSummary = async (userId, channelId, optionsKey) => {
  const query = `
    SELECT *
    FROM channel_summaries
    WHERE user_id = $1
      AND channel_id = $2
      AND options_json = $3
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY generated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, channelId, optionsKey]);
  return result.rows[0] || null;
};

const storeSummary = async (userId, channelId, format, optionsKey, summaryText, messageCount) => {
  const id = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const query = `
    INSERT INTO channel_summaries (
      id, user_id, channel_id, format, options_json, summary_text, message_count, generated_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
  `;

  await pool.query(query, [
    id,
    userId,
    channelId,
    format,
    optionsKey,
    summaryText,
    messageCount,
    expiresAt
  ]);
};

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

const getCachedDmSummary = async (userId, dmId, optionsKey) => {
  const query = `
    SELECT *
    FROM direct_message_summaries
    WHERE user_id = $1
      AND dm_id = $2
      AND options_json = $3
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY generated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId, dmId, optionsKey]);
  return result.rows[0] || null;
};

const storeDmSummary = async (userId, dmId, format, optionsKey, summaryText, messageCount) => {
  const id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const query = `
    INSERT INTO direct_message_summaries (
      id, user_id, dm_id, format, options_json, summary_text, message_count, generated_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
  `;

  await pool.query(query, [
    id,
    userId,
    dmId,
    format,
    optionsKey,
    summaryText,
    messageCount,
    expiresAt
  ]);
};

// Manual summary generation
router.post(
  '/manual',
  authenticateToken,
  summaryRateLimiter,
  validate(summaryRequestSchema),
  async (req, res) => {
    try {
      const { channelId, options = {} } = req.body;
      const userId = req.user.id;

      // Check channel access
      const access = await Channel.hasAccess(channelId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this server'
        });
      }

      const format = options.format === 'bullets' ? 'bullets' : 'paragraph';
      const maxMessages = options.maxMessages || 50;
      const timeWindowMinutes =
        typeof options.timeWindow === 'number' ? options.timeWindow : null;

      const optionsKey = JSON.stringify({
        maxMessages,
        format,
        timeWindowMinutes
      });

      // Check cache first
      try {
        const cached = await getCachedSummary(userId, channelId, optionsKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: {
              source: 'cache',
              summary: cached.summary_text,
              format: cached.format,
              messageCount: cached.message_count,
              generatedAt: cached.generated_at
            }
          });
        }
      } catch (cacheError) {
        console.error('Error reading summary cache:', cacheError);
      }

      // Determine time range to summarize
      const lastReadAt = await getLastReadAt(userId, channelId);
      let since;
      if (timeWindowMinutes) {
        since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      } else {
        since = lastReadAt;
        if (!since) {
          since = new Date(Date.now() - 60 * 60 * 1000); // default: last 60 minutes
        }
      }

      const messages = await Message.findSinceChannelId(channelId, since, maxMessages);

      if (messages.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            source: 'live',
            summary: timeWindowMinutes
              ? 'There are no messages in this time range.'
              : 'There are no new messages since your last visit.',
            format,
            messageCount: 0,
            generatedAt: new Date().toISOString()
          }
        });
      }

      const channel = await Channel.findById(channelId);
      const channelName = channel ? channel.name : null;

      const groqResult = await generateChannelSummary({
        channelName,
        messages,
        options: { maxMessages, format }
      });

      try {
        await storeSummary(
          userId,
          channelId,
          groqResult.format,
          optionsKey,
          groqResult.summary,
          messages.length
        );
      } catch (cacheStoreError) {
        console.error('Error storing summary cache:', cacheStoreError);
      }

      return res.status(200).json({
        success: true,
        data: {
          source: 'live',
          summary: groqResult.summary,
          format: groqResult.format,
          messageCount: messages.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating manual summary:', error);
      const status = error.message && error.message.includes('Groq API')
        ? 502
        : 500;

      return res.status(status).json({
        success: false,
        message: 'Failed to generate summary',
        error: error.message
      });
    }
  }
);

// Manual summary generation for direct messages.
// POST /api/v1/summaries/manual/dms/:dmId
router.post(
  '/manual/dms/:dmId',
  authenticateToken,
  summaryRateLimiter,
  validate(dmSummaryRequestSchema),
  async (req, res) => {
    try {
      const { dmId } = req.params;
      const userId = req.user.id;
      const options = req.body?.options || {};

      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a participant of this direct message'
        });
      }

      const format = options.format === 'bullets' ? 'bullets' : 'paragraph';
      const maxMessages = options.maxMessages || 50;
      const timeWindowMinutes =
        typeof options.timeWindow === 'number' ? options.timeWindow : null;

      const optionsKey = JSON.stringify({
        maxMessages,
        format,
        timeWindowMinutes
      });

      // Check cache first
      try {
        const cached = await getCachedDmSummary(userId, dmId, optionsKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            data: {
              source: 'cache',
              summary: cached.summary_text,
              format: cached.format,
              messageCount: cached.message_count,
              generatedAt: cached.generated_at
            }
          });
        }
      } catch (cacheError) {
        console.error('Error reading DM summary cache:', cacheError);
      }

      const lastReadQuery = `
        SELECT last_read_at
        FROM direct_message_read_state
        WHERE user_id = $1 AND dm_id = $2
      `;
      const lastReadResult = await pool.query(lastReadQuery, [userId, dmId]);
      const lastReadAt = lastReadResult.rows[0] ? lastReadResult.rows[0].last_read_at : null;

      let since;
      if (timeWindowMinutes) {
        since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      } else {
        since = lastReadAt;
        if (!since) {
          since = new Date(Date.now() - 60 * 60 * 1000); // default: last 60 minutes
        }
      }

      const messages = await Message.findSinceDmId(dmId, since, maxMessages);

      if (messages.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            source: 'live',
            summary: timeWindowMinutes
              ? 'There are no messages in this time range.'
              : 'There are no new messages since your last visit.',
            format,
            messageCount: 0,
            generatedAt: new Date().toISOString()
          }
        });
      }

      // Use the same summarizer; DM prompt still works with "channelName" as null.
      const groqResult = await generateChannelSummary({
        channelName: null,
        messages,
        options: { maxMessages, format }
      });

      try {
        await storeDmSummary(
          userId,
          dmId,
          groqResult.format,
          optionsKey,
          groqResult.summary,
          messages.length
        );
      } catch (cacheStoreError) {
        console.error('Error storing DM summary cache:', cacheStoreError);
      }

      return res.status(200).json({
        success: true,
        data: {
          source: 'live',
          summary: groqResult.summary,
          format: groqResult.format,
          messageCount: messages.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating DM manual summary:', error);
      const status = error.message && error.message.includes('Groq API')
        ? 502
        : 500;

      return res.status(status).json({
        success: false,
        message: 'Failed to generate summary',
        error: error.message
      });
    }
  }
);

module.exports = router;
