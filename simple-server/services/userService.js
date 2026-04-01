const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
  getUserById,
  getAllUsers,
  initializeDemoAccounts
};
