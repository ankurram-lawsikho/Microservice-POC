/**
 * Test script for Enhanced Logger with MongoDB integration
 */

import { createLogger } from './enhanced-logger.js';

const logger = createLogger('test-service');

async function testEnhancedLogging() {
  console.log('🧪 Testing Enhanced Logger with MongoDB Integration...\n');

  // Test basic logging
  logger.info('Testing basic info logging', { testId: '001' });
  logger.success('Testing success logging', { testId: '002' });
  logger.warn('Testing warning logging', { testId: '003' });
  logger.error('Testing error logging', { testId: '004' });
  logger.debug('Testing debug logging', { testId: '005' });

  // Test specialized methods
  logger.serviceStart(3000, ['api', 'database', 'messaging']);
  logger.databaseConnected('MongoDB');
  logger.apiRequest('POST', '/api/test', 200, 150, { userId: 123 });
  logger.authEvent('success', 123, 'test@example.com', { role: 'user' });
  logger.businessOperation('created', 'todo', 'todo-123', 123, { title: 'Test Todo' });
  logger.queueEvent('message_published', 'test-queue', { messageId: 'msg-123', type: 'test' });
  logger.healthCheck('healthy', { service: 'test', uptime: '1h' });
  logger.logPerformance('test_operation', 250, { operation: 'test' });

  // Test error logging
  try {
    throw new Error('Test error for logging');
  } catch (error) {
    logger.logError(error, { context: 'test', operation: 'error_test' });
  }

  // Wait for buffer flush
  console.log('\n⏳ Waiting for log buffer to flush to MongoDB...');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Test MongoDB queries
  if (logger.isConnected) {
    console.log('\n📊 Testing MongoDB queries...');
    
    try {
      // Count total logs
      const totalLogs = await logger.logCollection.countDocuments();
      console.log(`Total logs in database: ${totalLogs}`);

      // Count by level
      const levelCounts = await logger.logCollection.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('Logs by level:');
      levelCounts.forEach(level => {
        console.log(`  ${level._id}: ${level.count}`);
      });

      // Count by service
      const serviceCounts = await logger.logCollection.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('Logs by service:');
      serviceCounts.forEach(service => {
        console.log(`  ${service._id}: ${service.count}`);
      });

      // Recent logs
      const recentLogs = await logger.logCollection.find({
        timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
      }).sort({ timestamp: -1 }).limit(5).toArray();
      
      console.log('\nRecent logs:');
      recentLogs.forEach(log => {
        console.log(`  [${log.timestamp.toISOString()}] ${log.service} ${log.level}: ${log.message}`);
      });

    } catch (error) {
      console.error('❌ MongoDB query failed:', error.message);
    }
  } else {
    console.log('⚠️  MongoDB not connected - logs only in console');
  }

  // Close connection
  await logger.close();
  console.log('\n✅ Enhanced Logger test completed!');
}

// Run test
testEnhancedLogging().catch(console.error);
