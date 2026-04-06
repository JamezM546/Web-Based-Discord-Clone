import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const BASE = 'http://localhost:3001';

function createStorage(store: Map<string, string>): Storage {
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
    get length() {
      return store.size;
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  } as Storage;
}

function jsonRes<T>(body: T, ok = true, status?: number): Response {
  const s = status ?? (ok ? 200 : 400);
  return {
    ok,
    status: s,
    json: () => Promise.resolve(body),
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
let apiService: Awaited<ReturnType<typeof loadModule>>['apiService'];

async function loadModule() {
  return import('../app/services/apiService');
}

async function setup(initialStore?: Map<string, string>) {
  vi.resetModules();
  const store = initialStore ?? new Map<string, string>();
  vi.stubGlobal('localStorage', createStorage(store));
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const mod = await loadModule();
  apiService = mod.apiService;
}

beforeEach(async () => {
  await setup();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ApiService', () => {
  describe('constructor', () => {
    it('reads jwtToken from localStorage on module load', async () => {
      await setup(new Map([['jwtToken', 'preloaded']]));
      expect(apiService.getToken()).toBe('preloaded');
    });
  });

  describe('setToken, getToken, clearToken', () => {
    it('setToken updates memory and localStorage', async () => {
      await setup();
      apiService.setToken('abc');
      expect(apiService.getToken()).toBe('abc');
      expect(localStorage.getItem('jwtToken')).toBe('abc');
    });

    it('clearToken removes token from memory and localStorage', async () => {
      await setup();
      apiService.setToken('x');
      apiService.clearToken();
      expect(apiService.getToken()).toBeNull();
      expect(localStorage.getItem('jwtToken')).toBeNull();
    });
  });

  describe('request (via fetch)', () => {
    it('adds Authorization when token is set', async () => {
      await setup();
      apiService.setToken('tok');
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, message: 'ok', data: {} }));
      await apiService.getCurrentUser();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/auth/me`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('does not add Authorization when logged out', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, message: 'ok', data: {} }));
      await apiService.healthCheck();
      const [, init] = fetchMock.mock.calls[0];
      expect((init!.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it('throws with server message when response is not ok', async () => {
      await setup();
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce(jsonRes({ message: 'Nope' }, false, 400));
      await expect(apiService.healthCheck()).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof Error &&
          e.name === 'HttpResponseError' &&
          (e as Error).message === 'Nope'
      );
      expect(errSpy).not.toHaveBeenCalled();
      errSpy.mockRestore();
    });

    it('throws Request failed when not ok and no message', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({}, false, 500));
      await expect(apiService.healthCheck()).rejects.toThrow('Request failed');
    });

    it('rethrows when fetch rejects and logs to console', async () => {
      await setup();
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const netErr = new Error('network down');
      fetchMock.mockRejectedValueOnce(netErr);
      await expect(apiService.healthCheck()).rejects.toThrow('network down');
      expect(errSpy).toHaveBeenCalledWith('API Error:', netErr);
      errSpy.mockRestore();
    });

    it('uses VITE_API_URL when set', async () => {
      vi.stubEnv('VITE_API_URL', 'http://custom:9000');
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, message: 'ok' }));
      await apiService.healthCheck();
      expect(fetchMock).toHaveBeenCalledWith(
        'http://custom:9000/health',
        expect.anything()
      );
    });
  });

  describe('login', () => {
    it('stores token and returns data on success with token', async () => {
      await setup();
      const loginData = {
        user: {
          id: '1',
          username: 'u',
          email: 'a@b.com',
          createdAt: 'd',
        },
        token: 'jwt-1',
      };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, message: 'ok', data: loginData })
      );
      const out = await apiService.login('a@b.com', 'secret');
      expect(out).toEqual(loginData);
      expect(apiService.getToken()).toBe('jwt-1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
        })
      );
    });

    it('does not set token when data has no token', async () => {
      await setup();
      const loginData = {
        user: {
          id: '1',
          username: 'u',
          email: 'a@b.com',
          createdAt: 'd',
        },
      };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, message: 'ok', data: loginData })
      );
      await apiService.login('a@b.com', 'secret');
      expect(apiService.getToken()).toBeNull();
    });

    it('does not set token when success is false even if data includes token', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({
          success: false,
          message: 'denied',
          data: {
            user: {
              id: '1',
              username: 'u',
              email: 'a@b.com',
              createdAt: 'd',
            },
            token: 'should-not-save',
          },
        })
      );
      await apiService.login('a@b.com', 'secret');
      expect(apiService.getToken()).toBeNull();
    });

    it('does not set token when success is true but body omits data (optional chaining on data.token)', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, message: 'ok' }));
      const out = await apiService.login('a@b.com', 'secret');
      expect(out).toBeUndefined();
      expect(apiService.getToken()).toBeNull();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
        })
      );
    });
  });

  describe('register', () => {
    it('stores token and returns data', async () => {
      await setup();
      const regData = {
        user: {
          id: '2',
          username: 'new',
          email: 'n@b.com',
          createdAt: 'd',
        },
        token: 'jwt-2',
      };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, message: 'created', data: regData })
      );
      const out = await apiService.register('new', 'n@b.com', 'pass1234');
      expect(out).toEqual(regData);
      expect(apiService.getToken()).toBe('jwt-2');
    });

    it('does not set token when success is false', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({
          success: false,
          message: 'bad',
          data: {
            user: {
              id: '2',
              username: 'new',
              email: 'n@b.com',
              createdAt: 'd',
            },
            token: 'x',
          },
        })
      );
      await apiService.register('new', 'n@b.com', 'pass1234');
      expect(apiService.getToken()).toBeNull();
    });

    it('sends register payload and does not set token when body omits data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, message: 'ok' }));
      const out = await apiService.register('u', 'a@b.com', 'p');
      expect(out).toBeUndefined();
      expect(apiService.getToken()).toBeNull();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'u',
            email: 'a@b.com',
            password: 'p',
          }),
        })
      );
    });
  });

  describe('getCurrentUser, testProtected, healthCheck, getApiInfo', () => {
    it('getCurrentUser returns full ApiResponse body', async () => {
      await setup();
      const body = { success: true, message: 'ok', data: { user: { id: '1' } } };
      fetchMock.mockResolvedValueOnce(jsonRes(body));
      const out = await apiService.getCurrentUser();
      expect(out).toEqual(body);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/auth/me`, expect.anything());
    });

    it('testProtected returns full ApiResponse body', async () => {
      await setup();
      const body = { success: true, message: 'ok', data: {} };
      fetchMock.mockResolvedValueOnce(jsonRes(body));
      const out = await apiService.testProtected();
      expect(out).toEqual(body);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/auth/test-protected`,
        expect.anything()
      );
    });

    it('healthCheck returns full ApiResponse body', async () => {
      await setup();
      const body = { success: true, message: 'ok' };
      fetchMock.mockResolvedValueOnce(jsonRes(body));
      const out = await apiService.healthCheck();
      expect(out).toEqual(body);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/health`, expect.anything());
    });

    it('getApiInfo returns full ApiResponse body', async () => {
      await setup();
      const body = { success: true, message: 'ok', data: { version: '1' } };
      fetchMock.mockResolvedValueOnce(jsonRes(body));
      const out = await apiService.getApiInfo();
      expect(out).toEqual(body);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api`, expect.anything());
    });
  });

  describe('isAuthenticated and logout', () => {
    it('isAuthenticated is false when no token', async () => {
      await setup();
      expect(apiService.isAuthenticated()).toBe(false);
    });

    it('isAuthenticated is true after setToken', async () => {
      await setup();
      apiService.setToken('t');
      expect(apiService.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated is false after clearToken', async () => {
      await setup();
      apiService.setToken('t');
      apiService.clearToken();
      expect(apiService.isAuthenticated()).toBe(false);
    });

    it('logout clears token like clearToken', async () => {
      await setup();
      apiService.setToken('t');
      apiService.logout();
      expect(apiService.getToken()).toBeNull();
    });
  });

  describe('servers', () => {
    it('createServer', async () => {
      await setup();
      const server = { id: 's1', name: 'S' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: server })
      );
      const out = await apiService.createServer('S', '📁');
      expect(out).toEqual(server);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/servers`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'S', icon: '📁' }),
        })
      );
    });

    it('getServers returns servers array when present', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { servers: [{ id: '1' }] } })
      );
      expect(await apiService.getServers()).toEqual([{ id: '1' }]);
    });

    it('getServers returns empty array when data omits servers', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.getServers()).toEqual([]);
    });

    it('getServers returns empty array when servers is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { servers: undefined } })
      );
      expect(await apiService.getServers()).toEqual([]);
    });

    it('getServer returns nested server', async () => {
      await setup();
      const server = { id: 's1', name: 'S' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { server } })
      );
      expect(await apiService.getServer('s1')).toEqual(server);
    });

    it('updateServer', async () => {
      await setup();
      const server = { id: 's1', name: 'New' };
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: server }));
      const out = await apiService.updateServer('s1', { name: 'New' });
      expect(out).toEqual(server);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/servers/s1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'New' }),
        })
      );
    });

    it('deleteServer', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true }));
      await apiService.deleteServer('s1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/servers/s1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('getServerDetails', async () => {
      await setup();
      const server = { id: 's1', members: [] };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { server } })
      );
      expect(await apiService.getServerDetails('s1')).toEqual(server);
    });

    it('searchServers includes limit in query when provided', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { servers: [{ id: '1' }] } })
      );
      expect(await apiService.searchServers('foo', 5)).toEqual([{ id: '1' }]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/servers/search?q=foo&limit=5`,
        expect.anything()
      );
    });

    it('searchServers returns empty array when servers is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { servers: undefined } })
      );
      expect(await apiService.searchServers('foo')).toEqual([]);
    });
  });

  describe('channels', () => {
    it('createChannel', async () => {
      await setup();
      const ch = { id: 'c1', name: 'general', serverId: 's1' };
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: ch }));
      expect(await apiService.createChannel('s1', 'general')).toEqual(ch);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/channels`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'general', serverId: 's1' }),
        })
      );
    });

    it('getChannels returns empty array when channels is empty', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { channels: [] } })
      );
      expect(await apiService.getChannels('s1')).toEqual([]);
    });

    it('getChannels returns empty array when channels is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { channels: undefined } })
      );
      expect(await apiService.getChannels('s1')).toEqual([]);
    });

    it('getChannel without limit', async () => {
      await setup();
      const ch = { id: 'c1', name: 'g', serverId: 's1' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { channel: ch } })
      );
      expect(await apiService.getChannel('c1')).toEqual(ch);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/channels/c1`, expect.anything());
    });

    it('getChannel with limit', async () => {
      await setup();
      const ch = { id: 'c1', name: 'g', serverId: 's1' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { channel: ch } })
      );
      await apiService.getChannel('c1', 10);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/channels/c1?limit=10`,
        expect.anything()
      );
    });

    it('updateChannel', async () => {
      await setup();
      const ch = { id: 'c1', name: 'x', serverId: 's1' };
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: ch }));
      expect(await apiService.updateChannel('c1', { name: 'x' })).toEqual(ch);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/channels/c1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'x' }),
        })
      );
    });

    it('deleteChannel', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true }));
      await apiService.deleteChannel('c1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/channels/c1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('messages', () => {
    it('getChannelMessages uses default limit and returns messages', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: [{ id: 'm1' }] } })
      );
      expect(await apiService.getChannelMessages('c1')).toEqual([{ id: 'm1' }]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/channels/c1?limit=50`,
        expect.anything()
      );
    });

    it('getChannelMessages returns empty array when messages is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: undefined } })
      );
      expect(await apiService.getChannelMessages('c1')).toEqual([]);
    });

    it('getChannelMessages with before cursor', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: { messages: [] } }));
      await apiService.getChannelMessages('c1', { limit: 10, before: 't0' });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/channels/c1?limit=10&before=${encodeURIComponent('t0')}`,
        expect.anything()
      );
    });

    it('getChannelMessages with custom limit and no before', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: [] } })
      );
      await apiService.getChannelMessages('c1', { limit: 25 });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/channels/c1?limit=25`,
        expect.anything()
      );
    });

    it('getDmMessages includes before in URL when provided', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: [] } })
      );
      await apiService.getDmMessages('dm1', { before: 'x' });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/dm/dm1?limit=50&before=${encodeURIComponent('x')}`,
        expect.anything()
      );
    });

    it('getDmMessages returns empty array when messages is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: undefined } })
      );
      expect(await apiService.getDmMessages('dm1')).toEqual([]);
    });

    it('getDmMessages without before uses limit-only URL', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { messages: [] } })
      );
      await apiService.getDmMessages('dm1', { limit: 20 });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/dm/dm1?limit=20`,
        expect.anything()
      );
    });

    it('createMessage returns message from data', async () => {
      await setup();
      const msg = { id: 'm1', content: 'hi' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { message: msg } })
      );
      expect(
        await apiService.createMessage({
          content: 'hi',
          channelId: 'c1',
          replyToId: 'r1',
        })
      ).toEqual(msg);
    });

    it('createMessage returns undefined when message is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(
        await apiService.createMessage({ content: 'x', channelId: 'c1' })
      ).toBeUndefined();
    });

    it('editMessage returns message from data', async () => {
      await setup();
      const msg = { id: 'm1', content: 'x' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { message: msg } })
      );
      expect(await apiService.editMessage('m1', 'x')).toEqual(msg);
    });

    it('editMessage returns undefined when message is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.editMessage('m1', 'x')).toBeUndefined();
    });

    it('deleteMessage', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true }));
      await apiService.deleteMessage('m1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/m1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('toggleReaction returns reactions from data', async () => {
      await setup();
      const reactions = [{ emoji: '👍' }];
      fetchMock.mockResolvedValueOnce(
        jsonRes({
          success: true,
          data: { messageId: 'm1', reactions, added: true },
        })
      );
      expect(await apiService.toggleReaction('m1', '👍')).toEqual({ reactions });
    });

    it('toggleReaction falls back to empty reactions', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.toggleReaction('m1', '👍')).toEqual({ reactions: [] });
    });
  });

  describe('direct messages', () => {
    it('getDirectMessages returns list when present', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { directMessages: [{ id: 'd1' }] } })
      );
      expect(await apiService.getDirectMessages()).toEqual([{ id: 'd1' }]);
    });

    it('getDirectMessages returns empty array when directMessages is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { directMessages: undefined } })
      );
      expect(await apiService.getDirectMessages()).toEqual([]);
    });

    it('createDirectMessage returns directMessage from data', async () => {
      await setup();
      const dm = { id: 'd1', participants: ['1', '2'] };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { directMessage: dm } })
      );
      expect(await apiService.createDirectMessage('2')).toEqual(dm);
    });

    it('createDirectMessage returns undefined when directMessage is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.createDirectMessage('2')).toBeUndefined();
    });
  });

  describe('summaries', () => {
    it('getManualSummary returns summary from data', async () => {
      await setup();
      const summary = { overview: 'x' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { summary } })
      );
      expect(
        await apiService.getManualSummary({ channelId: 'c1', hours: 2 })
      ).toEqual(summary);
    });

    it('getManualSummary returns undefined when summary is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(
        await apiService.getManualSummary({ dmId: 'd1', maxMessages: 10 })
      ).toBeUndefined();
    });

    it('getPreviewSummary builds query for all params', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { preview: {} } })
      );
      await apiService.getPreviewSummary({
        channelId: 'c1',
        dmId: 'd1',
        since: '2020-01-01',
      });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('channelId=c1');
      expect(url).toContain('dmId=d1');
      expect(url).toContain('since=2020-01-01');
    });

    it('getPreviewSummary with empty params', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { preview: null } })
      );
      await apiService.getPreviewSummary({});
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/summaries/preview?`,
        expect.anything()
      );
    });

    it('getPreviewSummary with only dmId', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { preview: {} } })
      );
      await apiService.getPreviewSummary({ dmId: 'd1' });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/summaries/preview?dmId=d1`,
        expect.anything()
      );
    });
  });

  describe('users', () => {
    it('searchUsers includes limit in query when provided', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { users: [{ id: '1' }] } })
      );
      expect(await apiService.searchUsers('a', 3)).toEqual([{ id: '1' }]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/users/search?q=a&limit=3`,
        expect.anything()
      );
    });

    it('searchUsers returns empty array when users is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { users: undefined } })
      );
      expect(await apiService.searchUsers('a')).toEqual([]);
    });

    it('getUserProfile returns user from data', async () => {
      await setup();
      const user = { id: '1', username: 'u' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { user } })
      );
      expect(await apiService.getUserProfile()).toEqual(user);
    });

    it('getUserProfile returns undefined when user is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.getUserProfile()).toBeUndefined();
    });

    it('updateProfile returns user from data', async () => {
      await setup();
      const user = { id: '1', displayName: 'D' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { user } })
      );
      expect(await apiService.updateProfile({ displayName: 'D' })).toEqual(user);
    });

    it('updateProfile returns undefined when user is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.updateProfile({})).toBeUndefined();
    });

    it('updateStatus returns user from data', async () => {
      await setup();
      const user = { id: '1', status: 'away' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { user } })
      );
      expect(await apiService.updateStatus('away')).toEqual(user);
    });

    it('updateStatus returns undefined when user is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.updateStatus('online')).toBeUndefined();
    });
  });

  describe('friends', () => {
    it('getFriends returns empty array when friends is empty', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { friends: [] } })
      );
      expect(await apiService.getFriends()).toEqual([]);
    });

    it('getFriends returns empty array when friends is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { friends: undefined } })
      );
      expect(await apiService.getFriends()).toEqual([]);
    });

    it('getFriendRequests returns requests array when empty', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { requests: [] } })
      );
      expect(await apiService.getFriendRequests()).toEqual([]);
    });

    it('getFriendRequests returns empty array when requests is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { requests: undefined } })
      );
      expect(await apiService.getFriendRequests()).toEqual([]);
    });

    it('sendFriendRequest returns request from data', async () => {
      await setup();
      const req = { id: 'r1' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { request: req } })
      );
      expect(await apiService.sendFriendRequest('u2')).toEqual(req);
    });

    it('sendFriendRequest returns undefined when request is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.sendFriendRequest('u2')).toBeUndefined();
    });

    it('acceptFriendRequest returns request from data', async () => {
      await setup();
      const req = { id: 'r1', status: 'accepted' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { request: req } })
      );
      expect(await apiService.acceptFriendRequest('r1')).toEqual(req);
    });

    it('acceptFriendRequest returns undefined when request is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.acceptFriendRequest('r1')).toBeUndefined();
    });

    it('rejectFriendRequest returns request from data', async () => {
      await setup();
      const req = { id: 'r1', status: 'rejected' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { request: req } })
      );
      expect(await apiService.rejectFriendRequest('r1')).toEqual(req);
    });

    it('rejectFriendRequest returns undefined when request is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.rejectFriendRequest('r1')).toBeUndefined();
    });
  });

  describe('invites', () => {
    it('getPendingInvites returns invites array when empty', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { invites: [] } })
      );
      expect(await apiService.getPendingInvites()).toEqual([]);
    });

    it('getPendingInvites returns empty array when invites is undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { invites: undefined } })
      );
      expect(await apiService.getPendingInvites()).toEqual([]);
    });

    it('sendServerInvite returns invite from data', async () => {
      await setup();
      const inv = { id: 'i1' };
      fetchMock.mockResolvedValueOnce(
        jsonRes({ success: true, data: { invite: inv } })
      );
      expect(await apiService.sendServerInvite('s1', 'u2')).toEqual(inv);
    });

    it('sendServerInvite returns undefined when invite is missing from data', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true, data: {} }));
      expect(await apiService.sendServerInvite('s1', 'u2')).toBeUndefined();
    });

    it('acceptServerInvite', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true }));
      await apiService.acceptServerInvite('i1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/invites/i1/accept`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('declineServerInvite', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes({ success: true }));
      await apiService.declineServerInvite('i1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/invites/i1/decline`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('when JSON body omits data (optional chaining / safe access)', () => {
    const noData = { success: true, message: 'ok' };

    it('getServers returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getServers()).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/servers`, expect.anything());
    });

    it('getFriends returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getFriends()).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/friends`, expect.anything());
    });

    it('getFriendRequests returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getFriendRequests()).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/friends/requests`,
        expect.anything()
      );
    });

    it('getPendingInvites returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getPendingInvites()).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/invites/pending`,
        expect.anything()
      );
    });

    it('searchUsers returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.searchUsers('q')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/users/search?q=q`,
        expect.anything()
      );
    });

    it('searchServers returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.searchServers('q')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/servers/search?q=q`,
        expect.anything()
      );
    });

    it('getChannels returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getChannels('s1')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/channels/server/s1`,
        expect.anything()
      );
    });

    it('getChannelMessages returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getChannelMessages('c1')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/channels/c1?limit=50`,
        expect.anything()
      );
    });

    it('getDmMessages returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getDmMessages('dm1')).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/dm/dm1?limit=50`,
        expect.anything()
      );
    });

    it('getDirectMessages returns empty array', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getDirectMessages()).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/direct-messages`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getUserProfile returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getUserProfile()).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/users/me`, expect.anything());
    });

    it('updateProfile returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.updateProfile({ displayName: 'x' })).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/users/me/profile`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ displayName: 'x' }),
        })
      );
    });

    it('updateStatus returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.updateStatus('online')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/users/me/status`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'online' }),
        })
      );
    });

    it('createMessage returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(
        await apiService.createMessage({ content: 'x', channelId: 'c1' })
      ).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            content: 'x',
            channelId: 'c1',
            dmId: undefined,
            replyToId: undefined,
            serverInviteId: undefined,
          }),
        })
      );
    });

    it('editMessage returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.editMessage('m1', 'x')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/m1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content: 'x' }),
        })
      );
    });

    it('createDirectMessage returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.createDirectMessage('u2')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/direct-messages`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'u2' }),
        })
      );
    });

    it('getManualSummary returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getManualSummary({ channelId: 'c1' })).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/summaries/manual`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ channelId: 'c1' }),
        })
      );
    });

    it('getPreviewSummary returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getPreviewSummary({ dmId: 'd1' })).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/summaries/preview?dmId=d1`,
        expect.anything()
      );
    });

    it('sendFriendRequest returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.sendFriendRequest('u2')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/friends/requests`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ toUserId: 'u2' }),
        })
      );
    });

    it('acceptFriendRequest returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.acceptFriendRequest('r1')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/friends/requests/r1/accept`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('rejectFriendRequest returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.rejectFriendRequest('r1')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/friends/requests/r1/reject`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sendServerInvite returns undefined', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.sendServerInvite('s1', 'u2')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/invites`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ serverId: 's1', toUserId: 'u2' }),
        })
      );
    });

    it('toggleReaction returns empty reactions', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.toggleReaction('m1', '👍')).toEqual({ reactions: [] });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/api/messages/m1/reactions/toggle`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ emoji: '👍' }),
        })
      );
    });

    it('getServerDetails returns undefined when data is missing', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      expect(await apiService.getServerDetails('s1')).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/servers/s1`, expect.anything());
    });

    it('getServer throws when data is missing (non-null assertion on nested server)', async () => {
      await setup();
      fetchMock.mockResolvedValueOnce(jsonRes(noData));
      await expect(apiService.getServer('s1')).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/servers/s1`, expect.anything());
    });
  });
});
