const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    taxRatePercent: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for shopping with us!',
      trim: true,
    },
    lowStockThresholdGlobal: {
      type: Number,
      default: 5,
      min: 0,
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
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
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
