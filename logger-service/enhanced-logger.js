/**
 * Enhanced MongoDB-based Logger Service
 * Provides centralized, structured logging with MongoDB persistence
 * Eliminates redundant logs and ensures consistency across all services
 */

import chalk from 'chalk';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

class EnhancedLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
      debug: chalk.gray,
      timestamp: chalk.cyan,
      service: chalk.magenta,
      highlight: chalk.bold,
      gray: chalk.gray
    };
    
    // MongoDB connection
    this.mongoClient = null;
    this.logCollection = null;
    this.isConnected = false;
    
    // Log buffering for performance
    this.logBuffer = [];
    this.bufferSize = 10;
    this.flushInterval = 5000; // 5 seconds
    
    // Initialize MongoDB connection
    this.initializeMongoDB();
    
    // Start buffer flush interval
    this.startBufferFlush();
  }

  async initializeMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      this.mongoClient = new MongoClient(mongoUri);
      await this.mongoClient.connect();
      
      const db = this.mongoClient.db('microservices_logs');
      this.logCollection = db.collection('service_logs');
      
      // Create indexes for better performance
      await this.logCollection.createIndex({ timestamp: 1 });
      await this.logCollection.createIndex({ service: 1 });
      await this.logCollection.createIndex({ level: 1 });
      await this.logCollection.createIndex({ 'meta.userId': 1 });
      await this.logCollection.createIndex({ 'meta.requestId': 1 });
      
      this.isConnected = true;
      console.log(chalk.green(`[${this.serviceName}] MongoDB logging connected`));
    } catch (error) {
      console.error(chalk.red(`[${this.serviceName}] MongoDB connection failed:`, error.message));
      this.isConnected = false;
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatService() {
    return this.colors.service(`[${this.serviceName}]`);
  }

  formatLevel(level) {
    const levelColors = {
      info: this.colors.info('INFO'),
      success: this.colors.success('SUCCESS'),
      warn: this.colors.warn('WARN'),
      error: this.colors.error('ERROR'),
      debug: this.colors.debug('DEBUG')
    };
    return levelColors[level] || level;
  }

  // Enhanced log entry creation with consistent structure
  createLogEntry(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date(),
      service: this.serviceName,
      level: level.toUpperCase(),
      message,
      meta: this.sanitizeMetadata(meta),
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost'
    };

    // Add request context if available
    if (meta.requestId) {
      logEntry.requestId = meta.requestId;
    }
    if (meta.userId) {
      logEntry.userId = meta.userId;
    }

    return logEntry;
  }

  // Sanitize metadata to remove sensitive information
  sanitizeMetadata(meta) {
    const sanitized = { ...meta };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Buffer logs for batch insertion
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  // Flush log buffer to MongoDB
  async flushBuffer() {
    if (this.logBuffer.length === 0 || !this.isConnected) return;
    
    try {
      const logsToInsert = [...this.logBuffer];
      this.logBuffer = [];
      
      await this.logCollection.insertMany(logsToInsert);
    } catch (error) {
      console.error(chalk.red(`[${this.serviceName}] Failed to flush logs to MongoDB:`, error.message));
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  // Start periodic buffer flush
  startBufferFlush() {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  // Console output with consistent formatting
  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = this.colors.timestamp(this.formatTimestamp());
    const service = this.formatService();
    const levelFormatted = this.formatLevel(level);
    
    let logLine = `${timestamp} ${service} ${levelFormatted} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      const metaString = Object.entries(meta)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${key}=${JSON.stringify(value)}`;
          }
          return `${key}=${value}`;
        })
        .join(' ');
      logLine += ` | ${this.colors.gray(metaString)}`;
    }
    
    return logLine;
  }

  // Core logging methods with MongoDB persistence
  info(message, meta = {}) {
    const logEntry = this.createLogEntry('info', message, meta);
    console.log(this.formatConsoleMessage('info', message, meta));
    this.addToBuffer(logEntry);
  }

  success(message, meta = {}) {
    const logEntry = this.createLogEntry('success', message, meta);
    console.log(this.formatConsoleMessage('success', message, meta));
    this.addToBuffer(logEntry);
  }

  warn(message, meta = {}) {
    const logEntry = this.createLogEntry('warn', message, meta);
    console.warn(this.formatConsoleMessage('warn', message, meta));
    this.addToBuffer(logEntry);
  }

  error(message, meta = {}) {
    const logEntry = this.createLogEntry('error', message, meta);
    console.error(this.formatConsoleMessage('error', message, meta));
    this.addToBuffer(logEntry);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      const logEntry = this.createLogEntry('debug', message, meta);
      console.log(this.formatConsoleMessage('debug', message, meta));
      this.addToBuffer(logEntry);
    }
  }

  // Specialized logging methods - consolidated to reduce redundancy
  serviceStart(port, features = []) {
    this.success('Service started', {
      port,
      features: features.join(', '),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  serviceStop() {
    this.info('Service stopped gracefully');
  }

  databaseConnected(database = 'unknown') {
    this.success('Database connected', { database });
  }

  databaseError(error) {
    this.error('Database connection failed', { 
      error: error.message,
      stack: error.stack 
    });
  }

  // API request logging - consolidated format
  apiRequest(method, path, statusCode, duration, additionalMeta = {}) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'success';
    const message = `API Request ${method} ${path}`;
    
    this[level](message, {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...additionalMeta
    });
  }

  // Authentication logging - consolidated
  authEvent(event, userId, email, additionalMeta = {}) {
    const isSuccess = event === 'success';
    const message = `Authentication ${event}`;
    
    this[isSuccess ? 'success' : 'warn'](message, {
      userId,
      email,
      event,
      ...additionalMeta
    });
  }

  // Business operation logging - consolidated
  businessOperation(operation, entityType, entityId, userId, additionalMeta = {}) {
    const message = `${entityType} ${operation}`;
    const level = operation === 'deleted' ? 'warn' : 'success';
    
    this[level](message, {
      operation,
      entityType,
      entityId,
      userId,
      ...additionalMeta
    });
  }

  // Queue operations - consolidated
  queueEvent(event, queueName, additionalMeta = {}) {
    const message = `Queue ${event}`;
    const level = event.includes('error') || event.includes('failed') ? 'error' : 'info';
    
    this[level](message, {
      queue: queueName,
      event,
      ...additionalMeta
    });
  }

  // Error logging with context
  logError(error, context = {}) {
    this.error('Application error', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  // Performance logging
  logPerformance(operation, duration, additionalMeta = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...additionalMeta
    });
  }

  // Health check logging
  healthCheck(status, details = {}) {
    const level = status === 'healthy' ? 'success' : 'error';
    this[level](`Health check: ${status}`, details);
  }

  // Cleanup method
  async close() {
    await this.flushBuffer();
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}

// Create logger instances for each service
export const createLogger = (serviceName) => new EnhancedLogger(serviceName);

// Export default logger
export default EnhancedLogger;
