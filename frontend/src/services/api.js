import axios from 'axios';

// API Gateway base URL
const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
//add cors headers
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

// AI API
export const aiAPI = {
  // Core AI features
  generateText: async (prompt, maxTokens = 1000, temperature = 0.7) => {
    const response = await api.post('/api/ai/generate', {
      prompt,
      maxTokens,
      temperature
    });
    return response.data;
  },
  
  chat: async (message, history = []) => {
    const response = await api.post('/api/ai/chat', {
      message,
      history
    });
    return response.data;
  },
  
  generateCode: async (description, language = 'javascript', includeComments = true) => {
    const response = await api.post('/api/ai/code', {
      description,
      language,
      includeComments
    });
    return response.data;
  },
  
  analyzeText: async (text, analysisType = 'sentiment') => {
    const response = await api.post('/api/ai/analyze', {
      text,
      analysisType
    });
    return response.data;
  },
  
  // User & Todo Service Integration
  analyzeTodos: async () => {
    const response = await api.post('/api/ai/todos/analyze');
    return response.data;
  },
  
  getTodoSuggestions: async (context, category, priority = 'medium') => {
    const response = await api.post('/api/ai/todos/suggest', {
      context,
      category,
      priority
    });
    return response.data;
  },
  
  getUserInsights: async () => {
    const response = await api.post('/api/ai/user/insights');
    return response.data;
  },
  
  breakdownTask: async (taskDescription) => {
    const response = await api.post('/api/ai/todos/breakdown', {
      taskDescription
    });
    return response.data;
  }
};

// Vector API
export const vectorAPI = {
  // Semantic todo search
  searchTodos: async (query, limit = 10, threshold = 0.7, includeOthers = false) => {
    const response = await api.post('/api/vector/todos/search', {
      query,
      limit,
      threshold,
      includeOthers
    });
    return response.data;
  },

  // Search AI content
  searchAIContent: async (query, contentType = null, limit = 10, threshold = 0.7) => {
    const response = await api.post('/api/vector/ai-content/search', {
      query,
      contentType,
      limit,
      threshold
    });
    return response.data;
  },

  // Generate embedding
  generateEmbedding: async (text) => {
    const response = await api.post('/api/vector/embedding/generate', {
      text
    });
    return response.data;
  },

  // Store todo embedding
  storeTodoEmbedding: async (todoId, task, completed) => {
    const response = await api.post('/api/vector/todos/embed', {
      todoId,
      task,
      completed
    });
    return response.data;
  },

  // Store AI content embedding
  storeAIContentEmbedding: async (contentType, originalText, metadata = {}) => {
    const response = await api.post('/api/vector/ai-content/embed', {
      contentType,
      originalText,
      metadata
    });
    return response.data;
  },

  // Store user profile embedding
  storeUserProfileEmbedding: async (name, email, role = 'user', metadata = {}) => {
    const response = await api.post('/api/vector/user-profile/embed', {
      name,
      email,
      role,
      metadata
    });
    return response.data;
  },

  // Get vector service health
  getVectorHealth: async () => {
    const response = await api.get('/api/vector/health');
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
