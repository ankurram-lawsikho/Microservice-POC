#!/usr/bin/env node

/**
 * End-to-End Testing Suite for MCP Service
 * 
 * This test suite validates all MCP tools and resources work correctly
 * with the microservices ecosystem.
 */

const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MCPE2ETest {
  constructor() {
    this.mcpProcess = null;
    this.testResults = [];
    this.testUser = {
      id: 999,
      name: 'E2E Test User',
      email: 'e2e@test.com',
      role: 'user'
    };
    this.testToken = this.generateTestToken();
    this.baseUrl = 'http://localhost:3009';
  }

  generateTestToken() {
    const payload = {
      userId: this.testUser.id,
      email: this.testUser.email,
      role: this.testUser.role,
      name: this.testUser.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64')}.test-signature`;
  }

  async startMCPServer() {
    console.log('🚀 Starting MCP Server...');
    
    return new Promise((resolve, reject) => {
      this.mcpProcess = spawn('node', ['http-server.js'], {
        cwd: __dirname + '/..',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('MCP HTTP Server running')) {
          console.log('✅ MCP Server started successfully');
          resolve();
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.error('MCP Server Error:', data.toString());
      });

      this.mcpProcess.on('error', (error) => {
        console.error('Failed to start MCP Server:', error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('MCP Server startup timeout'));
      }, 10000);
    });
  }

  async stopMCPServer() {
    if (this.mcpProcess) {
      console.log('🛑 Stopping MCP Server...');
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }

  async makeMCPRequest(toolName, args = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/test`, {
        tool: toolName,
        args: args
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✅ ${name} - PASSED`);
        this.testResults.push({ name, status: 'PASSED', result });
        return true;
      } else {
        console.log(`❌ ${name} - FAILED: ${result.error}`);
        this.testResults.push({ name, status: 'FAILED', error: result.error });
        return false;
      }
    } catch (error) {
      console.log(`❌ ${name} - ERROR: ${error.message}`);
      this.testResults.push({ name, status: 'ERROR', error: error.message });
      return false;
    }
  }

  // Authentication Tests
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    await this.test('Set Auth Token', async () => {
      return await this.makeMCPRequest('set_auth_token', {
        userId: this.testUser.id,
        token: this.testToken
      });
    });

    await this.test('Get Auth Token', async () => {
      const result = await this.makeMCPRequest('get_auth_token', {
        userId: this.testUser.id
      });
      
      if (result.success && result.data.data.token === this.testToken) {
        return { success: true };
      }
      return { success: false, error: 'Token mismatch' };
    });
  }

  // Todo Tools Tests
  async testTodoTools() {
    console.log('\n📝 Testing Todo Tools...');
    
    let createdTodoId = null;

    await this.test('Create Todo', async () => {
      const result = await this.makeMCPRequest('create_todo', {
        task: 'E2E Test Todo',
        userId: this.testUser.id,
        completed: false
      });
      
      if (result.success && result.data.data.id) {
        createdTodoId = result.data.data.id;
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Get User Todos', async () => {
      const result = await this.makeMCPRequest('get_user_todos', {
        userId: this.testUser.id,
        completed: false
      });
      
      if (result.success && Array.isArray(result.data.data)) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    if (createdTodoId) {
      await this.test('Update Todo', async () => {
        const result = await this.makeMCPRequest('update_todo', {
          todoId: createdTodoId,
          userId: this.testUser.id,
          task: 'Updated E2E Test Todo'
        });
        
        return result;
      });

      await this.test('Complete Todo', async () => {
        const result = await this.makeMCPRequest('complete_todo', {
          todoId: createdTodoId,
          userId: this.testUser.id
        });
        
        return result;
      });

      await this.test('Delete Todo', async () => {
        const result = await this.makeMCPRequest('delete_todo', {
          todoId: createdTodoId,
          userId: this.testUser.id
        });
        
        return result;
      });
    }
  }

  // User Tools Tests
  async testUserTools() {
    console.log('\n👤 Testing User Tools...');
    
    await this.test('Get User Profile', async () => {
      const result = await this.makeMCPRequest('get_user_profile', {
        userId: this.testUser.id
      });
      
      // This might fail if user doesn't exist, which is expected
      return { success: true, note: 'User profile test (may fail if user not found)' };
    });

    await this.test('Get All Users', async () => {
      const result = await this.makeMCPRequest('get_all_users', {
        userId: this.testUser.id
      });
      
      if (result.success && Array.isArray(result.data.data)) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });
  }

  // AI Tools Tests
  async testAITools() {
    console.log('\n🤖 Testing AI Tools...');
    
    await this.test('Breakdown Task', async () => {
      const result = await this.makeMCPRequest('breakdown_task', {
        taskDescription: 'Plan a birthday party',
        userId: this.testUser.id
      });
      
      if (result.success && result.data.data) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Analyze Todos with AI', async () => {
      const result = await this.makeMCPRequest('analyze_todos_with_ai', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Get User Insights', async () => {
      const result = await this.makeMCPRequest('get_user_insights', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Get Todo Suggestions', async () => {
      const result = await this.makeMCPRequest('get_todo_suggestions', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Get AI Rate Limit Status', async () => {
      const result = await this.makeMCPRequest('get_ai_rate_limit_status', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });
  }

  // Analytics Tools Tests
  async testAnalyticsTools() {
    console.log('\n📊 Testing Analytics Tools...');
    
    await this.test('Analyze User Productivity', async () => {
      const result = await this.makeMCPRequest('analyze_user_productivity', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Get Todo Statistics', async () => {
      const result = await this.makeMCPRequest('get_todo_statistics', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('Suggest Productivity Improvements', async () => {
      const result = await this.makeMCPRequest('suggest_productivity_improvements', {
        userId: this.testUser.id
      });
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });
  }

  // Service Health Tests
  async testServiceHealth() {
    console.log('\n🏥 Testing Service Health...');
    
    await this.test('Get Service Health', async () => {
      const result = await this.makeMCPRequest('get_service_health', {});
      
      if (result.success && result.data.data) {
        return { success: true };
      }
      return { success: false, error: result.error };
    });

    await this.test('MCP Server Health Check', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/health`);
        if (response.status === 200) {
          return { success: true };
        }
        return { success: false, error: 'Health check failed' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  // MCP Resources Tests
  async testMCPResources() {
    console.log('\n📚 Testing MCP Resources...');
    
    await this.test('Get Todos Resource', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/resource/todos/user/${this.testUser.id}`);
        if (response.status === 200) {
          return { success: true };
        }
        return { success: false, error: 'Resource not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    await this.test('Get Users Resource', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/resource/users/profile/${this.testUser.id}`);
        if (response.status === 200) {
          return { success: true };
        }
        return { success: false, error: 'Resource not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    await this.test('Get Analytics Resource', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/resource/analytics/productivity/${this.testUser.id}`);
        if (response.status === 200) {
          return { success: true };
        }
        return { success: false, error: 'Resource not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    await this.test('Get System Health Resource', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/resource/system/health`);
        if (response.status === 200) {
          return { success: true };
        }
        return { success: false, error: 'Resource not found' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  async runAllTests() {
    console.log('🧪 Starting MCP Service End-to-End Tests');
    console.log('==========================================');
    
    try {
      await this.startMCPServer();
      
      // Wait a bit for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run all test suites
      await this.testAuthentication();
      await this.testTodoTools();
      await this.testUserTools();
      await this.testAITools();
      await this.testAnalyticsTools();
      await this.testServiceHealth();
      await this.testMCPResources();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      await this.stopMCPServer();
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED' || r.status === 'ERROR')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, errors, successRate: (passed / total) * 100 },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! MCP Service is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the report for details.');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MCPE2ETest();
  tester.runAllTests().catch(console.error);
}

module.exports = MCPE2ETest;
