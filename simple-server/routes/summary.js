const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { validate, summaryRequestSchema } = require('../utils/validation');
const { generateChannelSummary, generateChannelPreview } = require('../services/groqService');

const router = express.Router();

// Summary API: 10 requests/minute per user
const summaryRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10
});

// Preview API: 60 requests/minute per user
const previewRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60
});

// Manual summaries are always generated fresh — caching intentionally omitted.

const hasDmAccess = async (dmId, userId) => {
  const result = await pool.query(
    'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
    [dmId, userId]
  );
  return result.rows[0] || null;
};

// Build the standard summary response object shared by channel + DM paths.
const buildSummaryResponse = (groqResult, messages, hours) => {
  const userMessageCounts = {};
  for (const m of messages) {
    const name = m.username || m.display_name || 'Unknown';
    userMessageCounts[name] = (userMessageCounts[name] || 0) + 1;
  }
  const topUsers = Object.entries(userMessageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([username, count]) => ({ username, count }));

  const h = hours || 1;
  const timeframe = h < 1
    ? `Last ${Math.round(h * 60)} minutes`
    : `Last ${h} hour${h !== 1 ? 's' : ''}`;

  return {
    overview: groqResult.summary,
    keyTopics: groqResult.topics || [],
    mostActiveUsers: topUsers,
    timeframe,
    stats: {
      totalMessages: messages.length,
      uniqueUsers: Object.keys(userMessageCounts).length
    }
  };
};

// ─── POST /api/summaries/manual ───────────────────────────────────────────────
// Accepts { channelId } XOR { dmId }, plus optional hours / maxMessages / format.
// Returns { data: { summary: { overview, keyTopics, mostActiveUsers, timeframe, stats } } }
router.post(
  '/manual',
  authenticateToken,
  summaryRateLimiter,
  validate(summaryRequestSchema),
  async (req, res) => {
    try {
      const { channelId, dmId, hours, maxMessages = 50, format = 'paragraph' } = req.body;
      const userId = req.user.id;

      // Convert hours → minutes for time-window queries
      const timeWindowMinutes = hours ? Math.round(hours * 60) : null;

      // ── Channel path ──────────────────────────────────────────────────────
      if (channelId) {
        const access = await Channel.hasAccess(channelId, userId);
        if (!access) {
          return res.status(403).json({ success: false, message: 'Access denied: Not a member of this server' });
        }

        const lastReadAtResult = await pool.query(
          'SELECT last_read_at FROM channel_read_state WHERE user_id = $1 AND channel_id = $2',
          [userId, channelId]
        );
        const lastReadAt = lastReadAtResult.rows[0]?.last_read_at || null;

        const since = timeWindowMinutes
          ? new Date(Date.now() - timeWindowMinutes * 60 * 1000)
          : lastReadAt || new Date(Date.now() - 60 * 60 * 1000);

        const messages = await Message.findSinceChannelId(channelId, since, maxMessages);

        if (messages.length === 0) {
          return res.status(200).json({
            success: true,
            data: {
              summary: {
                overview: timeWindowMinutes
                  ? 'There are no messages in this time range.'
                  : 'There are no new messages since your last visit.',
                keyTopics: [],
                mostActiveUsers: [],
                timeframe: hours ? `Last ${hours} hour${hours !== 1 ? 's' : ''}` : 'Recent',
                stats: { totalMessages: 0, uniqueUsers: 0 }
              }
            }
          });
        }

        // When no API key is configured (e.g. CI), return real stats with a placeholder overview
        if (!process.env.GROQ_API_KEY) {
          return res.status(200).json({
            success: true,
            data: { summary: buildSummaryResponse({ summary: 'AI summary unavailable (API key not configured).', topics: [] }, messages, hours) }
          });
        }

        const channel = await Channel.findById(channelId);
        const groqResult = await generateChannelSummary({
          channelName: channel ? channel.name : null,
          messages,
          options: { maxMessages, format }
        });

        return res.status(200).json({
          success: true,
          data: { summary: buildSummaryResponse(groqResult, messages, hours) }
        });
      }

      // ── DM path ───────────────────────────────────────────────────────────
      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied: Not a participant of this direct message' });
      }

      const lastReadResult = await pool.query(
        'SELECT last_read_at FROM direct_message_read_state WHERE user_id = $1 AND dm_id = $2',
        [userId, dmId]
      );
      const lastReadAt = lastReadResult.rows[0]?.last_read_at || null;

      const since = timeWindowMinutes
        ? new Date(Date.now() - timeWindowMinutes * 60 * 1000)
        : lastReadAt || new Date(Date.now() - 60 * 60 * 1000);

      const messages = await Message.findSinceDmId(dmId, since, maxMessages);

      if (messages.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            summary: {
              overview: timeWindowMinutes
                ? 'There are no messages in this time range.'
                : 'There are no new messages since your last visit.',
              keyTopics: [],
              mostActiveUsers: [],
              timeframe: hours ? `Last ${hours} hour${hours !== 1 ? 's' : ''}` : 'Recent',
              stats: { totalMessages: 0, uniqueUsers: 0 }
            }
          }
        });
      }

      // When no API key is configured (e.g. CI), return real stats with a placeholder overview
      if (!process.env.GROQ_API_KEY) {
        return res.status(200).json({
          success: true,
          data: { summary: buildSummaryResponse({ summary: 'AI summary unavailable (API key not configured).', topics: [] }, messages, hours) }
        });
      }

      const groqResult = await generateChannelSummary({
        channelName: null,
        isDm: true,
        messages,
        options: { maxMessages, format }
      });

      return res.status(200).json({
        success: true,
        data: { summary: buildSummaryResponse(groqResult, messages, hours) }
      });

    } catch (error) {
      console.error('Error generating manual summary:', error);
      return res.status(error.message?.includes('Groq API') ? 502 : 500).json({
        success: false,
        message: 'Failed to generate summary',
        error: error.message
      });
    }
  }
);

