import jwt from 'jsonwebtoken';
import axios from 'axios';
import { createLogger } from '../logger-service/logger.js';

const logger = createLogger('auth-middleware');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to authenticate JWT tokens
 * This middleware validates JWT tokens and adds user info to req.user
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            logger.warn('Authentication failed - no token provided', { 
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(401).json({ 
                error: 'Access token required',
                message: 'Please provide a valid JWT token in the Authorization header'
            });
        }

        // Verify token locally first (faster)
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            logger.info('Token verified locally', { 
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            });
            return next();
        } catch (jwtError) {
            logger.warn('Local token verification failed, checking with auth service', { 
                error: jwtError.message 
            });
        }

        // If local verification fails, verify with auth service
        try {
            const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.valid) {
                req.user = response.data.user;
                logger.info('Token verified with auth service', { 
                    userId: req.user.userId,
                    email: req.user.email,
                    role: req.user.role
                });
                next();
            } else {
                throw new Error('Token invalid');
            }
        } catch (authError) {
            logger.error('Token verification failed with auth service', { 
                status: response.status,
                error: response.data?.error
            });
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                message: 'Please login again to get a new token'
            });
        }

    } catch (error) {
        console.error('❌ [AUTH] Authentication error:', error.message);
        return res.status(500).json({ 
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
};

/**
 * Middleware to check if user has required role
 * @param {string} role - Required role
 * @param {boolean} allowAdmin - Whether admin role should have access (default: true)
 */
export const requireRole = (role, allowAdmin = true) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please login to access this resource'
            });
        }
        
        const userRole = req.user.role || 'user';
        
        if (userRole === role || (allowAdmin && userRole === 'admin')) {
            logger.info('Role check passed', { 
                userId: req.user.userId,
                email: req.user.email,
                userRole: userRole,
                requiredRole: role
            });
            next();
        } else {
            logger.warn('Insufficient permissions', { 
                userId: req.user.userId,
                email: req.user.email,
                userRole: userRole,
                requiredRole: role
            });
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                message: `This resource requires ${role} role or higher`
            });
        }
    };
};

/**
 * Middleware to check if user owns the resource or has admin role
 * @param {string} resourceUserIdField - Field name containing user ID in request params/body
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please login to access this resource'
            });
        }

        const userRole = req.user.role || 'user';
        
        // Admin can access any resource
        if (userRole === 'admin') {
            logger.info('Admin access granted', { 
                userId: req.user.userId,
                email: req.user.email
            });
            return next();
        }

        // Get resource user ID from params or body
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (!resourceUserId) {
            logger.warn('No resource user ID found in request', { 
                path: req.path,
                method: req.method
            });
            return res.status(400).json({ 
                error: 'Resource user ID required',
                message: 'Unable to determine resource ownership'
            });
        }

        // Check if user owns the resource
        if (parseInt(req.user.userId) === parseInt(resourceUserId)) {
            logger.info('Ownership verified', { 
                userId: req.user.userId,
                email: req.user.email,
                resourceUserId: resourceUserId
            });
            next();
        } else {
            logger.warn('Ownership check failed', { 
                userId: req.user.userId,
                email: req.user.email,
                resourceUserId: resourceUserId
            });
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'You can only access your own resources'
            });
        }
    };
};

/**
 * Middleware to check if user can access a specific resource
 * @param {Function} accessCheckFunction - Function that returns true if access is allowed
 */
export const requireAccess = (accessCheckFunction) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please login to access this resource'
            });
        }

        try {
            const hasAccess = await accessCheckFunction(req.user, req);
            
            if (hasAccess) {
                logger.info('Access granted', { 
                    userId: req.user.userId,
                    email: req.user.email,
                    checkType: 'admin_or_owner'
                });
                next();
            } else {
                logger.warn('Access denied', { 
                    userId: req.user.userId,
                    email: req.user.email,
                    checkType: 'admin_or_owner'
                });
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'You do not have permission to access this resource'
                });
            }
        } catch (error) {
            console.error('❌ [AUTH] Access check error:', error.message);
            return res.status(500).json({ 
                error: 'Access check failed',
                message: 'Internal server error during access verification'
            });
        }
    };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that can work with or without authentication
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.info('Optional authentication - no token provided', { 
            ip: req.ip,
            path: req.path
        });
        req.user = null;
        return next();
    }

    // Try to verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        logger.info('Optional token verified', { 
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        });
    } catch (error) {
        logger.warn('Optional token verification failed', { 
            error: error.message,
            ip: req.ip
        });
        req.user = null;
    }
    
    next();
};

/**
 * Rate limiting middleware (basic implementation)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        if (requests.has(ip)) {
            const userRequests = requests.get(ip).filter(time => time > windowStart);
            requests.set(ip, userRequests);
        }
        
        const userRequests = requests.get(ip) || [];
        
        if (userRequests.length >= maxRequests) {
            logger.warn('Rate limit exceeded', { 
                ip: ip,
                limit: limit,
                windowMs: windowMs
            });
            return res.status(429).json({ 
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.'
            });
        }
        
        userRequests.push(now);
        requests.set(ip, userRequests);
        
        next();
    };
};
