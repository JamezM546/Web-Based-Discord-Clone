import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Camera, X } from 'lucide-react';
import { Label } from '../ui/label';

interface UserSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ open, onOpenChange }) => {
  const { currentUser, updateUserProfile } = useApp();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [previewAvatar, setPreviewAvatar] = useState(currentUser?.avatar || '');

  if (!currentUser) return null;

  const handleSave = () => {
    const finalDisplayName = displayName.trim() || undefined;
    const finalAvatar = avatarUrl.trim() || currentUser.avatar;
    
    updateUserProfile(finalDisplayName, finalAvatar);
    onOpenChange(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    // Update preview if URL is not empty
    if (url.trim()) {
      setPreviewAvatar(url);
    } else {
      setPreviewAvatar(currentUser.avatar);
    }
  };

  const handleClose = () => {
    // Reset to current values
    setDisplayName(currentUser.displayName || '');
    setAvatarUrl(currentUser.avatar);
    setPreviewAvatar(currentUser.avatar);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="bg-[#0d1a2e] border-l border-[#1e3248] text-[#e2e8f0] w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="px-6 py-6">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#e2e8f0]">Profile Settings</SheetTitle>
            <SheetDescription className="text-[#475569]">
              Customize your profile appearance
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            {/* Profile Preview */}
            <div className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-t-xl h-24 relative">
              <div className="absolute -bottom-12 left-6">
                <div className="relative group">
                  <img
                    src={previewAvatar}
                    alt="Profile"
                    className="size-24 rounded-full border-[6px] border-[#0d1a2e] object-cover"
                    onError={(e) => {
                      e.currentTarget.src = currentUser.avatar;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="size-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={currentUser.username}
                  className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:ring-[#06b6d4]/50"
                  maxLength={32}
                />
                <p className="text-xs text-[#475569]">
                  This is your display alias. Your username is{' '}
                  <span className="font-semibold text-[#94a3b8]">{currentUser.username}</span> and cannot be changed.
                </p>
                {displayName && (
                  <p className="text-xs text-[#64748b]">
                    Preview: <span className="font-semibold text-[#06b6d4]">{displayName}</span>
                  </p>
                )}
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Avatar URL
                </Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={handleAvatarChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569] focus-visible:ring-[#06b6d4]/50"
                />
                <p className="text-xs text-[#475569]">
                  Enter a URL to your profile picture. Preview updates as you type.
                </p>
              </div>

              {/* Username (Read-only) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Username
                </Label>
                <div className="bg-[#060c18] border border-[#1e3248] px-3 py-2 rounded-lg text-[#475569] text-sm">
                  {currentUser.username}
                </div>
                <p className="text-xs text-[#475569]">Your username cannot be changed.</p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  Email
                </Label>
                <div className="bg-[#060c18] border border-[#1e3248] px-3 py-2 rounded-lg text-[#475569] text-sm">
                  {currentUser.email}
                </div>
                <p className="text-xs text-[#475569]">Your email is private and cannot be changed.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#1e3248]">
              <Button
                onClick={handleClose}
                variant="ghost"
                className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};