// ─── GET /api/summaries/preview ───────────────────────────────────────────────
// Accepts ?channelId= OR ?dmId=, optional ?since= timestamp.
// Returns { data: { preview: { summary, unreadCount, participants } } }
router.get(
  '/preview',
  authenticateToken,
  previewRateLimiter,
  async (req, res) => {
    try {
      const { channelId, dmId, since: sinceParam } = req.query;

      if (!channelId && !dmId) {
        return res.status(400).json({ success: false, message: 'Provide either channelId or dmId' });
      }

      const userId = req.user.id;
      const since = sinceParam ? new Date(sinceParam) : null;

      // ── Channel path ──────────────────────────────────────────────────────
      if (channelId) {
        const access = await Channel.hasAccess(channelId, userId);
        if (!access) {
          return res.status(403).json({ success: false, message: 'Access denied: Not a member of this server' });
        }

        const effectiveSince = since || (() => {
          // Fall back to DB read state, then 1 hour ago
          return pool.query(
            'SELECT last_read_at FROM channel_read_state WHERE user_id = $1 AND channel_id = $2',
            [userId, channelId]
          ).then(r => r.rows[0]?.last_read_at || new Date(Date.now() - 60 * 60 * 1000));
        })();

        const resolvedSince = await Promise.resolve(effectiveSince);
        const unreadStats = await Message.getUnreadStats(channelId, resolvedSince);

        if (!unreadStats.unreadCount) {
          return res.status(200).json({
            success: true,
            data: { preview: { summary: '', unreadCount: 0, participants: [] } }
          });
        }

        const messages = await Message.findSinceChannelId(channelId, resolvedSince, Math.min(unreadStats.unreadCount, 50));

        if (!messages || messages.length === 0) {
          return res.status(200).json({
            success: true,
            data: { preview: { summary: '', unreadCount: 0, participants: [] } }
          });
        }

        const participants = [...new Set(messages.map(m => m.username || m.display_name || 'User'))];

        if (!process.env.GROQ_API_KEY) {
          return res.status(200).json({
            success: true,
            data: { preview: { summary: '', unreadCount: unreadStats.unreadCount, participants } }
          });
        }

        const channel = await Channel.findById(channelId);
        const groqResult = await generateChannelPreview({
          channelName: channel ? channel.name : null,
          messages,
          unreadCount: unreadStats.unreadCount
        });

        return res.status(200).json({
          success: true,
          data: {
            preview: {
              summary: groqResult.highlights.join('\n'),
              unreadCount: unreadStats.unreadCount,
              participants
            }
          }
        });
      }

      // ── DM path ───────────────────────────────────────────────────────────
      const access = await hasDmAccess(dmId, userId);
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied: Not a participant of this direct message' });
      }

      const effectiveSince = since || await pool.query(
        'SELECT last_read_at FROM direct_message_read_state WHERE user_id = $1 AND dm_id = $2',
        [userId, dmId]
      ).then(r => r.rows[0]?.last_read_at || new Date(Date.now() - 60 * 60 * 1000));

      const unreadStats = await Message.getDmUnreadStats(dmId, effectiveSince);

      if (!unreadStats.unreadCount) {
        return res.status(200).json({
          success: true,
          data: { preview: { summary: '', unreadCount: 0, participants: [] } }
        });
      }

      const messages = await Message.findSinceDmId(dmId, effectiveSince, Math.min(unreadStats.unreadCount, 50));

      if (!messages || messages.length === 0) {
        return res.status(200).json({
          success: true,
          data: { preview: { summary: '', unreadCount: 0, participants: [] } }
        });
      }

      const participants = [...new Set(messages.map(m => m.username || m.display_name || 'User'))];

      if (!process.env.GROQ_API_KEY) {
        return res.status(200).json({
          success: true,
          data: { preview: { summary: '', unreadCount: unreadStats.unreadCount, participants } }
        });
      }

      const groqResult = await generateChannelPreview({
        channelName: null,
        isDm: true,
        messages,
        unreadCount: unreadStats.unreadCount
      });

      return res.status(200).json({
        success: true,
        data: {
          preview: {
            summary: groqResult.highlights.join('\n'),
            unreadCount: unreadStats.unreadCount,
            participants
          }
        }
      });

    } catch (error) {
      console.error('Error generating preview:', error);
      return res.status(error.message?.includes('Groq API') ? 502 : 500).json({
        success: false,
        message: 'Failed to generate preview',
        error: error.message
      });
    }
  }
);

module.exports = router;
