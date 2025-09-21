# Sri Lanka Government Acts RAG System - Full Stack Integration

This document explains how to set up and run the complete Sri Lanka Government Acts RAG system with Node.js backend integration.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React         │    │   Node.js       │    │   Python        │
│   Frontend      │◄──►│   Backend       │◄──►│   RAG API       │
│   (Port 5173)   │    │   (Port 5000)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# Make the script executable and run it
chmod +x start-services.sh
./start-services.sh
```

### Option 2: Manual Startup

#### 1. Start Python RAG API
```bash
cd Fyp-Rag
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python rag_api.py
```

#### 2. Start Node.js Backend
```bash
cd backend
npm install
npm run dev
```

#### 3. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
Sri-Lanka-Government-Acts-RAG/
├── Fyp-Rag/                    # Python RAG System
│   ├── rag_api.py             # FastAPI server
│   ├── rag_pipeline.py        # RAG pipeline
│   ├── rag_agent.py           # RAG agent
│   ├── chromadbpdf.py         # Document processing
│   └── requirements.txt       # Python dependencies
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── server.js          # Express server
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utilities
│   └── package.json        # Node.js dependencies
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   └── hooks/             # Custom hooks
│   └── package.json           # React dependencies
└── start-services.sh          # Startup script
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
PYTHON_RAG_API_URL=http://localhost:8000
PYTHON_RAG_API_TIMEOUT=30000
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### Frontend (.env)
```env
VITE_SERVER_API=http://localhost:5000
```

## 🌐 API Endpoints

### Node.js Backend (Port 5000)

#### Chat Endpoints
- `POST /api/chat/message` - Send a chat message
- `POST /api/chat/stream` - Stream chat response
- `GET /api/chat/history/:sessionId` - Get chat history
- `DELETE /api/chat/history/:sessionId` - Clear chat history
- `GET /api/chat/sessions` - Get all chat sessions

#### RAG Endpoints
- `POST /api/rag/query` - Query the RAG system
- `GET /api/rag/collections` - Get available collections
- `GET /api/rag/collections/:id` - Get collection details
- `POST /api/rag/analyze` - Analyze a question
- `POST /api/rag/stream` - Stream RAG query

#### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Python RAG API (Port 8000)

- `GET /` - API information
- `GET /health` - Health check
- `POST /chat` - Process chat message
- `GET /collections` - Get available collections

## 🔌 WebSocket Events

### Client → Server
- `chat:message` - Send chat message
- `chat:session:create` - Create new session
- `chat:session:join` - Join existing session
- `chat:typing:start` - Start typing indicator
- `chat:typing:stop` - Stop typing indicator
- `rag:query` - Send RAG query
- `rag:collections:get` - Get collections

### Server → Client
- `chat:connected` - Connection established
- `chat:bot:response` - Bot response received
- `chat:bot:typing` - Bot typing indicator
- `chat:error` - Chat error occurred
- `rag:response` - RAG query response
- `rag:error` - RAG error occurred
- `ping` - Heartbeat ping

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
npm test            # Run tests
npm run lint        # Lint code
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Python API Development
```bash
cd Fyp-Rag
source venv/bin/activate
python rag_api.py   # Start API server
```

## 🧪 Testing the Integration

### 1. Test Python RAG API
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the Civil Aviation Act?"}'
```

### 2. Test Node.js Backend
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the Civil Aviation Act?"}'
```

### 3. Test Frontend
Open http://localhost:5173 in your browser and try the chat interface.

## 🔍 Monitoring and Logs

### Backend Logs
```bash
# View Node.js backend logs
cd backend
npm run dev

# View specific log files
tail -f logs/app.log
```

### Python API Logs
```bash
# View Python API logs
cd Fyp-Rag
python rag_api.py  # Logs will appear in console
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find and kill processes using ports
lsof -ti:5000 | xargs kill -9  # Node.js backend
lsof -ti:8000 | xargs kill -9  # Python API
lsof -ti:5173 | xargs kill -9  # React frontend
```

#### 2. Python Dependencies Issues
```bash
cd Fyp-Rag
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Node.js Dependencies Issues
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS Issues
- Ensure Python API has CORS enabled
- Check Node.js backend CORS configuration
- Verify frontend URL in backend configuration

#### 5. WebSocket Connection Issues
- Check if WebSocket service is running
- Verify Socket.IO client configuration
- Check browser console for WebSocket errors

### Health Checks

#### Check All Services
```bash
# Python RAG API
curl http://localhost:8000/health

# Node.js Backend
curl http://localhost:5000/api/health

# React Frontend (should load in browser)
curl http://localhost:5173
```

## 📊 Performance Optimization

### Backend Optimization
- Enable compression middleware
- Implement response caching
- Use connection pooling for database
- Optimize RAG query processing

### Frontend Optimization
- Implement lazy loading
- Use React.memo for components
- Optimize bundle size
- Implement service workers

### Python API Optimization
- Use async/await for I/O operations
- Implement response caching
- Optimize document processing
- Use connection pooling

## 🔒 Security Considerations

### Production Deployment
- Use HTTPS for all services
- Implement proper CORS policies
- Add rate limiting
- Use environment variables for secrets
- Implement authentication/authorization
- Add input validation and sanitization

### Environment Security
- Never commit .env files
- Use strong secrets for JWT
- Implement proper logging
- Add security headers
- Use HTTPS in production

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement session management
- Use Redis for session storage
- Implement database clustering

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

## 🎯 Next Steps

1. **Authentication**: Add user authentication and authorization
2. **Database**: Implement persistent storage for chat history
3. **Caching**: Add Redis for response caching
4. **Monitoring**: Implement comprehensive monitoring
5. **Testing**: Add comprehensive test suites
6. **Documentation**: Add API documentation with Swagger
7. **Deployment**: Set up CI/CD pipelines
8. **Security**: Implement security best practices

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Verify all services are running
4. Check network connectivity between services
5. Ensure all dependencies are installed correctly

## 🎉 Success!

If all services are running correctly, you should see:
- ✅ Python RAG API: http://localhost:8000
- ✅ Node.js Backend: http://localhost:5000
- ✅ React Frontend: http://localhost:5173

The system is now ready for use! 🚀
