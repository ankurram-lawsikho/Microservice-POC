# AI Service Documentation

## Overview

The AI Service is a microservice that integrates with Google's Gemini AI to provide various AI-powered capabilities including text generation, chat completion, code generation, and text analysis. It's designed to be a centralized AI service that can be consumed by other microservices and the frontend application.

## Features

### Core AI Features
- **Text Generation**: Generate creative and informative text based on prompts
- **Chat Completion**: Interactive conversations with AI using conversation history
- **Code Generation**: Generate code in various programming languages
- **Text Analysis**: Analyze text for sentiment, summary, or keyword extraction

### User & Todo Service Integration
- **Todo Analysis**: AI-powered analysis of user's todo list with productivity insights
- **Smart Todo Suggestions**: Personalized todo recommendations based on user context
- **User Insights**: Personalized productivity insights and recommendations
- **Todo Categorization**: AI-powered categorization, priority, and metadata for todos
- **Productivity Coaching**: Personalized coaching based on user goals and current todos

### Security & Monitoring
- **JWT Authentication**: Secure endpoints requiring valid authentication tokens
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Service Integration**: Seamless integration with User and Todo services

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │   AI Service    │
│                 │────│                 │────│                 │
│ React App       │    │ Port 3000       │    │ Port 3008       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Auth Service    │    │  Gemini AI API  │
                       │ Port 3007      │    │  Google Cloud   │
                       └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Base URL
- **Direct**: `http://localhost:3008/api/ai`
- **Via Gateway**: `http://localhost:3000/api/ai`

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Core AI Endpoints

#### 1. Text Generation
**POST** `/api/ai/generate`

Generate text content using Gemini AI.

**Request Body:**
```json
{
  "prompt": "Write a short story about a robot learning to paint",
  "maxTokens": 1000,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "generatedText": "The robot's mechanical fingers trembled as it held the brush...",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "promptLength": 45,
    "responseLength": 250
  }
}
```

#### 2. Chat Completion
**POST** `/api/ai/chat`

Have a conversation with AI using conversation history.

**Request Body:**
```json
{
  "message": "What's the weather like today?",
  "history": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    },
    {
      "role": "assistant", 
      "content": "I'm doing well, thank you! How can I help you today?"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "I don't have access to real-time weather data, but I can help you find weather information...",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "messageLength": 30,
    "replyLength": 150
  }
}
```

#### 3. Code Generation
**POST** `/api/ai/code`

Generate code in specified programming language.

**Request Body:**
```json
{
  "description": "Create a function to calculate the factorial of a number",
  "language": "javascript",
  "includeComments": true
}
```

**Response:**
```json
{
  "success": true,
  "code": "// Function to calculate factorial of a number\nfunction factorial(n) {\n  if (n < 0) return null;\n  if (n === 0 || n === 1) return 1;\n  return n * factorial(n - 1);\n}",
  "language": "javascript",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "descriptionLength": 60,
    "codeLength": 200
  }
}
```

#### 4. Text Analysis
**POST** `/api/ai/analyze`

Analyze text for sentiment, summary, or keywords.

**Request Body:**
```json
{
  "text": "I absolutely love this new product! It's amazing and exceeded my expectations.",
  "analysisType": "sentiment"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "Sentiment Score: 0.9 (Very Positive)\n\nThe text expresses strong positive sentiment with words like 'absolutely love', 'amazing', and 'exceeded expectations' indicating high satisfaction and enthusiasm.",
  "analysisType": "sentiment",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "textLength": 85,
    "analysisLength": 200
  }
}
```

**Analysis Types:**
- `sentiment`: Analyze emotional tone (-1 to 1 scale)
- `summary`: Generate a concise summary
- `keywords`: Extract key terms and phrases

#### User & Todo Service Integration Endpoints

#### 5. Todo Analysis
**POST** `/api/ai/todos/analyze`

Analyze user's todo list with AI-powered insights and productivity recommendations.

