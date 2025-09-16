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

// Vector service configuration
const VECTOR_SERVICE_URL = process.env.VECTOR_SERVICE_URL || 'http://localhost:3010';

// Custom middleware to check todo ownership
const requireTodoOwnership = async (req, res, next) => {
    try {
        const todoId = req.params.id;
        const todoRepository = AppDataSource.getRepository(Todo);
        
        logger.info('Todo ownership check', { 
            todoId, 
            userId: req.user?.userId,
            userRole: req.user?.role 
        });
        
        // Find the todo by ID using MongoDB _id field (the working approach)
        let todo;
        try {
            const { ObjectId } = await import('mongodb');
            todo = await todoRepository.findOne({
                where: { _id: new ObjectId(todoId) }
            });
        } catch (error) {
            logger.error('Error querying todo by ID', { todoId, error: error.message });
            todo = null;
        }
        
        
        logger.info('Todo lookup result', { 
            todoId, 
            found: !!todo,
            todoUserId: todo?.userId,
            requestingUserId: req.user?.userId
        });
        
        if (!todo) {
            logger.warn('Todo not found in ownership check', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        // Check if user owns the todo or is admin
        if (req.user.role === 'admin' || todo.userId === req.user.userId) {
            req.todo = todo; // Attach todo to request for use in route handler
            logger.info('Todo ownership verified', { todoId, userId: req.user.userId });
            next();
        } else {
            logger.warn('Todo access denied', { 
                todoId, 
                todoUserId: todo.userId, 
                requestingUserId: req.user.userId 
            });
            return res.status(403).json({ error: 'Access denied. You can only access your own todos.' });
        }
    } catch (error) {
        logger.error('Todo ownership check error', { error: error.message, todoId: req.params.id });
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

// Store todo embedding in vector service
const storeTodoEmbedding = async (todoData, token) => {
  try {
    logger.info('Storing todo embedding in vector service', { todoId: todoData.id });
    
    const response = await axios.post(`${VECTOR_SERVICE_URL}/api/vector/todos/embed`, {
      todoId: todoData.id,
      task: todoData.task,
      completed: todoData.completed
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      logger.info('Todo embedding stored successfully', { todoId: todoData.id });
      return true;
    } else {
      logger.error('Failed to store todo embedding');
      return false;
    }
  } catch (error) {
    logger.error('Error storing todo embedding', { error: error.message });
    // Don't fail the todo operation if embedding storage fails
    return false;
  }
};

// Delete todo embedding from vector service
const deleteTodoEmbedding = async (todoId, token) => {
  try {
    logger.info('Deleting todo embedding from vector service', { todoId });
    
    const response = await axios.delete(`${VECTOR_SERVICE_URL}/api/vector/todos/${todoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      logger.info('Todo embedding deleted successfully', { todoId });
      return true;
    } else {
      logger.error('Failed to delete todo embedding');
      return false;
    }
  } catch (error) {
    logger.error('Error deleting todo embedding', { error: error.message });
    // Don't fail the todo operation if embedding deletion fails
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
        
        // Store todo embedding in vector service
        const token = req.headers['authorization'].split(' ')[1];
        await storeTodoEmbedding(savedTodo, token);
        
        // Send todo creation notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: req.user.email, // real user email
            subject: 'New Todo Created',
            content: {
                name: req.user.name || req.user.email, // real user name
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
        
        // Use the same _id query approach that works in requireTodoOwnership
        const { ObjectId } = await import('mongodb');
        const todo = await todoRepository.findOne({
            where: { _id: new ObjectId(todoId) }
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
        
        // Use the same _id query approach that works in requireTodoOwnership
        const { ObjectId } = await import('mongodb');
        const todo = await todoRepository.findOne({ 
            where: { _id: new ObjectId(todoId) } 
        });
        
        if (!todo) {
            logger.warn('Todo not found for update', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        if (task !== undefined) todo.task = task;
        if (completed !== undefined) todo.completed = completed;
        
        todo.updatedAt = new Date();
        
        const updatedTodo = await todoRepository.save(todo);
        
        logger.todoUpdated(updatedTodo.id, updatedTodo.task, req.user.userId);
        
        // Update todo embedding in vector service
        const token = req.headers['authorization'].split(' ')[1];
        await storeTodoEmbedding(updatedTodo, token);
        
        // Send todo update notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: req.user.email, // real user email
            subject: 'Todo Updated',
            content: {
                name: req.user.name || req.user.email, // real user name
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
        
        // Use the same _id query approach that works in requireTodoOwnership
        const { ObjectId } = await import('mongodb');
        const todo = await todoRepository.findOne({ 
            where: { _id: new ObjectId(todoId) } 
        });
        
        if (!todo) {
            logger.warn('Todo not found for deletion', { todoId });
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        await todoRepository.remove(todo);
        
        logger.todoDeleted(todoId, req.user.userId);
        
        // Delete todo embedding from vector service
        const token = req.headers['authorization'].split(' ')[1];
        await deleteTodoEmbedding(todoId, token);
        
        // Send todo deletion notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: req.user.email,
            subject: 'Todo Deleted',
            content: {
                name: req.user.name || req.user.email,
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

/**
 * @swagger
 * /todos/search/semantic:
 *   post:
 *     summary: Smart semantic search for todos
 *     description: Search todos using semantic similarity instead of exact text matching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query for semantic matching
 *               limit:
 *                 type: integer
 *                 description: Maximum number of results
 *                 default: 10
 *               threshold:
 *                 type: number
 *                 description: Similarity threshold (0-1)
 *                 default: 0.7
 *               includeOthers:
 *                 type: boolean
 *                 description: Include anonymized results from other users
 *                 default: false
 *     responses:
 *       200:
 *         description: Semantic search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:
 *                       type: string
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           todoId:
 *                             type: string
 *                           userId:
 *                             type: integer
 *                           task:
 *                             type: string
 *                           similarity:
 *                             type: number
 *                           distance:
 *                             type: number
 *                           metadata:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                     totalResults:
 *                       type: integer
 *                     searchParams:
 *                       type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
app.post('/todos/search/semantic', authenticateToken, async (req, res) => {
    logger.info('Performing semantic todo search', { 
        userId: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const { query, limit = 10, threshold = 0.7, includeOthers = false } = req.body;
        
        if (!query) {
            logger.warn('Missing search query for semantic search', { userId: req.user?.userId });
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Call vector service for semantic search
        const token = req.headers['authorization'].split(' ')[1];
        const response = await axios.post(`${VECTOR_SERVICE_URL}/api/vector/todos/search`, {
            query,
            limit,
            threshold,
            includeOthers
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
            logger.success('Semantic search completed successfully', { 
                userId: req.user.userId,
                resultCount: response.data.data.totalResults 
            });
            res.json(response.data);
        } else {
            logger.error('Vector service returned error', { 
                status: response.status,
                userId: req.user.userId 
            });
            res.status(response.status).json(response.data);
        }

    } catch (error) {
        logger.error('Semantic search failed', { 
            userId: req.user?.userId,
            error: error.message 
        });
        
        if (error.response) {
            // Vector service error
            res.status(error.response.status).json(error.response.data);
        } else {
            // Network or other error
            res.status(500).json({ 
                error: 'Semantic search failed', 
                details: error.message 
            });
        }
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
