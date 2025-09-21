import { logger } from '../utils/logger.js';
import { chatService } from './chatService.js';
import { ragService } from './ragService.js';

class WebSocketService {
  constructor() {
    this.connectedClients = new Map();
    this.heartbeatInterval = null;
  }

  initialize(io) {
    this.io = io;
    
    // Set up connection handling
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Set up heartbeat
    this.setupHeartbeat();
    
    logger.info('WebSocket service initialized');
  }

  handleConnection(socket) {
    const clientId = socket.id;
    const clientInfo = {
      id: clientId,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessionId: null
    };

    this.connectedClients.set(clientId, clientInfo);
    
    logger.info('Client connected', {
      clientId,
      totalClients: this.connectedClients.size
    });

    // Handle chat messages
    socket.on('chat:message', async (data) => {
      await this.handleChatMessage(socket, data);
    });

    // Handle session management
    socket.on('chat:session:create', (data) => {
      this.handleSessionCreate(socket, data);
    });

    socket.on('chat:session:join', (data) => {
      this.handleSessionJoin(socket, data);
    });

    // Handle typing indicators
    socket.on('chat:typing:start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('chat:typing:stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle RAG queries
    socket.on('rag:query', async (data) => {
      await this.handleRAGQuery(socket, data);
    });

    // Handle collection requests
    socket.on('rag:collections:get', async (data) => {
      await this.handleGetCollections(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Send welcome message
    socket.emit('chat:connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to chat service'
    });
  }

  async handleChatMessage(socket, data) {
    try {
      const { message, sessionId, context } = data;
      
      if (!message || typeof message !== 'string') {
        socket.emit('chat:error', {
          error: 'Invalid message format',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Update client activity
      const client = this.connectedClients.get(socket.id);
      if (client) {
        client.lastActivity = new Date().toISOString();
        client.sessionId = sessionId;
      }

      // Send typing indicator
      socket.emit('chat:bot:typing', {
        isTyping: true,
        timestamp: new Date().toISOString()
      });

      // Process message through chat service
      const response = await chatService.processMessage(message, {
        sessionId,
        context,
        timestamp: new Date().toISOString()
      });

      // Send response
      socket.emit('chat:bot:response', {
        message: response.answer,
        sources: response.sources || [],
        sessionId: response.sessionId,
        timestamp: response.timestamp,
        processingTime: response.processingTime
      });

      // Stop typing indicator
      socket.emit('chat:bot:typing', {
        isTyping: false,
        timestamp: new Date().toISOString()
      });

      logger.info('Chat message processed via WebSocket', {
        clientId: socket.id,
        sessionId,
        processingTime: response.processingTime
      });

    } catch (error) {
      logger.error('Error handling chat message via WebSocket:', error);
      
      socket.emit('chat:error', {
        error: 'Failed to process message',
        message: 'An error occurred while processing your message.',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleSessionCreate(socket, data) {
    const sessionId = data.sessionId || require('uuid').v4();
    
    socket.emit('chat:session:created', {
      sessionId,
      timestamp: new Date().toISOString()
    });

    logger.info('Chat session created via WebSocket', {
      clientId: socket.id,
      sessionId
    });
  }

  handleSessionJoin(socket, data) {
    const { sessionId } = data;
    
    if (!sessionId) {
      socket.emit('chat:error', {
        error: 'Session ID required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update client session
    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.sessionId = sessionId;
    }

    socket.emit('chat:session:joined', {
      sessionId,
      timestamp: new Date().toISOString()
    });

    logger.info('Client joined session via WebSocket', {
      clientId: socket.id,
      sessionId
    });
  }

  handleTypingStart(socket, data) {
    const { sessionId } = data;
    
    socket.broadcast.emit('chat:user:typing', {
      sessionId,
      isTyping: true,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { sessionId } = data;
    
    socket.broadcast.emit('chat:user:typing', {
      sessionId,
      isTyping: false,
      timestamp: new Date().toISOString()
    });
  }

  async handleRAGQuery(socket, data) {
    try {
      const { question, collections, options } = data;
      
      if (!question || typeof question !== 'string') {
        socket.emit('rag:error', {
          error: 'Invalid question format',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Process RAG query
      const response = await ragService.query(question, {
        collections: collections || [],
        maxResults: options?.maxResults || 5,
        includeSources: options?.includeSources !== false
      });

      // Send response
      socket.emit('rag:response', {
        question: response.question,
        answer: response.answer,
        sources: response.sources || [],
        collections: response.collections || [],
        confidence: response.confidence,
        processingTime: response.processingTime,
        timestamp: response.timestamp
      });

      logger.info('RAG query processed via WebSocket', {
        clientId: socket.id,
        processingTime: response.processingTime
      });

    } catch (error) {
      logger.error('Error handling RAG query via WebSocket:', error);
      
      socket.emit('rag:error', {
        error: 'Failed to process query',
        message: 'An error occurred while processing your query.',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleGetCollections(socket, data) {
    try {
      const collections = await ragService.getAvailableCollections();
      
      socket.emit('rag:collections:response', {
        collections: collections.collections,
        totalCount: collections.totalCount,
        lastUpdated: collections.lastUpdated,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting collections via WebSocket:', error);
      
      socket.emit('rag:error', {
        error: 'Failed to get collections',
        message: 'An error occurred while retrieving collections.',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleDisconnection(socket, reason) {
    const clientId = socket.id;
    this.connectedClients.delete(clientId);
    
    logger.info('Client disconnected', {
      clientId,
      reason,
      totalClients: this.connectedClients.size
    });
  }

  setupHeartbeat() {
    const interval = parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000;
    
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('ping', {
        timestamp: new Date().toISOString()
      });
    }, interval);
  }

  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  getClientCount() {
    return this.connectedClients.size;
  }

  broadcastToSession(sessionId, event, data) {
    this.io.emit(event, {
      sessionId,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  sendToClient(clientId, event, data) {
    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.connectedClients.clear();
    logger.info('WebSocket service cleaned up');
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Initialize function for the service
export const initializeWebSocket = (io) => {
  webSocketService.initialize(io);
};
