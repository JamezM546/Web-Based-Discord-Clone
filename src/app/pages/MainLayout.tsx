import React, { useState, useRef, useCallback } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { ChannelList } from '../components/channel/ChannelList';
import { UserSidebar } from '../components/user/UserSidebar';
import { UserProfile } from '../components/user/UserProfile';
import { MessageArea } from '../components/messaging/MessageArea';
import { AddFriendDialog } from '../components/user/AddFriendDialog';
import { ServerSearchInput, ServerSearch } from '../components/search/ServerSearch';
import { MemberList } from '../components/server/MemberList';
import { CreateServerDialog } from '../components/server/CreateServerDialog';
import { UserPlus, Plus, Home, Menu, Users, MessageSquare, Zap, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { ScrollArea } from '../components/ui/scroll-area';

export const MainLayout: React.FC = () => {
  const { currentUser, selectedServer, servers, channels, setSelectedServer, setSelectedChannel, setSelectedDM } = useApp();
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [showPeoplePanel, setShowPeoplePanel] = useState(true);
  const [dmSearchQuery, setDmSearchQuery] = useState('');

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userServers = servers.filter((s) => s.members.includes(currentUser.id));

  // Flat ordered list of views: home first, then servers
  const views = [{ type: 'home', server: null }, ...userServers.map((s) => ({ type: 'server', server: s }))];
  const currentViewIndex = selectedServer
    ? views.findIndex((v) => v.type === 'server' && v.server?.id === selectedServer.id)
    : 0;

  const goToViewIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(views.length - 1, idx));
    const view = views[clamped];
    if (view.type === 'home') {
      setSelectedServer(null);
      setSelectedChannel(null);
    } else if (view.server) {
      setSelectedServer(view.server);
      const firstChannel = channels.find(c => c.serverId === view.server!.id) ?? null;
      setSelectedChannel(firstChannel);
      setSelectedDM(null);
    }
  };

  const handleSpaceClick = (server: typeof servers[0]) => {
    setSelectedServer(server);
    const firstChannel = channels.find(c => c.serverId === server.id) ?? null;
    setSelectedChannel(firstChannel);
    setSelectedDM(null);
  };

  const handleHomeClick = () => {
    setSelectedServer(null);
    setSelectedChannel(null);
  };

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      // Only trigger on mostly-horizontal swipes of at least 60px
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (dx < 0) {
        // Swipe left → next view
        goToViewIndex(currentViewIndex + 1);
      } else {
        // Swipe right → previous view
        goToViewIndex(currentViewIndex - 1);
      }
    },
    [currentViewIndex, views]
  );

  const canGoLeft = currentViewIndex > 0;
  const canGoRight = currentViewIndex < views.length - 1;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#060c18]">
      {/* ── TOP NAVIGATION BAR ── */}
      <div className="h-14 bg-[#0a1628] border-b border-[#1e3248] flex items-center px-3 gap-0 flex-shrink-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 flex-shrink-0">
          <div className="size-8 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center flex-shrink-0">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">Anaphor</span>
        </div>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-stretch flex-1 h-full overflow-hidden gap-0" role="navigation" aria-label="Anaphor spaces and chats">

          {/* Direct Chats section */}
          <div
            className="flex items-center flex-shrink-0 px-2"
            style={{ borderRight: '1px solid rgba(30,50,72,0.8)' }}
          >
            <div className="flex flex-col mr-3 flex-shrink-0">
              <span
                className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1"
                style={{ color: '#334155' }}
                aria-hidden="true"
              >
                Chats
              </span>
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleHomeClick}
                    aria-current={!selectedServer ? 'page' : undefined}
                    aria-label="Direct Chats"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all flex-shrink-0 ${
                      !selectedServer
                        ? 'text-white shadow-lg shadow-[#06b6d4]/20'
                        : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                    }`}
                    style={
                      !selectedServer
                        ? {
                            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                          }
                        : {}
                    }
                  >
                    <MessageSquare className="size-4 flex-shrink-0" />
                    <span className="hidden lg:block whitespace-nowrap">Direct Chats</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Direct Chats</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Spaces section */}
          <div className="flex items-center flex-1 overflow-hidden px-2">
            <div className="flex flex-col mr-2 flex-shrink-0">
              <span
                className="text-[10px] font-bold uppercase tracking-widest leading-none"
                style={{ color: '#334155' }}
                aria-hidden="true"
              >
                Spaces
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-1 py-1">
                <TooltipProvider delayDuration={100}>
                  {userServers.map((server) => (
                    <Tooltip key={server.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSpaceClick(server)}
                          aria-current={selectedServer?.id === server.id ? 'page' : undefined}
                          aria-label={server.name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all flex-shrink-0 ${
                            selectedServer?.id === server.id
                              ? 'text-white shadow-lg shadow-[#06b6d4]/20'
                              : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                          }`}
                          style={
                            selectedServer?.id === server.id
                              ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }
                              : {}
                          }
                        >
                          <span>{server.icon}</span>
                          <span className="hidden lg:block truncate max-w-[110px]">{server.name}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{server.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {/* Add new space */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setCreateSpaceOpen(true)}
                        aria-label="Create a new Space"
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-[#94a3b8] hover:text-[#06b6d4] hover:bg-[#1a2d45] transition-all flex-shrink-0"
                      >
                        <Plus className="size-4" />
                        <span className="hidden lg:block">New Space</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Create a Space</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </ScrollArea>
          </div>

          {/* Swipe nav arrows — desktop hint */}
          <div className="flex items-center gap-1 px-2 flex-shrink-0" style={{ borderLeft: '1px solid rgba(30,50,72,0.6)' }}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => goToViewIndex(currentViewIndex - 1)}
                    disabled={!canGoLeft}
                    aria-label="Go to previous view"
                    className={`p-1.5 rounded-lg transition-all ${
                      canGoLeft
                        ? 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                        : 'text-[#1e3248] cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Previous</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => goToViewIndex(currentViewIndex + 1)}
                    disabled={!canGoRight}
                    aria-label="Go to next view"
                    className={`p-1.5 rounded-lg transition-all ${
                      canGoRight
                        ? 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                        : 'text-[#1e3248] cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Next</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {!selectedServer && (
            <Button
              onClick={() => setAddFriendOpen(true)}
              size="sm"
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-white hidden md:flex"
            >
              <UserPlus className="size-4 mr-1.5" />
              Add Friend
            </Button>
          )}
          {selectedServer && (
            <div className="hidden md:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowPeoplePanel(!showPeoplePanel)}
                      className={`p-2 rounded-lg transition-all ${
                        showPeoplePanel
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                          : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                      }`}
                    >
                      <Users className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Toggle People</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Mobile menu — SheetContent only; trigger lives in the mobile context bar */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-[320px] bg-[#0a1628] border-[#1e3248]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Space and room navigation</SheetDescription>
              <div className="flex flex-col h-full">
                {/* Mobile nav */}
                <div className="p-4 border-b border-[#1e3248]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-7 rounded-md bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
                      <Zap className="size-4 text-white" />
                    </div>
                    <span className="text-white font-bold">Anaphor</span>
                  </div>

                  {/* Direct Chats section */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#334155] mb-1.5 px-1">
                      Direct Chats
                    </p>
                    <button
                      onClick={() => { handleHomeClick(); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        !selectedServer ? 'text-white' : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                      }`}
                      style={
                        !selectedServer
                          ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }
                          : {}
                      }
                    >
                      <MessageSquare className="size-4" />
                      Direct Chats
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#1e3248] my-2" />

                  {/* Spaces section */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#334155] mb-1.5 px-1">
                      Spaces
                    </p>
                    <div className="space-y-1">
                      {userServers.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => { handleSpaceClick(server); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedServer?.id === server.id
                              ? 'text-white'
                              : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                          }`}
                          style={
                            selectedServer?.id === server.id
                              ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }
                              : {}
                          }
                        >
                          <span>{server.icon}</span>
                          {server.name}
                        </button>
                      ))}
                      <button
                        onClick={() => { setCreateSpaceOpen(true); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#06b6d4] hover:bg-[#1a2d45] transition-all"
                      >
                        <Plus className="size-4" />
                        New Space
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile rooms/DMs */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {selectedServer ? (
                      <ChannelList onChannelSelect={() => setMobileMenuOpen(false)} />
                    ) : (
                      <UserSidebar onDMSelect={() => setMobileMenuOpen(false)} />
                    )}
                  </div>
                  <UserProfile />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Mobile: sub-strip (always rendered for consistent header height) ── */}
      <div className="md:hidden bg-[#0a1628] border-b border-[#1e3248] flex-shrink-0 px-3 py-2">
        {selectedServer ? (
          <div className="relative">
            <ServerSearchInput value={serverSearchQuery} onChange={setServerSearchQuery} />
            <ServerSearch searchQuery={serverSearchQuery} onSearchChange={setServerSearchQuery} />
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#475569]" />
            <Input
              value={dmSearchQuery}
              onChange={(e) => setDmSearchQuery(e.target.value)}
              placeholder="Search direct chats..."
              className="pl-8 pr-8 bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] placeholder:text-[#475569] text-sm h-8 focus-visible:ring-[#06b6d4]/50 w-full rounded-lg"
            />
            {dmSearchQuery && (
              <button
                onClick={() => setDmSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {/* ── BODY ── */}
      <div
        className="flex flex-1 overflow-hidden relative"
        ref={swipeAreaRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Sidebar — Desktop only */}
        <div className="hidden md:flex flex-col w-64 bg-[#0d1a2e] border-r border-[#1e3248] flex-shrink-0">
          <div className="flex-1 overflow-hidden">
            {selectedServer && (
              <div className="relative">
                <ServerSearchInput value={serverSearchQuery} onChange={setServerSearchQuery} />
                <ServerSearch searchQuery={serverSearchQuery} onSearchChange={setServerSearchQuery} />
              </div>
            )}
            {selectedServer ? <ChannelList /> : <UserSidebar />}
          </div>
          <UserProfile />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile: context header */}
          <div className="md:hidden h-12 bg-[#0a1628] border-b border-[#1e3248] flex items-center px-3 gap-2">
            {/* Burger — opens the navigation sheet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1a2d45] transition-all flex-shrink-0"
            >
              <Menu className="size-5" />
            </button>

            {/* Scrollable space tabs — mirrors the desktop nav */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <ScrollArea className="w-full">
                <div className="flex items-center gap-1 py-1">
                  {/* Direct Chats */}
                  <button
                    onClick={handleHomeClick}
                    aria-label="Direct Chats"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                      !selectedServer
                        ? 'text-white shadow-lg shadow-[#06b6d4]/20'
                        : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                    }`}
                    style={!selectedServer ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' } : {}}
                  >
                    <MessageSquare className="size-3.5 flex-shrink-0" />
                    Chats
                  </button>

                  {/* Divider */}
                  <div className="w-px h-4 bg-[#1e3248] flex-shrink-0 mx-0.5" />

                  {/* Space pills */}
                  {userServers.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => handleSpaceClick(server)}
                      aria-label={server.name}
                      aria-current={selectedServer?.id === server.id ? 'page' : undefined}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                        selectedServer?.id === server.id
                          ? 'text-white shadow-lg shadow-[#06b6d4]/20'
                          : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                      }`}
                      style={selectedServer?.id === server.id ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' } : {}}
                    >
                      <span>{server.icon}</span>
                      {server.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right action: Toggle People (server) or Add Friend (DMs) */}
            {selectedServer ? (
              <button
                onClick={() => setShowPeoplePanel(!showPeoplePanel)}
                aria-label="Toggle People panel"
                aria-pressed={showPeoplePanel}
                className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                  showPeoplePanel
                    ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                    : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a2d45]'
                }`}
              >
                <Users className="size-4" />
              </button>
            ) : (
              <Button
                onClick={() => setAddFriendOpen(true)}
                size="sm"
                className="bg-[#06b6d4] hover:bg-[#0891b2] text-white p-2 flex-shrink-0"
              >
                <UserPlus className="size-4" />
              </Button>
            )}
          </div>

          <MessageArea />
        </div>

        {/* People Panel — Desktop only, collapsible */}
        {selectedServer && showPeoplePanel && (
          <div className="hidden md:flex">
            <MemberList />
          </div>
        )}

        {/* People Panel — Mobile overlay */}
        {selectedServer && showPeoplePanel && (
          <>
            {/* Tap-outside backdrop */}
            <div
              className="md:hidden absolute inset-0 z-20"
              onClick={() => setShowPeoplePanel(false)}
              aria-hidden="true"
            />
            {/* Slide-in panel */}
            <div className="md:hidden absolute right-0 top-0 bottom-0 z-30 w-52 flex flex-col shadow-2xl">
              <MemberList />
            </div>
          </>
        )}
      </div>

      <AddFriendDialog open={addFriendOpen} onOpenChange={setAddFriendOpen} />
      <CreateServerDialog open={createSpaceOpen} onOpenChange={setCreateSpaceOpen} />
    </div>
  );
};