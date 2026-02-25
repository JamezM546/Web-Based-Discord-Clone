import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { WhatYouMissed } from './WhatYouMissed';
import { ManualSummary } from './ManualSummary';
import { Hash, Sparkles } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export const MessageArea: React.FC = () => {
  const { selectedChannel, selectedDM, messages, users, currentUser, getUnreadMessages, markAsRead } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dismissedSummaries, setDismissedSummaries] = useState<Record<string, boolean>>({});
  const [showManualSummary, setShowManualSummary] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check for unread messages when entering a channel
  const unreadMessages = selectedChannel
    ? getUnreadMessages(selectedChannel.id)
    : selectedDM
    ? getUnreadMessages(undefined, selectedDM.id)
    : [];

  const hasUnread = unreadMessages.length > 0;

  if (!selectedChannel && !selectedDM) {
    return (
      <div className="flex-1 bg-[#313338] flex items-center justify-center">
        <div className="text-center text-[#949ba4]">
          <Hash className="size-16 mx-auto mb-4 opacity-20" />
          <p>Select a channel or DM to start chatting</p>
        </div>
      </div>
    );
  }

  const channelMessages = selectedChannel
    ? messages.filter((m) => m.channelId === selectedChannel.id)
    : selectedDM
    ? messages.filter((m) => m.dmId === selectedDM.id)
    : [];

  const otherUser = selectedDM
    ? users.find((u) => selectedDM.participants.includes(u.id) && u.id !== currentUser?.id)
    : null;

  const handleDismissSummary = () => {
    if (selectedChannel) {
      setDismissedSummaries((prev) => ({ ...prev, [selectedChannel.id]: true }));
      markAsRead(selectedChannel.id);
    } else if (selectedDM) {
      setDismissedSummaries((prev) => ({ ...prev, [selectedDM.id]: true }));
      markAsRead(undefined, selectedDM.id);
    }
  };

  return (
    <div className="flex-1 bg-[#313338] flex flex-col min-h-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e1f22] text-white shadow-sm flex-shrink-0">
        <div className="flex items-center">
          {selectedChannel && !selectedDM && (
            <>
              <Hash className="size-5 text-[#80848e] mr-2" />
              <span className="font-semibold">{selectedChannel.name}</span>
            </>
          )}
          {selectedDM && !selectedChannel && otherUser && (
            <div className="flex items-center gap-2">
              <img src={otherUser.avatar} alt={otherUser.username} className="size-6 rounded-full" />
              <span className="font-semibold">{otherUser.username}</span>
            </div>
          )}
        </div>
        
        {/* Manual Summary Button */}
        {channelMessages.length > 0 && (
          <button
            onClick={() => setShowManualSummary(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#5865f2]/10 hover:bg-[#5865f2]/20 text-[#c4c9ff] hover:text-white transition-colors border border-[#5865f2]/30"
            title="Get AI Summary"
          >
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">Summarize</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0" ref={scrollRef}>
        {/* What You Missed Summary */}
        {hasUnread && !dismissedSummaries[selectedChannel?.id || selectedDM?.id] && (
          <WhatYouMissed 
            unreadMessages={unreadMessages}
            channelId={selectedChannel?.id}
            dmId={selectedDM?.id}
            onDismiss={handleDismissSummary}
          />
        )}
        
        <div className="p-4 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="text-center text-[#949ba4] py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            channelMessages.map((message) => <MessageItem key={message.id} message={message} />)
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <MessageInput channelId={selectedChannel?.id} dmId={selectedDM?.id} />
      </div>

      {/* Manual Summary Modal */}
      {showManualSummary && (
        <ManualSummary
          messages={channelMessages}
          onClose={() => setShowManualSummary(false)}
        />
      )}
    </div>
  );
};