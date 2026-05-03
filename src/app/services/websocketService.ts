export interface MessageEventPayload { roomId: string; message: any }
export interface TypingEventPayload { roomId: string; user?: { id: string; username: string; displayName?: string }; userId?: string }
export interface ReactionEventPayload { messageId: string; emoji: string; userId: string }

export type MessageEvent = { type: 'message:create' | 'message:update' | 'message:delete'; data: MessageEventPayload }
export type TypingEvent = { type: 'typing:start' | 'typing:stop'; data: TypingEventPayload }
export type ReactionEvent = { type: 'reaction:add' | 'reaction:remove'; data: ReactionEventPayload }

export type WSIncomingEvent = MessageEvent | TypingEvent | ReactionEvent | { type: string; data: any }

export function buildWsUrl() {
  const dev = (import.meta.env.VITE_DEV_WS_URL as string) || '';
  if (dev) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return `${dev.replace(/\/$/, '')}/?auth=${encodeURIComponent(token || '')}`;
  }
  const domain = (import.meta.env.VITE_WS_API_DOMAIN as string) || '';
  const stage = (import.meta.env.VITE_WS_API_STAGE as string) || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  if (!domain) throw new Error('VITE_WS_API_DOMAIN not configured');
  // connect with ?auth=token
  return `wss://${domain}/${stage}?auth=${encodeURIComponent(token || '')}`;
}
