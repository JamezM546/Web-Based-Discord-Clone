import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../src/app/context/AppContext';
import { apiService } from '../src/app/services/apiService';
import { websocketService } from '../src/app/services/websocketService';

// Mock the apiService
jest.mock('../src/app/services/apiService', () => ({
  apiService: {
    isAuthenticated: jest.fn(),
    getToken: jest.fn(),
    getCurrentUser: jest.fn(),
    getServers: jest.fn(),
    getChannels: jest.fn(),
    getDirectMessages: jest.fn(),
    getChannelMessages: jest.fn(),
    getDmMessages: jest.fn(),
    getFriends: jest.fn(),
    getFriendRequests: jest.fn(),
    getPendingInvites: jest.fn(),
    getServerDetails: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    logoutFromServer: jest.fn(),
    createServer: jest.fn(),
    deleteServer: jest.fn(),
    updateServer: jest.fn(),
    sendServerInvite: jest.fn(),
    acceptServerInvite: jest.fn(),
    declineServerInvite: jest.fn(),
    createChannel: jest.fn(),
    createMessage: jest.fn(),
    sendMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    toggleReaction: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    createDirectMessage: jest.fn(),
    updateStatus: jest.fn(),
    updateProfile: jest.fn(),
    getChannelReadStates: jest.fn(),
    getDmReadStates: jest.fn(),
    markChannelRead: jest.fn(),
    markDmRead: jest.fn(),
  },
}));

jest.mock('../src/app/services/websocketService', () => ({
  websocketService: {
    subscribe: jest.fn(() => jest.fn()),
    connect: jest.fn(),
    disconnect: jest.fn(),
    setActiveRoom: jest.fn(),
    sendTypingStart: jest.fn(),
    sendTypingStop: jest.fn(),
  },
}));

const mockApi = apiService as jest.Mocked<typeof apiService>;
const mockWebsocket = websocketService as jest.Mocked<typeof websocketService>;

const baseCurrentUser = {
  id: 'u1',
  username: 'test_user',
  email: 'test@example.com',
  status: 'online',
  display_name: 'Test User',
  avatar: 'avatar.png',
};

const createAuthResponse = (user: Partial<typeof baseCurrentUser> = {}) => ({
  success: true,
  data: {
    user: {
      ...baseCurrentUser,
      ...user,
    },
  },
});

