import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiAPI } from '../../services/api';

// Async thunks for AI operations
export const generateText = createAsyncThunk(
  'ai/generateText',
  async ({ prompt, maxTokens = 1000, temperature = 0.7 }, { rejectWithValue }) => {
    try {
      const response = await aiAPI.generateText(prompt, maxTokens, temperature);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate text');
    }
  }
);

export const chatWithAI = createAsyncThunk(
  'ai/chatWithAI',
  async ({ message, history = [] }, { rejectWithValue }) => {
    try {
      const response = await aiAPI.chat(message, history);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to chat with AI');
    }
  }
);

export const generateCode = createAsyncThunk(
  'ai/generateCode',
  async ({ description, language = 'javascript', includeComments = true }, { rejectWithValue }) => {
    try {
      const response = await aiAPI.generateCode(description, language, includeComments);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate code');
    }
  }
);

export const analyzeText = createAsyncThunk(
  'ai/analyzeText',
  async ({ text, analysisType = 'sentiment' }, { rejectWithValue }) => {
    try {
      const response = await aiAPI.analyzeText(text, analysisType);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to analyze text');
    }
  }
);

// User & Todo Service Integration thunks
export const analyzeTodos = createAsyncThunk(
  'ai/analyzeTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.analyzeTodos();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to analyze todos');
    }
  }
);

export const getTodoSuggestions = createAsyncThunk(
  'ai/getTodoSuggestions',
  async ({ context, category, priority = 'medium' }, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getTodoSuggestions(context, category, priority);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get todo suggestions');
    }
  }
);

export const getUserInsights = createAsyncThunk(
  'ai/getUserInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getUserInsights();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get user insights');
    }
  }
);

export const breakdownTask = createAsyncThunk(
  'ai/breakdownTask',
  async (taskDescription, { rejectWithValue }) => {
    try {
      const response = await aiAPI.breakdownTask(taskDescription);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to breakdown task');
    }
  }
);

const initialState = {
  // Core AI features
  generatedText: '',
  chatHistory: [],
  generatedCode: '',
  textAnalysis: '',
  
  // User & Todo Service Integration
  todoAnalysis: null,
  todoSuggestions: null,
  userInsights: null,
  taskBreakdown: null,
  
  // UI state
  loading: {
    generateText: false,
    chat: false,
    generateCode: false,
    analyzeText: false,
    analyzeTodos: false,
    getTodoSuggestions: false,
    getUserInsights: false,
    breakdownTask: false
  },
  
  error: null
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGeneratedText: (state) => {
      state.generatedText = '';
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
    },
    clearGeneratedCode: (state) => {
      state.generatedCode = '';
    },
    clearTextAnalysis: (state) => {
      state.textAnalysis = '';
    },
    clearTodoAnalysis: (state) => {
      state.todoAnalysis = null;
    },
    clearTodoSuggestions: (state) => {
      state.todoSuggestions = null;
    },
    clearUserInsights: (state) => {
      state.userInsights = null;
    },
    clearTaskBreakdown: (state) => {
      state.taskBreakdown = null;
    },
    addToChatHistory: (state, action) => {
      state.chatHistory.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate Text
      .addCase(generateText.pending, (state) => {
        state.loading.generateText = true;
        state.error = null;
      })
      .addCase(generateText.fulfilled, (state, action) => {
        state.loading.generateText = false;
        state.generatedText = action.payload.generatedText;
      })
      .addCase(generateText.rejected, (state, action) => {
        state.loading.generateText = false;
        state.error = action.payload;
      })
      
      // Chat with AI
      .addCase(chatWithAI.pending, (state) => {
        state.loading.chat = true;
        state.error = null;
      })
      .addCase(chatWithAI.fulfilled, (state, action) => {
        state.loading.chat = false;
        state.chatHistory.push(
          { role: 'user', content: action.payload.metadata?.messageLength ? 'User message' : 'User' },
          { role: 'assistant', content: action.payload.reply }
        );
      })
      .addCase(chatWithAI.rejected, (state, action) => {
        state.loading.chat = false;
        state.error = action.payload;
      })
      
      // Generate Code
      .addCase(generateCode.pending, (state) => {
        state.loading.generateCode = true;
        state.error = null;
      })
      .addCase(generateCode.fulfilled, (state, action) => {
        state.loading.generateCode = false;
        state.generatedCode = action.payload.code;
      })
      .addCase(generateCode.rejected, (state, action) => {
        state.loading.generateCode = false;
        state.error = action.payload;
      })
      
      // Analyze Text
      .addCase(analyzeText.pending, (state) => {
        state.loading.analyzeText = true;
        state.error = null;
      })
      .addCase(analyzeText.fulfilled, (state, action) => {
        state.loading.analyzeText = false;
        state.textAnalysis = action.payload.analysis;
      })
      .addCase(analyzeText.rejected, (state, action) => {
        state.loading.analyzeText = false;
        state.error = action.payload;
      })
      
      // Analyze Todos
      .addCase(analyzeTodos.pending, (state) => {
        state.loading.analyzeTodos = true;
        state.error = null;
      })
      .addCase(analyzeTodos.fulfilled, (state, action) => {
        state.loading.analyzeTodos = false;
        state.todoAnalysis = action.payload;
      })
      .addCase(analyzeTodos.rejected, (state, action) => {
        state.loading.analyzeTodos = false;
        state.error = action.payload;
      })
      
      // Get Todo Suggestions
      .addCase(getTodoSuggestions.pending, (state) => {
        state.loading.getTodoSuggestions = true;
        state.error = null;
      })
      .addCase(getTodoSuggestions.fulfilled, (state, action) => {
        state.loading.getTodoSuggestions = false;
        state.todoSuggestions = action.payload;
      })
      .addCase(getTodoSuggestions.rejected, (state, action) => {
        state.loading.getTodoSuggestions = false;
        state.error = action.payload;
      })
      
      // Get User Insights
      .addCase(getUserInsights.pending, (state) => {
        state.loading.getUserInsights = true;
        state.error = null;
      })
      .addCase(getUserInsights.fulfilled, (state, action) => {
        state.loading.getUserInsights = false;
        state.userInsights = action.payload;
      })
      .addCase(getUserInsights.rejected, (state, action) => {
        state.loading.getUserInsights = false;
        state.error = action.payload;
      })
      
      // Breakdown Task
      .addCase(breakdownTask.pending, (state) => {
        state.loading.breakdownTask = true;
        state.error = null;
      })
      .addCase(breakdownTask.fulfilled, (state, action) => {
        state.loading.breakdownTask = false;
        state.taskBreakdown = action.payload;
      })
      .addCase(breakdownTask.rejected, (state, action) => {
        state.loading.breakdownTask = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  clearGeneratedText,
  clearChatHistory,
  clearGeneratedCode,
  clearTextAnalysis,
  clearTodoAnalysis,
  clearTodoSuggestions,
  clearUserInsights,
  clearTaskBreakdown,
  addToChatHistory
} = aiSlice.actions;

export default aiSlice.reducer;
