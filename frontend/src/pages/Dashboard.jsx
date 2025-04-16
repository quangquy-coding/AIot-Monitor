import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { HardDrive, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import React from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    hubs: { total: 0, online: 0, offline: 0, error: 0 },
    users: { total: 0, active: 0, inactive: 0 }
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch hub stats
        const hubsResponse = await api.get('/hubs');
        const hubs = hubsResponse.data;
        
        // Fetch user stats (if admin or team_lead)
        let users = [];
        try {
          const usersResponse = await api.get('/users');
          users = usersResponse.data;
        } catch (error) {
          console.log('Not authorized to view users or error fetching users');
        }
        
        // Calculate stats
        const hubStats = {
          total: hubs.length,
          online: hubs.filter(hub => hub.status === 'online').length,
          offline: hubs.filter(hub => hub.status === 'offline').length,
          error: hubs.filter(hub => hub.status === 'error').length
        };
        
        const userStats = {
          total: users.length,
          active: users.filter(user => user.isActive).length,
          inactive: users.filter(user => !user.isActive).length
        };
        
        setStats({
          hubs: hubStats,
          users: userStats
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hubs Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Hubs</h2>
            <HardDrive className="text-blue-500" size={24} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-800">{stats.hubs.total}</div>
              <div className="text-sm text-gray-500">Total Hubs</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{stats.hubs.online}</div>
              <div className="text-sm text-green-600">Online</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-500">{stats.hubs.offline}</div>
              <div className="text-sm text-gray-500">Offline</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{stats.hubs.error}</div>
              <div className="text-sm text-red-600">Error</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Link 
              to="/hubs" 
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              View all hubs →
            </Link>
          </div>
        </div>
        
        {/* Users Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Users</h2>
            <Users className="text-blue-500" size={24} />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-800">{stats.users.total}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{stats.users.active}</div>
              <div className="text-sm text-green-600">Active</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{stats.users.inactive}</div>
              <div className="text-sm text-red-600">Inactive</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Link 
              to="/users" 
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              View all users →
            </Link>
          </div>
        </div>
      </div>
      
      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">System Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">API Server</h3>
              <p className="text-sm text-gray-500">Backend API service</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Database</h3>
              <p className="text-sm text-gray-500">MongoDB database</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">WebSocket Server</h3>
              <p className="text-sm text-gray-500">Real-time communication</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;