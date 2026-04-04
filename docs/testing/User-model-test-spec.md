# Test specification: `simple-server/models/User.js`

## Purpose

The `User` model encapsulates SQL access for user records: create, lookup, profile/status updates, related lists (servers, DMs, friends), and delete. Unit tests mock `pool.query` from `config/database` so tests do not require PostgreSQL.

## Functions under test (static methods)

| Method | Role |
|--------|------|
| `User.create(userData)` | INSERT user; map unique violations to domain errors. |
| `User.findByEmail(email, includePassword?)` | SELECT by email; optionally include `password_hash`. |
| `User.findByUsername(username)` | SELECT by username. |
| `User.findById(id)` | SELECT public columns by id. |
| `User.updateStatus(id, status)` | UPDATE status. |
| `User.updateProfile(id, updates)` | UPDATE allowed columns; error if none valid. |
| `User.getServers(userId)` | JOIN servers for member. |
| `User.getDirectMessages(userId)` | SELECT DM rows for participant. |
| `User.getFriends(userId)` | SELECT accepted friends. |
| `User.delete(id)` | DELETE user; return boolean by `rowCount`. |

## Test table

| # | Purpose | Inputs / mock `pool.query` | Expected output / behavior |
|---|---------|---------------------------|----------------------------|
| 1 | `create` returns inserted row | Resolves `{ rows: [{ id: '1', username: 'U' }] }` | Resolves to first row; `pool.query` called with INSERT. |
| 2 | `create` maps username conflict | Rejects with `{ code: '23505', constraint: 'users_username_unique' }` | Rejects `Error('Username already exists')`. |
| 3 | `create` maps email conflict | Rejects with `{ code: '23505', constraint: 'users_email_unique' }` | Rejects `Error('Email already exists')`. |
| 4 | `create` rethrows other DB errors | Rejects with `{ code: '23505', constraint: 'other' }` | Rejects with same error. |
| 5 | `findByEmail` without password | `includePassword = false` | Query text omits raw `SELECT *` password path; returns row. |
| 6 | `findByEmail` with password | `includePassword = true` | Query is `SELECT *`; returns row with hash. |
| 7 | `findByUsername` | email-style row | Returns `rows[0]`. |
| 8 | `findById` | normal row | Returns row. |
| 9 | `updateStatus` | RETURNING row | Returns updated row. |
| 10 | `updateProfile` with valid fields | `updates = { display_name: 'X' }` | Builds UPDATE with `display_name`; returns row. |
| 11 | `updateProfile` rejects empty updates | `updates = { unknown: 1 }` | Rejects `Error('No valid fields to update')`. |
| 12 | `getServers` | multiple rows | Returns `rows` array. |
| 13 | `getDirectMessages` | rows | Returns `rows`. |
| 14 | `getFriends` | rows | Returns `rows`. |
| 15 | `delete` removes row | `{ rowCount: 1 }` | Resolves `true`. |
| 16 | `delete` no row | `{ rowCount: 0 }` | Resolves `false`. |
| 17 | `findByEmail` propagates query failure | `pool.query` rejects | Method rejects with same error. |

## Path / exception coverage goals

- Unique-violation branches in `create`.
- `updateProfile` guard when no allowed keys.
- `delete` truthy/falsy `rowCount`.

Target: **≥80%** statement/branch coverage on `models/User.js` when running Jest with coverage for this file.
