# 📝 Logger Service

## Overview

The Logger Service provides centralized, structured logging for all microservices in the architecture. It offers beautiful, readable logging with colors and formatting, specialized logging methods for different operations, and consistent logging across all services. This service ensures observability and debugging capabilities throughout the entire system.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───►│  Logger Service │───►│   Console       │
│   (Port 3000)   │    │   (Shared)      │    │   Output        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       ▲                       │
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐              │                       │
│  Auth Service   │──────────────┘                       │
│   (Port 3007)   │                                      │
└─────────────────┘                                      │
         │                                               │
         ▼                                               │
┌─────────────────┐              ┌─────────────────┐     │
│  User Service   │──────────────│  Todo Service   │─────┘
│   (Port 3001)   │              │   (Port 3002)   │
└─────────────────┘              └─────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐              ┌─────────────────┐
│ Messaging       │              │ Notification    │
│ Service         │              │ Service         │
│ (Port 3006)     │              │ (Port 3003)     │
└─────────────────┘              └─────────────────┘
```

## 🚀 Features

### Core Logging
- **Structured Logging**: Consistent log format across all services
- **Color Coding**: Beautiful colored output for different log levels
- **Service Identification**: Clear service identification in logs
- **Timestamp Formatting**: ISO timestamp formatting
- **Metadata Support**: Rich metadata in log entries

### Advanced Features
- **Specialized Methods**: Service-specific logging methods
- **Log Levels**: INFO, SUCCESS, WARN, ERROR, DEBUG levels
- **Conditional Debugging**: Debug logs only in development
- **Performance Logging**: Request duration and performance metrics
- **Error Context**: Rich error context and stack traces

## 📋 Logger Methods

### Basic Logging Methods
```javascript
logger.info(message, meta)      # Information logging
logger.success(message, meta)   # Success logging
logger.warn(message, meta)      # Warning logging
logger.error(message, meta)     # Error logging
logger.debug(message, meta)     # Debug logging (development only)
```

### Specialized Logging Methods
```javascript
// Service Operations
logger.serviceStart(port, features)    # Service startup
logger.serviceStop()                   # Service shutdown
logger.databaseConnected(database)     # Database connection
logger.databaseError(error)            # Database errors

// Queue Operations
logger.queueConnected(queueName)       # Queue connection
logger.queueError(error, queueName)    # Queue errors
logger.messagePublished(messageId, queue, type, recipient)  # Message publishing
logger.messageReceived(messageId, type, recipient, retryCount)  # Message consumption
logger.messageProcessed(messageId, recipient)  # Message processing
logger.messageRetry(messageId, retryCount, maxRetries, backoffDelay)  # Message retry
logger.messageDLQ(messageId, reason)   # Dead letter queue
logger.duplicateMessage(messageId, type, recipient)  # Duplicate message

// API Operations
logger.apiRequest(method, path, statusCode, duration)  # API requests
logger.gatewayRequest(method, path, targetService, statusCode, duration)  # Gateway requests

// Authentication
logger.authSuccess(userId, email, role)  # Authentication success
logger.authFailed(email, reason)         # Authentication failure

// Email Operations
logger.emailSent(recipient, subject, type)  # Email sent
logger.emailFailed(recipient, error)        # Email failed

// Todo Operations
logger.todoCreated(todoId, title, userId)   # Todo created
logger.todoUpdated(todoId, title, userId)   # Todo updated
logger.todoDeleted(todoId, userId)          # Todo deleted

// User Operations
logger.userCreated(userId, email, role)     # User created
logger.userUpdated(userId, email)           # User updated
logger.userDeleted(userId, email)           # User deleted

// Middleware
logger.middlewareExecuted(middlewareName, userId, success)  # Middleware execution
```

## 🎨 Log Formatting

### Log Structure
```
[timestamp] [service] [level] message | key=value key=value
```

### Example Output
```
2024-01-15T10:30:00.000Z [api-gateway] INFO Health check requested
2024-01-15T10:30:00.000Z [auth-service] SUCCESS Authentication successful | userId=1 email=john@example.com role=user
2024-01-15T10:30:00.000Z [user-service] INFO Fetching all users - Admin request | adminId=1 adminEmail=admin@example.com
2024-01-15T10:30:00.000Z [todo-service] SUCCESS Todo created | todoId=507f1f77bcf86cd799439011 title=Buy groceries userId=1
2024-01-15T10:30:00.000Z [messaging-service] INFO Message published | messageId=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 queue=notification_queue type=welcome recipient=user@example.com
2024-01-15T10:30:00.000Z [notification-service] SUCCESS Email sent | recipient=user@example.com subject=Welcome to Our Platform! type=welcome
```

### Color Coding
- **INFO**: Blue
- **SUCCESS**: Green
- **WARN**: Yellow
- **ERROR**: Red
- **DEBUG**: Gray
- **TIMESTAMP**: Cyan
- **SERVICE**: Magenta
- **HIGHLIGHT**: Bold

## 🔧 Configuration

### Environment Variables
```bash
# Logger Configuration
NODE_ENV=development  # Enables debug logging
DEBUG=true           # Force debug logging
```

### Logger Initialization
```javascript
import { createLogger } from '../logger-service/logger.js';

const logger = createLogger('service-name');
```

## 📊 Usage Examples

### Basic Logging
```javascript
// Information logging
logger.info('User request received', { userId: 123, action: 'login' });

// Success logging
logger.success('Operation completed', { duration: '150ms', records: 5 });

// Warning logging
logger.warn('Rate limit approaching', { current: 95, limit: 100 });

// Error logging
logger.error('Database connection failed', { error: 'Connection timeout' });

