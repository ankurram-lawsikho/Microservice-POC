import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import TodoList from './components/Todos/TodoList';
import UserList from './components/Users/UserList';
import HealthDashboard from './components/Health/HealthDashboard';
import AIDashboard from './components/AI/AIDashboard';
import VectorDashboard from './components/Vector/VectorDashboard';
import VectorAnalytics from './components/Vector/VectorAnalytics';
import VectorHealth from './components/Vector/VectorHealth';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/todos" element={
              <ProtectedRoute>
                <Layout>
                  <TodoList />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <UserList />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/health" element={
              <ProtectedRoute>
                <Layout>
                  <HealthDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/ai" element={
              <ProtectedRoute>
                <Layout>
                  <AIDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/vector" element={
              <ProtectedRoute>
                <Layout>
                  <VectorDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/vector/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <VectorAnalytics />
                </Layout>
              </ProtectedRoute>
            } />
            
            
            <Route path="/vector/health" element={
              <ProtectedRoute>
                <Layout>
                  <VectorHealth />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;