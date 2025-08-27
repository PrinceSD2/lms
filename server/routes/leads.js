const express = require('express');
const { body, query } = require('express-validator');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createLeadValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .custom((value) => {
      if (!value || value.trim() === '') return true; // allow empty or missing
      if (typeof value !== 'string') throw new Error('Phone must be a string');
      // Validate +1 followed by exactly 10 digits
      if (!/^\+1\d{10}$/.test(value.trim())) {
        throw new Error('Phone number must be in format +1 followed by 10 digits (e.g., +12345678901)');
      }
      return true;
    })
    .withMessage('Phone number must be in format +1 followed by 10 digits (e.g., +12345678901)'),
  body('alternatePhone')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true; // allow empty or missing
      if (typeof value !== 'string') throw new Error('Alternate phone must be a string');
      // Validate +1 followed by exactly 10 digits
      if (!/^\+1\d{10}$/.test(value.trim())) {
        throw new Error('Alternate phone number must be in format +1 followed by 10 digits (e.g., +12345678901)');
      }
      return true;
    })
    .withMessage('Alternate phone number must be in format +1 followed by 10 digits (e.g., +12345678901)'),
  body('debtCategory')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['secured', 'unsecured'])
    .withMessage('Debt category must be secured or unsecured'),
  body('debtTypes')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Debt types must be an array'),
  body('totalDebtAmount')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Total debt amount must be a number'),
  body('numberOfCreditors')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Number of creditors must be a non-negative integer'),
  body('monthlyDebtPayment')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Monthly debt payment must be a number'),
  body('creditScore')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 900 })
    .withMessage('Credit score must be a whole number between 0 and 900'),
  body('creditScoreRange')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['300-549', '550-649', '650-699', '700-749', '750-850'])
    .withMessage('Credit score range must be 300-549, 550-649, 650-699, 700-749, or 750-850'),
  body('budget')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Budget must be a number'),
  body('source')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Personal Debt', 'Secured Debt', 'Unsecured Debt', 'Revolving Debt', 
      'Installment Debt', 'Credit Card Debt', 'Mortgage Debt', 'Student Loans',
      'Auto Loans', 'Personal Loans', 'Medical Debt', 'Home Equity Loans (HELOCs)',
      'Payday Loans', 'Buy Now, Pay Later (BNPL) loans'
    ])
    .withMessage('Invalid debt type'),
  body('company')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('jobTitle')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  body('location')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('requirements')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Requirements cannot exceed 1000 characters'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  body('city')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('state')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('zipcode')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 })
    .withMessage('Zipcode cannot exceed 20 characters')
];

const updateLeadValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true; // allow empty or missing
      if (typeof value !== 'string') throw new Error('Phone must be a string');
      if (value.length < 5 || value.length > 20) throw new Error('Phone must be 5-20 characters');
      if (!/^[\d+\-()\s]+$/.test(value)) throw new Error('Phone can only contain numbers, spaces, +, -, (, )');
      return true;
    })
    .withMessage('Phone must be 5-20 characters and contain only numbers, spaces, +, -, (, )'),
  body('alternatePhone')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true; // allow empty or missing
      if (typeof value !== 'string') throw new Error('Alternate phone must be a string');
      if (value.length < 5 || value.length > 20) throw new Error('Alternate phone must be 5-20 characters');
      if (!/^[\d+\-()\s]+$/.test(value)) throw new Error('Alternate phone can only contain numbers, spaces, +, -, (, )');
      return true;
    })
    .withMessage('Alternate phone must be 5-20 characters and contain only numbers, spaces, +, -, (, )'),
  body('debtCategory')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['secured', 'unsecured'])
    .withMessage('Debt category must be secured or unsecured'),
  body('debtTypes')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Debt types must be an array'),
  body('totalDebtAmount')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Total debt amount must be a number'),
  body('numberOfCreditors')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Number of creditors must be a non-negative integer'),
  body('monthlyDebtPayment')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Monthly debt payment must be a number'),
  body('creditScore')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 900 })
    .withMessage('Credit score must be a whole number between 0 and 900'),
  body('creditScoreRange')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['300-549', '550-649', '650-699', '700-749', '750-850'])
    .withMessage('Credit score range must be 300-549, 550-649, 650-699, 700-749, or 750-850'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  body('city')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('state')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('zipcode')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 })
    .withMessage('Zipcode cannot exceed 20 characters'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
  body('company')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('source')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Personal Debt', 'Secured Debt', 'Unsecured Debt', 'Revolving Debt', 
      'Installment Debt', 'Credit Card Debt', 'Mortgage Debt', 'Student Loans',
      'Auto Loans', 'Personal Loans', 'Medical Debt', 'Home Equity Loans (HELOCs)',
      'Payday Loans', 'Buy Now, Pay Later (BNPL) loans'
    ])
    .withMessage('Invalid debt type'),
  body('status')
    .optional()
    .isIn(['new', 'interested', 'not-interested', 'successful', 'follow-up'])
    .withMessage('Invalid status'),
  body('leadStatus')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['Warm Transfer – Pre-Qualified', 'Cold Transfer – Unqualified', 'From Internal Dept.', 'Test / Training Call'])
    .withMessage('Invalid lead status'),
  body('contactStatus')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['Connected & Engaged', 'Connected – Requested Callback', 'No Answer', 'Wrong Number', 'Call Dropped'])
    .withMessage('Invalid contact status'),
  body('qualificationOutcome')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Qualified – Meets Criteria', 'Pre-Qualified – Docs Needed', 'Disqualified – Debt Too Low',
      'Disqualified – Secured Debt Only', 'Disqualified – Non-Service State', 'Disqualified – No Hardship',
      'Disqualified – Active with Competitor'
    ])
    .withMessage('Invalid qualification outcome'),
  body('callDisposition')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Appointment Scheduled', 'Immediate Enrollment', 'Info Provided – Awaiting Decision',
      'Nurture – Not Ready', 'Declined Services', 'DNC'
    ])
    .withMessage('Invalid call disposition'),
  body('engagementOutcome')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Proceeding with Program', 'Callback Needed', 'Left Voicemail',
      'Info Only – Follow-up Needed', 'Not Interested', 'DNC'
    ])
    .withMessage('Invalid engagement outcome'),
  body('disqualification')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['Debt Too Low', 'Secured Debt Only', 'No Debt', 'Wrong Number / Bad Contact'])
    .withMessage('Invalid disqualification'),
  body('followUpDate')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      // Check if it's a valid date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid follow-up date');
      }
      return true;
    }),
  body('followUpTime')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      // Check if it matches HH:MM format
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        throw new Error('Follow-up time must be in HH:MM format');
      }
      return true;
    }),
  body('followUpNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Follow-up notes cannot exceed 500 characters'),
  body('conversionValue')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Conversion value must be a positive number');
      }
      return true;
    }),
  body('leadProgressStatus')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([
      'Appointment Scheduled',
      'Immediate Enrollment', 
      'Info Provided – Awaiting Decision',
      'Nurture – Not Ready',
      'Qualified – Meets Criteria',
      'Pre-Qualified – Docs Needed',
      'Disqualified – Debt Too Low',
      'Disqualified – Secured Debt Only',
      'Disqualified – Non-Service State',
      'Disqualified – Active with Competitor',
      'Callback Needed',
      'Left Voicemail',
      'Not Interested',
      'DNC (Do Not Contact)'
    ])
    .withMessage('Invalid lead progress status'),
  body('agent2LastAction')
    .optional()
    .isString()
    .withMessage('Agent2 last action must be a string'),
  body('lastUpdatedBy')
    .optional()
    .isString()
    .withMessage('Last updated by must be a string'),
  body('lastUpdatedAt')
    .optional()
    .isISO8601()
    .withMessage('Last updated at must be a valid date')
];