**Response:**
```json
{
  "success": true,
  "analysis": "Based on your todo list, I can see you have a good mix of work and personal tasks...",
  "todoCount": 8,
  "completedCount": 3,
  "pendingCount": 5,
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 6. Smart Todo Suggestions
**POST** `/api/ai/todos/suggest`

Get personalized todo suggestions based on user context and existing todos.

**Request Body:**
```json
{
  "context": "Working on a new project deadline",
  "category": "work",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": "1. Break down the project into smaller milestones\n2. Set up daily progress check-ins\n3. Create a project timeline...",
  "context": "Working on a new project deadline",
  "category": "work",
  "priority": "high",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 7. User Insights
**POST** `/api/ai/user/insights`

Get personalized productivity insights and recommendations based on user profile and todo statistics.

**Response:**
```json
{
  "success": true,
  "insights": "Based on your profile and todo completion rate of 75%, you're doing well...",
  "userProfile": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "todoStats": {
    "total": 12,
    "completed": 9,
    "pending": 3,
    "completionRate": "75.0"
  },
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 8. Todo Categorization
**POST** `/api/ai/todos/categorize`

Get AI-powered categorization, priority, and metadata for a todo item.

**Request Body:**
```json
{
  "todoText": "Review quarterly budget report"
}
```

**Response:**
```json
{
  "success": true,
  "categorization": "{\n  \"category\": \"work\",\n  \"priority\": \"high\",\n  \"timeEstimate\": \"2hours\",\n  \"tags\": [\"finance\", \"review\", \"quarterly\"],\n  \"subtasks\": [\"Gather financial data\", \"Analyze trends\", \"Prepare summary\"]\n}",
  "originalText": "Review quarterly budget report",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 9. Productivity Coaching
**POST** `/api/ai/coaching`

Get personalized productivity coaching based on user goals and current todos.

**Request Body:**
```json
{
  "goal": "Improve focus and reduce procrastination",
  "timeframe": "month"
}
```

**Response:**
```json
{
  "success": true,
  "coaching": "Based on your goal to improve focus, here's your personalized coaching plan...",
  "goal": "Improve focus and reduce procrastination",
  "timeframe": "month",
  "metadata": {
    "userId": "123",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 10. Health Check
**GET** `/api/health`

Check service health status.

**Response:**
```json
{
  "status": "OK",
  "service": "AI Service",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "features": [
    "text-generation",
    "chat-completion", 
    "code-generation",
    "text-analysis"
  ]
}
```

## Configuration

### Environment Variables

Create a `.env` file in the `ai-service` directory:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Auth Service Configuration
AUTH_SERVICE_URL=http://localhost:3007

# Service Configuration
PORT=3008
NODE_ENV=development
```

### Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Installation & Setup

1. **Navigate to AI Service Directory:**
   ```bash
   cd ai-service
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Service:**
   ```bash
   npm start
   ```

## Usage Examples

### Frontend Integration

#### Core AI Features
```javascript
// Text Generation
const generateText = async (prompt) => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt })
  });
  return response.json();
};

// Chat with AI
const chatWithAI = async (message, history = []) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, history })
  });
  return response.json();
};

// Generate Code
const generateCode = async (description, language = 'javascript') => {
  const response = await fetch('/api/ai/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ description, language })
  });
  return response.json();
};
```

#### User & Todo Service Integration
```javascript
// Analyze user's todos
const analyzeTodos = async () => {
  const response = await fetch('/api/ai/todos/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Get smart todo suggestions
const getTodoSuggestions = async (context, category, priority = 'medium') => {
  const response = await fetch('/api/ai/todos/suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ context, category, priority })
  });
  return response.json();
};

// Get user insights
const getUserInsights = async () => {
  const response = await fetch('/api/ai/user/insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Categorize a todo
const categorizeTodo = async (todoText) => {
  const response = await fetch('/api/ai/todos/categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ todoText })
  });
  return response.json();
};

// Get productivity coaching
const getCoaching = async (goal, timeframe = 'week') => {
  const response = await fetch('/api/ai/coaching', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ goal, timeframe })
  });
  return response.json();
};
```

### cURL Examples

```bash
# Text Generation
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"prompt": "Write a haiku about programming"}'

# Chat
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Explain quantum computing in simple terms"}'

# Code Generation
curl -X POST http://localhost:3000/api/ai/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"description": "Create a REST API endpoint for user authentication", "language": "python"}'

# Text Analysis
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "This is the best day ever!", "analysisType": "sentiment"}'

# Todo Analysis
curl -X POST http://localhost:3000/api/ai/todos/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Smart Todo Suggestions
curl -X POST http://localhost:3000/api/ai/todos/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"context": "Working on a project deadline", "category": "work", "priority": "high"}'

# User Insights
curl -X POST http://localhost:3000/api/ai/user/insights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Todo Categorization
curl -X POST http://localhost:3000/api/ai/todos/categorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"todoText": "Review quarterly budget report"}'

# Productivity Coaching
curl -X POST http://localhost:3000/api/ai/coaching \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"goal": "Improve focus and reduce procrastination", "timeframe": "month"}'
```

## Error Handling

The service returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Token validation failed
- **500 Internal Server Error**: AI service or Gemini API error

**Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

## Rate Limiting & Best Practices

1. **Token Management**: Always include valid JWT tokens in requests
2. **Prompt Optimization**: Keep prompts clear and specific for better results
3. **Error Handling**: Implement proper error handling for AI service failures
4. **Caching**: Consider caching AI responses for repeated queries
5. **Monitoring**: Monitor API usage and costs through Google Cloud Console

## Security Considerations

- All endpoints require authentication via JWT tokens
- Tokens are validated through the Auth Service
- No sensitive data is stored in the AI service
- API keys are stored securely in environment variables
- Request/response logging for audit trails

## Monitoring & Logging

The service provides comprehensive logging:

- **Request Logging**: All incoming requests with user context
- **Response Logging**: API responses with metadata
- **Error Logging**: Detailed error information for debugging
- **Performance Logging**: Response times and token usage

## Integration with Other Services

The AI Service integrates with:

- **Auth Service**: Token validation and user authentication
- **API Gateway**: Request routing and load balancing
- **Logger Service**: Centralized logging and monitoring
- **Frontend**: AI-powered features and user interactions

## Future Enhancements

- **Image Generation**: Integration with Gemini's image generation capabilities
- **Voice Processing**: Speech-to-text and text-to-speech features
- **Document Processing**: PDF and document analysis capabilities
- **Custom Models**: Fine-tuned models for specific use cases
- **Caching Layer**: Redis integration for response caching
- **Rate Limiting**: Per-user rate limiting and quota management
