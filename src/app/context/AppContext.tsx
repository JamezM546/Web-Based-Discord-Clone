import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, Server, Channel, Message, FriendRequest, DirectMessage, ServerInvite } from '../types';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocketService';

/** Trailing slash can confuse some WS stacks; API Gateway URLs are normally `wss://…/stage` with no trailing `/`. */
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';

function activeRoomIdFromSelection(channel: Channel | null, dm: DirectMessage | null): string | null {
  if (channel?.id) return `channel:${channel.id}`;
  if (dm?.id) return `dm:${dm.id}`;
  return null;
}

function mapBackendMessageRowToFrontend(row: any): Message {
  return {
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
  };
}

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
  /** Users typing in the currently selected channel/DM (from WebSocket). */
  typingPeers: { userId: string; username?: string }[];
  notifyTypingStart: () => void;
  notifyTypingStop: () => void;
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
  const [typingPeers, setTypingPeers] = useState<{ userId: string; username?: string }[]>([]);
  const selectionRef = useRef({
    channel: null as Channel | null,
    dm: null as DirectMessage | null,
    user: null as User | null,
  });

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

  useEffect(() => {
    selectionRef.current = {
      channel: selectedChannel,
      dm: selectedDM,
      user: currentUser,
    };
  }, [selectedChannel, selectedDM, currentUser]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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

  const typingClearTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const bumpDmPreviewFromMessageRow = useCallback((row: any) => {
    const dmId = row.dm_id;
    if (!dmId) return;
    const ts = row.timestamp ? new Date(row.timestamp) : new Date();
    setDirectMessages((prev) =>
      prev.map((dm) => (dm.id === dmId ? { ...dm, lastMessageTime: ts } : dm))
    );
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && currentUser?.id && !WS_URL) {
      console.warn(
        '[realtime] VITE_WS_URL is not set — API Gateway WebSocket (auth / joinRoom) is disabled. ' +
          'In Network → WS, `{"type":"connected"}` with a `?token=` URL is Vite HMR, not your backend. ' +
          'Set VITE_WS_URL to the wss://…execute-api… URL from `serverless info`, restart the dev server.'
      );
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!WS_URL || !currentUser?.id) {
      websocketService.disconnect();
      return undefined;
    }

    websocketService.connect(WS_URL, apiService.getToken());
    const unsub = websocketService.subscribe((raw) => {
      const msg = raw as { type?: string; data?: Record<string, unknown> };
      const { type, data } = msg;
      if (!type) return;

      const sel = selectionRef.current;
      const selfId = sel.user?.id;
      const activeRoom = activeRoomIdFromSelection(sel.channel, sel.dm);

      if (type === 'typingStarted' || type === 'typingStopped') {
        const roomId = data?.roomId as string | undefined;
        const uid = data?.userId as string | undefined;
        if (!roomId || !uid || uid === selfId) return;
        if (roomId !== activeRoom) return;
        if (type === 'typingStarted') {
          const uname = data?.username as string | undefined;
          setTypingPeers((prev) => {
            if (prev.some((p) => p.userId === uid)) return prev;
            return [...prev, { userId: uid, username: uname }];
          });
          const existing = typingClearTimeoutsRef.current.get(uid);
          if (existing) clearTimeout(existing);
          const t = setTimeout(() => {
            typingClearTimeoutsRef.current.delete(uid);
            setTypingPeers((prev) => prev.filter((p) => p.userId !== uid));
          }, 6000);
          typingClearTimeoutsRef.current.set(uid, t);
        } else {
          const t = typingClearTimeoutsRef.current.get(uid);
          if (t) clearTimeout(t);
          typingClearTimeoutsRef.current.delete(uid);
          setTypingPeers((prev) => prev.filter((p) => p.userId !== uid));
        }
        return;
      }

      if (type === 'messageCreated' && data && (data as { message?: unknown }).message) {
        const payload = data as { roomId?: string; message: any };
        bumpDmPreviewFromMessageRow(payload.message);
        const roomId = payload.roomId;
        if (!roomId || roomId !== activeRoom) return;
        mergeUsersFromMessageRows([payload.message]);
        setMessages((prev) => {
          const id = payload.message.id as string;
          if (prev.some((m) => m.id === id)) return prev;
          return [...prev, mapBackendMessageRowToFrontend(payload.message)];
        });
        return;
      }

      if (type === 'messageUpdated' && data && (data as { message?: unknown }).message) {
        const payload = data as { roomId?: string; message: any };
        const roomId = payload.roomId;
        if (!roomId || roomId !== activeRoom) return;
        mergeUsersFromMessageRows([payload.message]);
        setMessages((prev) => {
          const mapped = mapBackendMessageRowToFrontend(payload.message);
          return prev.map((m) => (m.id === mapped.id ? { ...m, ...mapped } : m));
        });
        return;
      }

      if (type === 'messageDeleted' && data?.messageId) {
        const roomId = data.roomId as string | undefined;
        if (!roomId || roomId !== activeRoom) return;
        const mid = data.messageId as string;
        setMessages((prev) => prev.filter((m) => m.id !== mid));
        return;
      }

      if (type === 'reactionToggled' && data?.messageId) {
        const roomId = data.roomId as string | undefined;
        if (!roomId || roomId !== activeRoom) return;
        const mid = data.messageId as string;
        const reactions = data.reactions as Message['reactions'];
        if (!reactions) return;
        setMessages((prev) =>
          prev.map((m) => (m.id === mid ? { ...m, reactions } : m))
        );
        return;
      }
    });

    return () => {
      unsub();
      websocketService.disconnect();
    };
  }, [currentUser?.id, mergeUsersFromMessageRows, bumpDmPreviewFromMessageRow]);

  useEffect(() => {
    if (!currentUser?.id || !WS_URL) return;
    const room = activeRoomIdFromSelection(selectedChannel, selectedDM);
    websocketService.syncActiveRoom(room);
  }, [selectedChannel?.id, selectedDM?.id, currentUser?.id]);

  useEffect(() => {
    setTypingPeers([]);
    typingClearTimeoutsRef.current.forEach((t) => clearTimeout(t));
    typingClearTimeoutsRef.current.clear();
  }, [selectedChannel?.id, selectedDM?.id]);

  const notifyTypingStart = useCallback(() => {
    const room = activeRoomIdFromSelection(selectedChannel, selectedDM);
    if (room && websocketService.isAuthenticated()) websocketService.typingStart(room);
  }, [selectedChannel?.id, selectedDM?.id]);

  const notifyTypingStop = useCallback(() => {
    const room = activeRoomIdFromSelection(selectedChannel, selectedDM);
    if (room && websocketService.isAuthenticated()) websocketService.typingStop(room);
  }, [selectedChannel?.id, selectedDM?.id]);

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

  const fetchChannels = async (serverIds: string[]) => {
    try {
      const all = (await Promise.all(serverIds.map((id) => apiService.getChannels(id)))).flat() as any[];
      const transformed: Channel[] = all.map((c: any) => ({
        id: c.id,
        name: c.name,
        serverId: c.server_id || c.serverId,
      }));
      setChannels(transformed);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setChannels([]);
    }
  };

  const fetchUserDirectMessages = useCallback(async () => {
    try {
      const dmRows = await apiService.getDirectMessages();
      const mapped: DirectMessage[] = (dmRows || []).map((row: any) => ({
        id: row.id,
        participants: row.participants,
        lastMessageTime: new Date(row.last_message_time),
      }));
      setDirectMessages(mapped);

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
  }, [upsertUsers]);

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
        setMessages((prev) => [...prev, mapBackendMessageRowToFrontend(row)]);
        // Mark as read immediately when you send — you've seen your own message.
        const key = channelId || dmId;
        if (key) setLastReadMessages((prev) => ({ ...prev, [key]: new Date() }));
        if (dmId) {
          setDirectMessages((prev) =>
            prev.map((dm) => (dm.id === dmId ? { ...dm, lastMessageTime: new Date() } : dm))
          );
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
        setDirectMessages((prev) => {
          if (prev.some((d) => d.id === newDM.id)) return prev;
          return [...prev, newDM];
        });
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
        typingPeers,
        notifyTypingStart,
        notifyTypingStop,
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
