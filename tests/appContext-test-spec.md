# AppContext.tsx Test Specification

## List of Functions

### Helper Functions
1. `mapBackendMessageRowToFrontend(row: any): Message`
2. `mergeUsersFromMessageRows(rows: any[]): void`
3. `upsertUsers(incoming: User[]): void`

### Backend Fetch Functions
4. `fetchUserServers(): Promise<void>`
5. `fetchChannels(serverIds: string[]): Promise<void>`
6. `fetchUserDirectMessages(): Promise<void>`
7. `fetchFriends(): Promise<void>`
8. `fetchFriendRequests(): Promise<void>`
9. `fetchPendingInvites(): Promise<void>`

### Authentication Functions
10. `checkAuth(): Promise<void>`
11. `login(email: string, password: string): Promise<boolean>`
12. `register(username: string, email: string, password: string): Promise<boolean>`
13. `logout(): void`

### Server Management Functions
14. `createServer(name: string, icon: string): Promise<void>`
15. `deleteServer(serverId: string): Promise<void>`
16. `updateServer(serverId: string, name: string, icon: string): Promise<void>`
17. `sendServerInvite(serverId: string, userId: string): Promise<void>`
18. `acceptServerInvite(inviteId: string): Promise<void>`
19. `declineServerInvite(inviteId: string): Promise<void>`

### Channel Management Functions
20. `createChannel(serverId: string, name: string): Promise<void>`

### Message Functions
21. `sendMessage(content: string, channelId?: string, dmId?: string, replyToId?: string, serverInviteId?: string): Promise<void>`
22. `editMessage(messageId: string, newContent: string): Promise<void>`
23. `deleteMessage(messageId: string): Promise<void>`
24. `toggleReaction(messageId: string, emoji: string): Promise<void>`

### Friend Management Functions
25. `sendFriendRequest(toUserId: string): Promise<void>`
26. `acceptFriendRequest(requestId: string): Promise<void>`
27. `rejectFriendRequest(requestId: string): Promise<void>`

### Direct Message Functions
28. `createDirectMessage(userId: string): Promise<void>`

### User Profile Functions
29. `updateUserStatus(status: User['status']): void`
30. `updateUserProfile(displayName?: string, avatar?: string): void`

### Read State Functions
31. `markAsRead(channelId?: string, dmId?: string): void`
32. `getUnreadCount(channelId?: string, dmId?: string): number`
33. `getUnreadMessages(channelId?: string, dmId?: string): Message[]`

### Utility Functions
34. `getFriends(): User[]`
35. `setReplyingTo(message: Message | null): void`

---

## Baseline Test Cases

| Ref # | Test Purpose | Test Inputs | Expected Output |
|:---:|--------------|------------|-----------------|
| **Helper** | | | |
| 1 | Transform backend message row to frontend format | Mock backend database row | Returns properly formatted `Message` object |
| 2 | Merge users from message rows into state | Array of backend message objects | Users extracted and stored in local users state |
| 3 | Upsert users (add/update) | Array of `User` objects | Users state updated without duplicates |
| **Fetch** | | | |
| 4 | Fetch user servers successfully | Valid authentication state | Servers state populated via API |
| 5 | Fetch channels for multiple servers | `["s1", "s2"]` | Channels state populated via API |
| 6 | Fetch user direct messages | Valid authentication state | DirectMessages state populated via API |
| 7 | Fetch friends successfully | Valid authentication state | Friends state populated via API |
| 8 | Fetch friend requests successfully | Valid authentication state | FriendRequests state populated via API |
| 9 | Fetch pending invites successfully | Valid authentication state | ServerInvites state populated via API |
| **Auth** | | | |
| 10 | Check auth with valid token | Valid session | CurrentUser state set, subsequent fetches triggered |
| 11 | Login with valid credentials | `email: "test@example.com", password: "password123"` | Returns `true`, CurrentUser state set |
| 12 | Register with valid data | `username: "newuser", email: "new@example.com", password: "password123"` | Returns `true`, CurrentUser state set |
| 13 | Logout function call | No parameters | CurrentUser set to `null`, all context states cleared |
| **Server** | | | |
| 14 | Create server successfully | `name: "New Server", icon: "🎯"` | Server created via API, servers state updated |
| 15 | Delete server successfully | `serverId: "s1"` | Server deleted via API, removed from servers state |
| 16 | Update server successfully | `serverId: "s1", name: "Updated Name", icon: "🎮"` | Server updated via API, servers state updated |
| 17 | Send server invite successfully | `serverId: "s1", userId: "u2"` | API call made to send server invite |
| 18 | Accept server invite successfully | `inviteId: "inv1"` | API call made to accept, removed from serverInvites state |
| 19 | Decline server invite successfully | `inviteId: "inv1"` | API call made to decline, removed from serverInvites state |
| **Channel** | | | |
| 20 | Create channel successfully | `serverId: "s1", name: "general"` | Channel created via API, channels state updated |
| **Message** | | | |
| 21 | Send message successfully | `content: "Hello", channelId: "c1"` | Message created via API formatting properly into a single object |
| 22 | Edit message successfully | `messageId: "m1", newContent: "Updated"` | Message updated via API |
| 23 | Delete message successfully | `messageId: "m1"` | Message deleted via API |
| 24 | Toggle reaction successfully | `messageId: "m1", emoji: "👍"` | Reaction toggled via API |
| **Friends** | | | |
| 25 | Send friend request successfully | `toUserId: "u2"` | API call made to send friend request |
| 26 | Accept friend request successfully | `requestId: "req1"` | API call made, request removed from pending state |
| 27 | Reject friend request successfully | `requestId: "req1"` | API call made, request removed from pending state |
| **DM** | | | |
| 28 | Create direct message successfully | `userId: "u2"` | DM created via API, directMessages state updated |
| **Profile** | | | |
| 29 | Update user status | `status: "dnd"` | CurrentUser state updated synchronously, API called |
| 30 | Update user profile | `displayName: "New", avatar: "pic.png"` | CurrentUser state updated synchronously, API called |
| **Read St.** | | | |
| 31 | Mark channel/DM as read | `channelId: "c1"` | Read state updated (unread count equals 0) |
| 32 | Get unread count | `channelId: "c1"` | Returns numerical count (`>= 0`) |
| 33 | Get unread messages | `channelId: "c1"` | Returns array of unread `Message` objects |
| **Utility** | | | |
| 34 | Get friends | Initialized context state | Returns array of `User` objects |
| 35 | Set replying to message | `Message` object or `null` | ReplyingTo state correctly updated or cleared |