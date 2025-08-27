const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Lead = require('./models/Lead');

mongoose.connect('mongodb+srv://rgcare10:Admin%40123@rgcare.hk8kxls.mongodb.net/LMSDATABASE').then(async () => {
  console.log('Connected to MongoDB');
  
  // Find the agent1 user
  const agent1User = await User.findOne({ role: 'agent1' });
  console.log('Agent1 user found:', agent1User ? agent1User.email : 'None');
  console.log('Agent1 user ID:', agent1User ? agent1User._id : 'None');
  
  if (agent1User) {
    // Check leads created by this agent1
    const agent1Leads = await Lead.find({ createdBy: agent1User._id });
    console.log('Leads created by agent1:', agent1Leads.length);
    agent1Leads.forEach((lead, index) => {
      console.log('Lead ' + (index + 1) + ': ' + lead.name + ' - Category: ' + lead.category + ' - AdminProcessed: ' + lead.adminProcessed);
    });
    
    // Check filter conditions (what agent1 should see)
    const filter = { createdBy: agent1User._id, adminProcessed: { $ne: true } };
    const filteredLeads = await Lead.find(filter);
    console.log('Leads after filtering (should show in UI):', filteredLeads.length);
    
    // Check total leads in database
    const totalLeads = await Lead.countDocuments({});
    console.log('Total leads in database:', totalLeads);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
