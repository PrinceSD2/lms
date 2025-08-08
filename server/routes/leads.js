const express = require('express');
const { body, query } = require('express-validator');
const Lead = require('../models/Lead');
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
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('budget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('source')
    .optional()
    .isIn(['website', 'social-media', 'referral', 'advertisement', 'cold-call', 'other'])
    .withMessage('Invalid source'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('requirements')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Requirements cannot exceed 1000 characters'),
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

const updateLeadValidation = [
  body('status')
    .optional()
    .isIn(['new', 'interested', 'not-interested', 'successful', 'follow-up'])
    .withMessage('Invalid status'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid follow-up date'),
  body('followUpTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Follow-up time must be in HH:MM format'),
  body('followUpNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Follow-up notes cannot exceed 500 characters'),
  body('conversionValue')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Conversion value must be a positive number')
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

    // Role-based filtering (Agent1 can only see their own leads)
    if (req.user.role === 'agent1') {
      filter.createdBy = req.user._id;
    }

    // Get leads with pagination
    const leads = await Lead.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Lead.countDocuments(filter);

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

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

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
router.post('/', protect, authorize('agent1', 'admin'), createLeadValidation, handleValidationErrors, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user._id
    };

    const lead = await Lead.create(leadData);
    
    // Populate the created lead
    await lead.populate('createdBy', 'name email');

    // Emit real-time update
    req.io.emit('leadCreated', {
      lead: lead,
      createdBy: req.user.name
    });

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
// @access  Private (Agent2, Admin)
router.put('/:id', protect, authorize('agent2', 'admin'), updateLeadValidation, handleValidationErrors, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update fields
    const updateFields = ['status', 'followUpDate', 'followUpTime', 'followUpNotes', 'conversionValue'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.updatedBy = req.user._id;
    await lead.save();

    // Populate the updated lead
    await lead.populate(['createdBy updatedBy', 'name email']);

    // Emit real-time update
    req.io.emit('leadUpdated', {
      lead: lead,
      updatedBy: req.user.name
    });

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
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    // Emit real-time update
    req.io.emit('leadDeleted', {
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
    if (role === 'admin') {
      stats = await Lead.getStatistics();
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
