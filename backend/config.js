// Configuration file for the Node.js backend
export const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  pythonAPI: {
    url: process.env.PYTHON_RAG_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.PYTHON_RAG_API_TIMEOUT) || 30000
  },
  
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000,
    heartbeatTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT) || 60000
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key-change-in-production'
  }
};
