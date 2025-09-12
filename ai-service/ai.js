import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { createLogger } from '../logger-service/logger.js';

dotenv.config();

const app = express();
const port = 3008;

// Enhanced structured logger
const logger = createLogger('ai-service');

app.use(express.json());
app.use(cors());

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY is required but not provided');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Gemini models
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Rate limiting
const requestCounts = new Map();
const DAILY_LIMIT = 40; // Leave some buffer below the 50 limit

const checkRateLimit = (userId) => {
  const today = new Date().toDateString();
  const key = `${userId}-${today}`;
  const count = requestCounts.get(key) || 0;
  
  if (count >= DAILY_LIMIT) {
    throw new Error(`Daily AI request limit reached (${DAILY_LIMIT} requests). Please try again tomorrow or upgrade your plan.`);
  }
  
  requestCounts.set(key, count + 1);
  return true;
};

// Service configurations
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3007';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const TODO_SERVICE_URL = process.env.TODO_SERVICE_URL || 'http://localhost:3002';

// Helper function to fetch user data
const fetchUserData = async (userId, token) => {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        logger.error('Failed to fetch user data', { userId, error: error.message });
        return null;
    }
};

// Helper function to fetch user's todos
const fetchUserTodos = async (token) => {
    try {
        const response = await axios.get(`${TODO_SERVICE_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        logger.error('Failed to fetch user todos', { error: error.message });
        return [];
    }
};

// Middleware to validate JWT tokens via auth service
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.valid) {
            req.user = response.data.user;
            next();
        } else {
            return res.status(403).json({ error: 'Invalid token' });
        }
    } catch (error) {
        logger.error('Token validation failed', { error: error.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Text generation endpoint
app.post('/api/ai/generate', authenticateToken, async (req, res) => {
    try {
        const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        logger.info('Text generation request', { 
            userId: req.user.userId, 
            promptLength: prompt.length 
        });

        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        logger.success('Text generation completed', { 
            userId: req.user.userId,
            responseLength: generatedText.length 
        });

        res.json({
            success: true,
            generatedText,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString(),
                promptLength: prompt.length,
                responseLength: generatedText.length
            }
        });

    } catch (error) {
        logger.error('Text generation failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Text generation failed', 
            details: error.message 
        });
    }
});

// Chat completion endpoint
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        logger.info('Chat request', { 
            userId: req.user.userId, 
            messageLength: message.length,
            historyLength: history.length 
        });

        // Start a chat session
        const chat = chatModel.startChat({
            history: history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const reply = response.text();

        logger.success('Chat completed', { 
            userId: req.user.userId,
            replyLength: reply.length 
        });

        res.json({
            success: true,
            reply,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString(),
                messageLength: message.length,
                replyLength: reply.length
            }
        });

    } catch (error) {
        logger.error('Chat failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Chat failed', 
            details: error.message 
        });
    }
});

// Code generation endpoint
app.post('/api/ai/code', authenticateToken, async (req, res) => {
    try {
        const { description, language = 'javascript', includeComments = true } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        logger.info('Code generation request', { 
            userId: req.user.userId, 
            language,
            descriptionLength: description.length 
        });

        const codePrompt = `Generate ${language} code for: ${description}. 
        ${includeComments ? 'Include detailed comments explaining the code.' : ''}
        Return only the code without any additional explanations.`;

        const result = await textModel.generateContent(codePrompt);
        const response = await result.response;
        const generatedCode = response.text();

        logger.success('Code generation completed', { 
            userId: req.user.userId,
            language,
            codeLength: generatedCode.length 
        });

        res.json({
            success: true,
            code: generatedCode,
            language,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString(),
                descriptionLength: description.length,
                codeLength: generatedCode.length
            }
        });

    } catch (error) {
        logger.error('Code generation failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Code generation failed', 
            details: error.message 
        });
    }
});

// Text analysis endpoint
app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    try {
        const { text, analysisType = 'sentiment' } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        logger.info('Text analysis request', { 
            userId: req.user.userId, 
            analysisType,
            textLength: text.length 
        });

        let analysisPrompt;
        switch (analysisType) {
            case 'sentiment':
                analysisPrompt = `Analyze the sentiment of the following text and provide a score from -1 (very negative) to 1 (very positive) with a brief explanation: "${text}"`;
                break;
            case 'summary':
                analysisPrompt = `Provide a concise summary of the following text: "${text}"`;
                break;
            case 'keywords':
                analysisPrompt = `Extract the main keywords and key phrases from the following text: "${text}"`;
                break;
            default:
                analysisPrompt = `Analyze the following text: "${text}"`;
        }

        const result = await textModel.generateContent(analysisPrompt);
        const response = await result.response;
        const analysis = response.text();

        logger.success('Text analysis completed', { 
            userId: req.user.userId,
            analysisType,
            analysisLength: analysis.length 
        });

        res.json({
            success: true,
            analysis,
            analysisType,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString(),
                textLength: text.length,
                analysisLength: analysis.length
            }
        });

    } catch (error) {
        logger.error('Text analysis failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Text analysis failed', 
            details: error.message 
        });
    }
});

// AI-powered Todo Analysis and Suggestions
app.post('/api/ai/todos/analyze', authenticateToken, async (req, res) => {
    try {
        // Check rate limit
        checkRateLimit(req.user.userId);
        
        const token = req.headers['authorization'].split(' ')[1];
        const todos = await fetchUserTodos(token);
        
        if (!todos || todos.length === 0) {
            return res.json({
                success: true,
                analysis: "No todos found to analyze. Start by creating some tasks!",
                suggestions: ["Create your first todo", "Set up a daily routine", "Plan your week ahead"]
            });
        }

        const todoText = todos.map(todo => `- ${todo.task} (${todo.completed ? 'Completed' : 'Pending'})`).join('\n');
        
        const analysisPrompt = `Analyze the following todo list and provide insights, patterns, and suggestions for improvement:

${todoText}

Please provide:
1. Overall productivity analysis
2. Common patterns or themes
3. Suggestions for better task management
4. Recommendations for prioritizing tasks
5. Tips for improving completion rates`;

        const result = await textModel.generateContent(analysisPrompt);
        const response = await result.response;
        const analysis = response.text();

        logger.success('Todo analysis completed', { 
            userId: req.user.userId,
            todoCount: todos.length 
        });

        res.json({
            success: true,
            analysis,
            todoCount: todos.length,
            completedCount: todos.filter(t => t.completed).length,
            pendingCount: todos.filter(t => !t.completed).length,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Todo analysis failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        
        // Handle rate limit errors specifically
        if (error.message.includes('Daily AI request limit reached')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded', 
                message: error.message,
                retryAfter: '24 hours'
            });
        }
        
        res.status(500).json({ 
            error: 'Todo analysis failed', 
            details: error.message 
        });
    }
});

// AI-powered Todo Suggestions
app.post('/api/ai/todos/suggest', authenticateToken, async (req, res) => {
    try {
        const { context, category, priority = 'medium' } = req.body;
        const token = req.headers['authorization'].split(' ')[1];
        const userData = await fetchUserData(req.user.userId, token);
        const todos = await fetchUserTodos(token);

        const userContext = userData ? `User: ${userData.name} (${userData.email})` : 'User: Unknown';
        const existingTodos = todos.map(todo => `- ${todo.task}`).join('\n');
        
        const suggestionPrompt = `Based on the following context, suggest 5 relevant todo items:

${userContext}
Context: ${context || 'General productivity'}
Category: ${category || 'General'}
Priority: ${priority}
Existing todos: ${existingTodos || 'None'}

Please suggest 5 specific, actionable todo items that would complement the user's existing tasks and context. Make them practical and achievable.`;

        const result = await textModel.generateContent(suggestionPrompt);
        const response = await result.response;
        const suggestions = response.text();

        logger.success('Todo suggestions generated', { 
            userId: req.user.userId,
            context,
            category 
        });

        res.json({
            success: true,
            suggestions,
            context,
            category,
            priority,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Todo suggestions failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Todo suggestions failed', 
            details: error.message 
        });
    }
});

