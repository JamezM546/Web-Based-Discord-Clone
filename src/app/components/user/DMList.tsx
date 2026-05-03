import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';
import { StatusDot, getStatusLabel } from '../ui/StatusDot';
import { formatDistanceToNow } from 'date-fns';

interface DMListProps {
  searchQuery: string;
  onDMSelect?: () => void;
}

export const DMList: React.FC<DMListProps> = ({ searchQuery, onDMSelect }) => {
  const { directMessages, users, currentUser, setSelectedDM, selectedDM, setSelectedChannel, messages, getUnreadCount, markAsRead } = useApp();

  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const userDMs = directMessages.filter((dm) => dm.participants.includes(currentUser?.id || ''));

  const getDMUser = (dm: typeof directMessages[0]) => {
    const otherUserId = dm.participants.find((id) => id !== currentUser?.id);
    return users.find((u) => u.id === otherUserId);
  };

  const getLastMessage = (dmId: string) => {
    const dmMessages = messages.filter((m) => m.dmId === dmId);
    return dmMessages[dmMessages.length - 1];
  };

  const filteredDMs = userDMs.filter((dm) => {
    const otherUser = getDMUser(dm);
    return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDMClick = (dm: typeof directMessages[0]) => {
    setSelectedDM(dm);
    setSelectedChannel(null);
    // Don't markAsRead here — let WhatYouMissed show first.
    // markAsRead is called when user dismisses the banner.
    if (onDMSelect) {
      onDMSelect();
    }
  };

  const hasUnreadMessages = (dmId: string) => {
    return getUnreadCount(undefined, dmId) > 0;
  };

  return (
    <ScrollArea className="h-full flex-1 min-h-0 overflow-y-auto">
      <nav aria-label="Direct chats">
        <div className="px-2 py-2">
          {filteredDMs.length === 0 ? (
            <div className="text-center text-[#475569] py-10 px-4 text-sm" role="status">
              {searchQuery
                ? 'No chats found'
                : 'No direct chats yet — add a friend to get started!'}
            </div>
          ) : (
            <ul className="space-y-0.5" role="list">
              {filteredDMs.map((dm) => {
                const otherUser = getDMUser(dm);
                const lastMessage = getLastMessage(dm.id);
                if (!otherUser) return null;
                const unread = hasUnreadMessages(dm.id) && selectedDM?.id !== dm.id;
                const isSelected = selectedDM?.id === dm.id;
                const unreadCount = getUnreadCount(undefined, dm.id);
                const displayName = otherUser.displayName || otherUser.username;
                const statusLabel = getStatusLabel(otherUser.status);

                return (
                  <li key={dm.id} role="listitem">
                    <button
                      onClick={() => handleDMClick(dm)}
                      aria-current={isSelected ? 'page' : undefined}
                      aria-label={`${displayName}, ${statusLabel}${unread ? `, ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : ''}`}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/25'
                          : 'hover:bg-[#1a2d45] border border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={otherUser.avatar}
                          alt={`${displayName}, ${statusLabel}`}
                          className="size-8 rounded-full ring-2 ring-[#1e3248]"
                        />
                        <StatusDot
                          status={otherUser.status}
                          borderColor="#0d1a2e"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className={`text-sm truncate ${
                          unread ? 'font-semibold text-[#e2e8f0]' : isSelected ? 'font-medium text-[#06b6d4]' : 'font-medium text-[#94a3b8]'
                        }`}>
                          {displayName}
                        </div>
                        {lastMessage ? (
                          <div className={`text-xs truncate ${unread ? 'text-[#64748b]' : 'text-[#475569]'}`}>
                            {truncateMessage(lastMessage.content)}
                          </div>
                        ) : (
                          <div className="text-[#475569] text-xs">
                            {formatDistanceToNow(new Date(dm.lastMessageTime), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                      {unread && (
                        <span aria-hidden="true" className="size-2 rounded-full bg-[#06b6d4] flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>
    </ScrollArea>
  );
};