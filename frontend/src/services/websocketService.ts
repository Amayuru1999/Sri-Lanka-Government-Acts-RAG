import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  message: string;
  sessionId?: string;
  context?: any;
}

interface ChatResponse {
  message: string;
  sources: string[];
  sessionId: string;
  timestamp: string;
  processingTime: number;
}

interface WebSocketServiceConfig {
  serverUrl: string;
  onMessage?: (response: ChatResponse) => void;
  onError?: (error: any) => void;
  onTyping?: (isTyping: boolean) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketServiceConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: WebSocketServiceConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      this.config.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.config.onDisconnected?.();
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('chat:connected', (data) => {
      console.log('Chat service connected:', data);
    });

    this.socket.on('chat:bot:response', (data: ChatResponse) => {
      console.log('Received chat response:', data);
      this.config.onMessage?.(data);
    });

    this.socket.on('chat:bot:typing', (data: { isTyping: boolean }) => {
      this.config.onTyping?.(data.isTyping);
    });

    this.socket.on('chat:error', (error) => {
      console.error('Chat error:', error);
      this.config.onError?.(error);
    });

    this.socket.on('pong', (data) => {
      console.log('Received pong:', data);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  sendMessage(message: string, sessionId?: string, context?: any): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const chatMessage: ChatMessage = {
      message,
      sessionId,
      context
    };

    this.socket.emit('chat:message', chatMessage);
  }

  createSession(sessionId?: string): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('chat:session:create', { sessionId });
  }

  joinSession(sessionId: string): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('chat:session:join', { sessionId });
  }

  startTyping(sessionId?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('chat:typing:start', { sessionId });
  }

  stopTyping(sessionId?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('chat:typing:stop', { sessionId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default WebSocketService;
