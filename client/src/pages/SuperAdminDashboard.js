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
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import OrganizationManagement from '../components/OrganizationManagement';

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [agents, setAgents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Lead management states
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filtering state
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    filterType: 'all' // 'all', 'today', 'week', 'month', 'custom'
  });
  
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Lead form data
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    debtCategory: 'unsecured',
    debtTypes: [],
    totalDebtAmount: '',
    numberOfCreditors: '',
    monthlyDebtPayment: '',
    creditScore: '',
    creditScoreRange: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    notes: '',
    status: 'new',
    category: 'cold'
  });

  // Assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState(null);
  const [reddingtonAgent2s, setReddingtonAgent2s] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    agent2Id: '',
    assignmentNotes: ''
  });

  useEffect(() => {
    fetchData();
    fetchReddingtonAgent2s();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsResponse, agentsResponse, organizationsResponse, leadsResponse] = await Promise.all([
        axios.get('/api/auth/admins'),
        axios.get('/api/auth/agents'),
        axios.get('/api/organizations'),
        axios.get('/api/leads?page=1&limit=100') // Get more leads for super admin
      ]);
      
      // All endpoints now return: { success, count, data: [items] }
      const adminsData = Array.isArray(adminsResponse.data?.data) ? adminsResponse.data.data : [];
      const agentsData = Array.isArray(agentsResponse.data?.data) ? agentsResponse.data.data : [];
      const organizationsData = Array.isArray(organizationsResponse.data?.data) ? organizationsResponse.data.data : [];
      const leadsData = Array.isArray(leadsResponse.data?.data?.leads) ? leadsResponse.data.data.leads : [];
      
      setAdmins(adminsData);
      setAgents(agentsData);
      setOrganizations(organizationsData);
      setLeads(leadsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      // Set empty arrays on error to prevent filter errors
      setAdmins([]);
      setAgents([]);
      setOrganizations([]);
      setLeads([]);
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

  // Lead Management Functions
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  // Assignment Functions
  const fetchReddingtonAgent2s = async () => {
    try {
      const response = await axios.get('/api/auth/reddington-agent2s');
      setReddingtonAgent2s(response.data.data.agent2s || []);
    } catch (error) {
      console.error('Error fetching Reddington Agent2s:', error);
      toast.error('Failed to fetch Agent2s');
    }
  };

  const openAssignModal = (lead) => {
    setSelectedLeadForAssignment(lead);
    setShowAssignModal(true);
    setAssignmentData({
      agent2Id: '',
      assignmentNotes: ''
    });
  };

  const handleAssignToAgent2 = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`/api/leads/${selectedLeadForAssignment.leadId}/assign-to-agent2`, assignmentData);
      toast.success('Lead assigned to Agent2 successfully');
      setShowAssignModal(false);
      setSelectedLeadForAssignment(null);
      setAssignmentData({
        agent2Id: '',
        assignmentNotes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error(error.response?.data?.message || 'Failed to assign lead');
    } finally {
      setSubmitting(false);
    }
  };

  const openLeadModal = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const openEditLeadModal = (lead) => {
    setSelectedLead(lead);
    setLeadFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      alternatePhone: lead.alternatePhone || '',
      debtCategory: lead.debtCategory || 'unsecured',
      debtTypes: lead.debtTypes || [],
      totalDebtAmount: lead.totalDebtAmount || '',
      numberOfCreditors: lead.numberOfCreditors || '',
      monthlyDebtPayment: lead.monthlyDebtPayment || '',
      creditScore: lead.creditScore || '',
      creditScoreRange: lead.creditScoreRange || '',
      company: lead.company || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      zipcode: lead.zipcode || '',
      notes: lead.notes || '',
      status: lead.status || 'new',
      category: lead.category || 'cold'
    });
    setShowEditLeadModal(true);
  };

  const openCreateLeadModal = () => {
    setLeadFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      debtCategory: 'unsecured',
      debtTypes: [],
      totalDebtAmount: '',
      numberOfCreditors: '',
      monthlyDebtPayment: '',
      creditScore: '',
      creditScoreRange: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      notes: '',
      status: 'new',
      category: 'cold'
    });
    setShowCreateLeadModal(true);
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post('/api/leads', leadFormData);
      toast.success('Lead created successfully');
      setShowCreateLeadModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error(error.response?.data?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.put(`/api/leads/${selectedLead._id}`, leadFormData);
      toast.success('Lead updated successfully');
      setShowEditLeadModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (leadId, leadName) => {
    if (window.confirm(`Are you sure you want to delete lead "${leadName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/leads/${leadId}`);
        toast.success('Lead deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error(error.response?.data?.message || 'Failed to delete lead');
      }
    }
  };

  // Date filtering functions
  const getDateFilteredLeads = (leadsToFilter) => {
    if (!Array.isArray(leadsToFilter)) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return leadsToFilter.filter(lead => {
      const leadDate = new Date(lead.createdAt);

      switch (dateFilter.filterType) {
        case 'today':
          return leadDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          return leadDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          return leadDate >= monthAgo;
        case 'custom':
          if (dateFilter.startDate && dateFilter.endDate) {
            const startDate = new Date(dateFilter.startDate);
            const endDate = new Date(dateFilter.endDate);
            endDate.setHours(23, 59, 59, 999);
            return leadDate >= startDate && leadDate <= endDate;
          }
          return true;
        default:
          return true;
      }
    });
  };

  // Filter leads by organization
  const getOrganizationFilteredLeads = (leadsToFilter) => {
    if (!selectedOrganization || selectedOrganization === '') return leadsToFilter;
    
    return leadsToFilter.filter(lead => {
      // Check if lead was created by agents in the selected organization
      const createdByAgent = agents.find(agent => agent._id === lead.createdBy?._id);
      const assignedToAgent = agents.find(agent => agent._id === lead.assignedTo?._id);
      
      return (createdByAgent && createdByAgent.organization === selectedOrganization) ||
             (assignedToAgent && assignedToAgent.organization === selectedOrganization);
    });
  };

  // Filter leads by search query
  const getSearchFilteredLeads = (leadsToFilter) => {
    if (!searchQuery || searchQuery.trim() === '') return leadsToFilter;
    
    const query = searchQuery.toLowerCase();
    return leadsToFilter.filter(lead => {
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.leadId?.toLowerCase().includes(query) ||
        lead.status?.toLowerCase().includes(query) ||
        lead.category?.toLowerCase().includes(query)
      );
    });
  };

  // Helper functions for lead display
  const getCategoryBadge = (category, completionPercentage = 0) => {
    const badges = {
      hot: 'bg-red-100 text-red-800 border-red-200',
      warm: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      cold: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[category]}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)} ({completionPercentage}%)
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'bg-gray-100 text-gray-800',
      interested: 'bg-green-100 text-green-800',
      'not-interested': 'bg-red-100 text-red-800',
      successful: 'bg-emerald-100 text-emerald-800',
      'follow-up': 'bg-blue-100 text-blue-800'
    };

    const icons = {
      new: AlertCircle,
      interested: CheckCircle,
      'not-interested': XCircle,
      successful: CheckCircle,
      'follow-up': Clock
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading SuperAdmin dashboard..." />;
  }

  const activeUsers = (Array.isArray(admins) ? admins.filter(admin => admin.isActive).length : 0) + 
                     (Array.isArray(agents) ? agents.filter(agent => agent.isActive).length : 0);
  const totalOrganizations = Array.isArray(organizations) ? organizations.length : 0;
  const activeOrganizations = Array.isArray(organizations) ? organizations.filter(org => org.isActive).length : 0;
  
  // Lead statistics
  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const filteredLeads = getSearchFilteredLeads(getDateFilteredLeads(getOrganizationFilteredLeads(leads)));
  const successfulLeads = leads.filter(lead => lead.status === 'successful').length;
  const conversionRate = totalLeads > 0 ? ((successfulLeads / totalLeads) * 100).toFixed(1) : 0;

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
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Agents & Admins
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leads'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Lead Management
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
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                  <p className="text-xs text-green-600">{successfulLeads} successful</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
                  <p className="text-xs text-gray-500">Success rate</p>
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
                      Organization
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
                        <div className="text-sm text-gray-900">
                          {admin.organization ? admin.organization.name : 'No Organization'}
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
                      Organization
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
                        <div className="text-sm text-gray-900">
                          {agent.organization ? agent.organization.name : 'No Organization'}
                        </div>
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

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Leads Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lead Management</h2>
              <p className="text-gray-600">Manage leads across all organizations with full permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={openCreateLeadModal}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Leads</label>
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Organization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Organization</label>
                <select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Organizations</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org._id}>{org.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                <select
                  value={dateFilter.filterType}
                  onChange={(e) => setDateFilter({...dateFilter, filterType: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {dateFilter.filterType === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Leads ({filteredLeads.length})
              </h3>
              <p className="text-sm text-gray-500">
                Showing {filteredLeads.length} of {totalLeads} total leads
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => {
                    const createdByAgent = agents.find(agent => agent._id === lead.createdBy?._id);
                    const assignedToAgent = agents.find(agent => agent._id === lead.assignedTo?._id);
                    const leadOrganization = createdByAgent ? organizations.find(org => org._id === createdByAgent.organization) : null;
                    
                    return (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">ID: {lead.leadId || lead._id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{lead.email || '—'}</div>
                            <div className="text-sm text-gray-500">{lead.phone || '—'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(lead.category, lead.completionPercentage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(lead.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {leadOrganization ? leadOrganization.name : 'Unknown'}
                            </div>
                            {assignedToAgent && (
                              <div className="text-sm text-blue-600">
                                Assigned to: {assignedToAgent.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {lead.createdBy?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Role: {createdByAgent ? createdByAgent.role : 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openLeadModal(lead)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors duration-200"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditLeadModal(lead)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors duration-200"
                            >
                              Edit
                            </button>
                            {!lead.assignedTo && (
                              <button
                                onClick={() => openAssignModal(lead)}
                                className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors duration-200"
                              >
                                Assign
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteLead(lead._id, lead.name)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No leads found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Agents & Admins Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Filter by Organization */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Organization</h3>
            <div className="flex flex-wrap gap-4">
              <select 
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Organizations</option>
                <option value="reddington">Reddington (Main)</option>
                {organizations.filter(org => org.organizationType !== 'main').map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Admins Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Organization Admins</h3>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Admin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
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
                  {admins
                    .filter(admin => !selectedOrganization || 
                      (selectedOrganization === 'reddington' ? admin.organizationId?.name === 'Reddington' : admin.organizationId?._id === selectedOrganization))
                    .map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.organizationId?.name === 'Reddington' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.organizationId?.name || 'No Organization'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admins.filter(admin => !selectedOrganization || 
                    (selectedOrganization === 'reddington' ? admin.organizationId?.name === 'Reddington' : admin.organizationId?._id === selectedOrganization)).length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No admins found for the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agents Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Agents</h3>
              <p className="text-sm text-gray-600 mt-1">View all Agent1s and Agent2s across organizations</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
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
                  {agents
                    .filter(agent => !selectedOrganization || 
                      (selectedOrganization === 'reddington' ? agent.organizationId?.name === 'Reddington' : agent.organizationId?._id === selectedOrganization))
                    .map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.role === 'agent1' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {agent.role === 'agent1' ? 'Agent 1' : 'Agent 2'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          agent.organizationId?.name === 'Reddington' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {agent.organizationId?.name || 'No Organization'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteAgent(agent._id, agent.name)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agents.filter(agent => !selectedOrganization || 
                    (selectedOrganization === 'reddington' ? agent.organizationId?.name === 'Reddington' : agent.organizationId?._id === selectedOrganization)).length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No agents found for the selected criteria.
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

      {/* View Lead Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowLeadModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Lead Details: {selectedLead.name}</h3>
                    <p className="text-blue-100 text-sm">Complete lead information and tracking</p>
                  </div>
                  <button
                    onClick={() => setShowLeadModal(false)}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{selectedLead.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{selectedLead.email || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{selectedLead.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Alternate Phone:</span>
                        <p className="text-gray-900">{selectedLead.alternatePhone || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Debt Information */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
                    <h4 className="text-lg font-semibold text-red-900 mb-4">Debt Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-red-600">Category:</span>
                        <p className="text-red-900">{selectedLead.debtCategory || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-600">Total Amount:</span>
                        <p className="text-red-900">${selectedLead.totalDebtAmount || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-600">Monthly Payment:</span>
                        <p className="text-red-900">${selectedLead.monthlyDebtPayment || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-600">Credit Score:</span>
                        <p className="text-red-900">{selectedLead.creditScore || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lead Status */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">Lead Status</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-green-600">Status:</span>
                        <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">Category:</span>
                        <div className="mt-1">{getCategoryBadge(selectedLead.category, selectedLead.completionPercentage)}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">Created:</span>
                        <p className="text-green-900">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">Updated:</span>
                        <p className="text-green-900">{new Date(selectedLead.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Address Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Address:</span> {selectedLead.address || '—'}</p>
                      <p className="text-sm"><span className="font-medium">City:</span> {selectedLead.city || '—'}</p>
                      <p className="text-sm"><span className="font-medium">State:</span> {selectedLead.state || '—'}</p>
                      <p className="text-sm"><span className="font-medium">Zipcode:</span> {selectedLead.zipcode || '—'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Notes</h4>
                    <p className="text-sm text-gray-700">{selectedLead.notes || 'No notes available'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateLeadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowCreateLeadModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleCreateLead}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Create New Lead</h3>
                    <p className="text-sm text-gray-500">Add a new lead to the system</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.name}
                        onChange={(e) => setLeadFormData({...leadFormData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.email}
                        onChange={(e) => setLeadFormData({...leadFormData, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        placeholder="e.g., 2345678901"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.phone}
                        onChange={(e) => setLeadFormData({...leadFormData, phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.status}
                        onChange={(e) => setLeadFormData({...leadFormData, status: e.target.value})}
                      >
                        <option value="new">New</option>
                        <option value="interested">Interested</option>
                        <option value="not-interested">Not Interested</option>
                        <option value="successful">Successful</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.category}
                        onChange={(e) => setLeadFormData({...leadFormData, category: e.target.value})}
                      >
                        <option value="cold">Cold</option>
                        <option value="warm">Warm</option>
                        <option value="hot">Hot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Debt Amount</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.totalDebtAmount}
                        onChange={(e) => setLeadFormData({...leadFormData, totalDebtAmount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={leadFormData.notes}
                      onChange={(e) => setLeadFormData({...leadFormData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Lead'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateLeadModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditLeadModal && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowEditLeadModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleUpdateLead}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Edit Lead: {selectedLead.name}</h3>
                    <p className="text-sm text-gray-500">Update lead information</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.name}
                        onChange={(e) => setLeadFormData({...leadFormData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.email}
                        onChange={(e) => setLeadFormData({...leadFormData, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        placeholder="e.g., 2345678901"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.phone}
                        onChange={(e) => setLeadFormData({...leadFormData, phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.status}
                        onChange={(e) => setLeadFormData({...leadFormData, status: e.target.value})}
                      >
                        <option value="new">New</option>
                        <option value="interested">Interested</option>
                        <option value="not-interested">Not Interested</option>
                        <option value="successful">Successful</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.category}
                        onChange={(e) => setLeadFormData({...leadFormData, category: e.target.value})}
                      >
                        <option value="cold">Cold</option>
                        <option value="warm">Warm</option>
                        <option value="hot">Hot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Debt Amount</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={leadFormData.totalDebtAmount}
                        onChange={(e) => setLeadFormData({...leadFormData, totalDebtAmount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={leadFormData.notes}
                      onChange={(e) => setLeadFormData({...leadFormData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Lead'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowEditLeadModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedLeadForAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowAssignModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAssignToAgent2}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Assign Lead to Reddington Agent2</h3>
                    <p className="text-sm text-gray-500">
                      Assign "{selectedLeadForAssignment.name}" to an Agent2 from the main organization
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select Agent2 *</label>
                      <select
                        required
                        value={assignmentData.agent2Id}
                        onChange={(e) => setAssignmentData({...assignmentData, agent2Id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select an Agent2</option>
                        {reddingtonAgent2s.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name} ({agent.email})
                          </option>
                        ))}
                      </select>
                      {reddingtonAgent2s.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          No Agent2s available in the main organization
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assignment Notes</label>
                      <textarea
                        rows="3"
                        placeholder="Optional notes about this assignment..."
                        value={assignmentData.assignmentNotes}
                        onChange={(e) => setAssignmentData({...assignmentData, assignmentNotes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Assignment Information
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>• Lead will be assigned to the selected Agent2 from Reddington organization</p>
                            <p>• The Admin of the source organization can track the assignment status</p>
                            <p>• Only Agent2s can update the lead status once assigned</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    disabled={submitting || reddingtonAgent2s.length === 0}
                  >
                    {submitting ? 'Assigning...' : 'Assign Lead'}
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
