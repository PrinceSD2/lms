const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');

const createReddingtonOrganization = async () => {
  try {
    console.log('Setting up Reddington organization...');

    // Check if Reddington organization already exists
    let reddingtonOrg = await Organization.findOne({ 
      name: 'Reddington',
      organizationType: 'main'
    });

    if (reddingtonOrg) {
      console.log('Reddington organization already exists:', reddingtonOrg.name);
    } else {
      // Find or create superadmin
      let superadmin = await User.findOne({ role: 'superadmin' });
      
      if (!superadmin) {
        console.log('Creating superadmin user...');
        const hashedPassword = await bcrypt.hash('superadmin123', 12);
        superadmin = await User.create({
          name: 'Super Admin',
          email: 'superadmin@lms.com',
          password: hashedPassword,
          role: 'superadmin',
          isActive: true
        });
        console.log('Superadmin created successfully');
      }

      // Create Reddington organization
      reddingtonOrg = await Organization.create({
        name: 'Reddington',
        ownerName: 'Reddington Management',
        spokPersonName: 'John Reddington',
        spokPersonPhone: '+12345678901',
        expectedConnections: 1000,
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        pincode: '400001',
        address: '123 Business District, Mumbai',
        organizationType: 'main',
        isActive: true,
        createdBy: superadmin._id
      });

      console.log('Reddington organization created successfully:', reddingtonOrg.name);
    }

    // Create sample Reddington Admin
    let reddingtonAdmin = await User.findOne({ 
      email: 'admin@reddington.com',
      role: 'admin'
    });

    if (!reddingtonAdmin) {
      console.log('Creating Reddington admin...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      reddingtonAdmin = await User.create({
        name: 'Reddington Admin',
        email: 'admin@reddington.com',
        password: hashedPassword,
        role: 'admin',
        organization: reddingtonOrg._id,
        isActive: true,
        createdBy: reddingtonOrg.createdBy
      });
      console.log('Reddington admin created successfully');
    }

    // Create sample Reddington Agent1
    let reddingtonAgent1 = await User.findOne({ 
      email: 'agent1@reddington.com',
      role: 'agent1'
    });

    if (!reddingtonAgent1) {
      console.log('Creating Reddington Agent1...');
      const hashedPassword = await bcrypt.hash('agent1123', 12);
      reddingtonAgent1 = await User.create({
        name: 'Reddington Agent1',
        email: 'agent1@reddington.com',
        password: hashedPassword,
        role: 'agent1',
        organization: reddingtonOrg._id,
        isActive: true,
        createdBy: reddingtonOrg.createdBy
      });
      console.log('Reddington Agent1 created successfully');
    }

    // Create sample Reddington Agent2s
    const agent2Emails = [
      'agent2-1@reddington.com',
      'agent2-2@reddington.com',
      'agent2-3@reddington.com'
    ];

    for (let i = 0; i < agent2Emails.length; i++) {
      const email = agent2Emails[i];
      let agent2 = await User.findOne({ email, role: 'agent2' });

      if (!agent2) {
        console.log(`Creating Reddington Agent2 ${i + 1}...`);
        const hashedPassword = await bcrypt.hash('agent2123', 12);
        agent2 = await User.create({
          name: `Reddington Agent2 ${i + 1}`,
          email: email,
          password: hashedPassword,
          role: 'agent2',
          organization: reddingtonOrg._id,
          isActive: true,
          createdBy: reddingtonOrg.createdBy
        });
        console.log(`Reddington Agent2 ${i + 1} created successfully`);
      }
    }

    console.log('\n=== REDDINGTON SETUP COMPLETE ===');
    console.log('Organization:', reddingtonOrg.name);
    console.log('Type:', reddingtonOrg.organizationType);
    console.log('\nLogin Credentials:');
    console.log('SuperAdmin: superadmin@lms.com / superadmin123');
    console.log('Admin: admin@reddington.com / admin123');
    console.log('Agent1: agent1@reddington.com / agent1123');
    console.log('Agent2-1: agent2-1@reddington.com / agent2123');
    console.log('Agent2-2: agent2-2@reddington.com / agent2123');
    console.log('Agent2-3: agent2-3@reddington.com / agent2123');
    console.log('=====================================\n');

    return reddingtonOrg;

  } catch (error) {
    console.error('Error setting up Reddington organization:', error);
    throw error;
  }
};

module.exports = { createReddingtonOrganization };

// If run directly
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error('Database connection failed:', error.message);
      process.exit(1);
    }
  };
  
  const runSeed = async () => {
    try {
      await connectDB();
      await createReddingtonOrganization();
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  };

  runSeed();
}
