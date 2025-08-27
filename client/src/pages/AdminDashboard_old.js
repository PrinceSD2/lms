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

  // Date filtering state
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    filterType: 'all' // 'all', 'today', 'week', 'month', 'custom'
  });
  
  // Lead update modal states - REMOVED (Admin is now read-only)
  const [selectedLead, setSelectedLead] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  // Date filtering utility functions
  const getDateFilteredLeads = (leadsToFilter) => {
    if (!dateFilter || dateFilter.filterType === 'all') {
      return leadsToFilter;
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateFilter.filterType) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'custom':
        if (dateFilter.startDate) {
          startDate = new Date(dateFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
        }
        if (dateFilter.endDate) {
          endDate = new Date(dateFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        return leadsToFilter;
    }

    return leadsToFilter.filter(lead => {
      const leadDate = new Date(lead.createdAt || lead.dateCreated);
      return leadDate >= startDate && leadDate <= endDate;
    });
  };

  const handleDateFilterChange = (filterType, startDate = '', endDate = '') => {
    setDateFilter({
      filterType,
      startDate,
      endDate
    });
  };
  
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
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
      const statsData = response.data?.data;
      setStats(statsData || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (!isRefresh) {
        toast.error('Failed to fetch dashboard statistics');
      }
      setStats({}); // Set empty object on error
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
      const leadsData = response.data?.data?.leads;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
      setLeads([]); // Set empty array on error
    }
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
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
          <p className="text-gray-600">Real-time lead management overview (Read-only access)</p>
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
            <p className="text-sm text-gray-600">View all leads and observe agent actions (Admin has read-only access)</p>
          </div>
          <button
            onClick={() => setShowLeadsSection(!showLeadsSection)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            {showLeadsSection ? 'Hide Leads' : 'Show Leads'}
          </button>
        </div>
      </div>

      {/* Date Filter Controls */}
      {showLeadsSection && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateFilterChange('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateFilter.filterType === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleDateFilterChange('today')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateFilter.filterType === 'today' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilterChange('week')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateFilter.filterType === 'week' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateFilterChange('month')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateFilter.filterType === 'month' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Custom Range:</span>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => handleDateFilterChange('custom', e.target.value, dateFilter.endDate)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('custom', dateFilter.startDate, e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

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
                  {getDateFilteredLeads(leads).map((lead) => (
                    <tr key={lead.leadId || lead._id} className="hover:bg-gray-50">
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

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Lead Details: {selectedLead.name}</h3>
                    <p className="text-blue-100 text-sm">Complete lead information and tracking</p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <span className="text-sm text-gray-900 font-medium text-right">{selectedLead.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm text-gray-900 text-right break-all">{selectedLead.email || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.phone || '—'}</span>
                      </div>
                      {selectedLead.alternatePhone && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Alt. Phone:</span>
                          <span className="text-sm text-gray-900 text-right">{selectedLead.alternatePhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Address Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Address:</span>
                        <span className="text-sm text-gray-900 text-right max-w-xs">{selectedLead.address || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">City:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.city || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">State:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.state || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Zipcode:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.zipcode || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Debt Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Debt Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Category:</span>
                        <span className="text-sm text-gray-900 text-right capitalize">{selectedLead.debtCategory || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Types:</span>
                        <span className="text-sm text-gray-900 text-right max-w-xs">
                          {Array.isArray(selectedLead.debtTypes) && selectedLead.debtTypes.length > 0 
                            ? selectedLead.debtTypes.join(', ') 
                            : selectedLead.source || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                        <span className="text-sm text-gray-900 text-right font-semibold">
                          {selectedLead.totalDebtAmount ? `$${selectedLead.totalDebtAmount.toLocaleString()}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Creditors:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.numberOfCreditors || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Monthly Payment:</span>
                        <span className="text-sm text-gray-900 text-right">
                          {selectedLead.monthlyDebtPayment ? `$${selectedLead.monthlyDebtPayment.toLocaleString()}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Credit Score:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedLead.creditScoreRange || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management & Status Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Management Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Management Info</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Created By:</span>
                        <span className="text-sm text-gray-900 text-right font-medium">{selectedLead.createdBy?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Created At:</span>
                        <span className="text-sm text-gray-900 text-right">
                          {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Category:</span>
                        <div className="text-right">{getCategoryBadge(selectedLead.category, selectedLead.completionPercentage)}</div>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <div className="text-right">{getStatusBadge(selectedLead.status)}</div>
                      </div>
                      {selectedLead.assignedBy && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Assigned By:</span>
                          <span className="text-sm text-green-700 text-right font-medium">{selectedLead.assignedBy?.name}</span>
                        </div>
                      )}
                    </div>
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
                  onClick={() => setShowViewModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
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
