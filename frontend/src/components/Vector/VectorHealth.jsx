import React, { useState, useEffect } from 'react';
import { vectorAPI } from '../../services/api';
// Removed logger import - not needed in frontend

const VectorHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    fetchHealthData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      console.log('Fetching vector service health data');
      const response = await vectorAPI.getVectorHealth();
      setHealthData(response);
      setError(null);
      setLastChecked(new Date());
      console.log('Vector health data fetched successfully', { 
        status: response.status 
      });
    } catch (error) {
      console.error('Failed to fetch vector health data:', error.message);
      setError(error.message);
      setLastChecked(new Date());
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
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (bytes) => {
    return `${bytes} MB`;
  };

  if (isLoading && !healthData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Vector Service Health</h1>
            <p className="text-gray-600">
              Real-time health monitoring for the vector service
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchHealthData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {lastChecked && (
          <p className="text-sm text-gray-500 mt-2">
            Last checked: {lastChecked.toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <div>
              <p className="font-medium">Failed to fetch health data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {healthData && (
        <>
          {/* Overall Status */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">{getStatusIcon(healthData.status)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Vector Service Status
                  </h2>
                  <p className="text-gray-600">
                    {healthData.service} v{healthData.version}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
                  {healthData.status}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Uptime: {formatUptime(healthData.uptime)}
                </p>
              </div>
            </div>
          </div>

          {/* Service Checks */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(healthData.checks).map(([checkName, checkData]) => (
                <div key={checkName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 capitalize">
                      {checkName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checkData.status)}`}>
                      {getStatusIcon(checkData.status)} {checkData.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {checkData.type && (
                      <div><span className="font-medium">Type:</span> {checkData.type}</div>
                    )}
                    {checkData.responseTime && (
                      <div><span className="font-medium">Response Time:</span> {checkData.responseTime}</div>
                    )}
                    {checkData.model && (
                      <div><span className="font-medium">Model:</span> {checkData.model}</div>
                    )}
                    {checkData.dimension && (
                      <div><span className="font-medium">Dimension:</span> {checkData.dimension}</div>
                    )}
                    {checkData.installed !== undefined && (
                      <div><span className="font-medium">Installed:</span> {checkData.installed ? 'Yes' : 'No'}</div>
                    )}
                    {checkData.message && (
                      <div><span className="font-medium">Message:</span> {checkData.message}</div>
                    )}
                    {checkData.error && (
                      <div className="text-red-600"><span className="font-medium">Error:</span> {checkData.error}</div>
                    )}
                    {checkData.connectionPool && (
                      <div>
                        <span className="font-medium">Connection Pool:</span>
                        <div className="ml-2 text-xs">
                          <div>Active: {checkData.connectionPool.active}</div>
                          <div>Idle: {checkData.connectionPool.idle}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          {healthData.checks.dependencies && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dependencies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(healthData.checks.dependencies).map(([serviceName, serviceData]) => (
                  <div key={serviceName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 capitalize">
                        {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(serviceData.status)}`}>
                        {getStatusIcon(serviceData.status)} {serviceData.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div><span className="font-medium">URL:</span> {serviceData.url}</div>
                      {serviceData.responseStatus && (
                        <div><span className="font-medium">Status:</span> {serviceData.responseStatus}</div>
                      )}
                      {serviceData.error && (
                        <div className="text-red-600"><span className="font-medium">Error:</span> {serviceData.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Metrics */}
          {healthData.metrics && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Memory Usage */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-3">Memory Usage</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-medium">{formatMemory(healthData.metrics.memory.used)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{formatMemory(healthData.metrics.memory.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>External:</span>
                      <span className="font-medium">{formatMemory(healthData.metrics.memory.external)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(healthData.metrics.memory.used / healthData.metrics.memory.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* CPU Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-3">CPU Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-medium">{healthData.metrics.cpu.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Architecture:</span>
                      <span className="font-medium">{healthData.metrics.cpu.arch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Time:</span>
                      <span className="font-medium">{Math.round(healthData.metrics.cpu.usage.user / 1000)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Time:</span>
                      <span className="font-medium">{Math.round(healthData.metrics.cpu.usage.system / 1000)}ms</span>
                    </div>
                  </div>
                </div>

                {/* Node Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-3">Node.js Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-medium">{healthData.metrics.node.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Process ID:</span>
                      <span className="font-medium">{healthData.metrics.node.pid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-medium">{formatUptime(healthData.uptime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Features</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2">
                {healthData.features.map((feature, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            Health data collected at: {new Date(healthData.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default VectorHealth;
