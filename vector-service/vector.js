import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, testConnection, healthCheck, closeConnections } from './config/database.js';
import VectorSearchService from './services/vectorSearchService.js';
import EmbeddingService from './services/embeddingService.js';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

// Enhanced structured logger
const logger = createLogger('vector-service');

app.use(express.json());
app.use(cors());

// Initialize services
const vectorSearchService = new VectorSearchService();
const embeddingService = new EmbeddingService();

// Service configurations
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3008';

// Middleware to validate JWT tokens via auth service
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.valid) {
            req.user = data.user;
            next();
        } else {
            return res.status(403).json({ error: 'Invalid token' });
        }
    } catch (error) {
        logger.error('Token validation failed', { error: error.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Initialize database connection with pgvector extension
const startDatabase = async () => {
    try {
        // Test connection first
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection test failed');
        }
        
        // Initialize database with tables and extensions
        await initializeDatabase();
        logger.success('Vector service database connected successfully with pgvector extension');
    } catch (error) {
        logger.error('Database connection failed', { error: error.message });
        process.exit(1);
    }
};

// ==================== EMBEDDING ENDPOINTS ====================

// Store todo embedding
app.post('/api/vector/todos/embed', authenticateToken, async (req, res) => {
    try {
        const { todoId, task, completed = false } = req.body;
        
        if (!todoId || !task) {
            return res.status(400).json({ error: 'todoId and task are required' });
        }

        logger.info('Storing todo embedding', { 
            userId: req.user.userId, 
            todoId,
            taskLength: task.length 
        });

        const todoData = {
            todoId,
            userId: req.user.userId,
            task,
            completed
        };

        const embedding = await vectorSearchService.storeTodoEmbedding(todoData);

        logger.success('Todo embedding stored successfully', { 
            userId: req.user.userId,
            todoId 
        });

        res.json({
            success: true,
            data: {
                id: embedding.id,
                todoId: embedding.todoId,
                userId: embedding.userId,
                task: embedding.task,
                createdAt: embedding.createdAt
            },
            message: 'Todo embedding stored successfully'
        });

    } catch (error) {
        logger.error('Failed to store todo embedding', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to store todo embedding', 
            details: error.message 
        });
    }
});

// Store AI content embedding
app.post('/api/vector/ai-content/embed', authenticateToken, async (req, res) => {
    try {
        const { contentType, originalText, metadata = {} } = req.body;
        
        if (!contentType || !originalText) {
            return res.status(400).json({ error: 'contentType and originalText are required' });
        }

        logger.info('Storing AI content embedding', { 
            userId: req.user.userId, 
            contentType,
            textLength: originalText.length 
        });

        const contentData = {
            userId: req.user.userId,
            contentType,
            originalText
        };

        const embedding = await vectorSearchService.storeAIContentEmbedding(contentData, metadata);

        logger.success('AI content embedding stored successfully', { 
            userId: req.user.userId,
            contentType 
        });

        res.json({
            success: true,
            data: {
                id: embedding.id,
                userId: embedding.userId,
                contentType: embedding.contentType,
                createdAt: embedding.createdAt
            },
            message: 'AI content embedding stored successfully'
        });

    } catch (error) {
        logger.error('Failed to store AI content embedding', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to store AI content embedding', 
            details: error.message 
        });
    }
});

// Store user profile embedding
app.post('/api/vector/user-profile/embed', authenticateToken, async (req, res) => {
    try {
        const { name, email, role = 'user', metadata = {} } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'name and email are required' });
        }

        logger.info('Storing user profile embedding', { 
            userId: req.user.userId, 
            name,
            email 
        });

        const profileData = {
            userId: req.user.userId,
            name,
            email,
            role
        };

        const embedding = await vectorSearchService.storeUserProfileEmbedding(profileData, metadata);

        logger.success('User profile embedding stored successfully', { 
            userId: req.user.userId 
        });

        res.json({
            success: true,
            data: {
                id: embedding.id,
                userId: embedding.userId,
                createdAt: embedding.createdAt
            },
            message: 'User profile embedding stored successfully'
        });

    } catch (error) {
        logger.error('Failed to store user profile embedding', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to store user profile embedding', 
            details: error.message 
        });
    }
});

// ==================== SEARCH ENDPOINTS ====================

