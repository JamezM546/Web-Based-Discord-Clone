import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hash, ChevronDown, Settings, Plus, UserPlus, Users } from 'lucide-react';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ServerSettings } from '../server/ServerSettings';
import { ScrollArea } from '../ui/scroll-area';
import { UnreadBadge } from '../ui/unread-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const ChannelList: React.FC = () => {
  const { selectedServer, channels, selectedChannel, setSelectedChannel, setSelectedDM, currentUser, getUnreadCount } = useApp();
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);

  if (!selectedServer) return null;

  const serverChannels = channels.filter((c) => c.serverId === selectedServer.id);
  const isOwner = selectedServer.ownerId === currentUser?.id;

  const handleChannelClick = (channel: typeof channels[0]) => {
    setSelectedChannel(channel);
    setSelectedDM(null);
  };

  return (
    <>
      <div className="w-full bg-[#2b2d31] flex flex-col h-full">
        <DropdownMenu>
          <DropdownMenuTrigger className="h-12 px-4 flex items-center justify-between hover:bg-[#35373c] border-b border-[#1e1f22] text-white">
            <span className="font-semibold">{selectedServer.name}</span>
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#111214] border-none text-white">
            <DropdownMenuItem className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer">
              <UserPlus className="size-4 mr-2" />
              Invite People
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem
                  onClick={() => setServerSettingsOpen(true)}
                  className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
                >
                  <Settings className="size-4 mr-2" />
                  Server Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCreateChannelOpen(true)}
                  className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
                >
                  <Plus className="size-4 mr-2" />
                  Create Channel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ScrollArea className="flex-1">
          <div className="px-2 py-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-1 text-xs text-[#949ba4] uppercase font-semibold">
                <Hash className="size-3" />
                Text Channels
              </div>
              {isOwner && (
                <button
                  onClick={() => setCreateChannelOpen(true)}
                  className="text-[#949ba4] hover:text-white"
                >
                  <Plus className="size-4" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {serverChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full px-2 py-1.5 rounded flex items-center gap-1.5 text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] ${
                    selectedChannel?.id === channel.id ? 'bg-[#404249] text-white' : ''
                  }`}
                >
                  <Hash className="size-4" />
                  <span className="text-sm">{channel.name}</span>
                  {getUnreadCount(channel.id) > 0 && <UnreadBadge count={getUnreadCount(channel.id)} />}
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 py-4 border-t border-[#1e1f22]">
            <div className="flex items-center gap-1 px-2 mb-2 text-xs text-[#949ba4] uppercase font-semibold">
              <Users className="size-3" />
              Members — {selectedServer.members.length}
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
    </>
  );
};