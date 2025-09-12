# MCP Server for Microservices Architecture

This MCP (Model Context Protocol) server provides AI models with direct access to your microservices architecture, enabling powerful AI-driven interactions with your todo and user management systems.

## 🚀 Features

### Todo Management Tools (5 tools)
- **create_todo**: Create new todo items with authentication
- **get_user_todos**: Retrieve all todos for a user (supports filtering by completion status)
- **update_todo**: Update existing todo items with authentication
- **delete_todo**: Delete todo items with authentication
- **complete_todo**: Mark todos as completed with authentication

### User Management Tools (3 tools)
- **get_user_profile**: Get user profile information
- **update_user_profile**: Update user profiles
- **get_all_users**: Retrieve all users in the system

### Analytics Tools (3 tools)
- **analyze_user_productivity**: Analyze user productivity patterns and trends
- **get_todo_statistics**: Get comprehensive todo statistics and metrics
- **suggest_productivity_improvements**: AI-powered productivity suggestions

### AI Tools (4 tools)
- **breakdown_task**: Break down large tasks into smaller, manageable todos
- **analyze_todos_with_ai**: AI analysis of user todos and patterns
- **get_user_insights**: Personalized user insights and recommendations
- **get_todo_suggestions**: AI-powered todo suggestions based on user behavior

### System Tools (4 tools)
- **get_service_health**: Check health status of all microservices
- **get_ai_rate_limit_status**: Check AI service rate limits for users
- **set_auth_token**: Set authentication tokens for users
- **get_auth_token**: Retrieve stored authentication tokens

## 📋 Resources

The MCP server provides access to the following resources:

- `todos://user/{userId}` - All todos for a specific user
- `users://profile/{userId}` - User profile information
- `analytics://productivity/{userId}` - User productivity analytics
- `system://health` - System health status

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the MCP Server

#### Option A: Standard MCP Server (for AI model integration)
```bash
npm start
```

#### Option B: HTTP Server (for testing and development)
```bash
npm run http
```

### 3. Test the Server
```bash
npm test
```

## 🔧 Configuration

The server connects to your existing microservices with these default URLs:

- **User Service**: `http://localhost:3001`
- **Todo Service**: `http://localhost:3002`
- **AI Service**: `http://localhost:3008`
- **Auth Service**: `http://localhost:3003`
- **Logger Service**: `http://localhost:3004`
- **Messaging Service**: `http://localhost:3005`
- **Notification Service**: `http://localhost:3006`
- **API Gateway**: `http://localhost:3000`

### Environment Variables
You can override the default URLs by setting environment variables:
```bash
export USER_SERVICE_URL=http://localhost:4001
export TODO_SERVICE_URL=http://localhost:4002
npm start
```

## 🔐 Authentication System

### Token Management
The MCP server includes a built-in authentication system:

```javascript
// Set a token for a user
await mcpClient.callTool('set_auth_token', {
  userId: 9,
  token: 'Bearer your-jwt-token-here'
});

// Get stored token
await mcpClient.callTool('get_auth_token', {
  userId: 9
});
```

### Demo Mode
If no token is provided, the server automatically generates demo tokens for testing purposes.

## 🤖 Usage with AI Models

### Example: Creating Todos via AI
```javascript
// AI model can call MCP tools directly
const result = await mcpClient.callTool('create_todo', {
  task: 'Review project documentation',
  userId: 123,
  completed: false
});
```

### Example: Analyzing Productivity
```javascript
// AI model can analyze user productivity
const analysis = await mcpClient.callTool('analyze_user_productivity', {
  userId: 123,
  timeframe: 'month'
});
```

### Example: Task Breakdown
```javascript
// AI model can break down large tasks
const breakdown = await mcpClient.callTool('breakdown_task', {
  taskDescription: 'Build a full-stack web application',
  userId: 123
});
```

### Example: Getting User Todos
```javascript
// Get all todos for a user
const todos = await mcpClient.callTool('get_user_todos', {
  userId: 123
});

// Get only completed todos
const completedTodos = await mcpClient.callTool('get_user_todos', {
  userId: 123,
  completed: true
});

// Get only pending todos
const pendingTodos = await mcpClient.callTool('get_user_todos', {
  userId: 123,
  completed: false
});
```

