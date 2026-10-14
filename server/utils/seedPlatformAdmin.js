const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedPlatformAdmin() {
  const email = (
    process.env.PLATFORM_ADMIN_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    'sharmila0774@gmail.com'
  ).trim().toLowerCase();

  const password =
    process.env.PLATFORM_ADMIN_PASSWORD ||
    process.env.SEED_ADMIN_PASSWORD ||
    'sharmi1234';

  const name =
    process.env.PLATFORM_ADMIN_NAME ||
    process.env.SEED_ADMIN_NAME ||
    'Platform Super Admin';

  const role = 'PLATFORM_SUPER_ADMIN';

  if (!process.env.MONGODB_URI) {
    console.error('\n❌ MONGODB_URI is not configured.');
    console.error('Please configure your database connection in server/.env:');
    console.error('Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/storeflow?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB successfully.');

    let user = await User.findOne({ email });
    if (!user) {
      // Check if user previously had the typo email
      user = await User.findOne({ email: 'sharmia0774@gmail.com' });
      if (user) {
        user.email = email;
      }
    }
    if (user) {
      user.name = name;
      user.role = role;
      user.isPlatformAdmin = true;
      user.store = null;
      user.status = 'Active';
      user.isActive = true;
      user.password = password; // pre('save') hook hashes password with bcrypt
      await user.save();
      console.log(`✅ Updated existing user "${email}" to ${role}.`);
    } else {
      user = await User.create({
        name,
        email,
        password, // pre('save') hook hashes password with bcrypt
        role,
        isPlatformAdmin: true,
        store: null,
        status: 'Active',
        isActive: true,
      });
      console.log(`✅ Created new ${role} account: "${email}".`);
    }

    await mongoose.disconnect();
    console.log('🎉 Platform Super Admin bootstrap complete.');
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log('Password has been securely hashed and stored in MongoDB.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

seedPlatformAdmin();
