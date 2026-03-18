const express = require('express');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const { authenticateToken } = require('../middleware/auth');
const { validate, messageSchema } = require('../utils/validation');

const router = express.Router();

// Create a new message (in channel or DM)
router.post('/', authenticateToken, validate(messageSchema), async (req, res) => {
  try {
    const { content, channelId, dmId, replyToId, serverInviteId } = req.body;
    const authorId = req.user.id;

    // Validate that either channelId or dmId is provided
    if (!channelId && !dmId) {
      return res.status(400).json({
        success: false,
        message: 'Either channelId or dmId is required'
      });
    }

    // Check access to channel or DM
    if (channelId) {
      const access = await Channel.hasAccess(channelId, authorId);
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this channel'
        });
      }
    }

    if (dmId) {
      const { pool } = require('../config/database');
      const dmQuery = `
        SELECT * FROM direct_messages
        WHERE id = $1 AND $2 = ANY(participants)
      `;
      const dmResult = await pool.query(dmQuery, [dmId, authorId]);

      if (dmResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a participant in this DM'
    });
  }
}

    // Generate unique message ID
    const messageId = `m${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('\n=== MESSAGE CREATED ===');
    console.log('Message ID:', messageId);
    console.log('Author ID:', authorId);
    console.log('Channel ID:', channelId || 'N/A');
    console.log('DM ID:', dmId || 'N/A');
    console.log('Content:', content);
    console.log('=======================\n');

    const message = await Message.create({
      id: messageId,
      content,
      authorId,
      channelId,
      dmId,
      replyToId,
      serverInviteId
    });

    // Fetch the message with author info
    const createdMessage = await Message.findById(messageId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: createdMessage }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
});

// Get messages for a channel
router.get('/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before || null;

    // Check if user has access to the channel
    const access = await Channel.hasAccess(channelId, userId);
    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this channel'
      });
    }

    const messages = await Message.findByChannelId(channelId, limit, before);

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Get messages for a DM
router.get('/dm/:dmId', authenticateToken, async (req, res) => {
  try {
    const { dmId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before || null;

    const { pool } = require('../config/database');
    const dmQuery = `
      SELECT * FROM direct_messages
      WHERE id = $1 AND $2 = ANY(participants)
    `;
    const dmResult = await pool.query(dmQuery, [dmId, userId]);

    if (dmResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a participant in this DM'
      });
    }

    const messages = await Message.findByDmId(dmId, limit, before);

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DM messages'
    });
  }
});

//Get DM ID's for current user
router.get('/dms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { pool } = require('../config/database');
    const query = `
      SELECT *
      FROM direct_messages
      WHERE $1 = ANY(participants)
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      success: true,
      data: { dms: result.rows }
    });
  } catch (error) {
    console.error('Error fetching DMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DMs'
    });
  }
});

// Create a DM
router.post('/dms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'otherUserId is required'
      });
    }

    if (otherUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot create a DM with yourself'
      });
    }

    const { pool } = require('../config/database');

    // Check other user exists
    const userCheck = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [otherUserId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Other user not found'
      });
    }

    // Check if DM already exists between exactly these 2 users
    const existingDmQuery = `
      SELECT *
      FROM direct_messages
      WHERE participants @> ARRAY[$1, $2]::text[]
        AND array_length(participants, 1) = 2
      LIMIT 1
    `;
    const existingDm = await pool.query(existingDmQuery, [userId, otherUserId]);

    if (existingDm.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'DM already exists',
        data: { dm: existingDm.rows[0] }
      });
    }

    // Create DM
    const dmId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const createDmQuery = `
      INSERT INTO direct_messages (id, participants)
      VALUES ($1, $2)
      RETURNING *
    `;
    const newDm = await pool.query(createDmQuery, [dmId, [userId, otherUserId]]);

    res.status(201).json({
      success: true,
      message: 'DM created successfully',
      data: { dm: newDm.rows[0] }
    });
  } catch (error) {
    console.error('Error creating DM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create DM'
    });
  }
});

// Get single message by ID
router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the message
    const messageData = await Message.hasAccess(messageId, userId);
    if (!messageData || !messageData.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    const message = await Message.findByIdWithReactions(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  }
});

// Update message
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if user has access to the message
    const messageData = await Message.hasAccess(messageId, userId);
    if (!messageData || !messageData.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    // Check if user is the author (only author can edit)
    if (messageData.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the author can edit this message'
      });
    }

    const updatedMessage = await Message.update(messageId, content);

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: { message: updatedMessage }
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update message'
    });
  }
});

// Delete message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the message
    const messageData = await Message.hasAccess(messageId, userId);
    if (!messageData || !messageData.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    // Check if user is the author or has admin/owner role
    const isAuthor = messageData.author_id === userId;
    let canDelete = isAuthor;

    // If not author, check if user has admin/owner role in the server
    if (!isAuthor && messageData.channel_id) {
      const channelAccess = await Channel.hasAccess(messageData.channel_id, userId);
      if (channelAccess && (channelAccess.role === 'owner' || channelAccess.role === 'admin')) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the author or server admin can delete this message'
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

// Add reaction to message
router.post('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    // Check if user has access to the message
    const messageData = await Message.hasAccess(messageId, userId);
    if (!messageData || !messageData.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    const reaction = await Message.addReaction(messageId, emoji, userId);

    res.status(201).json({
      success: true,
      message: 'Reaction added successfully',
      data: { reaction }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    if (error.message === 'User has already reacted with this emoji') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add reaction'
    });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.query;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji query parameter is required'
      });
    }

    const removed = await Message.removeReaction(messageId, emoji, userId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove reaction'
    });
  }
});

// Get message reactions
router.get('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the message
    const messageData = await Message.hasAccess(messageId, userId);
    if (!messageData || !messageData.has_access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    const reactions = await Message.getReactions(messageId);

    res.status(200).json({
      success: true,
      data: { reactions }
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reactions'
    });
  }
});

// Search messages in a channel
router.get('/search/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }

    // Check if user has access to the channel
    const access = await Channel.hasAccess(channelId, userId);
    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this channel'
      });
    }

    const messages = await Message.searchInChannel(channelId, q, limit);

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

// Search messages in a DM
router.get('/search/dm/:dmId', authenticateToken, async (req, res) => {
  try {
    const { dmId } = req.params;
    const userId = req.user.id;
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }

    // Check if user is participant in the DM
    const { pool } = require('../config/database');
    const dmQuery = 'SELECT * FROM direct_messages WHERE id = $1 AND $2 = ANY(participants)';
    const dmResult = await pool.query(dmQuery, [dmId, userId]);

    if (dmResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a participant in this DM'
      });
    }

    const messages = await Message.searchInDm(dmId, q, limit);

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

module.exports = router;

