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
  RefreshCw
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import AgentManagement from '../components/AgentManagement';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchStats(true);
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
    window.addEventListener('refreshLeads', () => fetchStats(true));
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshStats', handleStatsRefresh);
      window.removeEventListener('refreshLeads', () => fetchStats(true));
    };
  }, []);

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

      {/* Agent Management Section */}
      <AgentManagement />
    </div>
  );
};

export default AdminDashboard;
