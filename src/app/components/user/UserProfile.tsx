import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { UserSettings } from './UserSettings';
import { StatusDot, getStatusLabel } from '../ui/StatusDot';
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayedName = currentUser.displayName || currentUser.username;

  return (
    <>
      <div className="h-14 bg-[#0a1628] border-t border-[#1e3248] px-3 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 flex-1 hover:bg-[#1a2d45] rounded-xl px-2 py-1.5 transition-colors min-w-0"
            aria-label={`User menu for ${displayedName}, status: ${getStatusLabel(currentUser.status)}`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.avatar}
                alt=""
                aria-hidden="true"
                className="size-8 rounded-full ring-2 ring-[#1e3248]"
              />
              <StatusDot
                status={currentUser.status}
                borderColor="#0a1628"
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[#e2e8f0] text-sm font-semibold truncate">{displayedName}</div>
              <div className="text-[#475569] text-xs" aria-hidden="true">{getStatusLabel(currentUser.status)}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 bg-[#0a1628] border border-[#1e3248] text-[#e2e8f0] shadow-xl mb-1">
            <div className="px-2 py-1.5 text-xs text-[#475569] font-semibold uppercase tracking-wider" role="heading" aria-level={3}>
              Set Status
            </div>
            <DropdownMenuItem
              onClick={() => updateUserStatus('online')}
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
            >
              <StatusDot status="online" borderColor="#0a1628" className="mr-2.5 flex-shrink-0" />
              Online
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateUserStatus('idle')}
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
            >
              <StatusDot status="idle" borderColor="#0a1628" className="mr-2.5 flex-shrink-0" />
              Away
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateUserStatus('dnd')}
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
            >
              <StatusDot status="dnd" borderColor="#0a1628" className="mr-2.5 flex-shrink-0" />
              Busy
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateUserStatus('offline')}
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer"
            >
              <StatusDot status="offline" borderColor="#0a1628" className="mr-2.5 flex-shrink-0" />
              Invisible
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1e3248]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 hover:text-white hover:bg-red-500/20 cursor-pointer"
            >
              <LogOut className="size-4 mr-2" aria-hidden="true" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="Open user settings"
                className="p-2 hover:bg-[#1a2d45] rounded-lg text-[#475569] hover:text-[#94a3b8] transition-colors flex-shrink-0"
              >
                <Settings className="size-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Settings</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <UserSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};