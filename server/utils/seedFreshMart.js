const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const demoUsers = [
  {
    name: 'Sharmila (Store Owner)',
    email: 'admin@freshmart.com',
    password: 'FreshMart@123',
    role: 'ADMIN',
    status: 'Active',
  },
  {
    name: 'Karthik (Inventory Manager)',
    email: 'inventory@freshmart.com',
    password: 'FreshMart@123',
    role: 'INVENTORY_MANAGER',
    status: 'Active',
  },
  {
    name: 'Priya (Head Cashier)',
    email: 'cashier@freshmart.com',
    password: 'FreshMart@123',
    role: 'CASHIER',
    status: 'Active',
  },
];

async function seedFreshMartStaff() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    for (const staff of demoUsers) {
      const existing = await User.findOne({ email: staff.email });
      if (existing) {
        existing.name = staff.name;
        existing.role = staff.role;
        existing.status = staff.status;
        existing.password = staff.password; // pre-save hook will hash
        await existing.save();
        console.log(`Updated demo staff: ${staff.email} (${staff.role})`);
      } else {
        await User.create(staff);
        console.log(`Created demo staff: ${staff.email} (${staff.role})`);
      }
    }

    console.log('\nFreshMart Demo Staff accounts seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seedFreshMartStaff();
