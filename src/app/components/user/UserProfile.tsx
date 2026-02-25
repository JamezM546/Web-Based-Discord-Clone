import React from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Mic, Headphones, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const UserProfile: React.FC = () => {
  const { currentUser, logout, updateUserStatus } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 flex-1 hover:bg-[#35373c] rounded px-1 py-1">
          <div className="relative">
            <img src={currentUser.avatar} alt={currentUser.username} className="size-8 rounded-full" />
            <div
              className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#232428] ${getStatusColor(
                currentUser.status
              )}`}
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-white text-sm font-semibold truncate">{currentUser.username}</div>
            <div className="text-[#949ba4] text-xs capitalize">{currentUser.status}</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#111214] border-none text-white mb-2">
          <DropdownMenuItem
            onClick={() => updateUserStatus('online')}
            className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
          >
            <div className="size-3 rounded-full bg-green-500 mr-2" />
            Online
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => updateUserStatus('idle')}
            className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
          >
            <div className="size-3 rounded-full bg-yellow-500 mr-2" />
            Idle
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => updateUserStatus('dnd')}
            className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
          >
            <div className="size-3 rounded-full bg-red-500 mr-2" />
            Do Not Disturb
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => updateUserStatus('offline')}
            className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
          >
            <div className="size-3 rounded-full bg-gray-500 mr-2" />
            Invisible
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#3f4147]" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-400 hover:text-white hover:bg-red-600 cursor-pointer"
          >
            <LogOut className="size-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white">
                <Mic className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mute</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white">
                <Headphones className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Deafen</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white">
                <Settings className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>User Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};