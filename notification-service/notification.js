import express from 'express';
import nodemailer from 'nodemailer';
import amqp from 'amqplib';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// RabbitMQ connection for consuming messages only
let connection, channel;
const QUEUE_NAME = 'notification_queue';
const DLQ_NAME = 'notification_dlq';

// Structured logging utility
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      message,
      ...meta
    }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      message,
      ...meta
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      message,
      ...meta
    }));
  },
  debug: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'debug',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      message,
      ...meta
    }));
  }
};

// Idempotency tracking (in production, use Redis or database)
const processedMessages = new Set();

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Ensure queues exist (as consumer)
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });
    
    logger.info('RabbitMQ connected as consumer', {
      mainQueue: QUEUE_NAME,
      dlq: DLQ_NAME
    });
    
    // Start consuming messages
    consumeMessages();
  } catch (error) {
    logger.error('RabbitMQ connection failed', {
      error: error.message,
      retryIn: '5 seconds'
    });
    setTimeout(connectRabbitMQ, 5000);
  }
};

// Calculate exponential backoff delay
const calculateBackoffDelay = (retryCount) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Consume messages from RabbitMQ
const consumeMessages = async () => {
  try {
    logger.info('Starting message consumption', { queue: QUEUE_NAME });
    
    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg) {
        const messageId = msg.properties.messageId || 'unknown';
        const retryCount = msg.properties.headers?.retryCount || 0;
        const maxRetries = 3;
        
        try {
          const notificationData = JSON.parse(msg.content.toString());
          
          // Check idempotency
          if (processedMessages.has(messageId)) {
            logger.warn('Duplicate message detected, skipping', {
              messageId,
              type: notificationData.type,
              recipient: notificationData.recipient
            });
            channel.ack(msg);
            return;
          }
          
          logger.info('Processing notification', {
            messageId,
            type: notificationData.type,
            recipient: notificationData.recipient,
            subject: notificationData.subject || 'N/A',
            retryCount
          });
          
          // Send notification based on type
          await sendNotification(notificationData);
          
          // Mark as processed for idempotency
          processedMessages.add(messageId);
          
          // Acknowledge message
          channel.ack(msg);
          logger.info('Notification sent successfully', {
            messageId,
            recipient: notificationData.recipient
          });
        } catch (error) {
          logger.error('Notification processing failed', {
            messageId,
            error: error.message,
            retryCount
          });
          
          // Check if it's a malformed message (e.g., wrong recipient format)
          try {
            const notificationData = JSON.parse(msg.content.toString());
            if (error.message.includes('No recipients defined') || 
                (notificationData.recipient && typeof notificationData.recipient === 'object')) {
              logger.warn('Discarding malformed message', {
                messageId,
                reason: 'wrong recipient format'
              });
              channel.ack(msg);
            } else if (retryCount >= maxRetries) {
              logger.error('Max retries reached, sending to DLQ', {
                messageId,
                retryCount,
                maxRetries
              });
              
              // Send to Dead Letter Queue
              const dlqHeaders = {
                ...msg.properties.headers,
                originalQueue: QUEUE_NAME,
                failedAt: new Date().toISOString(),
                failureReason: error.message
              };
              
              const dlqSuccess = channel.sendToQueue(DLQ_NAME, msg.content, {
                persistent: true,
                headers: dlqHeaders
              });
              
              if (dlqSuccess) {
                logger.info('Message sent to DLQ', {
                  messageId,
                  dlq: DLQ_NAME
                });
                channel.ack(msg);
              } else {
                logger.error('Failed to send message to DLQ, discarding', {
                  messageId
                });
                channel.ack(msg);
              }
            } else {
              const backoffDelay = calculateBackoffDelay(retryCount);
              logger.warn('Retrying message with exponential backoff', {
                messageId,
                retryCount: retryCount + 1,
                maxRetries,
                backoffDelay: `${Math.round(backoffDelay)}ms`
              });
              
              try {
                // Republish message with updated retry count and delay
                const updatedHeaders = {
                  ...msg.properties.headers,
                  retryCount: retryCount + 1,
                  nextRetryAt: new Date(Date.now() + backoffDelay).toISOString()
                };
                
                const success = channel.sendToQueue(QUEUE_NAME, msg.content, {
                  persistent: true,
                  headers: updatedHeaders
                });
                
                if (success) {
                  channel.ack(msg);
                  logger.info('Message requeued for retry', {
                    messageId,
                    retryCount: retryCount + 1
                  });
                } else {
                  logger.error('Failed to requeue message, discarding', {
                    messageId
                  });
                  channel.ack(msg);
                }
              } catch (requeueError) {
                logger.error('Error requeuing message', {
                  messageId,
                  error: requeueError.message
                });
                channel.ack(msg);
              }
            }
          } catch (parseError) {
            logger.error('Discarding unparseable message', {
              messageId,
              parseError: parseError.message
            });
            channel.ack(msg);
          }
        }
      }
    });
  } catch (error) {
    logger.error('Message consumption error', {
      error: error.message
    });
  }
};

