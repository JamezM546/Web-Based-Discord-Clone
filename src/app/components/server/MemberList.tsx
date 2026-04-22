import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';
import { StatusDot, getStatusLabel } from '../ui/StatusDot';
import { MessageSquare, UserPlus, UserCheck, Clock, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const MemberList: React.FC = () => {
  const {
    selectedServer,
    users,
    currentUser,
    getFriends,
    friendRequests,
    createDirectMessage,
    sendFriendRequest,
    acceptFriendRequest,
  } = useApp();
  const [notification, setNotification] = useState<string | null>(null);

  if (!selectedServer) return null;

  const serverMembers = users.filter((user) => selectedServer.members.includes(user.id));
  const onlineMembers = serverMembers.filter((user) => user.status !== 'offline');
  const offlineMembers = serverMembers.filter((user) => user.status === 'offline');

  const friends = getFriends();
  const friendIds = friends.map(f => f.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const handleSendDM = (member: typeof users[0]) => {
    createDirectMessage(member.id);
  };

  const handleAddFriend = (member: typeof users[0]) => {
    sendFriendRequest(member.id);
    showNotification(`Friend request sent to ${member.displayName || member.username}!`);
  };

  const handleAcceptFriend = (member: typeof users[0]) => {
    if (!currentUser) return;
    const request = friendRequests.find(
      fr => fr.fromUserId === member.id && fr.toUserId === currentUser.id && fr.status === 'pending'
    );
    if (request) {
      acceptFriendRequest(request.id);
      showNotification(`You are now friends with ${member.displayName || member.username}!`);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getFriendshipStatus = (memberId: string) => {
    if (!currentUser) return 'none';
    if (friendIds.includes(memberId)) return 'friends';
    const sentRequest = friendRequests.find(
      fr => fr.fromUserId === currentUser.id && fr.toUserId === memberId && fr.status === 'pending'
    );
    if (sentRequest) return 'request_sent';
    const receivedRequest = friendRequests.find(
      fr => fr.fromUserId === memberId && fr.toUserId === currentUser.id && fr.status === 'pending'
    );
    if (receivedRequest) return 'request_received';
    return 'none';
  };

  const renderMember = (member: typeof users[0], isOffline = false) => {
    const displayName = member.displayName || member.username;
    const isCurrentUser = member.id === currentUser?.id;
    const isOwner = selectedServer?.ownerId === member.id;
    const friendshipStatus = getFriendshipStatus(member.id);
    const statusLabel = getStatusLabel(member.status);

    if (isCurrentUser) {
      return (
        <li key={member.id} role="listitem" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="relative flex-shrink-0">
            <img
              src={member.avatar}
              alt={`${displayName} (you), ${statusLabel}`}
              className={`size-8 rounded-full ring-2 ring-[#1e3248] ${isOffline ? 'opacity-40' : ''}`}
            />
            <StatusDot status={member.status} borderColor="#0d1a2e" className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate flex items-center gap-1 ${isOffline ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
              {isOwner && <Crown className="size-3 text-yellow-400" />}
              {displayName}
              <span className="text-xs text-[#475569] ml-1" aria-hidden="true">(You)</span>
            </div>
          </div>
        </li>
      );
    }

    return (
      <li key={member.id} role="listitem">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#1a2d45] cursor-pointer group transition-colors"
              aria-label={`${displayName}, ${statusLabel} — open options`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={member.avatar}
                  alt={`${displayName}, ${statusLabel}`}
                  className={`size-8 rounded-full ring-2 ring-[#1e3248] ${isOffline ? 'opacity-40 group-hover:opacity-100' : ''} transition-opacity`}
                />
                <StatusDot status={member.status} borderColor="#0d1a2e" className="absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium truncate flex items-center gap-1 transition-colors ${
                  isOffline
                    ? 'text-[#475569] group-hover:text-[#94a3b8]'
                    : 'text-[#94a3b8] group-hover:text-[#e2e8f0]'
                }`}>
                  {isOwner && <Crown className="size-3 text-yellow-400" />}
                  {displayName}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-[#0a1628] border border-[#1e3248] text-[#e2e8f0] shadow-xl">
            {friendshipStatus === 'friends' && (
              <DropdownMenuItem
                onClick={() => handleSendDM(member)}
                className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
              >
                <MessageSquare className="size-4 mr-2 text-[#06b6d4]" aria-hidden="true" />
                Send Message
              </DropdownMenuItem>
            )}
            {friendshipStatus === 'none' && (
              <DropdownMenuItem
                onClick={() => handleAddFriend(member)}
                className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
              >
                <UserPlus className="size-4 mr-2 text-[#06b6d4]" aria-hidden="true" />
                Add Friend
              </DropdownMenuItem>
            )}
            {friendshipStatus === 'request_sent' && (
              <DropdownMenuItem disabled className="text-[#475569] opacity-60 cursor-not-allowed">
                <Clock className="size-4 mr-2" aria-hidden="true" />
                Request Sent
              </DropdownMenuItem>
            )}
            {friendshipStatus === 'request_received' && (
              <DropdownMenuItem
                onClick={() => handleAcceptFriend(member)}
                className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-green-500/20 cursor-pointer"
              >
                <UserCheck className="size-4 mr-2 text-green-400" aria-hidden="true" />
                Accept Request
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  return (
    <div className="w-52 bg-[#0d1a2e] border-l border-[#1e3248] flex flex-col relative flex-shrink-0">
      {/* Notification Toast — announced to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        {notification && (
          <div className="bg-[#06b6d4] text-white px-3 py-2 rounded-lg shadow-xl text-xs font-medium whitespace-nowrap">
            {notification}
          </div>
        )}
      </div>

      <div className="h-12 px-3 flex items-center border-b border-[#1e3248]">
        <span className="text-xs text-[#475569] font-semibold uppercase tracking-wider">People — {serverMembers.length}</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {onlineMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5 px-2">
                Active — {onlineMembers.length}
              </h3>
              <ul className="space-y-0.5" role="list">
                {onlineMembers.map(m => renderMember(m, false))}
              </ul>
            </div>
          )}

          {offlineMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5 px-2">
                Away — {offlineMembers.length}
              </h3>
              <ul className="space-y-0.5" role="list">
                {offlineMembers.map(m => renderMember(m, true))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};