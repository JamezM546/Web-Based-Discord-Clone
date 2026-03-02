import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Hash } from 'lucide-react';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

export const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
  open,
  onOpenChange,
  serverId,
}) => {
  const [name, setName] = useState('');
  const { createChannel } = useApp();

  const handleCreate = () => {
    if (name.trim()) {
      createChannel(serverId, name.toLowerCase().replace(/\s+/g, '-'));
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">Create a Room</DialogTitle>
          <DialogDescription className="text-[#475569]">Enter a name for the new room</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="channel-name" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
              Room Name
            </Label>
            <div className="relative mt-2">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#475569]" />
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] pl-9 focus-visible:ring-[#06b6d4]/50 placeholder:text-[#475569]"
                placeholder="new-room"
              />
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
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};