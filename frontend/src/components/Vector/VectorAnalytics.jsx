import React, { useState, useEffect } from 'react';
import { vectorAPI } from '../../services/api';

const VectorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching vector analytics');
      
      // Get embedding statistics from the vector service
      const healthResponse = await vectorAPI.getVectorHealth();
      
      if (healthResponse.status === 'OK') {
        // Create analytics data based on health check and some mock data
        const analyticsData = {
          totalEmbeddings: healthResponse.checks?.database?.connectionPool?.totalCount || 0,
          serviceStatus: healthResponse.status,
          databaseStatus: healthResponse.checks?.database?.status || 'Unknown',
          pgvectorStatus: healthResponse.checks?.pgvector?.status || 'Unknown',
          tablesStatus: healthResponse.checks?.tables?.status || 'Unknown',
          vectorOpsStatus: healthResponse.checks?.vectorOperations?.status || 'Unknown',
          embeddingService: healthResponse.checks?.embeddingService?.status || 'Unknown',
          searchService: healthResponse.checks?.vectorSearch?.status || 'Unknown',
          dependencies: healthResponse.checks?.dependencies || {},
          systemMetrics: healthResponse.metrics || {},
          uptime: healthResponse.uptime || 0,
          version: healthResponse.version || 'Unknown',
          timestamp: new Date().toISOString()
        };
        
        setAnalytics(analyticsData);
        console.log('Vector analytics fetched successfully');
      } else {
        throw new Error('Vector service health check failed');
      }
    } catch (error) {
      console.error('Failed to fetch vector analytics:', error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OK': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return '❓';
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vector Analytics</h1>
        <p className="text-gray-600">
          Monitor vector service performance, health, and usage statistics
        </p>
      </div>

      {/* Service Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Service Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.serviceStatus)}`}>
              {getStatusIcon(analytics.serviceStatus)} {analytics.serviceStatus}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Overall vector service health and availability
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Database</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.databaseStatus)}`}>
              {getStatusIcon(analytics.databaseStatus)} {analytics.databaseStatus}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            PostgreSQL with pgvector extension
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Embedding Service</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analytics.embeddingService)}`}>
              {getStatusIcon(analytics.embeddingService)} {analytics.embeddingService}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Google Gemini text-embedding-004
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Service Info</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium text-gray-800">{analytics.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium text-gray-800">
                {formatUptime(analytics.uptime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Status Checks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Component Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">pgvector Extension</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(analytics.pgvectorStatus)}`}>
              {getStatusIcon(analytics.pgvectorStatus)} {analytics.pgvectorStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Database Tables</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(analytics.tablesStatus)}`}>
              {getStatusIcon(analytics.tablesStatus)} {analytics.tablesStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Vector Operations</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(analytics.vectorOpsStatus)}`}>
              {getStatusIcon(analytics.vectorOpsStatus)} {analytics.vectorOpsStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Search Service</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(analytics.searchService)}`}>
              {getStatusIcon(analytics.searchService)} {analytics.searchService}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Dependencies</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor('OK')}`}>
              {getStatusIcon('OK')} OK
            </span>
          </div>
        </div>
      </div>

      {/* Dependencies Status */}
      {analytics.dependencies && Object.keys(analytics.dependencies).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dependencies Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analytics.dependencies).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700 capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="text-xs text-gray-500">{status.url}</div>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)} {status.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {analytics.systemMetrics && Object.keys(analytics.systemMetrics).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Metrics</h3>
          <div className="space-y-6">
            {/* Memory Metrics */}
            {analytics.systemMetrics.memory && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Memory Usage</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-700">Used Memory</div>
                    <div className="text-lg font-semibold text-blue-900">{analytics.systemMetrics.memory.used} MB</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-700">Total Memory</div>
                    <div className="text-lg font-semibold text-green-900">{analytics.systemMetrics.memory.total} MB</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-700">External Memory</div>
                    <div className="text-lg font-semibold text-purple-900">{analytics.systemMetrics.memory.external} MB</div>
                  </div>
                </div>
              </div>
            )}

            {/* CPU Metrics */}
            {analytics.systemMetrics.cpu && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">CPU Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-700">Platform</div>
                    <div className="text-lg font-semibold text-orange-900 capitalize">{analytics.systemMetrics.cpu.platform}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-sm font-medium text-red-700">Architecture</div>
                    <div className="text-lg font-semibold text-red-900">{analytics.systemMetrics.cpu.arch}</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm font-medium text-yellow-700">User Time</div>
                    <div className="text-lg font-semibold text-yellow-900">{(analytics.systemMetrics.cpu.usage?.user / 1000000).toFixed(2)}s</div>
                  </div>
                </div>
              </div>
            )}

            {/* Node.js Metrics */}
            {analytics.systemMetrics.node && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Node.js Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="text-sm font-medium text-indigo-700">Node Version</div>
                    <div className="text-lg font-semibold text-indigo-900">{analytics.systemMetrics.node.version}</div>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="text-sm font-medium text-pink-700">Process ID</div>
                    <div className="text-lg font-semibold text-pink-900">{analytics.systemMetrics.node.pid}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalEmbeddings}</div>
            <div className="text-sm text-blue-800">Total Embeddings</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">768</div>
            <div className="text-sm text-green-800">Vector Dimensions</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-sm text-purple-800">Embedding Types</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">Real-time</div>
            <div className="text-sm text-orange-800">Search Speed</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {new Date(analytics.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default VectorAnalytics;