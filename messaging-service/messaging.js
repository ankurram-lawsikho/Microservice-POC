import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.MESSAGING_SERVICE_PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ configuration
let connection, channel;
const QUEUE_NAME = 'notification_queue';
const DLQ_NAME = 'notification_dlq';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Enhanced structured logger
const logger = createLogger('messaging-service');

// Initialize RabbitMQ connection
const initializeRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Create Dead Letter Queue first
    await channel.assertQueue(DLQ_NAME, {
      durable: true
    });
    
    // Create main queue (without DLQ args to avoid conflicts with existing queue)
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    
    logger.queueEvent('connected', `${QUEUE_NAME}, ${DLQ_NAME}`);
  } catch (error) {
    logger.queueEvent('connection_failed', `${QUEUE_NAME}, ${DLQ_NAME}`, { 
      error: error.message,
      retryIn: '5 seconds'
    });
    setTimeout(initializeRabbitMQ, 5000);
  }
};

// Generate unique message ID for idempotency
const generateMessageId = (messageData) => {
  const content = JSON.stringify(messageData);
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Publish message to queue with idempotency
const publishMessage = async (queueName, messageData) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    // Generate unique message ID for idempotency
    const messageId = generateMessageId(messageData);
    const message = JSON.stringify(messageData);
    
    const success = channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
      messageId: messageId,
      headers: {
        retryCount: 0,
        originalTimestamp: new Date().toISOString(),
        messageId: messageId
      }
    });
    
    if (success) {
      logger.queueEvent('message_published', queueName, {
        messageId,
        type: messageData.type,
        recipient: messageData.recipient
      });
      return { success: true, messageId };
    } else {
      throw new Error('Failed to publish message to queue');
    }
  } catch (error) {
    logger.queueEvent('publish_failed', queueName, {
      error: error.message,
      type: messageData?.type
    });
    throw error;
  }
};

// API endpoint to publish messages
app.post('/api/messages/publish', async (req, res) => {
  try {
    const { queue, data } = req.body;
    
    if (!queue || !data) {
      logger.warn('Message publish request missing required fields', {
        hasQueue: !!queue,
        hasData: !!data
      });
      return res.status(400).json({ error: 'Queue name and data are required' });
    }
    
    const startTime = Date.now();
    const result = await publishMessage(queue, data);
    const duration = Date.now() - startTime;
    
    logger.apiRequest('POST', '/api/messages/publish', 200, duration, { queue });
    
    res.json({ 
      message: 'Message published successfully',
      queue: queue,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, {
      context: 'api_publish',
      queue: req.body?.queue
    });
    res.status(500).json({ error: 'Failed to publish message' });
  }
});

// API endpoint to publish notifications (convenience method)
app.post('/api/notifications/publish', async (req, res) => {
  try {
    const notificationData = req.body;
    
    if (!notificationData.type || !notificationData.recipient) {
      logger.warn('Notification publish request missing required fields', {
        hasType: !!notificationData.type,
        hasRecipient: !!notificationData.recipient
      });
      return res.status(400).json({ error: 'Type and recipient are required for notifications' });
    }
    
    const startTime = Date.now();
    const result = await publishMessage(QUEUE_NAME, notificationData);
    const duration = Date.now() - startTime;
    
    logger.apiRequest('POST', '/api/notifications/publish', 200, duration, { 
      type: notificationData.type 
    });
    
    res.json({ 
      message: 'Notification published successfully',
      type: notificationData.type,
      recipient: notificationData.recipient,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, {
      context: 'notification_publish',
      type: req.body?.type,
      recipient: req.body?.recipient
    });
    res.status(500).json({ error: 'Failed to publish notification' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    let queueInfo = null;
    let dlqInfo = null;
    
    if (channel) {
      try {
        queueInfo = await channel.checkQueue(QUEUE_NAME);
        dlqInfo = await channel.checkQueue(DLQ_NAME);
      } catch (error) {
        logger.warn('Failed to get queue info', { error: error.message });
      }
    }
    
    const healthStatus = channel ? 'healthy' : 'degraded';
    const healthDetails = {
      rabbitmq: channel ? 'connected' : 'disconnected',
      queues: {
        main: {
          name: QUEUE_NAME,
          messageCount: queueInfo?.messageCount || 0,
          consumerCount: queueInfo?.consumerCount || 0
        },
        dlq: {
          name: DLQ_NAME,
          messageCount: dlqInfo?.messageCount || 0,
          consumerCount: dlqInfo?.consumerCount || 0
        }
      }
    };
    
    logger.healthCheck(healthStatus, healthDetails);
    
    res.json({ 
      status: healthStatus, 
      service: 'messaging-service',
      ...healthDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.healthCheck('unhealthy', { error: error.message });
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get queue status
app.get('/api/queue/status', async (req, res) => {
  if (!channel) {
    logger.queueEvent('status_check_failed', 'all', { reason: 'channel_unavailable' });
    return res.status(503).json({ 
      status: 'disconnected',
      error: 'RabbitMQ channel not available'
    });
  }
  
  try {
    const queueInfo = await channel.checkQueue(QUEUE_NAME);
    const dlqInfo = await channel.checkQueue(DLQ_NAME);
    
    logger.queueEvent('status_checked', 'all', {
      mainQueueMessages: queueInfo.messageCount,
      dlqMessages: dlqInfo.messageCount
    });
    
    res.json({ 
      status: 'connected',
      queues: {
        main: {
          name: QUEUE_NAME,
          messageCount: queueInfo.messageCount,
          consumerCount: queueInfo.consumerCount
        },
        dlq: {
          name: DLQ_NAME,
          messageCount: dlqInfo.messageCount,
          consumerCount: dlqInfo.consumerCount
        }
      },
      connection: 'active',
      url: RABBITMQ_URL
    });
  } catch (error) {
    logger.logError(error, { context: 'queue_status_check' });
    res.status(500).json({ 
      status: 'error',
      error: error.message
    });
  }
});

// DLQ monitoring endpoint
app.get('/api/dlq/messages', async (req, res) => {
  if (!channel) {
    logger.queueEvent('dlq_check_failed', DLQ_NAME, { reason: 'channel_unavailable' });
    return res.status(503).json({ 
      error: 'RabbitMQ channel not available'
    });
  }
  
  try {
    const dlqInfo = await channel.checkQueue(DLQ_NAME);
    
    logger.queueEvent('dlq_checked', DLQ_NAME, {
      messageCount: dlqInfo.messageCount,
      consumerCount: dlqInfo.consumerCount
    });
    
    res.json({
      queue: DLQ_NAME,
      messageCount: dlqInfo.messageCount,
      consumerCount: dlqInfo.consumerCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, { context: 'dlq_check' });
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Get all available queues
app.get('/api/queues', (req, res) => {
  logger.queueEvent('queues_listed', 'all', { queueCount: 2 });
  res.json({
    queues: [
      {
        name: QUEUE_NAME,
        description: 'Notification queue for email and other notifications',
        durable: true,
        hasDLQ: true
      },
      {
        name: DLQ_NAME,
        description: 'Dead Letter Queue for failed notifications',
        durable: true,
        ttl: '7 days'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.serviceStop();
  await logger.close(); // Close MongoDB connection
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.serviceStop();
  await logger.close(); // Close MongoDB connection
  process.exit(0);
});

// Start the service
app.listen(PORT, () => {
  logger.serviceStart(PORT, [
    'idempotency',
    'dead-letter-queue',
    'enhanced-logging',
    'retry-mechanism'
  ]);
  
  // Connect to RabbitMQ
  initializeRabbitMQ();
});
