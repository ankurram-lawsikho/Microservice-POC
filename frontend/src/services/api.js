import axios from 'axios';

// API Gateway base URL
const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  
  verify: async () => {
    const response = await api.post('/api/auth/verify');
    return response.data;
  },
  
  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Todos API
export const todosAPI = {
  getAll: async () => {
    const response = await api.get('/todos');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/todos/${id}`);
    return response.data;
  },
  
  create: async (todoData) => {
    const response = await api.post('/todos', todoData);
    return response.data;
  },
  
  update: async (id, todoData) => {
    console.log('API: Updating todo', id, 'with data:', todoData);
    const response = await api.put(`/todos/${id}`, todoData);
    console.log('API: Update response:', response.data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },
  
  getCompleted: async () => {
    const response = await api.get('/todos/completed');
    return response.data;
  },
  
  getPending: async () => {
    const response = await api.get('/todos/pending');
    return response.data;
  }
};

// Health API
export const healthAPI = {
  getSystemHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
  
  getServicesHealth: async () => {
    const response = await api.get('/services/health');
    return response.data;
  }
};

export default api;
