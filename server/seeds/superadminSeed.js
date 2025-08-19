const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin - let pre-save middleware handle password hashing
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@lms.com',
      password: 'SuperAdmin123!', // Plain text - will be hashed by pre-save middleware
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();
    console.log('SuperAdmin created successfully!');
    console.log('Email: superadmin@lms.com');
    console.log('Password: SuperAdmin123!');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createSuperAdmin();
