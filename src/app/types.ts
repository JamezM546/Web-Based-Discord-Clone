export interface User {
  id: string;
  username: string;
  displayName?: string; // Optional alias/nickname
  email: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  members: string[];
}

export interface Channel {
  id: string;
  name: string;
  serverId: string;
  type: 'text' | 'voice';
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId?: string;
  dmId?: string;
  timestamp: Date;
  edited?: boolean;
  reactions?: MessageReaction[];
  replyToId?: string; // ID of the message being replied to
  serverInviteId?: string; // ID of the server invite if this is an invite message
}

export interface MessageReaction {
  emoji: string;
  users: string[]; // array of user IDs who reacted with this emoji
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DirectMessage {
  id: string;
  participants: string[];
  lastMessageTime: Date;
}

export interface ServerInvite {
  id: string;
  serverId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: Date;
  messageId?: string; // ID of the DM message containing the invite
}