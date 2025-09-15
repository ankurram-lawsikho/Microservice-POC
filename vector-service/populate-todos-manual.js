
import { pool, testConnection } from './config/database.js';
import VectorSearchService from './services/vectorSearchService.js';
import dotenv from 'dotenv';

dotenv.config();

async function populateTodosManually() {
    console.log('🔄 Manually populating embeddings for sample todos...\n');
    
    try {
        // Test database connection
        console.log('🔧 Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        
        const vectorService = new VectorSearchService();
        
        // Sample todos that represent common use cases
        const sampleTodos = [
            {
                todoId: 'todo-1',
                userId: 1,
                task: 'Review quarterly financial reports',
                completed: false
            },
            {
                todoId: 'todo-2', 
                userId: 1,
                task: 'Schedule team meeting for project planning',
                completed: false
            },
            {
                todoId: 'todo-3',
                userId: 1, 
                task: 'Update user documentation and API guides',
                completed: true
            },
            {
                todoId: 'todo-4',
                userId: 1,
                task: 'Fix authentication bug in login system',
                completed: false
            },
            {
                todoId: 'todo-5',
                userId: 1,
                task: 'Plan vacation trip to Europe',
                completed: false
            },
            {
                todoId: 'todo-6',
                userId: 1,
                task: 'Learn React hooks and modern JavaScript',
                completed: true
            },
            {
                todoId: 'todo-7',
                userId: 1,
                task: 'Organize office supplies and equipment',
                completed: false
            },
            {
                todoId: 'todo-8',
                userId: 1,
                task: 'Write unit tests for payment processing',
                completed: false
            },
            {
                todoId: 'todo-9',
                userId: 1,
                task: 'Research new database optimization techniques',
                completed: true
            },
            {
                todoId: 'todo-10',
                userId: 1,
                task: 'Prepare presentation for client meeting',
                completed: false
            }
        ];
        
        console.log(`📝 Creating embeddings for ${sampleTodos.length} sample todos...`);
        let successCount = 0;
        let errorCount = 0;
        
        for (const todo of sampleTodos) {
            try {
                console.log(`Processing: ${todo.task}`);
                
                await vectorService.storeTodoEmbedding(todo, {
                    category: 'sample',
                    priority: 'medium',
                    tags: ['sample', 'demo'],
                    source: 'manual-population'
                });
                
                console.log(`✅ Created embedding for: ${todo.task}`);
                successCount++;
                
                // Small delay to avoid overwhelming the embedding service
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Failed to create embedding for: ${todo.task} - ${error.message}`);
                errorCount++;
            }
        }
        
        console.log(`\n🎉 Embedding creation completed!`);
        console.log(`✅ Successfully processed: ${successCount} todos`);
        console.log(`❌ Failed: ${errorCount} todos`);
        
        // Test searches
        console.log('\n🔍 Testing semantic searches...');
        
        const testQueries = [
            'financial work',
            'meeting planning', 
            'coding tasks',
            'learning activities',
            'bug fixes'
        ];
        
        for (const query of testQueries) {
            try {
                const results = await vectorService.searchSimilarTodos(query, 1, 3, 0.5);
                console.log(`🔎 "${query}": Found ${results.length} results`);
                if (results.length > 0) {
                    console.log(`   Top result: ${results[0].task} (${(results[0].similarity * 100).toFixed(1)}% match)`);
                }
            } catch (error) {
                console.error(`❌ Search failed for "${query}": ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to populate todos:', error.message);
        process.exit(1);
    }
}

// Run the population
populateTodosManually();
