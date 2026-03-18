import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Server, Channel, Message, FriendRequest, DirectMessage, ServerInvite } from '../types';
import { apiService } from '../services/apiService';

// Utility function to create relative timestamps
const getRelativeTime = (minutesAgo: number): Date => {
  const now = new Date();
  return new Date(now.getTime() - minutesAgo * 60 * 1000);
};

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'Nafisa',
    email: 'nafisa@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    status: 'online',
  },
  {
    id: '2',
    username: 'Ashraf',
    email: 'ashraf@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    status: 'online',
  },
  {
    id: '3',
    username: 'James',
    email: 'james@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    status: 'idle',
  },
  {
    id: '4',
    username: 'Elvis',
    email: 'elvis@example.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    status: 'online',
  },
  {
    id: '5',
    username: 'Salma',
    email: 'salma@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    status: 'dnd',
  },
];

const mockServers: Server[] = [
  {
    id: 's1',
    name: 'Team Project',
    icon: '🚀',
    ownerId: '1',
    members: ['1', '2', '3', '4', '5'],
  },
  {
    id: 's2',
    name: 'Gaming Squad',
    icon: '🎮',
    ownerId: '2',
    members: ['1', '2', '3'],
  },
  {
    id: 's3',
    name: 'Study Group',
    icon: '📚',
    ownerId: '3',
    members: ['1', '3', '4', '5'],
  },
];

const mockChannels: Channel[] = [
  { id: 'c1', name: 'general', serverId: 's1' },
  { id: 'c2', name: 'announcements', serverId: 's1' },
  { id: 'c3', name: 'development', serverId: 's1' },
  { id: 'c4', name: 'general', serverId: 's2' },
  { id: 'c5', name: 'game-night', serverId: 's2' },
  { id: 'c6', name: 'general', serverId: 's3' },
  { id: 'c7', name: 'homework-help', serverId: 's3' },
];

