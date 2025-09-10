# ✅ Todo Service

## Overview

The Todo Service manages todo items and tasks in the microservices architecture. It provides comprehensive todo management capabilities including CRUD operations, user-specific todo isolation, and notification integration. The service uses MongoDB Atlas for data persistence and integrates with the messaging service for todo-related notifications.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───►│  Todo Service   │───►│   MongoDB       │
│   (Port 3000)   │    │   (Port 3002)   │    │   Atlas         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └─────────────►│ Messaging       │◄─────────────┘
                        │ Service         │
                        │ (Port 3006)     │
                        └─────────────────┘
```

## 🚀 Features

### Core Todo Management
- **Todo CRUD Operations**: Create, read, update, delete todos
- **User Isolation**: Users can only access their own todos
- **Status Management**: Mark todos as completed or pending
- **Authentication Integration**: Seamless integration with auth service
- **Ownership Validation**: Ensures users can only access their own todos

### Advanced Features
- **Todo Notifications**: Automatic notifications for todo operations
- **Messaging Integration**: Sends notifications via messaging service
- **Structured Logging**: Comprehensive todo operation logging
- **Health Monitoring**: Service health and database status monitoring
- **Graceful Shutdown**: Proper cleanup and connection management

## 📋 API Endpoints

### Protected Endpoints (All require authentication)
```http
GET    /todos              # Get user's todos
POST   /todos              # Create new todo
GET    /todos/:id          # Get specific todo (Own only)
PUT    /todos/:id          # Update todo (Own only)
DELETE /todos/:id          # Delete todo (Own only)
GET    /todos/completed    # Get completed todos
GET    /todos/pending      # Get pending todos
GET    /health            # Service health check
```

## 🔑 Todo Management Flow

### 1. Todo Creation
```mermaid
sequenceDiagram
    participant C as Client
    participant T as Todo Service
    participant D as MongoDB
    participant M as Messaging Service

    C->>T: POST /todos (with JWT)
    T->>T: Validate JWT
    T->>D: Create todo with userId
    D-->>T: Todo created
    T->>M: Send todo creation notification
    T-->>C: Todo created response
```

### 2. Todo Access
```mermaid
sequenceDiagram
    participant C as Client
    participant T as Todo Service
    participant D as MongoDB

    C->>T: GET /todos (with JWT)
    T->>T: Validate JWT
    T->>D: Fetch todos by userId
    D-->>T: User's todos
    T-->>C: Todo list
```

## 🛡️ Security Features

### Authentication Integration
- **JWT Validation**: Validates JWT tokens from auth service
- **User Context**: Extracts user information from JWT payload
- **Ownership Validation**: Ensures users can only access their own todos
- **Admin Access**: Admin users can access all todos

### Data Security
- **User Isolation**: Todos are isolated by user ID
- **Input Validation**: Validates all input data
- **NoSQL Injection Protection**: Uses TypeORM for safe database queries
- **Data Sanitization**: Ensures data integrity

## 📊 API Examples

### Create Todo
```bash
curl -X POST http://localhost:3002/todos \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Buy groceries"
  }'
```

Response:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "task": "Buy groceries",
  "completed": false,
  "userId": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Get User's Todos
```bash
curl -X GET http://localhost:3002/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "task": "Buy groceries",
    "completed": false,
    "userId": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "task": "Complete project",
    "completed": true,
    "userId": 1,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

### Update Todo
```bash
curl -X PUT http://localhost:3002/todos/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

Response:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "task": "Buy groceries",
  "completed": true,
  "userId": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

### Get Completed Todos
```bash
curl -X GET http://localhost:3002/todos/completed \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "task": "Complete project",
    "completed": true,
    "userId": 1,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

### Get Pending Todos
```bash
curl -X GET http://localhost:3002/todos/pending \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "task": "Buy groceries",
    "completed": false,
    "userId": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/microservice-todos

# Service URLs
MESSAGING_SERVICE_URL=http://localhost:3006

# Service Configuration
PORT=3002
NODE_ENV=development
```

### Database Configuration
```javascript
export const AppDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGODB_URI || "mongodb://localhost:27017/todos_db",
  database: "microservice-todos",
  entities: [Todo],
  synchronize: true,
  logging: false
});
```

## 🗄️ Database Schema

### Todo Entity
```typescript
@Entity("todos")
export class Todo {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  task: string;

  @Column({ default: false })
  completed: boolean;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## 🔄 Integration with Other Services

### Authentication Service Integration
- **JWT Validation**: Validates JWT tokens for user authentication
- **User Context**: Extracts user information from JWT payload
- **Ownership Validation**: Ensures users can only access their own todos

### Messaging Service Integration
- **Todo Notifications**: Sends notifications for todo operations
- **Notification Types**: Creation, update, and deletion notifications
- **Async Processing**: Non-blocking notification sending

### API Gateway Integration
- **Request Routing**: Receives requests through API Gateway
- **Authentication**: Validates JWT tokens from requests
- **Response Formatting**: Returns consistent response format

## 📝 Logging

### Structured Logging
The service uses the centralized logger for consistent logging:

```javascript
// Todo operations
logger.todoCreated(savedTodo.id, savedTodo.task, req.user.userId);
logger.todoUpdated(updatedTodo.id, updatedTodo.task, req.user.userId);
logger.todoDeleted(todoId, req.user.userId);

