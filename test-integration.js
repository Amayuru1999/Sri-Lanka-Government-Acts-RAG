#!/usr/bin/env node

/**
 * Integration Test Script for Sri Lanka Government Acts RAG System
 * This script tests the complete integration between all services
 */

const axios = require('axios');
const WebSocket = require('ws');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testConfig = {
  pythonAPI: 'http://localhost:8000',
  nodeBackend: 'http://localhost:5001',
  frontend: 'http://localhost:5173',
  timeout: 5000
};

class IntegrationTester {
  constructor() {
    this.results = {
      pythonAPI: { status: 'unknown', response: null, error: null },
      nodeBackend: { status: 'unknown', response: null, error: null },
      frontend: { status: 'unknown', response: null, error: null },
      websocket: { status: 'unknown', response: null, error: null },
      chatFlow: { status: 'unknown', response: null, error: null }
    };
  }

  async testPythonAPI() {
    log('\n🐍 Testing Python RAG API...', 'blue');
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${testConfig.pythonAPI}/health`, {
        timeout: testConfig.timeout
      });
      
      if (healthResponse.status === 200) {
        log('✅ Python API health check passed', 'green');
        this.results.pythonAPI.status = 'healthy';
        this.results.pythonAPI.response = healthResponse.data;
      } else {
        throw new Error(`Unexpected status: ${healthResponse.status}`);
      }

      // Test chat endpoint
      const chatResponse = await axios.post(`${testConfig.pythonAPI}/chat`, {
        message: 'What is the Civil Aviation Act?'
      }, {
        timeout: testConfig.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      if (chatResponse.status === 200) {
        log('✅ Python API chat endpoint working', 'green');
      } else {
        throw new Error(`Chat endpoint failed with status: ${chatResponse.status}`);
      }

    } catch (error) {
      log(`❌ Python API test failed: ${error.message}`, 'red');
      this.results.pythonAPI.status = 'failed';
      this.results.pythonAPI.error = error.message;
    }
  }

  async testNodeBackend() {
    log('\n🟢 Testing Node.js Backend...', 'blue');
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${testConfig.nodeBackend}/api/health`, {
        timeout: testConfig.timeout
      });
      
      if (healthResponse.status === 200) {
        log('✅ Node.js backend health check passed', 'green');
        this.results.nodeBackend.status = 'healthy';
        this.results.nodeBackend.response = healthResponse.data;
      } else {
        throw new Error(`Unexpected status: ${healthResponse.status}`);
      }

      // Test chat endpoint
      const chatResponse = await axios.post(`${testConfig.nodeBackend}/api/chat/message`, {
        message: 'What is the Civil Aviation Act?'
      }, {
        timeout: testConfig.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      if (chatResponse.status === 200) {
        log('✅ Node.js backend chat endpoint working', 'green');
      } else {
        throw new Error(`Chat endpoint failed with status: ${chatResponse.status}`);
      }

    } catch (error) {
      log(`❌ Node.js backend test failed: ${error.message}`, 'red');
      this.results.nodeBackend.status = 'failed';
      this.results.nodeBackend.error = error.message;
    }
  }

  async testFrontend() {
    log('\n⚛️ Testing React Frontend...', 'blue');
    
    try {
      const response = await axios.get(testConfig.frontend, {
        timeout: testConfig.timeout,
        validateStatus: (status) => status < 500 // Accept redirects
      });
      
      if (response.status === 200 || response.status === 304) {
        log('✅ React frontend is accessible', 'green');
        this.results.frontend.status = 'healthy';
        this.results.frontend.response = { status: response.status };
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }

    } catch (error) {
      log(`❌ React frontend test failed: ${error.message}`, 'red');
      this.results.frontend.status = 'failed';
      this.results.frontend.error = error.message;
    }
  }

