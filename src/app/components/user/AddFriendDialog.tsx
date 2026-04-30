import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserPlus, Loader2 } from 'lucide-react';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFriendDialog: React.FC<AddFriendDialogProps> = ({ open, onOpenChange }) => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { currentUser, sendFriendRequest } = useApp();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setUsername('');
      setMessage('');
      setSearchResults([]);
      setSelectedUserId(null);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = username.trim();
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await apiService.searchUsers(q, 10);
        setSearchResults(results.filter((u: any) => u.id !== currentUser?.id));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username, currentUser?.id]);

  const handleSend = () => {
    const targetId = selectedUserId || searchResults.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    )?.id;

    if (!targetId) {
      setMessage('User not found');
      return;
    }

    sendFriendRequest(targetId);
    setMessage('Friend request sent!');
    setUsername('');

    setTimeout(() => {
      onOpenChange(false);
      setMessage('');
    }, 1500);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = searchResults.find(u => u.id === userId);
    if (selectedUser) {
      setUsername(selectedUser.username);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#e2e8f0]">
            <UserPlus className="size-5 text-[#06b6d4]" />
            Add Friend
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-[#475569] text-sm">
          Add a friend by entering their username.
        </DialogDescription>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="username" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-2 focus-visible:ring-[#06b6d4]/50 placeholder:text-[#475569]"
              placeholder="Enter username"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          {isSearching && (
            <div className="flex items-center gap-2 text-[#475569] text-sm">
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="p-2 bg-[#060c18] border border-[#1e3248] rounded-xl space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-[#64748b] px-1 mb-1">Search results</p>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1a2d45] transition-colors text-left ${
                    selectedUserId === u.id ? 'bg-[#1a2d45] ring-1 ring-[#06b6d4]/50' : ''
                  }`}
                >
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                    alt=""
                    className="size-7 rounded-full ring-2 ring-[#1e3248]"
                  />
                  <span className="text-sm text-[#e2e8f0]">{u.display_name || u.username}</span>
                  <span className="text-xs text-[#475569]">@{u.username}</span>
                  {selectedUserId === u.id && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-[#06b6d4] rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSearching && username.trim().length > 0 && searchResults.length === 0 && (
            <div className="text-xs text-[#475569] p-3 bg-[#060c18] border border-[#1e3248] rounded-xl">
              No users found matching "{username}"
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleSend()} 
            className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none"
            disabled={!selectedUserId && searchResults.length === 0}
          >
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
