const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supermarket name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    storeCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    businessEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    statusReason: {
      type: String,
      default: '',
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    taxRatePercent: {
      type: Number,
      default: 5,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for shopping with us! Visit again.',
    },
    maxInventoryStaff: {
      type: Number,
      default: 5,
      min: 0,
    },
    maxCashiers: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure email and businessEmail mirror each other
storeSchema.pre('validate', function () {
  if (!this.email && this.businessEmail) {
    this.email = this.businessEmail;
  }
  if (!this.businessEmail && this.email) {
    this.businessEmail = this.email;
  }
});

// Virtual alias: owner -> ownerUser
storeSchema.virtual('owner').get(function () {
  return this.ownerUser;
});

module.exports = mongoose.model('Store', storeSchema);
