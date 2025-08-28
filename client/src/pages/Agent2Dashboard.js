import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Unified Lead Progress Status options for Agent 2
const agent2LeadProgressOptions = [
  "Appointment Scheduled",
  "Immediate Enrollment",
  "Info Provided – Awaiting Decision",
  "Nurture – Not Ready",
  "Qualified – Meets Criteria",
  "Pre-Qualified – Docs Needed",
  "Disqualified – Debt Too Low",
  "Disqualified – Secured Debt Only",
  "Disqualified – Non-Service State",
  "Disqualified – Active with Competitor",
  "Callback Needed",
  "Left Voicemail",
  "Not Interested",
  "DNC (Do Not Contact)"
];

const Agent2Dashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const maskAmount = (amount) => {
    if (!amount) return '—';
    const amountStr = amount.toString();
    if (amountStr.length <= 3) return '$***';
    return `$${amountStr.substring(0, 1)}***`;
  };

  
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  const [updateData, setUpdateData] = useState({
    leadProgressStatus: '',
    followUpDate: '',
    followUpTime: '',
    followUpNotes: '',
    conversionValue: ''
  });

  useEffect(() => {
    fetchLeads();
    
    // Listen for real-time updates
    const handleRefresh = () => fetchLeads();
    window.addEventListener('refreshLeads', handleRefresh);

    // Socket.IO event listeners for real-time updates
    if (socket) {
      const handleLeadUpdated = (data) => {
        console.log('Lead updated via socket in Agent2:', data);
        toast.success(`Lead updated successfully`, {
          duration: 2000,
          icon: '🔄'
        });
        fetchLeads(); // Refresh the leads list
      };

      const handleLeadCreated = (data) => {
        console.log('New lead created via socket in Agent2:', data);
        toast.success(`New lead available`, {
          duration: 2000,
          icon: '✅'
        });
        fetchLeads(); // Refresh the leads list
      };

      socket.on('leadUpdated', handleLeadUpdated);
      socket.on('leadCreated', handleLeadCreated);

      // Cleanup socket listeners
      return () => {
        window.removeEventListener('refreshLeads', handleRefresh);
        socket.off('leadUpdated', handleLeadUpdated);
        socket.off('leadCreated', handleLeadCreated);
      };
    }
    
    return () => {
      window.removeEventListener('refreshLeads', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, socket]);

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
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Clean the update data to remove empty strings
      const cleanUpdateData = {};
      
      if (updateData.leadProgressStatus && updateData.leadProgressStatus !== '') {
        cleanUpdateData.leadProgressStatus = updateData.leadProgressStatus;
        // Add metadata for admin tracking
        cleanUpdateData.lastUpdatedBy = 'Agent2';
        cleanUpdateData.lastUpdatedAt = new Date().toISOString();
        cleanUpdateData.agent2LastAction = updateData.leadProgressStatus;
      }
      
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
      
      console.log('Update form data:', updateData);
      console.log('Sending update request with cleaned data:', cleanUpdateData);
      console.log('Selected lead ID:', selectedLead.leadId);
      
      // Check if we have any data to update
      if (Object.keys(cleanUpdateData).length === 0) {
        toast.error('Please select a Lead Progress Status to update');
        return;
      }
      
      const response = await axios.put(`/api/leads/${selectedLead.leadId}`, cleanUpdateData);
      console.log('Update response:', response.data);
      
      toast.success('Lead updated successfully!');
      
      // Refresh leads data first
      await fetchLeads();
      
      // Update the selected lead with new data to show immediately in view modal
      const updatedLead = { ...selectedLead, ...cleanUpdateData };
      setSelectedLead(updatedLead);
      
      // Close modal after a short delay to ensure data is refreshed
      setTimeout(() => {
        setShowUpdateModal(false);
        setUpdateData({
          leadProgressStatus: '',
          followUpDate: '',
          followUpTime: '',
          followUpNotes: '',
          conversionValue: ''
        });
      }, 500);
    } catch (error) {
      console.error('Error updating lead:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateData({
      leadProgressStatus: lead.leadProgressStatus || lead.agent2LastAction || '',
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
    // Log the lead data to debug
    console.log('Opening view modal for lead:', lead);
    console.log('Lead Progress Status:', lead.leadProgressStatus);
    console.log('Agent2 Last Action:', lead.agent2LastAction);
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

  const getLeadStats = () => {
    // Agent2 sees only today's assigned leads - daily reset
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysLeads = leads.filter(lead => {
      const leadDate = new Date(lead.assignedAt || lead.createdAt);
      return leadDate >= todayStart && leadDate <= todayEnd;
    });
    
    const total = todaysLeads.length;
    const newLeads = todaysLeads.filter(lead => lead.status === 'new').length;
    const interested = todaysLeads.filter(lead => lead.status === 'interested').length;
    const successful = todaysLeads.filter(lead => lead.status === 'successful').length;
    const followUp = todaysLeads.filter(lead => lead.status === 'follow-up').length;

    return { total, newLeads, interested, successful, followUp, todaysLeads };
  };

  const stats = getLeadStats();

  if (loading) {
    return <LoadingSpinner message="Loading leads..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Follow up on leads and update their status</p>
          {user && user.organization && (
            <div className="mt-2 flex items-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organization: {user.organization.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Assigned Leads Summary for Agent2 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Today's Assigned Leads</h3>
          <p className="text-sm text-gray-600">Agent2 views only today's assigned leads - Daily data reset for agents</p>
          <div className="mt-4 text-2xl font-bold text-green-600">
            {stats.todaysLeads?.length || 0} leads assigned today
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100">
              <AlertCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-xl font-bold text-gray-900">{stats.newLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Interested</p>
              <p className="text-xl font-bold text-gray-900">{stats.interested}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-xl font-bold text-gray-900">{stats.successful}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Follow Up</p>
              <p className="text-xl font-bold text-gray-900">{stats.followUp}</p>
            </div>
          </div>
        </div>
      </div>

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
                  Debt Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.todaysLeads?.map((lead) => (
                <tr key={lead.leadId || lead._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">
                        {lead.debtCategory ? `${lead.debtCategory.charAt(0).toUpperCase() + lead.debtCategory.slice(1)} Debt` : 'N/A'}
                      </div>
                      {lead.leadId && (
                        <div className="text-xs text-primary-600 font-mono">ID: {lead.leadId}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        Created by: {lead.createdBy?.name}
                      </div>
                      {lead.assignedBy && (
                        <div className="text-xs text-green-600">
                          Assigned by: {lead.assignedBy?.name}
                        </div>
                      )}
                      {lead.assignmentNotes && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {lead.assignmentNotes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maskEmail(lead.email)}</div>
                    <div className="text-sm text-gray-500">{maskPhone(lead.phone)}</div>
                    {lead.alternatePhone && (
                      <div className="text-xs text-gray-400">Alt: {maskPhone(lead.alternatePhone)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(lead.category, lead.completionPercentage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.totalDebtAmount ? maskAmount(lead.totalDebtAmount) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Array.isArray(lead.debtTypes) && lead.debtTypes.length > 0 
                      ? lead.debtTypes.slice(0, 2).join(', ') + (lead.debtTypes.length > 2 ? '...' : '')
                      : (lead.source || 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openViewModal(lead)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openUpdateModal(lead)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
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

                  {/* Additional Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Information</h4>
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
                      {selectedLead.lastUpdatedBy && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Last Updated By:</span>
                          <span className="ml-2 text-sm text-gray-900">{selectedLead.lastUpdatedBy}</span>
                        </div>
                      )}
                      {selectedLead.lastUpdatedAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(selectedLead.lastUpdatedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedLead.agent2LastAction && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Agent 2 Last Action:</span>
                          <span className="ml-2 text-sm font-semibold text-blue-700">
                            {selectedLead.agent2LastAction}
                          </span>
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
                </div>

                {/* Lead Progress Status - Prominent Display for Agent 2 */}
                {selectedLead.leadProgressStatus && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Current Lead Progress Status</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            Status: <span className="font-bold">{selectedLead.leadProgressStatus}</span>
                          </p>
                          {selectedLead.lastUpdatedAt && (
                            <p className="text-xs text-blue-600 mt-1">
                              Updated: {new Date(selectedLead.lastUpdatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent2 Status Fields */}
                {(selectedLead.leadProgressStatus || selectedLead.leadStatus || selectedLead.contactStatus || selectedLead.qualificationOutcome || 
                  selectedLead.callDisposition || selectedLead.engagementOutcome || selectedLead.disqualification) && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Agent Status Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLead.leadProgressStatus && (
                        <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                          <span className="text-sm font-medium text-gray-600">Lead Progress Status:</span>
                          <span className="ml-2 text-sm text-gray-900 font-semibold">
                            {selectedLead.leadProgressStatus}
                          </span>
                        </div>
                      )}
                      {selectedLead.leadStatus && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Lead Status:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.leadStatus.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {selectedLead.contactStatus && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Contact Status:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.contactStatus.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {selectedLead.qualificationOutcome && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Qualification:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.qualificationOutcome.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {selectedLead.callDisposition && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Call Disposition:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.callDisposition.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {selectedLead.engagementOutcome && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Engagement:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.engagementOutcome.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                      {selectedLead.disqualification && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Disqualification:</span>
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {selectedLead.disqualification.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {(selectedLead.requirements || selectedLead.followUpNotes) && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Notes</h4>
                    {selectedLead.requirements && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <span className="text-sm font-medium text-gray-600 block mb-1">Initial Notes:</span>
                        <p className="text-sm text-gray-900">{selectedLead.requirements}</p>
                      </div>
                    )}
                    {selectedLead.followUpNotes && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 block mb-1">Follow-up Notes:</span>
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
                  onClick={async () => {
                    await fetchLeads();
                    // Find and update the selected lead with fresh data
                    const updatedLeads = await axios.get(`/api/leads`);
                    const freshLead = updatedLeads.data?.data?.leads?.find(l => (l.leadId || l._id) === (selectedLead.leadId || selectedLead._id));
                    if (freshLead) {
                      setSelectedLead(freshLead);
                      console.log('Refreshed lead data:', freshLead);
                    }
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Refresh
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
                    {/* Unified Lead Progress Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lead Progress Status *</label>
                      <select
                        name="leadProgressStatus"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={updateData.leadProgressStatus}
                        onChange={(e) => setUpdateData({ ...updateData, leadProgressStatus: e.target.value })}
                      >
                        <option value="">Select Lead Progress Status</option>
                        {agent2LeadProgressOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Follow-up Date (show only if status requires follow-up) */}
                    {(updateData.leadProgressStatus === 'Callback Needed' || updateData.leadProgressStatus === 'Nurture – Not Ready') && (
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
                    {updateData.leadProgressStatus === 'Immediate Enrollment' && (
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
    </div>
  );
};

export default Agent2Dashboard;
