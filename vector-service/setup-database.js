import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
    console.log('🔧 Setting up Vector Service Database...\n');
    
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres' // Connect to default postgres database first
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'vector_db';
        const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`;
        const dbExists = await client.query(checkDbQuery);
        
        if (dbExists.rows.length === 0) {
            console.log(`📦 Creating database: ${dbName}`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database '${dbName}' created successfully`);
        } else {
            console.log(`✅ Database '${dbName}' already exists`);
        }

        // Close connection to default database
        await client.end();

        // Connect to the vector database
        const vectorClient = new Client({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: dbName
        });

        await vectorClient.connect();
        console.log(`✅ Connected to database: ${dbName}`);

        // Check if pgvector extension is available
        console.log('🔍 Checking for pgvector extension...');
        const extensionsQuery = `SELECT name FROM pg_available_extensions WHERE name = 'vector'`;
        const availableExtensions = await vectorClient.query(extensionsQuery);
        
        if (availableExtensions.rows.length === 0) {
            console.log('❌ pgvector extension is not available on this PostgreSQL installation');
            console.log('\n📋 To install pgvector:');
            console.log('1. For Ubuntu/Debian: sudo apt install postgresql-16-pgvector');
            console.log('2. For macOS with Homebrew: brew install pgvector');
            console.log('3. For Docker: Use a PostgreSQL image with pgvector pre-installed');
            console.log('4. For manual installation: https://github.com/pgvector/pgvector#installation');
            console.log('\n🐳 Recommended Docker command:');
            console.log('docker run --name postgres-vector -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d pgvector/pgvector:pg16');
            process.exit(1);
        }

        // Install pgvector extension
        console.log('📦 Installing pgvector extension...');
        await vectorClient.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('✅ pgvector extension installed successfully');

        // Verify installation
        const verifyQuery = `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
        const extensionInfo = await vectorClient.query(verifyQuery);
        
        if (extensionInfo.rows.length > 0) {
            console.log(`✅ pgvector extension verified - Version: ${extensionInfo.rows[0].extversion}`);
        } else {
            console.log('❌ pgvector extension verification failed');
            process.exit(1);
        }

        // Test vector operations
        console.log('🧪 Testing vector operations...');
        await vectorClient.query(`
            CREATE TABLE IF NOT EXISTS test_vectors (
                id SERIAL PRIMARY KEY,
                embedding vector(3)
            )
        `);
        
        await vectorClient.query(`
            INSERT INTO test_vectors (embedding) VALUES 
            ('[1,2,3]'::vector),
            ('[4,5,6]'::vector)
        `);
        
        const similarityQuery = `
            SELECT id, embedding <-> '[1,2,3]'::vector as distance 
            FROM test_vectors 
            ORDER BY embedding <-> '[1,2,3]'::vector 
            LIMIT 1
        `;
        
        const result = await vectorClient.query(similarityQuery);
        console.log('✅ Vector similarity search test passed');
        console.log(`   Closest vector ID: ${result.rows[0].id}, Distance: ${result.rows[0].distance}`);
        
        // Clean up test table
        await vectorClient.query('DROP TABLE test_vectors');
        console.log('✅ Test cleanup completed');

        await vectorClient.end();
        
        console.log('\n🎉 Vector Service Database Setup Complete!');
        console.log('📋 Next steps:');
        console.log('1. Start the vector service: npm start');
        console.log('2. Test the health endpoint: npm run test:health');
        console.log('3. Access the frontend at: http://localhost:5173/vector/health');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Ensure PostgreSQL is running');
        console.log('2. Check your database credentials in .env file');
        console.log('3. Verify pgvector extension is available');
        console.log('4. Check database permissions');
        process.exit(1);
    }
};

// Run setup
setupDatabase();
