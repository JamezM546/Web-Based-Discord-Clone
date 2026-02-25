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
      <DialogContent className="bg-[#313338] text-white border-none" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Server Settings</DialogTitle>
          <DialogDescription>Change the server name and icon.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-server-name" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Server Name
            </Label>
            <Input
              id="edit-server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1e1f22] border-none text-white mt-2"
              disabled={!isOwner}
            />
          </div>

          <div>
            <Label className="text-[#b5bac1] uppercase text-xs font-semibold">Server Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  disabled={!isOwner}
                  className={`size-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    icon === emoji
                      ? 'bg-[#5865f2] ring-2 ring-[#5865f2]'
                      : 'bg-[#1e1f22] hover:bg-[#2b2d31]'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="pt-4 border-t border-[#3f4147]">
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Server
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-white hover:bg-[#4e5058]"
          >
            Cancel
          </Button>
          {isOwner && (
            <Button onClick={handleSave} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};