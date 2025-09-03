# 🔐 Authentication & Authorization Architecture

## Overview

The authentication system acts as the **bouncer** for your microservices architecture. It ensures that only authenticated and authorized users can access protected resources, while maintaining security and performance across all services.

## 🏗️ Architecture Components

### 1. **Authentication Service** (`auth-service`)
- **Port**: 3007
- **Purpose**: Centralized authentication and JWT token management
- **Responsibilities**:
  - User login/logout
  - JWT token generation and validation
  - Password hashing and verification
  - User registration
  - Token refresh

### 2. **Authentication Middleware** (`auth-service/auth-middleware.js`)
- **Purpose**: Reusable authentication components exported from auth service
- **Features**:
  - JWT token validation
  - Role-based access control
  - Resource ownership verification
  - Rate limiting
  - Optional authentication

### 3. **Protected Services**
- **User Service**: User management with ownership controls
- **Todo Service**: Todo management with user isolation
- **API Gateway**: Centralized routing with authentication awareness

## 🔑 Authentication Flow

### **User Registration**
```
1. Client → POST /api/auth/register
2. Auth Service → Hash password + Create user via User Service
3. Auth Service → Generate JWT token
4. Client ← JWT token + User info
```

### **User Login**
```
1. Client → POST /api/auth/login
2. Auth Service → Verify credentials with User Service
3. Auth Service → Generate JWT token
4. Client ← JWT token + User info
```

### **Protected Resource Access**
```
1. Client → Request with Authorization: Bearer <JWT>
2. Service → authenticateToken middleware
3. Middleware → Verify JWT (local + auth service fallback)
4. Service → Process request with user context
5. Client ← Protected resource
```

## 🛡️ Security Features

### **JWT Token Security**
- **Secret Key**: Environment variable `JWT_SECRET`
- **Expiration**: Configurable (default: 24 hours)
- **Algorithm**: HS256 (HMAC SHA-256)
- **Payload**: User ID, email, role, name

### **Password Security**
- **Hashing**: bcrypt with salt rounds (12)
- **Storage**: Hashed passwords only in database
- **Verification**: Secure comparison using bcrypt

### **Rate Limiting**
- **Default**: 100 requests per 15 minutes per IP
- **Configurable**: Per-endpoint limits
- **Protection**: Against brute force attacks

## 🔒 Authorization Levels

### **1. Public Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /health` - Service health checks

### **2. Authenticated Endpoints**
- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create todo for user
- `GET /api/users/:id` - Get own user profile

### **3. Role-Based Endpoints**
- `GET /api/users` - Admin only (list all users)
- `DELETE /api/users/:id` - Admin or own user

### **4. Ownership-Based Endpoints**
- `PUT /api/todos/:id` - Own todo only
- `DELETE /api/todos/:id` - Own todo only

## 📋 API Endpoints

### **Authentication Service**
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/verify       - Token verification
POST /api/auth/refresh      - Token refresh
GET  /api/auth/health       - Service health
```

### **Protected User Endpoints**
```
GET    /api/users           - List all users (Admin only)
GET    /api/users/:id       - Get user by ID (Own or Admin)
PUT    /api/users/:id       - Update user (Own or Admin)
DELETE /api/users/:id       - Delete user (Own or Admin)
POST   /api/users           - Create user (Public)
```

### **Protected Todo Endpoints**
```
GET    /api/todos           - Get user's todos
POST   /api/todos           - Create todo
GET    /api/todos/:id       - Get todo by ID (Own)
PUT    /api/todos/:id       - Update todo (Own)
DELETE /api/todos/:id       - Delete todo (Own)
GET    /api/todos/completed - Get completed todos
GET    /api/todos/pending   - Get pending todos
```

## 🚀 Usage Examples

### **1. User Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### **2. User Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### **3. Access Protected Resource**
```bash
curl -X GET http://localhost:3000/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### **4. Create Todo**
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Buy groceries"
  }'
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Authentication Service
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
USER_SERVICE_URL=http://localhost:3001

# Services
AUTH_SERVICE_URL=http://localhost:3007
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
MESSAGING_SERVICE_URL=http://localhost:3006
```

### **JWT Configuration**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
```

## 🛠️ Middleware Functions

### **authenticateToken**
- Validates JWT tokens
- Falls back to auth service verification
- Adds user info to `req.user`

### **requireRole(role)**
- Checks user role permissions
- Admin role has access to everything
- Configurable role requirements

### **requireOwnership(field)**
- Ensures users can only access their own resources
- Admin bypass for all resources
- Configurable resource ownership field

### **requireAccess(function)**
- Custom access control logic
- Async function support
- Flexible permission checking

### **optionalAuth**
- Non-blocking authentication
- Useful for public endpoints with optional user context
- Sets `req.user` to `null` if no token

### **rateLimit(maxRequests, windowMs)**
- IP-based rate limiting
- Configurable limits and time windows
- Protection against abuse

## 🔍 Token Verification Process

### **Local Verification (Fast)**
1. Extract token from Authorization header
2. Verify JWT signature locally using secret
3. Check token expiration
4. Add user info to request

### **Auth Service Fallback (Secure)**
1. If local verification fails, call auth service
2. Auth service validates token
3. Returns user information
4. Service continues with verified user

## 🚨 Error Handling

### **Authentication Errors**
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Invalid or expired token
- `429 Too Many Requests`: Rate limit exceeded

### **Authorization Errors**
- `403 Forbidden`: Insufficient permissions
- `403 Forbidden`: Resource ownership required

### **Security Best Practices**
- Never expose JWT secrets
- Use HTTPS in production
- Implement token refresh
- Monitor failed authentication attempts
- Regular security audits

## 🔄 Token Refresh Strategy

### **Automatic Refresh**
- Client detects token expiration
- Calls refresh endpoint with current token
- Receives new token
- Updates stored token

### **Refresh Endpoint**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <EXPIRED_TOKEN>"
```

## 📊 Monitoring & Logging

### **Authentication Logs**
- Login attempts (success/failure)
- Token verification results
- Rate limit violations
- Authorization failures

### **Security Metrics**
- Failed authentication attempts
- Token refresh frequency
- Role-based access patterns
- Resource ownership violations

## 🚀 Getting Started

### **1. Start Authentication Service**
```bash
cd auth-service
npm install
npm start
```

### **2. Update Service Dependencies**
```bash
# Add to each service package.json
"jsonwebtoken": "^9.0.2",
"bcryptjs": "^2.4.3"
```

### **3. Import Middleware**
```javascript
import { authenticateToken, requireRole } from '../auth-service/auth-middleware.js';
```

### **4. Apply to Routes**
```javascript
app.get('/protected', authenticateToken, (req, res) => {
  // Access req.user for authenticated user info
});
```

## 🔐 Production Considerations

### **Security Hardening**
- Use strong JWT secrets
- Implement token blacklisting
- Add request signing
- Enable CORS properly
- Use HTTPS everywhere

### **Performance Optimization**
- Redis for token storage
- JWT payload optimization
- Caching strategies
- Load balancing

### **Monitoring & Alerting**
- Authentication failures
- Token expiration patterns
- Rate limit violations
- Unusual access patterns

---

**Remember**: Authentication is your first line of defense. A well-implemented auth system protects all your services and ensures data security and user privacy! 🛡️
