const express = require('express');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, serverSchema } = require('../utils/validation');

const router = express.Router();

// Search servers by name (must be defined before /:serverId to avoid route conflict)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter `q` is required',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 20;

    const query = `
      SELECT s.*, sm.role,
             (SELECT COUNT(*) FROM server_members sm2 WHERE sm2.server_id = s.id) as member_count
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id AND sm.user_id = $1
      WHERE s.name ILIKE $2
      ORDER BY s.name ASC
      LIMIT $3
    `;

    const result = await pool.query(query, [userId, `%${q}%`, limit]);

    const servers = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      owner_id: row.owner_id,
      member_count: parseInt(row.member_count, 10),
      role: row.role,
      created_at: row.created_at,
    }));

    res.status(200).json({
      success: true,
      data: { servers },
    });
  } catch (error) {
    console.error('Error searching servers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search servers',
    });
  }
});

// Create a new server
router.post('/', authenticateToken, validate(serverSchema), async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.user.id;
    
    // Generate unique server ID
    const serverId = `s${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create server
    const server = await Server.create({
      id: serverId,
      name,
      icon,
      ownerId: userId
    });
    
    // Add owner as member
    await Server.addMember(serverId, userId, 'owner');
    
    // Create default general channel
    const channelId = `c${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await Channel.create({
      id: channelId,
      name: 'general',
      serverId,
      position: 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Server created successfully',
      data: { server }
    });
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create server'
    });
  }
});

// Get servers for current user (includes member user IDs for each server)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const servers = await Server.findByUserId(userId);

    const serverIds = servers.map(s => s.id);
    let memberMap = {};
    if (serverIds.length > 0) {
      const membersResult = await pool.query(
        `SELECT server_id, user_id FROM server_members WHERE server_id = ANY($1)`,
        [serverIds]
      );
      for (const row of membersResult.rows) {
        if (!memberMap[row.server_id]) memberMap[row.server_id] = [];
        memberMap[row.server_id].push(row.user_id);
      }
    }

    const enriched = servers.map(s => ({
      ...s,
      members: memberMap[s.id] || [],
    }));

    res.status(200).json({
      success: true,
      data: { servers: enriched }
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers'
    });
  }
});

// Get server by ID with members and channels
router.get('/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    
    // Check if user is member of the server
    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this server'
      });
    }
    
    // Get server with members and channels
    const [serverWithMembers, serverWithChannels] = await Promise.all([
      Server.findByIdWithMembers(serverId),
      Server.findByIdWithChannels(serverId)
    ]);
    
    if (!serverWithMembers || !serverWithChannels) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    // Combine the data
    const server = {
      ...serverWithMembers,
      channels: serverWithChannels.channels
    };
    
    res.status(200).json({
      success: true,
      data: { server }
    });
  } catch (error) {
    console.error('Error fetching server:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch server'
    });
  }
});

// Update server settings
router.put('/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    const { name, icon } = req.body;
    
    // Check if user is owner or admin
    const membership = await Server.isMember(serverId, userId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can update server'
      });
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    
    const updatedServer = await Server.update(serverId, updates);
    
    res.status(200).json({
      success: true,
      message: 'Server updated successfully',
      data: { server: updatedServer }
    });
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update server'
    });
  }
});

// Delete server
router.delete('/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    
    // Check if user is owner
    const membership = await Server.isMember(serverId, userId);
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner can delete server'
      });
    }
    
    const deleted = await Server.delete(serverId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Server deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete server'
    });
  }
});

// Add member to server
router.post('/:serverId/members', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;
    
    // Check if current user has permission to add members
    const membership = await Server.isMember(serverId, currentUserId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only owner or admin can add members'
      });
    }
    
    const member = await Server.addMember(serverId, userId);
    
    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { member }
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add member'
    });
  }
});

// Remove member from server
router.delete('/:serverId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { serverId, userId } = req.params;
    const currentUserId = req.user.id;
    
    // Check permissions (owner can remove anyone, admins can remove non-owners/admins)
    const currentMembership = await Server.isMember(serverId, currentUserId);
    const targetMembership = await Server.isMember(serverId, userId);
    
    if (!currentMembership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a member of this server'
      });
    }
    
    if (currentMembership.role !== 'owner' && 
        (currentMembership.role !== 'admin' || (targetMembership && (targetMembership.role === 'owner' || targetMembership.role === 'admin')))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }
    
    const removed = await Server.removeMember(serverId, userId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

// Leave a server
router.post('/:serverId/leave', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member
    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this server'
      });
    }
    
    // Prevent owner from leaving (server would be ownerless)
    if (membership.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner cannot leave the server. Delete the server instead.'
      });
    }
    
    const removed = await Server.removeMember(serverId, userId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Failed to leave server'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'You have left the server'
    });
  } catch (error) {
    console.error('Error leaving server:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave server'
    });
  }
});

module.exports = router;
