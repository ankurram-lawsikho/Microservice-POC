/**
 * Enhanced Structured Logger Service
 * Provides beautiful, readable logging with colors and formatting for all microservices
 */

import chalk from 'chalk';

class Logger {
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
      gray: chalk.gray  // Alias for compatibility
    };
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

  formatMessage(level, message, meta = {}) {
    const timestamp = this.colors.timestamp(this.formatTimestamp());
    const service = this.formatService();
    const levelFormatted = this.formatLevel(level);
    
    // Main log line
    let logLine = `${timestamp} ${service} ${levelFormatted} ${message}`;
    
    // Add metadata if present
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

  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta));
  }

  success(message, meta = {}) {
    console.log(this.formatMessage('success', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message, meta = {}) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  // Specialized logging methods
  serviceStart(port, features = []) {
    this.success('Service started', {
      port,
      features: features.join(', '),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  serviceStop() {
    this.info('Service stopped gracefully');
  }

  databaseConnected(database = 'unknown') {
    this.success('Database connected', { database });
  }

  databaseError(error) {
    this.error('Database connection failed', { error: error.message });
  }

  queueConnected(queueName) {
    this.success('Queue connected', { queue: queueName });
  }

  queueError(error, queueName = 'unknown') {
    this.error('Queue connection failed', { 
      queue: queueName, 
      error: error.message 
    });
  }

  messagePublished(messageId, queue, type, recipient) {
    this.info('Message published', {
      messageId: this.colors.highlight(messageId),
      queue,
      type,
      recipient
    });
  }

  messageReceived(messageId, type, recipient, retryCount = 0) {
    this.info('Message received', {
      messageId: this.colors.highlight(messageId),
      type,
      recipient,
      retryCount: retryCount > 0 ? this.colors.warn(retryCount) : '0'
    });
  }

  messageProcessed(messageId, recipient) {
    this.success('Message processed successfully', {
      messageId: this.colors.highlight(messageId),
      recipient
    });
  }

  messageRetry(messageId, retryCount, maxRetries, backoffDelay) {
    this.warn('Message retry', {
      messageId: this.colors.highlight(messageId),
      attempt: `${retryCount}/${maxRetries}`,
      backoffDelay: `${backoffDelay}ms`
    });
  }

  messageDLQ(messageId, reason) {
    this.error('Message sent to DLQ', {
      messageId: this.colors.highlight(messageId),
      reason
    });
  }

  duplicateMessage(messageId, type, recipient) {
    this.warn('Duplicate message detected', {
      messageId: this.colors.highlight(messageId),
      type,
      recipient,
      action: 'skipped'
    });
  }

  apiRequest(method, path, statusCode, duration) {
    const statusColor = statusCode >= 400 ? this.colors.error : 
                       statusCode >= 300 ? this.colors.warn : 
                       this.colors.success;
    
    this.info('API Request', {
      method: this.colors.highlight(method),
      path,
      status: statusColor(statusCode),
      duration: `${duration}ms`
    });
  }

  authSuccess(userId, email, role) {
    this.success('Authentication successful', {
      userId,
      email,
      role
    });
  }

  authFailed(email, reason) {
    this.warn('Authentication failed', {
      email,
      reason
    });
  }

  emailSent(recipient, subject, type) {
    this.success('Email sent', {
      recipient,
      subject,
      type
    });
  }

  emailFailed(recipient, error) {
    this.error('Email failed', {
      recipient,
      error: error.message
    });
  }

  // Additional specialized methods for different services
  todoCreated(todoId, title, userId) {
    this.success('Todo created', {
      todoId: this.colors.highlight(todoId),
      title,
      userId
    });
  }

  todoUpdated(todoId, title, userId) {
    this.info('Todo updated', {
      todoId: this.colors.highlight(todoId),
      title,
      userId
    });
  }

  todoDeleted(todoId, userId) {
    this.warn('Todo deleted', {
      todoId: this.colors.highlight(todoId),
      userId
    });
  }

  userCreated(userId, email, role) {
    this.success('User created', {
      userId: this.colors.highlight(userId),
      email,
      role
    });
  }

  userUpdated(userId, email) {
    this.info('User updated', {
      userId: this.colors.highlight(userId),
      email
    });
  }

  userDeleted(userId, email) {
    this.warn('User deleted', {
      userId: this.colors.highlight(userId),
      email
    });
  }

  gatewayRequest(method, path, targetService, statusCode, duration) {
    const statusColor = statusCode >= 400 ? this.colors.error : 
                       statusCode >= 300 ? this.colors.warn : 
                       this.colors.success;
    
    this.info('Gateway Request', {
      method: this.colors.highlight(method),
      path,
      target: this.colors.highlight(targetService),
      status: statusColor(statusCode),
      duration: `${duration}ms`
    });
  }

  middlewareExecuted(middlewareName, userId, success) {
    const status = success ? this.colors.success('SUCCESS') : this.colors.error('FAILED');
    this.debug('Middleware executed', {
      middleware: this.colors.highlight(middlewareName),
      userId,
      status
    });
  }
}

// Create logger instances for each service
export const createLogger = (serviceName) => new Logger(serviceName);

// Export default logger
export default Logger;
