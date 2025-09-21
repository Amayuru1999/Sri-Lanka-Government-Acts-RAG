# 🚀 Sri Lanka Government Acts RAG System - Setup Guide

This guide will help you set up and run the complete Sri Lanka Government Acts RAG system with Node.js backend integration.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** (for cloning the repository)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space
- **OS**: macOS, Linux, or Windows with WSL

## 🛠️ Installation Steps

### Step 1: Clone and Navigate to Project
```bash
# If you haven't already cloned the repository
git clone <your-repository-url>
cd Sri-Lanka-Government-Acts-RAG
```

### Step 2: Install Dependencies
```bash
# Install root dependencies (for testing)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install Python dependencies
cd Fyp-Rag
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Step 3: Environment Setup

#### Backend Environment
Create a `.env` file in the `backend` directory:
```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:
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

#### Frontend Environment
Create a `.env` file in the `frontend` directory:
```bash
cd frontend
echo "VITE_SERVER_API=http://localhost:5000" > .env
```

## 🚀 Running the System

### Option 1: Quick Start (Recommended)
```bash
# Run the quick start script
./quick-start.sh
```

This will:
- Start all services automatically
- Run integration tests
- Display service URLs
- Keep all services running

### Option 2: Manual Start

#### Terminal 1: Python RAG API
```bash
cd Fyp-Rag
source venv/bin/activate  # On Windows: venv\Scripts\activate
python rag_api.py
```

#### Terminal 2: Node.js Backend
```bash
cd backend
npm run dev
```

#### Terminal 3: React Frontend
```bash
cd frontend
npm run dev
```

### Option 3: Development Mode
```bash
# Start all services with auto-restart
./start-services.sh
```

## 🧪 Testing the Integration

### Run Integration Tests
```bash
# Test all services
npm test

# Or run the test script directly
node test-integration.js
```

### Manual Testing

#### 1. Test Python RAG API
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the Civil Aviation Act?"}'
```

#### 2. Test Node.js Backend
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the Civil Aviation Act?"}'
```

#### 3. Test React Frontend
Open http://localhost:5173 in your browser and try the chat interface.

## 🌐 Service URLs

Once all services are running, you can access:

- **🐍 Python RAG API**: http://localhost:8000
  - Health: http://localhost:8000/health
  - API Docs: http://localhost:8000/docs
  
- **🟢 Node.js Backend**: http://localhost:5000
  - Health: http://localhost:5000/api/health
  - Chat API: http://localhost:5000/api/chat/message
  
- **⚛️ React Frontend**: http://localhost:5173
  - Main Interface: http://localhost:5173
  - Chatbot Page: http://localhost:5173/chatbot

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find and kill processes using ports
lsof -ti:5000 | xargs kill -9  # Node.js backend
lsof -ti:8000 | xargs kill -9  # Python API
lsof -ti:5173 | xargs kill -9  # React frontend

# Or use the clean script
npm run clean
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
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
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

#### Detailed Health Check
```bash
# Get detailed health information
curl http://localhost:5000/api/health/detailed
```

## 📊 Monitoring

### View Logs

#### Backend Logs
```bash
# View Node.js backend logs
cd backend
npm run dev  # Logs appear in console

# View log files
tail -f logs/app.log
```

#### Python API Logs
```bash
# View Python API logs
cd Fyp-Rag
python rag_api.py  # Logs appear in console
```

#### Frontend Logs
```bash
# View React frontend logs
cd frontend
npm run dev  # Logs appear in console
```

### Performance Monitoring

#### Check Service Status
```bash
# Check if services are running
ps aux | grep -E "(python|node|vite)"

# Check port usage
lsof -i :8000  # Python API
lsof -i :5000  # Node.js backend
lsof -i :5173  # React frontend
```

## 🔒 Security Considerations

### Development Environment
- Use HTTP for local development
- CORS is configured for localhost
- No authentication required for testing

### Production Deployment
- Use HTTPS for all services
- Implement proper CORS policies
- Add authentication/authorization
- Use environment variables for secrets
- Implement rate limiting
- Add security headers

## 📈 Performance Optimization

### Backend Optimization
- Enable compression middleware
- Implement response caching
- Use connection pooling
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

1. **Check the troubleshooting section** above
2. **Review the logs** for error messages
3. **Verify all services** are running
4. **Check network connectivity** between services
5. **Ensure all dependencies** are installed correctly

### Getting Help

- Check the `INTEGRATION_README.md` for detailed architecture information
- Review service logs for specific error messages
- Use the integration test script to diagnose issues
- Verify all environment variables are set correctly

## 🎉 Success!

If all services are running correctly, you should see:

- ✅ Python RAG API: http://localhost:8000
- ✅ Node.js Backend: http://localhost:5000  
- ✅ React Frontend: http://localhost:5173

The system is now ready for use! 🚀

### Quick Commands Reference

```bash
# Start all services
./quick-start.sh

# Run tests
npm test

# Clean up
npm run clean

# Install all dependencies
npm run install-all

# Start development mode
./start-services.sh
```

Happy coding! 🎉
