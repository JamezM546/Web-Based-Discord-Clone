const express = require('express');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const { authenticateToken } = require('../middleware/auth');
const { validate, channelSchema } = require('../utils/validation');

const router = express.Router();

// Create a new channel
router.post('/', authenticateToken, validate(channelSchema), async (req, res) => {
  try {
    const { name, serverId } = req.body;
    const userId = req.user.id;
    
    // Check if user has permission to create channels in this server
    const membership = await Server.isMember(serverId, userId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can create channels'
      });
    }
    
    // Get current position for the new channel
    const existingChannels = await Channel.findByServerId(serverId);
    const position = existingChannels.length;
    
    // Generate unique channel ID
    const channelId = `c${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = await Channel.create({
      id: channelId,
      name,
      serverId,
      position
    });
    
    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel }
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create channel'
    });
  }
});

// Get channels for a server
router.get('/server/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    // First verify the user is a member of this server
    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this server'
      });
    }

    // User is a member; return whatever channels exist (possibly empty)
    const channels = await Channel.getAccessibleChannels(serverId, userId);

    res.status(200).json({
      success: true,
      data: { channels }
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channels'
    });
  }
});

// Get channel by ID with messages
router.get('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    
    // Check if user has access to the channel
    const access = await Channel.hasAccess(channelId, userId);
    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this server'
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const channel = await Channel.findByIdWithMessages(channelId, limit);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { channel }
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channel'
    });
  }
});

// Update channel
router.put('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    const { name, position } = req.body;
    
    // Check if user has permission to update the channel
    const access = await Channel.hasAccess(channelId, userId);
    if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can update channels'
      });
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (position !== undefined) updates.position = position;
    
    const updatedChannel = await Channel.update(channelId, updates);
    
    res.status(200).json({
      success: true,
      message: 'Channel updated successfully',
      data: { channel: updatedChannel }
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update channel'
    });
  }
});

// Delete channel
router.delete('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    
    // Check if user has permission to delete the channel
    const access = await Channel.hasAccess(channelId, userId);
    if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can delete channels'
      });
    }
    
    const deleted = await Channel.delete(channelId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete channel'
    });
  }
});

// Reorder channels in a server
router.put('/server/:serverId/reorder', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { channels } = req.body; // Array of { channelId, position }
    const userId = req.user.id;
    
    // Check if user has permission to reorder channels
    const access = await Server.isMember(serverId, userId);
    if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can reorder channels'
      });
    }
    
    await Channel.reorder(serverId, channels);
    
    res.status(200).json({
      success: true,
      message: 'Channels reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering channels:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reorder channels'
    });
  }
});

module.exports = router;
