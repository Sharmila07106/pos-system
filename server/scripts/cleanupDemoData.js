const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();
const mongoose = require('mongoose');

const Store = require('../models/Store');
const StoreApplication = require('../models/StoreApplication');
const User = require('../models/User');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const WasteRecord = require('../models/WasteRecord');
const Complaint = require('../models/Complaint');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const LoginEvent = require('../models/LoginEvent');
const { getCleanUri } = require('../config/db');

// Explicit seed identifiers to clean
const FAKE_STORE_CODES = ['STR-7714', 'STR-4431', 'STR-3329', 'STR-4459'];
const FAKE_STORE_NAMES = [
  'Madurai Daily Needs',
  'Nellai Express Grocery',
  'Kongu Supermarket',
  'Kovai Fresh Hypermarket',
  'Green Basket',
  'City Mart',
];
const FAKE_STORE_EMAILS = [
  'anand@maduraidaily.com',
  'muthu@nellaiexpress.com',
  'kongu@kongumart.com',
  'suresh@kovaifresh.com',
];

const FAKE_APP_IDS = ['APP-88210', 'APP-77142', 'APP-66519', 'APP-55428', 'APP-44317'];
const FAKE_APP_NAMES = [
  'Kovai Fresh Hypermarket',
  'Madurai Daily Needs',
  'Cauvery Super Market',
  'Salem Central Mart',
  'Nellai Express Grocery',
  'Green Basket',
  'City Mart',
];

const FAKE_USER_EMAILS = [
  'suresh@kovaifresh.com',
  'anand@maduraidaily.com',
  'muthu@nellaiexpress.com',
  'kongu@kongumart.com',
  'priya@cauverysuper.com',
  'venkat@salemmart.com',
];

const FAKE_COMPLAINT_TICKETS = ['TICK-1001', 'TICK-1002', 'TICK-1003'];

