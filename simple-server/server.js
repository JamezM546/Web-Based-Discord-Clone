require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/server');
const channelRoutes = require('./routes/channel');
const messageRoutes = require('./routes/message');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
        'POST /api/messages': 'Create new message (protected)',
        'GET /api/messages/channel/:channelId': 'Get messages for a channel (protected)',
        'GET /api/messages/dm/:dmId': 'Get messages for a DM (protected)',
        'GET /api/messages/:messageId': 'Get single message by ID (protected)',
        'PUT /api/messages/:messageId': 'Update message (protected)',
        'DELETE /api/messages/:messageId': 'Delete message (protected)',
        'POST /api/messages/:messageId/reactions': 'Add reaction to message (protected)',
        'DELETE /api/messages/:messageId/reactions': 'Remove reaction from message (protected)',
        'GET /api/messages/:messageId/reactions': 'Get message reactions (protected)',
        'GET /api/messages/search/channel/:channelId': 'Search messages in channel (protected)',
        'GET /api/messages/search/dm/:dmId': 'Search messages in DM (protected)'
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

// API Documentation/Explorer
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`Interactive docs: http://localhost:${PORT}/api/docs`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
});
