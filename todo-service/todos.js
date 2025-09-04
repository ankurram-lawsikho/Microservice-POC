import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { Todo } from "./entities/Todo.js";
import axios from 'axios';
import dotenv from 'dotenv';
import { authenticateToken, requireOwnership } from '../auth-service/auth-middleware.js';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const port = 3002;

// Enhanced structured logger
const logger = createLogger('todo-service');

app.use(express.json());

// Messaging service configuration
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';

// Custom middleware to check todo ownership
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
            req.todo = todo; // Attach todo to request for use in route handler
            next();
        } else {
            return res.status(403).json({ error: 'Access denied. You can only access your own todos.' });
        }
    } catch (error) {
        logger.error('Todo ownership check error', { error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Send notification via messaging service
const sendNotification = async (notificationData) => {
  try {
    logger.info('Sending notification via messaging service', { type: notificationData.type });
    
    const response = await axios.post(`${MESSAGING_SERVICE_URL}/api/notifications/publish`, notificationData);
    
    if (response.status === 200) {
      logger.info('Notification sent successfully via messaging service');
      return true;
    } else {
      logger.error('Failed to send notification via messaging service');
      return false;
    }
  } catch (error) {
    logger.error('Error sending notification', { error: error.message });
    // Don't fail the todo operation if notification fails
    return false;
  }
};

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.databaseConnected('MongoDB Atlas');
    })
    .catch((error) => {
        logger.databaseError(error);
    });

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get service health status
 *     description: Returns the health status of the Todo Service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 database:
 *                   type: string
 *                 databaseName:
 *                   type: string
 *                 connection:
 *                   type: string
 *                 todoCount:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', async (req, res) => {
    logger.info('Health check requested');
    try {
        const isInitialized = AppDataSource.isInitialized;
        
        if (!isInitialized) {
            logger.warn('Database not initialized');
            return res.status(503).json({
                status: 'ERROR',
                database: 'MongoDB Atlas',
                connection: 'Disconnected',
                message: 'Database not initialized'
            });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        const todoCount = await todoRepository.count();
        
        // Check messaging service health
        let messagingStatus = 'unknown';
        try {
            const messagingHealth = await axios.get(`${MESSAGING_SERVICE_URL}/api/health`);
            messagingStatus = messagingHealth.data.status;
        } catch (error) {
            messagingStatus = 'unavailable';
        }
        
        logger.info('Health check completed', { 
            todoCount,
            messagingStatus
        });
        
        res.json({
            status: 'OK',
            database: 'MongoDB Atlas',
            databaseName: 'microservice-todos',
            connection: 'Connected',
            todoCount: todoCount,
            messagingService: messagingStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Health check error', { error: error.message });
        res.status(500).json({
            status: 'ERROR',
            database: 'MongoDB Atlas',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Get all todos for authenticated user
 *     description: Retrieve a list of all todos for the authenticated user
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos', authenticateToken, async (req, res) => {
    logger.info('Fetching todos for user', { 
        userId: req.user?.userId,
        email: req.user?.email 
    });
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: req.user.userId },
            order: { createdAt: 'DESC' }
        });
        
        logger.info('Retrieved todos for user', { 
            userId: req.user.userId,
            count: todos.length 
        });
        res.json(todos);
    } catch (error) {
        logger.error('Error fetching todos', { 
            userId: req.user?.userId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Create a new todo
 *     description: Create a new todo for the authenticated user
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/todos', authenticateToken, async (req, res) => {
    logger.info('Creating new todo for user', { 
        userId: req.user?.userId,
        email: req.user?.email 
    });
    try {
        const { task } = req.body;
        
        if (!task) {
            logger.warn('Missing required fields for todo creation', { 
                userId: req.user?.userId 
            });
            return res.status(400).json({ error: 'Task is required' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        
        const todo = todoRepository.create({
            task,
            userId: req.user.userId,
            completed: false
        });
        
        const savedTodo = await todoRepository.save(todo);
        
        logger.todoCreated(savedTodo.id, savedTodo.task, req.user.userId);
        
        // Send todo creation notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com',
            subject: 'New Todo Created',
            content: {
                name: 'Test User',
                message: 'A new todo has been created for you',
                todos: [{
                    task: savedTodo.task,
                    completed: savedTodo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: savedTodo.id,
            userId: req.user.userId,
            operation: 'todo_created'
        };
        
        await sendNotification(notificationData);
        
        res.status(201).json(savedTodo);
        
    } catch (error) {
        logger.error('Todo creation error', { 
            userId: req.user?.userId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

/**
 * @swagger
 * /todos/{id}:
 *   get:
 *     summary: Get todo by ID
 *     description: Retrieve a specific todo by its ID (Own todo only)
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos/:id', authenticateToken, requireTodoOwnership, async (req, res) => {
    const todoId = req.params.id;
    logger.info('Fetching todo by ID', { 
        todoId,
        userId: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({
            where: { id: todoId }
        });
        
        if (!todo) {
            logger.warn('Todo not found', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        logger.info('Todo retrieved successfully', { todoId });
        res.json(todo);
    } catch (error) {
        logger.error('Error fetching todo', { 
            todoId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to fetch todo' });
    }
});

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Update todo
 *     description: Update an existing todo (Own todo only)
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.put('/todos/:id', authenticateToken, requireTodoOwnership, async (req, res) => {
    const todoId = req.params.id;
    logger.info('Updating todo', { 
        todoId,
        userId: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const { task, completed } = req.body;
        
        if (task === undefined && completed === undefined) {
            logger.warn('No fields to update for todo', { todoId });
            return res.status(400).json({ error: 'At least one field (task or completed) is required for update' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        
        if (!todo) {
            logger.warn('Todo not found for update', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        if (task !== undefined) todo.task = task;
        if (completed !== undefined) todo.completed = completed;
        
        todo.updatedAt = new Date();
        
        const updatedTodo = await todoRepository.save(todo);
        
        logger.todoUpdated(updatedTodo.id, updatedTodo.task, req.user.userId);
        
        // Send todo update notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com',
            subject: 'Todo Updated',
            content: {
                name: 'Test User',
                message: 'A todo has been updated for you',
                todos: [{
                    task: updatedTodo.task,
                    completed: updatedTodo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: updatedTodo.id,
            userId: req.user.userId,
            operation: 'todo_updated'
        };
        
        await sendNotification(notificationData);
        
        res.json(updatedTodo);
    } catch (error) {
        logger.error('Error updating todo', { 
            todoId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Delete todo
 *     description: Delete a todo by its ID (Own todo only)
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/todos/:id', authenticateToken, requireTodoOwnership, async (req, res) => {
    const todoId = req.params.id;
    logger.info('Deleting todo', { 
        todoId,
        userId: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        
        if (!todo) {
            logger.warn('Todo not found for deletion', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        await todoRepository.remove(todo);
        
        logger.todoDeleted(todoId, req.user.userId);
        
        // Send todo deletion notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com',
            subject: 'Todo Deleted',
            content: {
                name: 'Test User',
                message: 'A todo has been deleted for you',
                todos: [{
                    task: todo.task,
                    completed: todo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: todo.id,
            userId: req.user.userId,
            operation: 'todo_deleted'
        };
        
        await sendNotification(notificationData);
        
        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting todo', { 
            todoId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

/**
 * @swagger
 * /todos/completed:
 *   get:
 *     summary: Get completed todos for authenticated user
 *     description: Retrieve all completed todos for the authenticated user
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
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos/completed', authenticateToken, async (req, res) => {
    logger.info('Fetching completed todos for user', { 
        userId: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: req.user.userId, completed: true },
            order: { createdAt: 'DESC' }
        });
        
        logger.info('Retrieved completed todos for user', { 
            userId: req.user.userId,
            count: todos.length 
        });
        res.json(todos);
    } catch (error) {
        logger.error('Error fetching completed todos', { 
            userId: req.user?.userId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to fetch completed todos' });
    }
});

/**
 * @swagger
 * /todos/pending:
 *   get:
 *     summary: Get pending todos for authenticated user
 *     description: Retrieve all pending (incomplete) todos for the authenticated user
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
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos/pending', authenticateToken, async (req, res) => {
    logger.info('Fetching pending todos for user', { email: req.user?.email || 'unknown' });
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: req.user.userId, completed: false }, // Using authenticated user ID
            order: { createdAt: 'DESC' }
        });
        
        logger.info('Retrieved pending todos for user', { count: todos.length });
        res.json(todos);
    } catch (error) {
        logger.error('Error fetching pending todos', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch pending todos' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Database connection closed');
    }
    logger.serviceStop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Database connection closed');
    }
    logger.serviceStop();
    process.exit(0);
});

app.listen(port, () => {
    logger.serviceStart(port, [
        'todo-management',
        'mongodb-atlas',
        'messaging-integration',
        'authentication-middleware',
        'enhanced-logging'
    ]);
});
