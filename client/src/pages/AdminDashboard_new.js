import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw
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

  // Date filtering state - ONLY FOR ADMIN
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    filterType: 'all' // 'all', 'today', 'week', 'month', 'custom'
  });
  
  // Lead update modal states - REMOVED (Admin is now read-only)
  const [selectedLead, setSelectedLead] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
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

  useEffect(() => {
    fetchStats();
    if (showLeadsSection) {
      fetchLeads();
    }
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchStats(true);
      if (showLeadsSection) {
        fetchLeads(true);
      }
      setLastUpdated(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [showLeadsSection]);

  useEffect(() => {
    // Socket.IO event listeners for real-time updates
    if (socket) {
      console.log('Admin Dashboard: Setting up socket listeners');
      
      const handleLeadUpdated = (data) => {
        console.log('Lead updated via socket:', data);
        toast.success(`Lead updated by ${data.updatedBy}`, {
          duration: 2000,
          icon: '🔄'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads(true);
        }
        setLastUpdated(new Date());
      };

      const handleLeadCreated = (data) => {
        console.log('New lead created via socket:', data);
        toast.success(`New lead created by ${data.createdBy}`, {
          duration: 2000,
          icon: '✅'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads(true);
        }
        setLastUpdated(new Date());
      };

      const handleLeadDeleted = (data) => {
        console.log('Lead deleted via socket:', data);
        toast.success(`Lead deleted by ${data.deletedBy}`, {
          duration: 2000,
          icon: '🗑️'
        });
        fetchStats(true);
        if (showLeadsSection) {
          fetchLeads(true);
        }
        setLastUpdated(new Date());
      };

      socket.on('leadUpdated', handleLeadUpdated);
      socket.on('leadCreated', handleLeadCreated);
      socket.on('leadDeleted', handleLeadDeleted);

      // Cleanup socket listeners
      return () => {
        socket.off('leadUpdated', handleLeadUpdated);
        socket.off('leadCreated', handleLeadCreated);
        socket.off('leadDeleted', handleLeadDeleted);
      };
    }
  }, [socket, showLeadsSection]);

  const fetchStats = async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    
    try {
      console.log('Admin Dashboard: Fetching stats...');
      const response = await axios.get('/api/leads/stats');
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (!silent) {
        toast.error('Failed to fetch dashboard stats');
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  const fetchLeads = async (silent = false) => {
    try {
      console.log('Admin Dashboard: Fetching leads...');
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/leads?page=1&limit=50&_t=${timestamp}`);
      const leadsData = response.data?.data?.leads;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      if (!silent) {
        toast.error('Failed to fetch leads');
      }
      setLeads([]);
    }
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

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
  const filteredLeads = getDateFilteredLeads(leads);

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
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.hotLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAgents || 0}</p>
            </div>
          </div>
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

      {/* Date Filter Controls - ONLY FOR ADMIN */}
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
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      )}

      {/* Leads Section */}
      {showLeadsSection && (
        <div className="space-y-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Leads</h3>
              <p className="text-sm text-gray-600">Comprehensive view of all leads from Agent1 and Agent2</p>
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
                      Agent2 Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Management
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.leadId || lead._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.company}</div>
                          {lead.leadId && (
                            <div className="text-xs text-primary-600 font-mono">ID: {lead.leadId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{maskEmail(lead.email)}</div>
                          <div className="text-sm text-gray-500">{maskPhone(lead.phone)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(lead.category, lead.completionPercentage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {lead.leadProgressStatus ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                              {lead.leadProgressStatus}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No status update</span>
                          )}
                          {lead.lastUpdatedBy && (
                            <div className="text-xs text-gray-500 mt-1">
                              by {lead.lastUpdatedBy}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            Created by: {lead.createdBy?.name}
                          </div>
                          {lead.assignedBy && (
                            <div className="text-sm text-green-600">
                              Assigned by: {lead.assignedBy?.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openViewModal(lead)}
                            className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-md transition-colors duration-200"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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

                  {/* Agent2 Status Tracking */}
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-teal-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Agent2 Actions & Status</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedLead.leadProgressStatus ? (
                        <div className="bg-white p-3 rounded-lg border border-teal-200">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Lead Progress Status:</span>
                            <span className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium text-right max-w-xs">
                              {selectedLead.leadProgressStatus}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <span className="text-sm text-gray-500 italic">No status update from Agent2 yet</span>
                        </div>
                      )}
                      
                      {selectedLead.lastUpdatedBy && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Last Updated By:</span>
                          <span className="text-sm text-teal-700 text-right font-medium">{selectedLead.lastUpdatedBy}</span>
                        </div>
                      )}
                      
                      {selectedLead.lastUpdatedAt && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Last Updated At:</span>
                          <span className="text-sm text-gray-900 text-right">
                            {new Date(selectedLead.lastUpdatedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {selectedLead.followUpDate && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Follow-up Date:</span>
                          <span className="text-sm text-gray-900 text-right">
                            {new Date(selectedLead.followUpDate).toLocaleDateString()}
                            {selectedLead.followUpTime && ` at ${selectedLead.followUpTime}`}
                          </span>
                        </div>
                      )}
                      
                      {selectedLead.conversionValue && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Conversion Value:</span>
                          <span className="text-sm text-green-600 text-right font-semibold">
                            ${selectedLead.conversionValue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes & Comments Section */}
                {(selectedLead.notes || selectedLead.followUpNotes || selectedLead.assignmentNotes) && (
                  <div className="mt-6">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-xl">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes & Comments
                      </h4>
                      
                      {selectedLead.notes && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-3 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-semibold text-blue-800">Agent1 Notes:</span>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed">{selectedLead.notes}</p>
                        </div>
                      )}
                      
                      {selectedLead.assignmentNotes && (
                        <div className="bg-purple-50 p-4 rounded-lg mb-3 border border-purple-200">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-semibold text-purple-800">Assignment Notes:</span>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed">{selectedLead.assignmentNotes}</p>
                        </div>
                      )}
                      
                      {selectedLead.followUpNotes && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-semibold text-green-800">Agent2 Follow-up Notes:</span>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed">{selectedLead.followUpNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
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
