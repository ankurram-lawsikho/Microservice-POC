# 🏗️ Microservices Architecture Overview

## Overview

This document provides a comprehensive overview of how all microservices work together in the architecture. The system demonstrates modern microservices patterns including service communication, authentication, messaging, and observability.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Web App   │  │  Mobile App │  │   Admin     │  │   External  │            │
│  │             │  │             │  │   Panel     │  │   APIs      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        API Gateway (Port 3000)                         │    │
│  │  • Request Routing    • Authentication    • Health Monitoring          │    │
│  │  • Load Balancing    • Rate Limiting     • API Documentation          │    │
│  │  • Error Handling    • CORS Management   • Service Discovery          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│    AUTHENTICATION       │ │      USER SERVICE       │ │      TODO SERVICE       │
│    SERVICE              │ │                         │ │                         │
│    (Port 3007)          │ │    (Port 3001)          │ │    (Port 3002)          │
│                         │ │                         │ │                         │
│  • JWT Management       │ │  • User CRUD            │ │  • Todo CRUD            │
│  • User Authentication  │ │  • Profile Management   │ │  • User Isolation       │
│  • Password Hashing     │ │  • Role Management      │ │  • Status Management    │
│  • Token Validation     │ │  • Ownership Control    │ │  • Ownership Control    │
│  • Welcome Notifications│ │  • Welcome Notifications│ │  • Todo Notifications   │
│                         │ │                         │ │                         │
│  Database: None         │ │  Database: PostgreSQL   │ │  Database: MongoDB      │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MESSAGING LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Messaging Service (Port 3006)                       │    │
│  │  • Message Publishing    • Queue Management    • Idempotency           │    │
│  │  • Dead Letter Queue    • Retry Mechanism     • Health Monitoring     │    │
│  │  • HTTP API             • RabbitMQ Integration • Message Persistence   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                  Notification Service (Port 3003)                      │    │
│  │  • Email Templates      • Message Consumption    • SMTP Integration    │    │
│  │  • HTML Rendering      • Retry Logic           • Error Handling       │    │
│  │  • Template System     • Dead Letter Queue     • Health Monitoring     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ PostgreSQL  │  │   MongoDB   │  │  RabbitMQ   │  │   SMTP      │            │
│  │  Database   │  │   Atlas     │  │   Broker    │  │  Provider   │            │
│  │             │  │             │  │             │  │             │            │
│  │ • User Data │  │ • Todo Data │  │ • Messages  │  │ • Email     │            │
│  │ • Profiles  │  │ • Tasks     │  │ • Queues    │  │ • Templates │            │
│  │ • Roles     │  │ • Status    │  │ • DLQ       │  │ • Delivery  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        Logger Service (Shared)                         │    │
│  │  • Structured Logging    • Color Coding      • Service Identification  │    │
│  │  • Specialized Methods   • Performance Logs  • Error Context          │    │
│  │  • Metadata Support      • Debug Logging     • Health Monitoring       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Service Communication Flow

### 1. User Registration Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant U as User Service
    participant M as Messaging Service
    participant N as Notification Service

    C->>G: POST /api/auth/register
    G->>A: Forward registration request
    A->>A: Hash password
    A->>U: Create user
    U->>U: Store user in PostgreSQL
    U-->>A: User created
    A-->>G: Registration success
    G-->>C: Registration response
    
    A->>M: Send welcome notification
    M->>M: Publish to RabbitMQ
    M-->>A: Notification queued
    N->>M: Consume message
    N->>N: Send welcome email
    N-->>M: Message acknowledged
```

### 2. User Login Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant U as User Service
    participant M as Messaging Service
    participant N as Notification Service

    C->>G: POST /api/auth/login
    G->>A: Forward login request
    A->>U: Get user by email
    U-->>A: User data
    A->>A: Verify password
    A->>A: Generate JWT token
    A->>M: Send login notification
    M->>M: Publish to RabbitMQ
    M-->>A: Notification queued
    A-->>G: JWT token + user info
    G-->>C: Login response
    
    N->>M: Consume message
    N->>N: Send welcome back email
    N-->>M: Message acknowledged
```

### 3. Todo Creation Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant T as Todo Service
    participant M as Messaging Service
    participant N as Notification Service

    C->>G: POST /todos (with JWT)
    G->>G: Validate JWT token
    G->>T: Forward todo creation
    T->>T: Validate JWT token
    T->>T: Create todo in MongoDB
    T->>M: Send todo notification
    M->>M: Publish to RabbitMQ
    M-->>T: Notification queued
    T-->>G: Todo created
    G-->>C: Todo response
    
    N->>M: Consume message
    N->>N: Send todo creation email
    N-->>M: Message acknowledged
```

### 4. Health Check Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant U as User Service
    participant T as Todo Service
    participant M as Messaging Service
    participant N as Notification Service

    C->>G: GET /health
    G->>A: Check auth service health
    G->>U: Check user service health
    G->>T: Check todo service health
    G->>M: Check messaging service health
    G->>N: Check notification service health
    
    A-->>G: Auth service status
    U-->>G: User service status
    T-->>G: Todo service status
    M-->>G: Messaging service status
    N-->>G: Notification service status
    
    G->>G: Aggregate health status
    G-->>C: Overall system health
```

