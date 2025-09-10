import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);

  const handleOverlayClick = () => {
    dispatch(setSidebarOpen(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Desktop layout */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        <Header />
        
        <main className="p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}
    </div>
  );
};

export default Layout;
