const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Set environment variables directly to avoid dotenv issues
process.env.MCP_SERVER_PORT = process.env.MCP_SERVER_PORT || '3009';
process.env.MCP_SERVER_HOST = process.env.MCP_SERVER_HOST || 'localhost';
process.env.USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
process.env.TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3008';
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';
process.env.LOGGER_SERVICE_URL = process.env.LOGGER_SERVICE_URL || 'http://localhost:3004';
process.env.MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005';
process.env.NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
process.env.API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { TodoTools } = require('./tools/todo-tools');
const { UserTools } = require('./tools/user-tools');
const { AnalyticsTools } = require('./tools/analytics-tools');
const { AITools } = require('./tools/ai-tools');

class MicroservicesMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "microservices-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Token storage for demo purposes
    this.userTokens = new Map();

    // Initialize tools
    this.todoTools = new TodoTools();
    this.userTools = new UserTools();
    this.analyticsTools = new AnalyticsTools();
    this.aiTools = new AITools();
    
    // Pass token storage to all tools
    this.todoTools.userTokens = this.userTokens;
    this.aiTools.userTokens = this.userTokens;

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Todo Management Tools
        {
          name: "create_todo",
          description: "Create a new todo item for a user",
          inputSchema: {
            type: "object",
            properties: {
              task: { type: "string", description: "Todo task description" },
              userId: { type: "number", description: "User ID" },
              completed: { type: "boolean", description: "Completion status", default: false }
            },
            required: ["task", "userId"]
          }
        },
        {
          name: "get_user_todos",
          description: "Get all todos for a specific user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" },
              completed: { type: "boolean", description: "Filter by completion status" }
            },
            required: ["userId"]
          }
        },
        {
          name: "update_todo",
          description: "Update an existing todo item",
          inputSchema: {
            type: "object",
            properties: {
              todoId: { type: "string", description: "Todo ID" },
              userId: { type: "number", description: "User ID" },
              task: { type: "string", description: "Updated task description" },
              completed: { type: "boolean", description: "Updated completion status" }
            },
            required: ["todoId", "userId"]
          }
        },
        {
          name: "delete_todo",
          description: "Delete a todo item",
          inputSchema: {
            type: "object",
            properties: {
              todoId: { type: "string", description: "Todo ID" },
              userId: { type: "number", description: "User ID" }
            },
            required: ["todoId", "userId"]
          }
        },
        {
          name: "complete_todo",
          description: "Mark a todo as completed",
          inputSchema: {
            type: "object",
            properties: {
              todoId: { type: "string", description: "Todo ID" },
              userId: { type: "number", description: "User ID" }
            },
            required: ["todoId", "userId"]
          }
        },

        // User Management Tools
        {
          name: "get_user_profile",
          description: "Get user profile information",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" }
            },
            required: ["userId"]
          }
        },
        {
          name: "update_user_profile",
          description: "Update user profile information",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" },
              name: { type: "string", description: "User name" },
              email: { type: "string", description: "User email" },
              role: { type: "string", description: "User role" }
            },
            required: ["userId"]
          }
        },
        {
          name: "get_all_users",
          description: "Get all users in the system",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Analytics Tools
        {
          name: "analyze_user_productivity",
          description: "Analyze user's productivity patterns and statistics",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" },
              timeframe: { type: "string", description: "Analysis timeframe (week, month, year)", default: "month" }
            },
            required: ["userId"]
          }
        },
        {
          name: "get_todo_statistics",
          description: "Get comprehensive todo statistics for a user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" }
            },
            required: ["userId"]
          }
        },
        {
          name: "suggest_productivity_improvements",
          description: "Get AI-powered productivity improvement suggestions",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" }
            },
            required: ["userId"]
          }
        },

        // AI Tools
        {
          name: "breakdown_task",
          description: "Break down a large task into smaller todos using AI",
          inputSchema: {
            type: "object",
            properties: {
              taskDescription: { type: "string", description: "Description of the large task to break down" },
              userId: { type: "number", description: "User ID for authentication" }
            },
            required: ["taskDescription", "userId"]
          }
        },
        {
          name: "analyze_todos_with_ai",
          description: "Get AI analysis of user's todos",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID for authentication" }
            },
            required: ["userId"]
          }
        },
        {
          name: "get_user_insights",
          description: "Get personalized user insights using AI",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID for authentication" }
            },
            required: ["userId"]
          }
        },
        {
          name: "get_todo_suggestions",
          description: "Get AI-powered todo suggestions for a user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID for authentication" }
            },
            required: ["userId"]
          }
        },

        // System Tools
        {
          name: "get_service_health",
          description: "Check health status of all microservices",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_ai_rate_limit_status",
          description: "Check AI service rate limit status for a user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" }
            },
            required: ["userId"]
          }
        },
        {
          name: "set_auth_token",
          description: "Set authentication token for a user (for testing purposes)",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" },
              token: { type: "string", description: "Authentication token" }
            },
            required: ["userId", "token"]
          }
        },
        {
          name: "get_auth_token",
          description: "Get authentication token for a user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "number", description: "User ID" }
            },
            required: ["userId"]
          }
        }
      ]
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "todos://user/{userId}",
          name: "User Todos",
          description: "All todos for a specific user",
          mimeType: "application/json"
        },
        {
          uri: "users://profile/{userId}",
          name: "User Profile",
          description: "User profile information",
          mimeType: "application/json"
        },
        {
          uri: "analytics://productivity/{userId}",
          name: "Productivity Analytics",
          description: "User productivity analytics and statistics",
          mimeType: "application/json"
        },
        {
          uri: "system://health",
          name: "System Health",
          description: "Health status of all microservices",
          mimeType: "application/json"
        }
      ]
    }));

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (uri.startsWith("todos://user/")) {
        const userId = uri.split("/")[2];
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(await this.todoTools.getUserTodos({ userId: parseInt(userId) }), null, 2)
            }
          ]
        };
      }
      
      if (uri.startsWith("users://profile/")) {
        const userId = uri.split("/")[2];
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(await this.userTools.getUserProfile({ userId: parseInt(userId) }), null, 2)
            }
          ]
        };
      }
      
      if (uri.startsWith("analytics://productivity/")) {
        const userId = uri.split("/")[2];
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(await this.analyticsTools.analyzeUserProductivity({ userId: parseInt(userId) }), null, 2)
            }
          ]
        };
      }
      
      if (uri === "system://health") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(await this.getServiceHealth(), null, 2)
            }
          ]
        };
      }
      
      throw new Error(`Unknown resource: ${uri}`);
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          // Todo Management
          case "create_todo":
            result = await this.todoTools.createTodo(args);
            break;
          case "get_user_todos":
            result = await this.todoTools.getUserTodos(args);
            break;
          case "update_todo":
            result = await this.todoTools.updateTodo(args);
            break;
          case "delete_todo":
            result = await this.todoTools.deleteTodo(args);
            break;
          case "complete_todo":
            result = await this.todoTools.completeTodo(args);
            break;
            
          // User Management
          case "get_user_profile":
            result = await this.userTools.getUserProfile(args);
            break;
          case "update_user_profile":
            result = await this.userTools.updateUserProfile(args);
            break;
          case "get_all_users":
            result = await this.userTools.getAllUsers(args);
            break;
            
          // Analytics
          case "analyze_user_productivity":
            result = await this.analyticsTools.analyzeUserProductivity(args);
            break;
          case "get_todo_statistics":
            result = await this.analyticsTools.getTodoStatistics(args);
            break;
          case "suggest_productivity_improvements":
            result = await this.analyticsTools.suggestProductivityImprovements(args);
            break;
            
          // AI Tools
          case "breakdown_task":
            result = await this.aiTools.breakdownTask(args);
            break;
          case "analyze_todos_with_ai":
            result = await this.aiTools.analyzeTodosWithAI(args);
            break;
          case "get_user_insights":
            result = await this.aiTools.getUserInsights(args);
            break;
          case "get_todo_suggestions":
            result = await this.aiTools.getTodoSuggestions(args);
            break;
            
          // System Tools
          case "get_service_health":
            result = await this.getServiceHealth();
            break;
          case "get_ai_rate_limit_status":
            result = await this.aiTools.getRateLimitStatus(args);
            break;
          case "set_auth_token":
            result = await this.setAuthToken(args);
            break;
          case "get_auth_token":
            result = await this.getAuthToken(args);
            break;
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async getServiceHealth() {
    const services = {
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3001',
      'todo-service': process.env.TODO_SERVICE_URL || 'http://localhost:3002',
      'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:3008',
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
      'logger-service': process.env.LOGGER_SERVICE_URL || 'http://localhost:3004',
      'messaging-service': process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
      'api-gateway': process.env.API_GATEWAY_URL || 'http://localhost:3000'
    };

    const healthStatus = {};
    
    for (const [serviceName, serviceUrl] of Object.entries(services)) {
      try {
        const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
        healthStatus[serviceName] = {
          status: 'healthy',
          url: serviceUrl,
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
      } catch (error) {
        healthStatus[serviceName] = {
          status: 'unhealthy',
          url: serviceUrl,
          error: error.message
        };
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      services: healthStatus,
      overallStatus: Object.values(healthStatus).every(s => s.status === 'healthy') ? 'healthy' : 'degraded'
    };
  }

  async setAuthToken({ userId, token }) {
    try {
      this.userTokens.set(userId, token);
      return {
        success: true,
        message: `Auth token set for user ${userId}`,
        userId: userId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to set auth token'
      };
    }
  }

  async getAuthToken({ userId }) {
    try {
      const token = this.userTokens.get(userId);
      if (token) {
        return {
          success: true,
          data: { userId, token },
          message: 'Auth token retrieved successfully'
        };
      } else {
        return {
          success: false,
          message: `No auth token found for user ${userId}`,
          suggestion: 'Use set_auth_token tool to set a token first'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get auth token'
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Note: No console.log in MCP servers as it interferes with JSON protocol
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new MicroservicesMCPServer();
  server.start().catch((error) => {
    // Don't output errors to console in MCP server as it interferes with JSON protocol
    process.exit(1);
  });
}

module.exports = MicroservicesMCPServer;
