const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: [0, 'Received quantity cannot be negative'],
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      default: '',
      trim: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required for batch tracking'],
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEPLETED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Batch', batchSchema);
