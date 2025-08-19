const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createProperSuperadmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and delete existing superadmin
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      await User.deleteOne({ role: 'superadmin' });
      console.log('Deleted existing superadmin');
    }

    // Create new superadmin - let the pre-save middleware handle password hashing
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@lms.com',
      password: 'SuperAdmin123!', // Plain text - will be hashed by pre-save middleware
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();
    console.log('New SuperAdmin created successfully!');
    
    // Test the login
    const testUser = await User.findByEmail('superadmin@lms.com').select('+password');
    if (testUser) {
      const isMatch = await testUser.comparePassword('SuperAdmin123!');
      console.log(`Password test result: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
      console.log('SuperAdmin details:', {
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createProperSuperadmin();
