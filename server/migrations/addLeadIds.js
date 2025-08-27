const mongoose = require('mongoose');
const Lead = require('../models/Lead');
require('dotenv').config();

// Function to generate lead ID for migration
const generateMigrationLeadId = (index, createdAt) => {
  const date = new Date(createdAt);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = String(index + 1).padStart(4, '0');
  return `LEAD${year}${month}${sequence}`;
};

const addLeadIdsToExistingLeads = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all leads without leadId
    const leadsWithoutId = await Lead.find({ leadId: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${leadsWithoutId.length} leads without leadId`);

    if (leadsWithoutId.length === 0) {
      console.log('All leads already have leadId. Migration not needed.');
      process.exit(0);
    }

    // Group leads by creation date for proper sequencing
    const leadsByDate = {};
    leadsWithoutId.forEach(lead => {
      const dateKey = lead.createdAt.toISOString().split('T')[0];
      if (!leadsByDate[dateKey]) {
        leadsByDate[dateKey] = [];
      }
      leadsByDate[dateKey].push(lead);
    });

    let totalUpdated = 0;

    // Process each date group
    for (const dateKey of Object.keys(leadsByDate)) {
      const dateLeads = leadsByDate[dateKey];
      console.log(`Processing ${dateLeads.length} leads for date ${dateKey}`);

      for (let i = 0; i < dateLeads.length; i++) {
        const lead = dateLeads[i];
        const leadId = generateMigrationLeadId(i, lead.createdAt);
        
        // Update the lead with the new leadId
        await Lead.updateOne(
          { _id: lead._id },
          { $set: { leadId: leadId } }
        );
        
        console.log(`Updated lead ${lead._id} with leadId: ${leadId}`);
        totalUpdated++;
      }
    }

    console.log(`Successfully updated ${totalUpdated} leads with leadId`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the migration
addLeadIdsToExistingLeads();
