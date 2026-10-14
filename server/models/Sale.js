const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  batchNumber: { type: String, default: '' },
  name: { type: String, required: true },
  barcode: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    receiptNo: {
      type: String,
      index: true,
    },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'UPI'],
      required: true,
    },
    amountReceived: { type: Number },
    changeGiven: { type: Number },
    status: {
      type: String,
      enum: ['COMPLETED', 'REFUNDED', 'CANCELLED'],
      default: 'COMPLETED',
      index: true,
    },
    refundReason: { type: String, default: '' },
    cashierUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    cashierName: {
      type: String,
      default: 'Staff',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast tenant query by date
saleSchema.index({ store: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
