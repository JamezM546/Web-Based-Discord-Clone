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

// Manual summaries are always generated fresh — caching is intentionally omitted
// because the user explicitly requests a specific time window and expects current results.
// Stale DB cache rows from earlier TTL settings would silently return outdated text.

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

      // Determine time range to summarize
      const lastReadAtResult = await pool.query(
        'SELECT last_read_at FROM channel_read_state WHERE user_id = $1 AND channel_id = $2',
        [userId, channelId]
      );
      const lastReadAt = lastReadAtResult.rows[0] ? lastReadAtResult.rows[0].last_read_at : null;
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

      // Compute participation stats from the fetched messages
      const userMessageCounts = {};
      for (const m of messages) {
        const name = m.username || m.display_name || 'Unknown';
        userMessageCounts[name] = (userMessageCounts[name] || 0) + 1;
      }
      const topUsers = Object.entries(userMessageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([username, count]) => ({ username, count }));

      return res.status(200).json({
        success: true,
        data: {
          summary: groqResult.summary,
          topics: groqResult.topics || [],
          format: groqResult.format,
          messageCount: messages.length,
          uniqueUsers: Object.keys(userMessageCounts).length,
          topUsers,
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
// POST /api/summaries/manual/dms/:dmId
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

      const lastReadResult = await pool.query(
        'SELECT last_read_at FROM direct_message_read_state WHERE user_id = $1 AND dm_id = $2',
        [userId, dmId]
      );
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
            summary: timeWindowMinutes
              ? 'There are no messages in this time range.'
              : 'There are no new messages since your last visit.',
            format,
            messageCount: 0,
            generatedAt: new Date().toISOString()
          }
        });
      }

      const groqResult = await generateChannelSummary({
        channelName: null,
        isDm: true,
        messages,
        options: { maxMessages, format }
      });

      // Compute participation stats from the fetched messages
      const dmUserMessageCounts = {};
      for (const m of messages) {
        const name = m.username || m.display_name || 'Unknown';
        dmUserMessageCounts[name] = (dmUserMessageCounts[name] || 0) + 1;
      }
      const dmTopUsers = Object.entries(dmUserMessageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([username, count]) => ({ username, count }));

      return res.status(200).json({
        success: true,
        data: {
          summary: groqResult.summary,
          topics: groqResult.topics || [],
          format: groqResult.format,
          messageCount: messages.length,
          uniqueUsers: Object.keys(dmUserMessageCounts).length,
          topUsers: dmTopUsers,
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
