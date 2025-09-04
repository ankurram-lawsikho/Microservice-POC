import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import cors from 'cors';

// Authentication is handled at the individual service level

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Microservices API Documentation',
    customfavIcon: '/favicon.ico'
}));

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get overall system health
 *     description: Check the health status of all microservices through the gateway
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Gateway error
 */
app.get('/health', async (req, res) => {
    console.log('🏥 [GATEWAY] Health check requested');
    
    const services = {
        userService: USER_SERVICE_URL,
        todoService: TODO_SERVICE_URL,
        notificationService: NOTIFICATION_SERVICE_URL,
        messagingService: MESSAGING_SERVICE_URL,
        authService: AUTH_SERVICE_URL
    };

    const healthResults = {};

    for (const [serviceName, serviceUrl] of Object.entries(services)) {
        try {
            // Different services have different health endpoint paths
            let healthEndpoint = '/health';
            if (serviceName === 'notificationService' || serviceName === 'messagingService' || serviceName === 'authService') {
                healthEndpoint = '/api/health';
            }
            const response = await axios.get(`${serviceUrl}${healthEndpoint}`, { timeout: 5000 });
            healthResults[serviceName] = {
                status: 'OK',
                data: response.data,
                responseTime: response.headers['x-response-time'] || 'N/A'
            };
        } catch (error) {
            healthResults[serviceName] = {
                status: 'ERROR',
                error: error.message,
                code: error.code || 'UNKNOWN'
            };
        }
    }

    const overallStatus = Object.values(healthResults).every(result => result.status === 'OK') ? 'OK' : 'DEGRADED';

    res.json({
        status: overallStatus,
        gateway: 'OK',
        timestamp: new Date().toISOString(),
        services: healthResults
    });
});

/**
 * @swagger
 * /services/health:
 *   get:
 *     summary: Get individual service health
 *     description: Check the health status of each microservice individually
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Individual service health statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gateway:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       port:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       data:
 *                         type: object
 */
app.get('/services/health', async (req, res) => {
    console.log('🏥 [GATEWAY] Services health check requested');
    
    const services = [
        { name: 'User Service', url: USER_SERVICE_URL, port: 3001 },
        { name: 'Todo Service', url: TODO_SERVICE_URL, port: 3002 },
        { name: 'Notification Service', url: NOTIFICATION_SERVICE_URL, port: 3003 },
        { name: 'Messaging Service', url: MESSAGING_SERVICE_URL, port: 3006 },
        { name: 'Auth Service', url: AUTH_SERVICE_URL, port: 3007 }
    ];

    const healthResults = [];

    for (const service of services) {
        try {
            // Different services have different health endpoint paths
            let healthEndpoint = '/health';
            if (service.name === 'Notification Service' || service.name === 'Messaging Service' || service.name === 'Auth Service') {
                healthEndpoint = '/api/health';
            }
            const response = await axios.get(`${service.url}${healthEndpoint}`, { timeout: 5000 });
            healthResults.push({
                name: service.name,
                port: service.port,
                status: 'OK',
                data: response.data
            });
        } catch (error) {
            healthResults.push({
                name: service.name,
                port: service.port,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    res.json({
        gateway: 'OK',
        timestamp: new Date().toISOString(),
        services: healthResults
    });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User with email already exists
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 * /api/auth/verify:
 *   post:
 *     summary: Verify JWT token
 *     description: Verify the validity of a JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid token
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using the current one
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid token
 */
// Authentication service routes (public)
app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/auth'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('🔐 [GATEWAY] Auth service request:', req.method, req.path)
        
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('✅ [GATEWAY] Auth service response:', proxyRes.statusCode);
    }
}));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users - requires admin role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - insufficient permissions
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account (public endpoint)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User with email already exists
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID (own user or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not own user or admin
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     description: Update an existing user (own user or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     description: Delete a user by their ID (own user or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
// User service routes (protected)
app.use('/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/users': '/users'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('👤 [GATEWAY] User service request:', req.method, req.path);

        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('✅ [GATEWAY] User service response:', proxyRes.statusCode);
    }
}));

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Get user's todos
 *     description: Retrieve all todos for the authenticated user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized - no token provided
 *   post:
 *     summary: Create a new todo
 *     description: Create a new todo for the authenticated user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 * /todos/{id}:
 *   get:
 *     summary: Get todo by ID
 *     description: Retrieve a specific todo by its ID (own todo only)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Todo found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not own todo
 *       404:
 *         description: Todo not found
 *   put:
 *     summary: Update todo
 *     description: Update an existing todo (own todo only)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Todo not found
 *   delete:
 *     summary: Delete todo
 *     description: Delete a todo by its ID (own todo only)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID (MongoDB ObjectId)
 *     responses:
 *       204:
 *         description: Todo deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Todo not found
 * /todos/completed:
 *   get:
 *     summary: Get completed todos
 *     description: Retrieve all completed todos for the authenticated user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 * /todos/pending:
 *   get:
 *     summary: Get pending todos
 *     description: Retrieve all pending (incomplete) todos for the authenticated user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Unauthorized
 */
// Todo service routes (protected)
app.use('/todos', createProxyMiddleware({
    target: TODO_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/todos': '/todos'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('✅ [GATEWAY] Todo service request:', req.method, req.path);

        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('✅ [GATEWAY] Todo service response:', proxyRes.statusCode);
    }
}));

// Messaging service routes (internal)
app.use('/api/messaging', createProxyMiddleware({
    target: MESSAGING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/messaging': '/api'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('📨 [GATEWAY] Messaging service request:', req.method, req.path);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('✅ [GATEWAY] Messaging service response:', proxyRes.statusCode);
    }
}));

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Gateway information
 *     description: Get information about the API Gateway and available services
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Gateway information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                     users:
 *                       type: string
 *                     todos:
 *                       type: string
 *                     notifications:
 *                       type: string
 *                     messaging:
 *                       type: string
 *                 documentation:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Microservices API Gateway',
        version: '1.0.0',
        services: {
            auth: `${AUTH_SERVICE_URL}/api/auth`,
            users: `${USER_SERVICE_URL}/users`,
            todos: `${TODO_SERVICE_URL}/todos`,
            notifications: `${NOTIFICATION_SERVICE_URL}/notifications`,
            messaging: `${MESSAGING_SERVICE_URL}/api`
        },
        documentation: '/api-docs',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ [GATEWAY] Error:', err.message);
    res.status(500).json({
        error: 'Gateway Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route Not Found',
        message: `The route ${req.originalUrl} does not exist`,
        availableRoutes: [
            '/api/auth/*',
            '/users/*',
            '/todos/*',
            '/api/messaging/*',
            '/health',
            '/services/health',
            '/api-docs'
        ],
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔌 [GATEWAY] Shutting down API Gateway...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔌 [GATEWAY] Shutting down API Gateway...');
    process.exit(0);
});

app.listen(port, () => {
    console.log('🚀 [GATEWAY] API Gateway started');
    console.log('📍 [GATEWAY] Running on port:', port);
    console.log('🔐 [GATEWAY] Authentication service routing enabled (temporarily disabled for testing)');
    console.log('👤 [GATEWAY] User service routing enabled');
    console.log('✅ [GATEWAY] Todo service routing enabled');
    console.log('📨 [GATEWAY] Messaging service routing enabled');
    console.log('📧 [GATEWAY] Notification service routing enabled');
});