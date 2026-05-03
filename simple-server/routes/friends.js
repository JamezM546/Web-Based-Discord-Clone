const express = require('express');
const { pool } = require('../config/database');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

    res.status(200).json({ success: true, data: { request: result.rows[0] } });
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

// DELETE /api/friends/:userId  — unfriend a user
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot unfriend yourself' });
    }

    // Check if they are actually friends
    const friendshipCheck = await pool.query(
      `SELECT id FROM friend_requests
       WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
         AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendshipCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    // Update the friend request status to 'rejected' to end the friendship
    const result = await pool.query(
      `UPDATE friend_requests
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
         AND status = 'accepted'
       RETURNING *`,
      [currentUserId, userId]
    );

    res.status(200).json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error unfriending user:', error);
    res.status(500).json({ success: false, message: 'Failed to unfriend user' });
  }
});

module.exports = router;
