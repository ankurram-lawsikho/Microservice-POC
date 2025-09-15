import { pool, testConnection } from './config/database.js';
import VectorSearchService from './services/vectorSearchService.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Configuration
const TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';

async function populateExistingTodos() {
    console.log('🔄 Populating embeddings for existing todos...\n');
    
    try {
        // Test database connection
        console.log('🔧 Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        
        const vectorService = new VectorSearchService();
        
        // Get authentication token (you'll need to provide this)
        console.log('🔐 Getting authentication token...');
        const authToken = await getAuthToken();
        if (!authToken) {
            throw new Error('Failed to get authentication token');
        }
        
        // Fetch all todos from the todo service
        console.log('📋 Fetching todos from todo service...');
        const todos = await fetchTodos(authToken);
        console.log(`✅ Found ${todos.length} todos`);
        
        if (todos.length === 0) {
            console.log('ℹ️ No todos found to process');
            return;
        }
        
        // Process each todo
        console.log('📝 Creating embeddings for todos...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const todo of todos) {
            try {
                console.log(`Processing: ${todo.task}`);
                
                const todoData = {
                    todoId: todo._id || todo.id,
                    userId: todo.userId || todo.user,
                    task: todo.task,
                    completed: todo.completed || false
                };
                
                await vectorService.storeTodoEmbedding(todoData, {
                    category: todo.category || 'general',
                    priority: todo.priority || 'medium',
                    tags: todo.tags || [],
                    originalTodo: todo
                });
                
                console.log(`✅ Created embedding for: ${todo.task}`);
                successCount++;
                
                // Small delay to avoid overwhelming the embedding service
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Failed to create embedding for: ${todo.task} - ${error.message}`);
                errorCount++;
            }
        }
        
        console.log(`\n🎉 Embedding creation completed!`);
        console.log(`✅ Successfully processed: ${successCount} todos`);
        console.log(`❌ Failed: ${errorCount} todos`);
        
        // Test search
        console.log('\n🔍 Testing semantic search...');
        const testResults = await vectorService.searchSimilarTodos('work tasks', null, 5, 0.5);
        console.log(`✅ Found ${testResults.length} results for test search`);
        
    } catch (error) {
        console.error('❌ Failed to populate existing todos:', error.message);
        process.exit(1);
    }
}

async function getAuthToken() {
    try {
        // Try to get a token using a test user
        // You might need to adjust this based on your auth setup
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
            email: 'ankur@email.com', // You'll need to provide a valid user
            password: 'ankur' // You'll need to provide the correct password
        });
        
        return response.data.token;
    } catch (error) {
        console.log('⚠️ Could not get auth token automatically. You may need to provide one manually.');
        console.log('Please create a .env file with AUTH_TOKEN=your_token_here');
        
        // Try to get token from environment
        return process.env.AUTH_TOKEN;
    }
}

async function fetchTodos(authToken) {
    try {
        const response = await axios.get(`${TODO_SERVICE_URL}/todos`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        return response.data.todos || response.data || [];
    } catch (error) {
        console.error('Failed to fetch todos:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

// Run the population
populateExistingTodos();