## 🛡️ Security Architecture

### Authentication Flow
```
Client Request → API Gateway → JWT Validation → Service Processing → Response
```

### Authorization Levels
1. **Public**: Registration, login, health checks
2. **Authenticated**: User-specific resources
3. **Role-based**: Admin-only operations
4. **Ownership-based**: Users can only access their own data

### Security Features
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: Admin and user roles
- **Resource Ownership**: Users can only access their own data
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin resource sharing

## 📨 Messaging Architecture

### Message Flow
```
Service → Messaging Service → RabbitMQ → Notification Service → Email Provider
```

### Message Types
- **Welcome Notifications**: User registration and login
- **Todo Notifications**: Todo creation, update, deletion
- **System Notifications**: Health checks, errors

### Message Features
- **Idempotency**: Prevents duplicate processing
- **Dead Letter Queue**: Handles failed messages
- **Retry Mechanism**: Exponential backoff with jitter
- **Message Persistence**: Durable message storage

## 📊 Data Flow

### User Data Flow
```
Client → API Gateway → Auth Service → User Service → PostgreSQL
```

### Todo Data Flow
```
Client → API Gateway → Todo Service → MongoDB Atlas
```

### Notification Data Flow
```
Service → Messaging Service → RabbitMQ → Notification Service → SMTP
```

## 🔍 Observability

### Logging
- **Centralized Logging**: All services use the same logger
- **Structured Logs**: Consistent log format
- **Color Coding**: Beautiful colored output
- **Service Identification**: Clear service identification
- **Metadata Support**: Rich metadata in logs

### Health Monitoring
- **Service Health**: Individual service health checks
- **System Health**: Overall system health status
- **Dependency Health**: Database and external service health
- **Performance Metrics**: Request duration and performance data

### Error Handling
- **Centralized Error Handling**: Consistent error responses
- **Error Logging**: Comprehensive error logging
- **Error Recovery**: Retry mechanisms and fallbacks
- **Dead Letter Queue**: Failed message handling

## 🚀 Deployment Architecture

### Service Ports
- **API Gateway**: 3000
- **User Service**: 3001
- **Todo Service**: 3002
- **Notification Service**: 3003
- **Messaging Service**: 3006
- **Auth Service**: 3007

### Database Connections
- **PostgreSQL**: User data and profiles
- **MongoDB Atlas**: Todo data and tasks
- **RabbitMQ**: Message queuing and routing

### External Services
- **SMTP Provider**: Email delivery (Gmail, etc.)
- **MongoDB Atlas**: Cloud database service

## 🔧 Configuration Management

### Environment Variables
```bash
# API Gateway
PORT=3000
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
MESSAGING_SERVICE_URL=http://localhost:3006
AUTH_SERVICE_URL=http://localhost:3007

# Auth Service
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
USER_SERVICE_URL=http://localhost:3001
MESSAGING_SERVICE_URL=http://localhost:3006

# User Service
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=users_db
MESSAGING_SERVICE_URL=http://localhost:3006

# Todo Service
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/microservice-todos
MESSAGING_SERVICE_URL=http://localhost:3006

# Messaging Service
RABBITMQ_URL=amqp://localhost
MESSAGING_SERVICE_PORT=3006

# Notification Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RABBITMQ_URL=amqp://localhost
NOTIFICATION_SERVICE_PORT=3003
```

## 🏗️ Architecture Benefits

### Scalability
- **Horizontal Scaling**: Services can scale independently
- **Load Distribution**: Load is distributed across services
- **Database Separation**: Each service has its own database
- **Message Queuing**: Asynchronous processing

### Maintainability
- **Service Isolation**: Clear service boundaries
- **Technology Diversity**: Different technologies per service
- **Independent Deployment**: Services can be deployed independently
- **Clear Documentation**: Comprehensive documentation

### Reliability
- **Fault Isolation**: Service failures don't affect others
- **Retry Mechanisms**: Automatic retry for failed operations
- **Dead Letter Queue**: Failed message handling
- **Health Monitoring**: Proactive health monitoring

### Security
- **Centralized Authentication**: Single point of authentication
- **JWT-based Auth**: Stateless authentication
- **Role-based Access**: Granular permission system
- **Resource Ownership**: Users can only access their own data

## 🚨 Production Considerations

### Performance
- **Connection Pooling**: Database connection pooling
- **Caching**: Response caching strategies
- **Load Balancing**: Multiple service instances
- **CDN Integration**: Static asset delivery

### Security
- **HTTPS**: SSL/TLS encryption
- **Token Blacklisting**: Token revocation
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive input validation

### Monitoring
- **Health Checks**: Regular health monitoring
- **Metrics Collection**: Performance metrics
- **Alerting**: Automated alerting system
- **Log Aggregation**: Centralized log management

### Backup & Recovery
- **Database Backups**: Regular database backups
- **Message Persistence**: Durable message storage
- **Disaster Recovery**: Recovery procedures
- **Data Replication**: Data replication strategies

---

**This microservices architecture demonstrates modern patterns for building scalable, maintainable, and secure distributed systems!** 🏗️
