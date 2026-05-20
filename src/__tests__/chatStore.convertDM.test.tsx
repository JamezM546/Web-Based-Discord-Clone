import React, { useEffect } from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the apiService used by AppContext
jest.mock('../app/services/apiService', () => {
  const mockApi = {
    login: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(false),
    getCurrentUser: jest.fn(),
    getServers: jest.fn(),
    getChannels: jest.fn(),
    getDmMessages: jest.fn(),
    getDirectMessages: jest.fn(),
    getFriends: jest.fn(),
    getFriendRequests: jest.fn(),
    getPendingInvites: jest.fn(),
    createServer: jest.fn(),
  };
  return { apiService: mockApi };
});

import { apiService } from '../app/services/apiService';
import { AppProvider, useApp } from '../app/context/AppContext';

const DM_ID = 'dm:123';
const SERVER_ID = 'server:999';

function TestHarness() {
  const app = useApp();

  useEffect(() => {
    (async () => {
      // perform login to set currentUser and allow message fetches
      // @ts-ignore - test mock shape
      await app.login('test@example.com', 'password');

      // select a DM conversation (this will trigger getDmMessages)
      app.setSelectedDM({ id: DM_ID, participants: ['u1', 'u2'], lastMessageTime: new Date() } as any);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button onClick={() => app.createServer('New Server', '🌟')}>Create Server</button>
      <div data-testid="selectedDM">{app.selectedDM?.id ?? 'null'}</div>
      <div data-testid="selectedServer">{app.selectedServer?.id ?? 'null'}</div>
      <div data-testid="messages">{app.messages.map((m) => (<div key={m.id}>{m.content}</div>))}</div>
    </div>
  );
}

describe('Chat store — convert DM to server', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // login returns a user payload expected by AppContext.login
    (apiService.login as jest.Mock).mockResolvedValue({ user: { id: 'u1', username: 'tester', email: 't@test' } });

    // getDmMessages returns backend rows (minimal shape) which AppContext maps to messages
    (apiService.getDmMessages as jest.Mock).mockResolvedValue([
      {
        id: 'm1',
        content: 'DM message here',
        author_id: 'u2',
        username: 'other',
        timestamp: new Date().toISOString(),
      },
    ]);

    // createServer returns a new server object
    (apiService.createServer as jest.Mock).mockResolvedValue({ data: { id: SERVER_ID, name: 'New Server', icon: '🌟' } });

    // getChannels for newly created server (return empty array for simplicity)
    (apiService.getChannels as jest.Mock).mockResolvedValue([]);
  });

  it('clears messages and unsubscribes DM state when creating server from DM', async () => {
    render(
      <AppProvider>
        <TestHarness />
      </AppProvider>
    );

    // Wait for DM message to be loaded into the UI
    await waitFor(() => expect(screen.getByText('DM message here')).toBeInTheDocument());

    // Ensure selectedDM is set
    expect(screen.getByTestId('selectedDM').textContent).toBe(DM_ID);

    // Click the Create Server button (the action under test)
    fireEvent.click(screen.getByText('Create Server'));

    // After server creation completes, AppContext should request channels for the new server
    await waitFor(() => expect(apiService.createServer).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(apiService.getChannels).toHaveBeenCalledWith(SERVER_ID));

    // Oracle assertions: selectedServer should be set, selectedDM should be cleared, and messages should be empty
    await waitFor(() => expect(screen.getByTestId('selectedServer').textContent).toBe(SERVER_ID));

    // The desired behaviour is that creating a server from a DM clears the DM selection
    // and the message list; this test asserts that behaviour so regressions are detectable.
    await waitFor(() => expect(screen.getByTestId('selectedDM').textContent).toBe('null'));
    await waitFor(() => expect(screen.getByTestId('messages').textContent).toBe(''));
  });
});
