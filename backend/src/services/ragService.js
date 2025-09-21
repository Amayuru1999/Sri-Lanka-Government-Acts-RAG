import axios from 'axios';
import { logger } from '../utils/logger.js';

class RAGService {
  constructor() {
    this.pythonAPIUrl = process.env.PYTHON_RAG_API_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.PYTHON_RAG_API_TIMEOUT) || 600000;
    this.isInitialized = false;
    this.collections = [];
  }

  async initialize() {
    try {
      logger.info('Initializing RAG service...');
      
      // Test connection to Python API
      const healthResponse = await axios.get(`${this.pythonAPIUrl}/health`, {
        timeout: 10000
      });
      
      if (healthResponse.status === 200) {
        this.isInitialized = true;
        logger.info('✅ RAG service initialized successfully');
        
        // Load available collections
        await this.loadCollections();
        
        return true;
      } else {
        throw new Error('Python API health check failed');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize RAG service:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  async loadCollections() {
    try {
      // This would need to be implemented in your Python API
      // For now, we'll use a static list based on your processed_collections.json
      this.collections = [
        'Civil_Aviation_Act-Base',
        'Civil_Aviation_Act-Amendment',
        'Economic_Service_Charge_Act-Base',
        'Economic_Service_Charge_Act-Amendment'
      ];
      
      logger.info(`Loaded ${this.collections.length} collections`);
    } catch (error) {
      logger.error('Error loading collections:', error);
      this.collections = [];
    }
  }

  async query(question, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        throw new Error('RAG service not initialized');
      }

      const requestBody = {
        message: question,
        ...options
      };

      logger.info('Sending query to Python RAG API', {
        questionLength: question.length,
        collections: options.collections?.length || 0
      });

      const response = await axios.post(`${this.pythonAPIUrl}/chat`, requestBody, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const processingTime = Date.now() - startTime;

      if (response.status === 200) {
        const result = {
          question,
          answer: response.data.response || response.data.answer || 'No answer generated',
          sources: response.data.sources || [],
          collections: options.collections || [],
          confidence: response.data.confidence || 0.8,
          processingTime,
          timestamp: new Date().toISOString()
        };

        logger.info('RAG query completed', {
          processingTime,
          answerLength: result.answer.length,
          sourcesCount: result.sources.length
        });

        return result;
      } else {
        throw new Error(`Python API returned status ${response.status}`);
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('RAG query failed:', {
        error: error.message,
        processingTime,
        question: question.substring(0, 100)
      });

      // Return a fallback response
      return {
        question,
        answer: 'I apologize, but I encountered an error while processing your question. Please try again later.',
        sources: [],
        collections: options.collections || [],
        confidence: 0,
        processingTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async queryStream(question, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        throw new Error('RAG service not initialized');
      }

      const requestBody = {
        message: question,
        stream: true,
        ...options
      };

      logger.info('Sending streaming query to Python RAG API', {
        questionLength: question.length,
        collections: options.collections?.length || 0
      });

      // For now, we'll simulate streaming by processing the regular query
      // and then streaming the response in chunks
      const response = await this.query(question, options);
      
      // Simulate streaming by breaking the response into chunks
      const chunks = this.chunkText(response.answer, 50);
      
      for (let i = 0; i < chunks.length; i++) {
        if (options.onChunk) {
          options.onChunk(chunks[i]);
        }
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (options.onComplete) {
        options.onComplete(response);
      }

    } catch (error) {
      logger.error('RAG streaming query failed:', error);
      
      if (options.onError) {
        options.onError(error);
      }
    }
  }

  chunkText(text, chunkSize) {
    const words = text.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }

  async getAvailableCollections() {
    try {
      return {
        collections: this.collections,
        totalCount: this.collections.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting collections:', error);
      return {
        collections: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getCollectionDetails(collectionId) {
    try {
      if (!this.collections.includes(collectionId)) {
        return null;
      }

      // This would need to be implemented in your Python API
      // For now, return basic information
      return {
        id: collectionId,
        name: collectionId,
        type: collectionId.includes('Amendment') ? 'amendment' : 'base',
        documentCount: 'Unknown',
        lastUpdated: new Date().toISOString(),
        description: `Collection for ${collectionId}`
      };
    } catch (error) {
      logger.error('Error getting collection details:', error);
      return null;
    }
  }

  async analyzeQuestion(question) {
    try {
      // This would need to be implemented in your Python API
      // For now, return a basic analysis
      const analysis = {
        question,
        analysis: 'This question appears to be related to Sri Lankan government acts and legal matters.',
        suggestedCollections: this.collections.filter(c => 
          question.toLowerCase().includes('aviation') && c.includes('Aviation') ||
          question.toLowerCase().includes('economic') && c.includes('Economic')
        ),
        confidence: 0.8,
        isAnswerable: true,
        timestamp: new Date().toISOString()
      };

      return analysis;
    } catch (error) {
      logger.error('Error analyzing question:', error);
      return {
        question,
        analysis: 'Unable to analyze question at this time.',
        suggestedCollections: [],
        confidence: 0,
        isAnswerable: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async isHealthy() {
    try {
      const response = await axios.get(`${this.pythonAPIUrl}/health`, {
        timeout: 10000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('RAG service health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const ragService = new RAGService();

// Initialize function for the service
export const initializeRAGService = async () => {
  return await ragService.initialize();
};
