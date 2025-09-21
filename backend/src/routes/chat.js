import express from 'express';
import { body, validationResult } from 'express-validator';
import { chatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation middleware for chat messages
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .escape(),
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

// POST /api/chat/message - Send a message to the RAG system
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, context } = req.body;
    
    logger.info('Chat message received', {
      sessionId,
      messageLength: message.length,
      hasContext: !!context
    });

    // Process the message through the RAG system
    const response = await chatService.processMessage(message, {
      sessionId,
      context,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        response: response.answer,
        sources: response.sources || [],
        sessionId: response.sessionId,
        timestamp: response.timestamp,
        processingTime: response.processingTime
      }
    });

  } catch (error) {
    logger.error('Error processing chat message:', error);
    
    res.status(500).json({
      error: 'Failed to process message',
      message: 'An error occurred while processing your request. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/chat/stream - Stream a message response (for real-time chat)
router.post('/stream', validateChatMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, context } = req.body;
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'Connected to chat stream',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Process message with streaming
    await chatService.processMessageStream(message, {
      sessionId,
      context,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk,
          timestamp: new Date().toISOString()
        })}\n\n`);
      },
      onComplete: (response) => {
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          response: response.answer,
          sources: response.sources || [],
          sessionId: response.sessionId,
          timestamp: response.timestamp,
          processingTime: response.processingTime
        })}\n\n`);
        
        res.write(`data: ${JSON.stringify({
          type: 'end',
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        res.end();
      },
      onError: (error) => {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    logger.error('Error in chat stream:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to process stream',
        message: 'An error occurred while processing your request.'
      });
    }
  }
});

// GET /api/chat/history/:sessionId - Get chat history for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const history = await chatService.getChatHistory(sessionId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        sessionId,
        messages: history.messages,
        totalCount: history.totalCount,
        hasMore: history.hasMore
      }
    });

  } catch (error) {
    logger.error('Error fetching chat history:', error);
    
    res.status(500).json({
      error: 'Failed to fetch chat history',
      message: 'An error occurred while retrieving chat history.'
    });
  }
});

// DELETE /api/chat/history/:sessionId - Clear chat history for a session
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await chatService.clearChatHistory(sessionId);
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    logger.error('Error clearing chat history:', error);
    
    res.status(500).json({
      error: 'Failed to clear chat history',
      message: 'An error occurred while clearing chat history.'
    });
  }
});

// GET /api/chat/sessions - Get all chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const sessions = await chatService.getChatSessions({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        sessions: sessions.sessions,
        totalCount: sessions.totalCount,
        hasMore: sessions.hasMore
      }
    });

  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    
    res.status(500).json({
      error: 'Failed to fetch chat sessions',
      message: 'An error occurred while retrieving chat sessions.'
    });
  }
});

export default router;
