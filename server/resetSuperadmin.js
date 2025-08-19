const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const resetSuperadmin = async () => {
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

    // Create new superadmin with manually hashed password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', saltRounds);
    
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@lms.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });

    // Skip pre-save middleware by directly saving the hashed password
    await superAdmin.save({ validateBeforeSave: false });
    
    console.log('New SuperAdmin created successfully!');
    
    // Test the login
    const testUser = await User.findByEmail('superadmin@lms.com').select('+password');
    if (testUser) {
      const isMatch = await bcrypt.compare('SuperAdmin123!', testUser.password);
      console.log(`Password test result: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

resetSuperadmin();
