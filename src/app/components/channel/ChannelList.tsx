import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hash, ChevronDown, Settings, Plus, UserPlus } from 'lucide-react';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ServerSettings } from '../server/ServerSettings';
import { InvitePeopleDialog } from '../server/InvitePeopleDialog';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ChannelListProps {
  onChannelSelect?: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect }) => {
  const { selectedServer, channels, selectedChannel, setSelectedChannel, setSelectedDM, currentUser, getUnreadCount, markAsRead } = useApp();
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [invitePeopleOpen, setInvitePeopleOpen] = useState(false);

  if (!selectedServer) return null;

  const serverChannels = channels.filter((c) => c.serverId === selectedServer.id);
  const isOwner = selectedServer.ownerId === currentUser?.id;

  const handleChannelClick = (channel: typeof channels[0]) => {
    setSelectedChannel(channel);
    setSelectedDM(null);
    markAsRead(channel.id);
    if (onChannelSelect) {
      onChannelSelect();
    }
  };

  const hasUnreadMessages = (channelId: string) => {
    return getUnreadCount(channelId) > 0;
  };

  return (
    <>
      <div className="w-full bg-[#0d1a2e] flex flex-col h-full min-h-0">
        {/* Space name header / dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-12 px-4 flex items-center justify-between hover:bg-[#1a2d45] border-b border-[#1e3248] text-[#e2e8f0] transition-colors">
            <span className="font-semibold truncate">{selectedServer.icon} {selectedServer.name}</span>
            <ChevronDown className="size-4 text-[#94a3b8] flex-shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#0a1628] border border-[#1e3248] text-[#e2e8f0] shadow-xl">
            <DropdownMenuItem
              onClick={() => setInvitePeopleOpen(true)}
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
            >
              <UserPlus className="size-4 mr-2 text-[#06b6d4]" />
              Invite People
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem
                  onClick={() => setServerSettingsOpen(true)}
                  className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
                >
                  <Settings className="size-4 mr-2 text-[#06b6d4]" />
                  Space Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCreateChannelOpen(true)}
                  className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
                >
                  <Plus className="size-4 mr-2 text-[#06b6d4]" />
                  Create Room
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ScrollArea className="flex-1">
          <div className="px-3 py-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-[#475569] uppercase font-semibold tracking-wider">
                <Hash className="size-3" />
                Rooms
              </div>
              {isOwner && (
                <button
                  onClick={() => setCreateChannelOpen(true)}
                  className="text-[#475569] hover:text-[#06b6d4] transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {serverChannels.map((channel) => {
                const unread = hasUnreadMessages(channel.id) && selectedChannel?.id !== channel.id;
                const isSelected = selectedChannel?.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel)}
                    className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? 'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30'
                        : unread
                        ? 'text-[#e2e8f0] hover:bg-[#1a2d45]'
                        : 'text-[#64748b] hover:bg-[#1a2d45] hover:text-[#94a3b8]'
                    }`}
                  >
                    <Hash className={`size-4 flex-shrink-0 ${isSelected ? 'text-[#06b6d4]' : ''}`} />
                    <span className={`text-sm truncate ${unread ? 'font-semibold' : ''}`}>
                      {channel.name}
                    </span>
                    {unread && (
                      <span className="ml-auto size-2 rounded-full bg-[#06b6d4] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        serverId={selectedServer.id}
      />

      {selectedServer && (
        <ServerSettings
          server={selectedServer}
          open={serverSettingsOpen}
          onOpenChange={setServerSettingsOpen}
        />
      )}

      {selectedServer && (
        <InvitePeopleDialog
          server={selectedServer}
          open={invitePeopleOpen}
          onOpenChange={setInvitePeopleOpen}
        />
      )}
    </>
  );
};