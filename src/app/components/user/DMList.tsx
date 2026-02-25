import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface DMListProps {
  searchQuery: string;
}

export const DMList: React.FC<DMListProps> = ({ searchQuery }) => {
  const { directMessages, users, currentUser, setSelectedDM, selectedDM, setSelectedChannel, messages } = useApp();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDMClick = (dm: typeof directMessages[0]) => {
    setSelectedDM(dm);
    setSelectedChannel(null);
  };

  return (
    <ScrollArea className="h-full">
      <div className="px-2 py-2">
        {filteredDMs.length === 0 ? (
          <div className="text-center text-[#949ba4] py-8 px-4 text-sm">
            {searchQuery
              ? 'No conversations found'
              : 'No direct messages yet. Start a conversation with a friend!'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDMs.map((dm) => {
              const otherUser = getDMUser(dm);
              const lastMessage = getLastMessage(dm.id);
              if (!otherUser) return null;

              return (
                <button
                  key={dm.id}
                  onClick={() => handleDMClick(dm)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35373c] ${
                    selectedDM?.id === dm.id ? 'bg-[#404249]' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.username}
                      className="size-8 rounded-full"
                    />
                    <div
                      className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                        otherUser.status
                      )}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white text-sm font-medium truncate">
                      {otherUser.username}
                    </div>
                    {lastMessage ? (
                      <div className="text-[#949ba4] text-xs truncate">{lastMessage.content}</div>
                    ) : (
                      <div className="text-[#949ba4] text-xs">
                        {formatDistanceToNow(new Date(dm.lastMessageTime), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};