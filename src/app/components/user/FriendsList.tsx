import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';
import { MessageCircle } from 'lucide-react';

interface FriendsListProps {
  searchQuery: string;
}

export const FriendsList: React.FC<FriendsListProps> = ({ searchQuery }) => {
  const { getFriends, createDirectMessage } = useApp();
  const friends = getFriends();

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <ScrollArea className="h-full">
      <div className="px-2 py-2">
        <div className="text-xs text-[#949ba4] uppercase font-semibold px-2 mb-1">
          All Friends — {filteredFriends.length}
        </div>
        {filteredFriends.length === 0 ? (
          <div className="text-center text-[#949ba4] py-8 px-4 text-sm">
            {searchQuery ? 'No friends found' : 'No friends yet. Send some friend requests!'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35373c] group"
              >
                <div className="relative">
                  <img src={friend.avatar} alt={friend.username} className="size-8 rounded-full" />
                  <div
                    className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                      friend.status
                    )}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{friend.username}</div>
                  <div className="text-[#949ba4] text-xs capitalize">{friend.status}</div>
                </div>
                <button
                  onClick={() => createDirectMessage(friend.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#404249] rounded transition-all"
                >
                  <MessageCircle className="size-4 text-[#949ba4] hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
