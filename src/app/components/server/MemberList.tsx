import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollArea } from '../ui/scroll-area';

export const MemberList: React.FC = () => {
  const { selectedServer, users } = useApp();

  if (!selectedServer) return null;

  // Get all members of the current server
  const serverMembers = users.filter((user) => selectedServer.members.includes(user.id));

  // Separate online and offline members
  const onlineMembers = serverMembers.filter((user) => user.status !== 'offline');
  const offlineMembers = serverMembers.filter((user) => user.status === 'offline');

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
    <div className="w-60 bg-[#2b2d31] flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Online Members */}
          {onlineMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-2">
                Online — {onlineMembers.length}
              </h3>
              <div className="space-y-1">
                {onlineMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group"
                  >
                    <div className="relative">
                      <img src={member.avatar} alt={member.username} className="size-8 rounded-full" />
                      <div
                        className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                          member.status
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#dbdee1] font-medium truncate group-hover:text-white">
                        {member.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Members */}
          {offlineMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#949ba4] uppercase mb-2">
                Offline — {offlineMembers.length}
              </h3>
              <div className="space-y-1">
                {offlineMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="size-8 rounded-full opacity-40 group-hover:opacity-100"
                      />
                      <div
                        className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                          member.status
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#4e5058] font-medium truncate group-hover:text-[#dbdee1]">
                        {member.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
