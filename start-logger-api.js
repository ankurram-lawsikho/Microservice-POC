#!/usr/bin/env node

/**
 * Start Logger API Service
 * Runs the logger API service for log visualization
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Logger API Service...\n');

// Start Logger API
const loggerApi = spawn('node', ['log-api.js'], {
  cwd: path.join(__dirname, 'logger-service'),
  stdio: 'inherit',
  shell: true
});

loggerApi.on('error', (error) => {
  console.error('❌ Failed to start Logger API:', error.message);
  process.exit(1);
});

loggerApi.on('close', (code) => {
  console.log(`\n📝 Logger API service exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Logger API service...');
  loggerApi.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Logger API service...');
  loggerApi.kill('SIGTERM');
});

console.log('✅ Logger API service started on port 3011');
console.log('📊 Access the logger dashboard at: http://localhost:3000/logs');
console.log('🔗 Logger API endpoints: http://localhost:3011/api/logger');
console.log('\nPress Ctrl+C to stop the service');
