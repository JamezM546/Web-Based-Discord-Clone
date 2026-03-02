import React from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X } from 'lucide-react';
import { Button } from '../ui/button';

export const FriendRequests: React.FC = () => {
  const { friendRequests, users, currentUser, acceptFriendRequest, rejectFriendRequest } = useApp();

  const pendingRequests = friendRequests.filter(
    (fr) => fr.status === 'pending' && fr.toUserId === currentUser?.id
  );

  if (pendingRequests.length === 0) return null;

  return (
    <div className="space-y-1">
      {pendingRequests.map((request) => {
        const fromUser = users.find((u) => u.id === request.fromUserId);
        if (!fromUser) return null;

        return (
          <div
            key={request.id}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1a2d45] transition-colors"
          >
            <img
              src={fromUser.avatar}
              alt=""
              aria-hidden="true"
              className="size-8 rounded-full ring-2 ring-[#1e3248]"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[#e2e8f0] text-sm font-medium truncate">
                {fromUser.displayName || fromUser.username}
              </div>
              <div className="text-[#475569] text-xs">Friend Request</div>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => acceptFriendRequest(request.id)}
                size="sm"
                aria-label={`Accept friend request from ${fromUser.displayName || fromUser.username}`}
                className="size-7 p-0 bg-green-600/80 hover:bg-green-600 border-none"
              >
                <Check className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                onClick={() => rejectFriendRequest(request.id)}
                size="sm"
                aria-label={`Decline friend request from ${fromUser.displayName || fromUser.username}`}
                className="size-7 p-0 bg-red-600/80 hover:bg-red-600 border-none"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};