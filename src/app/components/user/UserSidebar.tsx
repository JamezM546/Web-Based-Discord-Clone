import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, UserPlus, Search, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FriendsList } from './FriendsList';
import { FriendRequests } from './FriendRequests';
import { DMList } from './DMList';

export const UserSidebar: React.FC = () => {
  const { selectedServer, friendRequests, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedServer) return null;

  const pendingRequests = friendRequests.filter(
    (fr) => fr.status === 'pending' && fr.toUserId === currentUser?.id
  );

  return (
    <div className="w-full bg-[#2b2d31] flex flex-col h-full">
      <div className="h-12 px-4 flex items-center border-b border-[#1e1f22]">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-[#949ba4]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find or start a conversation"
            className="pl-8 pr-8 bg-[#1e1f22] border-none text-white text-sm h-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dms" className="flex-1 flex flex-col">
        <TabsList className="w-full bg-[#2b2d31] border-b border-[#1e1f22] rounded-none h-auto p-0">
          <TabsTrigger
            value="dms"
            className="flex-1 data-[state=active]:bg-[#404249] data-[state=active]:text-white rounded-none py-2"
          >
            Direct Messages
          </TabsTrigger>
          <TabsTrigger
            value="friends"
            className="flex-1 data-[state=active]:bg-[#404249] data-[state=active]:text-white rounded-none py-2 relative"
          >
            Friends
            {pendingRequests.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dms" className="flex-1 m-0">
          <DMList searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="friends" className="flex-1 m-0">
          <div className="flex flex-col h-full">
            <div className="border-b border-[#1e1f22]">
              {pendingRequests.length > 0 && (
                <div className="px-2 py-2">
                  <div className="text-xs text-[#949ba4] uppercase font-semibold px-2 mb-1">
                    Pending — {pendingRequests.length}
                  </div>
                  <FriendRequests />
                </div>
              )}
            </div>
            <div className="flex-1">
              <FriendsList searchQuery={searchQuery} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};