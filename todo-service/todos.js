import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { Todo } from "./entities/Todo.js";

const app = express();
const port = 3002;

app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("MongoDB connection established");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
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
    try {
        const isInitialized = AppDataSource.isInitialized;
        
        if (!isInitialized) {
            return res.status(503).json({
                status: 'ERROR',
                database: 'MongoDB Atlas',
                connection: 'Disconnected',
                message: 'Database not initialized'
            });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        const todoCount = await todoRepository.count();
        
        res.json({
            status: 'OK',
            database: 'MongoDB Atlas',
            databaseName: 'microservice-todos',
            connection: 'Connected',
            todoCount: todoCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
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
 *     summary: Get all todos
 *     description: Retrieve a list of all todos
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos', async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        const todos = await todoRepository.find();
        console.log('Todo Service: Responding with all todos.');
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /todos/user/{userId}:
 *   get:
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/todos/user/:userId', async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const userId = parseInt(req.params.userId, 10);
        const todoRepository = AppDataSource.getRepository(Todo);
        const userTodos = await todoRepository.find({ where: { userId } });
        
        console.log(`Todo Service: Responding with todos for user ID: ${userId}`);
        res.json(userTodos);
    } catch (error) {
        console.error('Error fetching user todos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /todos:
 *   post:
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
 *         description: Database not connected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/todos', async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const { userId, task, completed = false } = req.body;
        
        if (!userId || !task) {
            return res.status(400).json({ error: 'userId and task are required' });
        }
        
        const todoRepository = AppDataSource.getRepository(Todo);
        
        const newTodo = todoRepository.create({
            userId,
            task,
            completed
        });
        
        const savedTodo = await todoRepository.save(newTodo);
        console.log('Todo Service: Created new todo with ID:', savedTodo.id);
        res.status(201).json(savedTodo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Update todo
 *     description: Update an existing todo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID
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
 */
app.put('/todos/:id', async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const todoId = req.params.id;
        const { task, completed } = req.body;
        const todoRepository = AppDataSource.getRepository(Todo);
        
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        todoRepository.merge(todo, { task, completed });
        const updatedTodo = await todoRepository.save(todo);
        
        console.log(`Todo Service: Updated todo ID: ${todoId}`);
        res.json(updatedTodo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Delete todo
 *     description: Delete a todo by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID
 *     responses:
 *       204:
 *         description: Todo deleted successfully
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/todos/:id', async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        
        const todoId = req.params.id;
        const todoRepository = AppDataSource.getRepository(Todo);
        
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        await todoRepository.remove(todo);
        console.log(`Todo Service: Deleted todo ID: ${todoId}`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`--- Todo Service listening on port ${port} ---`);
});
