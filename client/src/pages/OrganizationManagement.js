import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  UserPlus,
  Search,
  Filter
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateOrganizationForm } from '../utils/validation';

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    spokPersonName: '',
    spokPersonPhone: '',
    expectedConnections: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    address: '',
    website: ''
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/organizations');
      setOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateOrganizationForm(organizationForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    try {
      await axios.post('/api/organizations', organizationForm);
      toast.success('Organization created successfully!');
      setOrganizationForm({
        name: '',
        ownerName: '',
        ownerPhone: '',
        spokPersonName: '',
        spokPersonPhone: '',
        expectedConnections: '',
        country: '',
        state: '',
        city: '',
        pincode: '',
        address: '',
        website: ''
      });
      setShowCreateModal(false);
      fetchOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateOrganizationForm(organizationForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    try {
      await axios.put(`/api/organizations/${selectedOrg._id}`, organizationForm);
      toast.success('Organization updated successfully!');
      setShowEditModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrganization = async (orgId, orgName) => {
    if (window.confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/organizations/${orgId}`);
        toast.success('Organization deleted successfully');
        fetchOrganizations();
      } catch (error) {
        console.error('Error deleting organization:', error);
        toast.error(error.response?.data?.message || 'Failed to delete organization');
      }
    }
  };

  const handleToggleOrganizationStatus = async (orgId, currentStatus) => {
    try {
      await axios.put(`/api/organizations/${orgId}/status`, { isActive: !currentStatus });
      toast.success(`Organization ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization status:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`/api/organizations/${selectedOrg._id}/users`, userForm);
      toast.success(`${userForm.role} created successfully!`);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'admin'
      });
      setShowUserModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setOrganizationForm({
      name: org.name || '',
      ownerName: org.ownerName || '',
      ownerPhone: org.ownerPhone || '',
      spokPersonName: org.spokPersonName || '',
      spokPersonPhone: org.spokPersonPhone || '',
      expectedConnections: org.expectedConnections || '',
      country: org.country || '',
      state: org.state || '',
      city: org.city || '',
      pincode: org.pincode || '',
      address: org.address || '',
      website: org.website || ''
    });
    setShowEditModal(true);
  };

  const openUserModal = (org) => {
    setSelectedOrg(org);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'admin'
    });
    setShowUserModal(true);
  };



  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = org.name.toLowerCase().includes(searchLower) ||
                         (org.description && org.description.toLowerCase().includes(searchLower)) ||
                         (org.industry && org.industry.toLowerCase().includes(searchLower)) ||
                         (org.city && org.city.toLowerCase().includes(searchLower)) ||
                         (org.country && org.country.toLowerCase().includes(searchLower)) ||
                         (org.contactPersonName && org.contactPersonName.toLowerCase().includes(searchLower)) ||
                         (org.email && org.email.toLowerCase().includes(searchLower));
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && org.isActive) ||
                         (filterStatus === 'inactive' && !org.isActive);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <LoadingSpinner message="Loading organizations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            Organization Management
          </h1>
          <p className="text-gray-600">Create and manage organizations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Organization
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(org => org.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.reduce((total, org) => total + (org.userCounts?.total || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <UserPlus className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.reduce((total, org) => total + (org.userCounts?.admin || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Organizations ({filteredOrganizations.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry & Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrganizations.map((org) => (
                <tr key={org._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      {org.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {org.description}
                        </div>
                      )}
                      {org.businessType && (
                        <div className="text-xs text-blue-600 mt-1">
                          {org.businessType}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {org.industry && (
                        <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mb-1 inline-block">
                          {org.industry}
                        </div>
                      )}
                      {org.size && (
                        <div className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block">
                          {org.size} employees
                        </div>
                      )}
                      {org.yearEstablished && (
                        <div className="text-xs text-gray-500 mt-1">
                          Est. {org.yearEstablished}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {org.email && <div>{org.email}</div>}
                      {org.phone && <div>{org.phone}</div>}
                      {org.contactPersonName && (
                        <div className="text-xs text-gray-500 mt-1">
                          Contact: {org.contactPersonName}
                          {org.contactPersonTitle && ` (${org.contactPersonTitle})`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {org.city && org.country && (
                        <div>{org.city}, {org.country}</div>
                      )}
                      {org.state && (
                        <div className="text-xs text-gray-500">{org.state}</div>
                      )}
                      {org.zipCode && (
                        <div className="text-xs text-gray-500">{org.zipCode}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Admin: {org.userCounts?.admin || 0}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Agents: {(org.userCounts?.agent1 || 0) + (org.userCounts?.agent2 || 0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {org.userCounts?.total || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(org.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUserModal(org)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Add User"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(org)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      {/* Toggle Switch for Active/Inactive */}
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleOrganizationStatus(org._id, org.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            org.isActive ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                          title={org.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              org.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-xs font-medium ${
                          org.isActive ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {org.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteOrganization(org._id, org.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrganizations.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No organizations found matching your criteria.' 
                      : 'No organizations found. Create your first organization to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowCreateModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleCreateOrganization}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Create New Organization</h3>
                    <p className="text-sm text-gray-500">Enter organization details for India, Philippines, or Zimbabwe</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.name}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, name: e.target.value })}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Owner Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.ownerName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.ownerName}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, ownerName: e.target.value })}
                      />
                      {validationErrors.ownerName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Owner Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.ownerPhone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.ownerPhone}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, ownerPhone: e.target.value })}
                        placeholder="Enter owner's phone number"
                      />
                      {validationErrors.ownerPhone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.ownerPhone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spokesperson Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.spokPersonName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.spokPersonName}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, spokPersonName: e.target.value })}
                      />
                      {validationErrors.spokPersonName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.spokPersonName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spokesperson Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.spokPersonPhone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.spokPersonPhone}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, spokPersonPhone: e.target.value })}
                      />
                      {validationErrors.spokPersonPhone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.spokPersonPhone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Connections <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.expectedConnections ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.expectedConnections}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, expectedConnections: e.target.value })}
                      />
                      {validationErrors.expectedConnections && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.expectedConnections}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.country ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.country}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, country: e.target.value, state: '', pincode: '' })}
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                      </select>
                      {validationErrors.country && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.state}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, state: e.target.value })}
                        placeholder={
                          organizationForm.country === 'India' ? 'e.g., Maharashtra, Delhi' :
                          organizationForm.country === 'Philippines' ? 'e.g., Metro Manila, Cebu' :
                          organizationForm.country === 'Zimbabwe' ? 'e.g., Harare, Bulawayo' :
                          'Enter state/province'
                        }
                      />
                      {validationErrors.state && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.city}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, city: e.target.value })}
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode/Postal Code
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.pincode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.pincode}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, pincode: e.target.value })}
                        placeholder={
                          organizationForm.country === 'India' ? '6 digits (e.g., 400001)' :
                          organizationForm.country === 'Philippines' ? '4 digits (e.g., 1000)' :
                          organizationForm.country === 'Zimbabwe' ? 'Postal code' :
                          'Postal code'
                        }
                      />
                      {validationErrors.pincode && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.pincode}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.address}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, address: e.target.value })}
                        placeholder="Street address, building details, etc."
                      />
                      {validationErrors.address && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.website ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={organizationForm.website}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, website: e.target.value })}
                        placeholder="https://www.example.com"
                      />
                      {validationErrors.website && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.website}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowEditModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleUpdateOrganization}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Edit Organization</h3>
                    <p className="text-sm text-gray-500">Update organization details</p>
                  </div>

                  {/* Simplified Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.name}
                        onChange={(e) => setOrganizationForm({...organizationForm, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.ownerName}
                        onChange={(e) => setOrganizationForm({...organizationForm, ownerName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter owner phone number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.ownerPhone}
                        onChange={(e) => setOrganizationForm({...organizationForm, ownerPhone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Spokesperson Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.spokPersonName}
                        onChange={(e) => setOrganizationForm({...organizationForm, spokPersonName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Spokesperson Phone *</label>
                      <input
                        type="tel"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.spokPersonPhone}
                        onChange={(e) => setOrganizationForm({...organizationForm, spokPersonPhone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Connections *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.expectedConnections}
                        onChange={(e) => setOrganizationForm({...organizationForm, expectedConnections: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country *</label>
                      <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.country}
                        onChange={(e) => setOrganizationForm({...organizationForm, country: e.target.value})}
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">State/Province</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.state}
                        onChange={(e) => setOrganizationForm({...organizationForm, state: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.city}
                        onChange={(e) => setOrganizationForm({...organizationForm, city: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode/Postal Code</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.pincode}
                        onChange={(e) => setOrganizationForm({...organizationForm, pincode: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.address}
                        onChange={(e) => setOrganizationForm({...organizationForm, address: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website URL</label>
                      <input
                        type="url"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={organizationForm.website}
                        onChange={(e) => setOrganizationForm({...organizationForm, website: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && selectedOrg && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowUserModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateUser}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add User to {selectedOrg.name}</h3>
                    <p className="text-sm text-gray-500">Create a new user account</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                        required
                        minLength="6"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 6 characters with uppercase, lowercase, and number
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role *</label>
                      <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      >
                        <option value="admin">Admin</option>
                        <option value="agent1">Agent 1</option>
                        <option value="agent2">Agent 2</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowUserModal(false)}
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

export default OrganizationManagement;
