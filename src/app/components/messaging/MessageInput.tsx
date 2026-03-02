import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Smile, X, Send } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CustomEmojiPicker } from './CustomEmojiPicker';

interface MessageInputProps {
  channelId?: string;
  dmId?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ channelId, dmId }) => {
  const [message, setMessage] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const { sendMessage, selectedChannel, users, replyingTo, setReplyingTo, currentUser, selectedServer, selectedDM } = useApp();

  const availableUsers = selectedServer
    ? users.filter(u => selectedServer.members.includes(u.id) && u.id !== currentUser?.id)
    : selectedDM
    ? users.filter(u => selectedDM.participants.includes(u.id) && u.id !== currentUser?.id)
    : [];

  const filteredUsers = availableUsers.filter(u =>
    u.username.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [showMentionDropdown, mentionSearch]);

  useEffect(() => {
    if (showMentionDropdown && mentionDropdownRef.current) {
      const selectedElement = mentionDropdownRef.current.querySelector(`[data-mention-index="${selectedMentionIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedMentionIndex, showMentionDropdown]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, channelId, dmId, replyingTo?.id);
      setMessage('');
      setReplyingTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(filteredUsers[selectedMentionIndex].username);
        return;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(filteredUsers[selectedMentionIndex].username);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && replyingTo) {
      setReplyingTo(null);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setEmojiPickerOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentionDropdown(true);
      setMentionSearch(atMatch[1]);
      setMentionCursorPosition(cursorPos - atMatch[1].length - 1);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const beforeMention = message.substring(0, mentionCursorPosition);
    const afterMention = message.substring(inputRef.current?.selectionStart || 0);
    const newMessage = beforeMention + `@${username} ` + afterMention;
    setMessage(newMessage);
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  const repliedAuthor = replyingTo ? users.find(u => u.id === replyingTo.authorId) : null;
  const mentionListboxId = 'mention-listbox';

  return (
    <div className="px-4 py-3 relative">
      {/* Reply Preview */}
      {replyingTo && repliedAuthor && (
        <div className="mb-2 bg-[#111e30] border border-[#1e3248] rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-[#06b6d4] rounded-full" aria-hidden="true" />
            <img src={repliedAuthor.avatar} alt="" aria-hidden="true" className="size-6 rounded-full" />
            <div className="text-sm">
              <span className="text-[#06b6d4] font-semibold">
                Replying to {repliedAuthor.displayName || repliedAuthor.username}
              </span>
              <p className="text-[#475569] text-xs line-clamp-1">
                {replyingTo.content.length > 80 ? replyingTo.content.substring(0, 80) + '…' : replyingTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            className="text-[#475569] hover:text-[#94a3b8] transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main input area */}
      <div className="bg-[#111e30] rounded-xl border border-[#1e3248] relative">
        {/* Mention Dropdown */}
        {showMentionDropdown && filteredUsers.length > 0 && (
          <div
            id={mentionListboxId}
            role="listbox"
            aria-label="Mention suggestions"
            className="absolute left-0 bottom-full mb-2 w-full max-w-sm bg-[#0a1628] rounded-xl shadow-2xl z-50 border border-[#1e3248] overflow-hidden"
            ref={mentionDropdownRef}
          >
            <div className="px-3 py-1.5 text-xs text-[#475569] font-semibold uppercase tracking-wider border-b border-[#1e3248]" aria-hidden="true">
              Mention a person
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filteredUsers.map((user, index) => {
                const displayName = user.displayName || user.username;
                return (
                  <button
                    key={user.id}
                    role="option"
                    aria-selected={selectedMentionIndex === index}
                    data-mention-index={index}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                      selectedMentionIndex === index ? 'bg-[#1a2d45]' : ''
                    } hover:bg-[#1a2d45]`}
                    onClick={() => handleMentionSelect(user.username)}
                    onMouseEnter={() => setSelectedMentionIndex(index)}
                  >
                    <img src={user.avatar} alt="" aria-hidden="true" className="size-8 rounded-full" />
                    <div className="flex flex-col">
                      <span className="text-[#e2e8f0] font-medium text-sm">{displayName}</span>
                      {user.displayName && (
                        <span className="text-[#475569] text-xs">{user.username}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3">
          <input
            type="text"
            role="combobox"
            aria-label={`Message ${selectedChannel ? `#${selectedChannel.name}` : selectedDM ? 'direct chat' : ''}`}
            aria-autocomplete="list"
            aria-expanded={showMentionDropdown && filteredUsers.length > 0}
            aria-controls={showMentionDropdown ? mentionListboxId : undefined}
            aria-activedescendant={
              showMentionDropdown && filteredUsers[selectedMentionIndex]
                ? `mention-option-${filteredUsers[selectedMentionIndex].id}`
                : undefined
            }
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedChannel ? `#${selectedChannel.name}` : ''}`}
            className="flex-1 bg-transparent text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 ring-0 message-input-no-focus-ring text-sm"
            ref={inputRef}
          />

          <div className="flex items-center gap-1">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  aria-label="Open emoji picker"
                  aria-expanded={emojiPickerOpen}
                  aria-haspopup="dialog"
                  className="p-1.5 text-[#475569] hover:text-[#94a3b8] transition-colors rounded-lg hover:bg-[#1a2d45]"
                >
                  <Smile className="size-4" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="end" sideOffset={10}>
                <CustomEmojiPicker onEmojiClick={handleEmojiClick} />
              </PopoverContent>
            </Popover>

            <button
              onClick={handleSend}
              disabled={!message.trim()}
              aria-label="Send message"
              aria-disabled={!message.trim()}
              className={`p-1.5 rounded-lg transition-all ${
                message.trim()
                  ? 'text-[#06b6d4] hover:bg-[#06b6d4]/20'
                  : 'text-[#2a3f5a] cursor-not-allowed'
              }`}
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};