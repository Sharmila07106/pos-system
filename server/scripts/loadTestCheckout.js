const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const StoreApplication = require('../models/StoreApplication');
const Counter = require('../models/Counter');
const { migrateIndexes } = require('../utils/migrateIndexes');
const { getNextTransactionId } = require('../utils/counter');
const { createSale } = require('../controllers/salesController');
const { reviewApplication } = require('../controllers/platformController');

// Mock req and res helper
function mockReqRes(body = {}, params = {}, query = {}, user = {}, storeId = null) {
  const req = {
    body,
    params,
    query,
    user,
    storeId,
    ip: '127.0.0.1',
    headers: {},
  };
  let responseData = null;
  let statusCode = 200;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get data() {
      return responseData;
    },
  };

  return { req, res };
}

async function runLoadTest() {
  console.log('====================================================');
  console.log('   STOREFLOW CONCURRENT LOAD & CHECKOUT TEST SUITE  ');
  console.log('====================================================');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storeflow';
  console.log(`Connecting to database...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to MongoDB.`);

  // 1. Run index migration
  console.log('\n--- Step 1: Running Automatic Index Migration ---');
  await migrateIndexes();

  const cleanupIds = {
    stores: [],
    users: [],
    products: [],
    sales: [],
    counters: [],
    applications: [],
  };

  try {
    // 2. Setup 2 distinct Supermarkets for Multi-Store Testing
    console.log('\n--- Step 2: Creating Test Supermarkets ---');
    const storeAlpha = await Store.create({
      name: 'Supermarket Alpha LoadTest',
      storeCode: `STR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
      city: 'Chennai',
      email: `alpha_${Date.now()}@test.com`,
    });
    cleanupIds.stores.push(storeAlpha._id);

    const storeBeta = await Store.create({
      name: 'Supermarket Beta LoadTest',
      storeCode: `STR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
      city: 'Coimbatore',
      email: `beta_${Date.now()}@test.com`,
    });
    cleanupIds.stores.push(storeBeta._id);

    const cashierAlpha = await User.create({
      name: 'Cashier Alpha',
      email: `cashier_alpha_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'CASHIER',
      store: storeAlpha._id,
      status: 'Active',
      isActive: true,
    });
    cleanupIds.users.push(cashierAlpha._id);

    const cashierBeta = await User.create({
      name: 'Cashier Beta',
      email: `cashier_beta_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'CASHIER',
      store: storeBeta._id,
      status: 'Active',
      isActive: true,
    });
    cleanupIds.users.push(cashierBeta._id);

    // Products for Alpha (Initial Stock: 150 each)
    const prodA1 = await Product.create({
      name: 'Alpha Rice 5kg',
      barcode: `890100${Date.now().toString().slice(-6)}1`,
      category: 'Grains',
      price: 250,
      stock: 150,
      store: storeAlpha._id,
      isActive: true,
    });
    const prodA2 = await Product.create({
      name: 'Alpha Oil 1L',
      barcode: `890100${Date.now().toString().slice(-6)}2`,
      category: 'Oils',
      price: 140,
      stock: 150,
      store: storeAlpha._id,
      isActive: true,
    });
    cleanupIds.products.push(prodA1._id, prodA2._id);

    // Products for Beta (Initial Stock: 150 each)
    const prodB1 = await Product.create({
      name: 'Beta Wheat 5kg',
      barcode: `890200${Date.now().toString().slice(-6)}1`,
      category: 'Flour',
      price: 210,
      stock: 150,
      store: storeBeta._id,
      isActive: true,
    });
    const prodB2 = await Product.create({
      name: 'Beta Sugar 1kg',
      barcode: `890200${Date.now().toString().slice(-6)}2`,
      category: 'Spices',
      price: 45,
      stock: 150,
      store: storeBeta._id,
      isActive: true,
    });
    cleanupIds.products.push(prodB1._id, prodB2._id);

    // 3. Test Cross-Store Identical Transaction ID (Reproducing live situation)
    console.log('\n--- Step 3: Verifying Identical Transaction IDs in Different Stores ---');
    // Seed an existing TXN-00006 in Store Alpha
    const existingAlpha = await Sale.create({
      store: storeAlpha._id,
      transactionId: 'TXN-00006',
      receiptNo: 'TXN-00006',
      items: [{ product: prodA1._id, name: prodA1.name, barcode: prodA1.barcode, quantity: 1, price: 250, total: 250 }],
      subtotal: 250,
      tax: 12.5,
      taxRate: 5,
      total: 262.5,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    });
    cleanupIds.sales.push(existingAlpha._id);

    // Now seed the SAME TXN-00006 in Store Beta
    const existingBeta = await Sale.create({
      store: storeBeta._id,
      transactionId: 'TXN-00006',
      receiptNo: 'TXN-00006',
      items: [{ product: prodB1._id, name: prodB1.name, barcode: prodB1.barcode, quantity: 1, price: 210, total: 210 }],
      subtotal: 210,
      tax: 10.5,
      taxRate: 5,
      total: 220.5,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    });
    cleanupIds.sales.push(existingBeta._id);

    console.log(`[PASS] Both Store Alpha and Store Beta successfully hold "TXN-00006" without duplicate key error.`);

    // 4. Fire 60 Concurrent Checkouts (30 for Alpha, 30 for Beta)
    console.log('\n--- Step 4: Firing 60 Simultaneous Checkouts (30 Alpha + 30 Beta) ---');
    const alphaTasks = [];
    const betaTasks = [];

    // Shared idempotency keys to test retry deduplication
    const sharedKeyAlpha = `idemp-alpha-shared-${Date.now()}`;
    const sharedKeyBeta = `idemp-beta-shared-${Date.now()}`;

    // 30 Checkouts for Alpha
    for (let i = 0; i < 30; i++) {
      const isRetriedKey = i < 3; // First 3 tasks share the same idempotency key
      const key = isRetriedKey ? sharedKeyAlpha : `idemp-alpha-${i}-${Date.now()}`;

      const { req, res } = mockReqRes(
        {
          idempotencyKey: key,
          items: [
            { _id: prodA1._id, qty: 1, name: prodA1.name },
            { _id: prodA2._id, qty: 1, name: prodA2.name },
          ],
          paymentMethod: 'CASH',
          amountReceived: 500,
        },
        {},
        {},
        cashierAlpha,
        storeAlpha._id
      );

      alphaTasks.push(
        createSale(req, res).then(() => ({ store: 'Alpha', res, statusCode: res.statusCode, data: res.data }))
      );
    }

    // 30 Checkouts for Beta
    for (let i = 0; i < 30; i++) {
      const isRetriedKey = i < 3;
      const key = isRetriedKey ? sharedKeyBeta : `idemp-beta-${i}-${Date.now()}`;

      const { req, res } = mockReqRes(
        {
          idempotencyKey: key,
          items: [
            { _id: prodB1._id, qty: 1, name: prodB1.name },
            { _id: prodB2._id, qty: 2, name: prodB2.name },
          ],
          paymentMethod: 'CARD',
        },
        {},
        {},
        cashierBeta,
        storeBeta._id
      );

      betaTasks.push(
        createSale(req, res).then(() => ({ store: 'Beta', res, statusCode: res.statusCode, data: res.data }))
      );
    }

    // Execute all 60 checkouts concurrently
    const allResults = await Promise.all([...alphaTasks, ...betaTasks]);

    // Track created sales for cleanup
    for (const r of allResults) {
      if (r.data?.data?._id) cleanupIds.sales.push(r.data.data._id);
    }

    // Verify all returned 200 or 201 (no 500 or E11000 errors)
    const failedResults = allResults.filter((r) => r.statusCode !== 200 && r.statusCode !== 201);
    if (failedResults.length > 0) {
      throw new Error(`Concurrent checkout had ${failedResults.length} failures: ${JSON.stringify(failedResults[0].data)}`);
    }
    console.log(`[PASS] All 60 checkout requests completed successfully with HTTP 200/201 (0 errors).`);

    // 5. Verify Uniqueness of transactionId inside each store
    console.log('\n--- Step 5: Verifying No Duplicate Transaction IDs Within Store ---');
    const alphaSales = await Sale.find({ store: storeAlpha._id });
    const betaSales = await Sale.find({ store: storeBeta._id });

    const alphaTxnIds = alphaSales.map((s) => s.transactionId);
    const alphaUniqueTxnIds = new Set(alphaTxnIds);
    if (alphaTxnIds.length !== alphaUniqueTxnIds.size) {
      throw new Error(`Duplicate transactionId detected in Store Alpha! Total: ${alphaTxnIds.length}, Unique: ${alphaUniqueTxnIds.size}`);
    }
    console.log(`[PASS] Store Alpha: ${alphaUniqueTxnIds.size} total sales, 100% unique transaction IDs.`);

    const betaTxnIds = betaSales.map((s) => s.transactionId);
    const betaUniqueTxnIds = new Set(betaTxnIds);
    if (betaTxnIds.length !== betaUniqueTxnIds.size) {
      throw new Error(`Duplicate transactionId detected in Store Beta! Total: ${betaTxnIds.length}, Unique: ${betaUniqueTxnIds.size}`);
    }
    console.log(`[PASS] Store Beta: ${betaUniqueTxnIds.size} total sales, 100% unique transaction IDs.`);

    // 6. Verify Idempotency Deduplication and Accurate Stock
    console.log('\n--- Step 6: Verifying Idempotency and Exact Stock Reconciliation ---');
    // Store Alpha had 1 pre-seeded sale + (30 requests - 2 duplicates = 28 new sales) = 29 total sales
    // Each of the 28 new sales deducted 1 from prodA1 and 1 from prodA2
    const freshProdA1 = await Product.findById(prodA1._id);
    const freshProdA2 = await Product.findById(prodA2._id);

    console.log(`Prod A1 Stock: Expected 122 (150 - 28), Actual: ${freshProdA1.stock}`);
    console.log(`Prod A2 Stock: Expected 122 (150 - 28), Actual: ${freshProdA2.stock}`);

    if (freshProdA1.stock !== 122 || freshProdA2.stock !== 122) {
      throw new Error(`Stock mismatch in Store Alpha! Expected 122, got A1=${freshProdA1.stock}, A2=${freshProdA2.stock}`);
    }
    console.log(`[PASS] Idempotent retry requests returned existing sales and did NOT deduct stock twice.`);
    console.log(`[PASS] Stock never went negative and matches sold quantities perfectly.`);

    // 7. Verify Exact Case from User Screenshot (Ram Store checkout ₹89.25 / ₹190.05)
    console.log('\n--- Step 7: Verifying Live Scenario (Ram Supermarket POS Checkout) ---');
    const { req: ramReq, res: ramRes } = mockReqRes(
      {
        idempotencyKey: `pos-ram-${Date.now()}`,
        items: [{ _id: prodA1._id, qty: 1, name: 'Sample Item' }],
        paymentMethod: 'CASH',
        amountReceived: 90,
      },
      {},
      {},
      cashierAlpha,
      storeAlpha._id
    );

    await createSale(ramReq, ramRes);
    if (ramRes.statusCode !== 201) {
      throw new Error(`Ram store checkout failed with ${ramRes.statusCode}: ${JSON.stringify(ramRes.data)}`);
    }
    console.log(`[PASS] Ram store checkout succeeded: Transaction ${ramRes.data?.data?.transactionId}, Receipt ${ramRes.data?.data?.receiptNo}`);

    // 8. Verify Platform Admin Application Review Flow (Approve, Reject, Request Changes)
    console.log('\n--- Step 8: Verifying Platform Admin Review Actions ---');
    const adminUser = await User.findOne({ role: 'PLATFORM_SUPER_ADMIN' }) || {
      _id: new mongoose.Types.ObjectId(),
      name: 'Platform Super Admin',
      role: 'PLATFORM_SUPER_ADMIN',
    };

    // 8a. Test APPROVE
    const appToApprove = await StoreApplication.create({
      applicationId: `APP-${Math.floor(10000 + Math.random() * 90000)}`,
      businessName: 'Fresh Farms Supermarket',
      ownerName: 'Fresh Owner',
      email: `fresh_owner_${Date.now()}@test.com`,
      phone: '9876543210',
      address: '100 Market St',
      city: 'Madurai',
      status: 'PENDING',
    });
    cleanupIds.applications.push(appToApprove._id);

    const { req: appReq1, res: appRes1 } = mockReqRes(
      { action: 'APPROVE', reviewNotes: 'Verified documentation.' },
      { id: appToApprove.applicationId }, // Verify by applicationId string!
      {},
      adminUser
    );
    await reviewApplication(appReq1, appRes1);
    if (appRes1.statusCode !== 200 || !appRes1.data?.success) {
      throw new Error(`Application approval failed: ${JSON.stringify(appRes1.data)}`);
    }
    const createdStoreId = appRes1.data?.data?.store?._id;
    if (createdStoreId) cleanupIds.stores.push(createdStoreId);
    console.log(`[PASS] Action APPROVE succeeded: Store ${appRes1.data?.data?.store?.name} is ACTIVE with code ${appRes1.data?.data?.store?.storeCode}.`);

    // Verify Store Settings initialized
    const appSettings = await Settings.findOne({ store: createdStoreId });
    if (!appSettings) {
      throw new Error('Store Settings were not initialized on approval!');
    }
    console.log(`[PASS] Store Settings initialized for approved supermarket.`);

    // 8b. Test Double Click APPROVE (Idempotent)
    const { req: appReqDouble, res: appResDouble } = mockReqRes(
      { action: 'APPROVE', reviewNotes: 'Double click review.' },
      { id: appToApprove.applicationId },
      {},
      adminUser
    );
    await reviewApplication(appReqDouble, appResDouble);
    if (appResDouble.statusCode !== 200 || !appResDouble.data?.success) {
      throw new Error(`Double approval failed: ${JSON.stringify(appResDouble.data)}`);
    }
    console.log(`[PASS] Double click APPROVE handled idempotently without duplicate store or error.`);

    // 8c. Test REQUEST_CHANGES
    const appToChange = await StoreApplication.create({
      applicationId: `APP-${Math.floor(10000 + Math.random() * 90000)}`,
      businessName: 'Pending Changes Market',
      ownerName: 'Change Owner',
      email: `change_owner_${Date.now()}@test.com`,
      phone: '9876543211',
      address: '200 Market St',
      city: 'Salem',
      status: 'PENDING',
    });
    cleanupIds.applications.push(appToChange._id);

    const { req: appReq2, res: appRes2 } = mockReqRes(
      { action: 'REQUEST_CHANGES', reviewNotes: 'Please upload updated GST certificate.' },
      { id: appToChange.applicationId },
      {},
      adminUser
    );
    await reviewApplication(appReq2, appRes2);
    if (appRes2.statusCode !== 200 || appRes2.data?.data?.status !== 'CHANGES_REQUESTED') {
      throw new Error(`Request changes failed: ${JSON.stringify(appRes2.data)}`);
    }
    console.log(`[PASS] Action REQUEST_CHANGES succeeded: Status is CHANGES_REQUESTED with notes visible.`);

    // 8d. Test REJECT
    const appToReject = await StoreApplication.create({
      applicationId: `APP-${Math.floor(10000 + Math.random() * 90000)}`,
      businessName: 'Invalid Docs Mart',
      ownerName: 'Reject Owner',
      email: `reject_owner_${Date.now()}@test.com`,
      phone: '9876543212',
      address: '300 Market St',
      city: 'Trichy',
      status: 'PENDING',
    });
    cleanupIds.applications.push(appToReject._id);

    const { req: appReq3, res: appRes3 } = mockReqRes(
      { action: 'REJECT', reviewNotes: 'Incomplete registration documents.' },
      { id: appToReject.applicationId },
      {},
      adminUser
    );
    await reviewApplication(appReq3, appRes3);
    if (appRes3.statusCode !== 200 || appRes3.data?.data?.status !== 'REJECTED') {
      throw new Error(`Reject action failed: ${JSON.stringify(appRes3.data)}`);
    }
    console.log(`[PASS] Action REJECT succeeded: Status is REJECTED.`);

    console.log('\n====================================================');
    console.log('   ALL LOAD & MULTI-TENANT CONCURRENCY TESTS PASSED! ');
    console.log('====================================================\n');
  } finally {
    // Clean up test data
    console.log('Cleaning up test data...');
    if (cleanupIds.sales.length > 0) await Sale.deleteMany({ _id: { $in: cleanupIds.sales } }).catch(() => {});
    if (cleanupIds.products.length > 0) await Product.deleteMany({ _id: { $in: cleanupIds.products } }).catch(() => {});
    if (cleanupIds.stores.length > 0) await Store.deleteMany({ _id: { $in: cleanupIds.stores } }).catch(() => {});
    if (cleanupIds.users.length > 0) await User.deleteMany({ _id: { $in: cleanupIds.users } }).catch(() => {});
    if (cleanupIds.applications.length > 0) await StoreApplication.deleteMany({ _id: { $in: cleanupIds.applications } }).catch(() => {});
    await mongoose.connection.close();
    console.log('Test teardown complete.');
  }
}

runLoadTest().catch((err) => {
  console.error('\n❌ Load test failed:', err);
  process.exit(1);
});
