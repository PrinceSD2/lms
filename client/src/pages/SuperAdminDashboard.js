import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  BarChart3
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import OrganizationManagement from './OrganizationManagement';

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [agents, setAgents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsResponse, agentsResponse, organizationsResponse] = await Promise.all([
        axios.get('/api/auth/admins'),
        axios.get('/api/auth/agents'),
        axios.get('/api/organizations')
      ]);
      
      // All endpoints now return: { success, count, data: [items] }
      const adminsData = Array.isArray(adminsResponse.data?.data) ? adminsResponse.data.data : [];
      const agentsData = Array.isArray(agentsResponse.data?.data) ? agentsResponse.data.data : [];
      const organizationsData = Array.isArray(organizationsResponse.data?.data) ? organizationsResponse.data.data : [];
      
      setAdmins(adminsData);
      setAgents(agentsData);
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      // Set empty arrays on error to prevent filter errors
      setAdmins([]);
      setAgents([]);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/auth/create-admin', adminFormData);
      toast.success('Admin created successfully!');
      setAdminFormData({ name: '', email: '', password: '' });
      setShowCreateAdminModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (window.confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/auth/admins/${adminId}`);
        toast.success('Admin deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting admin:', error);
        toast.error(error.response?.data?.message || 'Failed to delete admin');
      }
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      await axios.put(`/api/auth/admins/${adminId}/status`, { 
        isActive: !currentStatus 
      });
      toast.success(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error(error.response?.data?.message || 'Failed to update admin status');
    }
  };

  const handleToggleAgentStatus = async (agentId, currentStatus) => {
    try {
      await axios.put(`/api/auth/agents/${agentId}/status`, { 
        isActive: !currentStatus 
      });
      toast.success(`Agent ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast.error(error.response?.data?.message || 'Failed to update agent status');
    }
  };

  const handleDeleteAgent = async (agentId, agentName) => {
    if (window.confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/auth/agents/${agentId}`);
        toast.success('Agent deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting agent:', error);
        toast.error(error.response?.data?.message || 'Failed to delete agent');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading SuperAdmin dashboard..." />;
  }

  const activeUsers = (Array.isArray(admins) ? admins.filter(admin => admin.isActive).length : 0) + 
                     (Array.isArray(agents) ? agents.filter(agent => agent.isActive).length : 0);
  const totalOrganizations = Array.isArray(organizations) ? organizations.length : 0;
  const activeOrganizations = Array.isArray(organizations) ? organizations.filter(org => org.isActive).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-purple-600 mr-3" />
            SuperAdmin Dashboard
          </h1>
          <p className="text-gray-600">Manage organizations, administrators and system users</p>
        </div>
        {activeTab === 'overview' && (
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Admin
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'organizations'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Organizations
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrganizations}</p>
                  <p className="text-xs text-green-600">{activeOrganizations} active</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(admins) ? admins.length : 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(agents) ? agents.length : 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admins Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Administrator Management</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(admins) && admins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleAdminStatus(admin._id, admin.isActive)}
                          className="text-blue-600 hover:text-blue-900"
                          title={admin.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {admin.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(admins) || admins.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No administrators found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agents Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Agents Overview</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(agents) && agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          agent.role === 'agent1' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {agent.role === 'agent1' ? 'Agent 1' : 'Agent 2'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          agent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleAgentStatus(agent._id, agent.isActive)}
                          className="text-blue-600 hover:text-blue-900"
                          title={agent.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {agent.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent._id, agent.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(agents) || agents.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No agents found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <OrganizationManagement />
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowCreateAdminModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New Admin</h3>
                    <p className="text-sm text-gray-500">Enter admin information below</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        value={adminFormData.name}
                        onChange={(e) => setAdminFormData({...adminFormData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        value={adminFormData.email}
                        onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                        required
                        minLength="6"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 6 characters with uppercase, lowercase, and number
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Admin'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateAdminModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
