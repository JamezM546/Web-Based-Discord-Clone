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
      <DialogContent className="bg-[#313338] text-white border-none" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Add Friend
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-[#b5bac1] text-sm">
          Add a friend by entering their username.
        </DialogDescription>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="username" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-[#1e1f22] border-none text-white mt-2"
              placeholder="Enter username"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes('sent') ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}

          <div className="p-3 bg-[#1e1f22] rounded text-xs text-[#b5bac1]">
            <p className="font-semibold mb-1">Available users:</p>
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
            className="text-white hover:bg-[#4e5058]"
          >
            Cancel
          </Button>
          <Button onClick={handleSend} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
            Send Friend Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};