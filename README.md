# Discord Clone

A web-based Discord-inspired communication app. Ready to run with Docker - no setup required!

Deployment note: the `deployed` branch is intended to be the release branch for automated deployment workflow testing.

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

### P5 — backend unit tests and coverage (no Docker required for this part)

Core auth logic is covered by **isolated Jest tests** that mock the database (`simple-server/tests/userService.unit.test.js`, `simple-server/tests/User.model.unit.test.js`). English test specifications live in [`docs/testing/userService-test-spec.md`](docs/testing/userService-test-spec.md) and [`docs/testing/User-model-test-spec.md`](docs/testing/User-model-test-spec.md).

From the **`simple-server`** directory (Node.js 18+ and `npm install` required):

```bash
cd simple-server
npm install
npx jest userService.unit.test.js User.model.unit.test.js
```

**Coverage** for `services/userService.js` and `models/User.js` (threshold 80% per file, enforced when coverage is enabled):

```bash
cd simple-server
npm run test:coverage
```

That last command runs **all** backend tests, including integration suites that need PostgreSQL (same rules as above: start Postgres or use Docker). To run **only** the two unit files with coverage:

```bash
cd simple-server
npx jest userService.unit.test.js User.model.unit.test.js --coverage
```

### P5 — frontend unit tests and coverage (repo root, Node.js required)

The frontend uses **two test runners**:

- **Jest** (with Babel) — React and `AppContext` tests under [`tests/`](tests/), mainly [`tests/appcontext.unit.test.tsx`](tests/appcontext.unit.test.tsx). Configuration lives in [`jest.config.cjs`](jest.config.cjs). Files under [`src/tests/`](src/tests/) are **ignored by Jest** so they only run under Vitest.
- **Vitest** (via the same Vite config as the app) — API client tests for [`src/app/services/apiService.ts`](src/app/services/apiService.ts) in [`src/tests/apiService.test.ts`](src/tests/apiService.test.ts). Test options and Vitest coverage scope are in [`vite.config.ts`](vite.config.ts).

English specifications: [`tests/appContext-test-spec.md`](tests/appContext-test-spec.md) and [`docs/testing/apiService-test-spec.md`](docs/testing/apiService-test-spec.md).

From the **repository root** (next to the root `package.json`, **Node.js 18+** recommended — match CI, which also runs **20.x**):

```bash
npm ci
```

*(Use `npm install` if you are not reproducing a clean lockfile install.)*

**Run all frontend automated tests** (Jest for `tests/`, then Vitest for `apiService`) — **recommended**:

```bash
npm run test:frontend:all
```

That runs `test:frontend` and `test:api-service` in sequence. The terminal prints each command and its output (Jest first, then Vitest), so you can still see which runner is which.

**Run only Jest** (everything under `tests/`):

```bash
npm run test:frontend
```

**Run only the AppContext suite:**

```bash
npm run test:appcontext
```

**Run only the apiService Vitest suite:**

```bash
npm run test:api-service
```

**Expected:** Jest finishes the `tests/` suite successfully; Vitest finishes `src/tests/apiService.test.ts` successfully. Exact test counts change over time; you should see on the order of tens of Jest tests and a larger Vitest count for `apiService` (or similar).

**Coverage** stays **two commands** on purpose: Jest and Vitest use different tooling, and both default to writing under `coverage/`—chaining them without extra config would overwrite the first run. Run each when you need that report.

**Jest coverage** (paths under `collectCoverageFrom` in `jest.config.cjs`, e.g. `src/**/*.{ts,tsx}` with a few excludes):

```bash
npm run test:coverage
```

**Vitest coverage** for `apiService` only (v8 provider; `include` is scoped to `src/app/services/apiService.ts` in `vite.config.ts`):

```bash
npx vitest run src/tests/apiService.test.ts --coverage
```


---

## **P6 — Deploy to AWS (Lambda + API Gateway + Amplify)**

