const express = require('express');
const cors = require('cors');
const MicroservicesMCPServer = require('./mcp-server');

const app = express();
const port = process.env.MCP_SERVER_PORT || 3009;

app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-service',
    port: port,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// MCP server info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: 'microservices-mcp-server',
    version: '1.0.0',
    description: 'MCP Server for Microservices Architecture',
    capabilities: {
      tools: [
        'create_todo', 'get_user_todos', 'update_todo', 'delete_todo', 'complete_todo',
        'get_user_profile', 'update_user_profile', 'get_all_users',
        'analyze_user_productivity', 'get_todo_statistics', 'suggest_productivity_improvements',
        'breakdown_task', 'analyze_todos_with_ai', 'get_user_insights', 'get_todo_suggestions',
        'get_service_health', 'get_ai_rate_limit_status'
      ],
      resources: [
        'todos://user/{userId}',
        'users://profile/{userId}',
        'analytics://productivity/{userId}',
        'system://health'
      ]
    },
    services: {
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3001',
      'todo-service': process.env.TODO_SERVICE_URL || 'http://localhost:3002',
      'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:3008',
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3003'
    }
  });
});

// Test endpoint to verify MCP server functionality
app.get('/test', async (req, res) => {
  try {
    const mcpServer = new MicroservicesMCPServer();
    const healthStatus = await mcpServer.getServiceHealth();
    
    res.json({
      status: 'success',
      message: 'MCP Server is working correctly',
      serviceHealth: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'MCP Server test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start HTTP server
app.listen(port, () => {
  console.log(`🚀 MCP HTTP Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`ℹ️  Server info: http://localhost:${port}/info`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
  console.log(`🔗 Connected to services:`);
  console.log(`   - User Service: ${process.env.USER_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`   - Todo Service: ${process.env.TODO_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`   - AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:3008'}`);
  console.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3003'}`);
});

module.exports = app;
