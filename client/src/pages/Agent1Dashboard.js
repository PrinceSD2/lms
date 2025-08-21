import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Agent1Dashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Add a map of debt types by category
  const DEBT_TYPES_BY_CATEGORY = {
    secured: [
      'Mortgage Loans',
      'Auto Loans',
      'Secured Personal Loans',
      'Home Equity Loans',
      'Title Loans'
    ],
    unsecured: [
      'Credit Cards',
      'Instalment Loans (Unsecured)',
      'Medical Bills',
      'Utility Bills',
      'Payday Loans',
      'Student Loans (private loan)',
      'Store/Charge Cards',
      'Overdraft Balances',
      'Business Loans (unsecured)',
      'Collection Accounts'
    ]
  };

  const CATEGORY_LABELS = {
    secured: 'Secured',
    unsecured: 'Unsecured'
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    debtCategory: 'unsecured',
    debtTypes: [],
    totalDebtAmount: '',
    numberOfCreditors: '',
    monthlyDebtPayment: '',
    creditScoreRange: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    notes: ''
  });

  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0
  });

  useEffect(() => {
    fetchLeads();
    
    // Listen for real-time updates
    const handleRefresh = () => fetchLeads();
    window.addEventListener('refreshLeads', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshLeads', handleRefresh);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get('/api/leads?page=1&limit=10');
      const leadsData = response.data?.data?.leads;
      const validLeads = Array.isArray(leadsData) ? leadsData : [];
      setLeads(validLeads);
      
      // Calculate stats
      const total = validLeads.length;
      const hot = validLeads.filter(lead => lead.category === 'hot').length;
      const warm = validLeads.filter(lead => lead.category === 'warm').length;
      const cold = validLeads.filter(lead => lead.category === 'cold').length;
      
      setStats({ totalLeads: total, hotLeads: hot, warmLeads: warm, coldLeads: cold });
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
      setLeads([]);
      setStats({ totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // New: category change (clears selected types)
  const handleDebtCategoryChange = (e) => {
    const next = e.target.value;
    setFormData((prev) => ({
      ...prev,
      debtCategory: next,
      debtTypes: []
    }));
  };

  // Toggle individual debt type selection (checkbox)
  const handleDebtTypeToggle = (type) => {
    setFormData((prev) => {
      const exists = prev.debtTypes.includes(type);
      return {
        ...prev,
        debtTypes: exists
          ? prev.debtTypes.filter(t => t !== type)
          : [...prev.debtTypes, type]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('Form submission started');
      console.log('Form data:', formData);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('User role:', user?.role);
      
      // Build complete form data
      const cleanFormData = {
        name: formData.name.trim(),
      };

      // Include category and selected types
      if (formData.debtCategory) {
        cleanFormData.debtCategory = formData.debtCategory;
      }
      if (Array.isArray(formData.debtTypes) && formData.debtTypes.length > 0) {
        cleanFormData.debtTypes = formData.debtTypes;
        
        // Map debt types to valid source values
        const debtTypeToSource = {
          'Credit Cards': 'Credit Card Debt',
          'Mortgage Loans': 'Mortgage Debt',
          'Auto Loans': 'Auto Loans',
          'Student Loans (private loan)': 'Student Loans',
          'Medical Bills': 'Medical Debt',
          'Personal Loans': 'Personal Loans',
          'Payday Loans': 'Payday Loans',
          'Secured Personal Loans': 'Secured Debt',
          'Home Equity Loans': 'Home Equity Loans (HELOCs)',
          'Title Loans': 'Secured Debt',
          'Instalment Loans (Unsecured)': 'Installment Debt',
          'Utility Bills': 'Personal Debt',
          'Store/Charge Cards': 'Credit Card Debt',
          'Overdraft Balances': 'Personal Debt',
          'Business Loans (unsecured)': 'Personal Debt',
          'Collection Accounts': 'Personal Debt'
        };
        
        const firstDebtType = formData.debtTypes[0];
        cleanFormData.source = debtTypeToSource[firstDebtType] || 'Personal Debt';
      } else {
        cleanFormData.source = {
          secured: 'Secured Debt',
          unsecured: 'Unsecured Debt'
        }[formData.debtCategory] || 'Personal Debt';
      }

      // Add contact information
      if (formData.email && formData.email.trim() !== '') {
        cleanFormData.email = formData.email.trim();
      }
      if (formData.phone && formData.phone.trim() !== '') {
        cleanFormData.phone = formData.phone.trim();
      }
      if (formData.alternatePhone && formData.alternatePhone.trim() !== '') {
        cleanFormData.alternatePhone = formData.alternatePhone.trim();
      }

      // Add debt information
      if (formData.totalDebtAmount && formData.totalDebtAmount !== '' && !isNaN(formData.totalDebtAmount)) {
        cleanFormData.totalDebtAmount = parseFloat(formData.totalDebtAmount);
      }
      if (formData.numberOfCreditors && formData.numberOfCreditors !== '' && !isNaN(formData.numberOfCreditors)) {
        cleanFormData.numberOfCreditors = parseInt(formData.numberOfCreditors, 10);
      }
      if (formData.monthlyDebtPayment && formData.monthlyDebtPayment !== '' && !isNaN(formData.monthlyDebtPayment)) {
        cleanFormData.monthlyDebtPayment = parseFloat(formData.monthlyDebtPayment);
      }
      if (formData.creditScoreRange && formData.creditScoreRange.trim() !== '') {
        cleanFormData.creditScoreRange = formData.creditScoreRange.trim();
      }
      if (formData.notes && formData.notes.trim() !== '') {
        cleanFormData.notes = formData.notes.trim();
      }

      // Add address information
      if (formData.address && formData.address.trim() !== '') {
        cleanFormData.address = formData.address.trim();
      }
      if (formData.city && formData.city.trim() !== '') {
        cleanFormData.city = formData.city.trim();
      }
      if (formData.state && formData.state.trim() !== '') {
        cleanFormData.state = formData.state.trim();
      }
      if (formData.zipcode && formData.zipcode.trim() !== '') {
        cleanFormData.zipcode = formData.zipcode.trim();
      }

      console.log('Agent1 sending create request with cleaned data:', cleanFormData);
      console.log('Axios defaults:', { baseURL: axios.defaults.baseURL, timeout: axios.defaults.timeout });
      console.log('Making request to:', '/api/leads');

      const response = await axios.post('/api/leads', cleanFormData);
      console.log('Lead creation response:', response);
      console.log('Lead creation response data:', response.data);
      toast.success('Lead added successfully!');

      setFormData({
        name: '',
        email: '',
        phone: '',
        alternatePhone: '',
        debtCategory: 'unsecured',
        debtTypes: [],
        totalDebtAmount: '',
        numberOfCreditors: '',
        monthlyDebtPayment: '',
        creditScoreRange: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        notes: ''
      });
      setShowForm(false);

      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
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

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Manage your leads and track your progress</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600" />
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
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warm Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.warmLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cold Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.coldLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maskEmail(lead.email)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maskPhone(lead.phone)}</div>
                    {lead.alternatePhone && (
                      <div className="text-xs text-gray-500">Alt: {maskPhone(lead.alternatePhone)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Array.isArray(lead.debtTypes) && lead.debtTypes.length > 0
                        ? lead.debtTypes.join(', ')
                        : (lead.source || (lead.debtCategory ? ({
                              secured: 'Secured Debt',
                              unsecured: 'Unsecured Debt'
                            }[lead.debtCategory]) : '—'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.totalDebtAmount && (
                        <div>Debt: {maskAmount(lead.totalDebtAmount)}</div>
                      )}
                      {lead.numberOfCreditors && (
                        <div className="text-xs text-gray-500">Creditors: {lead.numberOfCreditors}</div>
                      )}
                      {lead.monthlyDebtPayment && (
                        <div className="text-xs text-gray-500">Monthly: {maskAmount(lead.monthlyDebtPayment)}</div>
                      )}
                      {lead.creditScoreRange && (
                        <div className="text-xs text-gray-500">Credit: ***-***</div>
                      )}
                      {!lead.totalDebtAmount && !lead.numberOfCreditors && !lead.monthlyDebtPayment && !lead.creditScoreRange && '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(lead.category, lead.completionPercentage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No leads found. Create your first lead to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowForm(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New Lead</h3>
                    <p className="text-sm text-gray-500">Enter lead information below</p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Email and Credit Score on one line, email wider */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Credit Score</label>
                        <input
                          type="number"
                          name="creditScore"
                          min="0"
                          max="850"
                          pattern="\d{1,3}"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.creditScore || ""}
                          onChange={e => {
                            // Only allow up to 3 digits
                            let val = e.target.value.replace(/[^\d]/g, "");
                            if (val.length > 3) val = val.slice(0, 3);
                            // Clamp to max 850
                            if (parseInt(val, 10) > 850) val = "850";
                            setFormData({ ...formData, creditScore: val });
                          }}
                        />
                      </div>
                    </div>

                    {/* Phone and Alternate on one line */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Alternate Phone</label>
                        <input
                          type="tel"
                          name="alternatePhone"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.alternatePhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Debt Amount</label>
                        <input
                          type="number"
                          name="totalDebtAmount"
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.totalDebtAmount}
                          onChange={handleInputChange}
                          placeholder="$"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Creditors</label>
                        <input
                          type="number"
                          name="numberOfCreditors"
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.numberOfCreditors}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Monthly Debt Payment</label>
                        <input
                          type="number"
                          name="monthlyDebtPayment"
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.monthlyDebtPayment}
                          onChange={handleInputChange}
                          placeholder="$"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Credit Score Range</label>
                        <select
                          name="creditScoreRange"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.creditScoreRange}
                          onChange={handleInputChange}
                        >
                          <option value="">Select range</option>
                          <option value="300-549">Poor (300-549)</option>
                          <option value="550-649">Fair (550-649)</option>
                          <option value="650-699">Good (650-699)</option>
                          <option value="700-749">Very Good (700-749)</option>
                          <option value="750-850">Excellent (750-850)</option>
                        </select>
                      </div>
                    </div>

                    {/* Company */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        name="company"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div> */}

                    {/* Debt Type: single category (radios) + multi-select types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Debt Type</label>

                      {/* Category radios */}
                      <div className="mt-2 flex flex-wrap gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="debtCategory"
                            value="secured"
                            checked={formData.debtCategory === 'secured'}
                            onChange={handleDebtCategoryChange}
                          />
                          <span>Secured</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="debtCategory"
                            value="unsecured"
                            checked={formData.debtCategory === 'unsecured'}
                            onChange={handleDebtCategoryChange}
                          />
                          <span>Unsecured</span>
                        </label>
                      </div>

                      {/* Types within the selected category */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DEBT_TYPES_BY_CATEGORY[formData.debtCategory].map((type) => (
                          <label key={type} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.debtTypes.includes(type)}
                              onChange={() => handleDebtTypeToggle(type)}
                            />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        name="address"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* City, State, Zipcode */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          name="city"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          name="state"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Zip code</label>
                        <input
                          type="text"
                          name="zipcode"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          value={formData.zipcode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        value={formData.notes}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Lead'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowForm(false)}
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

export default Agent1Dashboard;
