import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MessageEvent, TypingEvent, ReactionEvent } from '../../services/websocketService';
import { formatMessageTime, formatFullTimestamp } from '../../utils/dateUtils';

interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  reactions?: Array<{ emoji: string; users: string[] }>;
}

interface TypingUser {
  id: string;
  username: string;
  displayName?: string;
}

export const ChatComponent: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // WebSocket integration
  const {
    isConnected,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction
  } = useWebSocket({
    onMessageCreate: (event: MessageEvent) => {
      if (event.data.roomId === channelId) {
        setMessages(prev => [...prev, event.data.message]);
      }
    },
    onMessageUpdate: (event: MessageEvent) => {
      if (event.data.roomId === channelId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === event.data.message.id ? event.data.message : msg
          )
        );
      }
    },
    onMessageDelete: (event: MessageEvent) => {
      if (event.data.roomId === channelId) {
        setMessages(prev => prev.filter(msg => msg.id !== event.data.messageId));
      }
    },
    onUserTyping: (event: TypingEvent) => {
      if (event.data.roomId === channelId) {
        setTypingUsers(prev => {
          const exists = prev.find(user => user.id === event.data.user!.id);
          if (!exists && event.data.user) {
            return [...prev, event.data.user];
          }
          return prev;
        });
      }
    },
    onUserStopTyping: (event: TypingEvent) => {
      if (event.data.roomId === channelId) {
        setTypingUsers(prev => prev.filter(user => user.id !== event.data.userId));
      }
    },
    onReactionAdd: (event: ReactionEvent) => {
      if (event.data.messageId) {
        setMessages(prev => 
          prev.map(msg => {
            if (msg.id === event.data.messageId) {
              const existingReaction = msg.reactions?.find(r => r.emoji === event.data.emoji);
              if (existingReaction) {
                return {
                  ...msg,
                  reactions: msg.reactions?.map(r => 
                    r.emoji === event.data.emoji 
                      ? { ...r, users: [...r.users, event.data.userId] }
                      : r
                  )
                };
              } else {
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), { 
                    emoji: event.data.emoji, 
                    users: [event.data.userId] 
                  }]
                };
              }
            }
            return msg;
          })
        );
      }
    }
  });

  // Join/leave room when component mounts/unmounts
  useEffect(() => {
    if (isConnected && channelId) {
      joinRoom(`channel:${channelId}`);
      return () => leaveRoom(`channel:${channelId}`);
    }
  }, [isConnected, channelId, joinRoom, leaveRoom]);

  // Handle message input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Start typing indicator
    if (e.target.value.length === 1) {
      startTyping(`channel:${channelId}`);
    }
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // Send message via API (this will trigger WebSocket broadcast)
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            content: newMessage.trim(),
            channelId: channelId
          })
        });

        if (response.ok) {
          setNewMessage('');
          stopTyping(`channel:${channelId}`);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  // Handle reaction toggle
  const handleReactionToggle = async (messageId: string, emoji: string) => {
    // Toggle reaction via WebSocket
    addReaction(messageId, emoji);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="p-2 border-b">
        <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div key={message.id} className="mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold">{message.authorName}</span>
                  <span 
                    className="text-xs text-gray-500 cursor-help hover:text-gray-700 transition-colors"
                    title={formatFullTimestamp(message.timestamp)}
                  >
                    {formatMessageTime(message.timestamp, { short: true })}
                  </span>
                </div>
                <div className="text-gray-800">{message.content}</div>
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex space-x-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() => handleReactionToggle(message.id, reaction.emoji)}
                        className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      >
                        {reaction.emoji} {reaction.users.length}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-500 italic">
            {typingUsers.map(user => user.displayName || user.username).join(', ')} 
            {typingUsers.length === 1 ? ' is' : ' are'} typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
