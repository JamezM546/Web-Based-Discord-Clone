import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Hash } from 'lucide-react';

const MAX_CHANNEL_NAME_LENGTH = 25;

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  onCreateChannel?: (serverId: string, name: string) => Promise<void>;
  isCreating?: boolean;
}

export const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
  open,
  onOpenChange,
  serverId,
  onCreateChannel,
  isCreating = false,
}) => {
  const [name, setName] = useState('');
  const { createChannel } = useApp();

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (name.trim()) {
      try {
        const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, MAX_CHANNEL_NAME_LENGTH);
        if (onCreateChannel) {
          await onCreateChannel(serverId, formattedName);
        } else {
          await createChannel(serverId, formattedName);
        }
        setName('');
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to create channel:", error);
      }
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
                onChange={(e) => setName(e.target.value.slice(0, MAX_CHANNEL_NAME_LENGTH))}
                maxLength={MAX_CHANNEL_NAME_LENGTH}
                className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] pl-9 focus-visible:ring-[#06b6d4]/50 placeholder:text-[#475569]"
                placeholder="new-room"
              />
            </div>
            <div className="mt-2 text-right text-xs text-[#475569]">
              {name.length}/{MAX_CHANNEL_NAME_LENGTH}
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
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()} className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none disabled:opacity-50 disabled:cursor-not-allowed">
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
