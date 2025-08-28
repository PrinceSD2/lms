const express = require('express');
const { body } = require('express-validator');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Validation rules
const organizationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters'),
  
  body('ownerName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Owner name is required and cannot exceed 100 characters'),
  
  body('spokPersonName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Spokesperson name is required and cannot exceed 100 characters'),
  
  body('spokPersonPhone')
    .trim()
    .isLength({ min: 8, max: 25 })
    .matches(/^[\+]?[\d\s\-\(\)\.]+$/)
    .withMessage('Please enter a valid phone number (8-25 characters, numbers and common symbols only)'),
  
  body('expectedConnections')
    .isInt({ min: 1 })
    .withMessage('Expected connections must be a positive number'),
  
  body('country')
    .trim()
    .isIn(['India', 'Philippines', 'Zimbabwe'])
    .withMessage('Country must be India, Philippines, or Zimbabwe'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),
  
  body('pincode')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!value) return true; // Optional field
      
      const country = req.body.country?.toLowerCase();
      
      switch (country) {
        case 'india':
          return /^[1-9][0-9]{5}$/.test(value);
        case 'philippines':
          return /^[0-9]{4}$/.test(value);
        case 'zimbabwe':
          return /^[A-Za-z0-9\s]{3,10}$/.test(value);
        default:
          return /^[A-Za-z0-9\s\-]{3,10}$/.test(value);
      }
    })
    .withMessage('Please enter a valid postal code for the selected country'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address cannot exceed 300 characters'),
  
  body('website')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty
      // Simple URL validation that's more lenient
      return /^https?:\/\/.+\..+/.test(value);
    })
    .withMessage('Please enter a valid website URL starting with http:// or https://')
];

const userValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'agent1', 'agent2'])
    .withMessage('Role must be admin, agent1, or agent2')
];

// @desc    Create organization (SuperAdmin only)
// @route   POST /api/organizations
// @access  Private (SuperAdmin only)
router.post('/', protect, organizationValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('=== ORGANIZATION CREATION REQUEST ===');
    console.log('User:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('=====================================');

    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      console.log('Access denied: User role is', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can create organizations'
      });
    }

    const { 
      name, 
      ownerName,
      spokPersonName,
      spokPersonPhone,
      expectedConnections,
      country,
      state,
      city,
      pincode,
      address,
      website,
      organizationType = 'client'
    } = req.body;

    // Check if organization with this name already exists
    const existingOrg = await Organization.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this name already exists'
      });
    }

    // Create organization
    const organization = await Organization.create({
      name,
      ownerName,
      spokPersonName,
      spokPersonPhone,
      expectedConnections,
      country,
      state,
      city,
      pincode,
      address,
      website,
      organizationType,
      createdBy: req.user._id
    });

    // Populate createdBy field
    await organization.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });

  } catch (error) {
    console.error('=== CREATE ORGANIZATION ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('================================');
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating organization',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get all organizations (SuperAdmin only)
// @route   GET /api/organizations
// @access  Private (SuperAdmin only)
router.get('/', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view all organizations'
      });
    }

    const organizations = await Organization.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get user counts for each organization
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const userCounts = await User.aggregate([
          { $match: { organization: org._id } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const counts = {
          total: 0,
          admin: 0,
          agent1: 0,
          agent2: 0
        };

        userCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });

        return {
          ...org.toJSON(),
          userCounts: counts
        };
      })
    );

    res.status(200).json({
      success: true,
      count: organizationsWithCounts.length,
      data: organizationsWithCounts
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organizations',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get single organization with users (SuperAdmin only)
// @route   GET /api/organizations/:id
// @access  Private (SuperAdmin only)
router.get('/:id', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view organization details'
      });
    }

    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get all users in this organization
    const users = await User.find({ organization: req.params.id })
      .populate('createdBy', 'name email')
      .select('-password')
      .sort({ createdAt: -1 });

    // Group users by role
    const usersByRole = {
      admin: users.filter(user => user.role === 'admin'),
      agent1: users.filter(user => user.role === 'agent1'),
      agent2: users.filter(user => user.role === 'agent2')
    };

    res.status(200).json({
      success: true,
      data: {
        organization,
        users: usersByRole,
        totalUsers: users.length
      }
    });

  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Toggle organization status (SuperAdmin only)
