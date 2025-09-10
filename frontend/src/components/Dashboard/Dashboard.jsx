import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodos } from '../../store/slices/todosSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { healthAPI } from '../../services/api';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { todos } = useSelector((state) => state.todos);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchTodos());
    dispatch(fetchUsers());
    
    // Fetch health data
    const fetchHealth = async () => {
      try {
        const response = await healthAPI.getSystemHealth();
        setHealthData(response);
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      }
    };
    
    fetchHealth();
  }, [dispatch]);

  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = todos.filter(todo => !todo.completed).length;
  const totalUsers = users.length;

  const stats = [
    {
      name: 'Total Todos',
      value: todos.length,
      icon: '✅',
      color: 'bg-blue-500',
    },
    {
      name: 'Completed',
      value: completedTodos,
      icon: '🎯',
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: pendingTodos,
      icon: '⏳',
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Users',
      value: totalUsers,
      icon: '👥',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your microservices today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center text-white text-lg`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      {healthData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              healthData.status === 'OK' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {healthData.status}
            </div>
            <span className="text-sm text-gray-600">
              Last checked: {new Date(healthData.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Recent Todos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Todos</h3>
        {todos.length === 0 ? (
          <p className="text-gray-500">No todos yet. Create your first todo to get started!</p>
        ) : (
          <div className="space-y-3">
            {todos.slice(0, 5).map((todo) => (
              <div key={todo.id} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  todo.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {todo.completed && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${
                  todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}>
                  {todo.task}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/todos'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">✅</div>
            <h4 className="font-medium text-gray-900">Manage Todos</h4>
            <p className="text-sm text-gray-600">View and manage your todo list</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/users'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">👥</div>
            <h4 className="font-medium text-gray-900">View Users</h4>
            <p className="text-sm text-gray-600">Manage user accounts</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/health'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🏥</div>
            <h4 className="font-medium text-gray-900">System Health</h4>
            <p className="text-sm text-gray-600">Monitor service status</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
