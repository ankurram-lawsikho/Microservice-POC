# Messaging Service Architecture

## Overview

# latest RabbitMQ 4.x
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management

This microservices architecture has been restructured to use a dedicated **Messaging Service** that handles all RabbitMQ operations. The messaging service acts as a central hub for message publishing, while other services communicate with it via HTTP APIs.

## Architecture Diagram

```
┌─────────────────┐    HTTP     ┌──────────────────┐    RabbitMQ    ┌──────────────────┐
│   User Service  │ ──────────→ │ Messaging Service│ ──────────────→ │ Notification     │
│   (Port 3001)   │             │   (Port 3006)    │                 │ Service         │
└─────────────────┘             └──────────────────┘                 │ (Port 3004)     │
                                                                      └──────────────────┘
┌─────────────────┐    HTTP     ┌──────────────────┐
│  Todo Service   │ ──────────→ │ Messaging Service│
│   (Port 3002)   │             │   (Port 3006)    │
└─────────────────┘             └──────────────────┘
```

## Service Responsibilities

### 1. Messaging Service (Port 3006)
- **Purpose**: Centralized RabbitMQ management and message publishing
- **Responsibilities**:
  - Manages RabbitMQ connections
  - Provides HTTP APIs for message publishing
  - Handles queue creation and management
  - Acts as the single point of contact for all messaging operations

### 2. Notification Service (Port 3004)
- **Purpose**: Consumes messages and sends actual notifications
- **Responsibilities**:
  - Consumes messages from RabbitMQ queues
  - Sends emails using templates
  - Handles notification processing logic
  - No direct publishing capabilities

### 3. User Service (Port 3001)
- **Purpose**: User management with notification integration
- **Responsibilities**:
  - User CRUD operations
  - Sends notifications via messaging service HTTP API
  - No direct RabbitMQ connection

### 4. Todo Service (Port 3002)
- **Purpose**: Todo management with notification integration
- **Responsibilities**:
  - Todo CRUD operations
  - Sends notifications via messaging service HTTP API
  - No direct RabbitMQ connection

### 5. API Gateway (Port 3005)
- **Purpose**: Service routing and health monitoring
- **Responsibilities**:
  - Routes requests to appropriate services
  - Monitors health of all services including messaging service
  - Provides unified API interface

## API Endpoints

### Messaging Service APIs

#### Publish Message
```http
POST /api/messages/publish
Content-Type: application/json

{
  "queue": "notification_queue",
  "data": {
    "type": "welcome",
    "recipient": "user@example.com",
    "subject": "Welcome!",
    "content": {...}
  }
}
```

#### Publish Notification (Convenience)
```http
POST /api/notifications/publish
Content-Type: application/json

{
  "type": "welcome",
  "recipient": "user@example.com",
  "subject": "Welcome!",
  "content": {...},
  "template": "welcome"
}
```

#### Health Check
```http
GET /api/health
```

#### Queue Status
```http
GET /api/queue/status
```

#### List Queues
```http
GET /api/queues
```

## Usage Examples

### Sending a Welcome Notification

```javascript
// From User Service
const notificationData = {
  type: 'welcome',
  recipient: 'user@example.com',
  subject: 'Welcome to Our Platform!',
  content: {
    name: 'John Doe',
    message: 'Thank you for joining our platform!'
  },
  template: 'welcome',
  userId: 123,
  operation: 'user_created'
};

const response = await axios.post(
  'http://localhost:3006/api/notifications/publish', 
  notificationData
);
```

### Sending a Todo Reminder

```javascript
// From Todo Service
const notificationData = {
  type: 'todo_reminder',
  recipient: 'user@example.com',
  subject: 'Todo Reminder',
  content: {
    name: 'John Doe',
    message: 'You have a todo due soon',
    todos: [{
      title: 'Complete project',
      description: 'Finish the microservices project',
      dueDate: '2024-01-15'
    }]
  },
  template: 'todo_reminder',
  todoId: 'abc123',
  userId: 123,
  operation: 'todo_created'
};

const response = await axios.post(
  'http://localhost:3006/api/notifications/publish', 
  notificationData
);
```

## Environment Variables

### Messaging Service
```bash
MESSAGING_SERVICE_PORT=3006
RABBITMQ_URL=amqp://localhost
```

### User Service
```bash
MESSAGING_SERVICE_URL=http://localhost:3006
```

### Todo Service
```bash
MESSAGING_SERVICE_URL=http://localhost:3006
```

### Notification Service
```bash
NOTIFICATION_SERVICE_PORT=3004
RABBITMQ_URL=amqp://localhost
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each service has a single, clear responsibility
2. **Centralized Messaging**: All RabbitMQ operations are managed in one place
3. **Easier Testing**: Services can be tested without RabbitMQ dependencies
4. **Better Error Handling**: Centralized error handling for messaging operations
5. **Scalability**: Easy to scale messaging operations independently
6. **Maintenance**: Single point for RabbitMQ configuration and monitoring

## Starting the Services

1. **Start RabbitMQ** (if using Docker):
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

2. **Start Messaging Service**:
   ```bash
   cd messaging-service
   npm install
   npm start
   ```

3. **Start Notification Service**:
   ```bash
   cd notification-service
   npm install
   npm start
   ```

4. **Start User Service**:
   ```bash
   cd user-service
   npm install
   npm start
   ```

5. **Start Todo Service**:
   ```bash
   cd todo-service
   npm install
   npm start
   ```

6. **Start API Gateway**:
   ```bash
   cd api-gateway
   npm install
   npm start
   ```

## Monitoring and Health Checks

All services provide health check endpoints that can be monitored:

- **API Gateway**: `/health` and `/services/health`
- **Messaging Service**: `/api/health`
- **Notification Service**: `/api/health`
- **User Service**: `/health`
- **Todo Service**: `/health`

The API Gateway's `/services/health` endpoint provides a comprehensive view of all service health statuses.

## Troubleshooting

### Common Issues

1. **Messaging Service Unavailable**:
   - Check if RabbitMQ is running
   - Verify `RABBITMQ_URL` environment variable
   - Check messaging service logs

2. **Notifications Not Sending**:
   - Verify messaging service is running
   - Check notification service logs
   - Ensure email configuration is correct

3. **Queue Connection Issues**:
   - Verify RabbitMQ connection string
   - Check if queue exists
   - Review messaging service logs

### Logs to Monitor

- **Messaging Service**: Look for RabbitMQ connection and publishing logs
- **Notification Service**: Monitor message consumption and email sending
- **User/Todo Services**: Check messaging service API call logs
- **API Gateway**: Monitor service health check logs
