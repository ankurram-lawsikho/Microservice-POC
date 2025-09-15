import { pool, testConnection } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
    console.log('🔄 Resetting Vector Database...\n');
    
    try {
        // Test database connection
        console.log('🔧 Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        
        const client = await pool.connect();
        
        try {
            // Drop existing tables
            console.log('🗑️ Dropping existing tables...');
            await client.query('DROP TABLE IF EXISTS todo_embeddings CASCADE');
            await client.query('DROP TABLE IF EXISTS ai_content_embeddings CASCADE');
            await client.query('DROP TABLE IF EXISTS user_profile_embeddings CASCADE');
            console.log('✅ Tables dropped');
            
            // Recreate tables with correct dimensions
            console.log('🔧 Creating tables with 768 dimensions...');
            
            // Create todo_embeddings table
            await client.query(`
                CREATE TABLE todo_embeddings (
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
                CREATE TABLE ai_content_embeddings (
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
                CREATE TABLE user_profile_embeddings (
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
                CREATE INDEX idx_todo_embeddings_user_id ON todo_embeddings("userId");
            `);
            
            await client.query(`
                CREATE INDEX idx_ai_content_embeddings_user_id ON ai_content_embeddings("userId");
            `);
            
            await client.query(`
                CREATE INDEX idx_ai_content_embeddings_content_type ON ai_content_embeddings("contentType");
            `);
            
            // Create vector similarity indexes
            await client.query(`
                CREATE INDEX idx_todo_embeddings_vector ON todo_embeddings 
                USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
            `);
            
            await client.query(`
                CREATE INDEX idx_ai_content_embeddings_vector ON ai_content_embeddings 
                USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
            `);
            
            await client.query(`
                CREATE INDEX idx_user_profile_embeddings_vector ON user_profile_embeddings 
                USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
            `);
            
            console.log('✅ Tables created with correct dimensions');
            
        } finally {
            client.release();
        }
        
        console.log('\n🎉 Database reset completed successfully!');
        
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        process.exit(1);
    }
}

// Run the reset
resetDatabase();
