import { useEffect } from 'react';
import { websocketService, WsServerMessage } from '../services/websocketService';

/**
 * Subscribes to parsed WebSocket server messages for the lifetime of the component.
 */
export function useWebSocket(handler: (msg: WsServerMessage) => void) {
  useEffect(() => {
    return websocketService.subscribe(handler);
  }, [handler]);
}