const mockMessages: Message[] = [
  {
    id: 'm1',
    content: 'Hey everyone! Welcome to the project server 🎉',
    authorId: '1',
    channelId: 'c1',
    timestamp: getRelativeTime(50), // 50 minutes ago
  },
  {
    id: 'm2',
    content: 'Thanks for setting this up! Excited to work together.',
    authorId: '2',
    channelId: 'c1',
    timestamp: getRelativeTime(45), // 45 minutes ago
  },
  {
    id: 'm3',
    content: 'What features are we implementing first?',
    authorId: '3',
    channelId: 'c1',
    timestamp: getRelativeTime(40), // 40 minutes ago
  },
  {
    id: 'm4',
    content: 'I\'m working on the user system - registration, login, and profiles.',
    authorId: '1',
    channelId: 'c1',
    timestamp: getRelativeTime(35), // 35 minutes ago
  },
  {
    id: 'm5',
    content: 'I\'ll handle servers - creating, deleting, and settings.',
    authorId: '2',
    channelId: 'c1',
    timestamp: getRelativeTime(30), // 30 minutes ago
  },
  {
    id: 'm6',
    content: 'I can take care of the channels - text channels with permissions.',
    authorId: '3',
    channelId: 'c1',
    timestamp: getRelativeTime(25), // 25 minutes ago
  },
  {
    id: 'm7',
    content: 'We\'ll work on messaging - real-time chat, timestamps, edit/delete, and emojis!',
    authorId: '4',
    channelId: 'c1',
    timestamp: getRelativeTime(20), // 20 minutes ago
  },
  {
    id: 'm8',
    content: 'The emoji picker is working great! 😄',
    authorId: '5',
    channelId: 'c1',
    timestamp: getRelativeTime(15), // 15 minutes ago
  },
  {
    id: 'm9',
    content: 'Should we have a meeting tomorrow to discuss the deadline?',
    authorId: '2',
    channelId: 'c1',
    timestamp: getRelativeTime(10), // 10 minutes ago
  },
  {
    id: 'm10',
    content: 'Yes, let\'s meet at 10 AM. I\'ll prepare the agenda.',
    authorId: '1',
    channelId: 'c1',
    timestamp: getRelativeTime(5), // 5 minutes ago
  },
  // Announcements channel messages for demo
  {
    id: 'm11',
    content: '📢 Important: Please review the project roadmap in the development channel.',
    authorId: '1',
    channelId: 'c2',
    timestamp: getRelativeTime(30), // 30 minutes ago
  },
  {
    id: 'm12',
    content: '🎯 Milestone: We\'ve completed 60% of the core features!',
    authorId: '2',
    channelId: 'c2',
    timestamp: getRelativeTime(10), // 10 minutes ago
  },
  // Development channel messages for demo
  {
    id: 'm13',
    content: 'Just pushed the new authentication flow. Please test it!',
    authorId: '1',
    channelId: 'c3',
    timestamp: getRelativeTime(35), // 35 minutes ago
  },
  {
    id: 'm14',
    content: 'Found a bug in the server settings modal. Working on a fix.',
    authorId: '2',
    channelId: 'c3',
    timestamp: getRelativeTime(20), // 20 minutes ago
  },
  {
    id: 'm15',
    content: 'The channel permissions system is ready for review 🚀',
    authorId: '3',
    channelId: 'c3',
    timestamp: getRelativeTime(8), // 8 minutes ago
  },
  // DM messages for demo
  {
    id: 'm16',
    content: 'Hey! Want to grab coffee after the meeting?',
    authorId: '2',
    dmId: 'dm1',
    timestamp: getRelativeTime(40), // 40 minutes ago
  },
  {
    id: 'm17',
    content: 'Sure! How about the place downtown?',
    authorId: '1',
    dmId: 'dm1',
    timestamp: getRelativeTime(25), // 25 minutes ago
  },
  {
    id: 'm18',
    content: 'Perfect! See you at 2 PM ☕',
    authorId: '2',
    dmId: 'dm1',
    timestamp: getRelativeTime(15), // 15 minutes ago
  },
];

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [servers, setServers] = useState<Server[]>(mockServers);
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: 'fr1', fromUserId: '4', toUserId: '1', status: 'pending' },
    // Add accepted friend requests for demo - current user (1) is friends with users 2, 3, 5
    { id: 'fr2', fromUserId: '1', toUserId: '2', status: 'accepted' },
    { id: 'fr3', fromUserId: '3', toUserId: '1', status: 'accepted' },
    { id: 'fr4', fromUserId: '1', toUserId: '5', status: 'accepted' },
  ]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([
    { id: 'dm1', participants: ['1', '2'], lastMessageTime: new Date() },
  ]);
  const [serverInvites, setServerInvites] = useState<ServerInvite[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);
  const [lastReadMessages, setLastReadMessages] = useState<Record<string, Date>>({
    // Set up demo for AI summary feature - simulate users haven't read recent messages
    // Set last read times to 61 minutes ago so all messages (60-5 minutes ago) are unread
    // This ensures the messages fall within the "What You Missed" window
    'c1': getRelativeTime(61), // Team Project - general channel
    'c2': getRelativeTime(61), // Team Project - announcements channel
    'c3': getRelativeTime(61), // Team Project - development channel
    'c4': getRelativeTime(61), // Gaming Squad - general
    'c5': getRelativeTime(61), // Gaming Squad - game-night
    'c6': getRelativeTime(61), // Study Group - general
    'c7': getRelativeTime(61), // Study Group - homework-help
    'dm1': getRelativeTime(61), // DM with Ashraf
  });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapBackendMessageRowToFrontend = (row: any): Message => {
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
  };

  const mergeUsersFromMessageRows = (rows: any[]) => {
    if (!rows || rows.length === 0) return;

    const authorUsers: User[] = rows
      .filter((r) => r.author_id && r.username)
      .map((r) => ({
        id: r.author_id,
        username: r.username,
        displayName: r.display_name || undefined,
        email: '',
        avatar: r.avatar,
        status: 'online',
      }));

    if (authorUsers.length === 0) return;

    setUsers((prev) => {
      const existingById = new Map(prev.map((u) => [u.id, u]));
      for (const u of authorUsers) {
        if (!existingById.has(u.id)) existingById.set(u.id, u);
      }
      return Array.from(existingById.values());
    });
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            const user: User = {
              id: response.data.user.id,
              username: response.data.user.username,
              email: response.data.user.email,
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
              status: 'online',
            };
            setCurrentUser(user);
            
            // Fetch user's servers from backend
            await fetchUserServers();
            await fetchUserDirectMessages();
          }
        } catch (error) {
          console.error('Failed to restore authentication:', error);
          apiService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch messages whenever you switch rooms/chats
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
          return;
        }

        // No selection: clear the message list so the UI doesn't show stale messages.
        setMessages([]);
        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (cancelled) return;
        setMessages([]);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedChannel?.id, selectedDM?.id, currentUser?.id]);

  const createServer = async (name: string, icon: string) => {
    if (!currentUser) return;

    try {
      const backendResponse = (await apiService.createServer(name, icon)) as any;
      const serverData = backendResponse?.data || backendResponse?.server || backendResponse;

      if (!serverData || !serverData.id) {
        throw new Error('Backend did not return a valid server object.');
      }

      const newServer: Server = {
        id: serverData.id,
        name: serverData.name,
        icon: serverData.icon || icon || '📁',
        ownerId: serverData.owner_id || currentUser.id, 
        members: [currentUser.id],
      };

      setServers([...servers, newServer]);
      
      // The backend already creates the default "general" channel.
      // Fetch channels for this new server so UI matches the database state.
      try {
        await fetchChannels([newServer.id]);
      } catch (channelError) {
        console.error('Failed to fetch channels for new server:', channelError);
      }

      setSelectedServer(newServer);
      
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  };

  const deleteServer = async (serverId: string) => {
    try {
      await apiService.deleteServer(serverId);

      setServers(prevServers => prevServers.filter(server => server.id !== serverId));

      if (selectedServer?.id === serverId) {
        setSelectedServer(null);
      }

      setChannels(prevChannels => prevChannels.filter(channel => channel.serverId !== serverId));

    } catch (error) {
      console.error('Failed to delete server:', error);
      throw error; 
    }
  };

  const updateServer = async (serverId: string, name: string, icon: string) => {
    try {
      // 1. Tell the backend to update the server
      // We wait for this to finish so we don't update the UI if the database fails
      await apiService.updateServer(serverId, {name, icon});

      // 2. Update the main servers list in the UI
      setServers(prevServers => 
        prevServers.map(server => 
          server.id === serverId 
            ? { ...server, name, icon } // Update the matching server
            : server                    // Leave all other servers alone
        )
      );

      // 3. If the user is currently looking at the server they just updated,
      // we need to update the 'selectedServer' state too so the header changes instantly!
      if (selectedServer?.id === serverId) {
        setSelectedServer(prev => prev ? { ...prev, name, icon } : prev);
      }

    } catch (error) {
      console.error('Failed to update server:', error);
      // If this fails, the UI won't update, which is good! 
      // It prevents the user from thinking it saved when it didn't.
    }
  };

  const sendServerInvite = (serverId: string, userId: string) => {
    if (!currentUser) return;
    
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    // Create the invite
    const newInvite: ServerInvite = {
      id: `si${serverInvites.length + 1}`,
      serverId,
      fromUserId: currentUser.id,
      toUserId: userId,
      status: 'pending',
      timestamp: new Date(),
    };
    setServerInvites([...serverInvites, newInvite]);
    
    // Create or get DM with the user
    let dm = directMessages.find(
      (d) => d.participants.includes(currentUser.id) && d.participants.includes(userId)
    );
    
    if (!dm) {
      dm = {
        id: `dm${directMessages.length + 1}`,
        participants: [currentUser.id, userId],
        lastMessageTime: new Date(),
      };
      setDirectMessages([...directMessages, dm]);
    }
    
    // Send invite message in DM
    const inviteMessage: Message = {
      id: `m${messages.length + 1}`,
      content: `${currentUser.username} invited you to join ${server.name} ${server.icon}`,
      authorId: currentUser.id,
      dmId: dm.id,
      timestamp: new Date(),
      serverInviteId: newInvite.id,
    };
    setMessages([...messages, inviteMessage]);
    
    // Update invite with message ID
    newInvite.messageId = inviteMessage.id;
  };

  const acceptServerInvite = (inviteId: string) => {
    const invite = serverInvites.find(si => si.id === inviteId);
    if (!invite) return;
    
    // Update invite status
    setServerInvites(
      serverInvites.map((si) =>
        si.id === inviteId ? { ...si, status: 'accepted' as const } : si
      )
    );
    
    // Add user to server members
    setServers(servers.map((s) => {
      if (s.id === invite.serverId && !s.members.includes(invite.toUserId)) {
        return { ...s, members: [...s.members, invite.toUserId] };
      }
      return s;
    }));
  };

  const declineServerInvite = (inviteId: string) => {
    setServerInvites(
      serverInvites.map((si) =>
        si.id === inviteId ? { ...si, status: 'declined' as const } : si
      )
    );
  };

  const createChannel = async (serverId: string, name: string) => {
    try {
      const backendResponse = (await apiService.createChannel(serverId, name)) as any;
      
      const channelData = backendResponse?.data || backendResponse?.channel || backendResponse;

      if (!channelData || !channelData.id) {
        throw new Error('Backend did not return a valid channel object.');
      }

      const newChannel: Channel = {
        id: channelData.id,
        name: channelData.name,
        serverId: channelData.server_id || channelData.serverId || serverId,
      };

      setChannels(prevChannels => [...prevChannels, newChannel]);

      // 4. (Optional) Automatically switch the user's view to the new channel
      // setSelectedChannel(newChannel); 
      
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error; 
    }
  };

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
        const messageRow = await apiService.createMessage({
          content,
          channelId,
          dmId,
          replyToId,
          serverInviteId,
        });

        // Update author info so MessageItem can render the author avatar/name.
        mergeUsersFromMessageRows([messageRow]);
        setMessages((prev) => [...prev, mapBackendMessageRowToFrontend(messageRow)]);

        // Update DM last message time so the DM list sorts correctly.
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
        const messageRow = await apiService.editMessage(messageId, newContent);
        mergeUsersFromMessageRows([messageRow]);
        const mapped = mapBackendMessageRowToFrontend(messageRow);
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
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
      }
    })();
  };

  const sendFriendRequest = (toUserId: string) => {
    if (!currentUser) return;
    const newRequest: FriendRequest = {
      id: `fr${friendRequests.length + 1}`,
      fromUserId: currentUser.id,
      toUserId,
      status: 'pending',
    };
    setFriendRequests([...friendRequests, newRequest]);
  };

  const acceptFriendRequest = (requestId: string) => {
    setFriendRequests(
      friendRequests.map((fr) =>
        fr.id === requestId ? { ...fr, status: 'accepted' as const } : fr
      )
    );
  };

  const rejectFriendRequest = (requestId: string) => {
    setFriendRequests(
      friendRequests.map((fr) =>
        fr.id === requestId ? { ...fr, status: 'rejected' as const } : fr
      )
    );
  };

  const getFriends = (): User[] => {
    if (!currentUser) return [];
    const friendIds = friendRequests
      .filter((fr) => fr.status === 'accepted' && (fr.fromUserId === currentUser.id || fr.toUserId === currentUser.id))
      .map((fr) => (fr.fromUserId === currentUser.id ? fr.toUserId : fr.fromUserId));
    return users.filter((u) => friendIds.includes(u.id));
  };

  const createDirectMessage = (userId: string) => {
    if (!currentUser) return;

    const exists = directMessages.find(
      (dm) =>
        dm.participants.includes(currentUser.id) && dm.participants.includes(userId)
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
          const alreadyThere = prev.some((d) => d.id === newDM.id);
          if (alreadyThere) return prev;
          return [...prev, newDM];
        });

        // Upsert the other user so DM list/header can render.
        if (dmRow.other_user_id && dmRow.username) {
          const otherUser: User = {
            id: dmRow.other_user_id,
            username: dmRow.username,
            displayName: dmRow.display_name || undefined,
            email: '',
            avatar: dmRow.avatar,
            status: (dmRow.status || 'online') as User['status'],
          };

          setUsers((prev) => {
            if (prev.some((u) => u.id === otherUser.id)) return prev;
            return [...prev, otherUser];
          });
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

  const updateUserStatus = (status: User['status']) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, status };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const updateUserProfile = (displayName?: string, avatar?: string) => {
    if (!currentUser) return;
    const updatedUser = { 
      ...currentUser, 
      displayName: displayName || undefined, 
      avatar: avatar || currentUser.avatar 
    };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const markAsRead = (channelId?: string, dmId?: string) => {
    if (channelId) {
      setLastReadMessages({ ...lastReadMessages, [channelId]: new Date() });
    } else if (dmId) {
      setLastReadMessages({ ...lastReadMessages, [dmId]: new Date() });
    }
  };

  const getUnreadCount = (channelId?: string, dmId?: string) => {
    const lastRead = lastReadMessages[channelId || dmId || ''];
    if (!lastRead) return 0;
    const messagesToCheck = channelId ? messages.filter(m => m.channelId === channelId) : messages.filter(m => m.dmId === dmId);
    return messagesToCheck.filter(m => new Date(m.timestamp).getTime() > new Date(lastRead).getTime()).length;
  };

  const getUnreadMessages = (channelId?: string, dmId?: string) => {
    const id = channelId || dmId || '';
    const lastRead = lastReadMessages[id];
    console.log('getUnreadMessages called:', { channelId, dmId, id, lastRead });
    
    if (!lastRead) {
      console.log('No lastRead timestamp found for:', id);
      return [];
    }
    
    const messagesToCheck = channelId ? messages.filter(m => m.channelId === channelId) : messages.filter(m => m.dmId === dmId);
    console.log('Messages to check:', messagesToCheck.length);
    console.log('First few messages:', messagesToCheck.slice(0, 3).map(m => ({ id: m.id, timestamp: m.timestamp, content: m.content.substring(0, 30) })));
    console.log('Last read time:', lastRead);
    
    const unread = messagesToCheck.filter(m => new Date(m.timestamp).getTime() > new Date(lastRead).getTime());
    console.log('Unread messages found:', unread.length);
    
    return unread;
  };

  const fetchUserServers = async () => {
    try {
      const backendResponse = (await apiService.getServers()) as any;
      
      const serverArray = Array.isArray(backendResponse) 
        ? backendResponse 
        : backendResponse?.data || backendResponse?.servers || [];

      if (!Array.isArray(serverArray)) {
        throw new Error('Expected an array of servers.');
      }

      const transformedServers: Server[] = serverArray.map((server: any) => {
        const serverMembers = server.members || [];
        if (server.owner_id && !serverMembers.includes(server.owner_id)) {
          serverMembers.push(server.owner_id);
        }

        // if (currentUser && !serverMembers.includes(currentUser.id)) {
        //   serverMembers.push(currentUser.id);
        // }

        return {
          id: server.id, 
          name: server.name,
          icon: server.icon || '📁',
          ownerId: server.owner_id, 
          members: serverMembers, 
        };
      });

      setServers([...mockServers, ...transformedServers]);

      const backendServerIds = transformedServers.map(server => server.id);
      if (backendServerIds.length > 0) {
        await fetchChannels(backendServerIds);
      }

    } catch (error) {
      console.error('Failed to fetch user servers. Detailed error:', error);
      setServers(mockServers);
    }
  };

  const fetchChannels = async (serverIds: string[]) => {
    try {
      // Fetch channels for all the backend servers we just found
      const channelPromises = serverIds.map(id => apiService.getChannels(id));
      const backendResponses = await Promise.all(channelPromises);
      
      // Flatten the array of arrays into a single list of channels
      const allBackendChannels = backendResponses.flat() as any[];

      const transformedChannels: Channel[] = allBackendChannels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        serverId: channel.server_id || channel.serverId, 
      }));

      // Merge mock channels with the real backend channels
      setChannels([...mockChannels, ...transformedChannels]);
    } catch (error) {
      console.error('Failed to fetch channels. Detailed error:', error);
      // Keep only mock channels if the fetch fails
      setChannels(mockChannels);
    }
  };

  const fetchUserDirectMessages = async () => {
    try {
      const dmRows = await apiService.getDirectMessages();
      const mapped: DirectMessage[] = (dmRows || []).map((row: any) => ({
        id: row.id,
        participants: row.participants,
        lastMessageTime: new Date(row.last_message_time),
      }));

      setDirectMessages(mapped);

      // Upsert other user(s) so DM list/header can render.
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

      setUsers((prev) => {
        const existingById = new Map(prev.map((u) => [u.id, u]));
        for (const u of otherUsers) {
          if (!existingById.has(u.id)) existingById.set(u.id, u);
        }
        return Array.from(existingById.values());
      });
    } catch (error) {
      console.error('Failed to fetch direct messages. Keeping existing mock state:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        status: 'online',
      };
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.register(username, email, password);
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        status: 'online',
      };
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    apiService.logout();
    setCurrentUser(null);
    setSelectedServer(null);
    setSelectedChannel(null);
    setSelectedDM(null);
  };

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