const mongoose = require('mongoose');
require('dotenv').config();
const Organization = require('../models/Organization');

const migrateToSimplifiedOrganizations = async () => {
  try {
    console.log('Starting migration to simplified organization schema...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
      console.log('Connected to MongoDB');
    }
    
    // Get all existing organizations
    const organizations = await Organization.find({});
    console.log(`Found ${organizations.length} organizations to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const org of organizations) {
      try {
        // Create a migration mapping from old fields to new fields
        const updateData = {
          // Map existing fields to new simplified schema
          name: org.name || 'Unknown Organization',
          ownerName: org.contactPersonName || 'Unknown Owner',
          spokPersonName: org.contactPersonName || org.name || 'Unknown Spokesperson',
          spokPersonPhone: org.contactPersonPhone || org.phone || '+911234567890', // Valid phone format
          expectedConnections: 10, // Default value
          country: org.country && ['India', 'Philippines', 'Zimbabwe'].includes(org.country) 
                  ? org.country 
                  : 'India', // Default to India if not specified or invalid
          state: org.state || '',
          city: org.city || '',
          pincode: org.zipCode || '',
          address: org.address || '',
          website: org.website || '',
          // Keep system fields
          isActive: org.isActive !== undefined ? org.isActive : true,
          createdBy: org.createdBy,
          createdAt: org.createdAt || new Date(),
          updatedAt: new Date()
        };

        // Validate and fix phone number format
        if (updateData.spokPersonPhone && !/^[\+]?[1-9][\d]{8,14}$/.test(updateData.spokPersonPhone.replace(/[\s\-\(\)\.]/g, ''))) {
          updateData.spokPersonPhone = '+911234567890'; // Default valid Indian number
        }

        // Update the organization with new schema
        await Organization.findByIdAndUpdate(
          org._id,
          { $set: updateData, $unset: {
            // Remove old fields that are no longer needed
            description: 1,
            email: 1,
            phone: 1,
            registrationNumber: 1,
            taxId: 1,
            industry: 1,
            size: 1,
            businessType: 1,
            yearEstablished: 1,
            contactPersonName: 1,
            contactPersonTitle: 1,
            contactPersonPhone: 1,
            contactPersonEmail: 1,
            zipCode: 1,
            linkedinUrl: 1,
            facebookUrl: 1,
            twitterUrl: 1,
            notes: 1
          }},
          { new: true, runValidators: true }
        );

        migrated++;
        console.log(`Migrated organization: ${org.name}`);
      } catch (error) {
        errors++;
        console.error(`Error migrating organization ${org.name}:`, error.message);
      }
    }

    console.log(`Migration completed. Successfully migrated: ${migrated}, Errors: ${errors}`);
    
    return {
      success: true,
      migrated,
      errors,
      total: organizations.length
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = migrateToSimplifiedOrganizations;

// If running this script directly
if (require.main === module) {
  const runMigration = async () => {
    try {
      const result = await migrateToSimplifiedOrganizations();
      console.log('Final result:', result);
      await mongoose.connection.close();
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('Script execution failed:', error);
      await mongoose.connection.close();
      process.exit(1);
    }
  };

  runMigration();
}
