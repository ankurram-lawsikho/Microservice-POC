import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { todosAPI } from '../../services/api';

// Async thunks
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await todosAPI.getAll();
      console.log('Redux: Fetched todos:', response);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch todos');
    }
  }
);

export const fetchTodoById = createAsyncThunk(
  'todos/fetchTodoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await todosAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch todo');
    }
  }
);

export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async (todoData, { rejectWithValue }) => {
    try {
      const response = await todosAPI.create(todoData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create todo');
    }
  }
);

export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, todoData }, { rejectWithValue }) => {
    try {
      const response = await todosAPI.update(id, todoData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update todo');
    }
  }
);

export const deleteTodo = createAsyncThunk(
  'todos/deleteTodo',
  async (id, { rejectWithValue }) => {
    try {
      await todosAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete todo');
    }
  }
);

export const fetchCompletedTodos = createAsyncThunk(
  'todos/fetchCompletedTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await todosAPI.getCompleted();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch completed todos');
    }
  }
);

export const fetchPendingTodos = createAsyncThunk(
  'todos/fetchPendingTodos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await todosAPI.getPending();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending todos');
    }
  }
);

const initialState = {
  todos: [],
  completedTodos: [],
  pendingTodos: [],
  currentTodo: null,
  loading: false,
  error: null,
  filter: 'all', // 'all', 'completed', 'pending'
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTodo: (state) => {
      state.currentTodo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
        console.log('Redux: Fetched todos, count:', action.payload.length);
        console.log('Redux: Todo IDs:', action.payload.map(t => t.id));
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch todo by ID
      .addCase(fetchTodoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodoById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTodo = action.payload;
      })
      .addCase(fetchTodoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create todo
      .addCase(createTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update todo
      .addCase(updateTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Redux: UpdateTodo fulfilled, payload:', action.payload);
        console.log('Redux: Current todos before update:', state.todos.map(t => ({ id: t.id, task: t.task, completed: t.completed })));
        
        const index = state.todos.findIndex(todo => todo.id === action.payload.id);
        console.log('Redux: Found todo at index:', index);
        
        if (index !== -1) {
          state.todos[index] = action.payload;
          console.log('Redux: Updated todo in state:', state.todos[index]);
        } else {
          console.log('Redux: Todo not found in state, ID:', action.payload.id);
        }
        
        if (state.currentTodo && state.currentTodo.id === action.payload.id) {
          state.currentTodo = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete todo
      .addCase(deleteTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = state.todos.filter(todo => todo.id !== action.payload);
        if (state.currentTodo && state.currentTodo.id === action.payload) {
          state.currentTodo = null;
        }
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch completed todos
      .addCase(fetchCompletedTodos.fulfilled, (state, action) => {
        state.completedTodos = action.payload;
      })
      // Fetch pending todos
      .addCase(fetchPendingTodos.fulfilled, (state, action) => {
        state.pendingTodos = action.payload;
      });
  },
});

export const { setFilter, clearError, clearCurrentTodo } = todosSlice.actions;
export default todosSlice.reducer;
