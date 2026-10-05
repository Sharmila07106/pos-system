require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { name: 'Organic Milk 1L', barcode: '890123456781', category: 'Dairy', price: 65, stock: 45, lowStockThreshold: 10 },
  { name: 'Whole Wheat Bread', barcode: '890123456782', category: 'Bakery', price: 40, stock: 20, lowStockThreshold: 5 },
  { name: 'Classic Salted Chips', barcode: '890123456783', category: 'Snacks', price: 20, stock: 15, lowStockThreshold: 10 },
  { name: 'Cola 2L', barcode: '890123456784', category: 'Beverages', price: 90, stock: 30, lowStockThreshold: 10 },
  { name: 'Fresh Apples 1kg', barcode: '890123456785', category: 'Fruits', price: 180, stock: 25, lowStockThreshold: 5 },
  { name: 'Moisturizing Soap', barcode: '890123456786', category: 'Personal Care', price: 45, stock: 50, lowStockThreshold: 15 },
  { name: 'Dark Chocolate', barcode: '890123456787', category: 'Snacks', price: 120, stock: 4, lowStockThreshold: 10 }, // Low stock
  { name: 'Almond Milk 1L', barcode: '890123456788', category: 'Dairy', price: 250, stock: 0, lowStockThreshold: 5 }, // Out of stock
  { name: 'Orange Juice 1L', barcode: '890123456789', category: 'Beverages', price: 110, stock: 12, lowStockThreshold: 5 },
  { name: 'Toothpaste 150g', barcode: '890123456790', category: 'Personal Care', price: 85, stock: 40, lowStockThreshold: 10 }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    await Product.deleteMany();
    console.log('Existing products cleared');

    await Product.insertMany(products);
    console.log('Demo products seeded successfully');

    process.exit();
  } catch (error) {
    console.error('Error with seed data:', error);
    process.exit(1);
  }
};

seedProducts();
