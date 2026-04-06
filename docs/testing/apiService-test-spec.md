# Test specification: `src/app/services/apiService.ts`

This document describes **unit tests** for the frontend `ApiService` class and its exported singleton `apiService`. Tests use **mocked `fetch`** (no real network) and **mocked `localStorage`** (no real browser persistence). The private method `request` is exercised only through public methods.

**Base URL:** `import.meta.env.VITE_API_URL` when set, otherwise `http://localhost:3001` (see source).

---

## Inventory: public methods on `ApiService`

| # | Method | Notes |
|---|--------|--------|
| 1 | `constructor()` | Reads `localStorage.getItem('jwtToken')` into internal token. |
| 2 | `setToken(token: string)` | Sets in-memory token and `localStorage.setItem('jwtToken', token)`. |
| 3 | `getToken(): string \| null` | Returns current token. |
| 4 | `clearToken()` | Clears token and `localStorage.removeItem('jwtToken')`. |
| 5 | `request` | **Private** — not tested by name; covered via public callers (HTTP path, auth header, errors). |
| 6 | `login(email, password)` | POST `/api/auth/login`; may call `setToken` when `success` and `data.token` exist; returns `data`. |
| 7 | `register(username, email, password)` | POST `/api/auth/register`; same token handling as login; returns `data`. |
| 8 | `getCurrentUser()` | GET `/api/auth/me`; returns full `ApiResponse` from `request`. |
| 9 | `testProtected()` | GET `/api/auth/test-protected`; returns full `ApiResponse`. |
| 10 | `healthCheck()` | GET `/health`; returns full `ApiResponse`. |
| 11 | `getApiInfo()` | GET `/api`; returns full `ApiResponse`. |
| 12 | `isAuthenticated()` | Returns `true` when internal token is set. |
| 13 | `logout()` | Calls `clearToken()`. |
| 14 | `createServer(name, icon?)` | POST `/api/servers`; returns `data`. |
| 15 | `getServers()` | GET `/api/servers`; returns `data.servers` or `[]`. |
| 16 | `getServer(serverId)` | GET `/api/servers/:id`; returns `data.server`. |
| 17 | `updateServer(serverId, updates)` | PUT `/api/servers/:id`; returns `data`. |
| 18 | `deleteServer(serverId)` | DELETE `/api/servers/:id`. |
| 19 | `createChannel(serverId, name)` | POST `/api/channels`; returns `data`. |
| 20 | `getChannels(serverId)` | GET `/api/channels/server/:serverId`; returns `data.channels` or `[]`. |
| 21 | `getChannel(channelId, limit?)` | GET with optional `?limit=`; returns `data.channel`. |
| 22 | `updateChannel(channelId, updates)` | PUT `/api/channels/:id`; returns `data`. |
| 23 | `deleteChannel(channelId)` | DELETE `/api/channels/:id`. |
| 24 | `getChannelMessages(channelId, options?)` | GET with `limit`/`before` query variants; returns `data.messages` or `[]`. |
| 25 | `getDmMessages(dmId, options?)` | Same pattern for DM messages; returns `data.messages` or `[]`. |
| 26 | `createMessage(payload)` | POST `/api/messages`; returns `data.message`. |
| 27 | `editMessage(messageId, content)` | PUT `/api/messages/:id`; returns `data.message`. |
| 28 | `deleteMessage(messageId)` | DELETE `/api/messages/:id`. |
| 29 | `toggleReaction(messageId, emoji)` | POST `/api/messages/:id/reactions/toggle`; returns `{ reactions }` from `data.reactions` or `[]`. |
| 30 | `getDirectMessages()` | GET `/api/direct-messages`; returns `data.directMessages` or `[]`. |
| 31 | `createDirectMessage(userId)` | POST `/api/direct-messages`; returns `data.directMessage`. |
| 32 | `getManualSummary(payload)` | POST `/api/summaries/manual`; returns `data.summary`. |
| 33 | `getPreviewSummary(params)` | GET `/api/summaries/preview` with query string; returns `data.preview`. |
| 34 | `searchUsers(query, limit?)` | GET `/api/users/search`; returns `data.users` or `[]`. |
| 35 | `getUserProfile()` | GET `/api/users/me`; returns `data.user`. |
| 36 | `updateProfile(updates)` | PUT `/api/users/me/profile`; returns `data.user`. |
| 37 | `updateStatus(status)` | PUT `/api/users/me/status`; returns `data.user`. |
| 38 | `getFriends()` | GET `/api/friends`; returns `data.friends` or `[]`. |
| 39 | `getFriendRequests()` | GET `/api/friends/requests`; returns `data.requests` or `[]`. |
| 40 | `sendFriendRequest(toUserId)` | POST `/api/friends/requests`; returns `data.request`. |
| 41 | `acceptFriendRequest(requestId)` | POST `/api/friends/requests/:id/accept`; returns `data.request`. |
| 42 | `rejectFriendRequest(requestId)` | POST `/api/friends/requests/:id/reject`; returns `data.request`. |
| 43 | `getPendingInvites()` | GET `/api/invites/pending`; returns `data.invites` or `[]`. |
| 44 | `sendServerInvite(serverId, toUserId)` | POST `/api/invites`; returns `data.invite`. |
| 45 | `acceptServerInvite(inviteId)` | POST `/api/invites/:id/accept`. |
| 46 | `declineServerInvite(inviteId)` | POST `/api/invites/:id/decline`. |
| 47 | `getServerDetails(serverId)` | GET `/api/servers/:id`; returns `data.server`. |
| 48 | `searchServers(query, limit?)` | GET `/api/servers/search`; returns `data.servers` or `[]`. |

