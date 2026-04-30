const express = require('express');
const { registerUser, loginUser, getUserById, logoutUser } = require('../services/userService');
const { validate, registerSchema, loginSchema } = require('../utils/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// Login user
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { user, token } = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// Logout user (protected route)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await logoutUser(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
});

// Test protected route
router.get('/test-protected', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Protected route accessed successfully',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
