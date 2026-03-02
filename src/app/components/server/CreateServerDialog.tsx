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
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">Create a Space</DialogTitle>
          <DialogDescription className="text-[#475569]">Enter a name for your new space.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="server-name" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
              Space Name
            </Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-2 focus-visible:ring-[#06b6d4]/50 placeholder:text-[#475569]"
              placeholder="My Awesome Space"
            />
          </div>

          <div>
            <Label className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">Space Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`size-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    icon === emoji
                      ? 'bg-[#06b6d4]/20 ring-2 ring-[#06b6d4] text-white'
                      : 'bg-[#060c18] border border-[#1e3248] hover:bg-[#1a2d45]'
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
            className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none">
            Create Space
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};