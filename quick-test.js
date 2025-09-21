#!/usr/bin/env node

/**
 * Quick Test for Sri Lanka Government Acts RAG System
 * This script tests the basic functionality
 */

const axios = require('axios');

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

async function testPythonAPI() {
  log('\n🐍 Testing Python RAG API...', 'blue');
  
  try {
    const response = await axios.get('http://localhost:8000/health', { timeout: 10000 });
    if (response.status === 200) {
      log('✅ Python API health check passed', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Python API test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testNodeBackend() {
  log('\n🟢 Testing Node.js Backend...', 'blue');
  
  try {
    const response = await axios.get('http://localhost:5001/api/health', { timeout: 10000 });
    if (response.status === 200) {
      log('✅ Node.js backend health check passed', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Node.js backend test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testChatFlow() {
  log('\n💬 Testing Chat Flow...', 'blue');
  
  try {
    const response = await axios.post('http://localhost:5001/api/chat/message', {
      message: 'What is the Civil Aviation Act?'
    }, {
      timeout: 60000, // 60 seconds for RAG processing
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.success) {
      log('✅ Chat flow working', 'green');
      log(`📝 Response: ${response.data.data.response.substring(0, 100)}...`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Chat flow test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Quick Test for Sri Lanka Government Acts RAG System', 'bold');
  
  const pythonOK = await testPythonAPI();
  const nodeOK = await testNodeBackend();
  const chatOK = await testChatFlow();
  
  log('\n' + '='.repeat(50), 'bold');
  log('📊 QUICK TEST SUMMARY', 'bold');
  log('='.repeat(50), 'bold');
  
  log(`${pythonOK ? '✅' : '❌'} Python RAG API: ${pythonOK ? 'HEALTHY' : 'FAILED'}`, pythonOK ? 'green' : 'red');
  log(`${nodeOK ? '✅' : '❌'} Node.js Backend: ${nodeOK ? 'HEALTHY' : 'FAILED'}`, nodeOK ? 'green' : 'red');
  log(`${chatOK ? '✅' : '❌'} Chat Flow: ${chatOK ? 'WORKING' : 'FAILED'}`, chatOK ? 'green' : 'red');
  
  const passedTests = [pythonOK, nodeOK, chatOK].filter(Boolean).length;
  const totalTests = 3;
  
  log('\n' + '='.repeat(50), 'bold');
  log(`🎯 Results: ${passedTests}/${totalTests} tests passed`, 
       passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All systems are working correctly!', 'green');
    log('\n🌐 Service URLs:', 'blue');
    log('   🐍 Python RAG API:    http://localhost:8000', 'yellow');
    log('   🟢 Node.js Backend:   http://localhost:5001', 'yellow');
    log('   ⚛️ React Frontend:    http://localhost:5173', 'yellow');
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'red');
  }
  
  log('='.repeat(50), 'bold');
}

runTests().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
