const axios = require('axios');

class TodoTools {
  constructor() {
    this.todoServiceUrl = process.env.TODO_SERVICE_URL || 'http://localhost:3002';
    this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
    this.userTokens = new Map(); // Will be set by MCP server
  }

  // Helper method to get auth token for a user
  getAuthToken(userId) {
    return this.userTokens.get(userId);
  }

  // Helper method to create demo token
  createDemoToken(userId) {
    const payload = {
      userId: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `Bearer ${token}`;
  }

  async createTodo({ task, userId, completed = false }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.post(`${this.todoServiceUrl}/todos`, {
        task,
        userId,
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
        message: 'Todo created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to create todo'
      };
    }
  }

  async getUserTodos({ userId, completed }) {
    let url = `${this.todoServiceUrl}/todos`;
    
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      // Use the correct endpoint - /todos returns all todos for the authenticated user
      if (completed === true) {
        url = `${this.todoServiceUrl}/todos/completed`;
      } else if (completed === false) {
        url = `${this.todoServiceUrl}/todos/pending`;
      }
      
      const requestConfig = {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };
      
      const response = await axios.get(url, requestConfig);
      
      return {
        success: true,
        data: response.data,
        count: response.data.length,
        message: 'Todos retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve todos',
        debug: {
          url: url,
          status: error.response?.status,
          statusText: error.response?.statusText
        }
      };
    }
  }

  async updateTodo({ todoId, task, completed, userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const updateData = {};
      if (task !== undefined) updateData.task = task;
      if (completed !== undefined) updateData.completed = completed;
      
      const response = await axios.put(`${this.todoServiceUrl}/todos/${todoId}`, updateData, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Todo updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to update todo'
      };
    }
  }

  async deleteTodo({ todoId, userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      await axios.delete(`${this.todoServiceUrl}/todos/${todoId}`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return {
        success: true,
        message: 'Todo deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to delete todo'
      };
    }
  }

  async completeTodo({ todoId, userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.put(`${this.todoServiceUrl}/todos/${todoId}`, {
        completed: true
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Todo marked as completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to complete todo'
      };
    }
  }

  async getTodoById({ todoId, userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.get(`${this.todoServiceUrl}/todos/${todoId}`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Todo retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve todo'
      };
    }
  }
}

module.exports = { TodoTools };
