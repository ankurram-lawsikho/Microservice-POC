# MCP Server for Microservices Architecture

This MCP (Model Context Protocol) server provides AI models with direct access to your microservices architecture, enabling powerful AI-driven interactions with your todo and user management systems.

## 🚀 Features

### Todo Management Tools
- **create_todo**: Create new todo items
- **get_user_todos**: Retrieve all todos for a user
- **update_todo**: Update existing todo items
- **delete_todo**: Delete todo items
- **complete_todo**: Mark todos as completed

### User Management Tools
- **get_user_profile**: Get user profile information
- **update_user_profile**: Update user profiles
- **get_all_users**: Retrieve all users in the system

### Analytics Tools
- **analyze_user_productivity**: Analyze user productivity patterns
- **get_todo_statistics**: Get comprehensive todo statistics
- **suggest_productivity_improvements**: AI-powered productivity suggestions

### AI Tools
- **breakdown_task**: Break down large tasks into smaller todos
- **analyze_todos_with_ai**: AI analysis of user todos
- **get_user_insights**: Personalized user insights
- **get_todo_suggestions**: AI-powered todo suggestions

### System Tools
- **get_service_health**: Check health of all microservices
- **get_ai_rate_limit_status**: Check AI service rate limits

## 📋 Resources

The MCP server provides access to the following resources:

- `todos://user/{userId}` - All todos for a specific user
- `users://profile/{userId}` - User profile information
- `analytics://productivity/{userId}` - User productivity analytics
- `system://health` - System health status

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your service URLs
   ```

3. **Start the MCP server**:
   ```bash
   npm start
   ```

## 🔧 Configuration

The server connects to your existing microservices:

- **User Service**: `http://localhost:3001`
- **Todo Service**: `http://localhost:3002`
- **AI Service**: `http://localhost:3008`
- **Auth Service**: `http://localhost:3003`
- **API Gateway**: `http://localhost:3000`

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

## 🔗 Integration

This MCP server integrates seamlessly with your existing microservices:

1. **Direct Service Communication**: Calls your microservices directly
2. **Authentication**: Handles auth tokens for AI service calls
3. **Error Handling**: Comprehensive error handling and reporting
4. **Health Monitoring**: Monitors all service health status

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

## 🔒 Security

- Authentication tokens are managed securely
- Rate limiting is enforced for AI service calls
- Error messages don't expose sensitive information
- All service calls are validated and sanitized

## 📝 Example Use Cases

1. **AI Todo Assistant**: AI can create, update, and manage todos based on natural language
2. **Productivity Coach**: AI can analyze patterns and suggest improvements
3. **Task Breakdown**: AI can break down complex tasks into manageable subtasks
4. **User Insights**: AI can provide personalized recommendations
5. **System Monitoring**: AI can monitor service health and alert on issues

## 🛠️ Development

To extend the MCP server:

1. Add new tools in the respective tool classes
2. Update the tool list in `mcp-server.js`
3. Add corresponding resource handlers if needed
4. Test with your AI models

## 📞 Support

This MCP server is designed to work with your existing microservices architecture. Make sure all your services are running before starting the MCP server.
