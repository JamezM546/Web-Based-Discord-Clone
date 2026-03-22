# Reviewer's Guide — P4: Backend Development

## Setup

```powershell
git clone https://github.com/JamezM546/Web-Based-Discord-Clone.git
cd Web-Based-Discord-Clone
git checkout p4-backend-implementation
docker-compose up --build
```

Wait for:
- `discord_clone_db | database system is ready to accept connections`
- `discord_clone_backend | Simple server running on port 3001`
- `discord_clone_frontend | VITE ready`

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Frontend |
| http://localhost:3001/api | Backend API |
| http://localhost:3001/api/docs | Interactive API docs |
| http://localhost:3001/health | Health check |

---

## Demo Accounts

| Email | Password | Username |
|---|---|---|
| nafisa@example.com | password123 | nafisa |
| ashraf@example.com | password123 | ashraf |
| salma@example.com | password123 | salma |
| elvis@example.com | password123 | elvis |
| james@example.com | password123 | james |

---

## Visual Testing Checklist

### User Story 1 — Manual Summary On Demand

- [ ] Log in, open "Team Project" server > #general channel
- [ ] Click the summary button in the message area header
- [ ] Select a time range (use "1 week" to capture seed data)
- [ ] Verify the modal shows: overview text, key topics, most active users, important messages, stats
- [ ] Change time range — summary regenerates
- [ ] Close and reopen — works consistently
- [ ] Backend: POST /api/summaries/manual with {channelId: "c1", hours: 168} returns a full summary
- [ ] Access control: a user NOT in the server gets 403

### User Story 2 — What You Missed Preview

- [ ] Log in as nafisa, open a channel with existing messages
- [ ] Look for the "What You Missed" bar at the top of the message area
- [ ] Expand it — shows a preview summary
- [ ] Dismiss it — bar disappears, messages marked as read
- [ ] To force new unread: log in as a different user in a second tab, send a message, then go back to the first tab and navigate to that channel
- [ ] Backend: GET /api/summaries/preview?channelId=c1 returns preview + unread count
- [ ] Access control: a user NOT in the server gets 403

### User Story 3 — Server Search

- [ ] Use the search bar in the server sidebar
- [ ] Type "gaming" — shows "Gaming Squad"
- [ ] Type "study" — shows "Study Group"
- [ ] Type "nonexistent" — shows "No spaces found"
- [ ] Clear search — returns to normal server list
- [ ] Backend: GET /api/servers/search?q=gaming returns only servers the user is a member of

### Authentication

- [ ] Register a new account — verify it works
- [ ] Login with demo credentials — verify token returned
- [ ] All protected endpoints reject requests without a valid JWT (401)
- [ ] Invalid token returns 403

### Servers & Channels

- [ ] Create a new server — verify #general channel is auto-created
- [ ] Server appears in the sidebar
- [ ] Create/delete channels within a server
- [ ] Non-members cannot access a server's details (403)

### Direct Messages

- [ ] Open DMs panel, start a conversation with another user
- [ ] Send messages back and forth (test from two tabs/accounts)
- [ ] DM list updates with latest message time

### Friend Requests

- [ ] Send a friend request from one account
- [ ] Accept it from the other account
- [ ] Both users appear in each other's friends list
- [ ] Duplicate/self-request is rejected

### Server Invites

- [ ] From a DM, send a server invite to another user
- [ ] Verify the invite appears as an interactive card (not plain text) in the DM
- [ ] Accept the invite — user is added to the server
- [ ] Decline the invite — status updates, user is NOT added

### Messages & Reactions

- [ ] Send, edit, delete messages in a channel
- [ ] Toggle emoji reactions on messages
- [ ] Reply to a message (threaded reply)

### Multi-User Concurrency (10 simultaneous users)

- [ ] Open 5-10 browser tabs at http://localhost:5173
- [ ] Log into different accounts in each (use private/incognito windows)
- [ ] Send messages from one tab, refresh another tab on the same channel to verify
- [ ] Demonstrates backend handles concurrent connections

---

## Automated Tests

**Recommended (works even if `localhost:5432` is wrong or busy):** run tests inside Docker Compose so the app uses hostname `postgres`:

```powershell
cd Web-Based-Discord-Clone
npm run test:backend
```

Or from `simple-server`:

```powershell
cd Web-Based-Discord-Clone\simple-server
npm run test:docker
```

**Host-only** (needs Docker Postgres published on `localhost:5432` and no conflicting local PostgreSQL):

