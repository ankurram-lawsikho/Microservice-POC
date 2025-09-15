import React, { useState } from 'react';
import { vectorAPI } from '../../services/api';
import { createLogger } from '../../../../logger-service/logger.js';

const logger = createLogger('SemanticSearch');

const SemanticSearch = ({ onSearchResults, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchParams, setSearchParams] = useState({
    limit: 10,
    threshold: 0.7,
    includeOthers: false
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      logger.info('Performing semantic search', { query, searchParams });
      
      const response = await vectorAPI.searchTodos(
        query,
        searchParams.limit,
        searchParams.threshold,
        searchParams.includeOthers
      );

      if (response.success) {
        setSearchResults(response.data);
        onSearchResults?.(response.data);
        logger.success('Semantic search completed', { 
          resultCount: response.data.totalResults 
        });
      } else {
        logger.error('Semantic search failed', { error: response.error });
        alert('Search failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Semantic search error', { error: error.message });
      alert('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults(null);
    onSearchResults?.(null);
  };

  const formatSimilarity = (similarity) => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Smart Todo Search</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Search your todos using natural language. Find tasks by meaning, not just keywords.
          </p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'financial planning tasks', 'work related items', 'things to buy'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSearching}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Results
                </label>
                <select
                  value={searchParams.limit}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                >
                  <option value={0.5}>50% (Loose)</option>
                  <option value={0.6}>60%</option>
                  <option value={0.7}>70% (Default)</option>
                  <option value={0.8}>80% (Strict)</option>
                  <option value={0.9}>90% (Very Strict)</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchParams.includeOthers}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, includeOthers: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include others' todos (anonymized)</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {searchResults && (
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Search Results ({searchResults.totalResults} found)
              </h3>
              <div className="text-sm text-gray-500">
                Query: "{searchResults.query}"
              </div>
            </div>

            {searchResults.results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No similar todos found.</p>
                <p className="text-sm mt-2">Try adjusting your search query or lowering the similarity threshold.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.results.map((result, index) => (
                  <div
                    key={result.todoId || index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">
                          {result.task}
                        </h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`font-medium ${getSimilarityColor(result.similarity)}`}>
                            {formatSimilarity(result.similarity)} similar
                          </span>
                          
                          {result.metadata?.completed !== undefined && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              result.metadata.completed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.metadata.completed ? 'Completed' : 'Pending'}
                            </span>
                          )}
                          
                          {result.metadata?.anonymized && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              From other users
                            </span>
                          )}
                          
                          <span>
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        <div>Distance: {result.distance?.toFixed(3)}</div>
                        {result.userId && !result.metadata?.anonymized && (
                          <div>Your todo</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Search Parameters Used:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Max Results: {searchResults.searchParams.limit}</div>
                <div>• Similarity Threshold: {formatSimilarity(searchResults.searchParams.threshold)}</div>
                <div>• Include Others: {searchResults.searchParams.includeOthers ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticSearch;
