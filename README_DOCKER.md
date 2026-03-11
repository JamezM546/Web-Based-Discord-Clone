# Docker Setup Guide

This document explains how to run the Discord Clone application using Docker Compose for a completely automated setup.

## Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Git

### One-Command Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Web-Based-Discord-Clone
```

2. **Start everything with Docker Compose:**
```bash
docker-compose up -d
```
**For first time setup ^, use `docker-compose up --build` for every time after

That's it! Docker will automatically:
- ✅ Download and start PostgreSQL database
- ✅ Create all database tables automatically
- ✅ Start the backend server
- ✅ Start the frontend development server
- ✅ Set up all environment variables
- ✅ Handle service dependencies

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## What Docker Does Automatically

### Database Setup
- Downloads PostgreSQL 15 image
- Creates `discord_clone` database
- Sets up user credentials (`postgres/postgres123`)
- Waits for database to be healthy before starting backend
- Initializes all tables on first startup
- Persists data in Docker volumes

### Backend Setup
- Builds Node.js server image
- Installs all dependencies
- Configures environment variables
- Waits for database to be ready
- Auto-creates database schema
- Starts development server with hot reload

### Frontend Setup
- Builds React development image
- Installs all dependencies
- Configures API endpoint
- Starts Vite development server
- Enables hot module replacement

## Docker Compose Services

### PostgreSQL Database
```yaml
postgres:
  image: postgres:15
  database: discord_clone
  user: postgres
  password: postgres123
  port: 5432
  health check: enabled
```

### Backend Server
```yaml
backend:
  builds from: ./simple-server/Dockerfile
  port: 3001
  waits for: postgres (healthy)
  auto-initializes: database tables
```

### Frontend App
```yaml
frontend:
  builds from: ./Dockerfile.frontend
  port: 5173
  waits for: backend
  API URL: http://localhost:3001
```

## Development Workflow

### Making Changes
- **Backend**: Changes in `simple-server/` auto-reload
- **Frontend**: Changes in `src/` auto-reload via Vite
- **Database**: Schema changes handled by initialization script

### Viewing Logs
```bash
# View all services
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs postgres
docker-compose logs frontend
```

### Restarting Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stopping Everything
```bash
docker-compose down
```

### Clean Start (removes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Environment Variables

All environment variables are pre-configured in `docker-compose.yml`:

### Backend Environment
- `NODE_ENV=development`
- `JWT_SECRET` (for authentication)
- `DATABASE_URL` (PostgreSQL connection)
- All database connection details

### Frontend Environment
- `VITE_API_URL=http://localhost:3001`

## Database Persistence

- Database data is stored in Docker volume `postgres_data`
- Data persists across container restarts
- Only removed with `docker-compose down -v`

## Troubleshooting

### Port Conflicts
If ports 5432, 3001, or 5173 are already in use:
```bash
# Check what's using the ports
netstat -tulpn | grep :5432
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# Or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Access backend container
docker-compose exec backend sh
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

### Full Reset
If something goes wrong and you want to start fresh:
```bash
# Stop everything and remove all data
docker-compose down -v

# Remove all Docker images (optional)
docker system prune -a

# Start fresh
docker-compose up -d
```

## Production Considerations

For production deployment, consider:
- Change default passwords in `docker-compose.yml`
- Use environment files instead of hardcoded values
- Add proper SSL certificates
- Configure proper backup strategies
- Use production-ready Docker images
- Add monitoring and logging

## Architecture Benefits

### For Outside Users
- **Zero setup**: Just run `docker-compose up -d`
- **Cross-platform**: Works on Windows, Mac, Linux
- **Isolated**: No local PostgreSQL installation needed
- **Consistent**: Same environment for everyone
- **Reproducible**: Same setup every time

### For Development
- **Fast iteration**: Hot reload for both frontend and backend
- **Easy debugging**: All logs in one place
- **Clean separation**: Each service in its own container
- **Scalable**: Easy to add more services
- **Portable**: Move between machines easily

## Next Steps

Once Docker is running:
1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create a server
4. Start chatting!

The database will automatically be populated with demo accounts for testing:
- Email: `nafisa@example.com`, Password: `password123`
- Email: `ashraf@example.com`, Password: `password123`
- Email: `james@example.com`, Password: `password123`
- Email: `elvis@example.com`, Password: `password123`
- Email: `salma@example.com`, Password: `password123`
