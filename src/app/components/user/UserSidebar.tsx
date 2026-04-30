import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, MessageSquare, Users } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { FriendsList } from './FriendsList';
import { FriendRequests } from './FriendRequests';
import { DMList } from './DMList';

interface UserSidebarProps {
  onDMSelect?: () => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({ onDMSelect }) => {
  const { selectedServer, friendRequests, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedServer) return null;

  const pendingRequests = friendRequests.filter(
    (fr) => fr.status === 'pending' && fr.toUserId === currentUser?.id
  );

  return (
    <div className="w-full bg-[#0d1a2e] flex flex-col h-full min-h-0">
      {/* Search bar */}
      <div className="h-12 px-3 flex items-center border-b border-[#1e3248]">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#475569]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-8 pr-8 bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569] text-sm h-8 focus-visible:ring-[#06b6d4]/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dms" className="flex-1 flex flex-col h-full min-h-0">
        <TabsList className="w-full bg-[#0d1a2e] border-b border-[#1e3248] rounded-none h-auto p-1 gap-1">
          <TabsTrigger
            value="dms"
            className="flex-1 data-[state=active]:bg-[#06b6d4]/20 data-[state=active]:text-[#06b6d4] data-[state=active]:border data-[state=active]:border-[#06b6d4]/30 rounded-lg py-1.5 text-[#64748b] text-sm transition-all"
          >
            <MessageSquare className="size-3.5 mr-1.5" />
            Chats
          </TabsTrigger>
          <TabsTrigger
            value="friends"
            className="flex-1 data-[state=active]:bg-[#06b6d4]/20 data-[state=active]:text-[#06b6d4] data-[state=active]:border data-[state=active]:border-[#06b6d4]/30 rounded-lg py-1.5 text-[#64748b] text-sm transition-all relative"
          >
            <Users className="size-3.5 mr-1.5" />
            Friends
            {pendingRequests.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full size-4 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dms" className="flex-1 m-0 overflow-hidden min-h-0 h-full">
          <DMList searchQuery={searchQuery} onDMSelect={onDMSelect} />
        </TabsContent>

        <TabsContent value="friends" className="flex-1 m-0 overflow-hidden min-h-0 h-full">
          <div className="flex flex-col h-full">
            {pendingRequests.length > 0 && (
              <div className="px-3 py-2 border-b border-[#1e3248]">
                <div className="text-xs text-[#475569] uppercase font-semibold tracking-wider px-1 mb-1">
                  Pending — {pendingRequests.length}
                </div>
                <ScrollArea className="max-h-56 h-56">
                  <div className="px-0">
                    <FriendRequests />
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="flex-1 overflow-hidden min-h-0">
              <FriendsList searchQuery={searchQuery} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
