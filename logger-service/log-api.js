/**
 * Logger API Service
 * Provides REST API endpoints for log visualization and analysis
 */

import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { createLogger } from './logger.js';

dotenv.config();

const app = express();
const PORT = process.env.LOGGER_API_PORT || 3011;

// Enhanced structured logger
const logger = createLogger('logger-api');

// MongoDB connection
let mongoClient = null;
let logCollection = null;

// Initialize MongoDB connection
const initializeMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    console.log('MongoDB URI:', mongoUri);
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    
    const db = mongoClient.db('microservices_logs');
    logCollection = db.collection('service_logs');
    
    logger.success('Logger API MongoDB connected');
  } catch (error) {
    logger.error('Logger API MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.healthCheck('healthy', { service: 'logger-api' });
  res.json({ 
    status: 'healthy', 
    service: 'logger-api',
    mongodb: mongoClient ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get logs with filtering and pagination
app.post('/api/logger/logs', async (req, res) => {
  try {
    const { filters = {}, limit = 100, skip = 0, sort = { timestamp: -1 } } = req.body;
    
    // Build MongoDB query
    const query = {};
    
    // Service filter
    if (filters.service) {
      query.service = filters.service;
    }
    
    // Level filter
    if (filters.level) {
      query.level = filters.level;
    }
    
    // Search filter
    if (filters.search) {
      query.message = { $regex: filters.search, $options: 'i' };
    }
    
    // Time range filter
    if (filters.timeRange) {
      const now = new Date();
      let timeFilter = {};
      
      switch (filters.timeRange) {
        case '15m':
          timeFilter = { $gte: new Date(now.getTime() - 15 * 60 * 1000) };
          break;
        case '1h':
          timeFilter = { $gte: new Date(now.getTime() - 60 * 60 * 1000) };
          break;
        case '6h':
          timeFilter = { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) };
          break;
        case '24h':
          timeFilter = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
          break;
        case '7d':
          timeFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
      }
      
      if (Object.keys(timeFilter).length > 0) {
        query.timestamp = timeFilter;
      }
    }
    
    // Execute query
    const logs = await logCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get statistics
    const stats = await getLogStats(query);
    
    // API request logging removed to reduce noise
    
    res.json({
      success: true,
      logs,
      stats,
      total: logs.length,
      filters
    });
    
  } catch (error) {
    logger.logError(error, { context: 'get_logs', filters: req.body.filters });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
});

// Get log statistics
const getLogStats = async (query = {}) => {
  try {
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$level', 'WARN'] }, 1, 0] }
          },
          infoCount: {
            $sum: { $cond: [{ $eq: ['$level', 'INFO'] }, 1, 0] }
          },
          successCount: {
            $sum: { $cond: [{ $eq: ['$level', 'SUCCESS'] }, 1, 0] }
          },
          debugCount: {
            $sum: { $cond: [{ $eq: ['$level', 'DEBUG'] }, 1, 0] }
          }
        }
      }
    ];
    
    const result = await logCollection.aggregate(pipeline).toArray();
    return result[0] || {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      successCount: 0,
      debugCount: 0
    };
  } catch (error) {
    logger.error('Failed to get log stats', { error: error.message });
    return {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      successCount: 0,
      debugCount: 0
    };
  }
};

// Get services list
app.get('/api/logger/services', async (req, res) => {
  try {
    const services = await logCollection.distinct('service');
    
    // API request logging removed to reduce noise
    
    res.json({
      success: true,
      services: services.sort()
    });
  } catch (error) {
    logger.logError(error, { context: 'get_services' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services',
      message: error.message
    });
  }
});

// Get log levels
app.get('/api/logger/levels', async (req, res) => {
  try {
    const levels = await logCollection.distinct('level');
    
    // API request logging removed to reduce noise
    
    res.json({
      success: true,
      levels: levels.sort()
    });
  } catch (error) {
    logger.logError(error, { context: 'get_levels' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch levels',
      message: error.message
    });
  }
});

// Get performance metrics
app.get('/api/logger/metrics', async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    
    // Calculate time filter
    const now = new Date();
    let timeFilter = {};
    
    switch (timeRange) {
      case '15m':
        timeFilter = { $gte: new Date(now.getTime() - 15 * 60 * 1000) };
        break;
      case '1h':
        timeFilter = { $gte: new Date(now.getTime() - 60 * 60 * 1000) };
        break;
      case '6h':
        timeFilter = { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) };
        break;
      case '24h':
        timeFilter = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        timeFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
    }
    
    const query = Object.keys(timeFilter).length > 0 ? { timestamp: timeFilter } : {};
    
    // Get metrics
    const metrics = await logCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            service: '$service',
            level: '$level'
          },
          count: { $sum: 1 },
          avgDuration: {
            $avg: {
              $toDouble: {
                $substr: [
                  { $ifNull: ['$meta.duration', '0ms'] },
                  0,
                  { $subtract: [{ $strLenCP: { $ifNull: ['$meta.duration', '0ms'] } }, 2] }
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          totalLogs: { $sum: '$count' },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$_id.level', 'ERROR'] }, '$count', 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$_id.level', 'WARN'] }, '$count', 0] }
          },
          infoCount: {
            $sum: { $cond: [{ $eq: ['$_id.level', 'INFO'] }, '$count', 0] }
          },
          successCount: {
            $sum: { $cond: [{ $eq: ['$_id.level', 'SUCCESS'] }, '$count', 0] }
          },
          avgDuration: { $avg: '$avgDuration' }
        }
      },
      { $sort: { totalLogs: -1 } }
    ]).toArray();
    
    // API request logging removed to reduce noise
    
    res.json({
      success: true,
      metrics,
      timeRange
    });
  } catch (error) {
    logger.logError(error, { context: 'get_metrics', timeRange: req.query.timeRange });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, { 
    context: 'api_error',
    path: req.path,
    method: req.method 
  });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  // Route not found logging removed to reduce noise
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  if (mongoClient) await mongoClient.close();
  logger.serviceStop();
  await logger.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  if (mongoClient) await mongoClient.close();
  logger.serviceStop();
  await logger.close();
  process.exit(0);
});

// Start the service
app.listen(PORT, async () => {
  await initializeMongoDB();
  logger.serviceStart(PORT, [
    'log-visualization',
    'mongodb-integration',
    'real-time-filtering',
    'performance-metrics'
  ]);
});
