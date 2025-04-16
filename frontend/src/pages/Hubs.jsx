import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HardDrive, Plus, Edit, Trash2, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Hubs = () => {
  const { user } = useAuth();
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'master',
    ipAddress: '',
    macAddress: '',
    location: '',
    customer: {
      name: '',
      id: '',
      type: 'residential'
    }
  });
  
  useEffect(() => {
    fetchHubs();
  }, []);
  
  const fetchHubs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hubs');
      setHubs(response.data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
      toast.error('Failed to fetch hubs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('customer.')) {
      const customerField = name.split('.')[1];
      setFormData({
        ...formData,
        customer: {
          ...formData.customer,
          [customerField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleAddHub = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/hubs', formData);
      toast.success('Hub created successfully');
      setHubs([...hubs, response.data.hub]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating hub:', error);
      toast.error(error.response?.data?.message || 'Failed to create hub');
    }
  };
  
  const handleEditHub = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.put(`/hubs/${selectedHub._id}`, formData);
      toast.success('Hub updated successfully');
      
      // Update hubs list
      setHubs(hubs.map(hub => 
        hub._id === selectedHub._id ? response.data.hub : hub
      ));
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating hub:', error);
      toast.error(error.response?.data?.message || 'Failed to update hub');
    }
  };
  
  const handleDeleteHub = async (hubId) => {
    if (!confirm('Are you sure you want to delete this hub?')) {
      return;
    }
    
    try {
      await api.delete(`/hubs/${hubId}`);
      toast.success('Hub deleted successfully');
      setHubs(hubs.filter(hub => hub._id !== hubId));
    } catch (error) {
      console.error('Error deleting hub:', error);
      toast.error(error.response?.data?.message || 'Failed to delete hub');
    }
  };
  
  const openEditModal = (hub) => {
    setSelectedHub(hub);
    setFormData({
      name: hub.name,
      type: hub.type,
      ipAddress: hub.ipAddress,
      macAddress: hub.macAddress || '',
      location: hub.location || '',
      status: hub.status,
      customer: {
        name: hub.customer?.name || '',
        id: hub.customer?.id || '',
        type: hub.customer?.type || 'residential'
      }
    });
    setShowEditModal(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'master',
      ipAddress: '',
      macAddress: '',
      location: '',
      customer: {
        name: '',
        id: '',
        type: 'residential'
      }
    });
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'offline':
        return <XCircle size={18} className="text-gray-500" />;
      case 'error':
        return <XCircle size={18} className="text-red-500" />;
      case 'maintenance':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      default:
        return <XCircle size={18} className="text-gray-500" />;
    }
  };
  
  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.ipAddress.includes(searchTerm) ||
    (hub.location && hub.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (hub.customer?.name && hub.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hubs</h1>
        
        {['admin', 'team_lead'].includes(user.role) && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Hub
          </button>
        )}
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search hubs..."
          />
        </div>
      </div>
      
      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHubs.map((hub) => (
          <div key={hub._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{hub.name}</h2>
                <div className="flex items-center">
                  {getStatusIcon(hub.status)}
                  <span className="ml-2 text-sm capitalize">{hub.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1 capitalize">{hub.type} Hub</p>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="font-medium">{hub.ipAddress}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{hub.location || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{hub.customer?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500">Last Ping</p>
                  <p className="font-medium">
                    {hub.lastPing ? new Date(hub.lastPing).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <Link
                to={`/hubs/${hub._id}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View Details
              </Link>
              
              {['admin', 'team_lead'].includes(user.role) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(hub)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Hub"
                  >
                    <Edit size={18} />
                  </button>
                  
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteHub(hub._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Hub"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredHubs.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
            <HardDrive size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hubs found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Add your first hub to get started'}
            </p>
          </div>
        )}
      </div>
      
      {/* Add Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Add New Hub
                    </h3>
                    
                    <form onSubmit={handleAddHub}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Hub Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                              Hub Type *
                            </label>
                            <select
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="master">Master</option>
                              <option value="garage">Garage</option>
                              <option value="alarm">Alarm</option>
                              <option value="upstairs">Upstairs</option>
                              <option value="downstairs">Downstairs</option>
                              <option value="power">Power</option>
                              <option value="irrigation">Irrigation</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              IP Address *
                            </label>
                            <input
                              type="text"
                              id="ipAddress"
                              name="ipAddress"
                              value={formData.ipAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              MAC Address
                            </label>
                            <input
                              type="text"
                              id="macAddress"
                              name="macAddress"
                              value={formData.macAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                              Location
                            </label>
                            <input
                              type="text"
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Information
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input
                                type="text"
                                name="customer.name"
                                placeholder="Customer Name"
                                value={formData.customer.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                name="customer.id"
                                placeholder="Customer ID"
                                value={formData.customer.id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <select
                              name="customer.type"
                              value={formData.customer.type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="residential">Residential</option>
                              <option value="industrial">Industrial</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddHub}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Hub
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Hub Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit Hub
                    </h3>
                    
                    <form onSubmit={handleEditHub}>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Hub Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                              Hub Type *
                            </label>
                            <select
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="master">Master</option>
                              <option value="garage">Garage</option>
                              <option value="alarm">Alarm</option>
                              <option value="upstairs">Upstairs</option>
                              <option value="downstairs">Downstairs</option>
                              <option value="power">Power</option>
                              <option value="irrigation">Irrigation</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="online">Online</option>
                              <option value="offline">Offline</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="error">Error</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              IP Address *
                            </label>
                            <input
                              type="text"
                              id="ipAddress"
                              name="ipAddress"
                              value={formData.ipAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">
                              MAC Address
                            </label>
                            <input
                              type="text"
                              id="macAddress"
                              name="macAddress"
                              value={formData.macAddress}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleEditHub}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hubs;