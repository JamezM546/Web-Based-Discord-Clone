require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');

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
