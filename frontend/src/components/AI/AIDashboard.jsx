import React, { useState } from 'react';
import TodoAnalysis from './TodoAnalysis';
import TodoSuggestions from './TodoSuggestions';
import UserInsights from './UserInsights';
import TaskBreakdown from './TaskBreakdown';

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState('analysis');

  const tabs = [
    { id: 'analysis', name: 'Todo Analysis', icon: '📊' },
    { id: 'suggestions', name: 'AI Suggestions', icon: '💡' },
    { id: 'insights', name: 'User Insights', icon: '👤' },
    { id: 'breakdown', name: 'Task Breakdown', icon: '🔨' }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'analysis':
        return <TodoAnalysis />;
      case 'suggestions':
        return <TodoSuggestions />;
      case 'insights':
        return <UserInsights />;
      case 'breakdown':
        return <TaskBreakdown />;
      default:
        return <TodoAnalysis />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Assistant
        </h1>
        <p className="mt-2 text-gray-600">
          Get AI-powered insights, suggestions, and coaching to boost your productivity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Active Component */}
      <div className="space-y-6">
        {renderActiveComponent()}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-900">Todo Analysis</div>
            <div className="text-xs text-gray-600">Analyze your productivity patterns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-sm font-medium text-gray-900">Smart Suggestions</div>
            <div className="text-xs text-gray-600">Get personalized todo recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">👤</div>
            <div className="text-sm font-medium text-gray-900">User Insights</div>
            <div className="text-xs text-gray-600">Personalized productivity insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔨</div>
            <div className="text-sm font-medium text-gray-900">Task Breakdown</div>
            <div className="text-xs text-gray-600">Break big tasks into smaller todos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