```powershell
cd Web-Based-Discord-Clone\simple-server
npm install
npm test
```

Expected: 10 suites, 65 tests, all passing.

| Test File | Covers |
|---|---|
| summaries.test.js | US1 manual summary, US2 preview, 403 access control |
| serverSearch.test.js | US3 search, member-only filter, pagination |
| auth.test.js | Register, login, token validation |
| servers.test.js | Server CRUD, member access, non-member 403 |
| channels.test.js | Channel CRUD |
| messages.test.js | Message CRUD, reactions |
| directMessages.test.js | DM list, create |
| friends.test.js | Friend request lifecycle |
| invites.test.js | Server invite lifecycle |
| users.test.js | User search, profile, status |

To run a single suite:
```powershell
npx jest --runInBand --forceExit tests/summaries.test.js
```

To run tests inside Docker (same as `npm run test:backend`):
```powershell
docker compose run --rm backend sh -c "npm install && npm test"
```
(`npm install` is required inside the container because `/app/node_modules` is a Docker volume and may not contain Jest.)

---

## Documentation Index

| Document | Path |
|---|---|
| Backend README | simple-server/README.md |
| Module Specifications (10 modules, 8 sections each) | docs/backend_module_specifications.md |
| Unified Architecture | docs/architecture/unified_backend_architecture.md |
| Manual Summary Dev Spec (US1) | docs/dev-specs/manual_summary_dev_spec_v2.md |
| What You Missed Dev Spec (US2) | docs/dev-specs/automatic_summary_feature_dev_spec_v2.md |
| Server Search Dev Spec (US3) | docs/dev-specs/search_bar_dev_spec_v2.md |
| Reflection (~500 words) | docs/reflection.md |
| Rendered Diagrams (14 PNGs) | docs/diagrams/rendered/ |
| Mermaid Sources (14 .mmd files) | docs/diagrams/ and docs/architecture/ |

---

## Key Backend Files

| File | Purpose |
|---|---|
| simple-server/server.js | Express app entry point, route registration, startup |
| simple-server/config/database.js | PostgreSQL connection pool, table creation |
| simple-server/middleware/auth.js | JWT authentication middleware |
| simple-server/utils/validation.js | Joi request validation schemas |
| simple-server/models/User.js | User model (CRUD, friends, servers) |
| simple-server/models/Server.js | Server model (CRUD, members, search) |
| simple-server/models/Channel.js | Channel model (CRUD, access control) |
| simple-server/models/Message.js | Message model (CRUD, reactions, search) |
| simple-server/services/summaryService.js | SummaryService + SummarizationProvider (mocked LLM) |
| simple-server/services/userService.js | Auth logic, token generation, demo accounts |
| simple-server/services/seedData.js | Demo data population (idempotent) |
| simple-server/routes/auth.js | POST /register, /login, GET /me |
| simple-server/routes/users.js | User search, profile, status |
| simple-server/routes/server.js | Server CRUD + search |
| simple-server/routes/channel.js | Channel CRUD |
| simple-server/routes/messages.js | Message CRUD + reactions |
| simple-server/routes/directMessages.js | DM list + create |
| simple-server/routes/summary.js | Manual summary (US1) + preview (US2) |
| simple-server/routes/friends.js | Friend request lifecycle |
| simple-server/routes/serverInvites.js | Server invite lifecycle |

---

## Known Limitations

| Item | Detail | Impact on Grading |
|---|---|---|
| No real-time messaging | Messages use REST, not WebSockets. User must navigate away and back to see new messages from others. | Low — not required by assignment |
| LLM is mocked | SummarizationProvider uses deterministic word-frequency logic, not a real LLM. This is by design per assignment: "In P4, you need to mock any calls to external services." | None — expected |
| No file/image uploads | Messages are text-only | Low — not in user stories |
| No voice channels | Text channels only | Low — not in user stories |
| No real-time sync across tabs | Without WebSockets, two tabs won't auto-sync | Low — architectural, not a bug |
| Dev spec prose partially outdated | Sections 4/9/10 of dev specs describe P3-era frontend-only flows. Mermaid diagrams and backend_module_specifications.md are fully updated. | Low — cosmetic |
| No password reset / account deletion | Auth covers register and login only | Low — not in user stories |
| No rate limiting | Fine for 10 users; not production-ready | None for P4 scope |
| .env.test committed | Contains Docker-local default credentials (postgres123). Not a real secret. | None |

---

## Teardown

```powershell
# Stop containers
docker-compose down

# Stop and delete all data
docker-compose down -v
```