// @desc    Get all leads with pagination and filtering
// @route   GET /api/leads
// @access  Private (Agent1, Agent2, Admin)
router.get('/', protect, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['new', 'interested', 'not-interested', 'successful', 'follow-up'])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isIn(['hot', 'warm', 'cold'])
    .withMessage('Invalid category filter'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'agent1') {
      filter.createdBy = req.user._id;
      filter.adminProcessed = { $ne: true }; // Hide admin-processed leads
      console.log('Agent1 filter applied:', filter);
    } else if (req.user.role === 'agent2') {
      // Agent2 can only see leads assigned to them
      filter.assignedTo = req.user._id;
      filter.adminProcessed = { $ne: true }; // Hide admin-processed leads
      console.log('Agent2 filter applied:', filter);
    }

    console.log('Final filter:', filter);
    console.log('User role:', req.user.role, 'User ID:', req.user._id);

    // Get leads with pagination
    const leads = await Lead.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Lead.countDocuments(filter);

    console.log('Found leads:', leads.length, 'Total count:', total);

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get available Agent2 users in the same organization
// @route   GET /api/leads/available-agents
// @access  Private (Agent1 only)
router.get('/available-agents', protect, async (req, res) => {
  try {
    if (req.user.role !== 'agent1') {
      return res.status(403).json({
        success: false,
        message: 'Only Agent1 can view available agents'
      });
    }

    // Get Agent2 users in the same organization
    const availableAgents = await User.find({
      role: 'agent2',
      organization: req.user.organization,
      isActive: true
    }).select('name email');

    res.status(200).json({
      success: true,
      data: { agents: availableAgents }
    });

  } catch (error) {
    console.error('Get available agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available agents',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByLeadId(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Role-based access (Agent1 can only see their own leads)
    if (req.user.role === 'agent1' && lead.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this lead'
      });
    }

    res.status(200).json({
      success: true,
      data: { lead }
    });

  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Agent1 only)
router.post('/', protect, createLeadValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('Create lead request body:', req.body);
    console.log('Create lead request user:', req.user ? req.user.role : 'No user');
    console.log('Create lead request user ID:', req.user ? req.user._id : 'No user ID');
    
    // Check if user has permission (agent1 or admin)
    if (req.user && !['agent1', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to create leads`
      });
    }
    
    const leadData = {
      ...req.body,
      source: req.body.source && req.body.source.trim() !== '' ? req.body.source : 'Personal Debt',
      createdBy: req.user._id
    };

    console.log('Creating lead with data:', leadData);

    const lead = await Lead.create(leadData);
    
    console.log('Lead created successfully:', lead._id);
    console.log('Saved lead data:', JSON.stringify(lead, null, 2));
    
    // Populate the created lead
    await lead.populate('createdBy', 'name email');

    // Emit real-time update
    if (req.io) {
      req.io.emit('leadCreated', {
        lead: lead,
        createdBy: req.user.name
      });
      // Also emit to specific rooms
      req.io.to('admin').emit('leadCreated', {
        lead: lead,
        createdBy: req.user.name
      });
      req.io.to('agent2').emit('leadCreated', {
        lead: lead,
        createdBy: req.user.name
      });
    }

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update lead status
// @route   PUT /api/leads/:id
// @access  Private (Agent1 for own leads, Agent2, Admin)
router.put('/:id', protect, updateLeadValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Update request user:', req.user ? req.user.role : 'No user');
    console.log('Update request user ID:', req.user ? req.user._id : 'No user ID');
    
    const lead = await Lead.findByLeadId(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log('Found lead:', lead.leadId);
    console.log('Lead createdBy:', lead.createdBy);
    console.log('Current user role:', req.user.role);
    console.log('Current user ID:', req.user._id);

    // Check permissions based on user role
    if (req.user.role === 'agent1') {
      console.log('User is agent1, checking if they created this lead...');
      // Agent1 can only update their own leads
      if (lead.createdBy.toString() !== req.user._id.toString()) {
        console.log('Agent1 trying to update lead they did not create');
        return res.status(403).json({
          success: false,
          message: 'Agent1 can only update leads they created'
        });
      }
      console.log('Agent1 authorized to update their own lead');
    } else if (['agent2', 'admin', 'superadmin'].includes(req.user.role)) {
      console.log('User is agent2/admin/superadmin, authorized to update leads');
    } else {
      console.log('User role not authorized:', req.user.role);
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to update leads`
      });
    }

    // Define which fields each role can update
    let allowedFields = [];
    
    if (req.user.role === 'agent1') {
      // Agent1 can update basic lead information but not status fields
      allowedFields = [
        'name', 'email', 'phone', 'alternatePhone', 'debtCategory', 'debtTypes',
        'totalDebtAmount', 'numberOfCreditors', 'monthlyDebtPayment', 'creditScore', 'creditScoreRange',
        'address', 'city', 'state', 'zipcode', 'notes', 'company', 'source'
      ];
    } else if (['agent2', 'admin', 'superadmin'].includes(req.user.role)) {
      // Agent2 and above can update status fields
      allowedFields = [
        'status', 'leadStatus', 'contactStatus', 'qualificationOutcome', 
        'callDisposition', 'engagementOutcome', 'disqualification',
        'followUpDate', 'followUpTime', 'followUpNotes', 'conversionValue',
        'leadProgressStatus', 'agent2LastAction', 'lastUpdatedBy', 'lastUpdatedAt'
      ];
    }

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        console.log(`Updating ${field} to:`, req.body[field]);
        lead[field] = req.body[field];
      }
    });

    // Mark as admin processed if updated by admin or superadmin
    if (['admin', 'superadmin'].includes(req.user.role)) {
      lead.adminProcessed = true;
      lead.adminProcessedAt = new Date();
    }

    lead.updatedBy = req.user._id;
    await lead.save();

    console.log('Lead saved successfully');

    // Populate the updated lead
    await lead.populate(['createdBy updatedBy', 'name email']);

    // Emit real-time update
    if (req.io) {
      req.io.emit('leadUpdated', {
        lead: lead,
        updatedBy: req.user.name
      });
      // Also emit to specific rooms
      req.io.to('admin').emit('leadUpdated', {
        lead: lead,
        updatedBy: req.user.name
      });
      req.io.to('agent2').emit('leadUpdated', {
        lead: lead,
        updatedBy: req.user.name
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const lead = await Lead.findByLeadId(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await Lead.findOneAndDelete({ leadId: req.params.id });

    // Emit real-time update
    req.io.emit('leadDeleted', {
      leadId: req.params.id,
      deletedBy: req.user.name
    });
    // Also emit to specific rooms
    req.io.to('admin').emit('leadDeleted', {
      leadId: req.params.id,
      deletedBy: req.user.name
    });
    req.io.to('agent2').emit('leadDeleted', {
      leadId: req.params.id,
      deletedBy: req.user.name
    });

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Assign lead to Agent2
// @route   POST /api/leads/:id/assign
// @access  Private (Agent1 only)
router.post('/:id/assign', protect, [
  body('assignedTo')
    .isMongoId()
    .withMessage('Valid Agent ID is required'),
  body('assignmentNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Assignment notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    if (req.user.role !== 'agent1') {
      return res.status(403).json({
        success: false,
        message: 'Only Agent1 can assign leads'
      });
    }

    const { assignedTo, assignmentNotes } = req.body;

    // Find the lead
    const lead = await Lead.findByLeadId(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if Agent1 owns this lead
    if (lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign leads you created'
      });
    }

    // Check if lead is already assigned
    if (lead.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Lead is already assigned'
      });
    }

    // Verify the assigned agent exists and is Agent2 in same organization
    const assignedAgent = await User.findById(assignedTo);
    if (!assignedAgent) {
      return res.status(404).json({
        success: false,
        message: 'Assigned agent not found'
      });
    }

    if (assignedAgent.role !== 'agent2') {
      return res.status(400).json({
        success: false,
        message: 'Can only assign to Agent2 users'
      });
    }

    if (assignedAgent.organization.toString() !== req.user.organization.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Can only assign to agents in the same organization'
      });
    }

    // Assign the lead
    lead.assignedTo = assignedTo;
    lead.assignedBy = req.user._id;
    lead.assignedAt = new Date();
    lead.assignmentNotes = assignmentNotes || '';
    lead.updatedBy = req.user._id;

    await lead.save();

    // Populate the updated lead
    await lead.populate(['createdBy updatedBy assignedTo assignedBy', 'name email']);

    // Emit real-time update
    if (req.io) {
      req.io.emit('leadAssigned', {
        lead: lead,
        assignedBy: req.user.name,
        assignedTo: assignedAgent.name
      });
      // Emit to specific rooms
      req.io.to('admin').emit('leadAssigned', {
        lead: lead,
        assignedBy: req.user.name,
        assignedTo: assignedAgent.name
      });
      req.io.to(`user_${assignedTo}`).emit('leadAssigned', {
        lead: lead,
        assignedBy: req.user.name,
        assignedTo: assignedAgent.name
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Unassign lead (remove assignment)
// @route   POST /api/leads/:id/unassign
// @access  Private (Agent1 only - for their own leads)
router.post('/:id/unassign', protect, async (req, res) => {
  try {
    if (req.user.role !== 'agent1') {
      return res.status(403).json({
        success: false,
        message: 'Only Agent1 can unassign leads'
      });
    }

    const lead = await Lead.findByLeadId(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if Agent1 owns this lead
    if (lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only unassign leads you created'
      });
    }

    if (!lead.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Lead is not assigned'
      });
    }

    // Store the previous assignment info for notification
    const previousAssignedTo = lead.assignedTo;

    // Unassign the lead
    lead.assignedTo = null;
    lead.assignedBy = null;
    lead.assignedAt = null;
    lead.assignmentNotes = '';
    lead.updatedBy = req.user._id;

    await lead.save();

    // Populate the updated lead
    await lead.populate(['createdBy updatedBy', 'name email']);

    // Emit real-time update
    if (req.io) {
      req.io.emit('leadUnassigned', {
        lead: lead,
        unassignedBy: req.user.name
      });
      // Emit to specific rooms
      req.io.to('admin').emit('leadUnassigned', {
        lead: lead,
        unassignedBy: req.user.name
      });
      req.io.to(`user_${previousAssignedTo}`).emit('leadUnassigned', {
        lead: lead,
        unassignedBy: req.user.name
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead unassigned successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Unassign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning lead',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/leads/dashboard/stats
// @access  Private (All authenticated users)
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    
    let filter = {};
    
    // Apply filters based on user role
    if (role === 'agent1') {
      filter = { assignedAgent: userId, status: { $in: ['new', 'contacted', 'qualified'] } };
    } else if (role === 'agent2') {
      filter = { assignedAgent: userId, status: { $in: ['follow-up', 'converted', 'closed'] } };
    }
    // Admin sees all data (no filter applied)

    // Get basic statistics
    let stats;
    if (['admin', 'superadmin'].includes(role)) {
      stats = await Lead.getStatistics();
      
      // Get active agents count for admin
      const User = require('../models/User');
      const activeAgents = await User.countDocuments({ 
        role: { $in: ['agent1', 'agent2'] },
        isActive: { $ne: false } // Count users who are not explicitly inactive
      });
      stats.activeAgents = activeAgents;
    } else {
      // Get filtered stats for agents
      const [total, newLeads, qualified, followUp, converted, closed] = await Promise.all([
        Lead.countDocuments(filter),
        Lead.countDocuments({ ...filter, status: 'new' }),
        Lead.countDocuments({ ...filter, status: 'qualified' }),
        Lead.countDocuments({ ...filter, status: 'follow-up' }),
        Lead.countDocuments({ ...filter, status: 'converted' }),
        Lead.countDocuments({ ...filter, status: 'closed' })
      ]);

      stats = {
        totalLeads: total,
        newLeads,
        qualified,
        followUp,
        converted,
        closed,
        conversionRate: total > 0 ? ((converted / total) * 100).toFixed(2) : 0
      };
    }

    // Get additional time-based statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const timeFilters = [
      { createdAt: { $gte: today }, ...filter },
      { createdAt: { $gte: thisWeek }, ...filter },
      { createdAt: { $gte: thisMonth }, ...filter }
    ];

    const [todayStats, weekStats, monthStats] = await Promise.all([
      Lead.countDocuments(timeFilters[0]),
      Lead.countDocuments(timeFilters[1]),
      Lead.countDocuments(timeFilters[2])
    ]);

    // Get follow-up leads for today
    const todayFollowUps = await Lead.countDocuments({
      followUpDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      ...filter
    });

    const response = {
      ...stats,
      todayLeads: todayStats,
      weekLeads: weekStats,
      monthLeads: monthStats,
      todayFollowUps,
      userRole: role,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get upcoming follow-ups
// @route   GET /api/leads/follow-ups
// @access  Private (Agent2, Admin)
router.get('/dashboard/follow-ups', protect, authorize('agent2', 'admin'), async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const followUps = await Lead.find({
      status: 'follow-up',
      followUpDate: { $gte: today, $lte: nextWeek }
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ followUpDate: 1, followUpTime: 1 });

    res.status(200).json({
      success: true,
      data: { followUps }
    });

  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-ups',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
