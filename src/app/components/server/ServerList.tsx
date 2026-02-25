import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Home } from 'lucide-react';
import { CreateServerDialog } from './CreateServerDialog';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const ServerList: React.FC = () => {
  const { servers, selectedServer, setSelectedServer, setSelectedChannel, setSelectedDM, currentUser } = useApp();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleServerClick = (server: typeof servers[0]) => {
    setSelectedServer(server);
    setSelectedChannel(null);
    setSelectedDM(null);
  };

  const handleHomeClick = () => {
    setSelectedServer(null);
    setSelectedChannel(null);
  };

  const userServers = servers.filter((s) => s.members.includes(currentUser?.id || ''));

  return (
    <>
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleHomeClick}
                className={`size-12 rounded-[24px] flex items-center justify-center transition-all ${
                  !selectedServer
                    ? 'bg-[#5865f2] text-white rounded-[16px]'
                    : 'bg-[#313338] text-[#949ba4] hover:bg-[#5865f2] hover:text-white hover:rounded-[16px]'
                }`}
              >
                <Home className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Direct Messages</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-8 h-[2px] bg-[#35363c] rounded-full" />

          <ScrollArea className="flex-1 w-full">
            <div className="flex flex-col items-center gap-2 px-3">
              {userServers.map((server) => (
                <Tooltip key={server.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleServerClick(server)}
                      className={`size-12 rounded-[24px] flex items-center justify-center text-lg transition-all ${
                        selectedServer?.id === server.id
                          ? 'bg-[#5865f2] text-white rounded-[16px]'
                          : 'bg-[#313338] text-white hover:bg-[#5865f2] hover:rounded-[16px]'
                      }`}
                    >
                      {server.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{server.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="size-12 rounded-[24px] bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white hover:rounded-[16px] flex items-center justify-center transition-all"
                  >
                    <Plus className="size-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add a Server</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </ScrollArea>
        </TooltipProvider>
      </div>

      <CreateServerDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
};