---

## Test cases (by method)

Each row below maps to **at least one** unit test in `src/tests/apiService.test.ts`.

### `constructor`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Load stored JWT on startup | `localStorage` contains `jwtToken` before module load | `getToken()` returns that stored value. |

### `setToken`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Persist token | `setToken('abc')` | `getToken()` is `'abc'`; `localStorage` has `jwtToken`. |

### `getToken`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Read current token | After `setToken` / `clearToken` | Reflects in-memory token. |

### `clearToken`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Remove session | After `setToken` then `clearToken` | `getToken()` is `null`; `jwtToken` removed from storage. |

### `request` (via public API)

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Attach Authorization header | Token set, any authenticated request | `fetch` called with `Authorization: Bearer <token>`. |
| No header when logged out | No token | `fetch` has no `Authorization` header. |
| HTTP error | `response.ok === false` | Throws `Error` with `message` from JSON body or `'Request failed'`. |
| Network failure | `fetch` rejects | Error propagates; `console.error` invoked. |

### `login`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Success with token | `success: true`, `data.token` present | `setToken` called; returns login `data`; `fetch` POST body has email/password. |
| Success without token | `success: true`, `data` without `token` | `getToken()` unchanged after call. |

### `register`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Success with token | Same pattern as login | Token stored; returns register `data`. |

### `getCurrentUser` / `testProtected` / `healthCheck` / `getApiInfo`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Return parsed JSON body | `success: true` mock | Resolves to full `ApiResponse` object. |

### `isAuthenticated`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Reflects token presence | After `setToken` vs `clearToken` | `true` only when token set. |

### `logout`

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Clear session | After `setToken` then `logout` | Same as `clearToken` (no token). |

### Servers, channels, messages, DMs, summaries, users, friends, invites, search

| Purpose | Inputs | Expected |
|--------|--------|----------|
| Correct URL/method/body | Each method’s documented args | `fetch` called with expected path, method, and JSON body where applicable. |
| Correct return mapping | Mock `data` shapes per method | Each method returns the documented slice (`server`, `servers`, `messages`, etc.) or fallback `[]`. |

### Branch-specific (extra coverage)

| Area | Purpose | Expected |
|------|---------|----------|
| `getChannel` | With `limit` | URL includes `?limit=`. |
| `getChannelMessages` / `getDmMessages` | With `before` cursor | URL includes encoded `before` and `limit`. |
| `getPreviewSummary` | `channelId`, `dmId`, `since` | Query string contains those keys when provided. |
| `searchUsers` / `searchServers` | With `limit` | Query includes `limit`. |
| `toggleReaction` | Missing `reactions` in `data` | Returns `{ reactions: [] }`. |

---

## Mocks and isolation

- **`fetch`:** global stub; each test resets or chains `mockResolvedValueOnce` as needed.
- **`localStorage`:** in-memory `Map` implementing `getItem` / `setItem` / `removeItem`.
- **Module reload:** `vi.resetModules()` + dynamic `import()` so `apiService` singleton matches fresh storage per test.
- **No `VITE_API_URL` in most tests:** default base `http://localhost:3001` is asserted unless a dedicated env test runs.

---

## Coverage goal

The Vitest suite is configured to report coverage for `src/app/services/apiService.ts` only (`npm run test:frontend:coverage`). Current runs achieve **100%** statements, branches, functions, and lines for that file.
