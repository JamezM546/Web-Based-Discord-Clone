import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserPlus } from 'lucide-react';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFriendDialog: React.FC<AddFriendDialogProps> = ({ open, onOpenChange }) => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const { users, currentUser, sendFriendRequest } = useApp();

  const handleSend = () => {
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== currentUser?.id
    );

    if (!user) {
      setMessage('User not found');
      return;
    }

    sendFriendRequest(user.id);
    setMessage('Friend request sent!');
    setUsername('');

    setTimeout(() => {
      onOpenChange(false);
      setMessage('');
    }, 1500);
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-2 focus-visible:ring-[#06b6d4]/50 placeholder:text-[#475569]"
              placeholder="Enter username"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <div className="p-3 bg-[#060c18] border border-[#1e3248] rounded-xl text-xs text-[#475569]">
            <p className="font-semibold mb-1 text-[#64748b]">Available users:</p>
            {users
              .filter((u) => u.id !== currentUser?.id)
              .map((u) => (
                <p key={u.id}>{u.username}</p>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
          >
            Cancel
          </Button>
          <Button onClick={handleSend} className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none">
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};