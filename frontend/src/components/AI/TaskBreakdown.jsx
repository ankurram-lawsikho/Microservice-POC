import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { breakdownTask, clearTaskBreakdown } from '../../store/slices/aiSlice';
import { createTodo } from '../../store/slices/todosSlice';
import MarkdownRenderer from './MarkdownRenderer';

const TaskBreakdown = ({ onBreakdown }) => {
  const dispatch = useDispatch();
  const { taskBreakdown, loading, error } = useSelector((state) => state.ai);
  
  const [taskDescription, setTaskDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskDescription.trim()) {
      dispatch(breakdownTask(taskDescription));
    }
  };

  const handleCreateTodos = () => {
    if (taskBreakdown && taskBreakdown.breakdown) {
      try {
        // Clean up the response text to extract JSON
        let jsonText = taskBreakdown.breakdown.trim();
        
        // Remove any markdown formatting or extra text
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }
        
        // Parse the JSON breakdown
        const todos = JSON.parse(jsonText);
        
        if (!Array.isArray(todos)) {
          throw new Error('Invalid response format');
        }
        
        // Create todos one by one
        todos.forEach((todo, index) => {
          setTimeout(() => {
            dispatch(createTodo({
              task: `${todo.name}: ${todo.description}`,
              completed: false
            }));
          }, index * 200); // Small delay between creations
        });
        
        // Clear the breakdown and close modal after a short delay
        setTimeout(() => {
          dispatch(clearTaskBreakdown());
          setTaskDescription('');
          if (onBreakdown) {
            onBreakdown();
          }
        }, todos.length * 200 + 500);
        
      } catch (error) {
        console.error('Failed to parse breakdown:', error);
        alert('Failed to create todos. Please try again.');
      }
    }
  };

  const exampleTasks = [
    "Plan and organize a company team building event",
    "Develop a new mobile app for task management",
    "Renovate the kitchen in my house",
    "Learn a new programming language",
    "Plan a vacation to Europe",
    "Start a small business selling handmade crafts"
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          AI Task Breakdown
        </h3>
        {taskBreakdown && (
          <button
            onClick={() => dispatch(clearTaskBreakdown())}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your big task or project
          </label>
          <textarea
            id="taskDescription"
            name="taskDescription"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="e.g., Plan and organize a company team building event, Develop a new mobile app, Renovate my kitchen..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Example Tasks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Examples:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleTasks.map((task, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setTaskDescription(task)}
                className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded-md transition-colors"
              >
                {task}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading.breakdownTask || !taskDescription.trim()}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.breakdownTask ? 'Breaking down task...' : 'Break Down Task with AI'}
        </button>
      </form>

      {/* Loading State */}
      {loading.breakdownTask && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Analyzing your task...</span>
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

      {/* Breakdown Results */}
      {taskBreakdown && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">AI Task Breakdown</h4>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Original Task:</strong> {taskBreakdown.originalTask}
            </p>
          </div>
          
          <div className="mb-4">
            {(() => {
              try {
                // Clean up the response text to extract JSON
                let jsonText = taskBreakdown.breakdown.trim();
                
                // Remove any markdown formatting or extra text
                if (jsonText.includes('```json')) {
                  jsonText = jsonText.split('```json')[1].split('```')[0].trim();
                } else if (jsonText.includes('```')) {
                  jsonText = jsonText.split('```')[1].split('```')[0].trim();
                }
                
                // Parse the JSON breakdown
                const todos = JSON.parse(jsonText);
                
                if (Array.isArray(todos)) {
                  return (
                    <div className="space-y-3">
                      {todos.map((todo, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                              <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{todo.name}</h4>
                              <p className="text-gray-600 leading-relaxed">{todo.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Fallback to markdown renderer if parsing fails
                  return <MarkdownRenderer content={taskBreakdown.breakdown} />;
                }
              } catch (error) {
                // Fallback to markdown renderer if parsing fails
                return <MarkdownRenderer content={taskBreakdown.breakdown} />;
              }
            })()}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCreateTodos}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Create All Todos
            </button>
            <button
              onClick={() => {
                dispatch(clearTaskBreakdown());
                setTaskDescription('');
              }}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBreakdown;
