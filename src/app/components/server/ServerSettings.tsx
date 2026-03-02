import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Server } from '../../types';
import { Trash2 } from 'lucide-react';

interface ServerSettingsProps {
  server: Server;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emojiOptions = ['🚀', '🎮', '📚', '💻', '🎨', '🎵', '⚽', '🍕', '🌟', '🔥'];

export const ServerSettings: React.FC<ServerSettingsProps> = ({ server, open, onOpenChange }) => {
  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState(server.icon);
  const { updateServerSettings, deleteServer, currentUser } = useApp();

  const isOwner = server.ownerId === currentUser?.id;

  const handleSave = () => {
    if (name.trim()) {
      updateServerSettings(server.id, name, icon);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${server.name}"? This cannot be undone.`)) {
      deleteServer(server.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[#e2e8f0]">Space Settings</DialogTitle>
          <DialogDescription className="text-[#475569]">Change the space name and icon.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-server-name" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
              Space Name
            </Label>
            <Input
              id="edit-server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-2 focus-visible:ring-[#06b6d4]/50"
              disabled={!isOwner}
            />
          </div>

          <div>
            <Label className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">Space Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  disabled={!isOwner}
                  className={`size-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    icon === emoji
                      ? 'bg-[#06b6d4]/20 ring-2 ring-[#06b6d4]'
                      : 'bg-[#060c18] border border-[#1e3248] hover:bg-[#1a2d45]'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-[#1e3248]">
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full bg-red-600/80 hover:bg-red-600 text-white border-none"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Space
              </Button>
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
          {isOwner && (
            <Button onClick={handleSave} className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none">
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};