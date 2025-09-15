import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const [vectorMenuOpen, setVectorMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Todos', href: '/todos', icon: '✅' },
    { name: 'Users', href: '/users', icon: '👥' },
    { name: 'AI Assistant', href: '/ai', icon: '🤖' },
    { name: 'Health', href: '/health', icon: '🏥' },
  ];

  const vectorNavigation = [
    { name: 'Vector Search', href: '/vector', icon: '🔍' },
    { name: 'Analytics', href: '/vector/analytics', icon: '📊' },
    { name: 'Health', href: '/vector/health', icon: '🏥' },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h2 className="text-lg font-semibold text-white">Services</h2>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
            
            {/* Vector Menu */}
            <div className="mt-4">
              <button
                onClick={() => setVectorMenuOpen(!vectorMenuOpen)}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <span className="mr-3 text-lg">🔍</span>
                <span>Vector Search</span>
                <span className={`ml-auto transition-transform ${vectorMenuOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
              
              {vectorMenuOpen && (
                <div className="ml-6 mt-2 space-y-1">
                  {vectorNavigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <span className="mr-3 text-sm">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="text-xs text-gray-500 text-center">
            Microservices POC v1.0
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:bg-white lg:shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'
      }`}>
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h2 className="text-lg font-semibold text-white">Services</h2>
        </div>
        
        <nav className="mt-8 flex-1">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
            
            {/* Vector Menu */}
            <div className="mt-4">
              <button
                onClick={() => setVectorMenuOpen(!vectorMenuOpen)}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <span className="mr-3 text-lg">🔍</span>
                <span>Vector Search</span>
                <span className={`ml-auto transition-transform ${vectorMenuOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
              
              {vectorMenuOpen && (
                <div className="ml-6 mt-2 space-y-1">
                  {vectorNavigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <span className="mr-3 text-sm">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4">
          <div className="text-xs text-gray-500 text-center">
            Microservices POC v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
