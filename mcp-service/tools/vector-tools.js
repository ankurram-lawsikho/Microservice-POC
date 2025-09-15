const axios = require('axios');

class VectorTools {
  constructor() {
    this.vectorServiceUrl = process.env.VECTOR_SERVICE_URL || 'http://localhost:3010';
  }

  async searchSimilarTodos({ query, userId, limit = 10, threshold = 0.7, includeOthers = false }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/todos/search`, {
        query,
        limit,
        threshold,
        includeOthers
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Semantic todo search completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to perform semantic todo search'
      };
    }
  }

  async searchAIContent({ query, userId, contentType = null, limit = 10, threshold = 0.7 }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/ai-content/search`, {
        query,
        contentType,
        limit,
        threshold
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'AI content search completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to search AI content'
      };
    }
  }

  async getContextualSuggestions({ userId, context, limit = 5 }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/suggestions/contextual`, {
        context,
        limit
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Contextual suggestions generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to get contextual suggestions'
      };
    }
  }

  async generateEmbedding({ text, userId }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/embedding/generate`, {
        text
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Embedding generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to generate embedding'
      };
    }
  }

  async storeTodoEmbedding({ todoId, task, completed, userId }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/todos/embed`, {
        todoId,
        task,
        completed
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Todo embedding stored successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to store todo embedding'
      };
    }
  }

  async storeAIContentEmbedding({ userId, contentType, originalText, metadata = {} }) {
    try {
      const authToken = this.getStoredAuthToken(userId);
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
          message: 'Please set authentication token first using set_auth_token tool'
        };
      }
      
      const response = await axios.post(`${this.vectorServiceUrl}/api/vector/ai-content/embed`, {
        contentType,
        originalText,
        metadata
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'AI content embedding stored successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to store AI content embedding'
      };
    }
  }

  async getVectorServiceHealth() {
    try {
      const response = await axios.get(`${this.vectorServiceUrl}/api/health`);
      
      return {
        success: true,
        data: response.data,
        message: 'Vector service health check completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Vector service health check failed'
      };
    }
  }

  // Helper method to get stored auth token for a user
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
}

module.exports = { VectorTools };
