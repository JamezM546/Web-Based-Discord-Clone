# Database Setup Guide

This document explains how to set up PostgreSQL for the Discord Clone application.

## Database Schema Overview

The database includes the following tables:

### Core Tables
- **users** - User accounts with authentication and profile information
- **servers** - Discord servers (guilds) with owner information
- **server_members** - Server membership with role-based permissions
- **channels** - Text and voice channels within servers
- **messages** - Chat messages with support for replies and reactions
- **message_reactions** - Emoji reactions to messages
- **direct_messages** - Direct message conversations between users
- **friend_requests** - Friend request system
- **server_invites** - Server invitation system

## Setup Instructions

### 1. Install PostgreSQL
```bash
# Windows
# Download from https://www.postgresql.org/download/windows/

# macOS (with Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE "discord-clone";

-- Create user (optional, for better security)
CREATE USER discord_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "discord-clone" TO discord_user;
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and update the database configuration:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL=postgresql://discord_user:your_password@localhost:5432/discord-clone
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=discord-clone
DATABASE_USER=discord_user
DATABASE_PASSWORD=your_password
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Server
```bash
npm run dev
```

The server will automatically:
- Connect to the database
- Create all necessary tables
- Set up indexes for performance
- Initialize demo accounts

## Database Features

### User Management
- User registration with email/username
- Password hashing with bcrypt
- User profiles with avatars and status
- Friend request system

### Server Management
- Server creation with ownership
- Member management with roles (owner, admin, moderator, member)
- Server invites system

### Channel System
- Text and voice channels
- Channel permissions based on server membership
- Channel ordering and positioning

### Messaging
- Real-time messaging in channels and DMs
- Message replies and threading
- Emoji reactions
- Message editing and deletion
- Search functionality

### Security Features
- JWT-based authentication
- Role-based permissions
- Data validation and sanitization
- Proper foreign key constraints

## Model Classes

The application uses the following model classes for database operations:

- **User** - User account management
- **Server** - Server operations and member management
- **Channel** - Channel creation and permissions
- **Message** - Message operations, reactions, and search

Each model class provides methods for:
- CRUD operations (Create, Read, Update, Delete)
- Relationship management
- Permission checking
- Search and filtering

## Performance Optimizations

- Database indexes on frequently queried fields
- Connection pooling for efficient resource usage
- Proper foreign key constraints for data integrity
- Optimized queries for common operations

## Next Steps

1. Set up PostgreSQL locally
2. Configure environment variables
3. Install dependencies and start the server
4. Test the authentication system
5. Create test servers and channels
6. Implement real-time messaging with WebSockets

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists
- Check firewall settings

### Permission Errors
- Ensure database user has proper privileges
- Check table ownership
- Verify foreign key constraints

### Performance Issues
- Monitor database connection pool
- Check query performance
- Verify indexes are being used
- Consider read replicas for scaling
