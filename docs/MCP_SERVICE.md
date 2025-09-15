# MCP Service Documentation

## Overview

The MCP (Model Context Protocol) Service provides AI models with direct access to your microservices architecture, enabling powerful AI-driven interactions with your todo and user management systems. This service acts as a bridge between AI models and your microservices, providing standardized tool interfaces and comprehensive error handling.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Models     │    │   MCP Server    │    │ Microservices   │
│                 │────│                 │────│                 │
│ Claude, GPT,    │    │ Port 3009       │    │ Ports 3001-3008 │
│ etc.            │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ HTTP Server     │
                       │ (for testing)   │
                       └─────────────────┘
```

## Features

### Core MCP Features
- **Model Context Protocol**: Standardized interface for AI model integration
- **Tool Management**: 25+ tools for comprehensive microservice interaction
- **Resource Access**: Direct access to todos, users, analytics, and system health
- **Authentication**: Built-in JWT token management system
- **Error Handling**: Comprehensive error handling and validation
- **Health Monitoring**: Real-time service health status monitoring

### Tool Categories

#### 1. Todo Management Tools (5 tools)
- **create_todo**: Create new todo items with authentication
- **get_user_todos**: Retrieve all todos for a user (supports filtering by completion status)
- **update_todo**: Update existing todo items with authentication
- **delete_todo**: Delete todo items with authentication
- **complete_todo**: Mark todos as completed with authentication

#### 2. User Management Tools (3 tools)
- **get_user_profile**: Get user profile information
- **update_user_profile**: Update user profiles
- **get_all_users**: Retrieve all users in the system

#### 3. Analytics Tools (3 tools)
- **analyze_user_productivity**: Analyze user productivity patterns and trends
- **get_todo_statistics**: Get comprehensive todo statistics and metrics
- **suggest_productivity_improvements**: AI-powered productivity suggestions

#### 4. AI Tools (4 tools)
- **breakdown_task**: Break down large tasks into smaller, manageable todos
- **analyze_todos_with_ai**: AI analysis of user todos and patterns
- **get_user_insights**: Personalized user insights and recommendations
- **get_todo_suggestions**: AI-powered todo suggestions based on user behavior

#### 5. Vector Search Tools (7 tools) ⭐ **NEW**
- **search_similar_todos**: Search for similar todos using semantic similarity
- **search_ai_content**: Search for similar AI-generated content
- **get_contextual_suggestions**: Get contextual suggestions based on user behavior
- **generate_embedding**: Generate embedding vector for text
- **store_todo_embedding**: Store embedding for a todo item
- **store_ai_content_embedding**: Store embedding for AI-generated content
- **get_vector_service_health**: Check health status of vector service

#### 6. System Tools (4 tools)
- **get_service_health**: Check health status of all microservices
- **get_ai_rate_limit_status**: Check AI service rate limits for users
- **set_auth_token**: Set authentication tokens for users
- **get_auth_token**: Retrieve stored authentication tokens

## API Endpoints

### Base URL
- **MCP Server**: `http://localhost:3009` (for AI model integration)
- **HTTP Server**: `http://localhost:3009` (for testing and development)

### MCP Protocol Endpoints

#### 1. List Tools
**GET** `/tools`

Returns all available MCP tools with their schemas.

**Response:**
```json
{
  "tools": [
    {
      "name": "create_todo",
      "description": "Create a new todo item",
      "inputSchema": {
        "type": "object",
        "properties": {
          "task": { "type": "string" },
          "userId": { "type": "number" },
          "completed": { "type": "boolean" }
        },
        "required": ["task", "userId"]
      }
    }
  ]
}
```

#### 2. Call Tool
**POST** `/tools/call`

Execute an MCP tool with the provided parameters.

**Request Body:**
```json
{
  "name": "create_todo",
  "arguments": {
    "task": "Review project documentation",
    "userId": 123,
    "completed": false
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Todo created successfully: Review project documentation"
    }
  ]
}
```

#### 3. List Resources
**GET** `/resources`

Returns all available MCP resources.

**Response:**
```json
{
  "resources": [
    {
      "uri": "todos://user/123",
      "name": "User Todos",
      "description": "All todos for user 123",
      "mimeType": "application/json"
    }
  ]
}
```

#### 4. Read Resource
**GET** `/resources/read`

Read data from an MCP resource.

