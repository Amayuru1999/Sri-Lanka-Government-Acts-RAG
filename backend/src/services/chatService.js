import { ragService } from './ragService.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class ChatService {
  constructor() {
    this.sessions = new Map(); // In-memory storage for demo purposes
    this.chatHistory = new Map(); // In-memory storage for demo purposes
  }

  async processMessage(message, options = {}) {
    const startTime = Date.now();
    const sessionId = options.sessionId || uuidv4();
    
    try {
      logger.info('Processing chat message', {
        sessionId,
        messageLength: message.length
      });

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0
        };
        this.sessions.set(sessionId, session);
      }

      // Update session activity
      session.lastActivity = new Date().toISOString();
      session.messageCount++;

      // Process through RAG system
      const ragResponse = await ragService.query(message, {
        collections: options.context?.collections || [],
        maxResults: 5,
        includeSources: true
      });

      const processingTime = Date.now() - startTime;

      // Store in chat history
      const chatEntry = {
        id: uuidv4(),
        sessionId,
        userMessage: message,
        botResponse: ragResponse.answer,
        sources: ragResponse.sources || [],
        timestamp: new Date().toISOString(),
        processingTime
      };

      if (!this.chatHistory.has(sessionId)) {
        this.chatHistory.set(sessionId, []);
      }
      this.chatHistory.get(sessionId).push(chatEntry);

      // Return response
      return {
        answer: ragResponse.answer,
        sources: ragResponse.sources || [],
        sessionId,
        timestamp: new Date().toISOString(),
        processingTime
      };

    } catch (error) {
      logger.error('Error processing chat message:', error);
      
      return {
        answer: 'I apologize, but I encountered an error while processing your message. Please try again later.',
        sources: [],
        sessionId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  async processMessageStream(message, options = {}) {
    const startTime = Date.now();
    const sessionId = options.sessionId || uuidv4();
    
    try {
      logger.info('Processing streaming chat message', {
        sessionId,
        messageLength: message.length
      });

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0
        };
        this.sessions.set(sessionId, session);
      }

      // Update session activity
      session.lastActivity = new Date().toISOString();
      session.messageCount++;

      // Process through RAG system with streaming
      await ragService.queryStream(message, {
        collections: options.context?.collections || [],
        maxResults: 5,
        includeSources: true,
        onChunk: (chunk) => {
          if (options.onChunk) {
            options.onChunk(chunk);
          }
        },
        onComplete: async (ragResponse) => {
          const processingTime = Date.now() - startTime;

          // Store in chat history
          const chatEntry = {
            id: uuidv4(),
            sessionId,
            userMessage: message,
            botResponse: ragResponse.answer,
            sources: ragResponse.sources || [],
            timestamp: new Date().toISOString(),
            processingTime
          };

          if (!this.chatHistory.has(sessionId)) {
            this.chatHistory.set(sessionId, []);
          }
          this.chatHistory.get(sessionId).push(chatEntry);

          // Call completion callback
          if (options.onComplete) {
            options.onComplete({
              answer: ragResponse.answer,
              sources: ragResponse.sources || [],
              sessionId,
              timestamp: new Date().toISOString(),
              processingTime
            });
          }
        },
        onError: (error) => {
          logger.error('Error in streaming chat:', error);
          
          if (options.onError) {
            options.onError(error);
          }
        }
      });

    } catch (error) {
      logger.error('Error processing streaming chat message:', error);
      
      if (options.onError) {
        options.onError(error);
      }
    }
  }

  async getChatHistory(sessionId, options = {}) {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      const history = this.chatHistory.get(sessionId) || [];
      const totalCount = history.length;
      
      const messages = history
        .slice(offset, offset + limit)
        .map(entry => ({
          id: entry.id,
          userMessage: entry.userMessage,
          botResponse: entry.botResponse,
          sources: entry.sources,
          timestamp: entry.timestamp,
          processingTime: entry.processingTime
        }));

      return {
        messages,
        totalCount,
        hasMore: offset + limit < totalCount
      };

    } catch (error) {
      logger.error('Error getting chat history:', error);
      return {
        messages: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  async clearChatHistory(sessionId) {
    try {
      this.chatHistory.delete(sessionId);
      logger.info('Chat history cleared for session', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error clearing chat history:', error);
      return false;
    }
  }

  async getChatSessions(options = {}) {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      const sessions = Array.from(this.sessions.values())
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
        .slice(offset, offset + limit)
        .map(session => ({
          id: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          messageCount: session.messageCount,
          hasHistory: this.chatHistory.has(session.id)
        }));

      return {
        sessions,
        totalCount: this.sessions.size,
        hasMore: offset + limit < this.sessions.size
      };

    } catch (error) {
      logger.error('Error getting chat sessions:', error);
      return {
        sessions: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  async getSessionStats() {
    try {
      const totalSessions = this.sessions.size;
      const totalMessages = Array.from(this.chatHistory.values())
        .reduce((total, history) => total + history.length, 0);
      
      const activeSessions = Array.from(this.sessions.values())
        .filter(session => {
          const lastActivity = new Date(session.lastActivity);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return lastActivity > oneHourAgo;
        }).length;

      return {
        totalSessions,
        totalMessages,
        activeSessions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        activeSessions: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
export const chatService = new ChatService();
