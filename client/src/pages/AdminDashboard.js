import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import AgentManagement from '../components/AgentManagement';
import { useSocket } from '../contexts/SocketContext';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showLeadsSection, setShowLeadsSection] = useState(false);
  
  // Lead update modal states
  const [selectedLead, setSelectedLead] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Utility functions to mask sensitive data
  const maskEmail = (email) => {
    if (!email) return '—';
    const [username, domain] = email.split('@');
    if (username.length <= 2) return `${username}***@${domain}`;
    return `${username.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return '***-****';
    return `***-***-${cleaned.slice(-4)}`;
  };
  
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    followUpDate: '',
    followUpTime: '',
    followUpNotes: '',
    conversionValue: ''
  });

  useEffect(() => {
    fetchStats();
    if (showLeadsSection) {
      fetchLeads();
    }
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchStats(true);
      if (showLeadsSection) {
        fetchLeads();
      }
    }, 10000);

    // Listen for real-time updates
    const handleStatsRefresh = (event) => {
      if (event.detail) {
        setStats(event.detail);
        setLastUpdated(new Date());
      } else {
        fetchStats(true);
      }
    };

    window.addEventListener('refreshStats', handleStatsRefresh);
    window.addEventListener('refreshLeads', () => {
      fetchStats(true);
      if (showLeadsSection) fetchLeads();
    });

    // Socket.IO event listeners for real-time updates
    if (socket) {
      const handleLeadUpdated = (data) => {
        console.log('Lead updated via socket:', data);
        toast.success(`Lead updated by ${data.updatedBy}`, {
          duration: 3000,
          icon: '🔄'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads();
        }
        setLastUpdated(new Date());
      };

      const handleLeadCreated = (data) => {
        console.log('New lead created via socket:', data);
        toast.success(`New lead created by ${data.createdBy}`, {
          duration: 3000,
          icon: '✅'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads();
        }
        setLastUpdated(new Date());
      };

      const handleLeadDeleted = (data) => {
        console.log('Lead deleted via socket:', data);
        toast.success(`Lead deleted by ${data.deletedBy}`, {
          duration: 3000,
          icon: '🗑️'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads();
        }
        setLastUpdated(new Date());
      };

      socket.on('leadUpdated', handleLeadUpdated);
      socket.on('leadCreated', handleLeadCreated);
      socket.on('leadDeleted', handleLeadDeleted);

      // Cleanup socket listeners
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshStats', handleStatsRefresh);
        window.removeEventListener('refreshLeads', () => {
          fetchStats(true);
          if (showLeadsSection) fetchLeads();
        });
        socket.off('leadUpdated', handleLeadUpdated);
        socket.off('leadCreated', handleLeadCreated);
        socket.off('leadDeleted', handleLeadDeleted);
      };
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshStats', handleStatsRefresh);
      window.removeEventListener('refreshLeads', () => {
        fetchStats(true);
        if (showLeadsSection) fetchLeads();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLeadsSection, filters, socket]);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const response = await axios.get('/api/leads/dashboard/stats');
      setStats(response.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (!isRefresh) {
        toast.error('Failed to fetch dashboard statistics');
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/leads?${params.toString()}`);
      setLeads(response.data.data.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Clean the update data to remove empty strings
      const cleanUpdateData = {
        status: updateData.status
      };
      
      // Only add optional fields if they have values
      if (updateData.followUpDate && updateData.followUpDate !== '') {
        cleanUpdateData.followUpDate = updateData.followUpDate;
      }
      if (updateData.followUpTime && updateData.followUpTime !== '') {
        cleanUpdateData.followUpTime = updateData.followUpTime;
      }
      if (updateData.followUpNotes && updateData.followUpNotes !== '') {
        cleanUpdateData.followUpNotes = updateData.followUpNotes;
      }
      if (updateData.conversionValue && updateData.conversionValue !== '') {
        cleanUpdateData.conversionValue = parseFloat(updateData.conversionValue);
      }
      
      console.log('Admin sending update request with cleaned data:', cleanUpdateData);
      console.log('Admin selected lead ID:', selectedLead._id);
      
      await axios.put(`/api/leads/${selectedLead._id}`, cleanUpdateData);
      toast.success('Lead updated successfully!');
      
      setShowUpdateModal(false);
      setSelectedLead(null);
      setUpdateData({
        status: '',
        followUpDate: '',
        followUpTime: '',
        followUpNotes: '',
        conversionValue: ''
      });
      
      fetchLeads();
      fetchStats(true);
    } catch (error) {
      console.error('Admin error updating lead:', error);
      console.error('Admin error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateData({
      status: lead.status || 'new',
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
      followUpTime: lead.followUpTime || '',
      followUpNotes: lead.followUpNotes || '',
      conversionValue: lead.conversionValue || ''
    });
    setShowUpdateModal(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const handleDeleteLead = async (leadId, leadName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the lead "${leadName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setRefreshing(true);
      
      // Make delete request
      await axios.delete(`/api/leads/${leadId}`);
      
      toast.success(`Lead "${leadName}" deleted successfully`);
      
      // Refresh leads list and stats
      await fetchLeads();
      await fetchStats(true);
      
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    } finally {
      setRefreshing(false);
    }
  };

  const getCategoryBadge = (category, completionPercentage) => {
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
      'not-interested': AlertCircle,
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

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load dashboard data</p>
        <button 
          onClick={() => fetchStats()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const conversionRate = parseFloat(stats.conversionRate) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Real-time lead management overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLeads || 0}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{stats.todayLeads || 0} today
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
              <div className="flex items-center mt-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600 ml-1">
                  {stats.successfulLeads || 0} successful
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-3xl font-bold text-red-600">{stats.hotLeads || 0}</p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 ml-1">
                  High Priority
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Follow-ups</p>
              <p className="text-3xl font-bold text-orange-600">{stats.todayFollowUps || 0}</p>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600 ml-1">
                  Scheduled
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lead Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Categories</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="font-medium text-red-800">Hot Leads</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.hotLeads || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-medium text-yellow-800">Warm Leads</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats.warmLeads || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="font-medium text-blue-800">Cold Leads</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.coldLeads || 0}</span>
            </div>
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-700">New Leads</span>
              </div>
              <span className="text-xl font-bold text-gray-700">
                {stats.totalLeads - stats.interestedLeads - stats.successfulLeads - stats.followUpLeads || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-green-700">Interested</span>
              </div>
              <span className="text-xl font-bold text-green-600">{stats.interestedLeads || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-emerald-700">Successful</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">{stats.successfulLeads || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-700">Follow Up</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.followUpLeads || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">This Week</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.weekLeads || 0}</p>
          <p className="text-sm text-gray-600">New leads this week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">This Month</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.monthLeads || 0}</p>
          <p className="text-sm text-gray-600">New leads this month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Lead to conversion</p>
        </div>
      </div>

      {/* Auto-refresh Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            This dashboard automatically refreshes every 10 seconds to show real-time data.
          </p>
        </div>
      </div>

      {/* Lead Management Toggle */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Lead Management</h3>
            <p className="text-sm text-gray-600">View and update all leads in the system</p>
          </div>
          <button
            onClick={() => setShowLeadsSection(!showLeadsSection)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            {showLeadsSection ? 'Hide Leads' : 'Show Leads'}
          </button>
        </div>
      </div>

      {/* Leads Section */}
      {showLeadsSection && (
        <div className="space-y-6 mb-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="interested">Interested</option>
                  <option value="not-interested">Not Interested</option>
                  <option value="successful">Successful</option>
                  <option value="follow-up">Follow Up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: '', category: '', search: '' })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Leads ({leads.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent1 Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent2 Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debt Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.company}</div>
                          <div className="text-xs text-gray-400">
                            By: {lead.createdBy?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{maskEmail(lead.email)}</div>
                        <div className="text-sm text-gray-500">{maskPhone(lead.phone)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(lead.category, lead.completionPercentage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-gray-600">General:</span>
                            <span className="ml-1">{getStatusBadge(lead.status)}</span>
                          </div>
                          {lead.debtCategory && (
                            <div>
                              <span className="text-gray-600">Category:</span>
                              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                                {lead.debtCategory}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          {lead.leadStatus && (
                            <div>
                              <span className="text-gray-600">Lead:</span>
                              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                {lead.leadStatus}
                              </span>
                            </div>
                          )}
                          {lead.contactStatus && (
                            <div>
                              <span className="text-gray-600">Contact:</span>
                              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                {lead.contactStatus}
                              </span>
                            </div>
                          )}
                          {lead.qualificationOutcome && (
                            <div>
                              <span className="text-gray-600">Qualification:</span>
                              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                {lead.qualificationOutcome}
                              </span>
                            </div>
                          )}
                          {lead.callDisposition && (
                            <div>
                              <span className="text-gray-600">Call:</span>
                              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                                {lead.callDisposition}
                              </span>
                            </div>
                          )}
                          {(!lead.leadStatus && !lead.contactStatus && !lead.qualificationOutcome && !lead.callDisposition) && (
                            <span className="text-gray-400 text-xs">No Agent2 updates</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.totalDebtAmount ? `$${lead.totalDebtAmount.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => openViewModal(lead)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => openUpdateModal(lead)}
                            className="text-primary-600 hover:text-primary-900 text-xs"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead._id, lead.name)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
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

      {/* View Lead Details Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowViewModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Lead Details: {selectedLead.name}</h3>
                    <p className="text-sm text-gray-500">Complete lead information</p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.phone || 'N/A'}</span>
                      </div>
                      {selectedLead.alternatePhone && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Alternate Phone:</span>
                          <span className="ml-2 text-sm text-gray-900">{selectedLead.alternatePhone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Job Title:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.jobTitle || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Address Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Address:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.address || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">City:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.city || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">State:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.state || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Zipcode:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.zipcode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Debt Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Debt Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Debt Category:</span>
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {selectedLead.debtCategory || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Debt Types:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {Array.isArray(selectedLead.debtTypes) && selectedLead.debtTypes.length > 0 
                            ? selectedLead.debtTypes.join(', ') 
                            : selectedLead.source || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Total Debt Amount:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {selectedLead.totalDebtAmount ? `$${selectedLead.totalDebtAmount.toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Number of Creditors:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.numberOfCreditors || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Monthly Debt Payment:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {selectedLead.monthlyDebtPayment ? `$${selectedLead.monthlyDebtPayment.toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Credit Score Range:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.creditScoreRange || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Category:</span>
                        <span className="ml-2">{getCategoryBadge(selectedLead.category, selectedLead.completionPercentage)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className="ml-2">{getStatusBadge(selectedLead.status)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Management Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Management Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Created By:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedLead.createdBy?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Created At:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {selectedLead.updatedBy && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Updated By:</span>
                          <span className="ml-2 text-sm text-gray-900">{selectedLead.updatedBy?.name}</span>
                        </div>
                      )}
                      {selectedLead.followUpDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Follow-up Date:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(selectedLead.followUpDate).toLocaleDateString()}
                            {selectedLead.followUpTime && ` at ${selectedLead.followUpTime}`}
                          </span>
                        </div>
                      )}
                      {selectedLead.conversionValue && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Conversion Value:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            ${selectedLead.conversionValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent2 Status Information */}
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Agent2 Status Tracking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Lead Status:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.leadStatus ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {selectedLead.leadStatus}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Contact Status:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.contactStatus ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {selectedLead.contactStatus}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Qualification Outcome:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.qualificationOutcome ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {selectedLead.qualificationOutcome}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Call Disposition:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.callDisposition ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {selectedLead.callDisposition}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Engagement Outcome:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.engagementOutcome ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {selectedLead.engagementOutcome}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Disqualification:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLead.disqualification ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {selectedLead.disqualification}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {(selectedLead.notes || selectedLead.requirements || selectedLead.followUpNotes) && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Notes & Comments</h4>
                    {selectedLead.notes && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-3">
                        <span className="text-sm font-medium text-blue-700 block mb-1">Agent1 Notes:</span>
                        <p className="text-sm text-gray-900">{selectedLead.notes}</p>
                      </div>
                    )}
                    {selectedLead.requirements && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <span className="text-sm font-medium text-gray-600 block mb-1">Requirements:</span>
                        <p className="text-sm text-gray-900">{selectedLead.requirements}</p>
                      </div>
                    )}
                    {selectedLead.followUpNotes && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <span className="text-sm font-medium text-green-700 block mb-1">Agent2 Follow-up Notes:</span>
                        <p className="text-sm text-gray-900">{selectedLead.followUpNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openUpdateModal(selectedLead);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update Lead
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteLead(selectedLead._id, selectedLead.name);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete Lead
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Lead Modal */}
      {showUpdateModal && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowUpdateModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateLead}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Update Lead: {selectedLead.name}</h3>
                    <p className="text-sm text-gray-500">{selectedLead.company}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status *</label>
                      <select
                        name="status"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={updateData.status}
                        onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                      >
                        <option value="new">New</option>
                        <option value="interested">Interested</option>
                        <option value="not-interested">Not Interested</option>
                        <option value="successful">Successful</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>

                    {/* Follow-up Date (show only if status is follow-up) */}
                    {updateData.status === 'follow-up' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                          <input
                            type="date"
                            name="followUpDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            value={updateData.followUpDate}
                            onChange={(e) => setUpdateData({ ...updateData, followUpDate: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Follow-up Time</label>
                          <input
                            type="time"
                            name="followUpTime"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            value={updateData.followUpTime}
                            onChange={(e) => setUpdateData({ ...updateData, followUpTime: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Follow-up Notes</label>
                          <textarea
                            name="followUpNotes"
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            value={updateData.followUpNotes}
                            onChange={(e) => setUpdateData({ ...updateData, followUpNotes: e.target.value })}
                            placeholder="Add notes for follow-up..."
                          ></textarea>
                        </div>
                      </>
                    )}

                    {/* Conversion Value (show only if status is successful) */}
                    {updateData.status === 'successful' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Conversion Value</label>
                        <input
                          type="number"
                          name="conversionValue"
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={updateData.conversionValue}
                          onChange={(e) => setUpdateData({ ...updateData, conversionValue: e.target.value })}
                          placeholder="Enter conversion value"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Lead'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowUpdateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Agent Management Section */}
      <AgentManagement />
    </div>
  );
};

export default AdminDashboard;
