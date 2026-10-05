const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      default: 'NovaPOS Store',
    },
    address: {
      type: String,
      default: '123, MG Road, Chennai - 600028',
    },
    phone: {
      type: String,
      default: '+91 9876543210',
    },
    taxRatePercent: {
      type: Number,
      default: 5,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    receiptFooter: {
      type: String,
      default: 'Thank you! Visit again!',
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
