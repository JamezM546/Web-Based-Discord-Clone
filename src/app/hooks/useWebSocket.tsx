import { useEffect, useRef, useState, useCallback } from 'react';
import { buildWsUrl, WSIncomingEvent, MessageEvent, TypingEvent, ReactionEvent } from '../services/websocketService';

export function useWebSocket(handlers: {
  onMessageCreate?: (ev: MessageEvent) => void,
  onMessageUpdate?: (ev: MessageEvent) => void,
  onMessageDelete?: (ev: MessageEvent) => void,
  onUserTyping?: (ev: TypingEvent) => void,
  onUserStopTyping?: (ev: TypingEvent) => void,
  onReactionAdd?: (ev: ReactionEvent) => void,
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRooms = useRef<Set<string>>(new Set());
  const handlersRef = useRef(handlers); // Store handlers in ref to avoid reconnect loop

  // Update handlersRef whenever handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    try {
      const url = buildWsUrl();
      console.log('[WS] Connecting to', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        // re-join rooms
        joinedRooms.current.forEach(r => {
          console.log('[WS] Re-joining room', r);
          ws.send(JSON.stringify({ action: 'join', data: { roomId: r } }));
        });
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        // schedule reconnect
        if (reconnectTimeout.current) window.clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = window.setTimeout(() => connect(), 2000);
      };

      ws.onerror = () => {
        console.error('[WS] Error');
        // let onclose handle reconnect
      };

      ws.onmessage = (ev) => {
        console.log('[WS] Message:', ev.data);
        try {
          const payload: WSIncomingEvent = JSON.parse(ev.data);
          if (!payload || !payload.type) return;
          const h = handlersRef.current;
          if (payload.type.startsWith('message:')) {
            if (payload.type === 'message:create' && h.onMessageCreate) h.onMessageCreate(payload as MessageEvent);
            if (payload.type === 'message:update' && h.onMessageUpdate) h.onMessageUpdate(payload as MessageEvent);
            if (payload.type === 'message:delete' && h.onMessageDelete) h.onMessageDelete(payload as MessageEvent);
          } else if (payload.type.startsWith('typing:')) {
            if (payload.type === 'typing:start' && h.onUserTyping) h.onUserTyping(payload as TypingEvent);
            if (payload.type === 'typing:stop' && h.onUserStopTyping) h.onUserStopTyping(payload as TypingEvent);
          } else if (payload.type.startsWith('reaction:')) {
            if (payload.type === 'reaction:add' && h.onReactionAdd) h.onReactionAdd(payload as ReactionEvent);
            // reaction:remove could be handled similarly
          }
        } catch (err) {
          console.warn('Invalid WS message', err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WS', err);
      if (reconnectTimeout.current) window.clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = window.setTimeout(() => connect(), 3000);
    }
  }, []); // Empty dependency array - no reconnect on handlers change

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) window.clearTimeout(reconnectTimeout.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendAction = useCallback((action: string, data: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action, data }));
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    console.log('[WS] Joining room', roomId);
    joinedRooms.current.add(roomId);
    sendAction('join', { roomId });
  }, [sendAction]);

  const leaveRoom = useCallback((roomId: string) => {
    joinedRooms.current.delete(roomId);
    sendAction('leave', { roomId });
  }, [sendAction]);

  const startTyping = useCallback((roomId: string) => sendAction('typing:start', { roomId }), [sendAction]);
  const stopTyping = useCallback((roomId: string) => sendAction('typing:stop', { roomId }), [sendAction]);

  const addReaction = useCallback((messageId: string, emoji: string) => sendAction('reaction:add', { messageId, emoji }), [sendAction]);
  const removeReaction = useCallback((messageId: string, emoji: string) => sendAction('reaction:remove', { messageId, emoji }), [sendAction]);

  return { isConnected, joinRoom, leaveRoom, startTyping, stopTyping, addReaction, removeReaction };
}
