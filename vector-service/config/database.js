import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    database: process.env.DB_NAME || 'vector_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize database with pgvector extension
export const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        
        // Enable pgvector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('✅ pgvector extension enabled');
        
        // Verify extension is installed
        const result = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        if (result.rows.length > 0) {
            console.log('✅ pgvector extension verified');
        } else {
            throw new Error('pgvector extension not found after installation attempt');
        }
        
        // Create tables
        await createTables(client);
        console.log('✅ Database tables created');
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
};

// Create database tables
const createTables = async (client) => {
    // Create todo_embeddings table
    await client.query(`
        CREATE TABLE IF NOT EXISTS todo_embeddings (
            id SERIAL PRIMARY KEY,
            "todoId" VARCHAR(255) NOT NULL UNIQUE,
            "userId" INTEGER NOT NULL,
            task TEXT NOT NULL,
            embedding vector(768) NOT NULL,
            "embeddingModel" VARCHAR(100) DEFAULT 'text-embedding-004',
            metadata JSONB DEFAULT '{}',
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create ai_content_embeddings table
    await client.query(`
        CREATE TABLE IF NOT EXISTS ai_content_embeddings (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL,
            "contentType" VARCHAR(100) NOT NULL,
            "originalText" TEXT NOT NULL,
            embedding vector(768) NOT NULL,
            "embeddingModel" VARCHAR(100) DEFAULT 'text-embedding-004',
            metadata JSONB DEFAULT '{}',
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create user_profile_embeddings table
    await client.query(`
        CREATE TABLE IF NOT EXISTS user_profile_embeddings (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL UNIQUE,
            "profileData" JSONB NOT NULL,
            embedding vector(768) NOT NULL,
            "embeddingModel" VARCHAR(100) DEFAULT 'text-embedding-004',
            metadata JSONB DEFAULT '{}',
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create indexes for better performance
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_todo_embeddings_user_id ON todo_embeddings("userId");
    `);
    
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_content_embeddings_user_id ON ai_content_embeddings("userId");
    `);
    
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_content_embeddings_content_type ON ai_content_embeddings("contentType");
    `);
    
    // Create vector similarity indexes
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_todo_embeddings_vector ON todo_embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
    
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_content_embeddings_vector ON ai_content_embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
    
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_profile_embeddings_vector ON user_profile_embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
};

// Close all connections
export const closeConnections = async () => {
    try {
        await pool.end();
        console.log('✅ Database connections closed');
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
};

// Health check
export const healthCheck = async () => {
    try {
        const client = await pool.connect();
        
        // Test basic connection
        await client.query('SELECT 1');
        
        // Check pgvector extension
        const vectorResult = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        const hasVectorExtension = vectorResult.rows.length > 0;
        
        // Check tables exist
        const tablesResult = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('todo_embeddings', 'ai_content_embeddings', 'user_profile_embeddings')
        `);
        const tablesExist = tablesResult.rows.length === 3;
        
        // Test vector operations
        let vectorOpsWork = false;
        try {
            await client.query('SELECT \'[1,2,3]\'::vector <=> \'[1,2,4]\'::vector as distance');
            vectorOpsWork = true;
        } catch (error) {
            console.log('Vector operations test failed:', error.message);
        }
        
        client.release();
        
        return {
            connected: true,
            hasVectorExtension,
            tablesExist,
            vectorOpsWork,
            poolStats: {
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
                waitingCount: pool.waitingCount
            }
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message
        };
    }
};