## 🔗 Integration

This MCP server integrates seamlessly with your existing microservices:

1. **Direct Service Communication**: Calls your microservices directly
2. **Authentication**: Handles auth tokens for all service calls
3. **Error Handling**: Comprehensive error handling and reporting
4. **Health Monitoring**: Monitors all service health status
5. **API Gateway Integration**: Included in gateway health checks

## 📊 Architecture

```
AI Models → MCP Server → Your Microservices
    ↓
AI Models ← MCP Server ← Your Microservices
```

The MCP server acts as a bridge between AI models and your microservices, providing:
- Standardized tool interfaces
- Error handling and validation
- Authentication management
- Resource access control

## 🚀 Benefits

- **Direct AI Access**: AI models can directly interact with your data
- **Enhanced Capabilities**: AI can perform complex operations across services
- **Real-time Data**: AI has access to live data from your microservices
- **Flexible Integration**: Works with any MCP-compatible AI model
- **Maintainable**: Clean separation between AI logic and service logic
- **Secure**: Built-in authentication and token management
- **Scalable**: Easy to extend with new tools and resources

## 🔒 Security

- **Token-based Authentication**: Secure JWT token management
- **Rate Limiting**: Built-in rate limiting for AI service calls
- **Error Handling**: No sensitive information exposed in error messages
- **Input Validation**: All service calls are validated and sanitized
- **Demo Mode**: Safe testing with automatically generated tokens

## 📝 Example Use Cases

1. **AI Todo Assistant**: AI can create, update, and manage todos based on natural language
2. **Productivity Coach**: AI can analyze patterns and suggest improvements
3. **Task Breakdown**: AI can break down complex tasks into manageable subtasks
4. **User Insights**: AI can provide personalized recommendations
5. **System Monitoring**: AI can monitor service health and alert on issues
6. **Analytics Dashboard**: AI can generate comprehensive productivity reports

## 🧪 Testing

### HTTP Server Testing
```bash
# Start HTTP server
npm run http

# Test endpoints
curl http://localhost:3009/health
curl http://localhost:3009/info
curl http://localhost:3009/test
```

### Automated Testing
```bash
# Run automated tests
npm test
```

## 🛠️ Development

To extend the MCP server:

1. **Add New Tools**: Create new methods in the respective tool classes
2. **Update Tool List**: Add tool definitions in `mcp-server.js`
3. **Add Resources**: Add corresponding resource handlers if needed
4. **Test Integration**: Test with your AI models

### File Structure
```
mcp-service/
├── mcp-server.js          # Main MCP server implementation
├── http-server.js         # HTTP wrapper for testing
├── test-mcp.js           # Automated testing script
├── package.json          # Dependencies and scripts
├── README.md             # This documentation
├── tools/                # MCP tool implementations
│   ├── todo-tools.js     # Todo management tools
│   ├── user-tools.js     # User management tools
│   ├── analytics-tools.js # Analytics and insights
│   └── ai-tools.js       # AI-powered features
└── docs/
    └── MCP_SERVICE.md    # Comprehensive technical documentation
```

## 📞 Support

This MCP server is designed to work with your existing microservices architecture. Make sure all your services are running before starting the MCP server.

### Troubleshooting

1. **Service Connection Issues**: Check if all microservices are running
2. **Authentication Errors**: Verify token format and user ID
3. **Rate Limit Errors**: Check AI service rate limits
4. **Port Conflicts**: Ensure ports 3001-3009 are available

### Health Checks
```bash
# Check MCP server health
curl http://localhost:3009/health

# Check all services via API Gateway
curl http://localhost:3000/health
```

## 🎯 Quick Start

1. **Install**: `npm install`
2. **Start**: `npm start` (for Claude) or `npm run http` (for testing)
3. **Test**: `npm test`
4. **Use**: Connect your AI model to the MCP server

The MCP server is now ready to provide AI models with powerful, direct access to your microservices! 🚀