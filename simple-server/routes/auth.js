const express = require('express');
const {
  registerUser,
  loginUser,
  getUserById,
  issuePasswordResetToken,
  validatePasswordResetToken,
  resetPasswordWithToken,
} = require('../services/userService');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  tokenResetPasswordSchema,
} = require('../utils/validation');
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

// Forgot password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const result = await issuePasswordResetToken(req.body.email);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        resetToken: result.resetToken,
        resetUrl: result.resetUrl,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process forgot-password request',
    });
  }
});

// Validate reset token
router.get('/reset-password/validate', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    const tokenRow = await validatePasswordResetToken(token);
    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: tokenRow.email,
        expiresAt: tokenRow.expires_at,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Reset token is invalid or expired',
    });
  }
});

// Reset password via token
router.post('/reset-password', validate(tokenResetPasswordSchema), async (req, res) => {
  try {
    const user = await resetPasswordWithToken({
      token: req.body.token,
      newPassword: req.body.newPassword,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: { user },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password',
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
