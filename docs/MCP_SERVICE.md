# MCP Service Documentation

## Overview

The MCP (Model Context Protocol) Service provides AI models with direct access to your microservices architecture. It acts as a bridge between AI models and your existing services, enabling powerful AI-driven interactions with your todo and user management systems.

## 🏗️ Architecture

```
AI Models → MCP Server → Your Microservices
    ↓
AI Models ← MCP Server ← Your Microservices
```

The MCP server provides:
- **Standardized Tool Interfaces**: Consistent API for AI models to interact with your services
- **Resource Access**: Direct access to user data, todos, and analytics
- **Error Handling**: Comprehensive error handling and validation
- **Authentication**: Secure token management for service calls

## 🚀 Features

### Todo Management Tools
- `create_todo` - Create new todo items
- `get_user_todos` - Retrieve all todos for a user
- `update_todo` - Update existing todo items
- `delete_todo` - Delete todo items
- `complete_todo` - Mark todos as completed

### User Management Tools
- `get_user_profile` - Get user profile information
- `update_user_profile` - Update user profiles
- `get_all_users` - Retrieve all users in the system

### Analytics Tools
- `analyze_user_productivity` - Analyze user productivity patterns
- `get_todo_statistics` - Get comprehensive todo statistics
- `suggest_productivity_improvements` - AI-powered productivity suggestions

### AI Tools
- `breakdown_task` - Break down large tasks into smaller todos
- `analyze_todos_with_ai` - AI analysis of user todos
- `get_user_insights` - Personalized user insights
- `get_todo_suggestions` - AI-powered todo suggestions

### System Tools
- `get_service_health` - Check health of all microservices
- `get_ai_rate_limit_status` - Check AI service rate limits

## 📋 Resources

The MCP server provides access to the following resources:

- `todos://user/{userId}` - All todos for a specific user
- `users://profile/{userId}` - User profile information
- `analytics://productivity/{userId}` - User productivity analytics
- `system://health` - System health status

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd mcp-service
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your service URLs
```

### 3. Start the MCP Server

#### Option A: Standard MCP Server (for AI model integration)
```bash
npm start
```

#### Option B: HTTP Server (for testing and development)
```bash
npm run http
```

### 4. Test the Server
```bash
npm test
```

## 🔧 Configuration

### Environment Variables

```env
# MCP Server Configuration
MCP_SERVER_PORT=3009
MCP_SERVER_HOST=localhost

# Existing Microservices URLs
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
AI_SERVICE_URL=http://localhost:3008
AUTH_SERVICE_URL=http://localhost:3003
LOGGER_SERVICE_URL=http://localhost:3004
MESSAGING_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006

# API Gateway URL
API_GATEWAY_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## 🤖 Usage with AI Models

### Example: Creating Todos via AI

```javascript
// AI model can call MCP tools directly
const result = await mcpClient.callTool('create_todo', {
  task: 'Review project documentation',
  userId: 123,
  completed: false
});

console.log(result);
// Output: { success: true, data: {...}, message: 'Todo created successfully' }
```

### Example: Analyzing Productivity

```javascript
// AI model can analyze user productivity
const analysis = await mcpClient.callTool('analyze_user_productivity', {
  userId: 123,
  timeframe: 'month'
});

console.log(analysis.data.statistics);
// Output: { total: 25, completed: 20, pending: 5, completionRate: 80, ... }
```

### Example: Task Breakdown

```javascript
// AI model can break down large tasks
const breakdown = await mcpClient.callTool('breakdown_task', {
  taskDescription: 'Build a full-stack web application',
  userId: 123
});

console.log(breakdown.data.breakdown);
// Output: JSON array of smaller tasks
```

### Example: Getting User Insights

```javascript
// AI model can get personalized insights
const insights = await mcpClient.callTool('get_user_insights', {
  userId: 123
});

console.log(insights.data.insights);
// Output: Personalized productivity insights and recommendations
```

## 🔗 Integration with Existing Services

### Service Communication

The MCP server communicates directly with your existing microservices:

1. **User Service** (`http://localhost:3001`)
   - User profile management
   - User statistics
   - User creation and updates

2. **Todo Service** (`http://localhost:3002`)
   - Todo CRUD operations
   - Todo filtering and search
   - Todo completion tracking

3. **AI Service** (`http://localhost:3008`)
   - AI-powered analysis
   - Task breakdown
   - User insights generation

4. **Auth Service** (`http://localhost:3003`)
   - Authentication token management
   - User authorization

### API Gateway Integration

The MCP service is integrated into your API Gateway health checks:

