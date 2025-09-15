# Vector Service Documentation

## Overview

The Vector Service provides semantic search capabilities using pgvector and Google Gemini embeddings. It enables intelligent search across todos, AI-generated content, and user profiles using vector similarity instead of traditional keyword matching.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Todo Service  │    │  Vector Service │    │  AI Service     │
│                 │────│                 │────│                 │
│ Port 3002       │    │ Port 3010       │    │ Port 3008       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ PostgreSQL      │    │  Gemini AI      │
                       │ with pgvector   │    │  Embeddings     │
                       └─────────────────┘    └─────────────────┘
```

## Features

### Core Vector Features
- **Semantic Search**: Find similar content using meaning, not just keywords
- **Embedding Generation**: Convert text to vector representations using Google Gemini
- **Vector Storage**: Efficient storage and retrieval using PostgreSQL with pgvector
- **Similarity Search**: Multiple similarity metrics (cosine, L2, inner product)
- **Contextual Suggestions**: AI-powered recommendations based on user context

### Data Types Supported
- **Todo Embeddings**: Semantic search across user todos
- **AI Content Embeddings**: Search through AI-generated insights and suggestions
- **User Profile Embeddings**: Personalized recommendations based on user profiles

## API Endpoints

### Base URL
- **Direct**: `http://localhost:3010/api/vector`
- **Via Gateway**: `http://localhost:3000/api/vector`

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Embedding Endpoints

#### 1. Store Todo Embedding
**POST** `/api/vector/todos/embed`

Store embedding for a todo item to enable semantic search.

**Request Body:**
```json
{
  "todoId": "507f1f77bcf86cd799439011",
  "task": "Review quarterly budget report",
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "todoId": "507f1f77bcf86cd799439011",
    "userId": 123,
    "task": "Review quarterly budget report",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Todo embedding stored successfully"
}
```

#### 2. Store AI Content Embedding
**POST** `/api/vector/ai-content/embed`

Store embedding for AI-generated content.

**Request Body:**
```json
{
  "contentType": "todo_analysis",
  "originalText": "Based on your todo list, you have a good mix of work and personal tasks...",
  "metadata": {
    "analysisType": "productivity",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "contentType": "todo_analysis",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "AI content embedding stored successfully"
}
```

#### 3. Store User Profile Embedding
**POST** `/api/vector/user-profile/embed`

