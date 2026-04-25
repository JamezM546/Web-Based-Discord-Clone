import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { Sparkles, X, Clock, MessageSquare, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Message } from '../../types';

interface ManualSummaryProps {
  messages: Message[];
  channelId?: string;
  dmId?: string;
  onClose: () => void;
}

interface SummaryData {
  overview: string;
  keyTopics: string[];
  mostActiveUsers: { username: string; count: number }[];
  importantMessages: Message[];
  timeframe: string;
  stats: {
    totalMessages: number;
    uniqueUsers: number;
  };
}

const PRESETS = [
  { label: 'Last 30 min', hours: 0.5 },
  { label: 'Last hour',   hours: 1   },
  { label: 'Last 3 hours', hours: 3  },
] as const;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ─── Component ────────────────────────────────────────────────────────────────
export const ManualSummary: React.FC<ManualSummaryProps> = ({ messages, channelId, dmId, onClose }) => {
  const { users } = useApp();

  const [selectedHours, setSelectedHours] = useState<0.5 | 1 | 3>(3);
  const [isGenerating, setIsGenerating]   = useState(true);
  const [summaryData, setSummaryData]     = useState<SummaryData | null>(null);
  const [hasError, setHasError]           = useState(false);
  const [generatedAt, setGeneratedAt]     = useState<Date | null>(null);
  const [announcement, setAnnouncement]   = useState('');

  // Incremented on every generate call; lets us discard results from stale requests
  const generationIdRef = useRef(0);

  const dialogRef = useRef<HTMLDivElement>(null);

  // ── Portal target ─────────────────────────────────────────────────────────
  // Create a stable <div> to append to <body> as the portal mount point.
  const [portalTarget] = useState<HTMLDivElement>(() => document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(portalTarget);

    // Hide every other direct body child from NVDA's virtual buffer.
    // aria-modal alone is not reliably honoured by NVDA; this is the only
    // method that actually restricts the virtual cursor to the dialog.
    const hidden: Element[] = [];
    Array.from(document.body.children).forEach(el => {
      if (el !== portalTarget && el.getAttribute('aria-hidden') !== 'true') {
        el.setAttribute('aria-hidden', 'true');
        hidden.push(el);
      }
    });

    // Focus the dialog CONTAINER, not a child button.
    //
    // When NVDA detects focus on a role="dialog" element it announces
    // "AI Summary, dialog" and then STOPS — it does not auto-read children.
    // If focus goes to a child (e.g. the Close button) instead, NVDA enters
    // browse mode from that point and reads every following element in the
    // virtual buffer automatically, producing the wall of text the user heard.
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      hidden.forEach(el => el.removeAttribute('aria-hidden'));
      if (document.body.contains(portalTarget)) document.body.removeChild(portalTarget);
    };
  }, [portalTarget]);

  // ── Keyboard: Escape + Tab focus trap ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ── Generation ────────────────────────────────────────────────────────────
  const generate = useCallback(async (hours: number) => {
    // Stamp this call; if a newer call arrives before this one resolves we discard its result.
    const myId = ++generationIdRef.current;

    setIsGenerating(true);
    setHasError(false);
    setSummaryData(null);
    setAnnouncement('Generating summary…');

    try {
      const data = await apiService.getManualSummary({
        channelId: channelId || undefined,
        dmId: dmId || undefined,
        hours,
      });

      if (generationIdRef.current !== myId) return; // stale — a newer request is in flight

      setSummaryData(data as SummaryData);
      setGeneratedAt(new Date());
      setAnnouncement(
        data.stats.totalMessages === 0
          ? 'No messages found in this time range.'
          : `Summary ready. ${data.stats.totalMessages} message${data.stats.totalMessages !== 1 ? 's' : ''} found.`
      );
    } catch (err) {
      if (generationIdRef.current !== myId) return;
      console.error('Summary generation failed:', err);
      setHasError(true);
      setAnnouncement('Failed to generate summary. Please try again.');
    } finally {
      if (generationIdRef.current === myId) setIsGenerating(false);
    }
  }, [channelId, dmId]);

  useEffect(() => { generate(3); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = (hours: 0.5 | 1 | 3) => {
    // Allow re-triggering the same preset when there was an error (acts as retry)
    if (hours === selectedHours && !isGenerating && !hasError) return;
    setSelectedHours(hours);
    generate(hours);
  };

  const selectedPreset = PRESETS.find(p => p.hours === selectedHours)!;

  // ── Markup ────────────────────────────────────────────────────────────────
  const dialog = (
    /*
      Outer wrapper: fixed fullscreen positioning context only.
      - No onClick → no "clickable" reported by NVDA
      - No aria-hidden → does not hide its children from AT
    */
    <div className="fixed inset-0 z-50">

      {/*
        Backdrop: visually darkens the page and handles click-to-close.
        aria-hidden="true" hides it from AT completely.
        It is a SIBLING of the dialog below, not its parent, so aria-hidden
        does NOT propagate into the dialog.
      */}
      <div
        className="absolute inset-0 bg-black/80"
        aria-hidden="true"
        onClick={onClose}
      />

      {/*
        Dialog centering wrapper: pointer-events-none so clicks pass
        through to the backdrop above. The dialog box re-enables pointer
        events on itself.
      */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/*
          role="dialog" + aria-modal on the dialog box itself.
          tabIndex={-1} makes it programmatically focusable so we can call
          .focus() on it. NVDA then announces "AI Summary, dialog" and
          waits — it does not auto-read children like it does when focus
          lands on a child element (e.g. a button).
          The dialog is NOT inside any aria-hidden ancestor, so its entire
          subtree is visible in NVDA's virtual buffer.
        */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
          tabIndex={-1}
          className="bg-[#0d1a2e] border border-[#1e3248] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto outline-none"
        >

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3248] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#06b6d4]" aria-hidden="true" />
              <h2 id="summary-title" className="text-[#e2e8f0] font-semibold">
                AI Summary
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-[#475569] hover:text-[#e2e8f0] hover:bg-[#1a2d45] transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Time range presets */}
          <div className="px-5 py-3 border-b border-[#1e3248] flex-shrink-0">
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(({ label, hours }) => {
                const isActive = selectedHours === hours;
                return (
                  <button
                    key={hours}
                    onClick={() => handlePreset(hours as 0.5 | 1 | 3)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      isActive
                        ? 'bg-[#06b6d4]/15 border-[#06b6d4]/40 text-[#06b6d4]'
                        : 'border-[#1e3248] text-[#475569] hover:text-[#94a3b8] hover:border-[#2a3f5a] hover:bg-[#1a2d45]'
                    }`}
                  >
                    <Clock className="size-3.5" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#334155] mt-2" aria-hidden="true">
              Summaries cover up to 3 hours of conversation history
            </p>
          </div>

          {/*
            Live region: the ONLY place NVDA hears about generation state.
            Stays empty on first render so NVDA doesn't announce anything
            spuriously — it only fires when announcement state actually changes.
          */}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {isGenerating && (
              <div className="flex items-center justify-center gap-3 py-16" aria-hidden="true">
                <div className="animate-spin rounded-full size-6 border-b-2 border-[#06b6d4]" />
                <p className="text-[#94a3b8]">Analysing {selectedPreset.label.toLowerCase()}…</p>
              </div>
            )}

            {!isGenerating && hasError && (
              <div className="flex flex-col items-center justify-center gap-3 py-16" aria-hidden="true">
                <AlertCircle className="size-10 text-red-400" aria-hidden="true" />
                <p className="text-[#94a3b8] font-medium">Failed to generate summary</p>
                <p className="text-[#475569] text-sm">Check your connection or API key and try again.</p>
                <button
                  onClick={() => generate(selectedHours)}
                  className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#06b6d4]/15 border border-[#06b6d4]/40 text-[#06b6d4] hover:bg-[#06b6d4]/25 transition-colors"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {!isGenerating && !hasError && summaryData?.stats.totalMessages === 0 && (
              <div className="text-center py-16" aria-hidden="true">
                <AlertCircle className="size-10 text-[#334155] mx-auto mb-3" aria-hidden="true" />
                <p className="text-[#94a3b8] font-medium">No messages in this time range</p>
                <p className="text-[#475569] text-sm mt-1">Try a wider range above</p>
              </div>
            )}

            {!isGenerating && !hasError && summaryData && summaryData.stats.totalMessages > 0 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Messages',     value: summaryData.stats.totalMessages, Icon: MessageSquare },
                    { label: 'Participants', value: summaryData.stats.uniqueUsers,    Icon: Users         },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="bg-[#111e30] border border-[#1e3248] rounded-xl p-3.5">
                      <p className="flex items-center gap-1.5 text-[#475569] text-xs mb-1">
                        <Icon className="size-3" aria-hidden="true" />
                        {label}
                      </p>
                      <p className="text-2xl font-bold text-[#e2e8f0]">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Overview */}
                <div>
                  <h3 className="flex items-center gap-2 text-[#e2e8f0] font-semibold mb-1">
                    <Sparkles className="size-4 text-[#06b6d4]" aria-hidden="true" />
                    Overview
                  </h3>
                  <p className="text-xs text-[#334155] mb-2.5" aria-hidden="true">
                    {summaryData.timeframe}
                  </p>
                  <p className="text-[#94a3b8] leading-relaxed text-sm bg-[#06b6d4]/5 border border-[#06b6d4]/20 rounded-xl p-4">
                    {summaryData.overview}
                  </p>
                </div>

                {/* Key Topics */}
                {summaryData.keyTopics.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[#e2e8f0] font-semibold mb-2.5">
                      <TrendingUp className="size-4 text-[#06b6d4]" aria-hidden="true" />
                      Key Topics
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {summaryData.keyTopics.map((topic, i) => (
                        <li
                          key={i}
                          className="bg-[#06b6d4]/10 text-[#06b6d4] px-3 py-1.5 rounded-full text-sm font-medium border border-[#06b6d4]/25"
                        >
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Most Active */}
                {summaryData.mostActiveUsers.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[#e2e8f0] font-semibold mb-2.5">
                      <Users className="size-4 text-[#06b6d4]" aria-hidden="true" />
                      Most Active
                    </h3>
                    <ul className="space-y-2">
                      {summaryData.mostActiveUsers.map((user, i) => {
                        const userData = users.find(u => u.username === user.username);
                        const pct = Math.round((user.count / summaryData.stats.totalMessages) * 100);
                        return (
                          <li key={i} className="bg-[#111e30] border border-[#1e3248] rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {userData && (
                                  <img src={userData.avatar} alt="" aria-hidden="true" className="size-7 rounded-full" />
                                )}
                                <span className="text-[#e2e8f0] text-sm font-medium">{user.username}</span>
                              </div>
                              <span className="text-[#475569] text-sm tabular-nums">
                                {user.count} msg{user.count !== 1 ? 's' : ''}, {pct}%
                              </span>
                            </div>
                            <div className="bg-[#060c18] rounded-full h-1.5 overflow-hidden" aria-hidden="true">
                              <div
                                className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] h-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Key Messages */}
                {summaryData.importantMessages.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[#e2e8f0] font-semibold mb-2.5">
                      <AlertCircle className="size-4 text-[#06b6d4]" aria-hidden="true" />
                      Key Messages
                    </h3>
                    <ul className="space-y-2">
                      {summaryData.importantMessages.map(msg => {
                        const author = users.find(u => u.id === msg.authorId);
                        const displayName = author?.displayName || author?.username;
                        return (
                          <li
                            key={msg.id}
                            className="bg-[#111e30] border-l-4 border-l-[#06b6d4] border border-[#1e3248] rounded-xl p-3"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              {author && (
                                <img src={author.avatar} alt="" aria-hidden="true" className="size-5 rounded-full" />
                              )}
                              <span className="text-[#e2e8f0] text-sm font-medium">{displayName}</span>
                              <time
                                dateTime={new Date(msg.timestamp).toISOString()}
                                className="text-[#475569] text-xs"
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </time>
                            </div>
                            <p className="text-[#94a3b8] text-sm">{msg.content}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1e3248] px-5 py-3 bg-[#0a1628] flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-[#334155]" aria-hidden="true">
              {generatedAt && !isGenerating
                ? `Generated at ${generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${selectedPreset.label}`
                : `Showing ${selectedPreset.label.toLowerCase()} of conversation`}
            </p>
            <button
              onClick={onClose}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(dialog, portalTarget);
};