// Send notification based on type
const sendNotification = async (data) => {
  const { type, recipient, subject, content, template } = data;
  
  switch (type) {
    case 'email':
      await sendEmail(recipient, subject, content, template);
      break;
    case 'welcome':
      await sendEmail(recipient, 'Welcome to Our Platform!', content, 'welcome');
      break;
    case 'password_reset':
      await sendEmail(recipient, 'Password Reset Request', content, 'password_reset');
      break;
    case 'todo_reminder':
      await sendEmail(recipient, 'Todo Reminder', content, 'todo_reminder');
      break;
    default:
      await sendEmail(recipient, subject, content, template);
  }
};

// Send email function
const sendEmail = async (recipient, subject, content, template = 'default') => {
  try {
    console.log('📤 [EMAIL] Sending email to:', recipient);
    console.log('📋 [EMAIL] Template:', template);
    
    const transporter = createTransporter();
    
    let htmlContent = content;
    
    // Apply template if specified
    if (template === 'welcome') {
      htmlContent = generateWelcomeTemplate(content);
    } else if (template === 'password_reset') {
      htmlContent = generatePasswordResetTemplate(content);
    } else if (template === 'todo_reminder') {
      htmlContent = generateTodoReminderTemplate(content);
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Sent successfully to:', recipient);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL] Sending error:', error.message);
    throw error;
  }
};

// Template functions
const generateWelcomeTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Service!</h1>
        </div>
        <div class="content">
          <p>Hello ${content.name || 'there'}!</p>
          <p>${content.message || 'Welcome to our platform. We\'re excited to have you on board!'}</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordResetTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${content.name || 'there'}!</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${content.resetLink}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This link will expire in 1 hour.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateTodoReminderTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .todo-item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Todo Reminder</h1>
        </div>
        <div class="content">
          <p>Hello ${content.name || 'there'}!</p>
          <p>You have the following todo items due soon:</p>
          ${content.todos ? content.todos.map(todo => `
            <div class="todo-item">
              <h3>${todo.title}</h3>
              <p>${todo.description || 'No description'}</p>
              <p><strong>Due:</strong> ${todo.dueDate}</p>
            </div>
          `).join('') : '<p>No specific todos to display.</p>'}
        </div>
        <div class="footer">
          <p>Don't forget to check your todo list!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// API endpoints for direct notification sending (for testing)
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { type, recipient, subject, content, template } = req.body;
    
    if (!recipient || !type) {
      console.log('⚠️  [API] Invalid request - missing recipient or type');
      return res.status(400).json({ error: 'Recipient and type are required' });
    }
    
    console.log('📡 [API] Direct notification request:', { type, recipient, template });
    await sendNotification({ type, recipient, subject, content, template });
    
    console.log('✅ [API] Direct notification sent successfully');
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('❌ [API] Direct notification error:', error.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 [API] Health check requested');
  res.json({ 
    status: 'healthy', 
    service: 'notification-service',
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
      role: 'consumer'
    });
  } else {
    res.status(503).json({ 
      status: 'disconnected',
      queue: QUEUE_NAME,
      connection: 'inactive',
      role: 'consumer'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 [SHUTDOWN] Received SIGINT, shutting down gracefully...');
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('✅ [SHUTDOWN] Notification service stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log('✅ [SHUTDOWN] Notification service stopped');
  process.exit(0);
});

// Start the service
app.listen(PORT, () => {
  console.log('🚀 [SERVICE] Notification service started');
  console.log('📍 [SERVICE] Running on port:', PORT);
  console.log('📧 [SERVICE] Email notifications enabled');
  console.log('📨 [SERVICE] RabbitMQ consumer mode');
  console.log('🐰 [SERVICE] Connecting to RabbitMQ as consumer...');
  
  // Connect to RabbitMQ as consumer
  connectRabbitMQ();
});