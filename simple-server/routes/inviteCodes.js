const express = require('express');
const InviteCode = require('../models/InviteCode');
const Server = require('../models/Server');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.query;

    if (!serverId) {
      return res.status(400).json({ success: false, message: 'serverId is required' });
    }

    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this server' });
    }

    const invites = await InviteCode.findByServer(serverId);
    res.status(200).json({ success: true, data: { invites } });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invite codes' });
  }
});

router.post('/:serverId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId } = req.params;
    const { expiresAt, maxUses } = req.body;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this server' });
    }

    const invite = await InviteCode.create({
      serverId,
      createdBy: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses: maxUses || 0
    });

    res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite.id,
          code: invite.code,
          serverId: invite.server_id,
          expiresAt: invite.expires_at,
          maxUses: invite.max_uses,
          usesCount: invite.uses_count,
          createdAt: invite.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating invite code:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create invite code' });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const validation = await InviteCode.isValid(code);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        data: validation.invite ? {
          serverName: validation.invite.server_name,
          serverIcon: validation.invite.server_icon,
          expiresAt: validation.invite.expires_at,
          usesCount: validation.invite.uses_count,
          maxUses: validation.invite.max_uses
        } : null
      });
    }

    const invite = validation.invite;
    res.status(200).json({
      success: true,
      data: {
        server: {
          id: invite.server_id,
          name: invite.server_name,
          icon: invite.server_icon
        },
        invite: {
          code: invite.code,
          expiresAt: invite.expires_at,
          usesCount: invite.uses_count,
          maxUses: invite.max_uses,
          creator: {
            username: invite.creator_username,
            displayName: invite.creator_display_name
          }
        }
      }
    });
  } catch (error) {
    console.error('Error resolving invite code:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve invite code' });
  }
});

router.post('/:code/join', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.params;

    const validation = await InviteCode.isValid(code);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason
      });
    }

    const invite = validation.invite;
    const serverId = invite.server_id;
    const server = await Server.findByIdWithChannels(serverId);

    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const alreadyMember = await Server.isMember(serverId, userId);
    if (alreadyMember) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this server',
        data: { server, alreadyMember: true }
      });
    }

    await Server.addMember(serverId, userId, 'member');
    await InviteCode.use(code);

    res.status(200).json({
      success: true,
      message: 'Successfully joined the server',
      data: { server, alreadyMember: false }
    });
  } catch (error) {
    console.error('Error joining server via invite:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to join server' });
  }
});

router.delete('/:serverId/:inviteId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serverId, inviteId } = req.params;

    const membership = await Server.isMember(serverId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this server' });
    }

    const deleted = await InviteCode.deleteByServerAndId(serverId, inviteId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invite code not found' });
    }

    res.status(200).json({ success: true, message: 'Invite code deleted successfully' });
  } catch (error) {
    console.error('Error deleting invite code:', error);
    res.status(500).json({ success: false, message: 'Failed to delete invite code' });
  }
});

module.exports = router;
