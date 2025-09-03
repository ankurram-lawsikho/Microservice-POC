import jwt from 'jsonwebtoken';
import axios from 'axios';

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
            console.log('❌ [AUTH] No token provided');
            return res.status(401).json({ 
                error: 'Access token required',
                message: 'Please provide a valid JWT token in the Authorization header'
            });
        }

        // Verify token locally first (faster)
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            console.log('✅ [AUTH] Token verified locally for user:', decoded.email);
            return next();
        } catch (jwtError) {
            console.log('⚠️  [AUTH] Local token verification failed, checking with auth service');
        }

        // If local verification fails, verify with auth service
        try {
            const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.valid) {
                req.user = response.data.user;
                console.log('✅ [AUTH] Token verified with auth service for user:', req.user.email);
                next();
            } else {
                throw new Error('Token invalid');
            }
        } catch (authError) {
            console.log('❌ [AUTH] Token verification failed with auth service');
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
            console.log('✅ [AUTH] Role check passed for user:', req.user.email, 'role:', userRole);
            next();
        } else {
            console.log('❌ [AUTH] Insufficient permissions for user:', req.user.email, 'required role:', role);
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
            console.log('✅ [AUTH] Admin access granted for user:', req.user.email);
            return next();
        }

        // Get resource user ID from params or body
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (!resourceUserId) {
            console.log('⚠️  [AUTH] No resource user ID found in request');
            return res.status(400).json({ 
                error: 'Resource user ID required',
                message: 'Unable to determine resource ownership'
            });
        }

        // Check if user owns the resource
        if (parseInt(req.user.userId) === parseInt(resourceUserId)) {
            console.log('✅ [AUTH] Ownership verified for user:', req.user.email);
            next();
        } else {
            console.log('❌ [AUTH] Ownership check failed for user:', req.user.email);
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
                console.log('✅ [AUTH] Access granted for user:', req.user.email);
                next();
            } else {
                console.log('❌ [AUTH] Access denied for user:', req.user.email);
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
        console.log('ℹ️  [AUTH] No token provided (optional auth)');
        req.user = null;
        return next();
    }

    // Try to verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('✅ [AUTH] Optional token verified for user:', decoded.email);
    } catch (error) {
        console.log('⚠️  [AUTH] Optional token verification failed');
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
            console.log('⚠️  [AUTH] Rate limit exceeded for IP:', ip);
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
