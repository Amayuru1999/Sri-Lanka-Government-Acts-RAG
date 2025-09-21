import { ragService } from './ragService.js';
import { chatService } from './chatService.js';
import { logger } from '../utils/logger.js';
import os from 'os';

class HealthService {
  constructor() {
    this.startTime = Date.now();
  }

  async getHealthStatus() {
    try {
      const services = {
        rag: await this.checkRAGService(),
        chat: await this.checkChatService(),
        system: await this.checkSystemHealth()
      };

      const overallStatus = Object.values(services).every(service => service.status === 'healthy') 
        ? 'healthy' 
        : 'degraded';

      return {
        status: overallStatus,
        services
      };

    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        services: {
          rag: { status: 'unhealthy', error: error.message },
          chat: { status: 'unhealthy', error: error.message },
          system: { status: 'unhealthy', error: error.message }
        }
      };
    }
  }

  async getDetailedHealthStatus() {
    try {
      const services = {
        rag: await this.checkRAGServiceDetailed(),
        chat: await this.checkChatServiceDetailed(),
        system: await this.checkSystemHealthDetailed()
      };

      const dependencies = await this.checkDependencies();

      const overallStatus = Object.values(services).every(service => service.status === 'healthy') 
        ? 'healthy' 
        : 'degraded';

      return {
        overall: overallStatus,
        services,
        system: await this.getSystemInfo(),
        dependencies
      };

    } catch (error) {
      logger.error('Detailed health check failed:', error);
      return {
        overall: 'unhealthy',
        services: {},
        system: {},
        dependencies: { status: 'unhealthy', error: error.message }
      };
    }
  }

  async isReady() {
    try {
      // Check if all critical services are ready
      const ragHealthy = await ragService.isHealthy();
      const chatHealthy = await this.checkChatService();
      
      return ragHealthy && chatHealthy.status === 'healthy';
    } catch (error) {
      logger.error('Readiness check failed:', error);
      return false;
    }
  }

  async checkRAGService() {
    try {
      const isHealthy = await ragService.isHealthy();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkRAGServiceDetailed() {
    try {
      const isHealthy = await ragService.isHealthy();
      const collections = await ragService.getAvailableCollections();
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        collections: collections.totalCount,
        lastChecked: new Date().toISOString(),
        details: {
          pythonApiUrl: process.env.PYTHON_RAG_API_URL || 'http://localhost:8000',
          timeout: process.env.PYTHON_RAG_API_TIMEOUT || 30000
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkChatService() {
    try {
      const stats = await chatService.getSessionStats();
      return {
        status: 'healthy',
        sessions: stats.totalSessions,
        messages: stats.totalMessages,
        activeSessions: stats.activeSessions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkChatServiceDetailed() {
    try {
      const stats = await chatService.getSessionStats();
      return {
        status: 'healthy',
        sessions: stats.totalSessions,
        messages: stats.totalMessages,
        activeSessions: stats.activeSessions,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkSystemHealth() {
    try {
      const memoryUsage = process.memoryUsage();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

      return {
        status: memoryUsagePercent < 90 ? 'healthy' : 'degraded',
        memoryUsage: memoryUsagePercent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkSystemHealthDetailed() {
    try {
      const memoryUsage = process.memoryUsage();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      const cpuUsage = os.loadavg();

      return {
        status: memoryUsagePercent < 90 ? 'healthy' : 'degraded',
        memory: {
          used: memoryUsage,
          system: {
            free: freeMemory,
            total: totalMemory,
            usagePercent: memoryUsagePercent
          }
        },
        cpu: {
          loadAverage: cpuUsage,
          cores: os.cpus().length
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkDependencies() {
    try {
      const dependencies = {
        pythonRAGAPI: await this.checkPythonRAGAPI(),
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      };

      return {
        status: 'healthy',
        dependencies
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkPythonRAGAPI() {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(`${process.env.PYTHON_RAG_API_URL || 'http://localhost:8000'}/health`, {
        timeout: 10000
      });
      
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        url: process.env.PYTHON_RAG_API_URL || 'http://localhost:8000',
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        url: process.env.PYTHON_RAG_API_URL || 'http://localhost:8000',
        error: error.message
      };
    }
  }

  async getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      uptime: process.uptime(),
      startTime: new Date(this.startTime).toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
  }
}

// Create singleton instance
export const healthService = new HealthService();
