import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTodos,
  deleteTodo,
  updateTodo,
  setFilter,
  clearError,
} from '../../store/slices/todosSlice';
import { createTodo } from '../../store/slices/todosSlice';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import TaskBreakdown from '../AI/TaskBreakdown';

const TodoList = () => {
  const dispatch = useDispatch();
  const { todos, loading, error, filter } = useSelector((state) => state.todos);
  const [showForm, setShowForm] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      dispatch(deleteTodo(id));
    }
  };

  const handleToggleComplete = async (todo) => {
    console.log('Toggling todo completion:', { id: todo.id, completed: !todo.completed, task: todo.task });
    console.log('Current user token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('Current user data:', localStorage.getItem('user'));
    dispatch(updateTodo({
      id: todo.id,
      todoData: { 
        completed: !todo.completed,
        task: todo.task  // Preserve current task text
      }
    }));
  };

  const handleBreakdown = () => {
    setShowBreakdown(false);
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'completed':
        return todo.completed;
      case 'pending':
        return !todo.completed;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Todo Management</h2>
        <div className="flex space-x-2">
        <button
          onClick={() => setShowBreakdown(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          AI Task Breakdown
        </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Todo
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
          <button
            onClick={() => dispatch(clearError())}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => dispatch(setFilter('all'))}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => dispatch(setFilter('pending'))}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({todos.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => dispatch(setFilter('completed'))}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed ({todos.filter(t => t.completed).length})
        </button>
      </div>

      {/* Todo Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <TodoForm
              onClose={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* AI Task Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <TaskBreakdown
              onBreakdown={handleBreakdown}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowBreakdown(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Todo List */}
      <div className="bg-white shadow rounded-lg">
        {filteredTodos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No todos found</p>
            <p className="text-sm mt-2">
              {filter === 'all' 
                ? 'Create your first todo to get started!'
                : `No ${filter} todos found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
