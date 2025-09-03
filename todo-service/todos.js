import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { Todo } from "./entities/Todo.js";
import axios from 'axios';
import dotenv from 'dotenv';
// Temporarily removed auth middleware for testing

dotenv.config();

const app = express();
const port = 3002;

app.use(express.json());

// Messaging service configuration
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';

// Default user ID for testing (since auth is temporarily disabled)
const DEFAULT_TEST_USER_ID = 1;

// Send notification via messaging service
const sendNotification = async (notificationData) => {
  try {
    console.log('📤 [MESSAGING] Sending notification via messaging service:', notificationData.type);
    
    const response = await axios.post(`${MESSAGING_SERVICE_URL}/api/notifications/publish`, notificationData);
    
    if (response.status === 200) {
      console.log('✅ [MESSAGING] Notification sent successfully via messaging service');
      return true;
    } else {
      console.error('❌ [MESSAGING] Failed to send notification via messaging service');
      return false;
    }
  } catch (error) {
    console.error('❌ [MESSAGING] Error sending notification:', error.message);
    // Don't fail the todo operation if notification fails
    return false;
  }
};

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log('✅ [DATABASE] MongoDB connection established');
    })
    .catch((error) => {
        console.error('❌ [DATABASE] MongoDB connection failed:', error.message);
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
    console.log('🏥 [API] Health check requested');
    try {
        const isInitialized = AppDataSource.isInitialized;
        
        if (!isInitialized) {
            console.log('⚠️  [HEALTH] Database not initialized');
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
        
        console.log('✅ [HEALTH] Health check completed, todo count:', todoCount);
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
        console.error('❌ [HEALTH] Health check error:', error.message);
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
app.get('/todos', async (req, res) => {
            console.log('📋 [API] Fetching todos for user: anonymous (testing mode)');
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: DEFAULT_TEST_USER_ID }, // Using default user ID for testing
            order: { createdAt: 'DESC' }
        });
        
        console.log('✅ [API] Retrieved todos for user, count:', todos.length);
        res.json(todos);
    } catch (error) {
        console.error('❌ [API] Error fetching todos:', error.message);
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
app.post('/todos', async (req, res) => {
            console.log('📝 [API] Creating new todo for user: anonymous (testing mode)');
    try {
        const { task } = req.body;
        
        if (!task) {
            console.log('⚠️  [API] Missing required fields for todo creation');
            return res.status(400).json({ error: 'Task is required' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        
        const todo = todoRepository.create({
            task,
            userId: DEFAULT_TEST_USER_ID, // Using default user ID for testing
            completed: false
        });
        
        const savedTodo = await todoRepository.save(todo);
        
        console.log('✅ [API] Todo created successfully, ID:', savedTodo.id);
        
        // Send todo creation notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com', // Default email for testing
            subject: 'New Todo Created',
            content: {
                name: 'Test User', // Default name for testing
                message: 'A new todo has been created for you',
                todos: [{
                    task: savedTodo.task,
                    completed: savedTodo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: savedTodo.id,
            userId: DEFAULT_TEST_USER_ID, // Using default user ID for testing
            operation: 'todo_created'
        };
        
        await sendNotification(notificationData);
        
        res.status(201).json(savedTodo);
        
    } catch (error) {
        console.error('❌ [API] Todo creation error:', error.message);
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
app.get('/todos/:id', async (req, res) => {
    const todoId = req.params.id;
            console.log('📋 [API] Fetching todo by ID:', todoId, 'Requested by: anonymous (testing mode)');
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({
            where: { id: todoId }
        });
        
        if (!todo) {
            console.log('⚠️  [API] Todo not found, ID:', todoId);
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        console.log('✅ [API] Todo retrieved successfully, ID:', todoId);
        res.json(todo);
    } catch (error) {
        console.error('❌ [API] Error fetching todo:', error.message);
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
app.put('/todos/:id', async (req, res) => {
    const todoId = req.params.id;
            console.log('✏️  [API] Updating todo, ID:', todoId, 'Requested by: anonymous (testing mode)');
    
    try {
        const { task, completed } = req.body;
        
        if (task === undefined && completed === undefined) {
            console.log('⚠️  [API] No fields to update for todo ID:', todoId);
            return res.status(400).json({ error: 'At least one field (task or completed) is required for update' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        
        if (!todo) {
            console.log('⚠️  [API] Todo not found for update, ID:', todoId);
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        if (task !== undefined) todo.task = task;
        if (completed !== undefined) todo.completed = completed;
        
        todo.updatedAt = new Date();
        
        const updatedTodo = await todoRepository.save(todo);
        
        console.log('✅ [API] Todo updated successfully, ID:', todoId);
        
        // Send todo update notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com', // Default email for testing
            subject: 'Todo Updated',
            content: {
                name: 'Test User', // Default name for testing
                message: 'A todo has been updated for you',
                todos: [{
                    task: updatedTodo.task,
                    completed: updatedTodo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: updatedTodo.id,
            userId: DEFAULT_TEST_USER_ID, // Using default user ID for testing
            operation: 'todo_updated'
        };
        
        await sendNotification(notificationData);
        
        res.json(updatedTodo);
    } catch (error) {
        console.error('❌ [API] Error updating todo:', error.message);
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
app.delete('/todos/:id', async (req, res) => {
    const todoId = req.params.id;
            console.log('🗑️  [API] Deleting todo, ID:', todoId, 'Requested by: anonymous (testing mode)');
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        
        if (!todo) {
            console.log('⚠️  [API] Todo not found for deletion, ID:', todoId);
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        await todoRepository.remove(todo);
        
        console.log('✅ [API] Todo deleted successfully, ID:', todoId);
        
        // Send todo deletion notification via messaging service
        const notificationData = {
            type: 'todo_reminder',
            recipient: 'test@example.com', // Default email for testing
            subject: 'Todo Deleted',
            content: {
                name: 'Test User', // Default name for testing
                message: 'A todo has been deleted for you',
                todos: [{
                    task: todo.task,
                    completed: todo.completed
                }]
            },
            template: 'todo_reminder',
            todoId: todo.id,
            userId: DEFAULT_TEST_USER_ID, // Using default user ID for testing
            operation: 'todo_deleted'
        };
        
        await sendNotification(notificationData);
        
        res.status(204).send();
    } catch (error) {
        console.error('❌ [API] Error deleting todo:', error.message);
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
app.get('/todos/completed', async (req, res) => {
            console.log('✅ [API] Fetching completed todos for user: anonymous (testing mode)');
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: DEFAULT_TEST_USER_ID, completed: true }, // Using default user ID for testing
            order: { createdAt: 'DESC' }
        });
        
        console.log('✅ [API] Retrieved completed todos for user, count:', todos.length);
        res.json(todos);
    } catch (error) {
        console.error('❌ [API] Error fetching completed todos:', error.message);
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
app.get('/todos/pending', async (req, res) => {
            console.log('⏳ [API] Fetching pending todos for user: anonymous (testing mode)');
    
    try {
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find({
            where: { userId: DEFAULT_TEST_USER_ID, completed: false }, // Using default user ID for testing
            order: { createdAt: 'DESC' }
        });
        
        console.log('✅ [API] Retrieved pending todos for user, count:', todos.length);
        res.json(todos);
    } catch (error) {
        console.error('❌ [API] Error fetching pending todos:', error.message);
        res.status(500).json({ error: 'Failed to fetch pending todos' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 [SHUTDOWN] Received SIGINT, shutting down gracefully...');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ [SHUTDOWN] Database connection closed');
    }
    console.log('✅ [SHUTDOWN] Todo service stopped');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔄 [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ [SHUTDOWN] Database connection closed');
    }
    console.log('✅ [SHUTDOWN] Todo service stopped');
    process.exit(0);
});

app.listen(port, () => {
    console.log('🚀 [SERVICE] Todo service started');
    console.log('📍 [SERVICE] Running on port:', port);
    console.log('✅ [SERVICE] Todo management enabled');
    console.log('🗄️  [SERVICE] MongoDB Atlas connected');
    console.log('📨 [SERVICE] Messaging service integration enabled');
    console.log('🔐 [SERVICE] Authentication middleware temporarily disabled for testing');
});
