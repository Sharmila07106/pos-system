const mongoose = require('mongoose');

const wasteRecordSchema = new mongoose.Schema(
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
    },
    productName: {
      type: String,
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    batchNumber: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Wasted quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      enum: ['EXPIRED', 'DAMAGED', 'SPOILED', 'RECALLED', 'OTHER'],
      required: true,
    },
    costImpact: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedByName: {
      type: String,
      default: 'Staff',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WasteRecord', wasteRecordSchema);
