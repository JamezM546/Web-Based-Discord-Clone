import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { format } from 'date-fns';
import { MoreVertical, Edit2, Trash2, Smile, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { users, currentUser, editMessage, deleteMessage, toggleReaction } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const author = users.find((u) => u.id === message.authorId);
  const isOwnMessage = message.authorId === currentUser?.id;

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message.id);
    }
  };

  const handleReactionClick = (emojiData: EmojiClickData) => {
    toggleReaction(message.id, emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  if (!author) return null;

  return (
    <div className="group hover:bg-[#2e3035] px-4 py-2 -mx-4 relative">
      <div className="flex gap-4">
        <img src={author.avatar} alt={author.username} className="size-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">{author.username}</span>
            <span className="text-xs text-[#949ba4]">
              {format(new Date(message.timestamp), 'MMM d, yyyy h:mm a')}
            </span>
            {message.edited && <span className="text-xs text-[#949ba4]">(edited)</span>}
          </div>

          {isEditing ? (
            <div className="mt-1 space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
                className="bg-[#383a40] border-none text-white"
                autoFocus
              />
              <div className="text-xs text-[#949ba4]">
                Press Enter to save • Esc to cancel
              </div>
            </div>
          ) : (
            <>
              <p className="text-[#dbdee1] break-words">{message.content}</p>
              
              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((reaction, idx) => {
                    const hasReacted = currentUser && reaction.users.includes(currentUser.id);
                    return (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleReaction(message.id, reaction.emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-colors ${
                                hasReacted
                                  ? 'bg-[#5865f2] border border-[#5865f2] text-white'
                                  : 'bg-[#2e3035] border border-[#1e1f22] text-[#dbdee1] hover:border-[#949ba4]'
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-xs">{reaction.users.length}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {reaction.users
                                .map((userId) => users.find((u) => u.id === userId)?.username)
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                  
                  {/* Add Reaction Button */}
                  <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <button className="flex items-center justify-center size-6 rounded bg-[#2e3035] border border-[#1e1f22] text-[#949ba4] hover:border-[#949ba4] hover:text-white transition-colors">
                              <Plus className="size-3" />
                            </button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Reaction</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent 
                      className="w-auto p-0 border-none bg-transparent shadow-none" 
                      side="right" 
                      align="start"
                    >
                      <EmojiPicker
                        onEmojiClick={handleReactionClick}
                        theme="dark"
                        skinTonesDisabled
                        searchPlaceHolder="Search emoji..."
                        previewConfig={{ showPreview: false }}
                        height={350}
                        width={320}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Reaction Button (on hover) */}
        {!isEditing && (
          <div className="absolute top-0 right-4 -mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-[#2b2d31] border border-[#1e1f22] rounded shadow-lg flex items-center gap-1 p-1">
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button className="p-1.5 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition-colors">
                          <Smile className="size-4" />
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add Reaction</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent 
                  className="w-auto p-0 border-none bg-transparent shadow-none" 
                  side="top" 
                  align="end"
                >
                  <EmojiPicker
                    onEmojiClick={handleReactionClick}
                    theme="dark"
                    skinTonesDisabled
                    searchPlaceHolder="Search emoji..."
                    previewConfig={{ showPreview: false }}
                    height={350}
                    width={320}
                  />
                </PopoverContent>
              </Popover>

              {isOwnMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 hover:bg-[#35373c] rounded text-[#b5bac1] hover:text-white transition-colors">
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#111214] border-none text-white">
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="text-[#949ba4] hover:text-white hover:bg-[#5865f2] cursor-pointer"
                    >
                      <Edit2 className="size-4 mr-2" />
                      Edit Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-400 hover:text-white hover:bg-red-600 cursor-pointer"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};