**Phased deployment walkthrough (RDS, Lambda, API Gateway, Amplify, GitHub, teardown):** [`docs/DEPLOYMENT-README.md`](docs/DEPLOYMENT-README.md)

This repo supports the course deployment sprint: **serverless backend** on Lambda behind **API Gateway REST**, **static frontend** on **Amplify Hosting**, and **GitHub Actions** for CI/CD.

### Architecture gap (what changes vs Docker)

| Local (Docker) | AWS target |
|----------------|------------|
| Long-lived Node process (`server.js` listens on 3001) | **Lambda** + [`serverless-http`](https://github.com/dougmoscrop/serverless-http) entry [`simple-server/lambda.js`](simple-server/lambda.js) (`lambda.handler`) |
| Postgres container on `localhost` / `postgres` | **Amazon RDS PostgreSQL** (or other network Postgres). Set `DATABASE_URL` on the Lambda function. Put Lambda in the **same VPC** as RDS if the DB is private; open security group **5432** from the Lambda SG. |
| Frontend talks to `http://localhost:3001` | Build with **`VITE_API_URL`** = your **API Gateway invoke URL** (Amplify console → environment variables). |
| Open CORS | Set **`CORS_ORIGINS`** on Lambda to your Amplify site URL(s), comma-separated. |

### One-time AWS setup (summary)

1. **RDS (PostgreSQL)** — create instance, note endpoint, user, password, database name. Run migrations implicitly: first Lambda cold start runs [`initializeDatabase`](simple-server/config/database.js) if the DB is empty (same as local). Ensure **Lambda can reach RDS** (VPC + subnets + security groups).
2. **Lambda** — runtime **Node.js 20.x**, handler **`lambda.handler`**, upload zip from [`npm run package:lambda`](simple-server/package.json) (artifact `simple-server/lambda-deploy.zip`). Set environment: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, `CORS_ORIGINS`.
3. **API Gateway (REST)** — **proxy integration** (or ANY `{proxy+}`) to the Lambda. Enable **CORS** on the API as needed. Copy the **Invoke URL** for `VITE_API_URL`.
4. **Amplify** — New app → Host web app → connect **this GitHub repo**. Amplify uses root [`amplify.yml`](amplify.yml). Add **`VITE_API_URL`** in Amplify → Environment variables.

### GitHub Actions (after `main` is protected and secrets exist)

| Workflow | Purpose |
|----------|---------|
| [`.github/workflows/run-integration-tests.yml`](.github/workflows/run-integration-tests.yml) | Postgres service + `npm run test:integration` |
| [`.github/workflows/deploy-aws-lambda.yml`](.github/workflows/deploy-aws-lambda.yml) | Package zip → `aws lambda update-function-code` |
| [`.github/workflows/deploy-aws-amplify.yml`](.github/workflows/deploy-aws-amplify.yml) | `npm run build` sanity check → `aws amplify start-job` |

**Repository secrets** (Settings → Secrets and variables → Actions): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `LAMBDA_FUNCTION_NAME`, `AMPLIFY_APP_ID`, `AMPLIFY_BRANCH` (e.g. `main`), and optionally `VITE_API_URL` so the Action build matches production.

Use an IAM user or OIDC role limited to Lambda update, Amplify start-job, and (for setup) API Gateway/RDS administration. See [GitHub: use secrets with GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).

### Integration tests and cloud

- **Spec (English + table):** [`docs/INTEGRATION_TEST_SPEC.md`](docs/INTEGRATION_TEST_SPEC.md)
- **Local + DB:** `cd simple-server && npm run test:integration`
- **Against deployed API:** set `INTEGRATION_TEST_API_URL` to the API Gateway base URL, then run the same command (see spec).

### Package Lambda locally

```bash
cd simple-server
npm ci
npm run package:lambda
# Upload simple-server/lambda-deploy.zip in the Lambda console or via AWS CLI
```

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
