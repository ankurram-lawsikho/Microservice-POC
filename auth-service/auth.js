import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const port = 3007;

// Enhanced structured logger
const logger = createLogger('auth-service');

app.use(express.json());
app.use(cors());

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// User service configuration
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Messaging service configuration
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';

// Send notification via messaging service
const sendNotification = async (notificationData) => {
    try {
        logger.info('Sending notification via messaging service', { type: notificationData.type });
        
        const response = await axios.post(`${MESSAGING_SERVICE_URL}/api/notifications/publish`, notificationData);
        
        if (response.status === 200) {
            logger.success('Notification sent successfully via messaging service');
            return true;
        } else {
            logger.error('Failed to send notification via messaging service');
            return false;
        }
    } catch (error) {
        logger.error('Error sending notification', { error: error.message });
        // Don't fail the auth operation if notification fails
        return false;
    }
};

// Middleware to validate JWT tokens
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to check if user has required role
export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    
    try {
        const { email, password } = req.body;
        logger.info('Login attempt', { email });
        
        if (!email || !password) {
            logger.warn('Missing credentials');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from user service
        const userResponse = await axios.get(`${USER_SERVICE_URL}/users/email/${email}`);
        const user = userResponse.data;

        if (!user) {
            logger.authFailed(email, 'User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password (assuming password is hashed in user service)
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            logger.authFailed(email, 'Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role || 'user',
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Send welcome email notification
        const welcomeNotificationData = {
            type: 'welcome_email',
            recipient: user.email, // Send email as string, not object
            subject: 'Welcome Back!',
            content: {
                userName: user.name,
                userEmail: user.email,
                loginTime: new Date().toISOString(),
                loginLocation: req.ip || 'Unknown'
            },
            template: 'welcome',
            userId: user.id,
            operation: 'user_login'
        };

        // Send notification asynchronously (don't wait for it)
        sendNotification(welcomeNotificationData).catch(error => {
            logger.error('Failed to send welcome email', { error: error.message });
        });

        logger.authSuccess(user.id, email, user.role);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'user'
            },
            expiresIn: JWT_EXPIRES_IN
        });

    } catch (error) {
        console.error('❌ [AUTH] Login error:', error.message);
        if (error.response?.status === 404) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    console.log('📝 [AUTH] Registration attempt');
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            console.log('⚠️  [AUTH] Missing registration fields');
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user via user service
        const userData = {
            name,
            email,
            password: hashedPassword
        };

        const userResponse = await axios.post(`${USER_SERVICE_URL}/users`, userData);
        const newUser = userResponse.data;

        console.log('✅ [AUTH] Registration successful for user:', email);
        res.status(201).json({
            message: 'User registered successfully. Please login to get your access token.',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('❌ [AUTH] Registration error:', error.message);
        if (error.response?.status === 409) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify token endpoint
app.post('/api/auth/verify', authenticateToken, (req, res) => {
    console.log('🔍 [AUTH] Token verification for user:', req.user.email);
    res.json({
        valid: true,
        user: req.user
    });
});

// Refresh token endpoint
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
    console.log('🔄 [AUTH] Token refresh for user:', req.user.email);
    
    const newToken = jwt.sign(
        { 
            userId: req.user.userId, 
            email: req.user.email, 
            role: req.user.role,
            name: req.user.name 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
        token: newToken,
        expiresIn: JWT_EXPIRES_IN
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🏥 [AUTH] Health check requested');
    res.json({
        status: 'OK',
        service: 'Authentication Service',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔌 [AUTH] Shutting down authentication service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔌 [AUTH] Shutting down authentication service...');
    process.exit(0);
});

app.listen(port, () => {
    logger.serviceStart(port, [
        'jwt-authentication',
        'user-service-integration',
        'welcome-email-notifications',
        'messaging-service-integration',
        'enhanced-logging'
    ]);
});
