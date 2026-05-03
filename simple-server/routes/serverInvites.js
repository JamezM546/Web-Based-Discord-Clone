const express = require('express');
const { pool } = require('../config/database');
const Server = require('../models/Server');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const { getRealtimeRuntime } = require('../websocket/gateway');

const router = express.Router();

const publishRealtime = async (callback) => {
  const runtime = getRealtimeRuntime();
  if (!runtime) return;

  try {
    await callback(runtime);
  } catch (error) {
    console.error('Realtime publish failed:', error);
  }
};

// GET /api/invites/pending  — invites sent TO the current user
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT si.*,
              s.name AS server_name, s.icon AS server_icon,
              fu.username AS from_username, fu.display_name AS from_display_name, fu.avatar AS from_avatar
       FROM server_invites si
       JOIN servers s  ON si.server_id    = s.id
       JOIN users   fu ON si.from_user_id = fu.id
       WHERE si.to_user_id = $1 AND si.status = 'pending'
       ORDER BY si.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, data: { invites: result.rows } });
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invites' });
  }
});

// POST /api/invites  — create a server invite (sends DM automatically)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { serverId, toUserId } = req.body;

    if (!serverId || !toUserId) {
      return res.status(400).json({ success: false, message: '`serverId` and `toUserId` are required' });
    }
    if (toUserId === fromUserId) {
      return res.status(400).json({ success: false, message: 'Cannot invite yourself' });
    }

    const membership = await Server.isMember(serverId, fromUserId);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this server' });
    }

    const alreadyMember = await Server.isMember(serverId, toUserId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this server' });
    }

    const existing = await pool.query(
      `SELECT id FROM server_invites
       WHERE server_id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [serverId, toUserId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Invite already pending for this user' });
    }

    const inviteId = `si_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Find or create DM between the two users
    let dmRow = await pool.query(
      `SELECT id FROM direct_messages
       WHERE array_length(participants, 1) = 2
         AND $1 = ANY(participants) AND $2 = ANY(participants)
       LIMIT 1`,
      [fromUserId, toUserId]
    );

    let dmId;
    if (dmRow.rows.length > 0) {
      dmId = dmRow.rows[0].id;
    } else {
      dmId = `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        'INSERT INTO direct_messages (id, participants) VALUES ($1, $2)',
        [dmId, [fromUserId, toUserId]]
      );
    }

    // Create the invite message in the DM
    const server = await Server.findById(serverId);
    const msgId = `m${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const msgContent = `invited you to join ${server.name} ${server.icon || ''}`.trim();

    await pool.query(
      `INSERT INTO messages (id, content, author_id, dm_id, server_invite_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [msgId, msgContent, fromUserId, dmId, inviteId]
    );

    // Update DM last_message_time
    await pool.query(
      'UPDATE direct_messages SET last_message_time = CURRENT_TIMESTAMP WHERE id = $1',
      [dmId]
    );

    // Create the invite record
    await pool.query(
      `INSERT INTO server_invites (id, server_id, from_user_id, to_user_id, status, message_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [inviteId, serverId, fromUserId, toUserId, msgId]
    );

    const result = await pool.query(
      `SELECT si.*,
              s.name AS server_name, s.icon AS server_icon,
              fu.username AS from_username
       FROM server_invites si
       JOIN servers s  ON si.server_id    = s.id
       JOIN users   fu ON si.from_user_id = fu.id
       WHERE si.id = $1`,
      [inviteId]
    );

    res.status(201).json({ success: true, data: { invite: result.rows[0] } });
    const message = await Message.findById(msgId);
    if (message) {
      await publishRealtime((runtime) => runtime.publishMessageCreated(message));
    }
    await publishRealtime((runtime) => runtime.publishServerInviteCreated(result.rows[0]));
  } catch (error) {
    console.error('Error creating server invite:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create invite' });
  }
});

// POST /api/invites/:inviteId/accept
router.post('/:inviteId/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { inviteId } = req.params;

    const invite = await pool.query(
      `SELECT * FROM server_invites WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [inviteId, userId]
    );

    if (invite.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invite not found or already handled' });
    }

    const serverId = invite.rows[0].server_id;

    await pool.query(
      `UPDATE server_invites SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [inviteId]
    );

    // Add user as member
    try {
      await Server.addMember(serverId, userId, 'member');
    } catch (e) {
      // Already a member — not an error
    }

    res.status(200).json({ success: true, message: 'Invite accepted' });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ success: false, message: 'Failed to accept invite' });
  }
});

// POST /api/invites/:inviteId/decline
router.post('/:inviteId/decline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { inviteId } = req.params;

    const result = await pool.query(
      `UPDATE server_invites SET status = 'declined', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [inviteId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Invite not found or already handled' });
    }

    res.status(200).json({ success: true, message: 'Invite declined' });
  } catch (error) {
    console.error('Error declining invite:', error);
    res.status(500).json({ success: false, message: 'Failed to decline invite' });
  }
});

module.exports = router;