// Smart todo search using semantic similarity
app.post('/api/vector/todos/search', authenticateToken, async (req, res) => {
    try {
        const { query, limit = 10, threshold = 0.7, includeOthers = false } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        logger.info('Performing semantic todo search', { 
            userId: req.user.userId, 
            query,
            limit,
            threshold 
        });

        // Search in user's todos first
        const userResults = await vectorSearchService.searchSimilarTodos(
            query, 
            req.user.userId, 
            limit, 
            threshold
        );

        let allResults = userResults;

        // Optionally include results from other users (anonymized)
        if (includeOthers && userResults.length < limit) {
            const otherResults = await vectorSearchService.searchSimilarTodos(
                query, 
                null, // No user filter
                limit - userResults.length, 
                threshold
            );
            
            // Anonymize other users' results
            const anonymizedResults = otherResults
                .filter(result => result.userId !== req.user.userId)
                .map(result => ({
                    ...result,
                    userId: null, // Anonymize
                    metadata: { ...result.metadata, anonymized: true }
                }));
            
            allResults = [...userResults, ...anonymizedResults];
        }

        logger.success('Semantic todo search completed', { 
            userId: req.user.userId,
            resultCount: allResults.length 
        });

        res.json({
            success: true,
            data: {
                query,
                results: allResults,
                totalResults: allResults.length,
                searchParams: {
                    limit,
                    threshold,
                    includeOthers
                }
            },
            message: 'Semantic search completed successfully'
        });

    } catch (error) {
        logger.error('Semantic todo search failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Semantic search failed', 
            details: error.message 
        });
    }
});

// Search similar AI content
app.post('/api/vector/ai-content/search', authenticateToken, async (req, res) => {
    try {
        const { query, contentType = null, limit = 10, threshold = 0.7 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        logger.info('Searching similar AI content', { 
            userId: req.user.userId, 
            query,
            contentType,
            limit,
            threshold 
        });

        const results = await vectorSearchService.searchAIContent(
            query, 
            req.user.userId, 
            contentType, 
            limit, 
            threshold
        );

        logger.success('AI content search completed', { 
            userId: req.user.userId,
            resultCount: results.length 
        });

        res.json({
            success: true,
            data: {
                query,
                results,
                totalResults: results.length,
                searchParams: {
                    contentType,
                    limit,
                    threshold
                }
            },
            message: 'AI content search completed successfully'
        });

    } catch (error) {
        logger.error('AI content search failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'AI content search failed', 
            details: error.message 
        });
    }
});

// Get contextual suggestions
app.post('/api/vector/suggestions/contextual', authenticateToken, async (req, res) => {
    try {
        const { context, limit = 5 } = req.body;
        
        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }

        logger.info('Getting contextual suggestions', { 
            userId: req.user.userId, 
            context,
            limit 
        });

        const suggestions = await vectorSearchService.getContextualSuggestions(
            req.user.userId, 
            context, 
            limit
        );

        logger.success('Contextual suggestions generated', { 
            userId: req.user.userId,
            suggestionCount: suggestions.length 
        });

        res.json({
            success: true,
            data: {
                context,
                suggestions,
                totalSuggestions: suggestions.length
            },
            message: 'Contextual suggestions generated successfully'
        });

    } catch (error) {
        logger.error('Failed to get contextual suggestions', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to get contextual suggestions', 
            details: error.message 
        });
    }
});

// ==================== UTILITY ENDPOINTS ====================

// Generate embedding for text
app.post('/api/vector/embedding/generate', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        logger.info('Generating embedding', { 
            userId: req.user.userId, 
            textLength: text.length 
        });

        const embedding = await embeddingService.generateEmbedding(text);

        logger.success('Embedding generated successfully', { 
            userId: req.user.userId,
            embeddingLength: embedding.length 
        });

        res.json({
            success: true,
            data: {
                text,
                embedding,
                dimension: embedding.length,
                model: 'text-embedding-004'
            },
            message: 'Embedding generated successfully'
        });

    } catch (error) {
        logger.error('Failed to generate embedding', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to generate embedding', 
            details: error.message 
        });
    }
});

