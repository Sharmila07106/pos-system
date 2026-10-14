const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
      type: String,
      enum: [
        'PLATFORM_SUPER_ADMIN',
        'PLATFORM_ADMIN',
        'STORE_ADMIN',
        'STORE_OWNER',
        'INVENTORY_MANAGER',
        'CASHIER',
        'ADMIN',
        'platform_super_admin',
        'store_admin',
        'inventory_manager',
        'cashier',
      ],
      required: [true, 'User role is required'],
      index: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
      index: true,
    },
    isPlatformAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Disabled'],
      default: 'Active',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    preferences: {
      themeAccent: {
        type: String,
        default: '#0FA38F',
      },
      sidebarStyle: {
        type: String,
        enum: ['NAVY', 'CHARCOAL', 'LIGHT'],
        default: 'NAVY',
      },
      density: {
        type: String,
        enum: ['COMFORTABLE', 'COMPACT'],
        default: 'COMFORTABLE',
      },
      fontScale: {
        type: String,
        default: '100%',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Ensure Platform Admins have isPlatformAdmin set to true
  if (this.role === 'PLATFORM_SUPER_ADMIN' || this.role === 'PLATFORM_ADMIN') {
    this.isPlatformAdmin = true;
  }

  // Sync isActive and status
  if (this.isModified('status')) {
    this.isActive = this.status === 'Active';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'Active' : 'Disabled';
  }
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
