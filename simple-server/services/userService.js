const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { pool } = require('../config/database');

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Initialize demo accounts from frontend mock data
const initializeDemoAccounts = async () => {
  try {
    const existingUsers = await User.findByEmail('nafisa@example.com');
    if (!existingUsers) {
      const demoPasswordHash = await hashPassword('password123');
      
      const demoUsers = [
        {
          id: '1',
          username: 'Nafisa',
          email: 'nafisa@example.com',
          passwordHash: demoPasswordHash,
          displayName: 'Nafisa',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nafisa'
        },
        {
          id: '2',
          username: 'Ashraf',
          email: 'ashraf@example.com',
          passwordHash: demoPasswordHash,
          displayName: 'Ashraf',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ashraf'
        },
        {
          id: '3',
          username: 'James',
          email: 'james@example.com',
          passwordHash: demoPasswordHash,
          displayName: 'James',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'
        },
        {
          id: '4',
          username: 'Elvis',
          email: 'elvis@example.com',
          passwordHash: demoPasswordHash,
          displayName: 'Elvis',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elvis'
        },
        {
          id: '5',
          username: 'Salma',
          email: 'salma@example.com',
          passwordHash: demoPasswordHash,
          displayName: 'Salma',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salma'
        }
      ];

      for (const user of demoUsers) {
        await User.create(user);
      }
      
      console.log('Demo accounts initialized with password: password123');
    }
  } catch (error) {
    console.error('Error initializing demo accounts:', error);
  }
};

// Exported so server.js can call it after DB is ready
// (no longer auto-runs on import to avoid race conditions)

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const getResetTokenExpiryMinutes = () => {
  const raw = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES || '60', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 60;
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const clearExpiredResetTokens = async () => {
  await pool.query('DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at < CURRENT_TIMESTAMP');
};

const issuePasswordResetToken = async (email) => {
  await clearExpiredResetTokens();

  const user = await User.findByEmail(email, true);
  if (!user) {
    return {
      issued: false,
      message: 'If an account exists for that email, a reset link has been generated.',
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + getResetTokenExpiryMinutes() * 60 * 1000);

  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
  await pool.query(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [`prt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, user.id, tokenHash, expiresAt.toISOString()]
  );

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return {
    issued: true,
    message: 'If an account exists for that email, a reset link has been generated.',
    resetToken: rawToken,
    resetUrl: `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`,
    expiresAt: expiresAt.toISOString(),
    email: user.email,
  };
};

const validatePasswordResetToken = async (token) => {
  await clearExpiredResetTokens();

  const tokenHash = hashResetToken(token);
  const result = await pool.query(
    `
      SELECT prt.id, prt.user_id, prt.expires_at, u.email
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = $1
        AND prt.used_at IS NULL
        AND prt.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash]
  );

  if (result.rowCount === 0) {
    throw new Error('Reset token is invalid or expired');
  }

  return result.rows[0];
};

// Reset password for an authenticated user
const resetPassword = async ({ userId, currentPassword, newPassword }) => {
  const userWithPassword = await User.findByIdWithPassword(userId);
  if (!userWithPassword) {
    throw new Error('User not found');
  }

  const isValidPassword = await verifyPassword(currentPassword, userWithPassword.password_hash);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  const isSamePassword = await verifyPassword(newPassword, userWithPassword.password_hash);
  if (isSamePassword) {
    throw new Error('New password must be different from the current password');
  }

  const passwordHash = await hashPassword(newPassword);
  return await User.updatePassword(userId, passwordHash);
};

const resetPasswordWithToken = async ({ token, newPassword }) => {
  const tokenRow = await validatePasswordResetToken(token);
  const userWithPassword = await User.findByIdWithPassword(tokenRow.user_id);
  if (!userWithPassword) {
    throw new Error('User not found');
  }

  const isSamePassword = await verifyPassword(newPassword, userWithPassword.password_hash);
  if (isSamePassword) {
    throw new Error('New password must be different from the current password');
  }

  const passwordHash = await hashPassword(newPassword);
  const user = await User.updatePassword(tokenRow.user_id, passwordHash);

  await pool.query('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [tokenRow.id]);
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2', [tokenRow.user_id, tokenRow.id]);

  return user;
};

// Register new user
const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await User.create({
    id: Date.now().toString(), // Simple ID generation
    username,
    email,
    passwordHash: hashedPassword,
    displayName: username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  });

  // Generate token
  const token = generateToken(newUser);
  
  return {
    user: newUser,
    token
  };
};

// Login user
const loginUser = async (loginData) => {
  const { email, password } = loginData;

  // Find user with password for verification
  const userWithPassword = await User.findByEmail(email, true);
  if (!userWithPassword) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, userWithPassword.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Get user without password for response
  const user = await User.findByEmail(email, false);

  // Generate token
  const token = generateToken(user);
  
  return {
    user,
    token
  };
};

// Get user by ID
const getUserById = async (id) => {
  return await User.findById(id);
};

// Get all users (for development)
const getAllUsers = async () => {
  // This would need to be implemented in User model
  return [];
};

module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  issuePasswordResetToken,
  validatePasswordResetToken,
  resetPasswordWithToken,
  getUserById,
  getAllUsers,
  initializeDemoAccounts
};