// Delete todo embedding
app.delete('/api/vector/todos/:todoId', authenticateToken, async (req, res) => {
    try {
        const { todoId } = req.params;

        logger.info('Deleting todo embedding', { 
            userId: req.user.userId, 
            todoId 
        });

        const deleted = await vectorSearchService.deleteTodoEmbedding(todoId);

        if (deleted) {
            logger.success('Todo embedding deleted successfully', { 
                userId: req.user.userId,
                todoId 
            });
            res.json({
                success: true,
                message: 'Todo embedding deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Todo embedding not found'
            });
        }

    } catch (error) {
        logger.error('Failed to delete todo embedding', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Failed to delete todo embedding', 
            details: error.message 
        });
    }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
    logger.info('Health check requested');
    
    const healthStatus = {
        status: 'OK',
        service: 'Vector Service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        features: [
            'semantic-search',
            'embedding-generation',
            'vector-storage',
            'contextual-suggestions',
            'pgvector-integration'
        ],
        checks: {}
    };

    try {
        // Database connectivity check using new health check function
        const dbHealth = await healthCheck();
        
        if (dbHealth.connected) {
            healthStatus.checks.database = {
                status: 'OK',
                type: 'PostgreSQL with pgvector',
                connectionPool: dbHealth.poolStats
            };
            
            healthStatus.checks.pgvector = {
                status: dbHealth.hasVectorExtension ? 'OK' : 'WARNING',
                installed: dbHealth.hasVectorExtension,
                message: dbHealth.hasVectorExtension ? 'pgvector extension is installed' : 'pgvector extension not found'
            };
            
            healthStatus.checks.tables = {
                status: dbHealth.tablesExist ? 'OK' : 'WARNING',
                exists: dbHealth.tablesExist,
                message: dbHealth.tablesExist ? 'All required tables exist' : 'Some tables are missing'
            };
            
            healthStatus.checks.vectorOperations = {
                status: dbHealth.vectorOpsWork ? 'OK' : 'ERROR',
                working: dbHealth.vectorOpsWork,
                message: dbHealth.vectorOpsWork ? 'Vector operations working' : 'Vector operations failed'
            };
        } else {
            healthStatus.checks.database = {
                status: 'ERROR',
                error: dbHealth.error || 'Database connection failed'
            };
            healthStatus.status = 'ERROR';
        }

        // Embedding service check
        try {
            const testEmbedding = await embeddingService.generateEmbedding('health check test');
            healthStatus.checks.embeddingService = {
                status: 'OK',
                model: 'text-embedding-004',
                dimension: testEmbedding.length,
                responseTime: 'tested'
            };
        } catch (error) {
            healthStatus.checks.embeddingService = {
                status: 'ERROR',
                error: error.message
            };
            healthStatus.status = 'ERROR';
        }

        // Vector search service check
        try {
            // Test a simple search operation
            const searchResults = await vectorSearchService.searchSimilarTodos('test', null, 1, 0.5);
            healthStatus.checks.vectorSearch = {
                status: 'OK',
                searchCapability: 'functional',
                resultCount: searchResults.length
            };
        } catch (error) {
            healthStatus.checks.vectorSearch = {
                status: 'WARNING',
                error: error.message,
                message: 'Search functionality may be limited'
            };
        }

        // Dependencies check
        const dependencies = {
            authService: AUTH_SERVICE_URL,
            userService: USER_SERVICE_URL,
            todoService: TODO_SERVICE_URL,
            aiService: AI_SERVICE_URL
        };

        healthStatus.checks.dependencies = {};
        for (const [service, url] of Object.entries(dependencies)) {
            try {
                const response = await fetch(`${url}/api/health`, { 
                    method: 'GET',
                    timeout: 5000 
                });
                healthStatus.checks.dependencies[service] = {
                    status: response.ok ? 'OK' : 'WARNING',
                    url: url,
                    responseStatus: response.status
                };
            } catch (error) {
                healthStatus.checks.dependencies[service] = {
                    status: 'ERROR',
                    url: url,
                    error: error.message
                };
            }
        }

        // System metrics
        healthStatus.metrics = {
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            cpu: {
                usage: process.cpuUsage(),
                platform: process.platform,
                arch: process.arch
            },
            node: {
                version: process.version,
                pid: process.pid
            }
        };

        // Overall status determination
        const hasErrors = Object.values(healthStatus.checks).some(check => check.status === 'ERROR');
        const hasWarnings = Object.values(healthStatus.checks).some(check => check.status === 'WARNING');
        
        if (hasErrors) {
            healthStatus.status = 'ERROR';
        } else if (hasWarnings) {
            healthStatus.status = 'WARNING';
        }

        logger.info('Health check completed', { 
            status: healthStatus.status,
            checks: Object.keys(healthStatus.checks).length 
        });

        const statusCode = healthStatus.status === 'ERROR' ? 503 : healthStatus.status === 'WARNING' ? 200 : 200;
        res.status(statusCode).json(healthStatus);

    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        
        healthStatus.status = 'ERROR';
        healthStatus.error = error.message;
        healthStatus.checks.general = {
            status: 'ERROR',
            error: error.message
        };

        res.status(503).json(healthStatus);
    }
});

// Service info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Vector Service',
        version: '1.0.0',
        description: 'Vector service for semantic search and embeddings using pgvector',
        endpoints: [
            'POST /api/vector/todos/embed - Store todo embedding',
            'POST /api/vector/ai-content/embed - Store AI content embedding',
            'POST /api/vector/user-profile/embed - Store user profile embedding',
            'POST /api/vector/todos/search - Semantic todo search',
            'POST /api/vector/ai-content/search - Search AI content',
            'POST /api/vector/suggestions/contextual - Get contextual suggestions',
            'POST /api/vector/embedding/generate - Generate embedding',
            'DELETE /api/vector/todos/:todoId - Delete todo embedding',
            'GET /api/health - Health check',
            'GET /api/info - Service info'
        ]
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down vector service...');
    await closeConnections();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down vector service...');
    await closeConnections();
    process.exit(0);
});

// Start server
const startServer = async () => {
    try {
        await startDatabase();
        
        app.listen(port, () => {
            logger.serviceStart(port, [
                'pgvector-integration',
                'semantic-search',
                'embedding-generation',
                'vector-storage',
                'contextual-suggestions',
                'jwt-authentication'
            ]);
        });
    } catch (error) {
        logger.error('Failed to start vector service', { error: error.message });
        process.exit(1);
    }
};

startServer();
