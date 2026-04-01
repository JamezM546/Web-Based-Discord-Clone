const express = require('express');
const User = require('../models/User');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, resetPasswordSchema } = require('../utils/validation');
const { resetPassword } = require('../services/userService');

const router = express.Router();

// GET /api/users/search?q=<username>
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter `q` is required' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await pool.query(
      `SELECT id, username, display_name, avatar, status
       FROM users
       WHERE username ILIKE $1
       ORDER BY username ASC
       LIMIT $2`,
      [`%${q}%`, limit]
    );

    res.status(200).json({ success: true, data: { users: result.rows } });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// GET /api/users/me  — full profile of the authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me/profile  — update display name / avatar
router.put('/me/profile', authenticateToken, async (req, res) => {
  try {
    const updates = {};
    if (req.body.displayName !== undefined) updates.display_name = req.body.displayName;
    if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const user = await User.updateProfile(req.user.id, updates);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update profile' });
  }
});

// PUT /api/users/me/status  — update online status
router.put('/me/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['online', 'idle', 'dnd', 'offline'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const user = await User.updateStatus(req.user.id, status);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update status' });
  }
});

// PUT /api/users/me/password  — reset password for authenticated user
router.put('/me/password', authenticateToken, validate(resetPasswordSchema), async (req, res) => {
  try {
    const user = await resetPassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
});

// GET /api/users/:userId  — public profile of any user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

module.exports = router;
