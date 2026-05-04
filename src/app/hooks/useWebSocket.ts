import { useEffect } from 'react';
import { RealtimeEnvelope, websocketService } from '../services/websocketService';

export const useWebSocket = (listener: (event: RealtimeEnvelope) => void) => {
  useEffect(() => websocketService.subscribe(listener), [listener]);

  return websocketService;
};
