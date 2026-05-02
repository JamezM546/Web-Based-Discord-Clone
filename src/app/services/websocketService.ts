export type WsServerMessage =
  | { type: string; data?: Record<string, unknown> }
  | Record<string, unknown>;

type Listener = (msg: WsServerMessage) => void;

const MAX_BACKOFF_MS = 30_000;

function parseServerPayload(raw: string): WsServerMessage | null {
  try {
    return JSON.parse(raw) as WsServerMessage;
  } catch {
    return null;
  }
}

/**
 * Native WebSocket client for the API Gateway WebSocket API (`action`-framed payloads).
 * Repo doc: pair with `VITE_WS_URL` (wss://…) from `simple-server/serverless.yml` outputs.
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private token: string | null = null;
  private listeners = new Set<Listener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private manuallyClosed = false;
  private authenticated = false;
  /** Room we intend to be in; re-joined after reconnect/auth. */
  private activeRoomId: string | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(msg: WsServerMessage) {
    for (const fn of this.listeners) {
      try {
        fn(msg);
      } catch (e) {
        console.error('[websocketService] listener error', e);
      }
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  connect(baseUrl: string, jwt: string | null) {
    if (!baseUrl?.trim()) return;
    this.manuallyClosed = false;
    this.shouldReconnect = true;
    this.url = baseUrl.trim();
    this.token = jwt;
    this.authenticated = false;
    this.openSocket();
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.manuallyClosed || !this.url) return;
    this.clearReconnect();
    const exp = Math.min(MAX_BACKOFF_MS, 800 * 2 ** this.reconnectAttempt);
    const jitter = Math.floor(Math.random() * 400);
    const delay = exp + jitter;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private openSocket() {
    if (!this.url) return;
    this.clearReconnect();
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }

    const ws = new WebSocket(this.url);
    this.ws = ws;
    this.authenticated = false;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      if (import.meta.env.DEV) {
        console.info('[websocketService] socket open (app realtime, not Vite HMR):', this.url);
      }
      if (this.token) {
        this.sendRaw({ action: 'auth', data: { token: this.token } });
      } else {
        this.emit({ type: 'error', data: { code: 'NO_TOKEN', message: 'No JWT for WebSocket auth' } });
      }
    };

    ws.onmessage = async (ev) => {
      let raw: string;
      if (typeof ev.data === 'string') {
        raw = ev.data;
      } else if (ev.data instanceof Blob) {
        raw = await ev.data.text();
      } else if (ev.data instanceof ArrayBuffer) {
        raw = new TextDecoder().decode(ev.data);
      } else {
        raw = String(ev.data);
      }
      const msg = parseServerPayload(raw);
      if (!msg) {
        if (import.meta.env.DEV) {
          console.warn('[websocketService] non-JSON or empty server frame:', raw.slice(0, 300));
        }
        return;
      }
      const t = (msg as { type?: string }).type;
      if (t === 'authOk') {
        this.authenticated = true;
        if (this.activeRoomId) {
          this.sendRaw({ action: 'joinRoom', data: { roomId: this.activeRoomId } });
        }
      }
      if (t === 'error') {
        this.authenticated = false;
      }
      this.emit(msg);
    };

    ws.onerror = () => {
      if (import.meta.env.DEV) {
        console.warn('[websocketService] WebSocket error event (see onclose for code)');
      }
    };

    ws.onclose = (ev) => {
      if (import.meta.env.DEV) {
        console.info('[websocketService] socket closed', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
      }
      this.authenticated = false;
      this.ws = null;
      if (this.shouldReconnect && !this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Leave previous WebSocket room (if any) and join the next. Uses `channel:{id}` / `dm:{id}`.
   * Safe to call before the socket has finished authenticating — join is sent after `authOk`.
   */
  syncActiveRoom(roomId: string | null) {
    const prev = this.activeRoomId;
    this.activeRoomId = roomId;

    if (prev && prev !== roomId && this.isConnected() && this.authenticated) {
      this.sendRaw({ action: 'leaveRoom', data: { roomId: prev } });
    }

    if (roomId && this.isConnected() && this.authenticated) {
      this.sendRaw({ action: 'joinRoom', data: { roomId } });
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.manuallyClosed = true;
    this.clearReconnect();
    this.activeRoomId = null;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.authenticated = false;
  }

  sendRaw(payload: object) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  typingStart(roomId: string) {
    this.sendRaw({ action: 'typingStart', data: { roomId } });
  }

  typingStop(roomId: string) {
    this.sendRaw({ action: 'typingStop', data: { roomId } });
  }

  leaveRoom(roomId: string) {
    this.sendRaw({ action: 'leaveRoom', data: { roomId } });
  }
}

export const websocketService = new WebSocketService();
