import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { MoreVertical, Edit2, Trash2, Smile, Plus, Reply, CornerUpLeft, ExternalLink, Link as LinkIcon } from 'lucide-react';
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
import { CustomEmojiPicker } from './CustomEmojiPicker';

interface MessageItemProps {
  message: Message;
  onScrollToMessage?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onScrollToMessage }) => {
  const { users, currentUser, editMessage, deleteMessage, toggleReaction, messages, setReplyingTo, serverInvites, servers, selectedDM, acceptServerInvite, declineServerInvite, resolveInviteCode } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [hoverReactionPickerOpen, setHoverReactionPickerOpen] = useState(false);
  const [inviteLinkPreview, setInviteLinkPreview] = useState<any>(null);

  const inviteLinkMatch = useMemo(() => {
    const match = message.content.match(/(https?:\/\/[^\s]+\/invite\/([A-Za-z0-9]+))/i);
    if (!match) return null;

    return {
      url: match[1],
      code: match[2],
    };
  }, [message.content]);

  const author = users.find((u) => u.id === message.authorId);
  const isOwnMessage = message.authorId === currentUser?.id;

  const repliedMessage = message.replyToId ? messages.find(m => m.id === message.replyToId) : null;
  const repliedAuthor = repliedMessage ? users.find(u => u.id === repliedMessage.authorId) : null;

  const serverInvite = message.serverInviteId ? serverInvites.find(si => si.id === message.serverInviteId) : null;
  const invitedServer = serverInvite
    ? servers.find(s => s.id === serverInvite.serverId) ||
      (serverInvite.serverName ? { id: serverInvite.serverId, name: serverInvite.serverName, icon: serverInvite.serverIcon || '📁', ownerId: '', members: [] } : null)
    : null;
  const isInviteRecipient = serverInvite && currentUser && serverInvite.toUserId === currentUser.id;
  const invitedUser =
    (serverInvite ? users.find((u) => u.id === serverInvite.toUserId) : null) ||
    (isOwnMessage && selectedDM
      ? users.find((u) => selectedDM.participants.includes(u.id) && u.id !== currentUser?.id)
      : null);
  const fallbackInviteTarget = message.content.replace(/^invited you to join\s+/i, '').trim();
  const inviteDisplayContent =
    isOwnMessage && message.serverInviteId && invitedUser
      ? `You invited ${invitedUser.displayName || invitedUser.username} to join ${
          invitedServer ? `${invitedServer.name} ${invitedServer.icon || ''}`.trim() : fallbackInviteTarget
        }`.trim()
      : message.content;

  const authorDisplayName = author?.displayName || author?.username;
  const repliedAuthorDisplayName = repliedAuthor?.displayName || repliedAuthor?.username;

  useEffect(() => {
    if (!inviteLinkMatch || message.serverInviteId) {
      setInviteLinkPreview(null);
      return;
    }

    let cancelled = false;

    const loadInvitePreview = async () => {
      try {
        const data = await resolveInviteCode(inviteLinkMatch.code);
        if (!cancelled) {
          setInviteLinkPreview(data);
        }
      } catch {
        if (!cancelled) {
          setInviteLinkPreview(null);
        }
      }
    };

    void loadInvitePreview();

    return () => {
      cancelled = true;
    };
  }, [inviteLinkMatch, message.serverInviteId, resolveInviteCode]);

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

  const handleReactionClick = (emoji: string) => {
    toggleReaction(message.id, emoji);
    setReactionPickerOpen(false);
    setHoverReactionPickerOpen(false);
  };

  const handleReply = () => {
    setReplyingTo(message);
  };

  const renderMessageContent = (content: string) => {
    const tokenRegex = /(https?:\/\/[^\s]+)|@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      if (match[1]) {
        parts.push(
          <a
            key={match.index}
            href={match[1]}
            target="_blank"
            rel="noreferrer"
            className="text-[#67e8f9] underline underline-offset-2 hover:text-[#a5f3fc] break-all"
          >
            {match[1]}
          </a>
        );
      } else {
        const mentionedUsername = match[2];
        const mentionedUser = users.find((u) => u.username.toLowerCase() === mentionedUsername.toLowerCase());
        const isMentioningCurrentUser = mentionedUser?.id === currentUser?.id;
        parts.push(
          <span
            key={match.index}
            className={`${
              isMentioningCurrentUser
                ? 'bg-[#06b6d4] text-white px-1.5 py-0.5 rounded-md text-sm font-medium'
                : 'bg-[#06b6d4]/15 text-[#06b6d4] px-1.5 py-0.5 rounded-md text-sm hover:bg-[#06b6d4]/25 cursor-pointer'
            }`}
          >
            @{mentionedUsername}
          </span>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  if (!author) return null;

  const messageDate = new Date(message.timestamp);
  const formattedTime = format(messageDate, 'h:mm a');
  const isoTime = messageDate.toISOString();
  
  // Determine date display format
  let dateDisplay = formattedTime;
  if (isToday(messageDate)) {
    dateDisplay = `Today at ${formattedTime}`;
  } else if (isYesterday(messageDate)) {
    dateDisplay = `Yesterday at ${formattedTime}`;
  } else {
    // Show MM/DD/YY format for older messages
    dateDisplay = `${format(messageDate, 'MM/dd/yy')} at ${formattedTime}`;
  }
  
  const fullDateDisplay = format(messageDate, 'MM/dd/yy h:mm:ss a');

  return (
    <article
      className={`group relative rounded-lg transition-colors ${
        isOwnMessage
          ? 'border-l-2 border-[#06b6d4]/30 hover:bg-[#06b6d4]/[0.05]'
          : 'border-l-2 border-transparent hover:bg-white/[0.02]'
      }`}
      style={isOwnMessage ? { background: 'rgba(6,182,212,0.03)' } : undefined}
      id={`message-${message.id}`}
      aria-label={`Message from ${authorDisplayName}${isOwnMessage ? ' (you)' : ''}, sent at ${formattedTime}${message.edited ? ', edited' : ''}`}
    >
      {/* Reply preview */}
      {repliedMessage && repliedAuthor && (
        <div
          className="flex items-center gap-1.5 px-3 pt-2 pb-1 cursor-pointer opacity-60 hover:opacity-90 transition-opacity"
          onClick={() => onScrollToMessage?.(message.replyToId!)}
          role="button"
          tabIndex={0}
          aria-label={`Go to replied message from ${repliedAuthorDisplayName}`}
          onKeyDown={(e) => e.key === 'Enter' && onScrollToMessage?.(message.replyToId!)}
        >
          <CornerUpLeft className="size-3 text-[#475569] flex-shrink-0" aria-hidden="true" />
          <img src={repliedAuthor.avatar} alt="" aria-hidden="true" className="size-3.5 rounded-full flex-shrink-0" />
          <span className="text-xs text-[#475569] truncate">
            <span className="text-[#64748b] font-medium">{repliedAuthorDisplayName}</span>
            <span className="ml-1">
              {repliedMessage.content.length > 80 ? repliedMessage.content.substring(0, 80) + '…' : repliedMessage.content}
            </span>
          </span>
        </div>
      )}

      {/* Message row */}
      <div className="flex items-start gap-2.5 px-3 pt-2 pb-2">
        {/* Avatar — decorative; name is readable in the header row below */}
        <img
          src={author.avatar}
          alt=""
          aria-hidden="true"
          className="size-7 rounded-full object-cover flex-shrink-0 mt-0.5 opacity-90"
        />

        <div className="flex-1 min-w-0">
          {/* Name + timestamp — both must be individually hoverable in NVDA */}
          <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
            {/*
              No aria-hidden here — NVDA mouse-hover reads the text content ("Nafisa").
              The sr-only "(you)" is naturally concatenated for own messages.
            */}
            <span className={`text-xs font-semibold ${isOwnMessage ? 'text-[#67e8f9]' : 'text-[#94a3b8]'}`}>
              {authorDisplayName}
            </span>
            {isOwnMessage && <span className="sr-only">(you)</span>}

            {/*
              Enhanced timestamp with smart date display and full tooltip
              Shows time only for today, date + time for older messages
            */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <time
                    dateTime={isoTime}
                    aria-label={`Sent at ${dateDisplay}`}
                    className="text-[10px] text-[#334155] cursor-help hover:text-[#475569] transition-colors"
                  >
                    {dateDisplay}
                  </time>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{fullDateDisplay}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {message.edited && (
              <span className="text-[10px] text-[#334155] italic" aria-label="edited">(edited)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-1.5 mt-1">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                  else if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content); }
                }}
                aria-label="Edit message"
                className="bg-[#060c18] border-[#1e3248] text-[#e2e8f0] focus-visible:ring-[#06b6d4]/50"
                autoFocus
              />
              <div className="text-[10px] text-[#334155]">Enter to save · Esc to cancel</div>
            </div>
          ) : (
            <>
              {/*
                The <p> has no aria-hidden so NVDA can read the message text on hover.
                renderMessageContent returns inline spans for @mentions — NVDA reads
                their text content naturally as part of the paragraph.
              */}
              <p className="text-[#b0bec5] text-sm break-words leading-relaxed">
                {renderMessageContent(inviteDisplayContent)}
              </p>

              {inviteLinkMatch && inviteLinkPreview?.server && (
                <a
                  href={inviteLinkMatch.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block max-w-xs rounded-lg border border-[#1e3248] bg-[#0a1628] p-3 transition-colors hover:border-[#2a3f5a]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="text-2xl" aria-hidden="true">
                      {inviteLinkPreview.server.icon || '📁'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-[#475569]">
                        <LinkIcon className="size-3" />
                        Invite Link
                      </div>
                      <div className="text-sm font-semibold text-[#e2e8f0] truncate">
                        {inviteLinkPreview.server.name}
                      </div>
                      <div className="text-xs text-[#94a3b8]">
                        {inviteLinkPreview.invite?.creator?.displayName || inviteLinkPreview.invite?.creator?.username
                          ? `Shared by ${inviteLinkPreview.invite?.creator?.displayName || inviteLinkPreview.invite?.creator?.username}`
                          : 'Open invite'}
                      </div>
                    </div>
                    <ExternalLink className="size-4 text-[#64748b] flex-shrink-0" aria-hidden="true" />
                  </div>
                </a>
              )}

              {/* Server Invite Card */}
              {serverInvite && invitedServer && isInviteRecipient && serverInvite.status === 'pending' && (
                <div className="mt-2 bg-[#0a1628] rounded-lg p-3 border border-[#1e3248] max-w-xs" role="region" aria-label={`Invitation to join ${invitedServer.name}`}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="text-2xl" aria-hidden="true">{invitedServer.icon}</div>
                    <div>
                      <div className="text-[#e2e8f0] text-sm font-semibold">{invitedServer.name}</div>
                      <div className="text-[#475569] text-xs">Space Invitation</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => acceptServerInvite(serverInvite.id)} aria-label={`Accept invitation to ${invitedServer.name}`} className="flex-1 bg-[#06b6d4] hover:bg-[#0891b2] text-white h-7 text-xs">
                      Accept
                    </Button>
                    <Button onClick={() => declineServerInvite(serverInvite.id)} aria-label={`Decline invitation to ${invitedServer.name}`} variant="ghost" className="flex-1 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a2d45] border border-[#1e3248] h-7 text-xs">
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {serverInvite && invitedServer && isInviteRecipient && serverInvite.status !== 'pending' && (
                <div className="mt-1 text-[10px] text-[#334155] italic">
                  {serverInvite.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                </div>
              )}

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5" role="group" aria-label="Message reactions">
                  {message.reactions.map((reaction, idx) => {
                    const hasReacted = currentUser && reaction.users.includes(currentUser.id);
                    const reactorNames = reaction.users
                      .map((uid) => users.find((u) => u.id === uid)?.username)
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleReaction(message.id, reaction.emoji)}
                              aria-label={`${reaction.emoji} reaction, ${reaction.users.length} ${reaction.users.length === 1 ? 'person' : 'people'}: ${reactorNames}. ${hasReacted ? 'Click to remove your reaction' : 'Click to react'}`}
                              aria-pressed={!!hasReacted}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all ${
                                hasReacted
                                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/40 text-[#06b6d4]'
                                  : 'bg-[#111e30] border border-[#1e3248] text-[#64748b] hover:border-[#2a3f5a]'
                              }`}
                            >
                              <span aria-hidden="true">{reaction.emoji}</span>
                              <span aria-hidden="true">{reaction.users.length}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{reactorNames}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}

                  <Popover open={reactionPickerOpen} onOpenChange={setReactionPickerOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <PopoverTrigger asChild>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="Add reaction"
                              aria-haspopup="dialog"
                              aria-expanded={reactionPickerOpen}
                              className="flex items-center justify-center size-5 rounded bg-[#111e30] border border-[#1e3248] text-[#475569] hover:border-[#2a3f5a] hover:text-[#94a3b8] transition-colors"
                            >
                              <Plus className="size-2.5" aria-hidden="true" />
                            </button>
                          </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent><p>Add Reaction</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="right" align="start">
                      <CustomEmojiPicker onEmojiClick={handleReactionClick} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hover action buttons */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0" role="toolbar" aria-label="Message actions">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleReply}
                    aria-label={`Reply to ${authorDisplayName}`}
                    className="p-1 hover:bg-[#1a2d45] rounded text-[#334155] hover:text-[#94a3b8] transition-colors"
                  >
                    <Reply className="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Reply</p></TooltipContent>
              </Tooltip>

              <Popover open={hoverReactionPickerOpen} onOpenChange={setHoverReactionPickerOpen}>
                <Tooltip>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Add reaction"
                        aria-haspopup="dialog"
                        aria-expanded={hoverReactionPickerOpen}
                        className="p-1 hover:bg-[#1a2d45] rounded text-[#334155] hover:text-[#94a3b8] transition-colors"
                      >
                        <Smile className="size-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent><p>React</p></TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="end">
                  <CustomEmojiPicker onEmojiClick={handleReactionClick} />
                </PopoverContent>
              </Popover>

              {isOwnMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="More message options"
                      aria-haspopup="menu"
                      className="p-1 hover:bg-[#1a2d45] rounded text-[#334155] hover:text-[#94a3b8] transition-colors"
                    >
                      <MoreVertical className="size-3.5" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#0a1628] border border-[#1e3248] text-[#e2e8f0] shadow-xl">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45] cursor-pointer">
                      <Edit2 className="size-4 mr-2 text-[#06b6d4]" aria-hidden="true" /> Edit message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:text-white hover:bg-red-500/20 cursor-pointer">
                      <Trash2 className="size-4 mr-2" aria-hidden="true" /> Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TooltipProvider>
          </div>
        )}
      </div>
    </article>
  );
};
