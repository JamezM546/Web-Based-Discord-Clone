import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Server, Channel, Message, FriendRequest, DirectMessage, ServerInvite } from '../types';
import { apiService } from '../services/apiService';

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
  updateServer: (serverId: string, name: string, icon: string) => void;
  sendServerInvite: (serverId: string, userId: string) => void;
  acceptServerInvite: (inviteId: string) => void;
  declineServerInvite: (inviteId: string) => void;
  createInviteCode: (serverId: string, opts?: { maxUses?: number; expiresAt?: string | Date }) => Promise<any>;
  getInviteCodes: (serverId: string) => Promise<any[]>;
  resolveInviteCode: (code: string) => Promise<any>;
  deleteInviteCode: (serverId: string, inviteId: string) => Promise<void>;
  joinInviteByCode: (code: string) => Promise<any>;
  createChannel: (serverId: string, name: string) => void;
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
      setSelectedDM(null); // Clear DM selection when creating a new server
      try {
        const newChannels = (await apiService.getChannels(newServer.id)) as any[];
        const mapped: Channel[] = newChannels.map((c: any) => ({
          id: c.id,
          name: c.name,
          serverId: c.server_id || c.serverId || newServer.id,
        }));
        setChannels((prev) => [...prev, ...mapped]);
        setSelectedServer(newServer);
        // Select the first channel in the new server
        if (mapped.length > 0) {
          setSelectedChannel(mapped[0]);
        }
      } catch (_) {
        setSelectedServer(newServer);
      }
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

  const createInviteCode = async (serverId: string, opts?: { maxUses?: number; expiresAt?: string | Date }) => {
    if (!currentUser) return null;
    try {
      const inv = await apiService.createInviteCode(serverId, opts);
      return inv;
    } catch (error) {
      console.error('Failed to create invite code:', error);
      return null;
    }
  };

  const getInviteCodes = async (serverId: string) => {
    try {
      const codes = await apiService.getInviteCodes(serverId);
      return codes || [];
    } catch (error) {
      console.error('Failed to load invite codes:', error);
      return [];
    }
  };

  const resolveInviteCode = async (code: string) => {
    try {
      const res = await apiService.resolveInviteCode(code);
      return res;
    } catch (error) {
      console.error('Failed to resolve invite code:', error);
      throw error;
    }
  };

  const deleteInviteCode = async (serverId: string, inviteId: string) => {
    try {
      await apiService.deleteInviteCode(serverId, inviteId);
    } catch (error) {
      console.error('Failed to delete invite code:', error);
      throw error;
    }
  };

  const joinInviteByCode = async (code: string) => {
    try {
      const res = await apiService.joinInviteByCode(code);
      // Try to determine serverId from response
      let serverId: string | undefined = res?.server?.id || res?.server_id || res?.id;

      // Refresh server list
      await fetchUserServers();

      // If we don't have serverId yet, resolve the invite to find it
      if (!serverId) {
        try {
          const resolved = await apiService.resolveInviteCode(code);
          serverId = resolved?.server?.id;
        } catch (e) {
          // ignore
        }
      }

      // If we have a serverId, fetch its details and select it
      if (serverId) {
        try {
          const sd = await apiService.getServerDetails(serverId);
          if (sd && sd.id) {
            const transformed: Server = {
              id: sd.id,
              name: sd.name,
              icon: sd.icon || '📁',
              ownerId: sd.owner_id || sd.ownerId,
              members: sd.members || [],
            };
            setServers((prev) => {
              const map = new Map(prev.map((s) => [s.id, s]));
              map.set(transformed.id, transformed);
              return Array.from(map.values());
            });
            setSelectedServer(transformed);
            try {
              // Fetch channels for the server and set the first channel as selected
              const serverChannels = (await apiService.getChannels(transformed.id)) as any[];
              const mappedChannels: Channel[] = serverChannels.map((c: any) => ({
                id: c.id,
                name: c.name,
                serverId: c.server_id || c.serverId || transformed.id,
              }));
              if (mappedChannels.length > 0) {
                setChannels((prev) => {
                  const map = new Map(prev.map((c) => [c.id, c]));
                  for (const mc of mappedChannels) map.set(mc.id, mc);
                  return Array.from(map.values());
                });
                setSelectedChannel(mappedChannels[0]);
              }
            } catch (e) {
              // ignore
            }
            return transformed;
          }
        } catch (e) {
          console.error('Failed to fetch joined server details:', e);
        }
      }

      return res;
    } catch (error) {
      console.error('Failed to join server via invite code:', error);
      throw error;
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
  // Read state (local for now — tracks unread per channel/DM)
  // ---------------------------------------------------------------------------

  const markAsRead = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId;
    if (key) {
      setLastReadMessages((prev) => ({ ...prev, [key]: new Date() }));
    }
  };

  const getUnreadCount = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId || '';
    const lastRead = lastReadMessages[key];
    const pool = channelId
      ? messages.filter((m) => m.channelId === channelId)
      : messages.filter((m) => m.dmId === dmId);
    if (!lastRead) return pool.length;
    return pool.filter((m) => new Date(m.timestamp).getTime() > new Date(lastRead).getTime()).length;
  };

  const getUnreadMessages = (channelId?: string, dmId?: string) => {
    const key = channelId || dmId || '';
    const lastRead = lastReadMessages[key];
    const pool = channelId
      ? messages.filter((m) => m.channelId === channelId)
      : messages.filter((m) => m.dmId === dmId);
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
      return false;
    }
  };

  const logout = () => {
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
        updateServer,
        sendServerInvite,
        acceptServerInvite,
        declineServerInvite,
        createInviteCode,
        getInviteCodes,
        resolveInviteCode,
        deleteInviteCode,
        joinInviteByCode,
        createChannel,
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
