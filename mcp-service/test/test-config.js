/**
 * Test Configuration for MCP Service
 * 
 * Centralized configuration for all test suites
 */

module.exports = {
  // Test user configuration
  testUser: {
    id: 999,
    name: 'E2E Test User',
    email: 'e2e@test.com',
    role: 'user'
  },

  // Service URLs
  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    todoService: process.env.TODO_SERVICE_URL || 'http://localhost:3002',
    aiService: process.env.AI_SERVICE_URL || 'http://localhost:3008',
    mcpService: process.env.MCP_SERVICE_URL || 'http://localhost:3009',
    loggerService: process.env.LOGGER_SERVICE_URL || 'http://localhost:3004',
    messagingService: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006'
  },

  // Test timeouts
  timeouts: {
    serverStartup: 10000,  // 10 seconds
    testExecution: 30000,  // 30 seconds
    networkRequest: 10000  // 10 seconds
  },

  // Test data
  testData: {
    todo: {
      task: 'E2E Test Todo',
      completed: false
    },
    taskBreakdown: {
      description: 'Plan a birthday party'
    },
    userUpdate: {
      name: 'Updated Test User',
      role: 'admin'
    }
  },

  // Expected responses
  expectedResponses: {
    success: {
      status: 200,
      hasData: true
    },
    error: {
      status: [400, 401, 404, 500],
      hasError: true
    }
  },

  // Test flags
  flags: {
    skipNetworkTests: process.env.SKIP_NETWORK_TESTS === 'true',
    verbose: process.env.VERBOSE_TESTS === 'true',
    cleanup: process.env.CLEANUP_TEST_DATA !== 'false'
  }
};
