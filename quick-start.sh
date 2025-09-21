#!/bin/bash

# Sri Lanka Government Acts RAG - Quick Start Script
# This script starts all services required for the RAG system

set -e

echo "🚀 Starting Sri Lanka Government Acts RAG System..."
echo "=================================================="

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null || true
    fi
    if [ ! -z "$NODE_PID" ]; then
        kill $NODE_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Python RAG API
echo "🐍 Starting Python RAG API..."
cd Fyp-Rag

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Start Python API in background with OpenAI API key
echo "Starting Python RAG API on port 8000..."
OPENAI_API_KEY=${OPENAI_API_KEY} python rag_api.py &
PYTHON_PID=$!
cd ..

# Wait for Python API to start
echo "⏳ Waiting for Python API to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Python RAG API is running on port 8000"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Python RAG API failed to start"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start Node.js Backend
echo "🟢 Starting Node.js Backend..."
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
fi

# Start backend in background
npm run dev > /dev/null 2>&1 &
NODE_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for Node.js Backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "✅ Node.js Backend is running on port 5001"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Node.js Backend failed to start"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start React Frontend
echo "⚛️  Starting React Frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing React dependencies..."
    npm install > /dev/null 2>&1
fi

# Start frontend in background
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for React Frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ React Frontend is running on port 5173"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ React Frontend failed to start"
        cleanup
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 All services are running successfully!"
echo "=================================================="
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5001"
echo "🐍 Python RAG API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
while true; do
    sleep 1
done