async function runCleanup(options = {}) {
  const confirm = options.confirm === true;
  const standalone = options.standalone === true;

  console.log('\n========================================================');
  console.log(
    confirm
      ? '🚨 RUNNING DEMO DATA CLEANUP [CONFIRM MODE - DELETING] 🚨'
      : '🔍 RUNNING DEMO DATA CLEANUP [DRY RUN MODE - PREVIEW ONLY] 🔍'
  );
  console.log('========================================================\n');

  // 1. Identify Fake Stores (never include Ram Store)
  const fakeStores = await Store.find({
    $and: [
      { storeCode: { $ne: 'APP-91134' } },
      { email: { $ne: 'ramstore@gmail.com' } },
      { businessEmail: { $ne: 'ramstore@gmail.com' } },
      { name: { $ne: 'Ram Store' } },
      {
        $or: [
          { storeCode: { $in: FAKE_STORE_CODES } },
          { name: { $in: FAKE_STORE_NAMES } },
          { email: { $in: FAKE_STORE_EMAILS } },
          { businessEmail: { $in: FAKE_STORE_EMAILS } },
        ],
      },
    ],
  });

  const fakeStoreIds = fakeStores.map((s) => s._id);

  // 2. Identify Fake Applications (never include APP-91134)
  const fakeApps = await StoreApplication.find({
    $and: [
      { applicationId: { $ne: 'APP-91134' } },
      { email: { $ne: 'ramstore@gmail.com' } },
      { businessName: { $ne: 'Ram Store' } },
      {
        $or: [
          { applicationId: { $in: FAKE_APP_IDS } },
          { businessName: { $in: FAKE_APP_NAMES } },
          { email: { $in: FAKE_STORE_EMAILS } },
        ],
      },
    ],
  });

  const fakeAppIds = fakeApps.map((a) => a.applicationId);

  // 3. Identify Fake Users (never include platform admin, ramstore, or cashier)
  const fakeUsers = await User.find({
    $and: [
      { role: { $ne: 'PLATFORM_SUPER_ADMIN' } },
      { isPlatformAdmin: { $ne: true } },
      { email: { $ne: 'ramstore@gmail.com' } },
      { email: { $ne: 'cashier@ramstore.com' } },
      { email: { $ne: 'user2@gmail.com' } },
      {
        $or: [
          { email: { $in: FAKE_USER_EMAILS } },
          { store: { $in: fakeStoreIds } },
        ],
      },
    ],
  });

  // 4. Identify Fake Complaints
  const fakeComplaints = await Complaint.find({
    $or: [
      { ticketNo: { $in: FAKE_COMPLAINT_TICKETS } },
      { store: { $in: fakeStoreIds } },
    ],
  });

  // 5. Identify Dependent Store Data for Fake Stores
  const fakeProducts = fakeStoreIds.length ? await Product.find({ store: { $in: fakeStoreIds } }) : [];
  const fakeBatches = fakeStoreIds.length ? await Batch.find({ store: { $in: fakeStoreIds } }) : [];
  const fakeSales = fakeStoreIds.length ? await Sale.find({ store: { $in: fakeStoreIds } }) : [];
  const fakeStockMovements = fakeStoreIds.length ? await StockMovement.find({ store: { $in: fakeStoreIds } }) : [];
  const fakeWasteRecords = fakeStoreIds.length ? await WasteRecord.find({ store: { $in: fakeStoreIds } }) : [];
  const fakeInvitations = fakeStoreIds.length ? await Invitation.find({ store: { $in: fakeStoreIds } }) : [];

  // 6. Identify Audit / Activity / Login logs for fake records
  const fakeAuditLogs = await AuditLog.find({
    $or: [
      { store: { $in: fakeStoreIds } },
      { entityId: { $in: fakeAppIds } },
      { 'details.applicationId': { $in: fakeAppIds } },
    ],
  });

  const fakeActivityLogs = await ActivityLog.find({
    $or: [
      { store: { $in: fakeStoreIds } },
      { targetId: { $in: fakeStoreIds.map((id) => id.toString()) } },
      { targetId: { $in: fakeAppIds } },
    ],
  });

  const fakeLoginEvents = await LoginEvent.find({
    $or: [
      { userEmail: { $in: FAKE_USER_EMAILS } },
      { store: { $in: fakeStoreIds } },
    ],
  });

  // Log Itemized Preview
  console.log('--- ITEMS TARGETED FOR REMOVAL ---');
  console.log(
    `📦 Fake Stores (${fakeStores.length}):`,
    fakeStores.map((s) => `${s.name} [${s.storeCode || 'no-code'}, ${s.city || 'N/A'}]`).join(', ') || 'None found'
  );
  console.log(
    `📋 Fake Applications (${fakeApps.length}):`,
    fakeApps.map((a) => `${a.applicationId} (${a.businessName} - ${a.status})`).join(', ') || 'None found'
  );
  console.log(
    `👤 Fake Users (${fakeUsers.length}):`,
    fakeUsers.map((u) => `${u.email} [${u.role}]`).join(', ') || 'None found'
  );
  console.log(
    `🎫 Fake Complaints (${fakeComplaints.length}):`,
    fakeComplaints.map((c) => `${c.ticketNo} (${c.subject})`).join(', ') || 'None found'
  );
  console.log(`🛒 Fake Store Products: ${fakeProducts.length}`);
  console.log(`📦 Fake Store Batches: ${fakeBatches.length}`);
  console.log(`🧾 Fake Store Sales: ${fakeSales.length}`);
  console.log(`📊 Fake Stock Movements: ${fakeStockMovements.length}`);
  console.log(`🗑️  Fake Waste Logs: ${fakeWasteRecords.length}`);
  console.log(`✉️  Fake Staff Invitations: ${fakeInvitations.length}`);
  console.log(`📜 Matching Audit Logs: ${fakeAuditLogs.length}`);
  console.log(`📝 Matching Activity Logs: ${fakeActivityLogs.length}`);
  console.log(`🔑 Matching Login Events: ${fakeLoginEvents.length}`);

  // Items Preserved
  const realStores = await Store.find({ _id: { $nin: fakeStoreIds } });
  const realApps = await StoreApplication.find({
    applicationId: { $nin: fakeAppIds },
  });
  const realUsers = await User.find({ _id: { $nin: fakeUsers.map((u) => u._id) } });

  console.log('\n--- VERIFIED PRESERVED ITEMS (KEEP) ---');
  console.log(
    `🏬 Real Stores Kept (${realStores.length}):`,
    realStores.map((s) => `${s.name} [${s.storeCode || 'no-code'}, ${s.city || 'N/A'}]`).join(', ') || 'None'
  );
  console.log(
    `📄 Real Applications Kept (${realApps.length}):`,
    realApps.map((a) => `${a.applicationId} (${a.businessName})`).join(', ') || 'None'
  );
  console.log(
    `👥 Real Users Kept (${realUsers.length}):`,
    realUsers.map((u) => `${u.email} (${u.role})`).join(', ') || 'None'
  );

  if (!confirm) {
    console.log('\n⚠️  DRY RUN COMPLETED. No records were modified or deleted.');
    console.log('To execute permanent deletion, run this script with --confirm:');
    console.log('   npm run cleanup:demo -- --confirm\n');
    return {
      mode: 'DRY_RUN',
      deleted: false,
      targetedCounts: {
        stores: fakeStores.length,
        applications: fakeApps.length,
        users: fakeUsers.length,
        complaints: fakeComplaints.length,
        products: fakeProducts.length,
        sales: fakeSales.length,
        auditLogs: fakeAuditLogs.length,
        activityLogs: fakeActivityLogs.length,
        loginEvents: fakeLoginEvents.length,
      },
    };
  }

  // EXECUTE PERMANENT DELETION
  console.log('\n🚀 Executing permanent deletion of fake seed records...');

  const results = {
    storesDeleted: fakeStoreIds.length ? (await Store.deleteMany({ _id: { $in: fakeStoreIds } })).deletedCount : 0,
    applicationsDeleted: fakeApps.length
      ? (await StoreApplication.deleteMany({ _id: { $in: fakeApps.map((a) => a._id) } })).deletedCount
      : 0,
    usersDeleted: fakeUsers.length
      ? (await User.deleteMany({ _id: { $in: fakeUsers.map((u) => u._id) } })).deletedCount
      : 0,
    complaintsDeleted: fakeComplaints.length
      ? (await Complaint.deleteMany({ _id: { $in: fakeComplaints.map((c) => c._id) } })).deletedCount
      : 0,
    productsDeleted: fakeStoreIds.length ? (await Product.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount : 0,
    batchesDeleted: fakeStoreIds.length ? (await Batch.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount : 0,
    salesDeleted: fakeStoreIds.length ? (await Sale.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount : 0,
    stockMovementsDeleted: fakeStoreIds.length
      ? (await StockMovement.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount
      : 0,
    wasteRecordsDeleted: fakeStoreIds.length
      ? (await WasteRecord.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount
      : 0,
    invitationsDeleted: fakeStoreIds.length
      ? (await Invitation.deleteMany({ store: { $in: fakeStoreIds } })).deletedCount
      : 0,
    auditLogsDeleted: fakeAuditLogs.length
      ? (await AuditLog.deleteMany({ _id: { $in: fakeAuditLogs.map((l) => l._id) } })).deletedCount
      : 0,
    activityLogsDeleted: fakeActivityLogs.length
      ? (await ActivityLog.deleteMany({ _id: { $in: fakeActivityLogs.map((l) => l._id) } })).deletedCount
      : 0,
    loginEventsDeleted: fakeLoginEvents.length
      ? (await LoginEvent.deleteMany({ _id: { $in: fakeLoginEvents.map((l) => l._id) } })).deletedCount
      : 0,
  };

  console.log('\n✅ CLEANUP COMPLETE:');
  console.log(`   Stores Deleted: ${results.storesDeleted}`);
  console.log(`   Applications Deleted: ${results.applicationsDeleted}`);
  console.log(`   Users Deleted: ${results.usersDeleted}`);
  console.log(`   Complaints Deleted: ${results.complaintsDeleted}`);
  console.log(`   Products Deleted: ${results.productsDeleted}`);
  console.log(`   Sales Deleted: ${results.salesDeleted}`);
  console.log(`   Audit/Activity/Login Logs Deleted: ${results.auditLogsDeleted + results.activityLogsDeleted + results.loginEventsDeleted}`);
  console.log('========================================================\n');

  return {
    mode: 'CONFIRMED',
    deleted: true,
    results,
  };
}

async function runCli() {
  const uri = getCleanUri() || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storeflow';
  const confirm = process.argv.includes('--confirm');

  console.log(`Connecting to MongoDB: ${uri.replace(/:([^@/]+)@/, ':****@')}...`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB.');

    await runCleanup({ confirm, standalone: true });
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = { runCleanup };
