# Integration test specification (P6)

This document describes **end-to-end API pathways** the React client exercises via `apiService.ts`: the browser (or test client) sends HTTP requests; the Express backend validates auth and reads/writes PostgreSQL.

## Functionality covered

| Area | Description |
|------|-------------|
| Health | Unauthenticated `GET /health` for uptime checks. |
| Authentication | `POST /api/auth/login` returns a JWT used on later calls. |
| Servers | `GET /api/servers` lists servers for the logged-in user. |
| Channels | `GET /api/channels/server/:serverId` lists channels after the user has server access. |

## Test table

| Purpose | Inputs | Expected output (pass) |
|---------|--------|-------------------------|
| Health responds | `GET /health` | `200`, JSON `success: true`. |
| Demo login | `POST /api/auth/login` body `{ email, password }` for seeded user | `200`, `data.token` present. |
| List servers after login | `GET /api/servers` with `Authorization: Bearer <token>` | `200`, `data.servers` is an array. |
| List channels for a server | Valid `serverId` from previous response, same Bearer token | `200`, `data.channels` is an array. |
| Deployed health (cloud only) | `INTEGRATION_TEST_API_URL` set; `GET {base}/health` | Same as localhost health. |
| Deployed login + servers | Same as above against API Gateway URL | Same as localhost contract. |

## Automated implementation

| Spec rows | File |
|-----------|------|
| Health, login, servers, channels (localhost + DB) | `simple-server/tests/integration/api.contract.integration.test.js` |
| Health, login, servers (cloud; skipped unless `INTEGRATION_TEST_API_URL` is set) | `simple-server/tests/integration/deployed-api.integration.test.js` |

Run localhost integration tests (PostgreSQL required):

```bash
cd simple-server
npm run test:integration
```

Run cloud tests (after Lambda + API Gateway + DB are deployed and seeded):

```bash
cd simple-server
set INTEGRATION_TEST_API_URL=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/STAGE
npm run test:integration
```

On Unix: `export INTEGRATION_TEST_API_URL=...`.
