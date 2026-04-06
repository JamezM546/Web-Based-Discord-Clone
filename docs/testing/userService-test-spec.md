# Test specification: `simple-server/services/userService.js`

## Purpose

This module implements core authentication-related business logic: password hashing (internal), demo account seeding, JWT issuance (internal), user registration, login, and simple user lookups. Unit tests mock `User` (database layer), `bcryptjs`, and `jsonwebtoken` so no database or network is required.

## Functions under test (exported)

| Symbol | Role |
|--------|------|
| `registerUser(userData)` | Hash password, create user via `User.create`, return `{ user, token }`. |
| `loginUser(loginData)` | Load user by email (with hash), verify password, return public user + token. |
| `getUserById(id)` | Delegate to `User.findById`. |
| `getAllUsers()` | Return empty list (stub for development). |
| `initializeDemoAccounts()` | If demo email is absent, insert fixed demo users via `User.create`. |

Internal helpers `hashPassword`, `verifyPassword`, and `generateToken` are covered indirectly through the exported functions.

## Test table

| # | Purpose | Inputs | Expected output / behavior |
|---|---------|--------|---------------------------|
| 1 | `registerUser` succeeds for valid data | `userData = { username: 'newuser', email: 'new@test.com', password: 'secret12' }`; mock `bcrypt.hash` → `'hash'`; mock `User.create` → created row; mock `jwt.sign` → `'tok'` | Resolves to `{ user: createdRow, token: 'tok' }`; `User.create` called with `passwordHash: 'hash'`. |
| 2 | `loginUser` succeeds when credentials match | `loginData = { email: 'a@b.com', password: 'x' }`; `User.findByEmail(email, true)` → row with `password_hash`; `bcrypt.compare` → `true`; `User.findByEmail(email, false)` → public user; `jwt.sign` → `'tok'` | Resolves to `{ user: publicUser, token: 'tok' }`. |
| 3 | `loginUser` throws when email unknown | `findByEmail(..., true)` → `undefined` | Rejects with `Error` message `Invalid email or password`. |
| 4 | `loginUser` throws when password wrong | User row present; `bcrypt.compare` → `false` | Rejects with `Invalid email or password`. |
| 5 | `getUserById` delegates | `id = '42'`; `User.findById` → `{ id: '42' }` | Resolves to `{ id: '42' }`. |
| 6 | `getAllUsers` returns stub | (none) | Resolves to `[]`. |
| 7 | `initializeDemoAccounts` skips when demo exists | `User.findByEmail('nafisa@example.com')` → `{}` | `User.create` not called. |
| 8 | `initializeDemoAccounts` seeds when missing | `User.findByEmail` → `null`; `User.create` resolves each time | `User.create` called 5 times with expected demo emails. |
| 9 | `initializeDemoAccounts` swallows errors | `User.findByEmail` throws `new Error('db down')` | Resolves without throwing; error path exercised (demo init failure). |

## Path / exception coverage goals

- All branches in `loginUser` (missing user, bad password, success).
- Both branches of `initializeDemoAccounts` (demo present vs absent).
- `try/catch` in `initializeDemoAccounts` for resilience.

Target: **≥80%** statement/branch coverage on `services/userService.js` when running Jest with coverage for this file.
