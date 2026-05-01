require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/server');
const channelRoutes = require('./routes/channel');
const messageRoutes = require('./routes/messages');
const directMessageRoutes = require('./routes/directMessages');
const summaryRoutes = require('./routes/summary');
const readStateRoutes = require('./routes/readState');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const inviteRoutes = require('./routes/serverInvites');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — optional CORS_ORIGINS (comma-separated) for Amplify / production frontends
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin: corsOrigins,
    })
  );
} else {
  app.use(cors());
}
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Discord Clone API - Simple Version with Auth',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      api: 'GET /api',
      docs: 'GET /api/docs - Interactive API Documentation',
      test: 'GET /api/test',
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user (protected)',
        'GET /api/auth/test-protected': 'Test protected route'
      },
      servers: {
        'POST /api/servers': 'Create new server (protected)',
        'GET /api/servers': 'Get servers for current user (protected)',
        'GET /api/servers/:serverId': 'Get server by ID with members and channels (protected)',
        'PUT /api/servers/:serverId': 'Update server settings (protected)',
        'DELETE /api/servers/:serverId': 'Delete server (protected)',
        'POST /api/servers/:serverId/members': 'Add member to server (protected)',
        'DELETE /api/servers/:serverId/members/:userId': 'Remove member from server (protected)'
      },
      channels: {
        'POST /api/channels': 'Create new channel (protected)',
        'GET /api/channels/server/:serverId': 'Get channels for a server (protected)',
        'GET /api/channels/:channelId': 'Get channel by ID with messages (protected)',
        'PUT /api/channels/:channelId': 'Update channel (protected)',
        'DELETE /api/channels/:channelId': 'Delete channel (protected)',
        'PUT /api/channels/server/:serverId/reorder': 'Reorder channels in server (protected)'
      },
      messages: {
        'GET /api/messages/channels/:channelId': 'Get messages for a channel (protected)',
        'GET /api/messages/dm/:dmId': 'Get messages for a direct message (protected)',
        'POST /api/messages': 'Create a new message (protected)',
        'PUT /api/messages/:messageId': 'Edit a message (protected)',
        'DELETE /api/messages/:messageId': 'Delete a message (protected)',
        'GET /api/messages/:messageId/reactions': 'Get reactions for a message (protected)',
        'POST /api/messages/:messageId/reactions/toggle': 'Toggle message reaction (protected)'
      },
      directMessages: {
        'GET /api/direct-messages': 'Get direct messages for current user (protected)',
        'POST /api/direct-messages': 'Create or get a direct message (protected)'
      },
      summaries: {
        'POST /api/summaries/manual': 'Generate a manual AI summary for a channel or DM (protected)',
        'GET /api/summaries/preview': 'Get a What You Missed preview for a channel or DM (protected)'
      },
      readState: {
        'PUT /api/read-state': 'Sync read position to the backend for a channel or DM (protected)'
      },
      search: {
        'GET /api/servers/search?q=': 'Search servers by name (protected)'
      },
      users: {
        'GET /api/users/search?q=': 'Search users by username (protected)',
        'GET /api/users/me': 'Get current user profile (protected)',
        'PUT /api/users/me/profile': 'Update display name and avatar (protected)',
        'PUT /api/users/me/status': 'Update online status (protected)',
        'GET /api/users/:userId': 'Get user by ID (protected)'
      },
      friends: {
        'GET /api/friends': 'List accepted friends (protected)',
        'GET /api/friends/requests': 'List pending friend requests (protected)',
        'POST /api/friends/requests': 'Send a friend request (protected)',
        'POST /api/friends/requests/:id/accept': 'Accept a friend request (protected)',
        'POST /api/friends/requests/:id/reject': 'Reject a friend request (protected)'
      },
      invites: {
        'GET /api/invites/pending': 'List pending server invites (protected)',
        'POST /api/invites': 'Create a server invite (protected)',
        'POST /api/invites/:id/accept': 'Accept a server invite (protected)',
        'POST /api/invites/:id/decline': 'Decline a server invite (protected)'
      }
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    data: {
      server: 'Simple Backend with Auth',
      status: 'running',
      time: new Date().toISOString()
    }
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Server routes
app.use('/api/servers', serverRoutes);

// Channel routes
app.use('/api/channels', channelRoutes);

// Message routes
app.use('/api/messages', messageRoutes);

// Direct message routes
app.use('/api/direct-messages', directMessageRoutes);

// Summary routes: POST /api/summaries/manual, POST /api/summaries/manual/dms/:dmId
app.use('/api/summaries', summaryRoutes);

// Read state sync: PUT /api/read-state
app.use('/api/read-state', readStateRoutes);

// User routes (search, profile, status)
app.use('/api/users', userRoutes);

// Friend routes (list, requests, send, accept, reject)
app.use('/api/friends', friendRoutes);

// Server invite routes (create, pending, accept, decline)
app.use('/api/invites', inviteRoutes);

// API Documentation/Explorer
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs.html'));
});

// Initialise DB, demo accounts, and seed data. Exported for tests.
const initAll = async () => {
  await initializeDatabase();
  console.log('Database initialized successfully');

  const { initializeDemoAccounts } = require('./services/userService');
  await initializeDemoAccounts();

  const { seedDatabase } = require('./services/seedData');
  await seedDatabase();
};

// Only start listening when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Simple server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api`);
    console.log(`Interactive docs: http://localhost:${PORT}/api/docs`);
    console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);

    try {
      await initAll();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  });
}

module.exports = { app, initAll };
