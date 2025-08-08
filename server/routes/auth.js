const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
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
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['agent1', 'agent2', 'admin'])
    .withMessage('Role must be agent1, agent2, or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @desc    Register user (Public - Only for initial admin setup)
// @route   POST /api/auth/register
// @access  Public (Restricted)
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    // If admin exists, only admin can create new users
    if (adminExists) {
      return res.status(403).json({
        success: false,
        message: 'Registration is restricted. Only admin can create new accounts.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (first user becomes admin)
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin' // First user is always admin
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Create Agent (Admin only)
// @route   POST /api/auth/create-agent
// @access  Private (Admin only)
router.post('/create-agent', protect, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create agent accounts'
      });
    }

    const { name, email, password, role } = req.body;

    // Validate role for agents
    if (!['agent1', 'agent2'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either agent1 or agent2'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create agent user
    const user = await User.create({
      name,
      email,
      password,
      role,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating agent account',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password field
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get all agents (Admin only)
// @route   GET /api/auth/agents
// @access  Private (Admin only)
router.get('/agents', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view agent accounts'
      });
    }

    const agents = await User.find({ 
      role: { $in: ['agent1', 'agent2'] } 
    }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        agents,
        count: agents.length
      }
    });

  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching agents',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update agent status (Admin only)
// @route   PUT /api/auth/agents/:id/status
// @access  Private (Admin only)
router.put('/agents/:id/status', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update agent status'
      });
    }

    const { isActive } = req.body;
    const agent = await User.findById(req.params.id);

    if (!agent || !['agent1', 'agent2'].includes(agent.role)) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agent.isActive = isActive;
    await agent.save();

    res.status(200).json({
      success: true,
      message: `Agent ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        agent: agent.toJSON()
      }
    });

  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating agent status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