// API operations
logger.info('Fetching todos for user', { 
  userId: req.user?.userId,
  email: req.user?.email 
});

// Error logging
logger.error('Error fetching todos', { 
  userId: req.user?.userId,
  error: error.message 
});
```

### Log Levels
- **INFO**: Normal operations, todo requests
- **SUCCESS**: Successful todo operations
- **WARN**: Todo not found, validation errors
- **ERROR**: System errors, database failures

## 🚀 Getting Started

### 1. Installation
```bash
cd todo-service
npm install
```

### 2. Database Setup
```bash
# MongoDB Atlas (Recommended)
# 1. Create MongoDB Atlas account
# 2. Create cluster
# 3. Get connection string
# 4. Update MONGODB_URI in .env

# Or use local MongoDB
docker run --name mongodb-todos -p 27017:27017 -d mongo
```

### 3. Environment Setup
```bash
# Create .env file
cp .env.example .env
# Edit .env with your database configuration
```

### 4. Start the Service
```bash
npm start
```

### 5. Verify Installation
```bash
# Check service health
curl http://localhost:3002/health

# Test todo creation (requires JWT token)
curl -X POST http://localhost:3002/todos \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"task":"Test todo"}'
```

## 🔍 Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "OK",
  "database": "MongoDB Atlas",
  "databaseName": "microservice-todos",
  "connection": "Connected",
  "todoCount": 15,
  "messagingService": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Health Status
- **Database Status**: MongoDB connection status
- **Todo Count**: Total number of todos in database
- **Messaging Service**: Status of messaging service integration
- **Service Health**: Overall service health status

## 🛠️ Middleware Usage

### Authentication Middleware
```javascript
import { authenticateToken } from '../auth-service/auth-middleware.js';

// All todo endpoints require authentication
app.get('/todos', authenticateToken, async (req, res) => {
  // Access req.user for authenticated user info
  const todos = await todoRepository.find({
    where: { userId: req.user.userId }
  });
  res.json(todos);
});
```

### Custom Ownership Middleware
```javascript
const requireTodoOwnership = async (req, res, next) => {
  try {
    const todoId = req.params.id;
    const todoRepository = AppDataSource.getRepository(Todo);
    
    const todo = await todoRepository.findOne({
      where: { id: todoId }
    });
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Check if user owns the todo or is admin
    if (req.user.role === 'admin' || todo.userId === req.user.userId) {
      req.todo = todo; // Attach todo to request
      next();
    } else {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own todos.' 
      });
    }
  } catch (error) {
    logger.error('Todo ownership check error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

## 🔐 Security Best Practices

### Data Protection
- **User Isolation**: Todos are isolated by user ID
- **Input Validation**: Validate all input data
- **NoSQL Injection**: Use parameterized queries
- **Data Sanitization**: Ensure data integrity

### Access Control
- **Authentication**: Require JWT tokens for all endpoints
- **Authorization**: Implement ownership-based access control
- **Ownership**: Ensure users can only access their own todos
- **Admin Privileges**: Admin users have elevated access

### General Security
- **HTTPS**: Use HTTPS in production
- **Rate Limiting**: Implement rate limiting for todo operations
- **Input Sanitization**: Sanitize all user input
- **Error Handling**: Don't expose sensitive information in errors

## 🚨 Error Handling

### Todo Errors
- **400 Bad Request**: Missing required fields
- **401 Unauthorized**: No authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Todo not found
- **500 Internal Server Error**: System errors

### Error Responses
```json
{
  "error": "Task is required"
}
```

## 📚 Dependencies

### Core Dependencies
- **express**: Web framework
- **typeorm**: Object-relational mapping
- **mongodb**: MongoDB driver
- **axios**: HTTP client for service communication
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Logger Integration
- **../logger-service/logger.js**: Centralized logging

## 🔧 Customization

### Adding New Todo Fields
```typescript
@Entity("todos")
export class Todo {
  // ... existing fields
  
  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  priority: string;

  @Column({ default: [] })
  tags: string[];
}
```

### Custom Todo Operations
```javascript
// Add todo search endpoint
app.get('/todos/search', authenticateToken, async (req, res) => {
  const { query } = req.query;
  const todos = await todoRepository.find({
    where: {
      userId: req.user.userId,
      task: Like(`%${query}%`)
    }
  });
  res.json(todos);
});

// Add todo statistics endpoint
app.get('/todos/stats', authenticateToken, async (req, res) => {
  const total = await todoRepository.count({ where: { userId: req.user.userId } });
  const completed = await todoRepository.count({ 
    where: { userId: req.user.userId, completed: true } 
  });
  const pending = total - completed;
  
  res.json({ total, completed, pending });
});
```

## 🚨 Production Considerations

### Database
- **Connection Pooling**: Implement database connection pooling
- **Indexing**: Add proper database indexes
- **Backup**: Implement regular database backups
- **Monitoring**: Monitor database performance

### Security
- **HTTPS**: Enable SSL/TLS encryption
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: Protect against abuse
- **Audit Logging**: Log all todo operations

### Performance
- **Caching**: Implement todo data caching
- **Load Balancing**: Use multiple service instances
- **Database Optimization**: Optimize database queries
- **Monitoring**: Monitor service performance

---

**The Todo Service provides comprehensive todo management with user isolation and notification integration in your microservices architecture!** ✅
