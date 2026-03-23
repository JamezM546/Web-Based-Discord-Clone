# Discord Clone

A web-based Discord-inspired communication app. Ready to run with Docker - no setup required!

## **Quick Start**

**Get the app running in one command:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JamezM546/Web-Based-Discord-Clone.git
   cd Web-Based-Discord-Clone
   ```

2. **Start the application** from the repository root (same folder as `docker-compose.yml`):

   **Docker Compose V2** (Docker Desktop — recommended):
   ```bash
   docker compose up --build
   ```

   **Legacy Compose V1** (if `docker compose` is not found):
   ```bash
   docker-compose up --build
   ```

3. **Open your browser:**
   - **Frontend:** http://localhost:5173  
   - **Backend health:** http://localhost:3001/health  
   - **Interactive API docs:** http://localhost:3001/api/docs  

4. **Log in with seeded demo data** (created automatically on first DB startup):

   | Email | Password |
   |-------|----------|
   | `nafisa@example.com` | `password123` |
   | `ashraf@example.com` | `password123` |
   | `salma@example.com` | `password123` |
   | `elvis@example.com` | `password123` |
   | `james@example.com` | `password123` |

That's it! The app is now running and ready to use.

---

## **Run backend tests (out of the box, Docker-only)**

Integration tests live in `simple-server/tests/` and need PostgreSQL. **You do not need Node.js on your PC** if you use the raw Docker command below.

From the **repository root** (`Web-Based-Discord-Clone/`, next to `docker-compose.yml`):

1. Ensure Postgres is up (starts the DB if it is not running):
   ```bash
   docker compose up -d postgres
   ```
   *(Use `docker-compose` instead of `docker compose` if you are on Compose V1.)*

2. Run Jest **inside** the backend container (installs devDependencies such as Jest inside the container, then runs all suites):
   ```bash
   docker compose run --rm backend sh -c "npm install && npm test"
   ```

   **Expected:** `Test Suites: 10 passed`, `Tests: 65 passed` (or similar).

**Why this command?** The backend service uses a Docker volume for `/app/node_modules`. A plain `npm test` on the host can work, but `jest` is often missing inside the container unless `npm install` runs there first. Running tests in the container also uses `DATABASE_HOST=postgres` on the Compose network, so you avoid `localhost:5432` connection issues.

**If you have Node.js installed** on the host, you can use the npm shortcut from the repo root (defined in root `package.json`):

```bash
docker compose up -d postgres
npm run test:backend
```

If you see `Missing script: "test:backend"`, your checkout may be missing that script — use the **raw** `docker compose run --rm backend sh -c "npm install && npm test"` command above instead.

**Host-only tests** (optional): install Node.js, start Postgres on `localhost:5432` with credentials matching `simple-server/.env.test`, then:

```bash
cd simple-server
npm install
npm test
```

More detail: [`simple-server/README.md`](simple-server/README.md).

---

## **How to Stop**

When you're done using the app:
```bash
docker compose down
```
*(or `docker-compose down` on Compose V1.)*

## **What You Get**

| Service | What it is | How to access |
|---------|------------|---------------|
| **Discord App** | The main chat application | http://localhost:5173 |
| **Backend API** | Powers the app features | http://localhost:3001 |
| **Database** | Stores all your data | Runs automatically |

## **Features**

### **Core Chat Features**
- **Spaces** - Create and join communities (like Discord servers)
- **Rooms** - Text channels for different topics
- **Direct Messages** - Private one-on-one conversations
- **Real-time Messaging** - Instant message delivery
- **@mentions** - Notify specific users
- **Emoji Reactions** - React to messages with emojis

### **User Features**
- **Authentication** - Secure login and registration
- **Friends List** - Add and manage friends
- **Online Status** - See who's online
- **Member Lists** - View everyone in your spaces

### **AI-Powered Features**
- **Manual AI Summary** - Get AI-generated summaries of conversations
- **What You Missed** - Automatic catch-up when you return
- **Search** - Find messages and content quickly

## **System Requirements**

- **Docker** - Download from [docker.com](https://docker.com)
- **Docker Compose** - Usually included with Docker

That's all you need! No Node.js, no database setup, no configuration.

## **Accessing the App**

Once running, simply open your web browser and navigate to:

**http://localhost:5173**

The app will load and you can start using it immediately!

## **Troubleshooting**

### **"Port already in use" error:**
```bash
# Stop other services using ports 5173, 3001, or 5432
# Then try again:
docker compose up --build
```

### **App won't load:**
```bash
# Check if services are running:
docker compose ps

# Restart everything:
docker compose down
docker compose up --build
```

### **Something went wrong:**
```bash
# Clean start (removes all data):
docker compose down -v
docker compose up --build
```

### **Tests fail with "Failed to connect to database" or `jest: not found`:**
- Start Postgres first: `docker compose up -d postgres` and wait until the container is **healthy**.
- Prefer the container test command:  
  `docker compose run --rm backend sh -c "npm install && npm test"`
- If another PostgreSQL install on your machine uses **port 5432**, stop it or remap the Compose postgres port and update `simple-server/.env.test` for host-only `npm test`.

### **`docker compose` vs `docker-compose`:**
Docker Desktop ships **Compose V2** as `docker compose` (space). Older installs may only have `docker-compose` (hyphen). Use whichever your system recognizes; they are equivalent for this project.

### **Git: use `git branch`, not `branch`:**
`branch` alone is not a Git command. Use `git branch` to list branches and `git checkout <branch-name>` to switch.

## **Project Overview**

This is a complete Discord-like chat application that runs entirely in Docker. It includes:

- **Frontend**: Modern React interface with Tailwind CSS
- **Backend**: Express.js API server
- **Database**: PostgreSQL for data storage
- **AI Features**: Conversation summaries and smart search

The app is designed to be a drop-in replacement for Discord, with a focus on simplicity and ease of use.

## **Requirements**

- Docker
- Docker Compose

**Total setup time: Less than 5 minutes**
