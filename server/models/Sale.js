const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  barcode: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
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
      required: true
    },
    amountReceived: { type: Number },
    changeGiven: { type: Number },
    cashier: {
      type: String, // Ideally ObjectId referencing User, using String for now as we mock auth
      required: true,
      default: 'Admin'
    },
    cashierName: { type: String, default: 'Sharmila U' }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);
