import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class NotificationPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.QUEUE_NAME = 'notification_queue';
    this.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
  }

  async connect() {
    try {
      if (this.connection && this.channel) {
        return true; // Already connected
      }

      console.log('🔗 Connecting to RabbitMQ for publishing...');
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Ensure queue exists
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true
      });
      
      console.log('✅ Publisher connected to RabbitMQ');
      return true;
    } catch (error) {
      console.error('❌ Publisher connection error:', error.message);
      return false;
    }
  }

  async publishNotification(notificationData) {
    try {
      const connected = await this.connect();
      if (!connected) {
        console.error('❌ Cannot publish: Not connected to RabbitMQ');
        return false;
      }
      
      const message = JSON.stringify(notificationData);
      const success = this.channel.sendToQueue(this.QUEUE_NAME, Buffer.from(message), {
        persistent: true
      });
      
      if (success) {
        console.log('📤 Notification published to queue:', notificationData.type);
        return true;
      } else {
        console.error('❌ Failed to publish notification to queue');
        return false;
      }
    } catch (error) {
      console.error('❌ Error publishing notification:', error);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('🔌 Publisher connection closed');
    } catch (error) {
      console.error('❌ Error closing publisher connection:', error);
    }
  }
}

// Create a singleton instance
const publisher = new NotificationPublisher();

// Graceful shutdown
process.on('SIGINT', async () => {
  await publisher.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await publisher.close();
  process.exit(0);
});

export default publisher;
