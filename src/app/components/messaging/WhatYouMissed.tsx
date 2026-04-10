import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { Sparkles, ChevronDown, ChevronUp, X, ArrowDown } from 'lucide-react';
import { Message } from '../../types';

interface WhatYouMissedProps {
  unreadMessages: Message[];
  onDismiss: () => void;
  onJumpToUnread?: () => void;
  channelId?: string;
  dmId?: string;
}

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

const highlightsToSummary = (highlights: any): string | null => {
  if (!highlights) return null;
  let arr: any[] | null = null;
  if (Array.isArray(highlights)) arr = highlights;
  else if (typeof highlights === 'string') {
    try {
      const parsed = JSON.parse(highlights);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      // ignore
    }
  }
  if (!arr || arr.length === 0) return null;

  const text = arr
    .map((h) => {
      if (!h) return null;
      if (typeof h === 'string') return h.trim();
      if (typeof h.text === 'string') return h.text.trim();
      if (typeof h.summary === 'string') return h.summary.trim();
      if (typeof h.highlight === 'string') return h.highlight.trim();
      return null;
    })
    .filter(Boolean)
    .slice(0, 5) as string[];

  return text.length ? text.join(' · ') : null;
};

export const WhatYouMissed: React.FC<WhatYouMissedProps> = ({
  unreadMessages,
  onDismiss,
  onJumpToUnread,
  channelId,
  dmId,
}) => {
  const { users } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      setIsLoading(true);
      try {
        let result;
        if (channelId) {
          result = await apiService.getChannelPreview(channelId);
        } else if (dmId) {
          result = await apiService.getDmPreview(dmId);
        }

        if (!cancelled) {
          const items: string[] = Array.isArray(result?.highlights) && result.highlights.length > 0
            ? result.highlights
            : [];
          setHighlights(items);
        }
      } catch (err) {
        console.error('Preview fetch failed:', err);
        if (!cancelled) setHighlights([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (unreadMessages.length > 0 && (channelId || dmId)) {
      fetchPreview();
    } else {
      setHighlights([]);
      setIsLoading(false);
    }

    return () => { cancelled = true; };
  }, [channelId, dmId, unreadMessages.length]);

  const lastReadTime = unreadMessages[0]?.timestamp;

  const authorIds = [...new Set(unreadMessages.map((m) => m.authorId))].slice(0, 4);
  const authorUsers = authorIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <div
      role="region"
      aria-label="What You Missed: AI summary of unread messages"
      className="flex-shrink-0 border-b border-[#1e3248]"
      style={{ borderLeft: '3px solid rgba(6,182,212,0.5)', background: 'rgba(6,182,212,0.04)' }}
    >
      {/* ── Compact bar (always visible) ── */}
      <div className="flex items-center gap-2.5 px-4 py-2 min-w-0">
        {/* Icon */}
        <Sparkles className="size-3.5 text-[#06b6d4] flex-shrink-0" aria-hidden="true" />

        {/* Label + count */}
        <span className="text-[#06b6d4] text-xs font-semibold flex-shrink-0">
          What You Missed
        </span>
        <span className="text-[#334155] text-xs flex-shrink-0" aria-hidden="true">·</span>
        <span className="text-[#475569] text-xs flex-shrink-0">
          {unreadMessages.length} new{lastReadTime ? ` · ${formatTimestamp(lastReadTime)}` : ''}
        </span>

        {/* Participant avatars */}
        {authorUsers.length > 0 && (
          <div className="flex items-center -space-x-1 flex-shrink-0" aria-hidden="true">
            {authorUsers.map((user: any) => (
              <img
                key={user.id}
                src={user.avatar}
                alt=""
                className="size-4 rounded-full ring-1 ring-[#060c18]"
              />
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Actions */}
        {onJumpToUnread && (
          <button
            onClick={onJumpToUnread}
            aria-label="Jump to first unread message"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-[#06b6d4] hover:text-[#67e8f9] hover:bg-[#06b6d4]/10 transition-colors flex-shrink-0"
          >
            <ArrowDown className="size-3" aria-hidden="true" />
            Jump
          </button>
        )}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-controls="wym-summary"
          aria-label={isExpanded ? 'Collapse summary' : 'Expand AI summary'}
          className="p-1 rounded text-[#475569] hover:text-[#94a3b8] hover:bg-white/5 transition-colors flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss What You Missed summary"
          className="p-1 rounded text-[#334155] hover:text-[#64748b] hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* ── Expanded summary ── */}
      {isExpanded && (
        <div id="wym-summary" className="px-4 pb-3 pt-0">
          {isLoading ? (
            <p className="text-[#475569] text-xs italic">Loading summary…</p>
          ) : highlights.length > 0 ? (
            <ul className="space-y-1 list-none">
              {highlights.map((point, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[#64748b] text-xs leading-relaxed">
                  <span className="text-[#06b6d4] flex-shrink-0 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#475569] text-xs italic">
              {unreadMessages.length} new message{unreadMessages.length !== 1 ? 's' : ''} — no summary available.
            </p>
          )}

          {/* Mark as read link */}
          <button
            onClick={onDismiss}
            aria-label="Mark all unread messages as read and dismiss summary"
            className="mt-2 text-xs text-[#334155] hover:text-[#475569] transition-colors"
          >
            Mark as read
          </button>
        </div>
      )}
    </div>
  );
};