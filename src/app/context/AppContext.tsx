import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Server, Channel, Message, FriendRequest, DirectMessage, ServerInvite, TypingUser } from '../types';
import { apiService } from '../services/apiService';
import { RealtimeEnvelope, websocketService } from '../services/websocketService';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  servers: Server[];
  channels: Channel[];
  messages: Message[];
  friendRequests: FriendRequest[];
  directMessages: DirectMessage[];
  serverInvites: ServerInvite[];
  selectedServer: Server | null;
  selectedChannel: Channel | null;
  selectedDM: DirectMessage | null;
  lastReadMessages: Record<string, Date>;
  replyingTo: Message | null;
  getTypingUsers: (channelId?: string, dmId?: string) => User[];
  notifyTypingActivity: (params: { channelId?: string; dmId?: string; isTyping: boolean }) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setSelectedServer: (server: Server | null) => void;
  setSelectedChannel: (channel: Channel | null) => void;
  setSelectedDM: (dm: DirectMessage | null) => void;
  createServer: (name: string, icon: string) => void;
  deleteServer: (serverId: string) => void;
  leaveServer: (serverId: string) => void;
  updateServer: (serverId: string, name: string, icon: string) => void;
  sendServerInvite: (serverId: string, userId: string) => void;
  acceptServerInvite: (inviteId: string) => void;
  declineServerInvite: (inviteId: string) => void;
  createChannel: (serverId: string, name: string) => void;
  updateChannel: (channelId: string, updates: { name?: string; position?: number }) => void;
  deleteChannel: (channelId: string) => void;
  sendMessage: (content: string, channelId?: string, dmId?: string, replyToId?: string, serverInviteId?: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  sendFriendRequest: (toUserId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => Promise<void>;
  getFriends: () => User[];
  createDirectMessage: (userId: string) => void;
  updateUserStatus: (status: User['status']) => void;
  updateUserProfile: (displayName?: string, avatar?: string) => void;
  markAsRead: (channelId?: string, dmId?: string) => void;
  getUnreadCount: (channelId?: string, dmId?: string) => number;
  getUnreadMessages: (channelId?: string, dmId?: string) => Message[];
  setReplyingTo: (message: Message | null) => void;
  refreshFriends: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [serverInvites, setServerInvites] = useState<ServerInvite[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);
  const [lastReadMessages, setLastReadMessages] = useState<Record<string, Date>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [typingUsersByRoom, setTypingUsersByRoom] = useState<Record<string, TypingUser[]>>({});
  const sortDirectMessagesByActivity = useCallback((items: DirectMessage[]) => {
    return [...items].sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, []);

  // ── Helpers for per-user localStorage read-state ───────────────────────────
  const readStateKey = (userId: string) => `lastReadMessages_${userId}`;

  const loadReadState = (userId: string): Record<string, Date> => {
    try {
      const stored = localStorage.getItem(readStateKey(userId));
      if (!stored) return {};
      const parsed: Record<string, string> = JSON.parse(stored);
      const result: Record<string, Date> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) result[k] = d;
      }
      return result;
    } catch {
      return {};
    }
  };

  const saveReadState = (userId: string, state: Record<string, Date>) => {
    try {
      const serialisable: Record<string, string> = {};
      for (const [k, d] of Object.entries(state)) {
        serialisable[k] = d instanceof Date ? d.toISOString() : String(d);
      }
      localStorage.setItem(readStateKey(userId), JSON.stringify(serialisable));
    } catch { /* localStorage unavailable */ }
  };

  // Persist whenever read state or current user changes
  useEffect(() => {
    if (currentUser?.id) saveReadState(currentUser.id, lastReadMessages);
  }, [lastReadMessages, currentUser?.id]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const mapBackendMessageRowToFrontend = (row: any): Message => ({
    id: row.id,
    content: row.content,
    authorId: row.author_id,
    channelId: row.channel_id || undefined,
    dmId: row.dm_id || undefined,
    timestamp: new Date(row.timestamp),
    edited: !!row.edited,
    replyToId: row.reply_to_id || undefined,
    serverInviteId: row.server_invite_id || undefined,
    reactions: row.reactions || undefined,
  });

  const getRoomId = (channelId?: string, dmId?: string) => {
    if (channelId) return `channel:${channelId}`;
    if (dmId) return `dm:${dmId}`;
    return null;
  };

  const getServerRoomId = (serverId?: string) => {
    if (!serverId) return null;
    return `server:${serverId}`;
  };

  const upsertMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex === -1) {
        return [...prev, message];
      }

      return prev.map((m) => (m.id === message.id ? { ...m, ...message } : m));
    });
  }, []);

  const upsertDirectMessage = useCallback((dm: DirectMessage) => {
    setDirectMessages((prev) => {
      const next = prev.some((item) => item.id === dm.id)
        ? prev.map((item) => (item.id === dm.id ? { ...item, ...dm } : item))
        : [...prev, dm];

      return sortDirectMessagesByActivity(next);
    });
  }, [sortDirectMessagesByActivity]);

  const mergeUsersFromMessageRows = useCallback((rows: any[]) => {
    if (!rows || rows.length === 0) return;

    const authorUsers: User[] = rows
      .filter((r) => r.author_id && r.username)
      .map((r) => ({
        id: r.author_id,
        username: r.username,
        displayName: r.display_name || undefined,
        email: '',
        avatar: r.avatar,
        status: (r.status || 'online') as User['status'],
      }));

    if (authorUsers.length === 0) return;

    setUsers((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      for (const u of authorUsers) {
        if (!map.has(u.id)) map.set(u.id, u);
      }
      return Array.from(map.values());
    });
  }, []);

  const upsertUsers = useCallback((incoming: User[]) => {
    if (incoming.length === 0) return;
    setUsers((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      for (const u of incoming) {
        map.set(u.id, u);
      }
      return Array.from(map.values());
    });
  }, []);

  const fetchUserDirectMessages = useCallback(async () => {
    try {
      const dmRows = await apiService.getDirectMessages();
      const mapped: DirectMessage[] = (dmRows || []).map((row: any) => ({
        id: row.id,
        participants: row.participants,
        lastMessageTime: new Date(row.last_message_time),
      }));
      setDirectMessages(sortDirectMessagesByActivity(mapped));

      const otherUsers: User[] = (dmRows || [])
        .filter((r: any) => r.other_user_id && r.username)
        .map((r: any) => ({
          id: r.other_user_id,
          username: r.username,
          displayName: r.display_name || undefined,
          email: '',
          avatar: r.avatar,
          status: (r.status || 'online') as User['status'],
        }));
      upsertUsers(otherUsers);
    } catch (error) {
      console.error('Failed to fetch direct messages:', error);
    }
  }, [sortDirectMessagesByActivity, upsertUsers]);

  const getTypingUsers = useCallback((channelId?: string, dmId?: string) => {
    const roomId = getRoomId(channelId, dmId);
    if (!roomId) return [];

    const typingUsers = typingUsersByRoom[roomId] || [];
    return typingUsers
      .map((typingUser) => users.find((u) => u.id === typingUser.userId))
      .filter((user): user is User => !!user);
  }, [typingUsersByRoom, users]);

  const notifyTypingActivity = useCallback((params: { channelId?: string; dmId?: string; isTyping: boolean }) => {
    const roomId = getRoomId(params.channelId, params.dmId);
    if (!roomId) return;

    if (params.isTyping) {
      websocketService.sendTypingStart(roomId);
      return;
    }

    websocketService.sendTypingStop(roomId);
  }, []);

  const handleRealtimeEvent = useCallback((event: RealtimeEnvelope) => {
    switch (event.type) {
      case 'messageCreated': {
        const row = event.data?.message;
        if (!row) return;
        mergeUsersFromMessageRows([row]);
        upsertMessage(mapBackendMessageRowToFrontend(row));

        if (row.dm_id) {
          const existingDm = directMessages.find((dm) => dm.id === row.dm_id);
          if (existingDm) {
            upsertDirectMessage({
              ...existingDm,
              lastMessageTime: new Date(row.timestamp),
            });
          } else {
            void fetchUserDirectMessages();
          }
        }
        return;
      }
      case 'messageUpdated': {
        const row = event.data?.message;
        if (!row) return;
        mergeUsersFromMessageRows([row]);
        upsertMessage(mapBackendMessageRowToFrontend(row));
        return;
      }
      case 'messageDeleted': {
        const messageId = event.data?.messageId;
        if (!messageId) return;
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
        return;
      }
      case 'reactionToggled': {
        const messageId = event.data?.messageId;
        if (!messageId) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? { ...message, reactions: event.data?.reactions || [] }
              : message
          )
        );
        return;
      }
      case 'typingStarted': {
        const roomId = event.data?.roomId;
        const userId = event.data?.userId;
        if (!roomId || !userId || userId === currentUser?.id) return;

        setTypingUsersByRoom((prev) => {
          const roomUsers = prev[roomId] || [];
          if (roomUsers.some((user) => user.userId === userId)) return prev;

          return {
            ...prev,
            [roomId]: [
              ...roomUsers,
              {
                userId,
                username: event.data?.username || null,
              },
            ],
          };
        });
        return;
      }
      case 'typingStopped': {
        const roomId = event.data?.roomId;
        const userId = event.data?.userId;
        if (!roomId || !userId) return;

        setTypingUsersByRoom((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || []).filter((user) => user.userId !== userId),
        }));
        return;
      }
      case 'userStatusChanged': {
        const user = event.data?.user;
        if (!user?.id) return;

        const mappedUser: User = {
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.displayName || undefined,
          email: user.email || '',
          avatar: user.avatar,
          status: (user.status || 'offline') as User['status'],
        };

        upsertUsers([mappedUser]);
        if (currentUser?.id === mappedUser.id) {
          setCurrentUser((prev) => (prev ? { ...prev, ...mappedUser } : prev));
        }
        return;
      }
      case 'friendRequestCreated': {
        const request = event.data?.request;
        if (!request?.id) return;

        const eventUsers: User[] = (event.data?.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.displayName || undefined,
          email: user.email || '',
          avatar: user.avatar,
          status: (user.status || 'offline') as User['status'],
        }));
        upsertUsers(eventUsers);

        const mappedRequest: FriendRequest = {
          id: request.id,
          fromUserId: request.from_user_id,
          toUserId: request.to_user_id,
          status: request.status as FriendRequest['status'],
        };

        setFriendRequests((prev) => {
          const existing = prev.find((item) => item.id === mappedRequest.id);
          if (existing) {
            return prev.map((item) => (item.id === mappedRequest.id ? mappedRequest : item));
          }

          return [mappedRequest, ...prev];
        });
        return;
      }
      case 'friendRequestAccepted': {
        const request = event.data?.request;
        if (!request?.id) return;

        const eventUsers: User[] = (event.data?.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.displayName || undefined,
          email: user.email || '',
          avatar: user.avatar,
          status: (user.status || 'offline') as User['status'],
        }));
        upsertUsers(eventUsers);

        setFriendRequests((prev) => prev.filter((item) => item.id !== request.id));

        const acceptedFriend = eventUsers.find((user) => user.id !== currentUser?.id);
        if (acceptedFriend) {
          setFriends((prev) => {
            if (prev.some((friend) => friend.id === acceptedFriend.id)) {
              return prev.map((friend) =>
                friend.id === acceptedFriend.id ? { ...friend, ...acceptedFriend } : friend
              );
            }

            return [...prev, acceptedFriend];
          });
        }
        return;
      }
      case 'friendRemoved': {
        const removedUserIds = Array.isArray(event.data?.userIds) ? event.data.userIds : [];
        if (!currentUser?.id || removedUserIds.length === 0) return;

        const removedFriendId = removedUserIds.find((userId: string) => userId !== currentUser.id);
        if (!removedFriendId) return;

        const eventUsers: User[] = (event.data?.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.displayName || undefined,
          email: user.email || '',
          avatar: user.avatar,
          status: (user.status || 'offline') as User['status'],
        }));
        upsertUsers(eventUsers);

        setFriends((prev) => prev.filter((friend) => friend.id !== removedFriendId));
        return;
      }
      case 'serverInviteCreated': {
        const invite = event.data?.invite;
        if (!invite?.id) return;

        const mappedInvite: ServerInvite = {
          id: invite.id,
          serverId: invite.server_id,
          fromUserId: invite.from_user_id,
          toUserId: invite.to_user_id,
          status: invite.status as ServerInvite['status'],
          timestamp: new Date(invite.created_at),
          messageId: invite.message_id || undefined,
          serverName: invite.server_name || undefined,
          serverIcon: invite.server_icon || undefined,
        };

        setServerInvites((prev) => {
          const existing = prev.find((item) => item.id === mappedInvite.id);
          if (existing) {
            return prev.map((item) => (item.id === mappedInvite.id ? mappedInvite : item));
          }

          return [mappedInvite, ...prev];
        });
        return;
      }
      case 'serverChannelsUpdated': {
        const serverId = event.data?.serverId;
        const rawChannels = Array.isArray(event.data?.channels) ? event.data.channels : [];
        if (!serverId) return;

        const mappedChannels: Channel[] = rawChannels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          serverId: channel.server_id || channel.serverId || serverId,
        }));

        setChannels((prev) => {
          const otherServerChannels = prev.filter((channel) => channel.serverId !== serverId);
          return [...otherServerChannels, ...mappedChannels];
        });

        if (selectedChannel?.serverId === serverId && selectedChannel?.id) {
          const updatedSelectedChannel = mappedChannels.find((channel) => channel.id === selectedChannel.id) || null;
          setSelectedChannel(updatedSelectedChannel);
        }
        return;
      }
      default:
        return;
    }
  }, [currentUser?.id, directMessages, fetchUserDirectMessages, mergeUsersFromMessageRows, selectedChannel?.id, selectedChannel?.serverId, upsertDirectMessage, upsertMessage, upsertUsers]);

  // ---------------------------------------------------------------------------
  // Backend fetch helpers
  // ---------------------------------------------------------------------------

  const fetchUserServers = useCallback(async () => {
    try {
      const backendResponse = (await apiService.getServers()) as any;
      const serverArray = Array.isArray(backendResponse)
        ? backendResponse
        : backendResponse?.data || backendResponse?.servers || [];

      if (!Array.isArray(serverArray)) throw new Error('Expected an array of servers.');

      const transformed: Server[] = serverArray.map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: s.icon || '📁',
        ownerId: s.owner_id,
        members: s.members || [],
      }));

      setServers(transformed);

      const ids = transformed.map((s) => s.id);
      if (ids.length > 0) await fetchChannels(ids);
    } catch (error) {
      console.error('Failed to fetch user servers:', error);
      setServers([]);
    }
  }, []);

  const fetchChannels = useCallback(async (serverIds: string[]) => {
    if (serverIds.length === 0) return;

    try {
      const all = (await Promise.all(serverIds.map((id) => apiService.getChannels(id)))).flat() as any[];
      const transformed: Channel[] = all.map((c: any) => ({
        id: c.id,
        name: c.name,
        serverId: c.server_id || c.serverId,
      }));

      setChannels((prev) => {
        const serverIdSet = new Set(serverIds);
        const untouchedChannels = prev.filter((channel) => !serverIdSet.has(channel.serverId));
        return [...untouchedChannels, ...transformed];
      });
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      if (serverIds.length === servers.length) {
        setChannels([]);
      }
    }
  }, [servers.length]);

  const fetchFriends = useCallback(async () => {
    try {
      const raw = await apiService.getFriends();
      const mapped: User[] = raw.map((f: any) => ({
        id: f.id,
        username: f.username,
        displayName: f.display_name || undefined,
        email: '',
        avatar: f.avatar,
        status: (f.status || 'offline') as User['status'],
      }));
      setFriends(mapped);
      upsertUsers(mapped);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  }, [upsertUsers]);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const raw = await apiService.getFriendRequests();
      const mapped: FriendRequest[] = raw.map((r: any) => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        status: r.status as FriendRequest['status'],
      }));
      setFriendRequests(mapped);

      const usersFromRequests: User[] = raw.map((r: any) => ({
        id: r.from_user_id,
        username: r.from_username,
        displayName: r.from_display_name || undefined,
        email: '',
        avatar: r.from_avatar,
        status: (r.from_status || 'offline') as User['status'],
      }));
      const toUsers: User[] = raw.map((r: any) => ({
        id: r.to_user_id,
        username: r.to_username,
        displayName: r.to_display_name || undefined,
        email: '',
        avatar: r.to_avatar,
        status: (r.to_status || 'offline') as User['status'],
      }));
      upsertUsers([...usersFromRequests, ...toUsers]);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  }, [upsertUsers]);

  const fetchPendingInvites = useCallback(async () => {
    try {
      const raw = await apiService.getPendingInvites();
      const mapped: ServerInvite[] = raw.map((inv: any) => ({
        id: inv.id,
        serverId: inv.server_id,
        fromUserId: inv.from_user_id,
        toUserId: inv.to_user_id,
        status: inv.status as ServerInvite['status'],
        timestamp: new Date(inv.created_at),
        messageId: inv.message_id || undefined,
        serverName: inv.server_name || undefined,
        serverIcon: inv.server_icon || undefined,
      }));
      setServerInvites((prev) => {
        const map = new Map(prev.map((si) => [si.id, si]));
        for (const si of mapped) map.set(si.id, si);
        return Array.from(map.values());
      });
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Auth: check on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            const u = response.data.user;
            const user: User = {
              id: u.id,
              username: u.username,
              email: u.email,
              avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
              status: (u.status || 'online') as User['status'],
              displayName: u.display_name || undefined,
            };
            setCurrentUser(user);
            upsertUsers([user]);
            // Restore this user's persisted read state before rendering messages
            setLastReadMessages(loadReadState(user.id));

            await Promise.all([
              fetchUserServers(),
              fetchUserDirectMessages(),
              fetchFriends(),
              fetchFriendRequests(),
              fetchPendingInvites(),
            ]);
          }
        } catch (error) {
          console.error('Failed to restore authentication:', error);
          apiService.logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => websocketService.subscribe(handleRealtimeEvent), [handleRealtimeEvent]);

  useEffect(() => {
    const token = apiService.getToken();
    if (!currentUser || !token) {
      websocketService.disconnect();
      return;
    }

    websocketService.connect(token);
    return () => {
      websocketService.disconnect();
    };
  }, [currentUser?.id]);

  // ---------------------------------------------------------------------------
  // Fetch messages when room changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    const run = async () => {
      try {
        if (selectedChannel?.id) {
          const rows = await apiService.getChannelMessages(selectedChannel.id);
          if (cancelled) return;
          mergeUsersFromMessageRows(rows);
          setMessages(rows.map(mapBackendMessageRowToFrontend));
          setReplyingTo(null);
          return;
        }
        if (selectedDM?.id) {
          const rows = await apiService.getDmMessages(selectedDM.id);
          if (cancelled) return;
          mergeUsersFromMessageRows(rows);
          setMessages(rows.map(mapBackendMessageRowToFrontend));
          setReplyingTo(null);
          // Refresh pending invites so newly-received invite cards render
          void fetchPendingInvites();
          return;
        }
        setMessages([]);
        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (!cancelled) setMessages([]);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [selectedChannel?.id, selectedDM?.id, currentUser?.id, mergeUsersFromMessageRows]);

  useEffect(() => {
    const roomId = getRoomId(selectedChannel?.id, selectedDM?.id);
    websocketService.setActiveRoom(roomId);

    return () => {
      if (roomId) {
        websocketService.sendTypingStop(roomId);
      }
    };
  }, [selectedChannel?.id, selectedDM?.id]);

  useEffect(() => {
    websocketService.setServerRoom(getServerRoomId(selectedServer?.id));
  }, [selectedServer?.id]);

  useEffect(() => {
    if (!selectedServer?.id || !currentUser) return;
    void fetchChannels([selectedServer.id]);
  }, [selectedServer?.id, currentUser?.id, fetchChannels]);

  // Load member user objects when a server is selected
  useEffect(() => {
    if (!selectedServer || !currentUser) return;
    let cancelled = false;

    const loadMembers = async () => {
      try {
        const details = await apiService.getServerDetails(selectedServer.id);
        if (cancelled || !details) return;
        const memberUsers: User[] = (details.members || []).map((m: any) => ({
          id: m.id,
          username: m.username,
          displayName: m.displayName || m.display_name || undefined,
          email: '',
          avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`,
          status: (m.status || 'offline') as User['status'],
        }));
        upsertUsers(memberUsers);

        const memberIds = memberUsers.map((u) => u.id);
        setServers((prev) =>
          prev.map((s) => (s.id === selectedServer.id ? { ...s, members: memberIds } : s))
        );
        if (selectedServer) {
          setSelectedServer((prev) => (prev ? { ...prev, members: memberIds } : prev));
        }
      } catch (error) {
        console.error('Failed to load server members:', error);
      }
    };

    void loadMembers();
    return () => { cancelled = true; };
  }, [selectedServer?.id, currentUser?.id, upsertUsers]);

  // ---------------------------------------------------------------------------
  // Server CRUD
  // ---------------------------------------------------------------------------

  const createServer = async (name: string, icon: string) => {
    if (!currentUser) return;
    try {
      const backendResponse = (await apiService.createServer(name, icon)) as any;
      const sd = backendResponse?.data || backendResponse?.server || backendResponse;
      if (!sd || !sd.id) throw new Error('Backend did not return a valid server object.');

      const newServer: Server = {
        id: sd.id,
        name: sd.name,
        icon: sd.icon || icon || '📁',
        ownerId: sd.owner_id || currentUser.id,
        members: [currentUser.id],
      };
      setServers((prev) => [...prev, newServer]);
      setSelectedServer(newServer);
      setSelectedDM(null);
      setSelectedChannel(null);
      setReplyingTo(null);
      try {
        const newChannels = (await apiService.getChannels(newServer.id)) as any[];
        const mapped: Channel[] = newChannels.map((c: any) => ({
          id: c.id,
          name: c.name,
          serverId: c.server_id || c.serverId || newServer.id,
        }));
        setChannels((prev) => [...prev, ...mapped]);
        setSelectedChannel(mapped[0] ?? null);
      } catch (_) { /* ignored */ }
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  };

  const deleteServer = async (serverId: string) => {
    try {
      await apiService.deleteServer(serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      if (selectedServer?.id === serverId) setSelectedServer(null);
      setChannels((prev) => prev.filter((c) => c.serverId !== serverId));
    } catch (error) {
      console.error('Failed to delete server:', error);
      throw error;
    }
  };

  const leaveServer = async (serverId: string) => {
    try {
      await apiService.leaveServer(serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      if (selectedServer?.id === serverId) setSelectedServer(null);
      setChannels((prev) => prev.filter((c) => c.serverId !== serverId));
    } catch (error) {
      console.error('Failed to leave server:', error);
      throw error;
    }
  };

  const updateServer = async (serverId: string, name: string, icon: string) => {
    try {
      await apiService.updateServer(serverId, { name, icon });
      setServers((prev) => prev.map((s) => (s.id === serverId ? { ...s, name, icon } : s)));
      if (selectedServer?.id === serverId) {
        setSelectedServer((prev) => (prev ? { ...prev, name, icon } : prev));
      }
    } catch (error) {
      console.error('Failed to update server:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Server invites (backend-backed)
  // ---------------------------------------------------------------------------

  const sendServerInvite = async (serverId: string, userId: string) => {
    if (!currentUser) return;
    try {
      await apiService.sendServerInvite(serverId, userId);
      await fetchUserDirectMessages();
    } catch (error) {
      console.error('Failed to send server invite:', error);
    }
  };

  const acceptServerInvite = async (inviteId: string) => {
    try {
      await apiService.acceptServerInvite(inviteId);
      setServerInvites((prev) => prev.filter((si) => si.id !== inviteId));
      await fetchUserServers();
    } catch (error) {
      console.error('Failed to accept server invite:', error);
    }
  };

  const declineServerInvite = async (inviteId: string) => {
    try {
      await apiService.declineServerInvite(inviteId);
      setServerInvites((prev) => prev.filter((si) => si.id !== inviteId));
    } catch (error) {
      console.error('Failed to decline server invite:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------

  const createChannel = async (serverId: string, name: string) => {
    try {
      const backendResponse = (await apiService.createChannel(serverId, name)) as any;
      const cd = backendResponse?.data || backendResponse?.channel || backendResponse;
      if (!cd || !cd.id) throw new Error('Backend did not return a valid channel object.');
      const newChannel: Channel = {
        id: cd.id,
        name: cd.name,
        serverId: cd.server_id || cd.serverId || serverId,
      };
      setChannels((prev) => [...prev, newChannel]);
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  };

  const updateChannel = (channelId: string, updates: { name?: string; position?: number }) => {
    if (!currentUser) return;
    void (async () => {
      try {
        const backendResponse = (await apiService.updateChannel(channelId, updates)) as any;
        const cd = backendResponse?.data || backendResponse || {};
        const updated: Channel = {
          id: cd.id || channelId,
          name: cd.name || updates.name || '',
          serverId: cd.server_id || cd.serverId || (channels.find(c => c.id === channelId)?.serverId || ''),
        };
        setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, ...updated } : c)));
        if (selectedChannel?.id === channelId) setSelectedChannel((s) => s ? { ...s, ...updated } : s);
      } catch (error) {
        console.error('Failed to update channel:', error);
      }
    })();
  };

  const deleteChannel = (channelId: string) => {
    if (!currentUser) return;
    void (async () => {
      try {
        await apiService.deleteChannel(channelId);
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        if (selectedChannel?.id === channelId) setSelectedChannel(null);
      } catch (error) {
        console.error('Failed to delete channel:', error);
      }
    })();
  };

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  const sendMessage = (
    content: string,
    channelId?: string,
    dmId?: string,
    replyToId?: string,
    serverInviteId?: string
  ) => {
    if (!currentUser) return;
    void (async () => {
      try {
        const row = await apiService.createMessage({ content, channelId, dmId, replyToId, serverInviteId });
        mergeUsersFromMessageRows([row]);
        upsertMessage(mapBackendMessageRowToFrontend(row));
        // Mark as read immediately when you send — you've seen your own message.
        const key = channelId || dmId;
        if (key) setLastReadMessages((prev) => ({ ...prev, [key]: new Date() }));
        if (dmId) {
          const existingDm = directMessages.find((dm) => dm.id === dmId);
          if (existingDm) {
            upsertDirectMessage({
              ...existingDm,
              lastMessageTime: new Date(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    })();
  };

  const editMessage = (messageId: string, newContent: string) => {
    if (!currentUser) return;
    void (async () => {
      try {
        const row = await apiService.editMessage(messageId, newContent);
        mergeUsersFromMessageRows([row]);
        const mapped = mapBackendMessageRowToFrontend(row);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...mapped } : m)));
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    })();
  };

  const deleteMessage = (messageId: string) => {
    if (!currentUser) return;
    void (async () => {
      try {
        await apiService.deleteMessage(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    })();
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    void (async () => {
      try {
        const { reactions } = await apiService.toggleReaction(messageId, emoji);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
      }
    })();
  };

  // ---------------------------------------------------------------------------
  // Friends (backend-backed)
  // ---------------------------------------------------------------------------

  const sendFriendRequest = async (toUserId: string) => {
    if (!currentUser) return;
    try {
      await apiService.sendFriendRequest(toUserId);
      await fetchFriendRequests();
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await apiService.rejectFriendRequest(requestId);
      await fetchFriendRequests();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;
    try {
      await apiService.removeFriend(friendId);
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const getFriends = useCallback((): User[] => {
    return friends;
  }, [friends]);

  const refreshFriends = fetchFriends;
  const refreshFriendRequests = fetchFriendRequests;

  // ---------------------------------------------------------------------------
  // Direct messages
  // ---------------------------------------------------------------------------

  const createDirectMessage = (userId: string) => {
    if (!currentUser) return;

    const exists = directMessages.find(
      (dm) => dm.participants.includes(currentUser.id) && dm.participants.includes(userId)
    );
    if (exists) {
      setSelectedDM(exists);
      setSelectedServer(null);
      setSelectedChannel(null);
      setReplyingTo(null);
      return;
    }

    void (async () => {
      try {
        const dmRow = await apiService.createDirectMessage(userId);
        const newDM: DirectMessage = {
          id: dmRow.id,
          participants: dmRow.participants,
          lastMessageTime: new Date(dmRow.last_message_time),
        };
        upsertDirectMessage(newDM);
        if (dmRow.other_user_id && dmRow.username) {
          upsertUsers([{
            id: dmRow.other_user_id,
            username: dmRow.username,
            displayName: dmRow.display_name || undefined,
            email: '',
            avatar: dmRow.avatar,
            status: (dmRow.status || 'online') as User['status'],
          }]);
        }
        setSelectedDM(newDM);
        setSelectedServer(null);
        setSelectedChannel(null);
        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to create direct message:', error);
      }
    })();
  };

  // ---------------------------------------------------------------------------
  // User profile / status (backend-backed)
  // ---------------------------------------------------------------------------

  const updateUserStatus = (status: User['status']) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, status };
    setCurrentUser(updatedUser);
    upsertUsers([updatedUser]);
    void apiService.updateStatus(status).catch((e: unknown) => console.error('Failed to update status:', e));
  };

  const updateUserProfile = (displayName?: string, avatar?: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      displayName: displayName || undefined,
      avatar: avatar || currentUser.avatar,
    };
    setCurrentUser(updatedUser);
    upsertUsers([updatedUser]);
    void apiService.updateProfile({ displayName, avatar }).catch((e: unknown) => console.error('Failed to update profile:', e));
  };

  // ---------------------------------------------------------------------------
  // Read state — tracks unread per channel/DM in localStorage (per user)
  // and syncs to the backend on every explicit markAsRead call.
  // ---------------------------------------------------------------------------

  const markAsRead = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId;
    if (!key) return;
    setLastReadMessages((prev) => ({ ...prev, [key]: new Date() }));
    // Persist to backend so summary/preview routes have an accurate "since" baseline.
    // Fire-and-forget — UI should never be blocked by this network call.
    // Optional chaining guards against test mocks that don't include this method.
    apiService.syncReadState?.({ channelId, dmId });
  };

  const getUnreadCount = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId || '';
    const lastRead = lastReadMessages[key];
    const pool = (channelId
      ? messages.filter((m) => m.channelId === channelId)
      : messages.filter((m) => m.dmId === dmId)
    ).filter((m) => m.authorId !== currentUser?.id); // never count own messages as unread
    if (!lastRead) return pool.length;
    return pool.filter((m) => new Date(m.timestamp).getTime() > new Date(lastRead).getTime()).length;
  };

  const getUnreadMessages = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId || '';
    const lastRead = lastReadMessages[key];
    const pool = (channelId
      ? messages.filter((m) => m.channelId === channelId)
      : messages.filter((m) => m.dmId === dmId)
    ).filter((m) => m.authorId !== currentUser?.id); // never count own messages as unread
    if (!lastRead) return pool;
    return pool.filter((m) => new Date(m.timestamp).getTime() > new Date(lastRead).getTime());
  };

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      const u = response.user;
      const user: User = {
        id: u.id,
        username: u.username,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
        status: (u.status || 'online') as User['status'],
        displayName: u.display_name || undefined,
      };
      setCurrentUser(user);
      upsertUsers([user]);
      // Restore this user's persisted read state so WYM only fires for truly new messages
      setLastReadMessages(loadReadState(user.id));

      await Promise.all([
        fetchUserServers(),
        fetchUserDirectMessages(),
        fetchFriends(),
        fetchFriendRequests(),
        fetchPendingInvites(),
      ]);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.register(username, email, password);
      const u = response.user;
      const user: User = {
        id: u.id,
        username: u.username,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
        status: (u.status || 'online') as User['status'],
        displayName: u.display_name || undefined,
      };
      setCurrentUser(user);
      upsertUsers([user]);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    void apiService.logoutFromServer().catch((error: unknown) => {
      console.error('Failed to notify backend during logout:', error);
    });
    apiService.logout();
    websocketService.disconnect();
    setCurrentUser(null);
    setUsers([]);
    setServers([]);
    setChannels([]);
    setMessages([]);
    setFriendRequests([]);
    setDirectMessages([]);
    setServerInvites([]);
    setFriends([]);
    setSelectedServer(null);
    setSelectedChannel(null);
    setSelectedDM(null);
    setTypingUsersByRoom({});
    // Clear in-memory read state but leave the per-user localStorage key intact
    // so the same user's read positions are restored on next login.
    setLastReadMessages({});
  };

  // ---------------------------------------------------------------------------
  // Provider
  // ---------------------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        servers,
        channels,
        messages,
        friendRequests,
        directMessages,
        serverInvites,
        selectedServer,
        selectedChannel,
        selectedDM,
        lastReadMessages,
        replyingTo,
        getTypingUsers,
        notifyTypingActivity,
        isLoading,
        login,
        register,
        logout,
        setSelectedServer,
        setSelectedChannel,
        setSelectedDM,
        createServer,
        deleteServer,
        leaveServer,
        updateServer,
        sendServerInvite,
        acceptServerInvite,
        declineServerInvite,
        createChannel,
        updateChannel,
        deleteChannel,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        getFriends,
        createDirectMessage,
        updateUserStatus,
        updateUserProfile,
        markAsRead,
        getUnreadCount,
        getUnreadMessages,
        setReplyingTo,
        refreshFriends,
        refreshFriendRequests,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
