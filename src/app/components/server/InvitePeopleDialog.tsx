import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Server } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X, Check } from 'lucide-react';

interface InvitePeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server;
}

export const InvitePeopleDialog: React.FC<InvitePeopleDialogProps> = ({
  open,
  onOpenChange,
  server,
}) => {
  const { users, sendServerInvite, currentUser, getFriends } = useApp();
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get friends who are not already members
  const friends = getFriends();
  const availableFriends = friends.filter(
    f => !server.members.includes(f.id)
  );

  // Prefix matching for suggestions
  const filteredFriends = usernameInput.trim()
    ? availableFriends.filter(f => 
        f.username.toLowerCase().startsWith(usernameInput.toLowerCase()) ||
        (f.displayName && f.displayName.toLowerCase().startsWith(usernameInput.toLowerCase()))
      ).filter(f => !selectedUsernames.includes(f.username))
    : [];

  const handleAddUsername = () => {
    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername) return;

    const friend = availableFriends.find(
      f => f.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (!friend) {
      setError(`User "${trimmedUsername}" is not your friend or is already a member`);
      return;
    }

    if (selectedUsernames.includes(friend.username)) {
      setError(`${friend.username} is already in the invite list`);
      return;
    }

    setSelectedUsernames([...selectedUsernames, friend.username]);
    setUsernameInput('');
    setError('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (username: string) => {
    const friend = availableFriends.find(f => f.username === username);
    if (!friend) return;

    if (selectedUsernames.includes(friend.username)) {
      setError(`${friend.username} is already in the invite list`);
      return;
    }

    setSelectedUsernames([...selectedUsernames, friend.username]);
    setUsernameInput('');
    setError('');
    setShowSuggestions(false);
  };

  const handleRemoveUsername = (username: string) => {
    setSelectedUsernames(selectedUsernames.filter(u => u !== username));
  };

  const handleSendInvites = () => {
    selectedUsernames.forEach(username => {
      const friend = friends.find(f => f.username === username);
      if (friend) {
        sendServerInvite(server.id, friend.id);
      }
    });
    
    // Reset and close
    setSelectedUsernames([]);
    setUsernameInput('');
    setError('');
    setShowSuggestions(false);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's exactly one suggestion, select it
      if (filteredFriends.length === 1) {
        handleSelectSuggestion(filteredFriends[0].username);
      } else {
        handleAddUsername();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClose = () => {
    setSelectedUsernames([]);
    setUsernameInput('');
    setError('');
    setShowSuggestions(false);
    onOpenChange(false);
  };

  // Invite link (invite codes) state
  const { getInviteCodes, createInviteCode, deleteInviteCode } = useApp();
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadInviteCodes = async () => {
    if (!server) return;
    setInviteLoading(true);
    try {
      const codes = await getInviteCodes(server.id);
      const list = codes || [];
      if (list.length === 0 && currentUser && server.ownerId === currentUser.id) {
        // auto-create a single invite link for the owner (hidden creation)
        try {
          const inv = await createInviteCode(server.id, {});
          if (inv) setInviteCodes([inv]);
          else setInviteCodes([]);
        } catch (e) {
          console.error('Failed to auto-create invite code:', e);
          setInviteCodes([]);
        }
      } else {
        setInviteCodes(list);
      }
    } catch (err) {
      console.error('Failed to load invite codes:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  // Load invite codes when dialog opens
  React.useEffect(() => {
    if (open && server) {
      void loadInviteCodes();
    }
  }, [open, server]);

  

  const handleCopyInvite = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    try {
      navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard write failed', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0] text-xl font-semibold">
            Invite to {server.name}
          </DialogTitle>
          <DialogDescription className="text-[#475569]">
            Select friends to send space invitations via direct chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Username Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
              Friend Username
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setError('');
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyPress}
                  placeholder="Start typing a friend's name..."
                  className="flex-1 bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:ring-[#06b6d4]/50"
                  autoComplete="off"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredFriends.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#0a1628] border border-[#1e3248] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredFriends.map(friend => {
                      const displayName = friend.displayName || friend.username;
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(friend.username)}
                          className="w-full flex items-center gap-2 p-2.5 hover:bg-[#1a2d45] transition-colors text-left"
                        >
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="size-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[#e2e8f0] font-medium truncate">{displayName}</div>
                            {friend.displayName && (
                              <div className="text-xs text-[#475569] truncate">@{friend.username}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button
                onClick={handleAddUsername}
                className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 border-none"
              >
                Add
              </Button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Selected Users List */}
          {selectedUsernames.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                Inviting ({selectedUsernames.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedUsernames.map(username => {
                  const user = users.find(u => u.username === username);
                  const displayName = user?.displayName || username;
                  return (
                    <div
                      key={username}
                      className="flex items-center justify-between bg-[#111e30] border border-[#1e3248] rounded-xl p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={user?.avatar}
                          alt={username}
                          className="size-8 rounded-full"
                        />
                        <div>
                          <div className="text-[#e2e8f0] font-medium">{displayName}</div>
                          {user?.displayName && (
                            <div className="text-xs text-[#475569]">@{username}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUsername(username)}
                        className="text-[#475569] hover:text-red-400 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Friends Hint */}
          {availableFriends.length > 0 ? (
            <div className="text-xs text-[#475569]">
              {availableFriends.length} friend{availableFriends.length !== 1 ? 's' : ''} available to invite
            </div>
          ) : (
            <div className="text-xs text-[#475569]">
              No friends available to invite. All friends are already members.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={selectedUsernames.length === 0}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="size-4 mr-2" />
              Send {selectedUsernames.length > 0 ? `(${selectedUsernames.length})` : ''} Invite{selectedUsernames.length !== 1 ? 's' : ''}
            </Button>
          </div>

          {/* Invite link area (Discord-like) */}
          <div className="pt-4 border-t border-[#1e3248] mt-4">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
              Or, send a server invite link to a friend
            </label>
              <div className="flex gap-2 items-center">
              <Input
                readOnly
                value={inviteCodes.length > 0 ? `${window.location.origin}/invite/${inviteCodes[0].code}` : ''}
                placeholder={inviteLoading ? 'Loading...' : 'No invite link yet'}
                className="flex-1 bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569]"
                aria-describedby={copied ? 'invite-copy-status' : undefined}
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => inviteCodes.length > 0 && handleCopyInvite(inviteCodes[0].code)}
                  className={`text-white ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-[#06b6d4] hover:bg-[#0891b2]'}`}
                  disabled={inviteCodes.length === 0}
                  aria-pressed={copied}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 mr-2" />Copied!
                    </>
                  ) : (
                    'Copy'
                  )}
                </Button>
              </div>
            </div>
            {/* Accessible live region for copy status */}
            <div id="invite-copy-status" className="sr-only" aria-live="polite">{copied ? 'Invite link copied to clipboard' : ''}</div>
            {inviteCodes.length > 0 && inviteCodes[0].expiresAt && (
              <div className="text-xs text-[#94a3b8] mt-2">Your invite link expires on {new Date(inviteCodes[0].expiresAt).toLocaleString()}. Edit invite link.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};