**Request Body:**
```json
{
  "uri": "todos://user/123"
}
```

**Response:**
```json
{
  "contents": [
    {
      "uri": "todos://user/123",
      "mimeType": "application/json",
      "text": "[{\"id\":1,\"task\":\"Review docs\",\"completed\":false}]"
    }
  ]
}
```

### HTTP Server Endpoints (for testing)

#### 1. Health Check
**GET** `/health`

Check MCP server health status.

**Response:**
```json
{
  "status": "OK",
  "service": "MCP Server",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "tools": 25,
  "resources": 4
}
```

#### 2. Service Info
**GET** `/info`

Get comprehensive service information.

**Response:**
```json
{
  "service": "MCP Server",
  "version": "1.0.0",
  "description": "Model Context Protocol server for microservices integration",
  "tools": 25,
  "resources": 4,
  "connectedServices": [
    "User Service",
    "Todo Service",
    "AI Service",
    "Vector Service",
    "Auth Service"
  ]
}
```

#### 3. Test Endpoint
**GET** `/test`

Test MCP server functionality.

**Response:**
```json
{
  "status": "OK",
  "message": "MCP server is working correctly",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Configuration

### Environment Variables

Create a `.env` file in the `mcp-service` directory:

```env
# Service Configuration
PORT=3009
NODE_ENV=development

# Microservice URLs
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
AUTH_SERVICE_URL=http://localhost:3007
AI_SERVICE_URL=http://localhost:3008
VECTOR_SERVICE_URL=http://localhost:3010
MESSAGING_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3004
API_GATEWAY_URL=http://localhost:3000

# Logger Configuration
LOG_LEVEL=info
```

### Service Dependencies

The MCP server connects to these microservices:

- **User Service**: `http://localhost:3001`
- **Todo Service**: `http://localhost:3002`
- **AI Service**: `http://localhost:3008`
- **Vector Service**: `http://localhost:3010`
- **Auth Service**: `http://localhost:3007`
- **Messaging Service**: `http://localhost:3006`
- **Notification Service**: `http://localhost:3004`
- **API Gateway**: `http://localhost:3000`

## Installation & Setup

1. **Navigate to MCP Service Directory:**
   ```bash
   cd mcp-service
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Service:**
   ```bash
   # For AI model integration (MCP protocol)
   npm start
   
   # For testing and development (HTTP server)
   npm run http
   ```

## Usage Examples

### AI Model Integration

#### Example: Creating Todos via AI
```javascript
// AI model can call MCP tools directly
const result = await mcpClient.callTool('create_todo', {
  task: 'Review project documentation',
  userId: 123,
  completed: false
});
```

#### Example: Analyzing Productivity
```javascript
// AI model can analyze user productivity
const analysis = await mcpClient.callTool('analyze_user_productivity', {
  userId: 123,
  timeframe: 'month'
});
```

#### Example: Task Breakdown
```javascript
// AI model can break down large tasks
const breakdown = await mcpClient.callTool('breakdown_task', {
  taskDescription: 'Build a full-stack web application',
  userId: 123
});
```

#### Example: Semantic Search
```javascript
// AI model can perform semantic search
const searchResults = await mcpClient.callTool('search_similar_todos', {
  query: 'financial planning tasks',
  userId: 123,
  limit: 10,
  threshold: 0.7
});
```

### HTTP Server Testing

#### cURL Examples
```bash
# Health check
curl http://localhost:3009/health

# Service info
curl http://localhost:3009/info

# Test functionality
curl http://localhost:3009/test

# List tools
curl http://localhost:3009/tools

# Call a tool
curl -X POST http://localhost:3009/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_service_health",
    "arguments": {}
  }'
```

## Authentication System

### Token Management
The MCP server includes a built-in authentication system:

```javascript
// Set a token for a user
await mcpClient.callTool('set_auth_token', {
  userId: 123,
  token: 'Bearer your-jwt-token-here'
});

// Get stored token
await mcpClient.callTool('get_auth_token', {
  userId: 123
});
```

### Demo Mode
If no token is provided, the server automatically generates demo tokens for testing purposes.

## Integration with AI Models

### Claude Integration
```javascript
// Connect Claude to MCP server
const mcpClient = new MCPClient({
  serverUrl: 'http://localhost:3009'
});

