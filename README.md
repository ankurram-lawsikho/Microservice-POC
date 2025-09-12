# 🚀 Microservices POC with Authentication & Messaging

A comprehensive microservices architecture demonstrating modern backend development patterns including authentication, authorization, messaging, service communication, and centralized logging.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   API Gateway   │    │  Auth Service   │
│   (Port 5173)   │◄──►│   (Port 3000)   │◄──►│   (Port 3007)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Service   │    │  Todo Service   │    │ Messaging       │
│   (Port 3001)   │◄──►│  (Port 3002)    │◄──►│ Service         │
└─────────────────┘    └─────────────────┘    │ (Port 3006)     │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Notification    │
                                              │ Service         │
                                              │ (Port 3003)     │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   AI Service    │
                                              │ (Port 3008)     │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   MCP Server    │
                                              │ (Port 3009)     │
                                              └─────────────────┘
```

## 🤖 **NEW: AI Integration & MCP Server**

The POC now includes **AI-powered features** and a **Model Context Protocol (MCP) server** that enables AI models to directly interact with your microservices architecture.

### **AI Service Features:**
- **Task Breakdown**: Break large tasks into smaller, manageable todos
- **Todo Analysis**: AI-powered analysis of user productivity patterns
- **User Insights**: Personalized productivity insights and recommendations
- **Smart Suggestions**: AI-generated todo suggestions based on user behavior
- **Rate Limiting**: Built-in protection against API overuse (40 requests/day per user)

### **MCP Server Features:**
- **18 MCP Tools**: Direct AI access to all microservices functionality
- **Token Authentication**: Secure token-based authentication system
- **Real-time Data Access**: AI models can access live data from your services
- **Comprehensive Error Handling**: Robust error handling and validation
- **Testing Interface**: HTTP wrapper for easy testing and development

## 🔐 **Authentication & Authorization System**

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

### **0. React Frontend** (`frontend/`) ⭐ **NEW**
- **Port**: 5173 (development)
- **Purpose**: Modern React-based user interface
- **Features**:
  - Redux Toolkit for state management
  - React Router for navigation
  - Modular components for each domain
  - JWT authentication integration
  - Real-time updates and optimistic UI
  - Responsive design with modern UX

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

### **7. AI Service** (`ai-service/`) ⭐ **NEW**
- **Port**: 3008
- **Purpose**: AI-powered features using Google Gemini
- **Features**:
  - Task breakdown into smaller todos
  - Todo analysis and insights
  - User productivity insights
  - Todo suggestions
  - Rate limiting (40 requests/day per user)

### **8. MCP Server** (`mcp-service/`) ⭐ **NEW**
- **Port**: 3009
- **Purpose**: Model Context Protocol server for AI model integration
- **Features**:
  - 18 MCP tools for AI models to interact with microservices
  - Direct access to todo, user, and analytics data
  - Token-based authentication system
  - HTTP wrapper for testing and development
  - Comprehensive error handling and validation

### **9. Logger Service** (`logger-service/`) ⭐ **NEW**
- **Port**: Shared (imported by all services)
- **Purpose**: Centralized structured logging
- **Features**:
  - Color-coded logging with beautiful formatting
  - Service-specific logging methods
  - Performance and error logging
  - Debug logging for development

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
# Install frontend dependencies
cd frontend && npm install && cd ..

# Install service dependencies
cd auth-service && npm install && cd ..
cd user-service && npm install && cd ..
cd todo-service && npm install && cd ..
cd messaging-service && npm install && cd ..
cd notification-service && npm install && cd ..
cd ai-service && npm install && cd ..
cd mcp-service && npm install && cd ..
cd logger-service && npm install && cd ..
cd api-gateway && npm install && cd ..
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
# Terminal 1: Start React Frontend
cd frontend && npm run dev

# Terminal 2: Start API Gateway
cd api-gateway && npm start

# Terminal 3: Start Authentication Service
cd auth-service && npm start

# Terminal 4: Start User Service
cd user-service && npm start

# Terminal 5: Start Todo Service
cd todo-service && npm start

# Terminal 6: Start Messaging Service
cd messaging-service && npm start

# Terminal 7: Start Notification Service
cd notification-service && npm start

# Terminal 8: Start AI Service
cd ai-service && npm start

# Terminal 9: Start MCP Server
cd mcp-service && npm start

# Terminal 10: Start Logger Service (if running standalone)
cd logger-service && npm start
```

