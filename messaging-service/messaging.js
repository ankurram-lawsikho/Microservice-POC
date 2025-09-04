import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

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

// Structured logging utility
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      service: 'messaging-service',
      message,
      ...meta
    }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: 'messaging-service',
      message,
      ...meta
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      service: 'messaging-service',
      message,
      ...meta
    }));
  },
  debug: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'debug',
      timestamp: new Date().toISOString(),
      service: 'messaging-service',
      message,
      ...meta
    }));
  }
};

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
    
    logger.info('RabbitMQ connected successfully', {
      queue: QUEUE_NAME,
      dlq: DLQ_NAME
    });
  } catch (error) {
    logger.error('RabbitMQ connection failed', {
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
      logger.info('Message published successfully', {
        queue: queueName,
        messageId: messageId,
        type: messageData.type,
        recipient: messageData.recipient
      });
      return { success: true, messageId };
    } else {
      throw new Error('Failed to publish message to queue');
    }
  } catch (error) {
    logger.error('Message publishing failed', {
      queue: queueName,
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
    
    logger.info('Publishing message via API', {
      queue: queue,
      type: data?.type
    });
    
    const result = await publishMessage(queue, data);
    
    logger.info('Message published via API successfully', {
      queue: queue,
      messageId: result.messageId
    });
    
    res.json({ 
      message: 'Message published successfully',
      queue: queue,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Message publishing via API failed', {
      queue: req.body?.queue,
      error: error.message
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
    
    logger.info('Publishing notification via API', {
      type: notificationData.type,
      recipient: notificationData.recipient
    });
    
    const result = await publishMessage(QUEUE_NAME, notificationData);
    
    logger.info('Notification published via API successfully', {
      type: notificationData.type,
      recipient: notificationData.recipient,
      messageId: result.messageId
    });
    
    res.json({ 
      message: 'Notification published successfully',
      type: notificationData.type,
      recipient: notificationData.recipient,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Notification publishing via API failed', {
      type: req.body?.type,
      recipient: req.body?.recipient,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to publish notification' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  logger.info('Health check requested');
  
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
    
    res.json({ 
      status: 'healthy', 
      service: 'messaging-service',
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
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get queue status
app.get('/api/queue/status', async (req, res) => {
  logger.info('Queue status requested');
  
  if (!channel) {
    return res.status(503).json({ 
      status: 'disconnected',
      error: 'RabbitMQ channel not available'
    });
  }
  
  try {
    const queueInfo = await channel.checkQueue(QUEUE_NAME);
    const dlqInfo = await channel.checkQueue(DLQ_NAME);
    
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
    logger.error('Failed to get queue status', { error: error.message });
    res.status(500).json({ 
      status: 'error',
      error: error.message
    });
  }
});

// DLQ monitoring endpoint
app.get('/api/dlq/messages', async (req, res) => {
  logger.info('DLQ messages requested');
  
  if (!channel) {
    return res.status(503).json({ 
      error: 'RabbitMQ channel not available'
    });
  }
  
  try {
    const dlqInfo = await channel.checkQueue(DLQ_NAME);
    
    res.json({
      queue: DLQ_NAME,
      messageCount: dlqInfo.messageCount,
      consumerCount: dlqInfo.consumerCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get DLQ info', { error: error.message });
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Get all available queues
app.get('/api/queues', (req, res) => {
  logger.info('Queues list requested');
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
  logger.info('Messaging service stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.info('Messaging service stopped');
  process.exit(0);
});

// Start the service
app.listen(PORT, () => {
  logger.info('Messaging service started', {
    port: PORT,
    features: [
      'idempotency',
      'dead-letter-queue',
      'structured-logging',
      'retry-mechanism'
    ],
    queues: [QUEUE_NAME, DLQ_NAME]
  });
  
  // Connect to RabbitMQ
  initializeRabbitMQ();
});
