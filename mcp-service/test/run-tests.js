#!/usr/bin/env node

/**
 * MCP Service Test Runner
 * 
 * This script runs all available tests for the MCP service
 * and provides options for different test types.
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPTestRunner {
  constructor() {
    this.testTypes = {
      unit: 'Unit tests for individual tools (no services required)',
      e2e: 'End-to-end tests (requires all services running)',
      all: 'Run both unit and e2e tests'
    };
  }

  async runUnitTests() {
    console.log('🧪 Running Unit Tests...');
    console.log('========================');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['test/unit-test.js'], {
        cwd: __dirname + '/..',
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Unit tests completed successfully');
          resolve();
        } else {
          console.log('\n❌ Unit tests failed');
          reject(new Error(`Unit tests failed with code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runE2ETests() {
    console.log('🧪 Running End-to-End Tests...');
    console.log('===============================');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['test/e2e-test.js'], {
        cwd: __dirname + '/..',
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ E2E tests completed successfully');
          resolve();
        } else {
          console.log('\n❌ E2E tests failed');
          reject(new Error(`E2E tests failed with code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runAllTests() {
    console.log('🧪 Running All Tests...');
    console.log('=======================');
    
    try {
      await this.runUnitTests();
      console.log('\n' + '='.repeat(50) + '\n');
      await this.runE2ETests();
      console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log('MCP Service Test Runner');
    console.log('=======================');
    console.log('');
    console.log('Usage: node test/run-tests.js [test-type]');
    console.log('');
    console.log('Available test types:');
    Object.entries(this.testTypes).forEach(([type, description]) => {
      console.log(`  ${type.padEnd(8)} - ${description}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node test/run-tests.js unit    # Run only unit tests');
    console.log('  node test/run-tests.js e2e     # Run only e2e tests');
    console.log('  node test/run-tests.js all     # Run all tests');
    console.log('  node test/run-tests.js         # Show this help');
  }

  async run(testType) {
    switch (testType) {
      case 'unit':
        await this.runUnitTests();
        break;
      case 'e2e':
        await this.runE2ETests();
        break;
      case 'all':
        await this.runAllTests();
        break;
      default:
        this.showHelp();
        break;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testType = process.argv[2];
  const runner = new MCPTestRunner();
  runner.run(testType).catch(console.error);
}

module.exports = MCPTestRunner;
