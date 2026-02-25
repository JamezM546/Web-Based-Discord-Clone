import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface ServerSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ServerSearch: React.FC<ServerSearchProps> = ({ searchQuery, onSearchChange }) => {
  const { servers, currentUser, setSelectedServer, setSelectedChannel, setSelectedDM } = useApp();

  const userServers = servers.filter((s) => s.members.includes(currentUser?.id || ''));

  const filteredServers = userServers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!searchQuery) return null;

  return (
    <div className="absolute top-14 left-2 right-2 bg-[#2b2d31] rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden">
      <ScrollArea className="max-h-96">
        <div className="p-2">
          {filteredServers.length === 0 ? (
            <div className="text-center text-[#949ba4] py-4 text-sm">No servers found</div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-[#949ba4] uppercase font-semibold px-2 py-1">
                Servers — {filteredServers.length}
              </div>
              {filteredServers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(server);
                    setSelectedChannel(null);
                    setSelectedDM(null);
                    onSearchChange('');
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35373c] text-left"
                >
                  <div className="size-10 rounded-lg bg-[#313338] flex items-center justify-center text-lg">
                    {server.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{server.name}</div>
                    <div className="text-[#949ba4] text-xs">{server.members.length} members</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ServerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ServerSearchInput: React.FC<ServerSearchInputProps> = ({ value, onChange }) => {
  return (
    <div className="px-2 py-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-[#949ba4]" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search servers..."
          className="pl-8 pr-8 bg-[#1e1f22] border-none text-white text-sm h-8"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};