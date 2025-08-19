const axios = require('axios');

// Test creating a lead with minimal data to see validation
async function testLead() {
  try {
    const response = await axios.post('http://localhost:5000/api/leads', {
      name: 'Test User',
      email: 'test@example.com'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
  }
}

testLead();