// Debug logging (development only)
logger.debug('Processing request', { requestId: 'req-123', method: 'POST' });
```

### Service Operations
```javascript
// Service startup
logger.serviceStart(3000, [
  'api-gateway',
  'service-proxy',
  'health-monitoring',
  'swagger-documentation'
]);

// Service shutdown
logger.serviceStop();

// Database operations
logger.databaseConnected('PostgreSQL');
logger.databaseError(new Error('Connection failed'));
```

### Queue Operations
```javascript
// Queue connection
logger.queueConnected('notification_queue, notification_dlq');

// Message operations
logger.messagePublished('msg-123', 'notification_queue', 'welcome', 'user@example.com');
logger.messageReceived('msg-123', 'welcome', 'user@example.com', 0);
logger.messageProcessed('msg-123', 'user@example.com');

// Error handling
logger.messageRetry('msg-123', 2, 3, 5000);
logger.messageDLQ('msg-123', 'Max retries exceeded');
logger.duplicateMessage('msg-123', 'welcome', 'user@example.com');
```

### API Operations
```javascript
// API requests
logger.apiRequest('POST', '/api/auth/login', 200, 150);

// Gateway requests
logger.gatewayRequest('GET', '/users', 'user-service', 200, 75);
```

### Authentication
```javascript
// Authentication success
logger.authSuccess(123, 'john@example.com', 'user');

// Authentication failure
logger.authFailed('john@example.com', 'Invalid password');
```

### Email Operations
```javascript
// Email sent
logger.emailSent('user@example.com', 'Welcome!', 'welcome');

// Email failed
logger.emailFailed('user@example.com', new Error('SMTP timeout'));
```

### Todo Operations
```javascript
// Todo operations
logger.todoCreated('todo-123', 'Buy groceries', 1);
logger.todoUpdated('todo-123', 'Buy groceries', 1);
logger.todoDeleted('todo-123', 1);
```

### User Operations
```javascript
// User operations
logger.userCreated(123, 'john@example.com', 'user');
logger.userUpdated(123, 'john@example.com');
logger.userDeleted(123, 'john@example.com');
```

### Middleware
```javascript
// Middleware execution
logger.middlewareExecuted('authenticateToken', 123, true);
logger.middlewareExecuted('requireRole', 123, false);
```

## 🚀 Getting Started

### 1. Installation
```bash
cd logger-service
npm install
```

### 2. Import in Services
```javascript
import { createLogger } from '../logger-service/logger.js';

const logger = createLogger('your-service-name');
```

### 3. Use in Services
```javascript
// Basic usage
logger.info('Service started');
logger.success('Operation completed');
logger.error('Operation failed', { error: error.message });

// Specialized usage
logger.serviceStart(3000, ['feature1', 'feature2']);
logger.databaseConnected('PostgreSQL');
logger.apiRequest('GET', '/health', 200, 50);
```

## 🔍 Log Monitoring

### Development
- **Console Output**: Colored console output for development
- **Debug Logging**: Debug logs only in development mode
- **Error Tracking**: Rich error context and stack traces

### Production
- **Structured Format**: JSON-compatible log format
- **Performance Metrics**: Request duration and performance data
- **Error Aggregation**: Error counting and aggregation
- **Service Health**: Service health and status logging

## 🛠️ Customization

### Adding New Log Methods
```javascript
// Add custom logging method
customOperation(operationId, status, details) {
  const statusColor = status === 'success' ? this.colors.success : this.colors.error;
  
  this.info('Custom operation', {
    operationId: this.colors.highlight(operationId),
    status: statusColor(status),
    details: JSON.stringify(details)
  });
}
```

### Custom Log Formatting
```javascript
// Custom log formatter
formatCustomMessage(level, message, meta = {}) {
  const timestamp = this.colors.timestamp(this.formatTimestamp());
  const service = this.formatService();
  const levelFormatted = this.formatLevel(level);
  
  // Custom formatting logic
  let logLine = `${timestamp} ${service} ${levelFormatted} ${message}`;
  
  // Add custom metadata formatting
  if (Object.keys(meta).length > 0) {
    const metaString = Object.entries(meta)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    logLine += ` | ${this.colors.gray(metaString)}`;
  }
  
  return logLine;
}
```

## 🔐 Security Considerations

### Log Security
- **Sensitive Data**: Never log passwords or sensitive information
- **Data Sanitization**: Sanitize user input in logs
- **Error Messages**: Don't expose internal system details
- **Access Control**: Control log access in production

### Best Practices
- **Log Levels**: Use appropriate log levels
- **Metadata**: Include relevant context in logs
- **Performance**: Avoid expensive operations in logging
- **Storage**: Consider log storage and retention policies

## 📚 Dependencies

### Core Dependencies
- **chalk**: Terminal string styling and colors

### Usage in Services
```javascript
// Import in each service
import { createLogger } from '../logger-service/logger.js';

// Create logger instance
const logger = createLogger('service-name');

// Use throughout the service
logger.info('Service operation', { context: 'value' });
```

## 🚨 Production Considerations

### Log Management
- **Log Aggregation**: Use centralized log aggregation
- **Log Rotation**: Implement log rotation policies
- **Log Storage**: Consider log storage costs
- **Log Retention**: Define log retention policies

### Performance
- **Log Levels**: Use appropriate log levels in production
- **Async Logging**: Consider async logging for performance
- **Log Buffering**: Implement log buffering for high throughput
- **Monitoring**: Monitor logging performance impact

### Security
- **Log Access**: Control access to log files
- **Log Encryption**: Encrypt sensitive log data
- **Audit Logging**: Implement audit logging for compliance
- **Log Integrity**: Ensure log integrity and tamper detection

---

**The Logger Service provides consistent, beautiful, and comprehensive logging across your entire microservices architecture!** 📝
