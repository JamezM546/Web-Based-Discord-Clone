const express = require('express');
const { pool } = require('../config/database');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const parseOptionalTimestamp = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

// Attach reactions to a list of message rows.
// The frontend expects `reactions: [{ emoji, users: string[] }]`.
const attachReactionsToMessages = async (messages) => {
  if (!messages || messages.length === 0) return messages;

  const ids = messages.map((m) => m.id);
  if (ids.length === 0) return messages;

  const { rows } = await pool.query(
    `
      SELECT
        mr.message_id,
        mr.emoji,
        mr.user_id,
        u.username,
        u.display_name,
        u.avatar
      FROM message_reactions mr
      JOIN users u ON u.id = mr.user_id
      WHERE mr.message_id = ANY($1)
    `,
    [ids]
  );

  const reactionBuckets = {}; // messageId -> emoji -> Set(userId)
  for (const r of rows) {
    if (!reactionBuckets[r.message_id]) reactionBuckets[r.message_id] = {};
    if (!reactionBuckets[r.message_id][r.emoji]) reactionBuckets[r.message_id][r.emoji] = new Set();
    reactionBuckets[r.message_id][r.emoji].add(r.user_id);
  }

  const reactionsByMessageId = {};
  for (const [messageId, emojiMap] of Object.entries(reactionBuckets)) {
    reactionsByMessageId[messageId] = Object.entries(emojiMap).map(([emoji, userSet]) => ({
      emoji,
      users: Array.from(userSet),
    }));
  }

  return messages.map((m) => ({
    ...m,
    reactions: reactionsByMessageId[m.id] || [],
  }));
};

// Get messages for a channel
router.get('/channels/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    const access = await Channel.hasAccess(channelId, userId);
    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this channel'
      });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const before = parseOptionalTimestamp(req.query.before);

    const messages = await Message.findByChannelId(channelId, limit, before);
    const messagesWithReactions = await attachReactionsToMessages(messages);

    res.status(200).json({
      success: true,
      data: { messages: messagesWithReactions }
    });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channel messages'
    });
  }
});

// Get messages for a direct message (DM)
router.get('/dm/:dmId', authenticateToken, async (req, res) => {
  try {
    const { dmId } = req.params;
    const userId = req.user.id;

    const dmAccess = await pool.query(
      'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
      [dmId, userId]
    );

    if (dmAccess.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this DM'
      });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const before = parseOptionalTimestamp(req.query.before);

    const messages = await Message.findByDmId(dmId, limit, before);
    const messagesWithReactions = await attachReactionsToMessages(messages);

    res.status(200).json({
      success: true,
      data: { messages: messagesWithReactions }
    });
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DM messages'
    });
  }
});

