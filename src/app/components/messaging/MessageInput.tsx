import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Smile } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  channelId?: string;
  dmId?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ channelId, dmId }) => {
  const [message, setMessage] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { sendMessage, selectedChannel } = useApp();

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, channelId, dmId);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="px-4 pb-6">
      <div className="bg-[#383a40] rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-[#b5bac1] hover:text-white transition-colors">
                  <Plus className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload File</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedChannel ? `#${selectedChannel.name}` : ''}`}
            className="flex-1 bg-transparent text-white placeholder:text-[#6d6f78] outline-none"
          />

          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button className="text-[#b5bac1] hover:text-white transition-colors" title="Emoji">
                <Smile className="size-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 border-none bg-transparent shadow-none" 
              side="top" 
              align="end"
              sideOffset={10}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                skinTonesDisabled
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
                height={400}
                width={350}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};