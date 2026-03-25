/**
 * Regression test for: creating a server while in a DM leaves selectedDM set,
 * causing DM messages to persist in the newly created server's view.
 *
 * Root cause: AppContext.createServer() calls setSelectedServer() but never
 * calls setSelectedDM(null), so the DM context remains active.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

// ---------------------------------------------------------------------------
// Mock apiService so no real HTTP requests are made
// ---------------------------------------------------------------------------

const mockCurrentUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.png',
  status: 'online',
  display_name: 'Test User',
};

const mockCreatedServer = {
  id: 'server-new',
  name: 'My New Server',
  icon: '🎮',
  owner_id: 'user-1',
};

const mockNewChannel = {
  id: 'ch-new',
  name: 'general',
  server_id: 'server-new',
};

vi.mock('../services/apiService', () => ({
  apiService: {
    isAuthenticated: vi.fn(() => true),
    getCurrentUser: vi.fn(() =>
      Promise.resolve({ success: true, data: { user: mockCurrentUser } })
    ),
    getServers: vi.fn(() => Promise.resolve([])),
    getChannels: vi.fn(() => Promise.resolve([mockNewChannel])),
    getDirectMessages: vi.fn(() => Promise.resolve([])),
    getDmMessages: vi.fn(() => Promise.resolve([])),
    getChannelMessages: vi.fn(() => Promise.resolve([])),
    getServerDetails: vi.fn(() => Promise.resolve({ members: [] })),
    getFriends: vi.fn(() => Promise.resolve([])),
    getFriendRequests: vi.fn(() => Promise.resolve([])),
    getPendingInvites: vi.fn(() => Promise.resolve([])),
    // apiService.createServer returns response.data from the API wrapper,
    // which the backend sends as { server: {...} }.  AppContext then reads
    // backendResponse?.data || backendResponse?.server || backendResponse.
    createServer: vi.fn(() =>
      Promise.resolve({ server: mockCreatedServer })
    ),
    logout: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helper component that surfaces context values and actions to the test
// ---------------------------------------------------------------------------

interface ContextSnapshot {
  selectedDM: ReturnType<typeof useApp>['selectedDM'];
  selectedServer: ReturnType<typeof useApp>['selectedServer'];
  setSelectedDM: ReturnType<typeof useApp>['setSelectedDM'];
  createServer: ReturnType<typeof useApp>['createServer'];
  currentUser: ReturnType<typeof useApp>['currentUser'];
}

let capturedCtx: ContextSnapshot | null = null;

const ContextCapture: React.FC = () => {
  const ctx = useApp();
  capturedCtx = {
    selectedDM: ctx.selectedDM,
    selectedServer: ctx.selectedServer,
    setSelectedDM: ctx.setSelectedDM,
    createServer: ctx.createServer,
    currentUser: ctx.currentUser,
  };
  return (
    <div>
      <span data-testid="selected-dm">{ctx.selectedDM?.id ?? 'null'}</span>
      <span data-testid="selected-server">{ctx.selectedServer?.id ?? 'null'}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppContext — createServer', () => {
  beforeEach(() => {
    capturedCtx = null;
  });

  it('clears selectedDM after a server is created from within a DM', async () => {
    render(
      <AppProvider>
        <ContextCapture />
      </AppProvider>
    );

    // Wait for auth init to complete so currentUser is populated
    await waitFor(() => expect(capturedCtx?.currentUser).not.toBeNull());

    const mockDM = {
      id: 'dm-1',
      participants: ['user-1', 'user-2'],
      lastMessageTime: new Date(),
    };

    // Simulate navigating into a DM
    await act(async () => {
      capturedCtx!.setSelectedDM(mockDM as any);
    });

    expect(screen.getByTestId('selected-dm').textContent).toBe('dm-1');

    // Create a server while the DM is active — this is the scenario that
    // triggers the bug
    await act(async () => {
      await capturedCtx!.createServer('My New Server', '🎮');
    });

    // BUG: selectedDM is NOT cleared by createServer, so DM messages bleed
    // into the new server view until the page is refreshed.
    // Once the bug is fixed, this assertion should pass.
    expect(screen.getByTestId('selected-dm').textContent).toBe('null');
  });

  it('sets the newly created server as selectedServer', async () => {
    render(
      <AppProvider>
        <ContextCapture />
      </AppProvider>
    );

    await waitFor(() => expect(capturedCtx?.currentUser).not.toBeNull());

    await act(async () => {
      await capturedCtx!.createServer('My New Server', '🎮');
    });

    expect(screen.getByTestId('selected-server').textContent).toBe(
      mockCreatedServer.id
    );
  });
});
