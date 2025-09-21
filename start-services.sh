#!/bin/bash

# Sri Lanka Government Acts RAG - Service Startup Script
# This script starts all required services for the RAG system

echo "🚀 Starting Sri Lanka Government Acts RAG System"
echo "================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to start Python RAG API
start_python_api() {
    echo "🐍 Starting Python RAG API..."
    cd Fyp-Rag
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Start the Python API
    echo "Starting Python RAG API on port 8000..."
    python rag_api.py &
    PYTHON_PID=$!
    
    cd ..
    echo "✅ Python RAG API started (PID: $PYTHON_PID)"
}

# Function to start Node.js backend
start_nodejs_backend() {
    echo "🟢 Starting Node.js Backend..."
    cd backend
    
    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm install
    
    # Start the Node.js backend
    echo "Starting Node.js backend on port 5000..."
    npm run dev &
    NODE_PID=$!
    
    cd ..
    echo "✅ Node.js Backend started (PID: $NODE_PID)"
}

# Function to start React frontend
start_react_frontend() {
    echo "⚛️ Starting React Frontend..."
    cd frontend
    
    # Install dependencies
    echo "Installing React dependencies..."
    npm install
    
    # Start the React frontend
    echo "Starting React frontend on port 5173..."
    npm run dev &
    REACT_PID=$!
    
    cd ..
    echo "✅ React Frontend started (PID: $REACT_PID)"
}

# Function to wait for services to be ready
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for Python API
    echo "Waiting for Python RAG API..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ Python RAG API is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Python RAG API failed to start"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for Node.js backend
    echo "Waiting for Node.js backend..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            echo "✅ Node.js backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Node.js backend failed to start"
            exit 1
        fi
        sleep 1
    done
}

# Function to display service URLs
show_service_urls() {
    echo ""
    echo "🌐 Service URLs:"
    echo "================"
    echo "🐍 Python RAG API:    http://localhost:8000"
    echo "🟢 Node.js Backend:   http://localhost:5000"
    echo "⚛️ React Frontend:    http://localhost:5173"
    echo ""
    echo "📚 API Documentation:"
    echo "====================="
    echo "Python API Docs:      http://localhost:8000/docs"
    echo "Node.js Health:       http://localhost:5000/api/health"
    echo ""
    echo "🎉 All services are running!"
    echo "Press Ctrl+C to stop all services"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill all background processes
    jobs -p | xargs -r kill
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start all services
start_python_api
sleep 2
start_nodejs_backend
sleep 2
start_react_frontend

# Wait for services to be ready
wait_for_services

# Show service URLs
show_service_urls

# Keep script running
wait
