const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@lms.com' 
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@lms.com',
      password: process.env.ADMIN_PASSWORD || 'admin123!@#',
      role: 'admin'
    });

    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('ID:', admin._id);

    process.exit(0);

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAdmin();
