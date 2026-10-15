const mongoose = require('mongoose');
const { getSuggestedProductImage } = require('../utils/productImage');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
      index: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    supplier: {
      type: String,
      default: '',
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-populate imageUrl and synchronize with image field
productSchema.pre('save', function () {
  if (!this.imageUrl && this.image) {
    this.imageUrl = this.image;
  } else if (!this.image && this.imageUrl) {
    this.image = this.imageUrl;
  }

  // If still empty, automatically assign suggested vector illustration
  if (!this.imageUrl && !this.image) {
    const suggested = getSuggestedProductImage(this.name, this.category);
    this.image = suggested;
    this.imageUrl = suggested;
  }
});

// Compound index so barcode is unique PER supermarket store
productSchema.index({ store: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
