const mongoose = require('mongoose');
require('dotenv').config();

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connection: WORKING');
    
    const User = require('./models/User');
    const Lead = require('./models/Lead');
    
    const userCount = await User.countDocuments();
    const leadCount = await Lead.countDocuments();
    
    console.log(`✅ Database Stats: ${userCount} users, ${leadCount} leads`);
    
    const adminUser = await User.findOne({role: 'admin'});
    console.log(`✅ Admin User: ${adminUser ? adminUser.email : 'NOT FOUND'}`);
    
    // Test agent users
    const agents = await User.find({role: {$in: ['agent1', 'agent2']}});
    console.log(`✅ Agent Users: ${agents.length} found`);
    agents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.email}) - ${agent.role} - ${agent.isActive ? 'Active' : 'Inactive'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Database Error:', error.message);
    process.exit(1);
  }
}
testDB();
