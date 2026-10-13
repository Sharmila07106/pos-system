const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Organic Milk 1L',
    barcode: '890123456781',
    category: 'Dairy',
    price: 65,
    stock: 45,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Whole Wheat Bread',
    barcode: '890123456782',
    category: 'Bakery',
    price: 40,
    stock: 20,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Classic Salted Chips',
    barcode: '890123456783',
    category: 'Snacks',
    price: 20,
    stock: 15,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Cola 2L',
    barcode: '890123456784',
    category: 'Beverages',
    price: 90,
    stock: 30,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Fresh Apples 1kg',
    barcode: '890123456785',
    category: 'Fruits',
    price: 180,
    stock: 25,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Moisturizing Soap',
    barcode: '890123456786',
    category: 'Personal Care',
    price: 45,
    stock: 50,
    lowStockThreshold: 15,
    image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Dark Chocolate',
    barcode: '890123456787',
    category: 'Snacks',
    price: 120,
    stock: 8,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Almond Milk 1L',
    barcode: '890123456788',
    category: 'Dairy',
    price: 250,
    stock: 14,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Orange Juice 1L',
    barcode: '890123456789',
    category: 'Beverages',
    price: 110,
    stock: 18,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Toothpaste 150g',
    barcode: '890123456790',
    category: 'Personal Care',
    price: 85,
    stock: 40,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Premium Basmati Rice 5kg',
    barcode: '890123456791',
    category: 'Staples',
    price: 350,
    stock: 22,
    lowStockThreshold: 8,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    isActive: true
  },
  {
    name: 'Extra Virgin Olive Oil 500ml',
    barcode: '890123456792',
    category: 'Staples',
    price: 490,
    stock: 16,
    lowStockThreshold: 6,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    isActive: true
  }
];

const seedProducts = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('Notice: MONGODB_URI not configured in server/.env. Demo products defined for application runtime.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    await Product.deleteMany();
    console.log('Existing products cleared');

    await Product.insertMany(products);
    console.log('Demo products seeded successfully with realistic images');

    process.exit(0);
  } catch (error) {
    console.error('Error with seed data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedProducts();
}

module.exports = { products, seedProducts };
