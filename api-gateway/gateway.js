const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const port = 3005;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Define the base URLs of your microservices
const USER_SERVICE_URL = 'http://localhost:3001';
const TODO_SERVICE_URL = 'http://localhost:3002';

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Get API Gateway health status
 *     description: Returns the health status of the API Gateway
 *     responses:
 *       200:
 *         description: Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        gateway: 'Running',
        timestamp: new Date().toISOString(),
        services: {
            userService: `${USER_SERVICE_URL}/health`,
            todoService: `${TODO_SERVICE_URL}/health`
        }
    });
});

/**
 * @swagger
 * /services/health:
 *   get:
 *     tags: [Health]
 *     summary: Get health status of all services
 *     description: Returns the health status of all microservices
 *     responses:
 *       200:
 *         description: All services health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gateway:
 *                   type: string
 *                 userService:
 *                   $ref: '#/components/schemas/HealthResponse'
 *                 todoService:
 *                   $ref: '#/components/schemas/HealthResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/services/health', async (req, res) => {
    try {
        const userHealthPromise = axios.get(`${USER_SERVICE_URL}/health`).catch(() => ({ data: { status: 'DOWN' } }));
        const todoHealthPromise = axios.get(`${TODO_SERVICE_URL}/health`).catch(() => ({ data: { status: 'DOWN' } }));

        const [userHealth, todoHealth] = await Promise.all([userHealthPromise, todoHealthPromise]);

        res.json({
            gateway: 'OK',
            userService: userHealth.data,
            todoService: todoHealth.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            gateway: 'ERROR',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieve a list of all users from the User Service
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       503:
 *         description: User service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Create a new user with the provided information
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User with email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: User service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: User service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update an existing user's information
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: User service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Delete a user by their ID
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: User service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.use('/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/users': '/users'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`API Gateway: Proxying ${req.method} request to User Service: ${req.originalUrl}`);
        
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`API Gateway: User Service responded with status: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('API Gateway: User Service proxy error:', err.message);
        res.status(503).json({
            error: 'User service is unavailable',
            message: 'The user service is not running or not accessible'
        });
    },
    timeout: 10000
}));

/**
 * @swagger
 * /todos:
 *   get:
 *     tags: [Todos]
 *     summary: Get all todos
 *     description: Retrieve a list of all todos from the Todo Service
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Todos]
 *     summary: Create a new todo
 *     description: Create a new todo for a user
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /todos/{id}:
 *   get:
 *     tags: [Todos]
 *     summary: Get todo by ID
 *     description: Retrieve a specific todo by its ID
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
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Todos]
 *     summary: Update todo
 *     description: Update an existing todo
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Todos]
 *     summary: Delete todo
 *     description: Delete a todo by its ID
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
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /todos/user/{userId}:
 *   get:
 *     tags: [Todos]
 *     summary: Get todos by user ID
 *     description: Retrieve all todos for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of todos for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       503:
 *         description: Todo service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.use('/todos', createProxyMiddleware({
    target: TODO_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/todos': '/todos'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`API Gateway: Proxying ${req.method} request to Todo Service: ${req.originalUrl}`);
        
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`API Gateway: Todo Service responded with status: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('API Gateway: Todo Service proxy error:', err.message);
        res.status(503).json({
            error: 'Todo service is unavailable',
            message: 'The todo service is not running or not accessible'
        });
    },
    timeout: 15000
}));

/**
 * @swagger
 * /user-profile/{id}:
 *   get:
 *     tags: [Gateway]
 *     summary: Get combined user profile with todos
 *     description: Fetches user data and their todos from both services
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile with todos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Services unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/user-profile/:id', async (req, res) => {
    const userId = req.params.id;
    console.log(`API Gateway: Fetching combined profile for user ID: ${userId}`);

    try {
        const userPromise = axios.get(`${USER_SERVICE_URL}/users/${userId}`);
        const todosPromise = axios.get(`${TODO_SERVICE_URL}/todos/user/${userId}`);

        const [userResponse, todosResponse] = await Promise.all([userPromise, todosPromise]);

        const userProfile = {
            user: userResponse.data,
            todos: todosResponse.data
        };

        res.json(userProfile);

    } catch (error) {
        console.error("API Gateway: Error fetching user profile.", error.message);
        
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({ 
                error: 'Services unavailable',
                message: 'One or more services are not running'
            });
        } else {
            res.status(500).json({ 
                error: 'Error fetching user profile data',
                message: error.message 
            });
        }
    }
});

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Gateway]
 *     summary: Get API Gateway information
 *     description: Returns information about the API Gateway and available endpoints
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
 *                 endpoints:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
    res.json({
        message: 'API Gateway is running',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            health: '/health',
            servicesHealth: '/services/health',
            users: '/users*',
            todos: '/todos*',
            userProfile: '/user-profile/:id'
        },
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API Gateway: Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong in the API gateway'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: ['/users*', '/todos*', '/user-profile/:id', '/health', '/services/health', '/api-docs']
    });
});

app.listen(port, () => {
    console.log(`===========================================`);
    console.log(`🚀 API Gateway running on http://localhost:${port}`);
    console.log(`📚 Swagger Documentation: http://localhost:${port}/api-docs`);
    console.log(`===========================================`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  / - Gateway info`);
    console.log(`   GET  /health - Gateway health check`);
    console.log(`   GET  /services/health - All services health check`);
    console.log(`   ALL  /users* - User service proxy`);
    console.log(`   ALL  /todos* - Todo service proxy`);
    console.log(`   GET  /user-profile/:id - Combined user profile`);
    console.log(`   GET  /api-docs - Swagger documentation`);
    console.log(`===========================================`);
});