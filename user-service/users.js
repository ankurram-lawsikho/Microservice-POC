import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { User } from "./entities/User.js";

const app = express();
const port = 3001;

app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("Database connection established");
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get service health status
 *     description: Returns the health status of the User Service
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
 *                 userCount:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', async (req, res) => {
    try {
        const isInitialized = AppDataSource.isInitialized;
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();
        
        res.json({
            status: 'OK',
            database: isInitialized ? 'Connected' : 'Disconnected',
            userCount: userCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            database: 'Error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/users', async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        console.log('User Service: Responding with all users.');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
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
 */
app.get('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (user) {
            console.log(`User Service: Responding with user ID: ${userId}`);
            res.json(user);
        } else {
            console.log(`User Service: User with ID: ${userId} not found.`);
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /users:
 *   post:
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
 */
app.post('/users', async (req, res) => {
    try {
        console.log('POST /users - Request body:', req.body);
        
        const { name, email, password } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        
        const newUser = userRepository.create({
            name,
            email,
            password: password || null
        });
        
        console.log('Creating user:', newUser);
        
        const savedUser = await userRepository.save(newUser);
        console.log('User Service: Created new user with ID:', savedUser.id);
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error creating user:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
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
 */
app.put('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { name, email, password } = req.body;
        const userRepository = AppDataSource.getRepository(User);
        
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        userRepository.merge(user, { name, email, password });
        const updatedUser = await userRepository.save(user);
        
        console.log(`User Service: Updated user ID: ${userId}`);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
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
 */
app.delete('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const userRepository = AppDataSource.getRepository(User);
        
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await userRepository.remove(user);
        console.log(`User Service: Deleted user ID: ${userId}`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`--- User Service listening on port ${port} ---`);
});