  async testWebSocket() {
    log('\n🔌 Testing WebSocket Connection...', 'blue');
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(`ws://localhost:5001`);
        
        const timeout = setTimeout(() => {
          log('❌ WebSocket connection timeout', 'red');
          this.results.websocket.status = 'failed';
          this.results.websocket.error = 'Connection timeout';
          resolve();
        }, testConfig.timeout);

        ws.on('open', () => {
          clearTimeout(timeout);
          log('✅ WebSocket connection established', 'green');
          this.results.websocket.status = 'healthy';
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          log(`❌ WebSocket connection failed: ${error.message}`, 'red');
          this.results.websocket.status = 'failed';
          this.results.websocket.error = error.message;
          resolve();
        });

      } catch (error) {
        log(`❌ WebSocket test failed: ${error.message}`, 'red');
        this.results.websocket.status = 'failed';
        this.results.websocket.error = error.message;
        resolve();
      }
    });
  }

  async testChatFlow() {
    log('\n💬 Testing Complete Chat Flow...', 'blue');
    
    try {
      // Test the complete flow: Frontend -> Node.js -> Python
      const response = await axios.post(`${testConfig.nodeBackend}/api/chat/message`, {
        message: 'What is the Civil Aviation Act?',
        sessionId: 'test-session-' + Date.now()
      }, {
        timeout: testConfig.timeout * 2, // Longer timeout for RAG processing
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 && response.data.success) {
        log('✅ Complete chat flow working', 'green');
        log(`📝 Response: ${response.data.data.response.substring(0, 100)}...`, 'yellow');
        this.results.chatFlow.status = 'healthy';
        this.results.chatFlow.response = response.data;
      } else {
        throw new Error('Chat flow returned unsuccessful response');
      }

    } catch (error) {
      log(`❌ Chat flow test failed: ${error.message}`, 'red');
      this.results.chatFlow.status = 'failed';
      this.results.chatFlow.error = error.message;
    }
  }

  printSummary() {
    log('\n' + '='.repeat(50), 'bold');
    log('📊 INTEGRATION TEST SUMMARY', 'bold');
    log('='.repeat(50), 'bold');

    const tests = [
      { name: 'Python RAG API', result: this.results.pythonAPI },
      { name: 'Node.js Backend', result: this.results.nodeBackend },
      { name: 'React Frontend', result: this.results.frontend },
      { name: 'WebSocket Connection', result: this.results.websocket },
      { name: 'Complete Chat Flow', result: this.results.chatFlow }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach(test => {
      const status = test.result.status;
      const color = status === 'healthy' ? 'green' : 'red';
      const icon = status === 'healthy' ? '✅' : '❌';
      
      log(`${icon} ${test.name}: ${status.toUpperCase()}`, color);
      
      if (status === 'healthy') {
        passedTests++;
      } else if (test.result.error) {
        log(`   Error: ${test.result.error}`, 'red');
      }
    });

    log('\n' + '='.repeat(50), 'bold');
    log(`🎯 Results: ${passedTests}/${totalTests} tests passed`, 
         passedTests === totalTests ? 'green' : 'yellow');
    
    if (passedTests === totalTests) {
      log('🎉 All systems are working correctly!', 'green');
      log('\n🌐 Service URLs:', 'blue');
      log(`   Python RAG API: ${testConfig.pythonAPI}`, 'yellow');
      log(`   Node.js Backend: ${testConfig.nodeBackend}`, 'yellow');
      log(`   React Frontend: ${testConfig.frontend}`, 'yellow');
    } else {
      log('⚠️  Some tests failed. Check the errors above.', 'red');
      log('\n🔧 Troubleshooting tips:', 'blue');
      log('   1. Ensure all services are running', 'yellow');
      log('   2. Check if ports are available', 'yellow');
      log('   3. Check service logs for errors', 'yellow');
    }
    
    log('='.repeat(50), 'bold');
  }

  async runAllTests() {
    log('🚀 Starting Integration Tests...', 'bold');
    log('Testing Sri Lanka Government Acts RAG System', 'blue');
    
    await this.testPythonAPI();
    await this.testNodeBackend();
    await this.testFrontend();
    await this.testWebSocket();
    await this.testChatFlow();
    
    this.printSummary();
  }
}

// Run the tests
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
