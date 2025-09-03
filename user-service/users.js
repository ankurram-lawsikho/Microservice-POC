import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { User } from "./entities/User.js";
import axios from 'axios';
import dotenv from 'dotenv';
// Temporarily removed auth middleware for testing

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// Messaging service configuration
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';

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
    // Don't fail the user operation if notification fails
    return false;
  }
};

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log('✅ [DATABASE] Connection established');
    })
    .catch((error) => {
        console.error('❌ [DATABASE] Connection failed:', error.message);
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
    console.log('🏥 [API] Health check requested');
    try {
        const isInitialized = AppDataSource.isInitialized;
        
        if (!isInitialized) {
            console.log('⚠️  [HEALTH] Database not initialized');
            return res.status(503).json({
                status: 'ERROR',
                database: 'PostgreSQL',
                connection: 'Disconnected',
                message: 'Database not initialized'
            });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count();
        
        // Check messaging service health
        let messagingStatus = 'unknown';
        try {
            const messagingHealth = await axios.get(`${MESSAGING_SERVICE_URL}/api/health`);
            messagingStatus = messagingHealth.data.status;
        } catch (error) {
            messagingStatus = 'unavailable';
        }
        
        console.log('✅ [HEALTH] Health check completed, user count:', userCount);
        res.json({
            status: 'OK',
            database: 'PostgreSQL',
            connection: 'Connected',
            userCount: userCount,
            messagingService: messagingStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [HEALTH] Health check error:', error.message);
        res.status(500).json({
            status: 'ERROR',
            database: 'PostgreSQL',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users (Admin only)
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
            console.log('📋 [API] Fetching all users - Admin request from: anonymous (testing mode)');
    try {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        
        // Remove passwords from response
        const usersResponse = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        console.log('✅ [API] Retrieved users, count:', usersResponse.length);
        res.json(usersResponse);
    } catch (error) {
        console.error('❌ [API] Error fetching users:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID (Own user or Admin)
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
    const userId = req.params.id;
            console.log('👤 [API] Fetching user by ID:', userId, 'Requested by: anonymous (testing mode)');
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            console.log('⚠️  [API] User not found, ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...userResponse } = user;
        
        console.log('✅ [API] User retrieved successfully, ID:', userId);
        res.json(userResponse);
    } catch (error) {
        console.error('❌ [API] Error fetching user:', error.message);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Get user by email
 *     description: Retrieve a specific user by their email (Internal use by auth service)
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email
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
app.get('/users/email/:email', async (req, res) => {
    const email = req.params.email;
    console.log('📧 [API] Fetching user by email:', email);
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        
        if (!user) {
            console.log('⚠️  [API] User not found, email:', email);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('✅ [API] User retrieved successfully, email:', email);
        res.json(user);
    } catch (error) {
        console.error('❌ [API] Error fetching user by email:', error.message);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided information (Public endpoint)
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
    console.log('📝 [API] Creating new user');
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            console.log('⚠️  [API] Missing required fields for user creation');
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        
        // Check if user with email already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            console.log('⚠️  [API] User with email already exists:', email);
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        
        // Create new user instance with proper decorators
        const user = userRepository.create({
            name,
            email,
            password
        });
        
        const savedUser = await userRepository.save(user);
        
        console.log('✅ [API] User created successfully, ID:', savedUser.id);
        
        // Send welcome notification via messaging service
        const notificationData = {
            type: 'welcome',
            recipient: email,
            subject: 'Welcome to Our Platform!',
            content: {
                name: name,
                message: "Thank you for joining our platform. We're excited to have you on board!"
            },
            template: 'welcome',
            userId: savedUser.id,
            operation: 'user_created'
        };
        
        await sendNotification(notificationData);
        
        // Remove password from response
        const { password: _, ...userResponse } = savedUser;
        res.status(201).json(userResponse);
        
    } catch (error) {
        console.error('❌ [API] User creation error:', error.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user (Own user or Admin)
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
    const userId = req.params.id;
            console.log('✏️  [API] Updating user, ID:', userId, 'Requested by: anonymous (testing mode)');
    
    try {
        const { name, email } = req.body;
        
        if (!name && !email) {
            console.log('⚠️  [API] No fields to update for user ID:', userId);
            return res.status(400).json({ error: 'At least one field (name or email) is required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            console.log('⚠️  [API] User not found for update, ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (name) user.name = name;
        if (email) user.email = email;
        
        const updatedUser = await userRepository.save(user);
        
        // Remove password from response
        const { password, ...userResponse } = updatedUser;
        
        console.log('✅ [API] User updated successfully, ID:', userId);
        res.json(userResponse);
    } catch (error) {
        console.error('❌ [API] Error updating user:', error.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user by their ID (Own user or Admin)
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
    const userId = req.params.id;
            console.log('🗑️  [API] Deleting user, ID:', userId, 'Requested by: anonymous (testing mode)');
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            console.log('⚠️  [API] User not found for deletion, ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        await userRepository.remove(user);
        
        console.log('✅ [API] User deleted successfully, ID:', userId);
        res.status(204).send();
    } catch (error) {
        console.error('❌ [API] Error deleting user:', error.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔌 Shutting down user service...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔌 Shutting down user service...');
    process.exit(0);
});

app.listen(port, () => {
    console.log('🚀 [SERVICE] User service started');
    console.log('📍 [SERVICE] Running on port:', port);
    console.log('👥 [SERVICE] User management enabled');
    console.log('📨 [SERVICE] Messaging service integration enabled');
    console.log('🔐 [SERVICE] Authentication middleware temporarily disabled for testing');
});
