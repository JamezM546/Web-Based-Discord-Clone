const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
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
}

export const apiService = new ApiService();
