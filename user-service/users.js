import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./config/database.js";
import { User } from "./entities/User.js";
import axios from 'axios';
import dotenv from 'dotenv';
import { authenticateToken, requireRole, requireOwnership } from '../auth-service/auth-middleware.js';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const port = 3001;

// Enhanced structured logger
const logger = createLogger('user-service');

app.use(express.json());

// Messaging service configuration
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';

// Custom middleware to check user ownership
const requireUserOwnership = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        // Check if user is accessing their own profile or is admin
        if (req.user.role === 'admin' || parseInt(req.user.userId) === parseInt(userId)) {
            next();
        } else {
            return res.status(403).json({ error: 'Access denied. You can only access your own profile.' });
        }
    } catch (error) {
        console.error('❌ [AUTH] User ownership check error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

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
        logger.databaseConnected('PostgreSQL');
    })
    .catch((error) => {
        logger.databaseError(error);
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
    logger.info('Health check requested');
    try {
        const isInitialized = AppDataSource.isInitialized;
        
        if (!isInitialized) {
            logger.warn('Database not initialized');
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
        
        logger.info('Health check completed', { 
            userCount,
            messagingStatus
        });
        
        res.json({
            status: 'OK',
            database: 'PostgreSQL',
            connection: 'Connected',
            userCount: userCount,
            messagingService: messagingStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Health check error', { error: error.message });
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
app.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
    logger.info('Fetching all users - Admin request', { 
        adminId: req.user?.userId,
        adminEmail: req.user?.email 
    });
    try {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        
        // Remove passwords from response
        const usersResponse = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        logger.info('Retrieved users', { 
            count: usersResponse.length,
            adminId: req.user?.userId 
        });
        res.json(usersResponse);
    } catch (error) {
        logger.error('Error fetching users', { 
            adminId: req.user?.userId,
            error: error.message 
        });
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
app.get('/users/:id', authenticateToken, requireUserOwnership, async (req, res) => {
    const userId = req.params.id;
    logger.info('Fetching user by ID', { 
        userId,
        requestedBy: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            logger.warn('User not found', { userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...userResponse } = user;
        
        logger.info('User retrieved successfully', { userId });
        res.json(userResponse);
    } catch (error) {
        logger.error('Error fetching user', { 
            userId,
            error: error.message 
        });
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
    logger.info('Fetching user by email', { email });
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        
        if (!user) {
            logger.warn('User not found by email', { email });
            return res.status(404).json({ error: 'User not found' });
        }
        
        logger.info('User retrieved successfully by email', { email });
        res.json(user);
    } catch (error) {
        logger.error('Error fetching user by email', { 
            email,
            error: error.message 
        });
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
    logger.info('Creating new user');
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            logger.warn('Missing required fields for user creation', { 
                hasName: !!name,
                hasEmail: !!email,
                hasPassword: !!password
            });
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        
        // Check if user with email already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            logger.warn('User with email already exists', { email });
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        
        // Create new user instance with proper decorators
        const user = userRepository.create({
            name,
            email,
            password
        });
        
        const savedUser = await userRepository.save(user);
        
        logger.userCreated(savedUser.id, email, 'user');
        
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
        logger.error('User creation error', { error: error.message });
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
app.put('/users/:id', authenticateToken, requireUserOwnership, async (req, res) => {
    const userId = req.params.id;
    logger.info('Updating user', { 
        userId,
        requestedBy: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const { name, email } = req.body;
        
        if (!name && !email) {
            logger.warn('No fields to update for user', { userId });
            return res.status(400).json({ error: 'At least one field (name or email) is required' });
        }
        
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            logger.warn('User not found for update', { userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (name) user.name = name;
        if (email) user.email = email;
        
        const updatedUser = await userRepository.save(user);
        
        // Remove password from response
        const { password, ...userResponse } = updatedUser;
        
        logger.userUpdated(userId, email);
        res.json(userResponse);
    } catch (error) {
        logger.error('Error updating user', { 
            userId,
            error: error.message 
        });
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
app.delete('/users/:id', authenticateToken, requireUserOwnership, async (req, res) => {
    const userId = req.params.id;
    logger.info('Deleting user', { 
        userId,
        requestedBy: req.user?.userId,
        email: req.user?.email 
    });
    
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
        
        if (!user) {
            logger.warn('User not found for deletion', { userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        await userRepository.remove(user);
        
        logger.userDeleted(userId, user.email);
        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting user', { 
            userId,
            error: error.message 
        });
        res.status(500).json({ error: 'Failed to delete user' });
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
        'user-management',
        'postgresql',
        'messaging-integration',
        'authentication-middleware',
        'enhanced-logging'
    ]);
});
