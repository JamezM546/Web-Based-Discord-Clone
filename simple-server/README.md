# Discord Clone — Backend Server

## Overview

Express.js REST API backend for a web-based Discord clone. Provides authentication, server/channel/message management, direct messaging, friend requests, server invites, and AI-powered conversation summaries. Designed to support **10 simultaneous frontend users**.

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18.x LTS | JavaScript server runtime |
| Framework | Express.js | 4.18.x | HTTP routing, middleware pipeline |
| Database | PostgreSQL | 15.x | Persistent relational data storage |
| DB Driver | pg (node-postgres) | 8.11.x | PostgreSQL connection pool and query interface |
| Auth | jsonwebtoken (JWT) | 9.0.x | Stateless token-based authentication |
| Passwords | bcryptjs | 2.4.x | Password hashing with salt |
| Validation | Joi | 17.11.x | Request body schema validation |
| Config | dotenv | 16.6.x | Environment variable management |
| CORS | cors | 2.8.x | Cross-origin resource sharing |
| Testing | Jest + Supertest | 29.x / 6.x | Integration test framework |
| Dev Server | nodemon | 3.x | Auto-restart on file changes |

---

## External Dependencies

| Dependency | Required? | Purpose |
|-----------|-----------|---------|
| PostgreSQL 15 | **Required** | All application data storage |
| Docker + Docker Compose | Recommended | Containerised local environment |
| Groq API | Optional (mocked) | AI summarisation in P5; mocked with deterministic logic in P4 |

---

## Database

### Connection

The server connects via a pooled `pg.Pool` (max 20 connections, 2 s connect timeout, 30 s idle timeout). Configuration is read from environment variables — see `.env.example`.

### Tables Created

All tables are created automatically on startup via `CREATE TABLE IF NOT EXISTS`:

| Table | Description |
|-------|-------------|
| `users` | User accounts — credentials, display name, avatar, online status |
| `servers` | Discord-style servers (guilds) owned by a user |
| `server_members` | Many-to-many: which users belong to which servers, with role |
| `channels` | Text channels within a server |
| `messages` | Messages in channels or DMs, with optional reply and invite references |
| `message_reactions` | Emoji reactions on messages |
| `direct_messages` | DM conversation metadata — participants and last activity |
| `friend_requests` | Friend request state machine (pending → accepted / rejected) |
| `server_invites` | Server invite state machine (pending → accepted / declined) |

### Indexes

Performance indexes are created for: `messages(channel_id)`, `messages(dm_id)`, `messages(author_id)`, `messages(timestamp)`, `server_members(server_id)`, `server_members(user_id)`, `channels(server_id)`, `users(email)`, `users(username)`.

---

## Installation & Startup

### Option A — Docker Compose (recommended)

From the project root (`Web-Based-Discord-Clone/`):

```bash
# Start all services (PostgreSQL, backend, frontend)
docker-compose up --build

# Verify
#   Frontend: http://localhost:5173
#   Backend:  http://localhost:3001/health
#   API docs: http://localhost:3001/api/docs
```

### Option B — Local Node.js

Prerequisites: Node.js 18+, a running PostgreSQL 15 instance.

```bash
cd simple-server

# Install dependencies
npm install

# Create and configure .env (copy from template)
cp .env.example .env
# Edit .env with your database credentials

# Start in development mode (auto-reload)
npm run dev

# Or start in production mode
npm start
```

---

## Stopping

```bash
# Docker
docker-compose down

# Local
# Press Ctrl+C in the terminal running the server
```

---

## Resetting Data

```bash
# Docker — remove all data volumes and rebuild
docker-compose down -v
docker-compose up --build

# Local — drop and recreate the database
psql -U postgres -c "DROP DATABASE IF EXISTS discord_clone;"
psql -U postgres -c "CREATE DATABASE discord_clone;"
npm run dev   # tables and seed data are recreated automatically
```

On startup the server automatically:
1. Waits for PostgreSQL to be ready (retries up to 10 times)
2. Creates all tables via `CREATE TABLE IF NOT EXISTS`
3. Inserts 5 demo user accounts (password: `password123`)
4. Seeds realistic demo data (3 servers, 7 channels, 26 messages, 2 DMs, friend requests)

Seed data is idempotent — running startup multiple times will not create duplicates.

---

## Running Tests

Tests are **integration tests** that run against a live PostgreSQL database.

### Recommended: Docker (no backend dev server; works out of the box after `git clone`)

