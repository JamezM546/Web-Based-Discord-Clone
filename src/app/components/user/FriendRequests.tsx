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
            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35373c]"
          >
            <img src={fromUser.avatar} alt={fromUser.username} className="size-8 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{fromUser.username}</div>
              <div className="text-[#949ba4] text-xs">Incoming Friend Request</div>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => acceptFriendRequest(request.id)}
                size="sm"
                className="size-8 p-0 bg-green-600 hover:bg-green-700"
              >
                <Check className="size-4" />
              </Button>
              <Button
                onClick={() => rejectFriendRequest(request.id)}
                size="sm"
                className="size-8 p-0 bg-red-600 hover:bg-red-700"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
