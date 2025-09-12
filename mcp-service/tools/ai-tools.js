const axios = require('axios');

class AITools {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3008';
    this.todoServiceUrl = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  }

  async breakdownTask({ taskDescription, userId }) {
    try {
      // Get user's auth token (check stored token first, then generate one)
      let authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        authToken = await this.getUserAuthToken(userId);
      }
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/todos/breakdown`, {
        taskDescription
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Task breakdown completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to breakdown task'
      };
    }
  }

  async analyzeTodosWithAI({ userId }) {
    try {
      let authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        authToken = await this.getUserAuthToken(userId);
      }
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/todos/analyze`, {}, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'AI todo analysis completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to analyze todos with AI'
      };
    }
  }

  async getUserInsights({ userId }) {
    try {
      let authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        authToken = await this.getUserAuthToken(userId);
      }
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/user/insights`, {}, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'User insights generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to get user insights'
      };
    }
  }

  async getTodoSuggestions({ userId }) {
    try {
      let authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        authToken = await this.getUserAuthToken(userId);
      }
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/todos/suggest`, {}, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Todo suggestions generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to get todo suggestions'
      };
    }
  }

  async getRateLimitStatus({ userId }) {
    try {
      let authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        authToken = await this.getUserAuthToken(userId);
      }
      
      const response = await axios.get(`${this.aiServiceUrl}/api/ai/status`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Rate limit status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to get rate limit status'
      };
    }
  }

  async generateText({ prompt, userId }) {
    try {
      const authToken = await this.getUserAuthToken(userId);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/generate`, {
        prompt
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Text generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to generate text'
      };
    }
  }

  async chatWithAI({ message, userId, conversationId }) {
    try {
      const authToken = await this.getUserAuthToken(userId);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/chat`, {
        message,
        conversationId
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Chat response generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to chat with AI'
      };
    }
  }

  async analyzeText({ text, userId, analysisType = 'general' }) {
    try {
      const authToken = await this.getUserAuthToken(userId);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/analyze`, {
        text,
        analysisType
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Text analysis completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to analyze text'
      };
    }
  }

  async generateCode({ description, language, userId }) {
    try {
      const authToken = await this.getUserAuthToken(userId);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/ai/code`, {
        description,
        language
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Code generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to generate code'
      };
    }
  }

  // Helper method to get user auth token
  // This creates a simple token for demo purposes
  async getUserAuthToken(userId) {
    // For demo purposes, create a simple JWT-like token
    // In production, you'd integrate with your actual auth service
    const payload = {
      userId: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Simple base64 encoding for demo (not secure for production)
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `Bearer ${token}`;
  }

  // Method to set auth token for a user
  setUserAuthToken(userId, token) {
    if (!this.userTokens) {
      this.userTokens = new Map();
    }
    this.userTokens.set(userId, token);
  }

  // Method to get stored auth token for a user
  getStoredAuthToken(userId) {
    if (!this.userTokens) {
      this.userTokens = new Map();
    }
    const token = this.userTokens.get(userId);
    if (token && !token.startsWith('Bearer ')) {
      return `Bearer ${token}`;
    }
    return token;
  }

  // Helper method to create todos from AI breakdown
  async createTodosFromBreakdown({ breakdown, userId }) {
    try {
      const todos = [];
      
      if (breakdown && breakdown.breakdown) {
        let jsonText = breakdown.breakdown.trim();
        
        // Clean up the response text
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }
        
        const todoItems = JSON.parse(jsonText);
        
        if (Array.isArray(todoItems)) {
          for (const item of todoItems) {
            const todoResponse = await axios.post(`${this.todoServiceUrl}/todos`, {
              task: `${item.name}: ${item.description}`,
              userId,
              completed: false
            });
            
            todos.push(todoResponse.data);
          }
        }
      }
      
      return {
        success: true,
        data: todos,
        count: todos.length,
        message: `${todos.length} todos created from breakdown`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create todos from breakdown'
      };
    }
  }
}

module.exports = { AITools };