// Claude can now use all MCP tools
const todos = await mcpClient.callTool('get_user_todos', {
  userId: 123
});
```

### GPT Integration
```javascript
// Connect GPT to MCP server via HTTP
const response = await fetch('http://localhost:3009/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'create_todo',
    arguments: { task: 'New task', userId: 123 }
  })
});
```

## Testing

### Unit Tests
```bash
# Run unit tests (no services required)
npm run test:unit
```

### End-to-End Tests
```bash
# Run E2E tests (requires all services)
npm run test:e2e
```

### All Tests
```bash
# Run all tests
npm run test:all
```

### Test Coverage
- **Authentication Tests**: Token management and validation
- **Todo Tools Tests**: CRUD operations and filtering
- **User Tools Tests**: Profile management and user operations
- **AI Tools Tests**: Task breakdown and analysis
- **Vector Tools Tests**: Semantic search and embeddings
- **Analytics Tools Tests**: Productivity analysis and statistics
- **Service Health Tests**: Health monitoring and connectivity

## File Structure

```
mcp-service/
├── mcp-server.js          # Main MCP server implementation
├── http-server.js         # HTTP wrapper for testing
├── test-mcp.js           # Automated testing script
├── package.json          # Dependencies and scripts
├── tools/                # MCP tool implementations
│   ├── todo-tools.js     # Todo management tools
│   ├── user-tools.js     # User management tools
│   ├── analytics-tools.js # Analytics and insights
│   ├── ai-tools.js       # AI-powered features
│   └── vector-tools.js   # Vector search tools
└── test/                 # Testing suite
    ├── unit-test.js      # Unit tests
    ├── e2e-test.js       # End-to-end tests
    ├── run-tests.js      # Test runner
    └── test-report.json  # Test reports
```

## Security Considerations

- **Token-based Authentication**: Secure JWT token management
- **Rate Limiting**: Built-in rate limiting for AI service calls
- **Error Handling**: No sensitive information exposed in error messages
- **Input Validation**: All service calls are validated and sanitized
- **Demo Mode**: Safe testing with automatically generated tokens

## Performance Considerations

- **Connection Pooling**: Efficient database connections
- **Caching**: Response caching for frequently accessed data
- **Error Recovery**: Automatic retry mechanisms for failed requests
- **Resource Management**: Proper cleanup of resources and connections

## Monitoring & Logging

The service provides comprehensive logging:

- **Request Logging**: All incoming MCP tool calls
- **Response Logging**: Tool execution results and errors
- **Error Logging**: Detailed error information for debugging
- **Performance Logging**: Tool execution times and resource usage

## Troubleshooting

### Common Issues

1. **Service Connection Issues**
   - Check if all microservices are running
   - Verify service URLs in configuration
   - Test connectivity with curl commands

2. **Authentication Errors**
   - Verify token format and user ID
   - Check if auth service is running
   - Ensure Bearer prefix is included

3. **Rate Limit Errors**
   - Check AI service rate limits
   - Monitor request frequency
   - Implement proper retry logic

4. **Port Conflicts**
   - Ensure ports 3001-3009 are available
   - Check for conflicting services
   - Update configuration if needed

### Debug Mode

For detailed debugging:
- Check service logs for error messages
- Verify network connectivity between services
- Test individual tool calls with curl
- Monitor service health endpoints

## Future Enhancements

- **Additional Tools**: More microservice integration tools
- **Real-time Updates**: WebSocket support for live data
- **Advanced Analytics**: Enhanced productivity insights
- **Custom Models**: Support for custom AI models
- **Batch Operations**: Bulk operations for efficiency
- **Caching Layer**: Redis integration for response caching

## Contributing

When extending the MCP server:

1. **Add New Tools**: Create new methods in the respective tool classes
2. **Update Tool List**: Add tool definitions in `mcp-server.js`
3. **Add Resources**: Add corresponding resource handlers if needed
4. **Add Tests**: Create unit and E2E tests for new functionality
5. **Update Documentation**: Update this documentation with new features

## Support

This MCP server is designed to work with your existing microservices architecture. Make sure all your services are running before starting the MCP server.

### Health Checks
```bash
# Check MCP server health
curl http://localhost:3009/health

# Check all services via API Gateway
curl http://localhost:3000/health
```

The MCP server is now ready to provide AI models with powerful, direct access to your microservices! 🚀