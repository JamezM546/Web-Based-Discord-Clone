import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Message } from '../../types';

interface WhatYouMissedProps {
  unreadMessages: Message[];
  onDismiss: () => void;
  channelId?: string;
  dmId?: string;
}

// Hardcoded summaries for each channel/DM
const getHardcodedSummary = (channelId?: string, dmId?: string): string => {
  // Team Project server channels
  if (channelId === 'c1') {
    return "James is working on text channels with permissions. Elvis and Salma are working on messaging with real-time chat, timestamps, and emojis. Salma mentioned the emoji picker is working great. Ashraf asked about having a meeting tomorrow to discuss the deadline. Nafisa will prepare the agenda for a 10 AM meeting.";
  }
  if (channelId === 'c2') {
    return "Nafisa posted an important announcement about reviewing the project roadmap in the development channel. Ashraf shared a milestone update - the team has completed 60% of the core features.";
  }
  if (channelId === 'c3') {
    return "Nafisa just pushed the new authentication flow and is requesting testing. Ashraf found a bug in the server settings modal and is working on a fix. James completed the channel permissions system and it's ready for review.";
  }
  
  // Gaming Squad server channels
  if (channelId === 'c4') {
    return "The team discussed upcoming gaming sessions and shared screenshots from recent matches.";
  }
  if (channelId === 'c5') {
    return "Plans for game night were finalized. The group will meet Friday at 8 PM for co-op gameplay.";
  }
  
  // Study Group server channels
  if (channelId === 'c6') {
    return "Study schedules were shared and the group coordinated library meeting times.";
  }
  if (channelId === 'c7') {
    return "Several homework questions were posted and members helped each other with problem sets.";
  }
  
  // Direct Messages
  if (dmId === 'dm1') {
    return "Ashraf suggested grabbing coffee after the meeting. You agreed to meet at the place downtown at 2 PM.";
  }
  
  // Default fallback
  return "New messages in this conversation.";
};

export const WhatYouMissed: React.FC<WhatYouMissedProps> = ({ unreadMessages, onDismiss, channelId, dmId }) => {
  const { users } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const summary = getHardcodedSummary(channelId, dmId);
  const lastReadTime = unreadMessages[0]?.timestamp;
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'less than an hour ago';
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="mx-4 my-4">
      <div className="bg-gradient-to-r from-[#5865f2]/10 to-[#7983f5]/10 border border-[#5865f2]/30 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31]/50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#7983f5] flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                What You Missed
                <span className="text-xs bg-[#5865f2] text-white px-2 py-0.5 rounded-full font-normal">
                  AI Summary
                </span>
              </h3>
              <p className="text-xs text-[#949ba4]">
                {unreadMessages.length} new {unreadMessages.length === 1 ? 'message' : 'messages'} since {formatTimestamp(lastReadTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#b5bac1] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c]"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
            </button>
            <button
              onClick={onDismiss}
              className="text-[#b5bac1] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c]"
              title="Dismiss"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Summary Content */}
        {isExpanded && (
          <div className="p-4 border-t border-[#5865f2]/20">
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[#dbdee1] text-sm leading-relaxed">
                  {summary}
                </p>
                
                {/* Key Highlights */}
                {unreadMessages.length > 3 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[#949ba4] uppercase font-semibold">Key Messages</p>
                    <div className="space-y-1.5">
                      {unreadMessages.slice(0, 3).map((msg) => {
                        const author = users.find(u => u.id === msg.authorId);
                        return (
                          <div key={msg.id} className="flex items-start gap-2 text-xs">
                            <img 
                              src={author?.avatar} 
                              alt={author?.username}
                              className="size-5 rounded-full flex-shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[#949ba4] font-medium">{author?.username}:</span>
                              <span className="text-[#b5bac1] ml-1 line-clamp-1">{msg.content}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {unreadMessages.length > 3 && (
                      <p className="text-xs text-[#949ba4] italic">
                        + {unreadMessages.length - 3} more {unreadMessages.length - 3 === 1 ? 'message' : 'messages'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};