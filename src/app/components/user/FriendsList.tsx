import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';
import { StatusDot, getStatusLabel } from '../ui/StatusDot';
import { MessageCircle, UserMinus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { User } from '../../types';

interface FriendsListProps {
  searchQuery: string;
}

export const FriendsList: React.FC<FriendsListProps> = ({ searchQuery }) => {
  const { getFriends, createDirectMessage, unfriend } = useApp();
  const friends = getFriends();
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [friendToUnfriend, setFriendToUnfriend] = useState<User | null>(null);

  const filteredFriends = friends.filter((friend) =>
    (friend.displayName || friend.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnfriendClick = (friend: User) => {
    setFriendToUnfriend(friend);
    setUnfriendDialogOpen(true);
  };

  const handleUnfriendConfirm = async () => {
    if (friendToUnfriend) {
      await unfriend(friendToUnfriend.id);
      setUnfriendDialogOpen(false);
      setFriendToUnfriend(null);
    }
  };

  return (
    <ScrollArea className="h-full flex-1 min-h-0 overflow-y-auto">
      <div className="px-2 py-2">
        <div
          className="text-xs text-[#475569] uppercase font-semibold tracking-wider px-2 mb-2"
          aria-live="polite"
          aria-atomic="true"
        >
          Friends — {filteredFriends.length}
        </div>
        {filteredFriends.length === 0 ? (
          <div className="text-center text-[#475569] py-10 px-4 text-sm" role="status">
            {searchQuery ? 'No friends found' : 'No friends yet — send some requests!'}
          </div>
        ) : (
          <ul className="space-y-0.5" role="list">
            {filteredFriends.map((friend) => {
              const displayName = friend.displayName || friend.username;
              const statusLabel = getStatusLabel(friend.status);
              return (
                <li
                  key={friend.id}
                  role="listitem"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1a2d45] group transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={friend.avatar}
                      alt={`${displayName}, ${statusLabel}`}
                      className="size-8 rounded-full ring-2 ring-[#1e3248]"
                    />
                    <StatusDot
                      status={friend.status}
                      borderColor="#0d1a2e"
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#94a3b8] text-sm font-medium truncate group-hover:text-[#e2e8f0] transition-colors">
                      {displayName}
                    </div>
                    {/* Visible status text is aria-hidden — status is already in the avatar alt */}
                    <div className="text-[#475569] text-xs" aria-hidden="true">{statusLabel}</div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => createDirectMessage(friend.id)}
                      aria-label={`Send direct message to ${displayName}`}
                      className="p-1.5 hover:bg-[#06b6d4]/20 rounded-lg transition-all"
                    >
                      <MessageCircle className="size-4 text-[#06b6d4]" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleUnfriendClick(friend)}
                      aria-label={`Unfriend ${displayName}`}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <UserMinus className="size-4 text-red-400" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    
    {/* Unfriend Confirmation Dialog */}
    <Dialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]">
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">Unfriend {friendToUnfriend?.displayName || friendToUnfriend?.username}?</DialogTitle>
          <DialogDescription className="text-[#475569]">
            Are you sure you want to unfriend {friendToUnfriend?.displayName || friendToUnfriend?.username}? 
            You can always send them a friend request again later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => setUnfriendDialogOpen(false)}
            variant="ghost"
            className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnfriendConfirm}
            className="bg-red-500 hover:bg-red-600 text-white border-none"
          >
            Unfriend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </ScrollArea>
  );
};