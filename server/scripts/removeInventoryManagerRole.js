const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { getCleanUri } = require('../config/db');

async function migrateInventoryManagerRoles() {
  const uri = getCleanUri() || 'mongodb://127.0.0.1:27017/storeflow';
  console.log('Connecting to MongoDB for migration...');
  console.log(`Target database: ${uri.replace(/:([^@/]+)@/, ':****@')}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const invitationsCollection = db.collection('invitations');

    // Find and update users with any variant of inventory_manager role
    const userFilter = {
      role: { $regex: /^inventory[-_ ]?manager$/i },
    };

    const countUsersToUpdate = await usersCollection.countDocuments(userFilter);
    console.log(`Found ${countUsersToUpdate} user(s) with Inventory Manager role.`);

    let usersModified = 0;
    if (countUsersToUpdate > 0) {
      const updateResult = await usersCollection.updateMany(userFilter, {
        $set: { role: 'CASHIER' },
      });
      usersModified = updateResult.modifiedCount;
      console.log(`✅ Successfully updated ${usersModified} user(s) to role 'CASHIER'.`);
    } else {
      console.log('No users found with Inventory Manager role. 0 users modified.');
    }

    // Also update any pending/existing invitations with inventory_manager role
    const inviteFilter = {
      role: { $regex: /^inventory[-_ ]?manager$/i },
    };
    const countInvitesToUpdate = await invitationsCollection.countDocuments(inviteFilter);
    console.log(`Found ${countInvitesToUpdate} invitation(s) with Inventory Manager role.`);

    let invitesModified = 0;
    if (countInvitesToUpdate > 0) {
      const inviteUpdateResult = await invitationsCollection.updateMany(inviteFilter, {
        $set: { role: 'CASHIER' },
      });
      invitesModified = inviteUpdateResult.modifiedCount;
      console.log(`✅ Successfully updated ${invitesModified} invitation(s) to role 'CASHIER'.`);
    }

    console.log('\nMigration complete.');
    console.log(`Summary: ${usersModified} user(s) migrated, ${invitesModified} invitation(s) migrated.`);
  } catch (err) {
    console.error('Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrateInventoryManagerRoles();
