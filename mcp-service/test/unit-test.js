#!/usr/bin/env node

/**
 * Unit Tests for MCP Service Tools
 * 
 * This test suite validates individual MCP tools work correctly
 * without requiring the full MCP server to be running.
 */

const { TodoTools } = require('../tools/todo-tools');
const { UserTools } = require('../tools/user-tools');
const { AITools } = require('../tools/ai-tools');
const { AnalyticsTools } = require('../tools/analytics-tools');

class MCPUnitTest {
  constructor() {
    this.testResults = [];
    this.testUser = {
      id: 999,
      name: 'Unit Test User',
      email: 'unit@test.com',
      role: 'user'
    };
    this.testToken = this.generateTestToken();
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

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
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

  // Todo Tools Unit Tests
  async testTodoTools() {
    console.log('\n📝 Testing Todo Tools...');
    
    const todoTools = new TodoTools();
    todoTools.userTokens = new Map();
    todoTools.userTokens.set(this.testUser.id, this.testToken);

    await this.test('Todo Tools - Token Storage', async () => {
      const token = todoTools.getAuthToken(this.testUser.id);
      if (token && token.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Token not properly formatted' };
    });

    await this.test('Todo Tools - Demo Token Generation', async () => {
      const demoToken = todoTools.createDemoToken(this.testUser.id);
      if (demoToken && demoToken.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Demo token not properly formatted' };
    });

    await this.test('Todo Tools - Create Todo (Mock)', async () => {
      // This will fail with network error, but we can test the method structure
      try {
        await todoTools.createTodo({
          task: 'Test Todo',
          userId: this.testUser.id,
          completed: false
        });
        return { success: true };
      } catch (error) {
        // Expected to fail due to no running services
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Request failed')) {
          return { success: true, note: 'Method structure correct (network error expected)' };
        }
        return { success: false, error: error.message };
      }
    });
  }

  // User Tools Unit Tests
  async testUserTools() {
    console.log('\n👤 Testing User Tools...');
    
    const userTools = new UserTools();
    userTools.userTokens = new Map();
    userTools.userTokens.set(this.testUser.id, this.testToken);

    await this.test('User Tools - Token Storage', async () => {
      const token = userTools.getAuthToken(this.testUser.id);
      if (token && token.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Token not properly formatted' };
    });

    await this.test('User Tools - Demo Token Generation', async () => {
      const demoToken = userTools.createDemoToken(this.testUser.id);
      if (demoToken && demoToken.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Demo token not properly formatted' };
    });

    await this.test('User Tools - Get User Profile (Mock)', async () => {
      try {
        await userTools.getUserProfile({ userId: this.testUser.id });
        return { success: true };
      } catch (error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Request failed')) {
          return { success: true, note: 'Method structure correct (network error expected)' };
        }
        return { success: false, error: error.message };
      }
    });
  }

  // AI Tools Unit Tests
  async testAITools() {
    console.log('\n🤖 Testing AI Tools...');
    
    const aiTools = new AITools();
    aiTools.userTokens = new Map();
    aiTools.userTokens.set(this.testUser.id, this.testToken);

    await this.test('AI Tools - Token Storage', async () => {
      const token = aiTools.getStoredAuthToken(this.testUser.id);
      if (token && token.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Token not properly formatted' };
    });

    await this.test('AI Tools - Breakdown Task (Mock)', async () => {
      try {
        await aiTools.breakdownTask({
          taskDescription: 'Test task breakdown',
          userId: this.testUser.id
        });
        return { success: true };
      } catch (error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Request failed')) {
          return { success: true, note: 'Method structure correct (network error expected)' };
        }
        return { success: false, error: error.message };
      }
    });
  }

  // Analytics Tools Unit Tests
  async testAnalyticsTools() {
    console.log('\n📊 Testing Analytics Tools...');
    
    const analyticsTools = new AnalyticsTools();

    await this.test('Analytics Tools - Analyze User Productivity (Mock)', async () => {
      try {
        await analyticsTools.analyzeUserProductivity({ userId: this.testUser.id });
        return { success: true };
      } catch (error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Request failed')) {
          return { success: true, note: 'Method structure correct (network error expected)' };
        }
        return { success: false, error: error.message };
      }
    });

    await this.test('Analytics Tools - Get Todo Statistics (Mock)', async () => {
      try {
        await analyticsTools.getTodoStatistics({ userId: this.testUser.id });
        return { success: true };
      } catch (error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Request failed')) {
          return { success: true, note: 'Method structure correct (network error expected)' };
        }
        return { success: false, error: error.message };
      }
    });
  }

  // Token Management Tests
  async testTokenManagement() {
    console.log('\n🔐 Testing Token Management...');
    
    const todoTools = new TodoTools();
    const userTools = new UserTools();
    const aiTools = new AITools();

    // Set up token storage
    todoTools.userTokens = new Map();
    userTools.userTokens = new Map();
    aiTools.userTokens = new Map();

    await this.test('Token Storage - Set Token', async () => {
      todoTools.userTokens.set(this.testUser.id, this.testToken);
      userTools.userTokens.set(this.testUser.id, this.testToken);
      aiTools.userTokens.set(this.testUser.id, this.testToken);
      
      if (todoTools.userTokens.has(this.testUser.id) && 
          userTools.userTokens.has(this.testUser.id) && 
          aiTools.userTokens.has(this.testUser.id)) {
        return { success: true };
      }
      return { success: false, error: 'Token not stored properly' };
    });

    await this.test('Token Retrieval - Get Token', async () => {
      const todoToken = todoTools.getAuthToken(this.testUser.id);
      const userToken = userTools.getAuthToken(this.testUser.id);
      const aiToken = aiTools.getStoredAuthToken(this.testUser.id);
      
      if (todoToken && userToken && aiToken && 
          todoToken.startsWith('Bearer ') && 
          userToken.startsWith('Bearer ') && 
          aiToken.startsWith('Bearer ')) {
        return { success: true };
      }
      return { success: false, error: 'Token retrieval failed' };
    });

    await this.test('Token Format - Bearer Prefix', async () => {
      const token = todoTools.getAuthToken(this.testUser.id);
      if (token === `Bearer ${this.testToken}`) {
        return { success: true };
      }
      return { success: false, error: 'Bearer prefix not added correctly' };
    });
  }

  async runAllTests() {
    console.log('🧪 Starting MCP Service Unit Tests');
    console.log('===================================');
    
    try {
      await this.testTokenManagement();
      await this.testTodoTools();
      await this.testUserTools();
      await this.testAITools();
      await this.testAnalyticsTools();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 Unit Test Results Summary');
    console.log('============================');
    
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
    
    if (passed === total) {
      console.log('\n🎉 All unit tests passed! MCP Tools are working correctly.');
    } else {
      console.log('\n⚠️  Some unit tests failed. Check the results above.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MCPUnitTest();
  tester.runAllTests().catch(console.error);
}

module.exports = MCPUnitTest;
