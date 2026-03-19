const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// Helper to return DM rows with "other user" display info for the current user
const getDirectMessagesRows = async (currentUserId) => {
  const query = `
    SELECT
      dm.id,
      dm.participants,
      dm.last_message_time,
      dm.created_at,
      dm.updated_at,
      CASE
        WHEN dm.participants[1] = $1 THEN dm.participants[2]
        ELSE dm.participants[1]
      END as other_user_id,
      u.username,
      u.display_name,
      u.avatar,
      u.status
    FROM direct_messages dm
    JOIN users u ON u.id = (
      CASE
        WHEN dm.participants[1] = $1 THEN dm.participants[2]
        ELSE dm.participants[1]
      END
    )
    WHERE $1 = ANY(dm.participants)
    ORDER BY dm.last_message_time DESC
  `;

  const result = await pool.query(query, [currentUserId]);
  return result.rows;
};

// Get direct messages for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const directMessages = await getDirectMessagesRows(currentUserId);

    res.status(200).json({
      success: true,
      data: { directMessages }
    });
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch direct messages'
    });
  }
});

// Create or get a direct message between current user and another user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.body;

    if (!isNonEmptyString(userId)) {
      return res.status(400).json({
        success: false,
        message: '`userId` is required'
      });
    }

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a direct message with yourself'
      });
    }

    // Verify that the other user exists
    const otherUserCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (otherUserCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try to find an existing DM with the same two participants (order-independent)
    const existing = await pool.query(
      `
      SELECT
        dm.id,
        dm.participants,
        dm.last_message_time,
        dm.created_at,
        dm.updated_at,
        CASE
          WHEN dm.participants[1] = $1 THEN dm.participants[2]
          ELSE dm.participants[1]
        END as other_user_id,
        u.username,
        u.display_name,
        u.avatar,
        u.status
      FROM direct_messages dm
      JOIN users u ON u.id = (
        CASE
          WHEN dm.participants[1] = $1 THEN dm.participants[2]
          ELSE dm.participants[1]
        END
      )
      WHERE array_length(dm.participants, 1) = 2
        AND $1 = ANY(dm.participants)
        AND $2 = ANY(dm.participants)
      LIMIT 1
      `,
      [currentUserId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Direct message already exists',
        data: { directMessage: existing.rows[0] }
      });
    }

    const dmId = `dm${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      'INSERT INTO direct_messages (id, participants) VALUES ($1, $2)',
      [dmId, [currentUserId, userId]]
    );

    const rows = await getDirectMessagesRows(currentUserId);
    const created = rows.find((r) => r.id === dmId);

    res.status(201).json({
      success: true,
      message: 'Direct message created successfully',
      data: { directMessage: created }
    });
  } catch (error) {
    console.error('Error creating direct message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create direct message'
    });
  }
});

module.exports = router;

