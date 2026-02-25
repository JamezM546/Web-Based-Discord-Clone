import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { ServerList } from '../components/server/ServerList';
import { ChannelList } from '../components/channel/ChannelList';
import { UserSidebar } from '../components/user/UserSidebar';
import { MessageArea } from '../components/messaging/MessageArea';
import { UserProfile } from '../components/user/UserProfile';
import { AddFriendDialog } from '../components/user/AddFriendDialog';
import { ServerSearchInput, ServerSearch } from '../components/search/ServerSearch';
import { MemberList } from '../components/server/MemberList';
import { UserPlus, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';

export const MainLayout: React.FC = () => {
  const { currentUser, selectedServer } = useApp();
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#313338]">
      {/* Server List - Desktop */}
      <div className="hidden md:flex">
        <ServerList />
      </div>

      {/* Channel/User Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-60">
        <div className="flex-1 overflow-hidden">
          {selectedServer ? <ChannelList /> : <UserSidebar />}
        </div>
        <UserProfile />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden h-12 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center px-4 gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-[#35373c] rounded text-white">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] bg-[#2b2d31] border-none">
              <div className="flex h-full">
                <ServerList />
                <div className="flex-1 flex flex-col">
                  {selectedServer ? (
                    <ChannelList />
                  ) : (
                    <UserSidebar />
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 text-white font-semibold truncate">
            {selectedServer?.name || 'Direct Messages'}
          </div>

          {!selectedServer && (
            <Button
              onClick={() => setAddFriendOpen(true)}
              size="sm"
              className="bg-[#5865f2] hover:bg-[#4752c4] p-2"
            >
              <UserPlus className="size-5" />
            </Button>
          )}
        </div>

        {/* Search and Add Friend - Desktop */}
        {!selectedServer && (
          <div className="hidden md:block bg-[#2b2d31] border-b border-[#1e1f22]">
            <div className="h-12 px-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">Friends</h2>
              <Button
                onClick={() => setAddFriendOpen(true)}
                size="sm"
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                <UserPlus className="size-4 mr-2" />
                Add Friend
              </Button>
            </div>
          </div>
        )}

        {/* Server Search - Only when server is selected */}
        {selectedServer && (
          <div className="hidden md:block bg-[#2b2d31] border-b border-[#1e1f22] relative">
            <ServerSearchInput value={serverSearchQuery} onChange={setServerSearchQuery} />
            <ServerSearch searchQuery={serverSearchQuery} onSearchChange={setServerSearchQuery} />
          </div>
        )}

        {/* Message Area */}
        <MessageArea />
      </div>

      {/* Member List - Desktop - Only when server channel is selected */}
      {selectedServer && (
        <div className="hidden md:flex">
          <MemberList />
        </div>
      )}

      <AddFriendDialog open={addFriendOpen} onOpenChange={setAddFriendOpen} />
    </div>
  );
};