const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const defaultWsUrl = rawApiBase.replace(/^http/i, 'ws').replace(/\/api\/?$/, '');
const WS_URL = (import.meta.env.VITE_WS_URL || `${defaultWsUrl}/ws`).replace(/\/$/, '');

export interface RealtimeEnvelope<T = any> {
  type: string;
  data: T;
}

type RealtimeListener = (event: RealtimeEnvelope) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private listeners = new Set<RealtimeListener>();
  private shouldReconnect = false;
  private reconnectTimer: number | null = null;
  private reconnectDelayMs = 1500;
  private authenticated = false;
  private activeRoomId: string | null = null;
  private serverRoomId: string | null = null;
  private queuedActions: Array<{ action: string; data?: Record<string, unknown> }> = [];

  connect(token: string) {
    this.token = token;
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.sendAuth();
      }
      return;
    }

    this.openSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.authenticated = false;
    this.activeRoomId = null;
    this.serverRoomId = null;
    this.queuedActions = [];

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(listener: RealtimeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setActiveRoom(roomId: string | null) {
    const previousRoomId = this.activeRoomId;
    if (previousRoomId && previousRoomId !== roomId) {
      this.sendAction('leaveRoom', { roomId: previousRoomId });
    }

    this.activeRoomId = roomId;
    if (roomId) {
      this.sendAction('joinRoom', { roomId });
    }
  }

  setServerRoom(roomId: string | null) {
    const previousRoomId = this.serverRoomId;
    if (previousRoomId && previousRoomId !== roomId) {
      this.sendAction('leaveRoom', { roomId: previousRoomId });
    }

    this.serverRoomId = roomId;
    if (roomId) {
      this.sendAction('joinRoom', { roomId });
    }
  }

  sendTypingStart(roomId: string) {
    this.sendAction('typingStart', { roomId });
  }

  sendTypingStop(roomId: string) {
    this.sendAction('typingStop', { roomId });
  }

  private openSocket() {
    this.socket = new WebSocket(WS_URL);

    this.socket.addEventListener('open', () => {
      this.authenticated = false;
      this.sendAuth();
    });

    this.socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as RealtimeEnvelope;
      if (payload.type === 'authSuccess') {
        this.authenticated = true;
        this.flushQueuedActions();
        if (this.activeRoomId) {
          this.sendAction('joinRoom', { roomId: this.activeRoomId });
        }
        if (this.serverRoomId) {
          this.sendAction('joinRoom', { roomId: this.serverRoomId });
        }
      }

      this.listeners.forEach((listener) => listener(payload));
    });

    this.socket.addEventListener('close', () => {
      this.authenticated = false;
      this.socket = null;

      if (this.shouldReconnect) {
        this.reconnectTimer = window.setTimeout(() => this.openSocket(), this.reconnectDelayMs);
      }
    });
  }

  private sendAuth() {
    if (!this.token) return;
    this.sendRaw({
      action: 'auth',
      data: { token: this.token },
    });
  }

  private sendAction(action: string, data?: Record<string, unknown>) {
    const payload = { action, data };
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || (!this.authenticated && action !== 'auth')) {
      this.queuedActions.push(payload);
      return;
    }

    this.sendRaw(payload);
  }

  private flushQueuedActions() {
    const queued = [...this.queuedActions];
    this.queuedActions = [];
    queued.forEach((payload) => {
      this.sendAction(payload.action, payload.data);
    });
  }

  private sendRaw(payload: { action: string; data?: Record<string, unknown> }) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }
}

export const websocketService = new WebSocketService();
