const axios = require('axios');

class UserTools {
  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
    this.userTokens = new Map(); // Will be set by MCP server
  }

  // Helper method to get auth token for a user
  getAuthToken(userId) {
    const token = this.userTokens.get(userId);
    if (token && !token.startsWith('Bearer ')) {
      return `Bearer ${token}`;
    }
    return token;
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

  async getUserProfile({ userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.get(`${this.userServiceUrl}/users/${userId}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'User profile retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve user profile'
      };
    }
  }

  async updateUserProfile({ userId, name, email, role }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      
      const response = await axios.put(`${this.userServiceUrl}/users/${userId}`, updateData, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'User profile updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to update user profile'
      };
    }
  }

  async getAllUsers({ userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.get(`${this.userServiceUrl}/users`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        count: response.data.length,
        message: 'All users retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve users'
      };
    }
  }

  async createUser({ name, email, role = 'User', userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.post(`${this.userServiceUrl}/users`, {
        name,
        email,
        role
      }, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'User created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to create user'
      };
    }
  }

  async deleteUser({ userId, adminUserId }) {
    try {
      // Get auth token for admin user
      let authToken = this.getAuthToken(adminUserId);
      if (!authToken) {
        authToken = this.createDemoToken(adminUserId);
      }

      await axios.delete(`${this.userServiceUrl}/users/${userId}`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to delete user'
      };
    }
  }

  async getUserStats({ userId }) {
    try {
      // Get auth token for user
      let authToken = this.getAuthToken(userId);
      if (!authToken) {
        authToken = this.createDemoToken(userId);
      }

      const response = await axios.get(`${this.userServiceUrl}/users/${userId}/stats`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: 'User statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Failed to retrieve user statistics'
      };
    }
  }
}

module.exports = { UserTools };
