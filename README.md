# 🚀 Microservices POC with Authentication & Messaging

A comprehensive microservices architecture demonstrating modern backend development patterns including authentication, authorization, messaging, and service communication.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │  User Service   │
│   (Port 3000)   │◄──►│   (Port 3007)   │◄──►│   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Todo Service   │    │ Messaging       │    │ Notification    │
│  (Port 3002)    │◄──►│ Service         │◄──►│ Service         │
└─────────────────┘    │ (Port 3006)     │    │ (Port 3003)     │
                       └─────────────────┘    └─────────────────┘
```

## 🔐 **NEW: Authentication & Authorization System**

The authentication system acts as the **bouncer** for your microservices architecture, ensuring only authenticated and authorized users can access protected resources.

### **Key Features:**
- **JWT-based authentication** with secure token management
- **Role-based access control** (User, Admin roles)
- **Resource ownership verification** (users can only access their own data)
- **Centralized auth service** with shared middleware
- **Rate limiting** and security protection
- **Password hashing** with bcrypt

### **Security Levels:**
1. **Public**: Registration, login, health checks
2. **Authenticated**: User-specific resources
3. **Role-based**: Admin-only operations
4. **Ownership-based**: Users can only access their own data

## 🚀 Services

### **1. API Gateway** (`api-gateway/`)
- **Port**: 3000
- **Purpose**: Centralized routing and service aggregation
- **Features**: 
  - Service discovery and health monitoring
  - Authentication-aware routing
  - Request/response logging
  - CORS and error handling

### **2. Authentication Service** (`auth-service/`) ⭐ **NEW**
- **Port**: 3007
- **Purpose**: Centralized authentication and JWT management
- **Features**:
  - User registration and login
  - JWT token generation and validation
  - Password hashing and verification
  - Token refresh mechanism
  - **Authentication middleware** for other services

### **3. User Service** (`user-service/`)
- **Port**: 3001
- **Database**: PostgreSQL
- **Purpose**: User management and profile operations
- **Features**:
  - CRUD operations for users
  - Authentication middleware integration
  - Ownership-based access control
  - Integration with messaging service

### **4. Todo Service** (`todo-service/`)
- **Port**: 3002
- **Database**: MongoDB Atlas
- **Purpose**: Todo management with user isolation
- **Features**:
  - Simplified todo structure (task, completed, userId)
  - User-specific todo operations
  - Authentication required for all operations
  - Automatic user context from JWT

### **5. Messaging Service** (`messaging-service/`)
- **Port**: 3006
- **Purpose**: Centralized RabbitMQ message broker
- **Features**:
  - Message publishing and routing
  - Queue management and monitoring
  - HTTP API for service communication
  - Health monitoring

### **6. Notification Service** (`notification-service/`)
- **Port**: 3003
- **Purpose**: Email notifications and alerts
- **Features**:
  - RabbitMQ consumer for notifications
  - Email templates (welcome, todo reminders)
  - Nodemailer integration
  - Health monitoring

## 🔑 **Authentication Endpoints**

### **Public Endpoints**
```bash
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /health               # Service health checks
```

### **Protected Endpoints**
```bash
# User Management (with authentication)
GET    /api/users          # List users (Admin only)
GET    /api/users/:id      # Get user profile (Own or Admin)
PUT    /api/users/:id      # Update user (Own or Admin)
DELETE /api/users/:id      # Delete user (Own or Admin)

# Todo Management (with authentication)
GET    /api/todos          # Get user's todos
POST   /api/todos          # Create todo
GET    /api/todos/:id      # Get specific todo (Own)
PUT    /api/todos/:id      # Update todo (Own)
DELETE /api/todos/:id      # Delete todo (Own)
GET    /api/todos/completed # Get completed todos
GET    /api/todos/pending  # Get pending todos
```

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install service dependencies
cd auth-service && npm install
cd ../user-service && npm install
cd ../todo-service && npm install
cd ../messaging-service && npm install
cd ../notification-service && npm install
cd ../api-gateway && npm install
```

### **2. Environment Setup**
```bash
# Create .env files in each service directory
# Example for auth-service:
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
USER_SERVICE_URL=http://localhost:3001

# Example for services:
AUTH_SERVICE_URL=http://localhost:3007
MESSAGING_SERVICE_URL=http://localhost:3006
```

### **3. Start Services**
```bash
# Terminal 1: Start API Gateway
cd api-gateway && npm start

# Terminal 2: Start Authentication Service
cd auth-service && npm start

# Terminal 3: Start User Service
cd user-service && npm start

# Terminal 4: Start Todo Service
cd todo-service && npm start

# Terminal 5: Start Messaging Service
cd messaging-service && npm start

# Terminal 6: Start Notification Service
cd notification-service && npm start
```

### **4. Test Authentication**
```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'

# 2. Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'

# 3. Use token to access protected resources
curl -X GET http://localhost:3000/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN_FROM_STEP_2>"
```

## 🛡️ **Security Features**

### **Authentication**
- JWT tokens with configurable expiration
- Secure password hashing (bcrypt)
- Token refresh mechanism
- Local + remote token verification

### **Authorization**
- Role-based access control
- Resource ownership verification
- Admin privilege escalation
- Granular permission system

### **Protection**
- Rate limiting per IP
- CORS configuration
- Input validation
- Error message sanitization

## 📊 **API Examples**

### **Create Todo (Authenticated)**
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Buy groceries"
  }'
```

### **Get User Profile (Own)**
```bash
curl -X GET http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### **Update Todo (Own)**
```bash
curl -X PUT http://localhost:3000/api/todos/<TODO_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

## 🔍 **Monitoring & Health**

### **Gateway Health Check**
```bash
curl http://localhost:3000/health
```

### **Individual Service Health**
```bash
curl http://localhost:3000/services/health
```

### **Service Status**
- ✅ API Gateway: `http://localhost:3000`
- 🔐 Auth Service: `http://localhost:3007`
- 👤 User Service: `http://localhost:3001`
- ✅ Todo Service: `http://localhost:3002`
- 📨 Messaging Service: `http://localhost:3006`
- 📧 Notification Service: `http://localhost:3003`

## 📚 **Documentation**

- **[Authentication Architecture](./AUTHENTICATION_ARCHITECTURE.md)** - Complete auth system guide
- **[Messaging Architecture](./MESSAGING_ARCHITECTURE.md)** - RabbitMQ integration details
- **[Database Setup](./DATABASE_SETUP.md)** - Database configuration guide

## 🏗️ **Architecture Benefits**

### **Security**
- Centralized authentication
- JWT-based stateless auth
- Role-based permissions
- Resource isolation

### **Scalability**
- Service independence
- Message-driven communication
- Load balancing ready
- Database separation

### **Maintainability**
- Clear service boundaries
- Shared middleware
- Consistent logging
- Health monitoring

### **Development**
- Independent deployment
- Technology diversity
- Easy testing
- Clear documentation

## 🚨 **Production Considerations**

### **Security**
- Use strong JWT secrets
- Enable HTTPS everywhere
- Implement token blacklisting
- Regular security audits

### **Performance**
- Redis for token storage
- JWT payload optimization
- Database connection pooling
- Load balancing

### **Monitoring**
- Authentication failures
- Rate limit violations
- Service health metrics
- Performance analytics

---

**🎯 This POC demonstrates a production-ready microservices architecture with enterprise-grade authentication, secure messaging, and comprehensive monitoring!**