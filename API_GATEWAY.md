# 🌐 API Gateway Service

## Overview

The API Gateway serves as the central entry point for all client requests in the microservices architecture. It acts as a reverse proxy, routing requests to appropriate services while providing unified authentication, monitoring, and documentation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───►│   API Gateway   │───►│  Microservices  │
│   (Web/Mobile)  │    │   (Port 3000)   │    │   (Ports 3001+) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### Core Functionality
- **Service Routing**: Intelligent request routing to appropriate microservices
- **Authentication Proxy**: Seamless JWT token validation and forwarding
- **Health Monitoring**: Comprehensive health checks for all services
- **API Documentation**: Integrated Swagger/OpenAPI documentation
- **Error Handling**: Centralized error handling and response formatting
- **CORS Management**: Cross-origin resource sharing configuration

### Advanced Features
- **Request/Response Logging**: Detailed logging with structured logger
- **Service Discovery**: Dynamic service health monitoring
- **Load Balancing Ready**: Prepared for horizontal scaling
- **Graceful Shutdown**: Proper cleanup and connection management

## 📋 API Endpoints

### Public Endpoints
```http
GET  /                    # Gateway information and service status
GET  /health             # Overall system health check
GET  /services/health    # Individual service health status
GET  /api-docs           # Swagger API documentation
```

### Proxied Endpoints
```http
# Authentication Service (Port 3007)
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/verify       # Token verification
POST /api/auth/refresh      # Token refresh

# User Service (Port 3001)
GET    /users              # List users (Admin only)
GET    /users/:id          # Get user profile
POST   /users              # Create user
PUT    /users/:id          # Update user
DELETE /users/:id          # Delete user

# Todo Service (Port 3002)
GET    /todos              # Get user's todos
POST   /todos              # Create todo
GET    /todos/:id          # Get specific todo
PUT    /todos/:id          # Update todo
DELETE /todos/:id          # Delete todo
GET    /todos/completed    # Get completed todos
GET    /todos/pending      # Get pending todos

# Messaging Service (Port 3006)
POST   /api/messaging/messages/publish      # Publish message
POST   /api/messaging/notifications/publish # Publish notification
GET    /api/messaging/health                # Messaging health
GET    /api/messaging/queue/status          # Queue status
```

## 🔧 Configuration

### Environment Variables
```bash
# Service URLs
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
MESSAGING_SERVICE_URL=http://localhost:3006
AUTH_SERVICE_URL=http://localhost:3007

# Gateway Configuration
PORT=3000
NODE_ENV=development
```

### Service Configuration
```javascript
const services = {
  userService: USER_SERVICE_URL,
  todoService: TODO_SERVICE_URL,
  notificationService: NOTIFICATION_SERVICE_URL,
  messagingService: MESSAGING_SERVICE_URL,
  authService: AUTH_SERVICE_URL
};
```

## 🛡️ Security Features

### Authentication Handling
- **JWT Token Forwarding**: Seamlessly forwards authentication tokens
- **Token Validation**: Validates tokens before routing requests
- **User Context**: Maintains user context across service calls
- **Role-Based Routing**: Ensures proper authorization levels

### Security Middleware
- **CORS Configuration**: Proper cross-origin resource sharing
- **Request Validation**: Input sanitization and validation
- **Error Sanitization**: Secure error message handling
- **Rate Limiting**: Protection against abuse and DDoS

## 📊 Health Monitoring

### System Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "gateway": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "userService": {
      "status": "OK",
      "data": {...},
      "responseTime": "45ms"
    },
    "todoService": {
      "status": "OK",
      "data": {...},
      "responseTime": "32ms"
    }
  }
}
```

### Individual Service Health
```bash
curl http://localhost:3000/services/health
```

Response:
```json
{
  "gateway": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": [
    {
      "name": "User Service",
      "port": 3001,
      "status": "OK",
      "data": {...}
    }
  ]
}
```

## 🔄 Request Flow

### 1. Authentication Flow
```
Client → Gateway → Auth Service → User Service → Response
```

### 2. Protected Resource Access
```
Client → Gateway (JWT Validation) → Target Service → Response
```

### 3. Health Check Flow
```
Client → Gateway → All Services (Parallel) → Aggregated Response
```

## 📝 Logging

### Structured Logging
The gateway uses the centralized logger service for consistent logging:

```javascript
// Request logging
logger.info('Auth service request', { 
  method: req.method, 
  path: req.path 
});