Store embedding for user profile information.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "metadata": {
    "preferences": ["productivity", "work"],
    "timezone": "UTC"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "User profile embedding stored successfully"
}
```

### Search Endpoints

#### 4. Semantic Todo Search
**POST** `/api/vector/todos/search`

Search for similar todos using semantic similarity.

**Request Body:**
```json
{
  "query": "financial planning tasks",
  "limit": 10,
  "threshold": 0.7,
  "includeOthers": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "financial planning tasks",
    "results": [
      {
        "todoId": "507f1f77bcf86cd799439011",
        "userId": 123,
        "task": "Review quarterly budget report",
        "similarity": 0.85,
        "distance": 0.15,
        "metadata": {
          "completed": false,
          "originalText": "Review quarterly budget report pending"
        },
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalResults": 1,
    "searchParams": {
      "limit": 10,
      "threshold": 0.7,
      "includeOthers": false
    }
  },
  "message": "Semantic search completed successfully"
}
```

#### 5. Search AI Content
**POST** `/api/vector/ai-content/search`

Search for similar AI-generated content.

**Request Body:**
```json
{
  "query": "productivity tips",
  "contentType": "suggestions",
  "limit": 5,
  "threshold": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "productivity tips",
    "results": [
      {
        "id": 1,
        "userId": 123,
        "contentType": "suggestions",
        "originalText": "Try the Pomodoro technique for better focus...",
        "similarity": 0.78,
        "distance": 0.22,
        "metadata": {
          "timestamp": "2024-01-01T12:00:00.000Z"
        },
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalResults": 1,
    "searchParams": {
      "contentType": "suggestions",
      "limit": 5,
      "threshold": 0.6
    }
  },
  "message": "AI content search completed successfully"
}
```

#### 6. Contextual Suggestions
**POST** `/api/vector/suggestions/contextual`

Get contextual suggestions based on user's current todos and profile.

**Request Body:**
```json
{
  "context": "Working on a project deadline",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "context": "Working on a project deadline",
    "suggestions": [
      {
        "id": 1,
        "userId": 123,
        "contentType": "suggestions",
        "originalText": "Break down large tasks into smaller milestones",
        "similarity": 0.82,
        "distance": 0.18,
        "metadata": {
          "timestamp": "2024-01-01T12:00:00.000Z"
        },
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalSuggestions": 1
  },
  "message": "Contextual suggestions generated successfully"
}
```

### Utility Endpoints

#### 7. Generate Embedding
**POST** `/api/vector/embedding/generate`

Generate embedding vector for any text.

**Request Body:**
```json
{
  "text": "This is a sample text for embedding generation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "This is a sample text for embedding generation",
    "embedding": [0.1, 0.2, 0.3, ...],
    "dimension": 1536,
    "model": "text-embedding-004"
  },
  "message": "Embedding generated successfully"
}
```

#### 8. Delete Todo Embedding
**DELETE** `/api/vector/todos/:todoId`

Delete embedding for a specific todo.

**Response:**
```json
{
  "success": true,
  "message": "Todo embedding deleted successfully"
}
```

#### 9. Health Check
**GET** `/api/health`

Check service health status.

**Response:**
```json
{
  "status": "OK",
  "service": "Vector Service",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "features": [
    "semantic-search",
    "embedding-generation",
    "vector-storage",
    "contextual-suggestions",
    "pgvector-integration"
  ]
}
```

## Configuration

### Environment Variables

Create a `.env` file in the `vector-service` directory:

```env
# Service Configuration
PORT=3010
NODE_ENV=development

# Database Configuration (PostgreSQL with pgvector)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=vector_db

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Other Service URLs
AUTH_SERVICE_URL=http://localhost:3007
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
AI_SERVICE_URL=http://localhost:3008
```

### Database Setup

1. **Install PostgreSQL with pgvector extension:**
   ```bash
   # Install pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE vector_db;
   ```

3. **The service will automatically create the required tables:**
   - `todo_embeddings` - Stores todo embeddings
   - `ai_content_embeddings` - Stores AI content embeddings
   - `user_profile_embeddings` - Stores user profile embeddings

## Installation & Setup

1. **Navigate to Vector Service Directory:**
   ```bash
   cd vector-service
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Service:**
   ```bash
   npm start
   ```

## Integration with Other Services

### Todo Service Integration

The vector service automatically integrates with the todo service:

- **Automatic Embedding**: When todos are created/updated, embeddings are automatically stored
- **Smart Search**: The todo service provides a semantic search endpoint
- **Real-time Updates**: Embeddings are updated when todos are modified

### AI Service Integration

- **Content Storage**: AI-generated content is automatically embedded and stored
- **Contextual Suggestions**: AI service can request contextual suggestions
- **Enhanced Responses**: AI responses can be enhanced with similar content retrieval

### MCP Server Integration

The MCP server includes vector search tools:

- `search_similar_todos` - Semantic todo search
- `search_ai_content` - AI content search
- `get_contextual_suggestions` - Contextual recommendations
- `generate_embedding` - Generate embeddings
- `store_todo_embedding` - Store todo embeddings
- `store_ai_content_embedding` - Store AI content embeddings

## Usage Examples

### Frontend Integration

```javascript
// Semantic todo search
const searchTodos = async (query) => {
  const response = await fetch('/api/vector/todos/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      limit: 10,
      threshold: 0.7
    })
  });
  return response.json();
};

// Get contextual suggestions
const getSuggestions = async (context) => {
  const response = await fetch('/api/vector/suggestions/contextual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ context, limit: 5 })
  });
  return response.json();
};
```

### cURL Examples

```bash
# Semantic todo search
curl -X POST http://localhost:3000/api/vector/todos/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "financial planning", "limit": 5}'

# Generate embedding
curl -X POST http://localhost:3000/api/vector/embedding/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "Sample text for embedding"}'

# Get contextual suggestions
curl -X POST http://localhost:3000/api/vector/suggestions/contextual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"context": "Working on project deadline", "limit": 3}'
```

## Performance Considerations

### Indexing
The service automatically creates indexes for optimal performance:

```sql
-- Vector similarity indexes
CREATE INDEX ON todo_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON ai_content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON user_profile_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Similarity Metrics
- **Cosine Similarity** (`<=>`): Best for semantic similarity
- **L2 Distance** (`<->`): Euclidean distance
- **Inner Product** (`<#>`): Dot product similarity

### Optimization Tips
1. **Batch Operations**: Process multiple embeddings in batches
2. **Caching**: Cache frequently accessed embeddings
3. **Index Tuning**: Adjust `lists` parameter based on data size
4. **Connection Pooling**: Use connection pooling for database connections

## Error Handling

The service returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Token validation failed
- **500 Internal Server Error**: Vector service or database error

**Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

## Security Considerations

- All endpoints require authentication via JWT tokens
- Tokens are validated through the Auth Service
- User data isolation ensures users only access their own embeddings
- API keys are stored securely in environment variables
- Request/response logging for audit trails

## Monitoring & Logging

The service provides comprehensive logging:

- **Request Logging**: All incoming requests with user context
- **Response Logging**: API responses with metadata
- **Error Logging**: Detailed error information for debugging
- **Performance Logging**: Response times and embedding generation metrics

## Future Enhancements

- **Multi-language Support**: Support for multiple embedding models
- **Real-time Updates**: WebSocket support for real-time embedding updates
- **Advanced Analytics**: Usage analytics and performance metrics
- **Custom Models**: Support for custom embedding models
- **Batch Processing**: Bulk embedding generation and storage
- **Caching Layer**: Redis integration for response caching
