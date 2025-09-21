import express from 'express';
import { healthService } from '../services/healthService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', async (req, res) => {
  try {
    const health = await healthService.getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: health.services
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: 'Service is currently unavailable'
    });
  }
});

// GET /api/health/detailed - Detailed health check with all services
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = await healthService.getDetailedHealthStatus();
    
    const statusCode = detailedHealth.overall === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      overall: detailedHealth.overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: detailedHealth.services,
      system: detailedHealth.system,
      dependencies: detailedHealth.dependencies
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: 'Service is currently unavailable'
    });
  }
});

// GET /api/health/ready - Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    const isReady = await healthService.isReady();
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready to accept requests'
      });
    }

  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

// GET /api/health/live - Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
