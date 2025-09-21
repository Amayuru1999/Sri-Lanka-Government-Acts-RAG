import { useEffect, useRef, useState } from 'react';
import WebSocketService from '../services/websocketService';

interface UseWebSocketOptions {
  serverUrl: string;
  autoConnect?: boolean;
  onMessage?: (response: any) => void;
  onError?: (error: any) => void;
  onTyping?: (isTyping: boolean) => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.serverUrl]);

  const connect = () => {
    if (wsServiceRef.current) {
      disconnect();
    }

    wsServiceRef.current = new WebSocketService({
      serverUrl: options.serverUrl,
      onMessage: (response) => {
        options.onMessage?.(response);
      },
      onError: (error) => {
        setError(error.message || 'WebSocket error');
        options.onError?.(error);
      },
      onTyping: (typing) => {
        setIsTyping(typing);
        options.onTyping?.(typing);
      },
      onConnected: () => {
        setIsConnected(true);
        setError(null);
      },
      onDisconnected: () => {
        setIsConnected(false);
      }
    });

    wsServiceRef.current.connect();
  };

  const disconnect = () => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = (message: string, sessionId?: string, context?: any) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.sendMessage(message, sessionId || sessionIdRef.current || undefined, context);
    }
  };

  const createSession = (sessionId?: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.createSession(sessionId);
      if (sessionId) {
        sessionIdRef.current = sessionId;
      }
    }
  };

  const joinSession = (sessionId: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.joinSession(sessionId);
      sessionIdRef.current = sessionId;
    }
  };

  const startTyping = (sessionId?: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.startTyping(sessionId || sessionIdRef.current || undefined);
    }
  };

  const stopTyping = (sessionId?: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.stopTyping(sessionId || sessionIdRef.current || undefined);
    }
  };

  return {
    isConnected,
    isTyping,
    error,
    connect,
    disconnect,
    sendMessage,
    createSession,
    joinSession,
    startTyping,
    stopTyping,
    sessionId: sessionIdRef.current
  };
};