### **4. Access the Application**
```bash
# Open your browser and navigate to:
# Frontend: http://localhost:5173
# API Gateway: http://localhost:3000

# Or test via API:
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

## 🤖 **AI & MCP Examples**

### **AI Task Breakdown**
```bash
curl -X POST http://localhost:3000/api/ai/todos/breakdown \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskDescription": "Build a full-stack web application"
  }'
```

### **AI Todo Analysis**
```bash
curl -X POST http://localhost:3000/api/ai/todos/analyze \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### **MCP Server Health Check**
```bash
curl http://localhost:3009/health
```

### **MCP Server Info**
```bash
curl http://localhost:3009/info
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
- 🌐 React Frontend: `http://localhost:5173`
- ✅ API Gateway: `http://localhost:3000`
- 🔐 Auth Service: `http://localhost:3007`
- 👤 User Service: `http://localhost:3001`
- ✅ Todo Service: `http://localhost:3002`
- 📨 Messaging Service: `http://localhost:3006`
- 📧 Notification Service: `http://localhost:3003`
- 🤖 AI Service: `http://localhost:3008`
- 🔗 MCP Server: `http://localhost:3009`
- 📝 Logger Service: Shared (imported by all services)

## 📚 **Documentation**

- **[Frontend README](./frontend/README.md)** - React frontend documentation
- **[Microservices Overview](./docs/MICROSERVICES_OVERVIEW.md)** - Complete architecture overview
- **[API Gateway](./docs/API_GATEWAY.md)** - Gateway service documentation
- **[Authentication Service](./docs/AUTH_SERVICE.md)** - Auth service documentation
- **[User Service](./docs/USER_SERVICE.md)** - User service documentation
- **[Todo Service](./docs/TODO_SERVICE.md)** - Todo service documentation
- **[Messaging Service](./docs/MESSAGING_SERVICE.md)** - Messaging service documentation
- **[Notification Service](./docs/NOTIFICATION_SERVICE.md)** - Notification service documentation
- **[AI Service](./docs/AI_SERVICE.md)** - AI service documentation
- **[MCP Service](./docs/MCP_SERVICE.md)** - MCP server documentation
- **[Logger Service](./docs/LOGGER_SERVICE.md)** - Logger service documentation
- **[Authentication Architecture](./docs/AUTHENTICATION_ARCHITECTURE.md)** - Complete auth system guide
- **[Messaging Architecture](./docs/MESSAGING_ARCHITECTURE.md)** - RabbitMQ integration details
- **[Database Setup](./docs/DATABASE_SETUP.md)** - Database configuration guide

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

**🎯 This POC demonstrates a production-ready microservices architecture with enterprise-grade authentication, secure messaging, AI-powered features, MCP server integration, comprehensive monitoring, and a modern React frontend!**

## 🌟 **Frontend Features**

### **Modern React Architecture**
- **Vite** for fast development and optimized builds
- **Redux Toolkit** for predictable state management
- **React Router** for client-side navigation
- **Axios** with interceptors for API communication

### **User Experience**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Optimistic UI updates for better UX
- **Loading States** - Proper loading indicators throughout
- **Error Handling** - User-friendly error messages and retry options
- **Authentication Flow** - Seamless login/logout experience

### **Domain-Specific Components**
- **User Management** - View, create, edit, and delete users
- **Todo Management** - Personal task management with filtering
- **Notifications** - Real-time notification system
- **Dashboard** - Overview of all user data and activities

### **Developer Experience**
- **Modular Architecture** - Clean separation of concerns
- **Custom Hooks** - Reusable API integration patterns
- **TypeScript Ready** - Easy to migrate to TypeScript
- **Hot Reload** - Fast development with Vite
- **ESLint** - Code quality and consistency