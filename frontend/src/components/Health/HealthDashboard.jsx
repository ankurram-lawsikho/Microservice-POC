import React, { useEffect, useState } from 'react';
import { healthAPI } from '../../services/api';

const HealthDashboard = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [servicesHealth, setServicesHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [systemResponse, servicesResponse] = await Promise.all([
        healthAPI.getSystemHealth(),
        healthAPI.getServicesHealth()
      ]);
      
      setSystemHealth(systemResponse);
      setServicesHealth(servicesResponse);
    } catch (err) {
      setError('Failed to fetch health data');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Refresh health data every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'ERROR':
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      case 'DEGRADED':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">System Health Dashboard</h2>
        <button
          onClick={fetchHealthData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* System Overview */}
      {systemHealth && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.status)}`}>
                {systemHealth.status}
              </div>
              <p className="text-sm text-gray-600 mt-1">Overall Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {systemHealth.services ? Object.keys(systemHealth.services).length : 0}
              </div>
              <p className="text-sm text-gray-600">Services</p>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {new Date(systemHealth.timestamp).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Last Check</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Health */}
      {servicesHealth && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Services Health</h3>
          <div className="space-y-4">
            {servicesHealth.services.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">Port: {service.port}</p>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </div>
                </div>
                {service.error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {service.error}
                  </div>
                )}
                {service.data && (
                  <div className="mt-2 text-sm text-gray-600">
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(service.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Service Details */}
      {systemHealth && systemHealth.services && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(systemHealth.services).map(([serviceName, serviceData]) => (
              <div key={serviceName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                    {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(serviceData.status)}`}>
                    {serviceData.status}
                  </div>
                </div>
                {serviceData.data && (
                  <div className="text-xs text-gray-600">
                    {serviceData.data.userCount && (
                      <p>Users: {serviceData.data.userCount}</p>
                    )}
                    {serviceData.data.todoCount && (
                      <p>Todos: {serviceData.data.todoCount}</p>
                    )}
                    {serviceData.data.database && (
                      <p>Database: {serviceData.data.database}</p>
                    )}
                    {serviceData.data.connection && (
                      <p>Connection: {serviceData.data.connection}</p>
                    )}
                  </div>
                )}
                {serviceData.error && (
                  <div className="text-xs text-red-600 mt-1">
                    Error: {serviceData.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