const resetApiMocks = () => {
  jest.resetAllMocks();
  mockApi.isAuthenticated.mockReturnValue(false);
  mockApi.getToken.mockImplementation(() => (mockApi.isAuthenticated() ? 'token' : null));
  mockApi.getCurrentUser.mockResolvedValue(createAuthResponse());
  mockApi.getServers.mockResolvedValue([]);
  mockApi.getChannels.mockResolvedValue([]);
  mockApi.getDirectMessages.mockResolvedValue([]);
  mockApi.getChannelMessages.mockResolvedValue([]);
  mockApi.getDmMessages.mockResolvedValue([]);
  mockApi.getFriends.mockResolvedValue([]);
  mockApi.getFriendRequests.mockResolvedValue([]);
  mockApi.getPendingInvites.mockResolvedValue([]);
  mockApi.getServerDetails.mockResolvedValue({ members: [] });
  mockApi.login.mockImplementation(async () => {
    mockApi.isAuthenticated.mockReturnValue(true);
    mockApi.getToken.mockReturnValue('token');
    return {
      user: {
        ...baseCurrentUser,
      },
      token: 'token',
    } as any;
  });
  mockApi.register.mockImplementation(async () => {
    mockApi.isAuthenticated.mockReturnValue(true);
    mockApi.getToken.mockReturnValue('token');
    return {
      user: {
        ...baseCurrentUser,
      },
      token: 'token',
    } as any;
  });
  mockApi.logout.mockImplementation(() => {
    mockApi.isAuthenticated.mockReturnValue(false);
    mockApi.getToken.mockReturnValue(null);
  });
  mockApi.logoutFromServer.mockResolvedValue(undefined as any);
  mockApi.createServer.mockResolvedValue({ id: 's-new', name: 'New Server', icon: '🚀', owner_id: 'u1' } as any);
  mockApi.deleteServer.mockResolvedValue(undefined as any);
  mockApi.updateServer.mockResolvedValue({ id: 's1', name: 'Updated Server', icon: '✨', owner_id: 'u1' } as any);
  mockApi.sendServerInvite.mockResolvedValue(undefined as any);
  mockApi.acceptServerInvite.mockResolvedValue(undefined as any);
  mockApi.declineServerInvite.mockResolvedValue(undefined as any);
  mockApi.createChannel.mockResolvedValue({ id: 'c-new', server_id: 's1', name: 'general' } as any);
  mockApi.createMessage.mockResolvedValue({
    id: 'm-default',
    content: 'message',
    author_id: 'u1',
    channel_id: 'c1',
    timestamp: new Date().toISOString(),
    edited: false,
  } as any);
  mockApi.editMessage.mockResolvedValue({
    id: 'm-default',
    content: 'edited',
    author_id: 'u1',
    channel_id: 'c1',
    timestamp: new Date().toISOString(),
    edited: true,
  } as any);
  mockApi.deleteMessage.mockResolvedValue(undefined as any);
  mockApi.toggleReaction.mockResolvedValue({ reactions: [] } as any);
  mockApi.sendFriendRequest.mockResolvedValue(undefined as any);
  mockApi.acceptFriendRequest.mockResolvedValue(undefined as any);
  mockApi.rejectFriendRequest.mockResolvedValue(undefined as any);
  mockApi.removeFriend.mockResolvedValue({ removedUserId: 'u2' } as any);
  mockApi.createDirectMessage.mockResolvedValue({
    id: 'dm-default',
    participants: ['u1', 'u2'],
    last_message_time: new Date().toISOString(),
    other_user_id: 'u2',
    username: 'friend_user',
  } as any);
  mockApi.updateStatus.mockResolvedValue(baseCurrentUser as any);
  mockApi.updateProfile.mockResolvedValue(baseCurrentUser as any);
  mockApi.getChannelReadStates.mockResolvedValue([]);
  mockApi.getDmReadStates.mockResolvedValue([]);
  mockApi.markChannelRead.mockResolvedValue(undefined as any);
  mockApi.markDmRead.mockResolvedValue(undefined as any);
  mockWebsocket.subscribe.mockReturnValue(jest.fn());
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext Unit Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetApiMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
  
  describe('Helper Functions (Indirect Tests)', () => {
    test('mapBackendMessageRowToFrontend: should transform backend message row to frontend format', async () => {
      mockApi.isAuthenticated.mockReturnValue(true);
      mockApi.getCurrentUser.mockResolvedValue(createAuthResponse({ id: 'currentUser', username: 'current' }));

      const mockBackendRow = {
        id: "msg1",
        content: "Hello",
        author_id: "user1",
        channel_id: "ch1",
        timestamp: "2023-01-01T00:00:00Z",
        edited: false
      };
      mockApi.createMessage.mockResolvedValue(mockBackendRow);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sendMessage("Hello", "ch1");
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });
      
      expect(result.current.messages[0]).toMatchObject({
        id: "msg1",
        content: "Hello",
        authorId: "user1",
        channelId: "ch1",
        timestamp: new Date("2023-01-01T00:00:00Z"),
        edited: false
      });
    });

    test('mergeUsersFromMessageRows: should merge users from message rows into state', async () => {
      mockApi.isAuthenticated.mockReturnValue(true);
      mockApi.getCurrentUser.mockResolvedValue(createAuthResponse({ id: 'currentUser', username: 'current' }));

      // The presence of author_id and username will trigger mergeUsersFromMessageRows inside sendMessage
      const mockBackendRowWithUser = {
        id: "msg2",
        content: "Hi",
        author_id: "user2",
        username: "jane", 
        timestamp: "2023-01-01T00:00:00Z"
      };
      mockApi.createMessage.mockResolvedValue(mockBackendRowWithUser);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sendMessage("Hi", "ch1");
      });

      await waitFor(() => {
        const mergedUser = result.current.users.find(u => u.id === "user2");
        expect(mergedUser).toBeDefined();
        expect(mergedUser?.username).toBe("jane");
      });
    });

    test('upsertUsers: should add new users and update existing ones without duplicates', async () => {
      mockApi.isAuthenticated.mockReturnValue(true);
      mockApi.getCurrentUser.mockResolvedValue(createAuthResponse({ id: 'currentUser', username: 'current' }));

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 1. Add new user via refreshFriends (which calls upsertUsers internally)
      mockApi.getFriends.mockResolvedValue([
        { id: "user3", username: "bob", status: "online" }
      ]);

      await act(async () => {
        await result.current.refreshFriends();
      });

      await waitFor(() => {
        const addedUser = result.current.users.find(u => u.id === "user3");
        expect(addedUser).toBeDefined();
        expect(addedUser?.username).toBe("bob");
      });

      // 2. Update existing user (same ID, new username)
      mockApi.getFriends.mockResolvedValue([
        { id: "user3", username: "bob_updated", status: "online" }
      ]);

      await act(async () => {
        await result.current.refreshFriends();
      });

      await waitFor(() => {
        const updatedUser = result.current.users.find(u => u.id === "user3");
        expect(updatedUser).toBeDefined();
        expect(updatedUser?.username).toBe("bob_updated");
        
        const user3Count = result.current.users.filter(u => u.id === "user3").length;
        expect(user3Count).toBe(1);
      });
    });
  });

  describe('Backend Fetch Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Setup default successful auth for all mount-triggered fetches
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "current_user" } }
      });
      // Default empty resolves to prevent unhandled promise rejections
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('4. fetchUserServers: should fetch and transform servers on mount', async () => {
      const mockServers = [{ 
        id: "s1", 
        name: "Test Server", 
        icon: "🎮", 
        owner_id: "u1", 
        members: ["u1"] 
      }];
      (apiService.getServers as jest.Mock).mockResolvedValue(mockServers);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      expect(result.current.servers[0]).toEqual({
        id: "s1",
        name: "Test Server",
        icon: "🎮",
        ownerId: "u1",
        members: ["u1"]
      });
    });

    test('5. fetchChannels: should fetch channels for loaded servers automatically', async () => {
      // fetchChannels is triggered automatically after servers are fetched
      const mockServers = [{ id: "s1", name: "Test Server" }];
      const mockChannels = [{ id: "c1", name: "general", server_id: "s1" }];
      
      (apiService.getServers as jest.Mock).mockResolvedValue(mockServers);
      (apiService.getChannels as jest.Mock).mockResolvedValue(mockChannels);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.channels).toHaveLength(1);
      });

      expect(result.current.channels[0]).toEqual({
        id: "c1",
        name: "general",
        serverId: "s1"
      });
    });

    test('6. fetchUserDirectMessages: should fetch DMs and upsert other users on mount', async () => {
      const mockDMs = [{
        id: "dm1",
        participants: ["u1", "u2"],
        last_message_time: "2023-01-01T00:00:00Z",
        other_user_id: "u2",
        username: "friend_user",
        status: "online"
      }];
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue(mockDMs);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.directMessages).toHaveLength(1);
      });

      expect(result.current.directMessages[0]).toEqual({
        id: "dm1",
        participants: ["u1", "u2"],
        lastMessageTime: new Date("2023-01-01T00:00:00Z")
      });

      // Verifies that upsertUsers handled the attached other user
      const dmUser = result.current.users.find(u => u.id === "u2");
      expect(dmUser).toBeDefined();
      expect(dmUser?.username).toBe("friend_user");
    });

    test('7. fetchFriends: should fetch friends and update state manually via refreshFriends', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockFriends = [{
        id: "u3",
        username: "bestie",
        status: "online"
      }];
      (apiService.getFriends as jest.Mock).mockResolvedValue(mockFriends);

      await act(async () => {
        await result.current.refreshFriends();
      });

      const friendsList = result.current.getFriends();
      expect(friendsList).toHaveLength(1);
      expect(friendsList[0].username).toBe("bestie");
      
      // Ensures the fetched friend was merged into the global users state as well
      const globalUser = result.current.users.find(u => u.id === "u3");
      expect(globalUser).toBeDefined();
    });

    test('8. fetchFriendRequests: should fetch requests and upsert users manually via refreshFriendRequests', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockRequests = [{
        id: "req1",
        from_user_id: "u4",
        to_user_id: "u1",
        status: "pending",
        from_username: "stranger"
      }];
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue(mockRequests);

      await act(async () => {
        await result.current.refreshFriendRequests();
      });

      expect(result.current.friendRequests).toHaveLength(1);
      expect(result.current.friendRequests[0]).toEqual({
        id: "req1",
        fromUserId: "u4",
        toUserId: "u1",
        status: "pending"
      });

      // Ensures the sender was added to the global users pool
      const requester = result.current.users.find(u => u.id === "u4");
      expect(requester).toBeDefined();
      expect(requester?.username).toBe("stranger");
    });

    test('9. fetchPendingInvites: should fetch and store server invites on mount', async () => {
      const mockInvites = [{
        id: "inv1",
        server_id: "s2",
        from_user_id: "u2",
        to_user_id: "u1",
        status: "pending",
        created_at: "2023-01-01T00:00:00Z"
      }];
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue(mockInvites);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.serverInvites).toHaveLength(1);
      });

      expect(result.current.serverInvites[0]).toMatchObject({
        id: "inv1",
        serverId: "s2",
        fromUserId: "u2",
        toUserId: "u1",
        status: "pending",
        timestamp: new Date("2023-01-01T00:00:00Z")
      });
    });
  });

  describe('Authentication Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Provide default safe resolves for fetches triggered after successful auth
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('10. checkAuth: should fetch current user and set state if authenticated on mount', async () => {
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getToken as jest.Mock).mockReturnValue('restored-token');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "auth_user" } }
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiService.getCurrentUser).toHaveBeenCalled();

      // toMatchObject allows the test to pass even with generated fields like avatar/status
      expect(result.current.currentUser).toMatchObject({ id: "u1", username: "auth_user" });
      expect(websocketService.subscribe).toHaveBeenCalled();
      expect(websocketService.connect).toHaveBeenCalledWith('restored-token');
    });

    test('11. login: should authenticate user, update state, and return true on success', async () => {
      mockApi.isAuthenticated.mockReturnValue(false);
      mockApi.getToken.mockReturnValue(null);
      mockApi.login.mockImplementation(async () => {
        mockApi.isAuthenticated.mockReturnValue(true);
        mockApi.getToken.mockReturnValue('fake-token');
        return {
          user: {
            ...baseCurrentUser,
            id: 'u2',
            username: 'login_user',
            email: 'login@example.com',
          },
          token: 'fake-token',
        } as any;
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login("test@test.com", "password123");
      });

      expect(apiService.login).toHaveBeenCalledWith("test@test.com", "password123");
      expect(loginResult).toBe(true);
      expect(result.current.currentUser).toMatchObject({ id: "u2", username: "login_user" });
      await waitFor(() => {
        expect(websocketService.connect).toHaveBeenCalledWith('fake-token');
      });
    });

    test('12. register: should create account, update state, and return true on success', async () => {
      mockApi.isAuthenticated.mockReturnValue(false);
      mockApi.getToken.mockReturnValue(null);
      mockApi.register.mockImplementation(async () => {
        mockApi.isAuthenticated.mockReturnValue(true);
        mockApi.getToken.mockReturnValue('fake-token');
        return {
          user: {
            ...baseCurrentUser,
            id: 'u3',
            username: 'new_user',
            email: 'new@example.com',
          },
          token: 'fake-token',
        } as any;
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register("new_user", "test@test.com", "password123");
      });

      expect(apiService.register).toHaveBeenCalledWith("new_user", "test@test.com", "password123");
      expect(registerResult).toBe(true);
      expect(result.current.currentUser).toMatchObject({ id: "u3", username: "new_user" });
      await waitFor(() => {
        expect(websocketService.connect).toHaveBeenCalledWith('fake-token');
      });
    });

    test('13. logout: should call apiService.logout and clear application state', async () => {
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getToken as jest.Mock).mockReturnValue('session-token');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u4", username: "logout_user" } }
      });
      (apiService.getServers as jest.Mock).mockResolvedValue([{ id: "s1", name: "Test Server" }]);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentUser).toBeDefined();
        expect(result.current.servers).toHaveLength(1);
      });

      (apiService.logout as jest.Mock).mockResolvedValue({ success: true });

      await act(async () => {
        result.current.logout();
      });

      expect(apiService.logout).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
        expect(result.current.servers).toHaveLength(0);
      });
      expect(websocketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Realtime Websocket Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockWebsocket.subscribe.mockReturnValue(jest.fn());
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getToken as jest.Mock).mockReturnValue('socket-token');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: 'u1', username: 'socket_user' } },
      });
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('14. connects the websocket after restoring an authenticated session', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(websocketService.subscribe).toHaveBeenCalled();
      expect(websocketService.connect).toHaveBeenCalledWith('socket-token');
    });

    test('15. updates the active websocket room when the selected conversation changes', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentUser?.id).toBe('u1');
      });

      act(() => {
        result.current.setSelectedChannel({ id: 'c1', name: 'general', serverId: 's1' } as any);
      });

      await waitFor(() => {
        expect(websocketService.setActiveRoom).toHaveBeenCalledWith('channel:c1');
      });

      act(() => {
        result.current.setSelectedChannel(null);
        result.current.setSelectedDM({
          id: 'dm1',
          participants: ['u1', 'u2'],
          lastMessageTime: new Date('2023-01-01T00:00:00Z'),
        });
      });

      await waitFor(() => {
        expect(websocketService.setActiveRoom).toHaveBeenCalledWith('dm:dm1');
      });
    });
  });

  describe('Server Management Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Standard auth setup so the hook can mount successfully
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Provide some initial state to work with
      const initialServers = [{ id: "s1", name: "Initial Server", icon: "🎮", owner_id: "u1" }];
      (apiService.getServers as jest.Mock).mockResolvedValue(initialServers);
      
      const initialInvites = [{ id: "inv1", server_id: "s2", from_user_id: "u2", to_user_id: "u1", status: "pending" }];
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue(initialInvites);

      // Default safe resolves for the rest
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
    });

    test('14. createServer: should call API and add the new server to state', async () => {
      // Mock the creation response
      const mockNewServer = {
        id: "s2",
        name: "New Server",
        icon: "🚀",
        owner_id: "u1",
        members: ["u1"]
      };
      (apiService.createServer as jest.Mock).mockResolvedValue(mockNewServer);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.createServer("New Server", "🚀");
      });

      expect(apiService.createServer).toHaveBeenCalledWith("New Server", "🚀");
      
      // Verify state was updated with the new server
      expect(result.current.servers).toHaveLength(2);
      expect(result.current.servers).toContainEqual(
        expect.objectContaining({ id: "s2", name: "New Server", icon: "🚀" })
      );
    });

    test('15. deleteServer: should call API and remove the server from state', async () => {
      (apiService.deleteServer as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.servers).toHaveLength(1); // "s1" is loaded
      });

      await act(async () => {
        await result.current.deleteServer("s1");
      });

      expect(apiService.deleteServer).toHaveBeenCalledWith("s1");
      
      // Verify the server was removed from state
      expect(result.current.servers).toHaveLength(0);
    });

    test('16. updateServer: should call API and update the existing server in state', async () => {
      const updatedServerData = {
        id: "s1",
        name: "Updated Server",
        icon: "✨",
        owner_id: "u1"
      };
      (apiService.updateServer as jest.Mock).mockResolvedValue(updatedServerData);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.servers[0].name).toBe("Initial Server");
      });

      await act(async () => {
        await result.current.updateServer("s1", "Updated Server", "✨");
      });

      // UPDATE HERE: Match the object signature the apiService receives
      expect(apiService.updateServer).toHaveBeenCalledWith("s1", { 
        name: "Updated Server", 
        icon: "✨" 
      });
      
      // Verify the state reflects the updated fields
      expect(result.current.servers).toHaveLength(1);
      expect(result.current.servers[0]).toMatchObject({
        id: "s1",
        name: "Updated Server",
        icon: "✨"
      });
    });

    test('17. sendServerInvite: should call API to send an invite', async () => {
      (apiService.sendServerInvite as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendServerInvite("s1", "u3");
      });

      expect(apiService.sendServerInvite).toHaveBeenCalledWith("s1", "u3");
    });

    test('18. acceptServerInvite: should call API, remove invite, and optionally fetch servers', async () => {
      (apiService.acceptServerInvite as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the initial invite to load
      await waitFor(() => {
        expect(result.current.serverInvites).toHaveLength(1);
      });

      await act(async () => {
        await result.current.acceptServerInvite("inv1");
      });

      expect(apiService.acceptServerInvite).toHaveBeenCalledWith("inv1");
      
      // The pending invite should be removed from the state
      expect(result.current.serverInvites).toHaveLength(0);
      
      // Usually accepting an invite triggers a re-fetch of servers
      // expect(apiService.getServers).toHaveBeenCalledTimes(2); // 1 for mount, 1 for refresh
    });

    test('19. declineServerInvite: should call API and remove the invite from state', async () => {
      (apiService.declineServerInvite as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.serverInvites).toHaveLength(1);
      });

      await act(async () => {
        await result.current.declineServerInvite("inv1");
      });

      expect(apiService.declineServerInvite).toHaveBeenCalledWith("inv1");
      
      // Verify the invite was removed
      expect(result.current.serverInvites).toHaveLength(0);
    });
  });

  describe('Channel Management Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup default authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Provide an initial server and channel
      (apiService.getServers as jest.Mock).mockResolvedValue([{ id: "s1", name: "Test Server" }]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([{ id: "c1", server_id: "s1", name: "general" }]);
      
      // Default safe resolves for the rest
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('20. createChannel: should call API and add the new channel to state', async () => {
      // Mock the newly created channel response
      const mockNewChannel = {
        id: "c2",
        server_id: "s1",
        name: "new-channel"
      };
      (apiService.createChannel as jest.Mock).mockResolvedValue(mockNewChannel);

      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for initial channels to load into state
      await waitFor(() => {
        expect(result.current.channels).toHaveLength(1);
        expect(result.current.channels[0].name).toBe("general");
      });

      await act(async () => {
        await result.current.createChannel("s1", "new-channel");
      });

      expect(apiService.createChannel).toHaveBeenCalledWith("s1", "new-channel");
      
      expect(result.current.channels).toHaveLength(2);
      expect(result.current.channels).toContainEqual(
        expect.objectContaining({ 
          id: "c2", 
          serverId: "s1", 
          name: "new-channel" 
        })
      );
    });
  });

  describe('Message Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup default authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Default safe resolves for initial mounts
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('21. sendMessage: should call API to create a message', async () => {
      const mockBackendMessage = {
        id: "m1",
        content: "Hello world!",
        author_id: "u1",
        channel_id: "c1",
        timestamp: new Date().toISOString(),
        edited: false,
      };
      
      mockApi.createMessage.mockResolvedValue(mockBackendMessage);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        // Calling context function with separate arguments
        await result.current.sendMessage("Hello world!", "c1", undefined, undefined, undefined);
      });

      // Updated to match the object signature received by the API
      expect(apiService.createMessage).toHaveBeenCalledWith({
        content: "Hello world!",
        channelId: "c1",
        dmId: undefined,
        replyToId: undefined,
        serverInviteId: undefined
      });
    });

    test('22. editMessage: should call API to update an existing message', async () => {
      const updatedMessageData = {
        id: "m1",
        content: "Edited content",
        edited: true
      };
      (apiService.editMessage as jest.Mock).mockResolvedValue(updatedMessageData);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.editMessage("m1", "Edited content");
      });

      expect(apiService.editMessage).toHaveBeenCalledWith("m1", "Edited content");
    });

    test('23. deleteMessage: should call API to remove a message', async () => {
      (apiService.deleteMessage as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteMessage("m1");
      });

      expect(apiService.deleteMessage).toHaveBeenCalledWith("m1");
    });

    test('24. toggleReaction: should call API to add or remove an emoji reaction', async () => {
      const mockReactionResponse = {
        reactions: [{ emoji: "👍", count: 1, users: ["u1"] }]
      };
      mockApi.toggleReaction.mockResolvedValue(mockReactionResponse as any);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleReaction("m1", "👍");
      });

      expect(apiService.toggleReaction).toHaveBeenCalledWith("m1", "👍");
    });
  });

  describe('Friend Management Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup default authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Provide an initial pending friend request
      const initialFriendRequests = [
        { id: "req1", from_user_id: "u2", to_user_id: "u1", status: "pending" }
      ];
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue(initialFriendRequests);

      // Default safe resolves for the rest
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('25. sendFriendRequest: should call API to send a friend request', async () => {
      (apiService.sendFriendRequest as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendFriendRequest("u2");
      });

      expect(apiService.sendFriendRequest).toHaveBeenCalledWith("u2");
    });

    test('26. acceptFriendRequest: should call API and remove the request from state', async () => {
      (apiService.acceptFriendRequest as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the initial friend request to load into state
      await waitFor(() => {
        expect(result.current.friendRequests).toHaveLength(1);
        expect(result.current.friendRequests[0].id).toBe("req1");
      });

      // UPDATE: Change the mock to return an empty array for the refetch
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        await result.current.acceptFriendRequest("req1");
      });

      expect(apiService.acceptFriendRequest).toHaveBeenCalledWith("req1");
      
      // Now the state should correctly reflect the refetched (empty) data
      await waitFor(() => {
        expect(result.current.friendRequests).toHaveLength(0);
      });
    });

    test('27. rejectFriendRequest: should call API and remove the request from state', async () => {
      (apiService.rejectFriendRequest as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the initial friend request to load into state
      await waitFor(() => {
        expect(result.current.friendRequests).toHaveLength(1);
      });

      // UPDATE: Change the mock to return an empty array for the refetch
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);

      await act(async () => {
        await result.current.rejectFriendRequest("req1");
      });

      expect(apiService.rejectFriendRequest).toHaveBeenCalledWith("req1");
      
      await waitFor(() => {
        expect(result.current.friendRequests).toHaveLength(0);
      });
    });
  });

  describe('Direct Message Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup default authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Start with an empty DM list
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);

      // Default safe resolves for the rest
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('28. createDirectMessage: should call API and add the new DM to state', async () => {
      const mockNewDM = {
        id: "dm1",
        participants: ["u1", "u2"],
        last_message_time: new Date().toISOString(),
        other_user_id: "u2",
        username: "dm_friend"
      };
      
      mockApi.createDirectMessage.mockResolvedValue(mockNewDM as any);

      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for initial context load
      await waitFor(() => {
        expect(result.current.directMessages).toHaveLength(0);
      });

      await act(async () => {
        await result.current.createDirectMessage("u2");
      });

      expect(apiService.createDirectMessage).toHaveBeenCalledWith("u2");
      
      // Verify the new direct message was added to the state
      await waitFor(() => {
        expect(result.current.directMessages).toHaveLength(1);
        expect(result.current.directMessages[0]).toMatchObject({
          id: "dm1",
          participants: ["u1", "u2"]
        });
      });
    });
  });

  describe('User Profile Functions', () => {
    beforeEach(() => {
      // Setup authenticated state using snake_case backend formatting
      mockApi.isAuthenticated.mockReturnValue(true);
      mockApi.getCurrentUser.mockResolvedValue(
        createAuthResponse({
          id: "u1",
          username: "test_user",
          status: "online",
          display_name: "Original Name",
          avatar: "original.png",
        })
      );

      // Default safe resolves for the rest
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('29. updateUserStatus: should update the current user status in state', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the hook to finish initializing
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.updateUserStatus("dnd");
      });

      // Verify the background API call was made
      expect(mockApi.updateStatus).toHaveBeenCalledWith("dnd");

      // Verify the local state reflects the new status synchronously
      await waitFor(() => {
        expect(result.current.currentUser).toMatchObject({ status: "dnd" });
      });
    });

    test('30. updateUserProfile: should update the user profile fields in state', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the hook to finish initializing
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.updateUserProfile("New Display Name", "new-avatar.png");
      });

      // Verify the local state reflects the new profile info mapping
      await waitFor(() => {
        expect(result.current.currentUser).toMatchObject({
          displayName: "New Display Name",
          avatar: "new-avatar.png"
        });
      });
    });
  });

  describe('Read State Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Provide some initial servers and channels
      (apiService.getServers as jest.Mock).mockResolvedValue([{ id: "s1", name: "Test Server" }]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([{ id: "c1", server_id: "s1", name: "general" }]);

      // Default safe resolves for the rest
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriends as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('31. markAsRead: should update the read state for a specific channel or DM', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the hook to finish initializing
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.markAsRead("c1", undefined);
      });

      // Verify the synchronous effect: unread count should be 0 after marking as read
      expect(result.current.getUnreadCount("c1")).toBe(0);
      expect(result.current.getUnreadMessages("c1")).toHaveLength(0);

      // NOTE: If your context triggers a background API call to save the read state, 
      // uncomment and adjust this to match your API service's signature:
      // expect((apiService as any).markAsRead).toHaveBeenCalledWith("c1", undefined);
    });

    test('32. getUnreadCount: should return a numerical count of unread messages', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let count;
      act(() => {
        count = result.current.getUnreadCount("c1");
      });

      // Verify it successfully calculates and returns a number
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('33. getUnreadMessages: should return an array of unread message objects', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unreadMessages;
      act(() => {
        unreadMessages = result.current.getUnreadMessages("c1");
      });

      // Verify it successfully filters and returns an array
      expect(Array.isArray(unreadMessages)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Setup default authenticated state
      (apiService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: { id: "u1", username: "test_user" } }
      });

      // Provide an initial friends list
      const initialFriends = [
        { id: "f1", username: "friend_one", status: "online" }
      ];
      (apiService.getFriends as jest.Mock).mockResolvedValue(initialFriends);

      // Default safe resolves for the rest
      (apiService.getServers as jest.Mock).mockResolvedValue([]);
      (apiService.getChannels as jest.Mock).mockResolvedValue([]);
      (apiService.getDirectMessages as jest.Mock).mockResolvedValue([]);
      (apiService.getFriendRequests as jest.Mock).mockResolvedValue([]);
      (apiService.getPendingInvites as jest.Mock).mockResolvedValue([]);
    });

    test('34. getFriends: should return an array of friend User objects', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // Wait for the hook to finish initializing
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Wait for the internal state to hydrate with the mocked API data
      await waitFor(() => {
        expect(result.current.getFriends()).toHaveLength(1);
      });

      let friendsList;
      act(() => {
        friendsList = result.current.getFriends();
      });

      // Verify it returns the array of mapped friends
      expect(Array.isArray(friendsList)).toBe(true);
      expect(friendsList).toHaveLength(1);
      expect(friendsList[0]).toMatchObject({
        id: "f1",
        username: "friend_one"
      });
    });

    test('35. removeFriend: should remove the friend from local state', async () => {
      mockApi.getFriends.mockResolvedValue([
        { id: "u2", username: "remove_me", status: "online" }
      ]);
      mockApi.removeFriend.mockResolvedValue({ removedUserId: "u2" } as any);

      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.getFriends()).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeFriend("u2");
      });

      expect(apiService.removeFriend).toHaveBeenCalledWith("u2");
      expect(result.current.getFriends()).toHaveLength(0);
    });

    test('36. setReplyingTo: should update the replyingTo state with a message or null', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockMessage = {
        id: "m1",
        content: "This is a message to reply to",
        userId: "u2",
        channelId: "c1",
        createdAt: new Date()
      };

      // Set a message to reply to
      act(() => {
        // Casting as any just to bypass strict TS checking on partial mock objects
        result.current.setReplyingTo(mockMessage as any);
      });

      // Verify the state is updated
      // Note: Adjust 'replyingTo' if your context exposes this under a different name (e.g., 'replyingToMessage')
      expect(result.current.replyingTo).toMatchObject({
        id: "m1",
        content: "This is a message to reply to"
      });

      // Clear the reply state
      act(() => {
        result.current.setReplyingTo(null);
      });

      // Verify the state is cleared
      expect(result.current.replyingTo).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
  });
});
