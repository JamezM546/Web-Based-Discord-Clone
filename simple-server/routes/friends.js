const express = require('express');
const { pool } = require('../config/database');
const User = require('../models/User');
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

// GET /api/friends  — list accepted friends
router.get('/', authenticateToken, async (req, res) => {
  try {
    const friends = await User.getFriends(req.user.id);
    res.status(200).json({ success: true, data: { friends } });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
});

// GET /api/friends/requests  — pending requests (both incoming and outgoing)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT fr.*,
              fu.username AS from_username, fu.display_name AS from_display_name, fu.avatar AS from_avatar, fu.status AS from_status,
              tu.username AS to_username,   tu.display_name AS to_display_name,   tu.avatar AS to_avatar,   tu.status AS to_status
       FROM friend_requests fr
       JOIN users fu ON fr.from_user_id = fu.id
       JOIN users tu ON fr.to_user_id   = tu.id
       WHERE (fr.from_user_id = $1 OR fr.to_user_id = $1)
         AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, data: { requests: result.rows } });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friend requests' });
  }
});

// POST /api/friends/requests  — send a friend request
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ success: false, message: '`toUserId` is required' });
    }
    if (toUserId === fromUserId) {
      return res.status(400).json({ success: false, message: 'Cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const senderUser = await User.findById(fromUserId);

    const existing = await pool.query(
      `SELECT id, status FROM friend_requests
       WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)`,
      [fromUserId, toUserId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'You are already friends' });
      }
      if (row.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Friend request already pending' });
      }
    }

    const id = `fr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      `INSERT INTO friend_requests (id, from_user_id, to_user_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [id, fromUserId, toUserId]
    );

    res.status(201).json({ success: true, data: { request: result.rows[0] } });
    await publishRealtime((runtime) =>
      runtime.publishFriendRequestCreated({
        request: result.rows[0],
        users: [senderUser, targetUser].filter(Boolean),
      })
    );
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to send friend request' });
  }
});

// POST /api/friends/requests/:requestId/accept
router.post('/requests/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const result = await pool.query(
      `UPDATE friend_requests
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Friend request not found or already handled' });
    }

    const acceptedRequest = result.rows[0];
    const users = await Promise.all([
      User.findById(acceptedRequest.from_user_id),
      User.findById(acceptedRequest.to_user_id),
    ]);

    res.status(200).json({ success: true, data: { request: acceptedRequest } });
    await publishRealtime((runtime) =>
      runtime.publishFriendRequestAccepted({
        request: acceptedRequest,
        users: users.filter(Boolean),
      })
    );
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
});

// POST /api/friends/requests/:requestId/reject
router.post('/requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const result = await pool.query(
      `UPDATE friend_requests
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Friend request not found or already handled' });
    }

    res.status(200).json({ success: true, data: { request: result.rows[0] } });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject friend request' });
  }
});

// DELETE /api/friends/:friendId — remove an existing friend relationship
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    if (!friendId || friendId === userId) {
      return res.status(400).json({ success: false, message: 'A valid friend ID is required' });
    }

    const existing = await pool.query(
      `SELECT id, from_user_id, to_user_id, status
       FROM friend_requests
       WHERE status = 'accepted'
         AND (
           (from_user_id = $1 AND to_user_id = $2) OR
           (from_user_id = $2 AND to_user_id = $1)
         )
       LIMIT 1`,
      [userId, friendId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Friend relationship not found' });
    }

    await pool.query(`DELETE FROM friend_requests WHERE id = $1`, [existing.rows[0].id]);

    const users = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        removedUserId: friendId,
      },
    });

    await publishRealtime((runtime) =>
      runtime.publishFriendRemoved({
        userIds: [userId, friendId],
        users: users.filter(Boolean),
      })
    );
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
});

module.exports = router;
