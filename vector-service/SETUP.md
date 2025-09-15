# Vector Service Setup Guide

This guide will help you set up the Vector Service with PostgreSQL and pgvector extension using Docker.

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Google Gemini API key
- Local PostgreSQL (for user service - already running)

## Quick Start

```bash
# 1. Start the vector database
cd vector-service
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Test setup
npm run setup:db

# 5. Start the service
npm start
```

## Hybrid Setup (Docker for Vector DB, Local for User DB)

This setup uses Docker for the vector service database (with pgvector) while keeping your existing local PostgreSQL for the user service.

### 1. Start Vector Database with Docker

```bash
cd vector-service

# Start PostgreSQL with pgvector using Docker Compose
docker-compose up -d

# Verify the database is running
docker ps
```

The Docker setup will:
- Use port 5433 (to avoid conflict with your local PostgreSQL on 5432)
- Automatically install and configure pgvector extension
- Create the vector_db database
- Run initialization scripts

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env file with your configuration
# Make sure to set your GEMINI_API_KEY
# The database settings are already configured for Docker (port 5433)
```

### 4. Test Database Setup

```bash
# Run the database setup script to verify everything works
npm run setup:db
```

This script will:
- Connect to the Docker PostgreSQL instance
- Verify the pgvector extension is working
- Test vector operations
- Provide detailed feedback

### 5. Start the Service

```bash
# Start the vector service
npm start

# Or start in development mode with auto-reload
npm run dev
```

### 6. Test the Service

```bash
# Test the health endpoint
npm run test:health

# Or test manually
curl http://localhost:3010/api/health
```

### 7. Stop Vector Database (when needed)

```bash
# Stop the Docker container
docker-compose down

# Stop and remove volumes (if you want to start fresh)
docker-compose down -v
```

## Environment Configuration

### Required Variables

```env
# Database (Docker PostgreSQL with pgvector)
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=vector_db

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# Service URLs
AUTH_SERVICE_URL=http://localhost:3007
USER_SERVICE_URL=http://localhost:3001
TODO_SERVICE_URL=http://localhost:3002
AI_SERVICE_URL=http://localhost:3008
```

**Note**: The vector service uses port 5433 for its Docker PostgreSQL instance to avoid conflicts with your local PostgreSQL (port 5432) used by the user service.

### Optional Variables

```env
# Vector Configuration
VECTOR_DIMENSION=1536
VECTOR_SIMILARITY_THRESHOLD=0.7
VECTOR_MAX_RESULTS=50

# Performance
MAX_CONCURRENT_EMBEDDINGS=5
EMBEDDING_CACHE_TTL=3600
SEARCH_CACHE_TTL=300
```

## Troubleshooting

### Common Issues

#### 1. "Data type 'vector' is not supported"
- **Cause**: pgvector extension not installed
- **Solution**: Make sure Docker container is running with `docker-compose up -d`

#### 2. "Database connection failed"
- **Cause**: Docker PostgreSQL not running or wrong port
- **Solution**: 
  - Check Docker container: `docker ps`
  - Start container: `docker-compose up -d`
  - Verify port 5433 is not in use by another service

#### 3. "GEMINI_API_KEY not found"
- **Cause**: Missing or invalid API key
- **Solution**: Get API key from Google AI Studio and add to .env

#### 4. "Extension 'vector' does not exist"
- **Cause**: Docker container not properly initialized
- **Solution**: 
  - Stop and restart: `docker-compose down && docker-compose up -d`
  - Check container logs: `docker-compose logs postgres-vector`

#### 5. "Port 5433 already in use"
- **Cause**: Another service using the same port
- **Solution**: 
  - Change port in docker-compose.yml
  - Update .env file with new port
  - Or stop the conflicting service

### Verification Steps

1. **Check Docker Container Status**:
   ```bash
   docker ps
   docker-compose logs postgres-vector
   ```

2. **Verify pgvector Installation**:
   ```bash
   docker exec -it postgres-vector psql -U postgres -d vector_db -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
   ```

3. **Test Vector Operations**:
   ```bash
   docker exec -it postgres-vector psql -U postgres -d vector_db -c "SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector;"
   ```

4. **Check Service Health**:
   ```bash
   curl http://localhost:3010/api/health
   ```

5. **Test Database Connection**:
   ```bash
   npm run setup:db
   ```

## Development

### Available Scripts

- `npm start` - Start the service
- `npm run dev` - Start in development mode with auto-reload
- `npm run setup:db` - Setup database and verify pgvector
- `npm run test:health` - Test health endpoint

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/info` - Service information
- `POST /api/vector/todos/search` - Semantic todo search
- `POST /api/vector/ai-content/search` - AI content search
- `POST /api/vector/suggestions/contextual` - Contextual suggestions

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PASSWORD=your_secure_password
GEMINI_API_KEY=your_production_api_key
```

## Support

If you encounter issues:

1. Check the logs: `npm run dev` for detailed error messages
2. Verify all prerequisites are installed
3. Test database connectivity manually
4. Check environment variables
5. Review the troubleshooting section above

## Next Steps

After successful setup:

1. Access the frontend at: http://localhost:5173/vector/health
2. Test semantic search functionality
3. Monitor service health and performance
4. Configure additional vector features as needed
