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
      <DialogContent className="bg-[#313338] text-white border-none" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create Text Channel</DialogTitle>
          <DialogDescription>Enter a name for the new channel</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="channel-name" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Channel Name
            </Label>
            <div className="relative mt-2">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6d6f78]" />
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1e1f22] border-none text-white pl-9"
                placeholder="new-channel"
              />
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
            Create Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};