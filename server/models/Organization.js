const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Organization name must be at least 2 characters'],
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
    maxlength: [100, 'Owner name cannot exceed 100 characters']
  },
  spokPersonName: {
    type: String,
    required: [true, 'Spokesperson name is required'],
    trim: true,
    maxlength: [100, 'Spokesperson name cannot exceed 100 characters']
  },
  spokPersonPhone: {
    type: String,
    required: [true, 'Spokesperson phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{8,14}$/.test(v.replace(/[\s\-\(\)\.]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  expectedConnections: {
    type: Number,
    required: [true, 'Expected connections is required'],
    min: [1, 'Expected connections must be at least 1']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    enum: {
      values: ['India', 'Philippines', 'Zimbabwe'],
      message: 'Country must be India, Philippines, or Zimbabwe'
    },
    set: function(value) {
      if (!value) return value;
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        
        const country = this.country?.toLowerCase();
        
        // India states validation
        const indianStates = [
          'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
          'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
          'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
          'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
          'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
          'delhi', 'jammu and kashmir', 'ladakh', 'chandigarh', 'dadra and nagar haveli and daman and diu',
          'lakshadweep', 'puducherry', 'andaman and nicobar islands'
        ];
        
        // Zimbabwe provinces validation
        const zimbabweProvinces = [
          'bulawayo', 'harare', 'manicaland', 'mashonaland central', 'mashonaland east',
          'mashonaland west', 'masvingo', 'matabeleland north', 'matabeleland south', 'midlands'
        ];
        
        if (country === 'india') {
          return indianStates.includes(v.toLowerCase());
        } else if (country === 'zimbabwe') {
          return zimbabweProvinces.includes(v.toLowerCase());
        }
        
        return true; // Allow any state for Philippines or other countries
      },
      message: 'Please enter a valid state/province for the selected country'
    }
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  pincode: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        
        const country = this.country?.toLowerCase();
        
        switch (country) {
          case 'india':
            return /^[1-9][0-9]{5}$/.test(v);
          case 'philippines':
            return /^[0-9]{4}$/.test(v);
          case 'zimbabwe':
            return /^[A-Za-z0-9\s]{3,10}$/.test(v);
          default:
            return /^[A-Za-z0-9\s\-]{3,10}$/.test(v);
        }
      },
      message: function(props) {
        const country = this.country?.toLowerCase();
        if (country === 'india') {
          return 'Indian pincode must be 6 digits starting with 1-9';
        } else if (country === 'philippines') {
          return 'Philippines postal code must be 4 digits';
        } else if (country === 'zimbabwe') {
          return 'Zimbabwe postal code must be 3-10 alphanumeric characters';
        }
        return 'Please enter a valid postal code';
      }
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [300, 'Address cannot exceed 300 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        try {
          new URL(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: 'Please enter a valid website URL'
    }
  },

  // System Fields
  organizationType: {
    type: String,
    enum: ['main', 'client'],
    default: 'client',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
organizationSchema.index({ name: 1 });
organizationSchema.index({ country: 1 });
organizationSchema.index({ createdBy: 1 });

// Virtual for full address
organizationSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city, this.state, this.country, this.pincode].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtual fields are serialized
organizationSchema.set('toJSON', { virtuals: true });
organizationSchema.set('toObject', { virtuals: true });

// Instance methods
organizationSchema.methods.toJSON = function() {
  const organization = this.toObject();
  return organization;
};

// Static methods
organizationSchema.statics.findActiveOrganizations = function() {
  return this.find({ isActive: true }).populate('createdBy', 'name email');
};

organizationSchema.statics.findByCreator = function(creatorId) {
  return this.find({ createdBy: creatorId }).populate('createdBy', 'name email');
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