```javascript
// Health check includes MCP service
app.get('/health', async (req, res) => {
  const services = {
    userService: USER_SERVICE_URL,
    todoService: TODO_SERVICE_URL,
    aiService: AI_SERVICE_URL,
    mcpService: MCP_SERVICE_URL  // Added MCP service
  };
  // ... health check logic
});
```

## 📊 Use Cases

### 1. AI Todo Assistant
```javascript
// AI can manage todos based on natural language
const todos = await mcpClient.callTool('get_user_todos', { userId: 123 });
const analysis = await mcpClient.callTool('analyze_todos_with_ai', { userId: 123 });
const suggestions = await mcpClient.callTool('get_todo_suggestions', { userId: 123 });
```

### 2. Productivity Coach
```javascript
// AI can analyze patterns and suggest improvements
const productivity = await mcpClient.callTool('analyze_user_productivity', { 
  userId: 123, 
  timeframe: 'month' 
});
const improvements = await mcpClient.callTool('suggest_productivity_improvements', { 
  userId: 123 
});
```

### 3. Task Breakdown Assistant
```javascript
// AI can break down complex tasks
const breakdown = await mcpClient.callTool('breakdown_task', {
  taskDescription: 'Plan and execute a marketing campaign',
  userId: 123
});
```

### 4. System Monitoring
```javascript
// AI can monitor system health
const health = await mcpClient.callTool('get_service_health');
const rateLimit = await mcpClient.callTool('get_ai_rate_limit_status', { userId: 123 });
```

## 🔒 Security

### Authentication
- JWT tokens are managed securely
- Service-to-service authentication
- Rate limiting for AI service calls

### Error Handling
- Comprehensive error messages
- No sensitive data exposure
- Graceful degradation

### Validation
- Input validation for all tools
- Service response validation
- Error boundary handling

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

### MCP Server Testing
```bash
# Run automated tests
npm test
```

### Manual Testing
```bash
# Test with AI model integration
npm start
# Connect your AI model to the MCP server
```

## 📈 Monitoring

### Health Checks
- Service health monitoring
- Response time tracking
- Error rate monitoring

### Logging
- Structured logging
- Error tracking
- Performance metrics

### Metrics
- Tool usage statistics
- Service response times
- Error rates

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3009
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

1. **Service Connection Errors**
   - Check if all microservices are running
   - Verify service URLs in environment variables
   - Check network connectivity

2. **Authentication Errors**
   - Verify auth service is running
   - Check JWT token validity
   - Ensure proper token format

3. **Rate Limit Errors**
   - Check AI service rate limits
   - Monitor usage patterns
   - Consider upgrading API limits

### Debug Mode
```bash
# Enable debug logging
DEBUG=mcp:* npm start
```

## 📚 API Reference

### Tools

#### Todo Management
- `create_todo(task, userId, completed?)` - Create a new todo
- `get_user_todos(userId, completed?)` - Get user's todos
- `update_todo(todoId, task?, completed?)` - Update a todo
- `delete_todo(todoId)` - Delete a todo
- `complete_todo(todoId)` - Mark todo as completed

#### User Management
- `get_user_profile(userId)` - Get user profile
- `update_user_profile(userId, name?, email?, role?)` - Update user
- `get_all_users()` - Get all users

#### Analytics
- `analyze_user_productivity(userId, timeframe?)` - Analyze productivity
- `get_todo_statistics(userId)` - Get todo stats
- `suggest_productivity_improvements(userId)` - Get suggestions

#### AI Tools
- `breakdown_task(taskDescription, userId)` - Break down task
- `analyze_todos_with_ai(userId)` - AI todo analysis
- `get_user_insights(userId)` - Get user insights
- `get_todo_suggestions(userId)` - Get todo suggestions

#### System
- `get_service_health()` - Check service health
- `get_ai_rate_limit_status(userId)` - Check rate limits

### Resources

- `todos://user/{userId}` - User's todos
- `users://profile/{userId}` - User profile
- `analytics://productivity/{userId}` - Productivity data
- `system://health` - System health

## 🎯 Benefits

1. **Direct AI Access**: AI models can directly interact with your data
2. **Enhanced Capabilities**: AI can perform complex operations across services
3. **Real-time Data**: AI has access to live data from your microservices
4. **Flexible Integration**: Works with any MCP-compatible AI model
5. **Maintainable**: Clean separation between AI logic and service logic
6. **Scalable**: Can be extended with new tools and resources
7. **Secure**: Proper authentication and error handling

## 🔮 Future Enhancements

- [ ] Real-time notifications via MCP
- [ ] Advanced analytics and reporting
- [ ] Multi-user collaboration tools
- [ ] Integration with external AI services
- [ ] Performance optimization
- [ ] Advanced caching mechanisms
- [ ] Webhook support for real-time updates
