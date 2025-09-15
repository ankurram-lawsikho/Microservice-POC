import { initializeDatabase, testConnection } from './config/database.js';
import VectorSearchService from './services/vectorSearchService.js';
import dotenv from 'dotenv';

dotenv.config();

async function populateTestData() {
    console.log('🧪 Populating Vector Database with Test Data...\n');
    
    try {
        // Test database connection
        console.log('🔧 Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        
        // Initialize database
        console.log('🔧 Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized');
        
        const vectorService = new VectorSearchService();
        
        // Test todo data
        const testTodos = [
            {
                todoId: 'test-1',
                userId: 9,
                task: 'Set up database with PostgreSQL and pgvector extension',
                completed: false
            },
            {
                todoId: 'test-2', 
                userId: 9,
                task: 'Configure Docker container for vector database',
                completed: true
            },
            {
                todoId: 'test-3',
                userId: 9,
                task: 'Install and configure pgvector extension',
                completed: true
            },
            {
                todoId: 'test-4',
                userId: 9,
                task: 'Create vector embeddings for semantic search',
                completed: false
            },
            {
                todoId: 'test-5',
                userId: 9,
                task: 'Test database connection and health checks',
                completed: true
            },
            {
                todoId: 'test-6',
                userId: 9,
                task: 'Implement smart todo search functionality',
                completed: false
            },
            {
                todoId: 'test-7',
                userId: 9,
                task: 'Setup environment variables and configuration',
                completed: true
            },
            {
                todoId: 'test-8',
                userId: 9,
                task: 'Create frontend components for vector search',
                completed: false
            }
        ];
        
        console.log('📝 Adding test todos with embeddings...');
        
        for (const todo of testTodos) {
            try {
                await vectorService.storeTodoEmbedding(todo, {
                    category: 'development',
                    priority: 'medium',
                    tags: ['database', 'setup', 'vector', 'search']
                });
                console.log(`✅ Added: ${todo.task}`);
            } catch (error) {
                console.log(`❌ Failed to add: ${todo.task} - ${error.message}`);
            }
        }
        
        console.log('\n🔍 Testing semantic search...');
        
        // Test searches
        const testQueries = [
            'db setup tasks',
            'database configuration',
            'vector search implementation',
            'completed tasks',
            'frontend development'
        ];
        
        for (const query of testQueries) {
            try {
                console.log(`\n🔎 Searching for: "${query}"`);
                const results = await vectorService.searchSimilarTodos(query, 9, 5, 0.5);
                
                if (results.length > 0) {
                    console.log(`✅ Found ${results.length} results:`);
                    results.forEach((result, index) => {
                        console.log(`  ${index + 1}. ${result.task} (similarity: ${result.similarity.toFixed(3)})`);
                    });
                } else {
                    console.log('❌ No results found');
                }
            } catch (error) {
                console.log(`❌ Search failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Test data population completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Database connections are managed by the pool
        console.log('✅ Test completed');
    }
}

// Run the test
populateTestData();
