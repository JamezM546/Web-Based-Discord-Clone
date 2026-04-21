import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { WhatYouMissed } from './WhatYouMissed';
import { ManualSummary } from './ManualSummary';
import { Hash, Sparkles, MessageSquare } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format, isSameDay, isSameWeek, isToday, isYesterday } from 'date-fns';

export const MessageArea: React.FC = () => {
  const { selectedChannel, selectedDM, messages, users, currentUser, getUnreadMessages, markAsRead } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dismissedSummaries, setDismissedSummaries] = useState<Record<string, boolean>>({});
  const [showManualSummary, setShowManualSummary] = useState(false);
  const unreadStartRef = useRef<HTMLDivElement>(null);

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[#06b6d4]/50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[#06b6d4]/50');
      }, 1500);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const unreadMessages = selectedChannel
    ? getUnreadMessages(selectedChannel.id)
    : selectedDM
    ? getUnreadMessages(undefined, selectedDM.id)
    : [];

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const messagesFromLastHour = unreadMessages.filter(msg => new Date(msg.timestamp) >= oneHourAgo);
  const filteredUnreadMessages = messagesFromLastHour.length < 100
    ? unreadMessages.slice(-100)
    : messagesFromLastHour.slice(-100);

  const hasUnread = filteredUnreadMessages.length > 0;

  if (!selectedChannel && !selectedDM) {
    return (
      <div
        className="flex-1 bg-[#060c18] flex items-center justify-center"
        role="main"
        aria-label="No conversation selected. Select a room or chat to start messaging"
      >
        <div className="text-center space-y-4 px-8" aria-hidden="true">
          <div className="size-20 mx-auto rounded-2xl bg-[#111e30] border border-[#1e3248] flex items-center justify-center">
            <MessageSquare className="size-10 text-[#1e3248]" />
          </div>
          <div>
            <p className="text-[#475569] text-sm">Select a room or chat to start messaging</p>
          </div>
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

  const handleJumpToUnread = () => {
    if (unreadStartRef.current) {
      unreadStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getDayDividerLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isSameWeek(date, new Date(), { weekStartsOn: 0 })) return format(date, 'EEEE');
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex-1 bg-[#060c18] flex flex-col min-h-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1e3248] bg-[#0a1628] flex-shrink-0" role="banner">
        <div className="flex items-center gap-2">
          {selectedChannel && !selectedDM && (
            <>
              <div className="size-7 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center border border-[#06b6d4]/20" aria-hidden="true">
                <Hash className="size-3.5 text-[#06b6d4]" />
              </div>
              <h1 className="font-semibold text-[#e2e8f0]">{selectedChannel.name}</h1>
              <span className="text-[#475569] text-xs hidden sm:block" aria-hidden="true">· Room</span>
            </>
          )}
          {selectedDM && !selectedChannel && otherUser && (
            <div className="flex items-center gap-2">
              <img src={otherUser.avatar} alt="" aria-hidden="true" className="size-7 rounded-full ring-2 ring-[#1e3248]" />
              <h1 className="font-semibold text-[#e2e8f0]">{otherUser.displayName || otherUser.username}</h1>
              <span className="text-[#475569] text-xs hidden sm:block" aria-hidden="true">· Direct Chat</span>
            </div>
          )}
        </div>

        {/* Summarize button */}
        {channelMessages.length > 0 && (
          <button
            onClick={() => setShowManualSummary(true)}
            aria-label="Summarize conversation with AI"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 text-[#06b6d4] hover:text-[#67e8f9] transition-colors border border-[#06b6d4]/20"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="text-xs font-medium hidden sm:block">Summarize</span>
          </button>
        )}
      </div>

      {/* What You Missed — fixed panel between header and messages */}
      {hasUnread && !dismissedSummaries[selectedChannel?.id || selectedDM?.id] && (
        <WhatYouMissed
          unreadMessages={filteredUnreadMessages}
          channelId={selectedChannel?.id}
          dmId={selectedDM?.id}
          onDismiss={handleDismissSummary}
          onJumpToUnread={handleJumpToUnread}
        />
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3"
        ref={scrollRef}
        role="log"
        aria-label={selectedChannel ? `Messages in #${selectedChannel.name}` : `Direct chat messages`}
        aria-live="polite"
        aria-relevant="additions"
      >
        {channelMessages.length === 0 ? (
          <div className="text-center text-[#475569] py-16" role="status">
            <div className="size-14 mx-auto rounded-xl bg-[#111e30] border border-[#1e3248] flex items-center justify-center mb-3" aria-hidden="true">
              <Hash className="size-7 text-[#1e3248]" />
            </div>
            <p className="text-sm">No messages yet — start the conversation!</p>
          </div>
        ) : (
          (() => {
            const elements: React.ReactNode[] = [];
            let lastMessageDate: Date | null = null;
            channelMessages.forEach((message) => {
              const messageDate = new Date(message.timestamp);
              const shouldShowDayDivider = !lastMessageDate || !isSameDay(messageDate, lastMessageDate);
              if (shouldShowDayDivider) {
                const dayLabel = getDayDividerLabel(message.timestamp);
                elements.push(
                  <div
                    key={`day-divider-${message.id}`}
                    role="separator"
                    aria-label={`Messages from ${dayLabel}`}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <div className="flex-1 h-px bg-[#1e3248]" aria-hidden="true" />
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#0a1628] border border-[#1e3248] text-[#94a3b8]">
                      {dayLabel}
                    </span>
                    <div className="flex-1 h-px bg-[#1e3248]" aria-hidden="true" />
                  </div>
                );
              }

              const isFirstUnread =
                filteredUnreadMessages.length > 0 &&
                message.id === filteredUnreadMessages[0]?.id;
              if (isFirstUnread) {
                elements.push(
                  <div
                    key={`divider-${message.id}`}
                    ref={unreadStartRef}
                    role="separator"
                    aria-label="New messages start here"
                    className="flex items-center gap-3 py-1"
                  >
                    <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.3)' }} aria-hidden="true" />
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: 'rgba(6,182,212,0.12)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        color: '#06b6d4',
                      }}
                    >
                      New messages
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.3)' }} aria-hidden="true" />
                  </div>
                );
              }
              elements.push(
                <MessageItem key={message.id} message={message} onScrollToMessage={scrollToMessage} />
              );
              lastMessageDate = messageDate;
            });
            return elements;
          })()
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#1e3248]">
        <MessageInput channelId={selectedChannel?.id} dmId={selectedDM?.id} />
      </div>

      {/* Manual Summary Modal */}
      {showManualSummary && (
        <ManualSummary
          messages={channelMessages}
          channelId={selectedChannel?.id}
          dmId={selectedDM?.id}
          onClose={() => setShowManualSummary(false)}
        />
      )}
    </div>
  );
};