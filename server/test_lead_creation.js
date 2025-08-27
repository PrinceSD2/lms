// Quick test to verify lead creation works
const axios = require('axios');

const testCreateLead = async () => {
  try {
    // First login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'agent1@example.com',
      password: 'Agent@123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token received');

    // Create a test lead with correct data
    const leadData = {
      name: 'Test User',
      debtCategory: 'secured',
      debtTypes: ['Auto Loans', 'Mortgage Loans'],
      source: 'Auto Loans',
      email: 'test@example.com',
      phone: '1234567890',
      totalDebtAmount: 50000,
      numberOfCreditors: 2,
      monthlyDebtPayment: 1500,
      creditScoreRange: '700-749', // Using valid enum value
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipcode: '12345'
    };

    const createResponse = await axios.post('http://localhost:5000/api/leads', leadData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Lead creation successful!');
    console.log('Response:', createResponse.data);
    console.log('Lead ID:', createResponse.data.data.leadId);

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

testCreateLead();
