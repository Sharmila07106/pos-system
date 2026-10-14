const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    type: {
      type: String,
      enum: ['SALE', 'ADJUSTMENT', 'RESTOCK', 'WASTE', 'REFUND'],
      required: true
    },
    quantityChange: {
      type: Number,
      required: true
    },
    stockBefore: {
      type: Number,
      required: true
    },
    stockAfter: {
      type: Number,
      required: true
    },
    reference: {
      type: String, // e.g., Transaction ID or adjustment reason
      required: true
    },
    performedBy: {
      type: String, // Cashier/Admin name
      required: true,
      default: 'Admin'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);
