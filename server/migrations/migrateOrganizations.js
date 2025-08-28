const mongoose = require('mongoose');
const Organization = require('../models/Organization');

// Migration script to add new fields to existing organizations
const migrateOrganizations = async () => {
  try {
    console.log('Starting organization migration...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    }

    // Find all organizations that don't have the new fields
    const organizations = await Organization.find({
      $or: [
        { registrationNumber: { $exists: false } },
        { taxId: { $exists: false } },
        { industry: { $exists: false } },
        { size: { $exists: false } },
        { businessType: { $exists: false } },
        { yearEstablished: { $exists: false } },
        { contactPersonName: { $exists: false } },
        { contactPersonTitle: { $exists: false } },
        { contactPersonPhone: { $exists: false } },
        { contactPersonEmail: { $exists: false } },
        { country: { $exists: false } },
        { state: { $exists: false } },
        { city: { $exists: false } },
        { zipCode: { $exists: false } },
        { linkedinUrl: { $exists: false } },
        { facebookUrl: { $exists: false } },
        { twitterUrl: { $exists: false } },
        { notes: { $exists: false } }
      ]
    });

    console.log(`Found ${organizations.length} organizations to update`);

    if (organizations.length === 0) {
      console.log('No organizations need migration');
      return;
    }

    // Update each organization with default values for new fields
    for (const org of organizations) {
      const updateFields = {
        updatedAt: new Date()
      };

      // Add missing fields with empty defaults
      if (!org.registrationNumber && org.registrationNumber !== '') updateFields.registrationNumber = '';
      if (!org.taxId && org.taxId !== '') updateFields.taxId = '';
      if (!org.industry && org.industry !== '') updateFields.industry = '';
      if (!org.size && org.size !== '') updateFields.size = '';
      if (!org.businessType && org.businessType !== '') updateFields.businessType = '';
      if (!org.yearEstablished) updateFields.yearEstablished = null;
      if (!org.contactPersonName && org.contactPersonName !== '') updateFields.contactPersonName = '';
      if (!org.contactPersonTitle && org.contactPersonTitle !== '') updateFields.contactPersonTitle = '';
      if (!org.contactPersonPhone && org.contactPersonPhone !== '') updateFields.contactPersonPhone = '';
      if (!org.contactPersonEmail && org.contactPersonEmail !== '') updateFields.contactPersonEmail = '';
      if (!org.country && org.country !== '') updateFields.country = '';
      if (!org.state && org.state !== '') updateFields.state = '';
      if (!org.city && org.city !== '') updateFields.city = '';
      if (!org.zipCode && org.zipCode !== '') updateFields.zipCode = '';
      if (!org.linkedinUrl && org.linkedinUrl !== '') updateFields.linkedinUrl = '';
      if (!org.facebookUrl && org.facebookUrl !== '') updateFields.facebookUrl = '';
      if (!org.twitterUrl && org.twitterUrl !== '') updateFields.twitterUrl = '';
      if (!org.notes && org.notes !== '') updateFields.notes = '';

      await Organization.findByIdAndUpdate(org._id, updateFields);
      console.log(`Updated organization: ${org.name}`);
    }

    console.log('Organization migration completed successfully');

  } catch (error) {
    console.error('Error during organization migration:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateOrganizations()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateOrganizations;
