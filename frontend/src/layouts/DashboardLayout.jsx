import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, HardDrive, Users, User, LogOut, Menu, X } from 'lucide-react';
import React from 'react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/hubs', icon: <HardDrive size={20} />, label: 'Hubs' },
    { 
      to: '/users', 
      icon: <Users size={20} />, 
      label: 'Users',
      roles: ['admin', 'team_lead']
    },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' }
  ];
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-800 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">AIoT Monitor</h1>
          <button 
            className="p-1 rounded-md lg:hidden hover:bg-gray-700"
            onClick={closeSidebar}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            {navItems.map((item, index) => {
              // Skip if role-restricted and user doesn't have permission
              if (item.roles && !item.roles.includes(user.role)) {
                return null;
              }
              
              return (
                <li key={index}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                    onClick={closeSidebar}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
            
            <li className="mt-6">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span className="ml-3">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button 
              className="p-1 rounded-md lg:hidden hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center">
              <div className="mr-2 text-right">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;