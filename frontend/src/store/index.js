import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import usersSlice from './slices/usersSlice';
import todosSlice from './slices/todosSlice';
import uiSlice from './slices/uiSlice';
import aiSlice from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    users: usersSlice,
    todos: todosSlice,
    ui: uiSlice,
    ai: aiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
