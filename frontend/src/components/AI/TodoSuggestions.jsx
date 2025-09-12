import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTodoSuggestions, clearTodoSuggestions } from '../../store/slices/aiSlice';
import MarkdownRenderer from './MarkdownRenderer';

const TodoSuggestions = () => {
  const dispatch = useDispatch();
  const { todoSuggestions, loading, error } = useSelector((state) => state.ai);
  
  const [formData, setFormData] = useState({
    context: '',
    category: 'general',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.context.trim()) {
      dispatch(getTodoSuggestions(formData));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'health', label: 'Health' },
    { value: 'learning', label: 'Learning' },
    { value: 'finance', label: 'Finance' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Todo Suggestions
        </h3>
        {todoSuggestions && (
          <button
            onClick={() => dispatch(clearTodoSuggestions())}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            What are you working on?
          </label>
          <input
            type="text"
            id="context"
            name="context"
            value={formData.context}
            onChange={handleInputChange}
            placeholder="e.g., Working on a project deadline, planning a vacation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading.getTodoSuggestions || !formData.context.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.getTodoSuggestions ? 'Getting Suggestions...' : 'Get AI Suggestions'}
        </button>
      </form>

      {/* Loading State */}
      {loading.getTodoSuggestions && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Generating suggestions...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {todoSuggestions && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">AI Suggestions</h4>
          <MarkdownRenderer content={todoSuggestions.suggestions} />
          <div className="mt-4 text-xs text-gray-500">
            Context: {todoSuggestions.context} | Category: {todoSuggestions.category} | Priority: {todoSuggestions.priority}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoSuggestions;
