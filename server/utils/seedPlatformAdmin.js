const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function ensurePlatformAdmin() {
  const email = (
    process.env.PLATFORM_ADMIN_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    'admin@storeflow.com'
  ).trim().toLowerCase();

  const explicitPassword =
    process.env.SEED_PLATFORM_ADMIN_PASSWORD ||
    process.env.PLATFORM_ADMIN_PASSWORD ||
    process.env.SEED_ADMIN_PASSWORD ||
    '';

  const isProduction = process.env.NODE_ENV === 'production';
  const password = explicitPassword || (isProduction ? '' : 'PlatformAdminPass1!');

  const name =
    process.env.PLATFORM_ADMIN_NAME ||
    process.env.SEED_ADMIN_NAME ||
    'Platform Super Admin';

  const role = 'PLATFORM_SUPER_ADMIN';

  let user = await User.findOne({ email });

  if (user) {
    user.name = name;
    user.role = role;
    user.isPlatformAdmin = true;
    user.store = null;
    user.status = 'Active';
    user.isActive = true;

    // Only update password if an explicit password was configured via environment variable
    if (explicitPassword && explicitPassword.length >= 8) {
      user.password = explicitPassword;
    }
    await user.save();
    console.log(`✅ Platform Super Admin account verified: "${email}" (${role})`);
    return user;
  } else {
    if (isProduction && (!password || password.length < 8)) {
      console.warn('⚠️ Cannot initialize Platform Super Admin: SEED_PLATFORM_ADMIN_PASSWORD missing or < 8 chars.');
      return null;
    }

    user = await User.create({
      name,
      email,
      password: password || 'Admin@12345',
      role,
      isPlatformAdmin: true,
      store: null,
      status: 'Active',
      isActive: true,
    });
    console.log(`✅ Platform Super Admin account initialized: "${email}" (${role})`);
    return user;
  }
}

async function runStandalone() {
  if (!process.env.MONGODB_URI) {
    console.error('\n❌ MONGODB_URI is not configured.');
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log('✅ Connected to MongoDB successfully.');
    await ensurePlatformAdmin();
    console.log('\nSeed process finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed with error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runStandalone();
}

module.exports = { ensurePlatformAdmin };
