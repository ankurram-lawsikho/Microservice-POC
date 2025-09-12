#!/usr/bin/env node

/**
 * MCP Service Test Demo
 * 
 * This script demonstrates how to run the MCP service tests
 * and shows the different testing options available.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 MCP Service Testing Demo');
console.log('===========================');
console.log('');

console.log('This demo shows you how to test the MCP service:');
console.log('');

console.log('1. 📋 Unit Tests (No services required)');
console.log('   Tests individual tools and methods');
console.log('   Command: npm run test:unit');
console.log('');

console.log('2. 🔗 End-to-End Tests (All services required)');
console.log('   Tests complete integration with microservices');
console.log('   Command: npm run test:e2e');
console.log('');

console.log('3. 🎯 All Tests');
console.log('   Runs both unit and e2e tests');
console.log('   Command: npm run test:all');
console.log('');

console.log('4. 🎮 Interactive Test Runner');
console.log('   Choose which tests to run');
console.log('   Command: npm run test:run');
console.log('');

console.log('Prerequisites for E2E Tests:');
console.log('- All microservices must be running (ports 3000-3008)');
console.log('- Database connections must be available');
console.log('- Network connectivity to all services');
console.log('');

console.log('Let\'s run a quick unit test to demonstrate...');
console.log('');

// Run unit tests
const testProcess = spawn('npm', ['run', 'test:unit'], {
  cwd: __dirname,
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ Unit tests completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start all microservices');
    console.log('2. Run: npm run test:e2e');
    console.log('3. Or run: npm run test:all');
  } else {
    console.log('❌ Unit tests failed. Check the output above.');
  }
});

testProcess.on('error', (error) => {
  console.error('Failed to run tests:', error.message);
});
