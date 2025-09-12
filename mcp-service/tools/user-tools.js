const axios = require('axios');

class UserTools {
  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
  }

  async getUserProfile({ userId }) {
    try {
      const response = await axios.get(`${this.userServiceUrl}/users/${userId}`);
      
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
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      
      const response = await axios.put(`${this.userServiceUrl}/users/${userId}`, updateData);
      
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

  async getAllUsers() {
    try {
      const response = await axios.get(`${this.userServiceUrl}/users`);
      
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

  async createUser({ name, email, role = 'User' }) {
    try {
      const response = await axios.post(`${this.userServiceUrl}/users`, {
        name,
        email,
        role
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

  async deleteUser({ userId }) {
    try {
      await axios.delete(`${this.userServiceUrl}/users/${userId}`);
      
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
      const response = await axios.get(`${this.userServiceUrl}/users/${userId}/stats`);
      
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
