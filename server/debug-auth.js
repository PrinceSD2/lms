const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check users in database
    const users = await User.find({});
    console.log('Users in database:', users.length);
    
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Admin users:', adminUsers.map(u => ({ 
      email: u.email, 
      name: u.name, 
      id: u._id,
      isActive: u.isActive 
    })));

    // Try to login with each admin user
    for (const admin of adminUsers) {
      console.log(`\nTesting login for: ${admin.email}`);
      
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: admin.email,
          password: process.env.ADMIN_PASSWORD
        });
        
        console.log('Login successful for:', admin.email);
        console.log('Token received:', response.data.data.token ? 'Yes' : 'No');
        
        // Test protected endpoint
        const token = response.data.data.token;
        const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Protected endpoint successful for:', admin.email);
        break; // Exit loop on first successful login
        
      } catch (error) {
        console.log('Login failed for:', admin.email, '- Error:', error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testAuth();
