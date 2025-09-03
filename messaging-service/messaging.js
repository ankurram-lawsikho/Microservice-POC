import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.MESSAGING_SERVICE_PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ configuration
let connection, channel;
const QUEUE_NAME = 'notification_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Initialize RabbitMQ connection
const initializeRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Ensure queue exists
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    
    console.log('✅ [RABBITMQ] Connected successfully');
    console.log('📨 [QUEUE] Queue ready:', QUEUE_NAME);
  } catch (error) {
    console.error('❌ [RABBITMQ] Connection error:', error.message);
    console.log('🔄 [RABBITMQ] Retrying connection in 5 seconds...');
    setTimeout(initializeRabbitMQ, 5000); // Retry after 5 seconds
  }
};

// Publish message to queue
const publishMessage = async (queueName, messageData) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    const message = JSON.stringify(messageData);
    const success = channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true
    });
    
    if (success) {
      console.log('📤 [MESSAGE] Published to queue:', queueName);
      return true;
    } else {
      throw new Error('Failed to publish message to queue');
    }
  } catch (error) {
    console.error('❌ [MESSAGE] Publishing error:', error.message);
    throw error;
  }
};

// API endpoint to publish messages
app.post('/api/messages/publish', async (req, res) => {
  try {
    const { queue, data } = req.body;
    
    if (!queue || !data) {
      console.log('⚠️  [API] Missing required fields - queue or data');
      return res.status(400).json({ error: 'Queue name and data are required' });
    }
    
    console.log('📡 [API] Publishing message to queue:', queue);
    await publishMessage(queue, data);
    
    console.log('✅ [API] Message published successfully');
    res.json({ 
      message: 'Message published successfully',
      queue: queue,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] Message publishing error:', error.message);
    res.status(500).json({ error: 'Failed to publish message' });
  }
});

// API endpoint to publish notifications (convenience method)
app.post('/api/notifications/publish', async (req, res) => {
  try {
    const notificationData = req.body;
    
    if (!notificationData.type || !notificationData.recipient) {
      console.log('⚠️  [API] Missing required notification fields');
      return res.status(400).json({ error: 'Type and recipient are required for notifications' });
    }
    
    console.log('📧 [API] Publishing notification:', notificationData.type);
    await publishMessage(QUEUE_NAME, notificationData);
    
    console.log('✅ [API] Notification published successfully');
    res.json({ 
      message: 'Notification published successfully',
      type: notificationData.type,
      recipient: notificationData.recipient,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] Notification publishing error:', error.message);
    res.status(500).json({ error: 'Failed to publish notification' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 [API] Health check requested');
  res.json({ 
    status: 'healthy', 
    service: 'messaging-service',
    rabbitmq: channel ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get queue status
app.get('/api/queue/status', (req, res) => {
  console.log('📊 [API] Queue status requested');
  if (channel) {
    res.json({ 
      status: 'connected',
      queue: QUEUE_NAME,
      connection: 'active',
      url: RABBITMQ_URL
    });
  } else {
    res.status(503).json({ 
      status: 'disconnected',
      queue: QUEUE_NAME,
      connection: 'inactive',
      url: RABBITMQ_URL
    });
  }
});

// Get all available queues
app.get('/api/queues', (req, res) => {
  console.log('📋 [API] Queues list requested');
  res.json({
    queues: [
      {
        name: QUEUE_NAME,
        description: 'Notification queue for email and other notifications',
        durable: true
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 [SHUTDOWN] Received SIGINT, shutting down gracefully...');
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('✅ [SHUTDOWN] Messaging service stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('✅ [SHUTDOWN] Messaging service stopped');
  process.exit(0);
});

// Start the service
app.listen(PORT, () => {
  console.log('🚀 [SERVICE] Messaging service started');
  console.log('📍 [SERVICE] Running on port:', PORT);
  console.log('🐰 [SERVICE] RabbitMQ messaging enabled');
  console.log('📨 [SERVICE] Connecting to RabbitMQ...');
  
  // Connect to RabbitMQ
  initializeRabbitMQ();
});
