const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedPlatformAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || process.env.PLATFORM_ADMIN_EMAIL || 'sharmila0774@gmail.com').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.PLATFORM_ADMIN_PASSWORD || '12345678';
  const name = process.env.SEED_ADMIN_NAME || process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.role = 'PLATFORM_ADMIN';
      user.isPlatformAdmin = true;
      user.store = null;
      user.status = 'Active';
      user.isActive = true;
      user.password = password; // pre-save hook will hash
      await user.save();
      console.log(`Updated existing user ${email} to PLATFORM_ADMIN.`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: 'PLATFORM_ADMIN',
        isPlatformAdmin: true,
        store: null,
        status: 'Active',
        isActive: true,
      });
      console.log(`Created new PLATFORM_ADMIN: ${email}`);
    }

    await mongoose.disconnect();
    console.log('Platform Admin seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seedPlatformAdmin();