// Create a new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, channelId, dmId, replyToId, serverInviteId } = req.body;

    if (!isNonEmptyString(content)) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const hasChannel = !!channelId;
    const hasDm = !!dmId;
    if ((hasChannel && hasDm) || (!hasChannel && !hasDm)) {
      return res.status(400).json({
        success: false,
        message: 'Provide exactly one of `channelId` or `dmId`'
      });
    }

    // Authorization check: user must be able to access the destination
    if (hasChannel) {
      const access = await Channel.hasAccess(channelId, userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No permission to send in this channel'
        });
      }
    }

    if (hasDm) {
      const dmAccess = await pool.query(
        'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
        [dmId, userId]
      );
      if (dmAccess.rowCount === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No permission to send in this DM'
        });
      }
    }

    const id = `m${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = await Message.create({
      id,
      content: content.trim(),
      authorId: userId,
      channelId: hasChannel ? channelId : null,
      dmId: hasDm ? dmId : null,
      replyToId: replyToId || null,
      serverInviteId: serverInviteId || null
    });

    // Re-fetch with author display info
    const messageWithAuthor = await Message.findById(message.id);

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: { message: messageWithAuthor }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create message'
    });
  }
});

// Edit a message
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!isNonEmptyString(content)) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const accessRow = await Message.hasAccess(messageId, userId);
    if (!accessRow) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    if (!accessRow.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to edit this message'
      });
    }

    const updated = await Message.update(messageId, content.trim());
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const messageWithAuthor = await Message.findById(messageId);

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: { message: messageWithAuthor }
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to edit message'
    });
  }
});

// Delete a message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const accessRow = await Message.hasAccess(messageId, userId);
    if (!accessRow) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    if (!accessRow.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to delete this message'
      });
    }

    const deleted = await Message.delete(messageId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Toggle a reaction on a message
router.post('/:messageId/reactions/toggle', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!isNonEmptyString(emoji) || emoji.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'A valid `emoji` is required'
      });
    }

    const accessRow = await Message.hasAccess(messageId, userId);
    if (!accessRow) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    if (!accessRow.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to react to this message'
      });
    }

    const emojiNormalized = emoji.trim();

    let added = false;
    try {
      await Message.addReaction(messageId, emojiNormalized, userId);
      added = true;
    } catch (error) {
      // The model throws a friendly error message when the user already reacted.
      if (String(error.message || '').toLowerCase().includes('already reacted')) {
        await Message.removeReaction(messageId, emojiNormalized, userId);
        added = false;
      } else {
        throw error;
      }
    }

    const reactionsWithUsers = await Message.getReactions(messageId);
    const reactions = reactionsWithUsers.map((r) => ({
      emoji: r.emoji,
      users: (r.users || []).map((u) => u.id) // frontend expects `users: string[]`
    }));

    res.status(200).json({
      success: true,
      message: 'Reaction updated',
      data: { messageId, reactions, added }
    });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to toggle reaction'
    });
  }
});

// Get reactions for a message
router.get('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const accessRow = await Message.hasAccess(messageId, userId);
    if (!accessRow) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    if (!accessRow.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this message'
      });
    }

    const reactionsWithUsers = await Message.getReactions(messageId);
    const reactions = reactionsWithUsers.map((r) => ({
      emoji: r.emoji,
      users: (r.users || []).map((u) => u.id),
    }));

    res.status(200).json({
      success: true,
      data: { messageId, reactions },
    });
  } catch (error) {
    console.error('Error getting message reactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get message reactions',
    });
  }
});

// Search messages in a channel
router.get('/search/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter `q` is required',
      });
    }

    const access = await Channel.hasAccess(channelId, userId);
    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this channel',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const messages = await Message.searchInChannel(channelId, q, limit);
    const messagesWithReactions = await attachReactionsToMessages(messages);

    res.status(200).json({
      success: true,
      data: { messages: messagesWithReactions },
    });
  } catch (error) {
    console.error('Error searching channel messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search channel messages',
    });
  }
});

// Search messages in a DM
router.get('/search/dm/:dmId', authenticateToken, async (req, res) => {
  try {
    const { dmId } = req.params;
    const userId = req.user.id;

    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter `q` is required',
      });
    }

    const dmAccess = await pool.query(
      'SELECT 1 FROM direct_messages WHERE id = $1 AND $2 = ANY(participants) LIMIT 1',
      [dmId, userId]
    );
    if (dmAccess.rowCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this DM',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const messages = await Message.searchInDm(dmId, q, limit);
    const messagesWithReactions = await attachReactionsToMessages(messages);

    res.status(200).json({
      success: true,
      data: { messages: messagesWithReactions },
    });
  } catch (error) {
    console.error('Error searching DM messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search DM messages',
    });
  }
});

// Get a single message by ID
router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const accessRow = await Message.hasAccess(messageId, userId);
    if (!accessRow) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    if (!accessRow.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No permission to view this message',
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Include reactions so the frontend/docs can display them if needed.
    const reactionsWithUsers = await Message.getReactions(messageId);
    const reactions = reactionsWithUsers.map((r) => ({
      emoji: r.emoji,
      users: (r.users || []).map((u) => u.id),
    }));

    res.status(200).json({
      success: true,
      data: { message: { ...message, reactions } },
    });
  } catch (error) {
    console.error('Error fetching single message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch message',
    });
  }
});

module.exports = router;

