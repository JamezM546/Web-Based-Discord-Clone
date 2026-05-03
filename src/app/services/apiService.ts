const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = rawApiBase.replace(/\/api\/?$/, '');

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
  token: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
  token: string;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: any[];
  channels?: any[];
}

export interface Channel {
  id: string;
  name: string;
  serverId: string;
  type?: string;
  position?: number;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
}

class HttpResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpResponseError';
  }
}


class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('jwtToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('jwtToken', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('jwtToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new HttpResponseError(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (!(error instanceof HttpResponseError)) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async getCurrentUser(): Promise<any> {
    return this.request<any>('/api/auth/me');
  }

  async testProtected(): Promise<any> {
    return this.request<any>('/api/auth/test-protected');
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health');
  }

  // API info
  async getApiInfo(): Promise<any> {
    return this.request<any>('/api');
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Logout method
  logout() {
    this.clearToken();
  }

  async logoutFromServer(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Server Management Methods
  async createServer(name: string, icon?: string): Promise<Server> {
    const response = await this.request<Server>('/api/servers', {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    });
    return response.data!;
  }

  async getServers(): Promise<Server[]> {
    const response = await this.request<{ servers: Server[] }>('/api/servers');
    return response.data?.servers || [];
  }

  async getServer(serverId: string): Promise<Server> {
    const response = await this.request<{ server: Server }>(`/api/servers/${serverId}`);
    return response.data!.server;
  }

  async updateServer(serverId: string, updates: { name?: string; icon?: string }): Promise<Server> {
    const response = await this.request<Server>(`/api/servers/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.request(`/api/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  async leaveServer(serverId: string): Promise<void> {
    await this.request(`/api/servers/${serverId}/leave`, {
      method: 'POST',
    });
  }

  // Channel Management Methods
  async createChannel(serverId: string, name: string): Promise<Channel> {
    const response = await this.request<Channel>('/api/channels', {
      method: 'POST',
      body: JSON.stringify({ name, serverId }),
    });
    return response.data!;
  }

  async getChannels(serverId: string): Promise<Channel[]> {
    const response = await this.request<{ channels: Channel[] }>(`/api/channels/server/${serverId}`);
    return response.data?.channels || [];
  }

  async getChannel(channelId: string, limit?: number): Promise<Channel> {
    const url = limit ? `/api/channels/${channelId}?limit=${limit}` : `/api/channels/${channelId}`;
    const response = await this.request<{ channel: Channel }>(url);
    return response.data!.channel;
  }

  async updateChannel(channelId: string, updates: { name?: string; position?: number }): Promise<Channel> {
    const response = await this.request<Channel>(`/api/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async deleteChannel(channelId: string): Promise<void> {
    await this.request(`/api/channels/${channelId}`, {
      method: 'DELETE',
    });
  }

  // Message Methods
  async getChannelMessages(
    channelId: string,
    options?: { limit?: number; before?: string }
  ): Promise<any[]> {
    const limit = options?.limit ?? 50;
    const before = options?.before;
    const url = before
      ? `/api/messages/channels/${channelId}?limit=${limit}&before=${encodeURIComponent(before)}`
      : `/api/messages/channels/${channelId}?limit=${limit}`;

    const response = await this.request<{ messages: any[] }>(url);
    return response.data?.messages || [];
  }

  async getDmMessages(
    dmId: string,
    options?: { limit?: number; before?: string }
  ): Promise<any[]> {
    const limit = options?.limit ?? 50;
    const before = options?.before;
    const url = before
      ? `/api/messages/dm/${dmId}?limit=${limit}&before=${encodeURIComponent(before)}`
      : `/api/messages/dm/${dmId}?limit=${limit}`;

    const response = await this.request<{ messages: any[] }>(url);
    return response.data?.messages || [];
  }

  async createMessage(payload: {
    content: string;
    channelId?: string;
    dmId?: string;
    replyToId?: string;
    serverInviteId?: string;
  }): Promise<any> {
    const response = await this.request<{ message: any }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: payload.content,
        channelId: payload.channelId,
        dmId: payload.dmId,
        replyToId: payload.replyToId,
        serverInviteId: payload.serverInviteId,
      }),
    });

    return response.data?.message;
  }

  async editMessage(messageId: string, content: string): Promise<any> {
    const response = await this.request<{ message: any }>(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data?.message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async toggleReaction(messageId: string, emoji: string): Promise<{ reactions: any[] }> {
    const response = await this.request<{ messageId: string; reactions: any[]; added: boolean }>(
      `/api/messages/${messageId}/reactions/toggle`,
      {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }
    );

    return { reactions: response.data?.reactions || [] };
  }

  // Direct Message Methods
  async getDirectMessages(): Promise<any[]> {
    const response = await this.request<{ directMessages: any[] }>('/api/direct-messages', {
      method: 'GET',
    });
    return response.data?.directMessages || [];
  }

  async createDirectMessage(userId: string): Promise<any> {
    const response = await this.request<{ directMessage: any }>('/api/direct-messages', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response.data?.directMessage;
  }

  // Summary endpoints

  async getManualSummary(payload: {
    channelId?: string;
    dmId?: string;
    hours?: number;
    maxMessages?: number;
  }): Promise<any> {
    const body: Record<string, any> = {};
    if (payload.channelId) body.channelId = payload.channelId;
    if (payload.dmId) body.dmId = payload.dmId;
    if (payload.hours) body.hours = payload.hours;
    if (payload.maxMessages) body.maxMessages = payload.maxMessages;

    const response = await this.request<any>('/api/summaries/manual', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.data?.summary;
  }

  async getPreviewSummary(params: {
    channelId?: string;
    dmId?: string;
    since?: string;
  }): Promise<any> {
    const qs = new URLSearchParams();
    if (params.channelId) qs.set('channelId', params.channelId);
    if (params.dmId) qs.set('dmId', params.dmId);
    if (params.since) qs.set('since', params.since);

    const response = await this.request<any>(`/api/summaries/preview?${qs.toString()}`);
    return response.data?.preview;
  }

  // User endpoints

  async searchUsers(query: string, limit?: number): Promise<any[]> {
    const qs = new URLSearchParams({ q: query });
    if (limit) qs.set('limit', String(limit));
    const response = await this.request<{ users: any[] }>(`/api/users/search?${qs.toString()}`);
    return response.data?.users || [];
  }

  async getUserProfile(): Promise<any> {
    const response = await this.request<{ user: any }>('/api/users/me');
    return response.data?.user;
  }

  async updateProfile(updates: { displayName?: string; avatar?: string }): Promise<any> {
    const response = await this.request<{ user: any }>('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data?.user;
  }

  async updateStatus(status: string): Promise<any> {
    const response = await this.request<{ user: any }>('/api/users/me/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data?.user;
  }

  // Friend endpoints

  async getFriends(): Promise<any[]> {
    const response = await this.request<{ friends: any[] }>('/api/friends');
    return response.data?.friends || [];
  }

  async getFriendRequests(): Promise<any[]> {
    const response = await this.request<{ requests: any[] }>('/api/friends/requests');
    return response.data?.requests || [];
  }

  async sendFriendRequest(toUserId: string): Promise<any> {
    const response = await this.request<{ request: any }>('/api/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    });
    return response.data?.request;
  }

  async acceptFriendRequest(requestId: string): Promise<any> {
    const response = await this.request<{ request: any }>(
      `/api/friends/requests/${requestId}/accept`,
      { method: 'POST' }
    );
    return response.data?.request;
  }

  async rejectFriendRequest(requestId: string): Promise<any> {
    const response = await this.request<{ request: any }>(
      `/api/friends/requests/${requestId}/reject`,
      { method: 'POST' }
    );
    return response.data?.request;
  }

  // Server invite endpoints

  async getPendingInvites(): Promise<any[]> {
    const response = await this.request<{ invites: any[] }>('/api/invites/pending');
    return response.data?.invites || [];
  }

  async sendServerInvite(serverId: string, toUserId: string): Promise<any> {
    const response = await this.request<{ invite: any }>('/api/invites', {
      method: 'POST',
      body: JSON.stringify({ serverId, toUserId }),
    });
    return response.data?.invite;
  }

  async acceptServerInvite(inviteId: string): Promise<void> {
    await this.request(`/api/invites/${inviteId}/accept`, { method: 'POST' });
  }

  async declineServerInvite(inviteId: string): Promise<void> {
    await this.request(`/api/invites/${inviteId}/decline`, { method: 'POST' });
  }

  // Server detail / members

  async getServerDetails(serverId: string): Promise<any> {
    const response = await this.request<{ server: any }>(`/api/servers/${serverId}`);
    return response.data?.server;
  }

  // Server search endpoint

  async searchServers(query: string, limit?: number): Promise<any[]> {
    const qs = new URLSearchParams({ q: query });
    if (limit) qs.set('limit', String(limit));

    const response = await this.request<{ servers: any[] }>(
      `/api/servers/search?${qs.toString()}`
    );
    return response.data?.servers || [];
  }

  // Read state sync — fire-and-forget; errors are logged but do not throw
  async syncReadState(params: { channelId?: string; dmId?: string }): Promise<void> {
    try {
      await this.request('/api/read-state', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.warn('[syncReadState] Failed to sync read state to backend:', err);
    }
  }
}

export const apiService = new ApiService();