// @route   PUT /api/organizations/:id/status
// @access  Private (SuperAdmin only)
router.put('/:id/status', protect, async (req, res) => {
  console.log('=== STATUS TOGGLE ROUTE HIT ===');
  console.log('Organization ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update organization status'
      });
    }

    const { isActive } = req.body;

    // Check if organization exists
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update only the status
    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: false }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Organization ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedOrganization
    });

  } catch (error) {
    console.error('Toggle organization status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organization status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update organization (SuperAdmin only)
// @route   PUT /api/organizations/:id
// @access  Private (SuperAdmin only)
router.put('/:id', protect, organizationValidation, handleValidationErrors, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update organizations'
      });
    }

    const { 
      name, 
      ownerName,
      spokPersonName,
      spokPersonPhone,
      expectedConnections,
      country,
      state,
      city,
      pincode,
      address,
      website,
      isActive 
    } = req.body;

    // Check if organization exists
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if another organization with this name exists (excluding current one)
    if (name && name !== organization.name) {
      const existingOrg = await Organization.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          message: 'Organization with this name already exists'
        });
      }
    }

    // Update organization
    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        name,
        ownerName,
        spokPersonName,
        spokPersonPhone,
        expectedConnections,
        country,
        state,
        city,
        pincode,
        address,
        website,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization
    });

  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organization',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Delete organization (SuperAdmin only)
// @route   DELETE /api/organizations/:id
// @access  Private (SuperAdmin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can delete organizations'
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if organization has users
    const userCount = await User.countDocuments({ organization: req.params.id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete organization with existing users. Please delete all users first.'
      });
    }

    await Organization.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting organization',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Create user in organization (SuperAdmin only)
// @route   POST /api/organizations/:id/users
// @access  Private (SuperAdmin only)
router.post('/:id/users', protect, userValidation, handleValidationErrors, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can create users in organizations'
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      organization: req.params.id,
      createdBy: req.user._id
    });

    // Populate fields for response
    await user.populate([
      { path: 'organization', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: `${role} created successfully in ${organization.name}`,
      data: user
    });

  } catch (error) {
    console.error('Create user in organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user in organization',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get users by organization (SuperAdmin only)
// @route   GET /api/organizations/:id/users
// @access  Private (SuperAdmin only)
router.get('/:id/users', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view organization users'
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const { role } = req.query;
    let query = { organization: req.params.id };
    
    if (role && ['admin', 'agent1', 'agent2'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('createdBy', 'name email')
      .populate('organization', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update user status in organization (SuperAdmin only)
// @route   PUT /api/organizations/:orgId/users/:userId/status
// @access  Private (SuperAdmin only)
router.put('/:orgId/users/:userId/status', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update user status'
      });
    }

    const { isActive } = req.body;
    
    const user = await User.findOne({ 
      _id: req.params.userId, 
      organization: req.params.orgId 
    }).populate('organization', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Delete user from organization (SuperAdmin only)
// @route   DELETE /api/organizations/:orgId/users/:userId
// @access  Private (SuperAdmin only)
router.delete('/:orgId/users/:userId', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can delete users'
      });
    }

    const user = await User.findOne({ 
      _id: req.params.userId, 
      organization: req.params.orgId 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization'
      });
    }

    // Prevent superadmin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user from organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get users of an organization
// @route   GET /api/organizations/:id/users
// @access  Private (SuperAdmin only)
router.get('/:id/users', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view organization users'
      });
    }

    const orgId = req.params.id;

    // Verify organization exists
    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get all users from this organization
    const users = await User.find({ 
      organization: orgId 
    })
    .select('name email role isActive createdAt lastLogin')
    .populate('organization', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType
        }
      }
    });

  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get users of an organization
// @route   GET /api/organizations/:id/users
// @access  Private (SuperAdmin only)
router.get('/:id/users', protect, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view organization users'
      });
    }

    const organizationId = req.params.id;

    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get users for this organization
    const users = await User.find({ organization: organizationId })
      .select('name email role isActive createdAt')
      .populate('organization', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
        organization: {
          _id: organization._id,
          name: organization.name,
          organizationType: organization.organizationType
        }
      }
    });

  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