From the **repository root** (parent of `simple-server/`, where `docker-compose.yml` lives):

```bash
docker compose up -d postgres
docker compose run --rm backend sh -c "npm install && npm test"
```

- **`npm install`** runs **inside** the container so `node_modules` (including Jest) exists on the anonymous `/app/node_modules` volume (avoids `jest: not found`).
- **`DATABASE_HOST=postgres`** is set by Compose, so you avoid host `localhost:5432` / port-conflict issues.
- Compose starts **postgres** automatically if needed when you `docker compose run …`.

Use **`docker-compose`** (hyphen) instead of **`docker compose`** if your machine only has Compose V1.

### Shortcut (requires Node.js on your machine)

From the **repository root**:

```bash
docker compose up -d postgres
npm run test:backend
```

This runs the same Docker command as above. If you see **`Missing script: "test:backend"`**, your checkout may not include the root `package.json` script — use the **raw** `docker compose run …` block in the previous section.

From **`simple-server/`** you can also run:

```bash
npm run test:docker
```

That invokes `docker compose -f ../docker-compose.yml run --rm backend sh -c "npm install && npm test"`.

### Alternative — tests on your host only

Requires Postgres reachable at **`localhost:5432`** with credentials matching **`.env.test`** (a local PostgreSQL install on 5432 often breaks this):

```bash
cd simple-server
npm install
npm test
```

If connection fails, the server logs a multi-line error with troubleshooting hints.

**Test suites:** 10 files, **65 tests** covering auth, servers, channels, messages, DMs, friends, invites, users, server search (US3), and summaries (US1 + US2).

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/search?q=` | Search users by username |
| GET | `/api/users/me` | Get own profile |
| PUT | `/api/users/me/profile` | Update display name / avatar |
| PUT | `/api/users/me/status` | Update online status |
| GET | `/api/users/:userId` | Get public profile |

### Servers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/servers` | List user's servers |
| POST | `/api/servers` | Create a server |
| GET | `/api/servers/search?q=` | **US3** — Search servers by name |
| GET | `/api/servers/:serverId` | Get server with members & channels |
| PUT | `/api/servers/:serverId` | Update server settings |
| DELETE | `/api/servers/:serverId` | Delete a server |

### Channels
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/channels/server/:serverId` | List channels in a server |
| POST | `/api/channels` | Create a channel |
| GET | `/api/channels/:channelId` | Get channel details |
| DELETE | `/api/channels/:channelId` | Delete a channel |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/channels/:channelId` | Get channel messages |
| GET | `/api/messages/dm/:dmId` | Get DM messages |
| POST | `/api/messages` | Send a message |
| PUT | `/api/messages/:messageId` | Edit a message |
| DELETE | `/api/messages/:messageId` | Delete a message |
| POST | `/api/messages/:messageId/reactions/toggle` | Toggle emoji reaction |

### Direct Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/direct-messages` | List DM conversations |
| POST | `/api/direct-messages` | Create or get a DM |

### Friends
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/friends` | List accepted friends |
| GET | `/api/friends/requests` | List pending requests |
| POST | `/api/friends/requests` | Send a friend request |
| POST | `/api/friends/requests/:id/accept` | Accept a request |
| POST | `/api/friends/requests/:id/reject` | Reject a request |

### Server Invites
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/invites/pending` | List pending invites |
| POST | `/api/invites` | Send a server invite |
| POST | `/api/invites/:id/accept` | Accept an invite |
| POST | `/api/invites/:id/decline` | Decline an invite |

### Summaries
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/summaries/manual` | **US1** — Generate manual summary |
| GET | `/api/summaries/preview` | **US2** — What You Missed preview |

### Utility
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API info and endpoint listing |
| GET | `/api/docs` | Interactive API documentation |

---

## Demo Accounts

| Username | Email | Password |
|----------|-------|----------|
| Nafisa | nafisa@example.com | password123 |
| Ashraf | ashraf@example.com | password123 |
| James | james@example.com | password123 |
| Elvis | elvis@example.com | password123 |
| Salma | salma@example.com | password123 |

---

## Environment Variables

See `.env.example` for the full template. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server listen port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | 7d | Token expiration duration |
| `DATABASE_URL` | — | Full PostgreSQL connection string |
| `DATABASE_HOST` | localhost | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_NAME` | discord-clone | Database name |
| `DATABASE_USER` | — | Database username |
| `DATABASE_PASSWORD` | — | Database password |