// AI-powered User Profile Insights
app.post('/api/ai/user/insights', authenticateToken, async (req, res) => {
    try {
        // Check rate limit
        checkRateLimit(req.user.userId);
        
        const token = req.headers['authorization'].split(' ')[1];
        const userData = await fetchUserData(req.user.userId, token);
        const todos = await fetchUserTodos(token);

        if (!userData) {
            return res.status(404).json({ error: 'User data not found' });
        }

        const todoStats = {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            pending: todos.filter(t => !t.completed).length,
            completionRate: todos.length > 0 ? (todos.filter(t => t.completed).length / todos.length * 100).toFixed(1) : 0
        };

        const insightsPrompt = `Analyze this user profile and provide personalized insights and recommendations:

User Profile:
- Name: ${userData.name}
- Email: ${userData.email}
- Role: ${userData.role || 'user'}

Todo Statistics:
- Total todos: ${todoStats.total}
- Completed: ${todoStats.completed}
- Pending: ${todoStats.pending}
- Completion rate: ${todoStats.completionRate}%

Please provide:
1. Productivity insights based on their todo completion rate
2. Personalized recommendations for improvement
3. Suggestions for better task management
4. Motivational tips tailored to their current progress
5. Areas where they might need support or guidance`;

        const result = await textModel.generateContent(insightsPrompt);
        const response = await result.response;
        const insights = response.text();

        logger.success('User insights generated', { 
            userId: req.user.userId,
            todoStats 
        });

        res.json({
            success: true,
            insights,
            userProfile: {
                name: userData.name,
                email: userData.email,
                role: userData.role
            },
            todoStats,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('User insights failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'User insights failed', 
            details: error.message 
        });
    }
});

// AI-powered Task Breakdown
app.post('/api/ai/todos/breakdown', authenticateToken, async (req, res) => {
    try {
        // Check rate limit
        checkRateLimit(req.user.userId);
        
        const { taskDescription } = req.body;
        
        if (!taskDescription) {
            return res.status(400).json({ error: 'Task description is required' });
        }

        const breakdownPrompt = `Break down the following big task into smaller, actionable todos. Each todo should have a clear name and description.

Big Task: "${taskDescription}"

Please break this down into 3-7 smaller, manageable todos. For each todo, provide:
1. A short, clear name (2-5 words)
2. A detailed description of what needs to be done

Format your response as a JSON array where each todo has this structure:
{
  "name": "Short todo name",
  "description": "Detailed description of what needs to be done"
}

Return only the JSON array, no additional text.`;

        const result = await textModel.generateContent(breakdownPrompt);
        const response = await result.response;
        const breakdown = response.text();

        logger.success('Task breakdown completed', { 
            userId: req.user.userId,
            taskDescription 
        });

        res.json({
            success: true,
            breakdown,
            originalTask: taskDescription,
            metadata: {
                userId: req.user.userId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Task breakdown failed', { 
            error: error.message, 
            userId: req.user.userId 
        });
        res.status(500).json({ 
            error: 'Task breakdown failed', 
            details: error.message 
        });
    }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
    logger.info('Health check requested');
    res.json({
        status: 'OK',
        service: 'AI Service',
        timestamp: new Date().toISOString(),
        features: [
            'text-generation',
            'chat-completion',
            'code-generation',
            'text-analysis',
            'todo-analysis',
            'todo-suggestions',
            'user-insights',
            'task-breakdown'
        ]
    });
});

// Rate limit status endpoint
app.get('/api/ai/status', authenticateToken, (req, res) => {
    const today = new Date().toDateString();
    const key = `${req.user.userId}-${today}`;
    const count = requestCounts.get(key) || 0;
    const remaining = Math.max(0, DAILY_LIMIT - count);
    
    res.json({
        userId: req.user.userId,
        date: today,
        requestsUsed: count,
        requestsRemaining: remaining,
        dailyLimit: DAILY_LIMIT,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down AI service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down AI service...');
    process.exit(0);
});

app.listen(port, () => {
    logger.serviceStart(port, [
        'gemini-ai-integration',
        'text-generation',
        'chat-completion',
        'code-generation',
        'text-analysis',
        'jwt-authentication'
    ]);
});
