const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    type: {
      type: String,
      enum: ['SALE', 'ADJUSTMENT', 'RESTOCK', 'WASTE', 'REFUND'],
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    reference: {
      type: String, // e.g., Transaction ID or adjustment reason
      required: true,
    },
    performedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performedBy: {
      type: String,
      default: 'Staff',
    },
  },
  {
    timestamps: true,
  }
);

stockMovementSchema.index({ store: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
