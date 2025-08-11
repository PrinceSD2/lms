const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // allow missing/undefined
        const str = String(v).trim();
        if (str === '') return true; // treat empty as not provided
        return /^[\d+\-()\s]{5,20}$/.test(str);
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  // Lead Details
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  source: {
    type: String,
    enum: [
      'Personal Debt', 'Secured Debt', 'Unsecured Debt', 'Revolving Debt', 
      'Installment Debt', 'Credit Card Debt', 'Mortgage Debt', 'Student Loans',
      'Auto Loans', 'Personal Loans', 'Medical Debt', 'Home Equity Loans (HELOCs)',
      'Payday Loans', 'Buy Now, Pay Later (BNPL) loans'
    ],
    default: 'Personal Debt'
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  requirements: {
    type: String,
    maxlength: [1000, 'Requirements cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },

  // Address Information
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  zipcode: {
    type: String,
    trim: true,
    maxlength: [20, 'Zipcode cannot exceed 20 characters']
  },

  // Lead Categorization (Auto-calculated)
  category: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'cold'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Lead Status (Updated by Agent 2)
  status: {
    type: String,
    enum: ['new', 'interested', 'not-interested', 'successful', 'follow-up'],
    default: 'new'
  },
  
  // Follow-up Information
  followUpDate: {
    type: Date
  },
  followUpTime: {
    type: String
  },
  followUpNotes: {
    type: String,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
  },

  // Tracking Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Priority (derived from category)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },

  // Conversion tracking
  convertedAt: {
    type: Date
  },
  conversionValue: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
leadSchema.index({ createdBy: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ category: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ followUpDate: 1 });

// Pre-save middleware to calculate completion percentage and category
leadSchema.pre('save', function(next) {
  const requiredFields = [
    'name', 'email', 'phone', 'budget', 'source', 
    'company', 'jobTitle', 'location', 'requirements',
    'address', 'city', 'state', 'zipcode'
  ];
  
  let filledFields = 0;
  requiredFields.forEach(field => {
    if (this[field] && this[field] !== '') {
      filledFields++;
    }
  });

  this.completionPercentage = Math.round((filledFields / requiredFields.length) * 100);

  // Categorize based on completion percentage
  if (this.completionPercentage >= 80) {
    this.category = 'hot';
    this.priority = 'high';
  } else if (this.completionPercentage >= 50) {
    this.category = 'warm';
    this.priority = 'medium';
  } else {
    this.category = 'cold';
    this.priority = 'low';
  }

  // Set conversion date if status changed to successful
  if (this.status === 'successful' && !this.convertedAt) {
    this.convertedAt = new Date();
  }

  next();
});

// Static method to get statistics
leadSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        hotLeads: {
          $sum: { $cond: [{ $eq: ['$category', 'hot'] }, 1, 0] }
        },
        warmLeads: {
          $sum: { $cond: [{ $eq: ['$category', 'warm'] }, 1, 0] }
        },
        coldLeads: {
          $sum: { $cond: [{ $eq: ['$category', 'cold'] }, 1, 0] }
        },
        interestedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] }
        },
        successfulLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
        },
        followUpLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'follow-up'] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    interestedLeads: 0,
    successfulLeads: 0,
    followUpLeads: 0
  };

  // Calculate conversion rate
  result.conversionRate = result.totalLeads > 0 
    ? ((result.successfulLeads / result.totalLeads) * 100).toFixed(2)
    : 0;

  return result;
};

// Instance method to get category color
leadSchema.methods.getCategoryColor = function() {
  const colors = {
    hot: '#ef4444', // red-500
    warm: '#eab308', // yellow-500
    cold: '#3b82f6'  // blue-500
  };
  return colors[this.category] || colors.cold;
};

module.exports = mongoose.model('Lead', leadSchema);
