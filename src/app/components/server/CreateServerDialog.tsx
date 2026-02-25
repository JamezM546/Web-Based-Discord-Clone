import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emojiOptions = ['🚀', '🎮', '📚', '💻', '🎨', '🎵', '⚽', '🍕', '🌟', '🔥'];

export const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const { createServer } = useApp();

  const handleCreate = () => {
    if (name.trim()) {
      createServer(name, icon);
      setName('');
      setIcon('🚀');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#313338] text-white border-none" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create a server</DialogTitle>
          <DialogDescription>Enter a name for your server.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="server-name" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Server Name
            </Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1e1f22] border-none text-white mt-2"
              placeholder="My Awesome Server"
            />
          </div>

          <div>
            <Label className="text-[#b5bac1] uppercase text-xs font-semibold">Server Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`size-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    icon === emoji
                      ? 'bg-[#5865f2] ring-2 ring-[#5865f2]'
                      : 'bg-[#1e1f22] hover:bg-[#2b2d31]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
          <Button onClick={handleCreate} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};