// Response logging
logger.info('Auth service response', { 
  statusCode: proxyRes.statusCode 
});

// Error logging
logger.error('Gateway error', { 
  error: err.message,
  path: req.path,
  method: req.method
});
```

### Log Levels
- **INFO**: Normal operations, request/response logging
- **WARN**: Non-critical issues, route not found
- **ERROR**: Critical errors, service failures
- **SUCCESS**: Successful operations, health checks

## 🚀 Getting Started

### 1. Installation
```bash
cd api-gateway
npm install
```

### 2. Environment Setup
```bash
# Create .env file
cp .env.example .env
# Edit .env with your service URLs
```

### 3. Start the Service
```bash
npm start
```

### 4. Verify Installation
```bash
# Check gateway health
curl http://localhost:3000/health

# Check API documentation
open http://localhost:3000/api-docs
```

## 🔍 Monitoring & Debugging

### Health Monitoring
- **Gateway Health**: `GET /health`
- **Service Health**: `GET /services/health`
- **Service Status**: Real-time service availability

### Debugging Tools
- **Swagger UI**: Interactive API documentation
- **Request Logs**: Detailed request/response logging
- **Error Tracking**: Comprehensive error logging
- **Service Discovery**: Dynamic service monitoring

### Common Issues

#### Service Unavailable
```bash
# Check if target service is running
curl http://localhost:3001/health

# Check gateway logs
tail -f logs/gateway.log
```

#### Authentication Issues
```bash
# Verify JWT token
curl -H "Authorization: Bearer <token>" http://localhost:3000/users
```

#### Routing Problems
```bash
# Check available routes
curl http://localhost:3000/
```

## 🏗️ Architecture Benefits

### Scalability
- **Horizontal Scaling**: Easy to scale gateway independently
- **Load Distribution**: Distributes load across service instances
- **Service Isolation**: Services can scale independently

### Maintainability
- **Centralized Configuration**: Single point for routing configuration
- **Consistent Logging**: Unified logging across all services
- **Error Handling**: Centralized error management

### Security
- **Authentication Gateway**: Single point for authentication
- **Request Validation**: Centralized input validation
- **Rate Limiting**: Protection against abuse

### Development
- **API Documentation**: Integrated Swagger documentation
- **Service Discovery**: Automatic service health monitoring
- **Debugging**: Comprehensive logging and monitoring

## 🔧 Customization

### Adding New Services
```javascript
// Add new service configuration
const NEW_SERVICE_URL = process.env.NEW_SERVICE_URL || 'http://localhost:3008';

// Add proxy middleware
app.use('/api/new-service', createProxyMiddleware({
  target: NEW_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    logger.info('New service request', { 
      method: req.method, 
      path: req.path 
    });
  }
}));
```

### Custom Middleware
```javascript
// Add custom middleware
app.use('/api/custom', (req, res, next) => {
  // Custom logic here
  next();
});
```

## 📚 Dependencies

### Core Dependencies
- **express**: Web framework
- **http-proxy-middleware**: Request proxying
- **axios**: HTTP client for health checks
- **swagger-ui-express**: API documentation
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Logger Integration
- **../logger-service/logger.js**: Centralized logging

## 🚨 Production Considerations

### Performance
- **Connection Pooling**: Optimize database connections
- **Caching**: Implement response caching
- **Load Balancing**: Use multiple gateway instances
- **CDN Integration**: Static asset delivery

### Security
- **HTTPS**: Enable SSL/TLS encryption
- **Rate Limiting**: Implement proper rate limiting
- **Input Validation**: Comprehensive input sanitization
- **Security Headers**: Add security headers

### Monitoring
- **Health Checks**: Regular health monitoring
- **Metrics Collection**: Performance metrics
- **Alerting**: Automated alerting system
- **Log Aggregation**: Centralized log management

---

**The API Gateway is the foundation of your microservices architecture, providing a unified, secure, and scalable entry point for all client interactions!** 🌐
