import React, { useState, useEffect } from 'react';
import { vectorAPI } from '../../services/api';
import { createLogger } from '../../../../logger-service/logger.js';

const logger = createLogger('VectorDashboard');

const VectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [aiContentResults, setAiContentResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [embeddingText, setEmbeddingText] = useState('');
  const [generatedEmbedding, setGeneratedEmbedding] = useState(null);
  const [searchParams, setSearchParams] = useState({
    limit: 100,
    threshold: 0.3,
    includeOthers: false
  });

  // Clear results when switching tabs
  useEffect(() => {
    setSearchResults(null);
    setAiContentResults(null);
    setGeneratedEmbedding(null);
  }, [activeTab]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setAiContentResults(null);
    setGeneratedEmbedding(null);
  };

  const handleTodoSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      logger.info('Performing semantic todo search', { query: searchQuery, searchParams });
      
      const response = await vectorAPI.searchTodos(
        searchQuery, 
        searchParams.limit, 
        searchParams.threshold, 
        searchParams.includeOthers
      );
      
      console.log('Vector Dashboard Search Response:', response); // Debug log
      
      if (response.success) {
        setSearchResults(response.data);
        logger.success('Semantic todo search completed', { 
          resultCount: response.data.totalResults 
        });
        console.log('Search results set:', response.data); // Debug log
      } else {
        logger.error('Semantic todo search failed', { error: response.error });
        console.error('Search failed:', response.error); // Debug log
        alert('Search failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Semantic todo search error', { error: error.message });
      console.error('Search error:', error); // Debug log
      alert('Search failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIContentSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      logger.info('Performing AI content search', { query: searchQuery, searchParams });
      
      const response = await vectorAPI.searchAIContent(
        searchQuery, 
        null, 
        searchParams.limit, 
        searchParams.threshold
      );
      
      if (response.success) {
        setAiContentResults(response.data);
        logger.success('AI content search completed', { 
          resultCount: response.data.totalResults 
        });
      } else {
        logger.error('AI content search failed', { error: response.error });
        alert('Search failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('AI content search error', { error: error.message });
      alert('Search failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEmbedding = async (e) => {
    e.preventDefault();
    if (!embeddingText.trim()) return;

    setIsLoading(true);
    try {
      logger.info('Generating embedding', { textLength: embeddingText.length });
      
      const response = await vectorAPI.generateEmbedding(embeddingText);
      
      if (response.success) {
        setGeneratedEmbedding(response.data);
        logger.success('Embedding generated successfully', { 
          dimensions: response.data.embedding.length 
        });
      } else {
        logger.error('Embedding generation failed', { error: response.error });
        alert('Failed to generate embedding: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Embedding generation error', { error: error.message });
      alert('Failed to generate embedding: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSimilarity = (similarity) => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderTodoSearchResults = () => {
    if (!searchResults) {
      console.log('No search results to render'); // Debug log
      return null;
    }

    console.log('Rendering search results:', searchResults); // Debug log

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Search Results ({searchResults.totalResults} found)
        </h3>
        
        {searchResults.results && searchResults.results.length > 0 ? (
          <div className="space-y-4">
            {searchResults.results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">{result.task}</h4>
                  <span className={`text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                    {formatSimilarity(result.similarity)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Todo ID:</span> {result.todoId}
                </div>
                
                {result.metadata && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Category:</span> {result.metadata.category || 'N/A'}
                    {result.metadata.priority && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium">Priority:</span> {result.metadata.priority}
                      </>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(result.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No results found for your search query.</p>
            <p className="text-sm mt-1">Try different keywords or lower the similarity threshold.</p>
          </div>
        )}
      </div>
    );
  };

  const renderAIContentResults = () => {
    if (!aiContentResults) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          AI Content Results ({aiContentResults.totalResults} found)
        </h3>
        
        {aiContentResults.results && aiContentResults.results.length > 0 ? (
          <div className="space-y-4">
            {aiContentResults.results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">{result.contentType}</h4>
                  <span className={`text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                    {formatSimilarity(result.similarity)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {result.originalText}
                </div>
                
                <div className="text-xs text-gray-400">
                  Created: {new Date(result.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No AI content found for your search query.</p>
          </div>
        )}
      </div>
    );
  };

  const renderEmbeddingResults = () => {
    if (!generatedEmbedding) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generated Embedding</h3>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="font-medium text-gray-700">Dimensions:</span>
              <span className="ml-2 text-gray-600">{generatedEmbedding.embedding.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Model:</span>
              <span className="ml-2 text-gray-600">{generatedEmbedding.model || 'text-embedding-004'}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="font-medium text-gray-700">Original Text:</span>
            <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {embeddingText}
            </p>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Vector Preview (first 10 values):</span>
            <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
              [{generatedEmbedding.embedding.slice(0, 10).map(v => v.toFixed(6)).join(', ')}...]
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vector Dashboard</h1>
        <p className="text-gray-600">
          Semantic search, AI content discovery, and vector embeddings for your todos
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'search', label: 'Todo Search', icon: '🔍' },
            { id: 'ai-content', label: 'AI Content', icon: '🤖' },
            { id: 'embeddings', label: 'Embeddings', icon: '🧮' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <form onSubmit={activeTab === 'embeddings' ? handleGenerateEmbedding : 
                       activeTab === 'ai-content' ? handleAIContentSearch : handleTodoSearch}>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                {activeTab === 'embeddings' ? (
                  <textarea
                    value={embeddingText}
                    onChange={(e) => setEmbeddingText(e.target.value)}
                    placeholder="Enter text to generate embedding for..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                ) : (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === 'ai-content'
                        ? "Search AI-generated content..."
                        : "Search todos semantically (e.g., 'database tasks', 'testing work')"
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading || (!searchQuery.trim() && !embeddingText.trim())}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'embeddings' ? 'Generate' : 'Search'}</span>
                    <span>{activeTab === 'embeddings' ? '🧮' : '🔍'}</span>
                  </>
                )}
              </button>
              
              {(activeTab === 'search' || activeTab === 'ai-content') && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Clear</span>
                  <span>🗑️</span>
                </button>
              )}
            </div>

            {/* Search Parameters - Only show for search and ai-content tabs */}
            {(activeTab === 'search' || activeTab === 'ai-content') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Results
                  </label>
                  <select
                    value={searchParams.limit}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Similarity Threshold
                  </label>
                  <select
                    value={searchParams.threshold}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value={0.5}>50% (Loose)</option>
                    <option value={0.6}>60%</option>
                    <option value={0.7}>70% (Default)</option>
                    <option value={0.8}>80% (Strict)</option>
                    <option value={0.9}>90% (Very Strict)</option>
                  </select>
                </div>

                {activeTab === 'search' && (
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.includeOthers}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, includeOthers: e.target.checked }))}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-700">Include others' todos (anonymized)</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {activeTab === 'search' && renderTodoSearchResults()}
      {activeTab === 'ai-content' && renderAIContentResults()}
      {activeTab === 'embeddings' && renderEmbeddingResults()}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How to use semantic search:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Todo Search:</strong> Find todos by meaning, not exact words (e.g., "database work" finds database-related tasks)</li>
          <li>• <strong>AI Content:</strong> Search through AI-generated content and responses</li>
          <li>• <strong>Embeddings:</strong> Generate vector embeddings for any text to understand how the AI processes it</li>
        </ul>
        
        {(activeTab === 'search' || activeTab === 'ai-content') && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Current Search Settings:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• Max Results: {searchParams.limit}</div>
              <div>• Similarity Threshold: {formatSimilarity(searchParams.threshold)}</div>
              {activeTab === 'search' && (
                <div>• Include Others: {searchParams.includeOthers ? 'Yes' : 'No'}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorDashboard;