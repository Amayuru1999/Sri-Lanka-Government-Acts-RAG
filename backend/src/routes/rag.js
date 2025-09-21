import express from 'express';
import { body, validationResult } from 'express-validator';
import { ragService } from '../services/ragService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation middleware for RAG queries
const validateRAGQuery = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Question must be between 1 and 2000 characters')
    .escape(),
  body('collections')
    .optional()
    .isArray()
    .withMessage('Collections must be an array'),
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max results must be between 1 and 20'),
  body('includeSources')
    .optional()
    .isBoolean()
    .withMessage('Include sources must be a boolean')
];

// POST /api/rag/query - Query the RAG system
router.post('/query', validateRAGQuery, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      question, 
      collections = [], 
      maxResults = 5, 
      includeSources = true 
    } = req.body;
    
    logger.info('RAG query received', {
      questionLength: question.length,
      collections: collections.length,
      maxResults,
      includeSources
    });

    // Process the query through the RAG system
    const response = await ragService.query(question, {
      collections,
      maxResults,
      includeSources,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        question: response.question,
        answer: response.answer,
        sources: response.sources || [],
        collections: response.collections || [],
        confidence: response.confidence,
        processingTime: response.processingTime,
        timestamp: response.timestamp
      }
    });

  } catch (error) {
    logger.error('Error processing RAG query:', error);
    
    res.status(500).json({
      error: 'Failed to process query',
      message: 'An error occurred while processing your query. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/rag/collections - Get available document collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await ragService.getAvailableCollections();
    
    res.json({
      success: true,
      data: {
        collections: collections.collections,
        totalCount: collections.totalCount,
        lastUpdated: collections.lastUpdated
      }
    });

  } catch (error) {
    logger.error('Error fetching collections:', error);
    
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: 'An error occurred while retrieving available collections.'
    });
  }
});

// GET /api/rag/collections/:collectionId - Get details about a specific collection
router.get('/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await ragService.getCollectionDetails(collectionId);
    
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found',
        message: `Collection '${collectionId}' does not exist.`
      });
    }

    res.json({
      success: true,
      data: {
        collection
      }
    });

  } catch (error) {
    logger.error('Error fetching collection details:', error);
    
    res.status(500).json({
      error: 'Failed to fetch collection details',
      message: 'An error occurred while retrieving collection information.'
    });
  }
});

// POST /api/rag/analyze - Analyze a question without generating an answer
router.post('/analyze', [
  body('question')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Question must be between 1 and 2000 characters')
    .escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { question } = req.body;
    
    logger.info('RAG analysis requested', {
      questionLength: question.length
    });

    // Analyze the question
    const analysis = await ragService.analyzeQuestion(question);

    res.json({
      success: true,
      data: {
        question: analysis.question,
        analysis: analysis.analysis,
        suggestedCollections: analysis.suggestedCollections,
        confidence: analysis.confidence,
        isAnswerable: analysis.isAnswerable,
        timestamp: analysis.timestamp
      }
    });

  } catch (error) {
    logger.error('Error analyzing question:', error);
    
    res.status(500).json({
      error: 'Failed to analyze question',
      message: 'An error occurred while analyzing your question.'
    });
  }
});

// POST /api/rag/stream - Stream a RAG query response
router.post('/stream', validateRAGQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      question, 
      collections = [], 
      maxResults = 5, 
      includeSources = true 
    } = req.body;
    
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
      message: 'Connected to RAG stream',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Process query with streaming
    await ragService.queryStream(question, {
      collections,
      maxResults,
      includeSources,
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
          question: response.question,
          answer: response.answer,
          sources: response.sources || [],
          collections: response.collections || [],
          confidence: response.confidence,
          processingTime: response.processingTime,
          timestamp: response.timestamp
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
    logger.error('Error in RAG stream:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to process stream',
        message: 'An error occurred while processing your query.'
      });
    }
  }
});

export default router;
