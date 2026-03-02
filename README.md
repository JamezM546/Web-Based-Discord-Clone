# Anaphor

A web-based Discord-inspired communication app with AI-powered conversation summaries. Built with React, Vite, and TypeScript.

## Overview

Anaphor is a modern chat application that reimagines team communication with a distinct design philosophy. It uses **Spaces** (instead of servers), **Rooms** (instead of channels), and features AI-assisted summarization to help users catch up on conversations quickly.

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Login and registration flows |
| **Spaces** | Create, join, and manage Spaces (Discord-style servers) |
| **Rooms** | Text channels within Spaces |
| **Direct Messages** | One-on-one conversations |
| **Messaging** | Send messages with @mentions, replies, emoji reactions |
| **Friends** | Add friends, manage friend requests, view online status |
| **Member List** | View Space members with status indicators |

### AI-Powered Features

| Feature | Scope | Dependencies |
|---------|-------|--------------|
| **Manual AI Summary** | Independent (core user story) | None — trigger via Sparkles button in MessageInput toolbar |
| **What You Missed** | Dependent | Uses same summary logic as Manual AI Summary; auto-triggered when unread messages exist |
| **Server Search** | Independent (additional) | None — search bar in mobile sub-strip and desktop left sidebar |

### Feature Dependency Diagram

```
Manual AI Summary (independent)
    └── What You Missed (dependent — reuses summary logic, auto-triggered on unread)

Server Search (independent)
```

- **Manual AI Summary**: Portal-rendered modal for user-selected time windows. States: loading, empty range, success, error.
- **What You Missed**: Collapsible banner at top of message list when there are unread messages. Includes jump-to-unread and dismiss.
- **Server Search**: Real-time overlay filtering joined Spaces by name. States: idle, loading, results, no results, error.

## Tech Stack

- **Framework**: React 18
- **Build**: Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, MUI
- **Routing**: React Router 7
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Runs the app at `http://localhost:5173` (or the next available port).

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/          # LoginForm, RegisterForm
│   │   ├── channel/       # ChannelList, CreateChannelDialog
│   │   ├── messaging/     # MessageArea, MessageInput, MessageItem,
│   │   │                  # WhatYouMissed, ManualSummary, CustomEmojiPicker
│   │   ├── search/        # ServerSearch
│   │   ├── server/        # ServerList, CreateServerDialog, MemberList,
│   │   │                  # ServerSettings, InvitePeopleDialog
│   │   ├── user/          # UserSidebar, UserProfile, FriendsList,
│   │   │                  # AddFriendDialog, DMList
│   │   └── ui/            # shadcn-style primitives
│   ├── context/           # AppContext (mock data + state)
│   ├── pages/             # MainLayout, MockupsPage
│   ├── types.ts           # User, Server, Channel, Message, etc.
│   ├── routes.tsx
│   └── App.tsx
├── styles/
└── main.tsx
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Login (default) |
| `/login` | Login |
| `/register` | Registration |
| `/channels` | Main app — Spaces, Rooms, DMs, messaging |
| `/mockups` | Design spec mockups (Server Search, What You Missed, Manual AI Summary) |
| `*` | Fallback to Login |

## Design Spec Mockups

Visit `/mockups` for static, read-only design specifications documenting:

1. **Server Search** — Idle, loading, results, no results, error states
2. **What You Missed** — Collapsed, expanded, no-unread, dismissed states
3. **Manual AI Summary** — Trigger, loading, empty range, error, success states

## Data

The app currently uses **mock data** defined in `AppContext.tsx`. No backend or API is required to run the application.

## License

Private project.
