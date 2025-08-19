const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}, 'name email role isActive').sort({ role: 1 });
    
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.name} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    // Check specifically for superadmin
    const superadmin = await User.findOne({ role: 'superadmin' });
    console.log('\n=== SUPERADMIN CHECK ===');
    if (superadmin) {
      console.log(`Found: ${superadmin.name} (${superadmin.email}) - ${superadmin.isActive ? 'Active' : 'Inactive'}`);
      
      // Test password
      const passwordMatch = await superadmin.comparePassword('SuperAdmin123!');
      console.log(`Password test: ${passwordMatch ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('No superadmin found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkUsers();
