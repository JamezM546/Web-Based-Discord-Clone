import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Hash, ChevronDown, Settings, Plus, UserPlus, LogOut } from 'lucide-react';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ServerSettings } from '../server/ServerSettings';
import { InvitePeopleDialog } from '../server/InvitePeopleDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ChannelListProps {
  onChannelSelect?: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect }) => {
  const { selectedServer, channels, selectedChannel, setSelectedChannel, setSelectedDM, currentUser, getUnreadCount, markAsRead, updateChannel, deleteChannel, createChannel, leaveServer } = useApp();
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [invitePeopleOpen, setInvitePeopleOpen] = useState(false);
  const [isLeavingServer, setIsLeavingServer] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [lastCreatedChannelId, setLastCreatedChannelId] = useState<string | null>(null);
  const [previousChannelCount, setPreviousChannelCount] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const channelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
  const [leaveErrorOpen, setLeaveErrorOpen] = useState(false);

  if (!selectedServer) return null;

  const serverChannels = channels
    .filter((c) => c.serverId === selectedServer.id)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const isOwner = selectedServer.ownerId === currentUser?.id;

  // Track when channels are added to trigger scroll
  useEffect(() => {
    const currentCount = serverChannels.length;
    // Initialize previous count on first render
    if (previousChannelCount === null) {
      setPreviousChannelCount(currentCount);
      return;
    }
    
    if (currentCount > previousChannelCount) {
      // A new channel was added, scroll to it
      // The new channel is at the new index (currentCount - 1) because count increased
      const newChannel = serverChannels[currentCount - 1];
      setLastCreatedChannelId(newChannel.id);
    }
    setPreviousChannelCount(currentCount);
  }, [serverChannels.length, previousChannelCount]);

  const handleChannelClick = (channel: typeof channels[0]) => {
    setSelectedChannel(channel);
    setSelectedDM(null);
    // Don't markAsRead here — let WhatYouMissed show first.
    // markAsRead is called when user dismisses the banner.
    if (onChannelSelect) {
      onChannelSelect();
    }
  };

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [channelToRename, setChannelToRename] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

  const getLeaveErrorMessage = (error: unknown) => {
    const fallback = 'We could not leave this server right now. Please try again.';
    if (error instanceof Error && error.message) {
      if (error.message.includes('Owner cannot leave the server')) {
        return 'You own this server, so you cannot leave it directly. Delete the server first, or transfer ownership before leaving.';
      }
      return error.message;
    }
    return fallback;
  };

  const handleLeaveServer = async () => {
    if (!selectedServer) return;
    try {
      setIsLeavingServer(true);
      await leaveServer(selectedServer.id);
      setLeaveConfirmOpen(false);
    } catch (error) {
      console.error('Failed to leave server:', error);
      setLeaveConfirmOpen(false);
      setLeaveErrorMessage(getLeaveErrorMessage(error));
      setLeaveErrorOpen(true);
    } finally {
      setIsLeavingServer(false);
    }
  };

  const hasUnreadMessages = (channelId: string) => {
    return getUnreadCount(channelId) > 0;
  };

  // Auto-scroll to show newly created channel
  useEffect(() => {
    if (lastCreatedChannelId && scrollAreaRef.current) {
      // Use native scrolling - scroll to bottom to show newest channel
      // Wait for DOM to update and ScrollArea to recalculate dimensions
      setTimeout(() => {
        const viewport = scrollAreaRef.current;
        if (viewport) {
          // Force a reflow to ensure scroll dimensions are calculated
          void viewport.offsetHeight;
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150); // Longer delay to ensure ScrollArea has time to recalculate
      // Clear the highlight after delay
      setTimeout(() => setLastCreatedChannelId(null), 2000);
    }
  }, [lastCreatedChannelId]);

  const handleCreateChannel = async (serverId: string, name: string) => {
    if (!name.trim()) return;

    setIsCreatingChannel(true);
    try {
      await createChannel(serverId, name);
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [channelToRename, setChannelToRename] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

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
            <div className="my-1 h-px bg-[#1e3248]" />
            <DropdownMenuItem
              onClick={() => setLeaveConfirmOpen(true)}
              disabled={isLeavingServer}
              className="text-[#ef4444] hover:text-white hover:bg-[#7f1d1d] cursor-pointer"
            >
              <LogOut className="size-4 mr-2" />
              {isLeavingServer ? 'Leaving...' : 'Leave Server'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div 
          ref={scrollAreaRef} 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-20"
          style={{ scrollBehavior: 'smooth' }}
        >
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
              {serverChannels.map((channel, index) => {
                const unread = hasUnreadMessages(channel.id) && selectedChannel?.id !== channel.id;
                const isSelected = selectedChannel?.id === channel.id;
                const showControls = selectedServer.ownerId === currentUser?.id;
                const isNewlyCreated = channel.id === lastCreatedChannelId;
                return (
                  <div key={channel.id} className="group flex items-center">
                    <button
                      ref={(el) => { channelRefs.current[channel.id] = el; }}
                      onClick={() => handleChannelClick(channel)}
                      className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                        isSelected
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30'
                          : unread
                          ? 'text-[#e2e8f0] hover:bg-[#1a2d45]'
                          : 'text-[#64748b] hover:bg-[#1a2d45] hover:text-[#94a3b8]'
                      } ${isNewlyCreated ? 'animate-pulse bg-[#06b6d4]/10' : ''}`}
                    >
                      <Hash className={`size-4 flex-shrink-0 ${isSelected ? 'text-[#06b6d4]' : ''}`} />
                      <span className={`text-sm truncate ${unread ? 'font-semibold' : ''}`}>
                        {channel.name}
                      </span>
                      {unread && (
                        <span className="ml-auto size-2 rounded-full bg-[#06b6d4] flex-shrink-0" />
                      )}
                    </button>

                    {showControls && (
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-[#1a2d45]">
                              <Settings className="size-4 text-[#94a3b8]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40 bg-[#0a1628] border border-[#1e3248] text-[#e2e8f0] shadow-xl">
                            <DropdownMenuItem onClick={() => { setChannelToRename(channel.id); setRenameName(channel.name); setRenameOpen(true); }} className="cursor-pointer text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]">Rename</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setChannelToDelete(channel.id); setConfirmDeleteOpen(true); }} className="cursor-pointer text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        serverId={selectedServer.id}
        onCreateChannel={handleCreateChannel}
        isCreating={isCreatingChannel}
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

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Server?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#94a3b8]">
              {selectedServer
                ? `You are about to leave "${selectedServer.name}". You will lose access to its channels and messages until someone invites you back.`
                : 'You are about to leave this server.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e3248] bg-transparent text-[#94a3b8] hover:bg-[#1a2d45] hover:text-[#e2e8f0]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveServer}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLeavingServer ? 'Leaving...' : 'Leave Server'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={leaveErrorOpen} onOpenChange={setLeaveErrorOpen}>
        <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>Unable to Leave Server</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              {leaveErrorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setLeaveErrorOpen(false)}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={(v) => setRenameOpen(v)}>
        <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>Rename Channel</DialogTitle>
            <DialogDescription className="text-[#64748b]">Enter a new name for the channel</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-name" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">Name</Label>
            <div className="mt-2">
              <Input id="rename-name" value={renameName} onChange={(e) => setRenameName(e.target.value)} className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-[#94a3b8] hover:text-[#e2e8f0]" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none" onClick={() => {
              if (channelToRename && renameName.trim()) {
                const formatted = renameName.trim().toLowerCase().replace(/\s+/g, '-');
                updateChannel(channelToRename, { name: formatted });
                setRenameOpen(false);
                setChannelToRename(null);
              }
            }}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={(v) => setConfirmDeleteOpen(v)}>
        <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription className="text-[#64748b]">This will permanently delete the channel and its messages. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" className="text-[#94a3b8] hover:text-[#e2e8f0]" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={() => {
              if (channelToDelete) {
                deleteChannel(channelToDelete);
                setConfirmDeleteOpen(false);
                setChannelToDelete(null);
              }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
