const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { getCleanUri } = require('../config/db');
const User = require('../models/User');
const Store = require('../models/Store');
const StoreApplication = require('../models/StoreApplication');
const AuditLog = require('../models/AuditLog');
const Invitation = require('../models/Invitation');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Sale = require('../models/Sale');
const Complaint = require('../models/Complaint');
const ActivityLog = require('../models/ActivityLog');
const LoginEvent = require('../models/LoginEvent');

async function seedAll() {
  const uri = getCleanUri() || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storeflow';
  console.log('====================================================');
  console.log('       STOREFLOW DATABASE SEED ALL SCRIPT           ');
  console.log('====================================================');
  console.log(`Connecting to: ${uri.replace(/:([^@/]+)@/, ':****@')}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB successfully.\n');

    let totalCreated = 0;

    // Credentials from environment with fallbacks
    const platformAdminPassword =
      process.env.SEED_PLATFORM_ADMIN_PASSWORD ||
      process.env.PLATFORM_ADMIN_PASSWORD ||
      process.env.SEED_ADMIN_PASSWORD ||
      'AdminPass2026!';

    const storeAdminPassword =
      process.env.SEED_STORE_ADMIN_PASSWORD ||
      process.env.STORE_ADMIN_PASSWORD ||
      'StorePass2026!';

    const cashierPassword =
      process.env.SEED_CASHIER_PASSWORD ||
      process.env.CASHIER_PASSWORD ||
      'CashierPass2026!';

    // ----------------------------------------------------
    // STEP 1: Platform Super Admin
    // ----------------------------------------------------
    console.log('--- Step 1: Platform Super Admin ---');
    const platformAdminEmail = (
      process.env.PLATFORM_ADMIN_EMAIL ||
      process.env.SEED_ADMIN_EMAIL ||
      'admin@storeflow.com'
    ).trim().toLowerCase();

    let platformAdmin = await User.findOne({ email: platformAdminEmail });
    if (!platformAdmin) {
      platformAdmin = await User.create({
        name: process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator',
        email: platformAdminEmail,
        password: platformAdminPassword,
        role: 'PLATFORM_SUPER_ADMIN',
        isPlatformAdmin: true,
        store: null,
        status: 'Active',
        isActive: true,
      });
      totalCreated++;
      console.log(`[CREATED] Platform Super Admin: ${platformAdminEmail} (${platformAdmin.name})`);
    } else {
      console.log(`[EXISTS] Platform Super Admin already exists: ${platformAdminEmail}`);
    }

    // ----------------------------------------------------
    // STEP 2: Supermarket "Ram Store" & Application
    // ----------------------------------------------------
    console.log('\n--- Step 2: Supermarket "Ram Store" & Application ---');
    let ramStore = await Store.findOne({
      $or: [{ storeCode: 'APP-91134' }, { email: 'ramstore@gmail.com' }, { businessEmail: 'ramstore@gmail.com' }],
    });

    if (!ramStore) {
      ramStore = await Store.create({
        name: 'Ram Store',
        storeCode: 'APP-91134',
        email: 'ramstore@gmail.com',
        businessEmail: 'ramstore@gmail.com',
        phone: '6666888899',
        address: '12 Gandhi Road, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        status: 'ACTIVE',
        statusReason: 'Approved by Platform Super Admin during onboarding verification',
        reviewedAt: new Date(Date.now() - 7 * 86400 * 1000),
        reviewedBy: platformAdmin._id,
        currency: '₹',
        taxRate: 5,
        gstin: '33AAAAA0000A1Z5',
        receiptHeader: 'Ram Store - Quality & Freshness Everyday',
        receiptFooter: 'Thank you for shopping at Ram Store! Visit again.',
        maxCashiers: 10,
      });
      totalCreated++;
      console.log(`[CREATED] Supermarket: Ram Store (APP-91134, Chennai, TN)`);
    } else {
      console.log(`[EXISTS] Supermarket already exists: Ram Store (ID: ${ramStore._id})`);
    }

    // StoreApplication for Ram Store
    let ramApp = await StoreApplication.findOne({ applicationId: 'APP-91134' });
    if (!ramApp) {
      ramApp = await StoreApplication.create({
        applicationId: 'APP-91134',
        businessName: 'Ram Store',
        ownerName: 'Ram',
        email: 'ramstore@gmail.com',
        phone: '6666888899',
        address: '12 Gandhi Road, T. Nagar',
        city: 'Chennai',
        storeType: 'Supermarket',
        storeSize: 'Medium (1000-3000 sq ft)',
        branchesCount: 1,
        registrationNumber: 'TN-CHE-2026-91134',
        status: 'APPROVED',
        reviewNotes: 'Documents verified. Store approved for full retail operations.',
        reviewedBy: platformAdmin._id,
        reviewedAt: new Date(Date.now() - 7 * 86400 * 1000),
        createdStore: ramStore._id,
        createdAt: new Date(Date.now() - 8 * 86400 * 1000),
      });
      totalCreated++;
      console.log(`[CREATED] StoreApplication: APP-91134 (APPROVED)`);

      // Audit Log for Approval
      await AuditLog.create({
        store: ramStore._id,
        actor: platformAdmin._id,
        actorName: platformAdmin.name,
        actorRole: platformAdmin.role,
        action: 'APPLICATION_APPROVED',
        entity: 'StoreApplication',
        entityId: 'APP-91134',
        details: {
          applicationId: 'APP-91134',
          businessName: 'Ram Store',
          status: 'APPROVED',
          storeId: ramStore._id.toString(),
        },
        createdAt: new Date(Date.now() - 7 * 86400 * 1000),
      });
      totalCreated++;
      console.log(`[CREATED] AuditLog: APPLICATION_APPROVED for Ram Store`);
    } else {
      console.log(`[EXISTS] StoreApplication already exists: APP-91134`);
    }

    // ----------------------------------------------------
    // STEP 3: Store Admin User (Ram)
    // ----------------------------------------------------
    console.log('\n--- Step 3: Store Admin User (Ram) ---');
    const storeAdminEmail = 'ramstore@gmail.com';
    let storeAdmin = await User.findOne({ email: storeAdminEmail });
    if (!storeAdmin) {
      storeAdmin = await User.create({
        name: 'Ram',
        email: storeAdminEmail,
        password: storeAdminPassword,
        role: 'STORE_ADMIN',
        store: ramStore._id,
        status: 'Active',
        isActive: true,
      });
      totalCreated++;
      console.log(`[CREATED] Store Admin: ${storeAdminEmail} (Ram)`);
    } else {
      console.log(`[EXISTS] Store Admin already exists: ${storeAdminEmail}`);
    }

    if (!ramStore.ownerUser || ramStore.ownerUser.toString() !== storeAdmin._id.toString()) {
      ramStore.ownerUser = storeAdmin._id;
      await ramStore.save();
    }

    // ----------------------------------------------------
    // STEP 4: Cashier User (User2) & Accepted Invitation
    // ----------------------------------------------------
    console.log('\n--- Step 4: Cashier User (User2) & Invitation ---');
    const cashierEmail = 'cashier@ramstore.com';
    let cashier = await User.findOne({ email: cashierEmail });
    if (!cashier) {
      cashier = await User.create({
        name: 'User2',
        email: cashierEmail,
        password: cashierPassword,
        role: 'CASHIER',
        store: ramStore._id,
        status: 'Active',
        isActive: true,
      });
      totalCreated++;
      console.log(`[CREATED] Cashier User: ${cashierEmail} (User2)`);
    } else {
      console.log(`[EXISTS] Cashier User already exists: ${cashierEmail}`);
    }

    let cashierInvite = await Invitation.findOne({
      store: ramStore._id,
      email: cashierEmail,
    });
    if (!cashierInvite) {
      cashierInvite = await Invitation.create({
        store: ramStore._id,
        name: 'User2',
        email: cashierEmail,
        role: 'CASHIER',
        token: 'token_user2_ramstore_accepted',
        status: 'ACCEPTED',
        invitedBy: storeAdmin._id,
        acceptedBy: cashier._id,
        expiresAt: new Date(Date.now() + 30 * 86400 * 1000),
        acceptedAt: new Date(Date.now() - 6 * 86400 * 1000),
        createdAt: new Date(Date.now() - 6 * 86400 * 1000),
      });
      totalCreated++;
      console.log(`[CREATED] Invitation: Accepted staff invite for ${cashierEmail}`);
    } else {
      console.log(`[EXISTS] Invitation already exists for: ${cashierEmail}`);
    }

    // ----------------------------------------------------
    // STEP 5: 10 Supermarket Products & Initial Stock Movements
    // ----------------------------------------------------
    console.log('\n--- Step 5: 10 Supermarket Products & Stock Movements ---');
    const productCatalog = [
      {
        name: 'Basmati Rice 1kg',
        category: 'Grocery',
        price: 95,
        costPrice: 75,
        stock: 100,
        lowStockThreshold: 15,
        sku: 'GROC-RICE-01',
        barcode: '8901030010011',
        supplier: 'India Gate Mills',
        imageUrl: '/product-images/rice.svg',
      },
      {
        name: 'Toor Dal 1kg',
        category: 'Grocery',
        price: 140,
        costPrice: 110,
        stock: 80,
        lowStockThreshold: 10,
        sku: 'GROC-DAL-02',
        barcode: '8901030010028',
        supplier: 'Tata Sampann',
        imageUrl: '/product-images/toor-dal.svg',
      },
      {
        name: 'Sunflower Oil 1L',
        category: 'Grocery',
        price: 150,
        costPrice: 125,
        stock: 60,
        lowStockThreshold: 10,
        sku: 'GROC-OIL-03',
        barcode: '8901030010035',
        supplier: 'Fortune Refined',
        imageUrl: '/product-images/sunflower-oil.svg',
      },
      {
        name: 'Sugar 1kg',
        category: 'Grocery',
        price: 48,
        costPrice: 38,
        stock: 120,
        lowStockThreshold: 20,
        sku: 'GROC-SUG-04',
        barcode: '8901030010042',
        supplier: 'Madhur Pure Sugar',
        imageUrl: '/product-images/sugar.svg',
      },
      {
        name: 'Tata Salt 1kg',
        category: 'Grocery',
        price: 28,
        costPrice: 20,
        stock: 110,
        lowStockThreshold: 15,
        sku: 'GROC-SLT-05',
        barcode: '8901030010059',
        supplier: 'Tata Consumer Products',
        imageUrl: '/product-images/salt.svg',
      },
      {
        name: 'Amul Butter 500g',
        category: 'Dairy',
        price: 275,
        costPrice: 240,
        stock: 45,
        lowStockThreshold: 8,
        sku: 'DAIRY-BTR-06',
        barcode: '8901030010066',
        supplier: 'Gujarat Co-operative Milk',
        imageUrl: '/product-images/butter.svg',
      },
      {
        name: 'Britannia Bread 400g',
        category: 'Bakery',
        price: 45,
        costPrice: 35,
        stock: 50,
        lowStockThreshold: 10,
        sku: 'BAKE-BRD-07',
        barcode: '8901030010073',
        supplier: 'Britannia Industries',
        imageUrl: '/product-images/bread.svg',
      },
      {
        name: 'Maggi 2-Minute Noodles 280g',
        category: 'Snacks',
        price: 55,
        costPrice: 42,
        stock: 90,
        lowStockThreshold: 15,
        sku: 'SNAK-MAG-08',
        barcode: '8901030010080',
        supplier: 'Nestle India',
        imageUrl: '/product-images/noodles.svg',
      },
      {
        name: 'Tata Tea Gold 500g',
        category: 'Beverages',
        price: 310,
        costPrice: 260,
        stock: 40,
        lowStockThreshold: 10,
        sku: 'BEV-TEA-09',
        barcode: '8901030010097',
        supplier: 'Tata Global Beverages',
        imageUrl: '/product-images/tea.svg',
      },
      {
        name: 'Dettol Handwash 200ml',
        category: 'Personal Care',
        price: 99,
        costPrice: 75,
        stock: 70,
        lowStockThreshold: 12,
        sku: 'PC-DET-10',
        barcode: '8901030010103',
        supplier: 'Reckitt Benckiser',
        imageUrl: '/product-images/handwash.svg',
      },
    ];

    const seededProducts = [];

    for (const pData of productCatalog) {
      let product = await Product.findOne({ store: ramStore._id, barcode: pData.barcode });
      if (!product) {
        product = await Product.create({
          ...pData,
          image: pData.imageUrl,
          store: ramStore._id,
          isActive: true,
        });
        totalCreated++;

        // Initial stock movement record
        await StockMovement.create({
          store: ramStore._id,
          product: product._id,
          type: 'RESTOCK',
          quantityChange: pData.stock,
          stockBefore: 0,
          stockAfter: pData.stock,
          reference: 'Initial Stock Intake / Opening Balance',
          performedByUser: storeAdmin._id,
          performedBy: storeAdmin.name,
          createdAt: new Date(Date.now() - 7 * 86400 * 1000),
        });
        totalCreated++;

        console.log(`[CREATED] Product: ${product.name} (Barcode: ${product.barcode}, Stock: ${product.stock})`);
      } else {
        if (!product.imageUrl || !product.image) {
          product.imageUrl = pData.imageUrl;
          product.image = pData.imageUrl;
          await product.save();
          console.log(`[UPDATED] Product image: ${product.name} -> ${pData.imageUrl}`);
        }
        console.log(`[EXISTS] Product already exists: ${product.name}`);
      }
      seededProducts.push(product);
    }

    // ----------------------------------------------------
    // STEP 6: 5 Completed Bills Across 5 Days in Last 7 Days
    // ----------------------------------------------------
    console.log('\n--- Step 6: 5 Completed Bills with Stock Deduction ---');
    const salesPlans = [
      {
        dayOffset: 5,
        transactionId: 'TXN-RAM-001',
        receiptNo: 'REC-RAM-001',
        paymentMethod: 'CASH',
        items: [
          { pIndex: 0, qty: 2 }, // Basmati Rice
          { pIndex: 3, qty: 1 }, // Sugar
          { pIndex: 7, qty: 2 }, // Maggi
        ],
      },
      {
        dayOffset: 4,
        transactionId: 'TXN-RAM-002',
        receiptNo: 'REC-RAM-002',
        paymentMethod: 'UPI',
        items: [
          { pIndex: 1, qty: 1 }, // Toor Dal
          { pIndex: 4, qty: 2 }, // Tata Salt
          { pIndex: 5, qty: 1 }, // Amul Butter
        ],
      },
      {
        dayOffset: 3,
        transactionId: 'TXN-RAM-003',
        receiptNo: 'REC-RAM-003',
        paymentMethod: 'CARD',
        items: [
          { pIndex: 2, qty: 1 }, // Sunflower Oil
          { pIndex: 6, qty: 2 }, // Bread
          { pIndex: 8, qty: 1 }, // Tata Tea Gold
        ],
      },
      {
        dayOffset: 2,
        transactionId: 'TXN-RAM-004',
        receiptNo: 'REC-RAM-004',
        paymentMethod: 'CASH',
        items: [
          { pIndex: 0, qty: 1 }, // Basmati Rice
          { pIndex: 9, qty: 2 }, // Dettol Handwash
        ],
      },
      {
        dayOffset: 1,
        transactionId: 'TXN-RAM-005',
        receiptNo: 'REC-RAM-005',
        paymentMethod: 'UPI',
        items: [
          { pIndex: 1, qty: 2 }, // Toor Dal
          { pIndex: 2, qty: 1 }, // Sunflower Oil
          { pIndex: 7, qty: 3 }, // Maggi
        ],
      },
    ];

    for (const plan of salesPlans) {
      let sale = await Sale.findOne({ transactionId: plan.transactionId });
      if (!sale) {
        const saleDate = new Date(Date.now() - plan.dayOffset * 86400 * 1000);
        const saleItems = [];
        let subtotal = 0;

        for (const itemPlan of plan.items) {
          const prod = seededProducts[itemPlan.pIndex];
          const lineTotal = prod.price * itemPlan.qty;
          subtotal += lineTotal;

          saleItems.push({
            product: prod._id,
            name: prod.name,
            barcode: prod.barcode,
            quantity: itemPlan.qty,
            price: prod.price,
            total: lineTotal,
          });

          // Stock movement for sale
          const stockBefore = prod.stock;
          const stockAfter = Math.max(0, stockBefore - itemPlan.qty);
          prod.stock = stockAfter;
          await prod.save();

          await StockMovement.create({
            store: ramStore._id,
            product: prod._id,
            type: 'SALE',
            quantityChange: -itemPlan.qty,
            stockBefore,
            stockAfter,
            reference: `Sale #${plan.transactionId}`,
            performedByUser: cashier._id,
            performedBy: cashier.name,
            createdAt: saleDate,
          });
          totalCreated++;
        }

        const taxRate = 5;
        const tax = Math.round((subtotal * taxRate) / 100);
        const total = subtotal + tax;

        sale = await Sale.create({
          store: ramStore._id,
          transactionId: plan.transactionId,
          receiptNo: plan.receiptNo,
          items: saleItems,
          subtotal,
          tax,
          taxRate,
          discount: 0,
          total,
          paymentMethod: plan.paymentMethod,
          amountReceived: total,
          changeGiven: 0,
          status: 'COMPLETED',
          cashierUser: cashier._id,
          cashierName: cashier.name,
          storeSnapshot: {
            name: ramStore.name,
            address: ramStore.address,
            phone: ramStore.phone,
            gstin: ramStore.gstin,
            receiptFooter: ramStore.receiptFooter,
          },
          createdAt: saleDate,
          updatedAt: saleDate,
        });
        totalCreated++;

        console.log(`[CREATED] Sale: ${plan.transactionId} on Day -${plan.dayOffset} (₹${total}, ${plan.paymentMethod})`);
      } else {
        console.log(`[EXISTS] Sale already exists: ${plan.transactionId}`);
      }
    }

    // ----------------------------------------------------
    // STEP 7: Platform Admin Dashboard Graph Data
    // ----------------------------------------------------
    console.log('\n--- Step 7: Platform Admin Dashboard Graph Data ---');

    // 7A. Diverse Store Applications across last 4-5 months
    const extraApplications = [
      {
        applicationId: 'APP-88210',
        businessName: 'Kovai Fresh Hypermarket',
        ownerName: 'Suresh Kumar',
        email: 'suresh@kovaifresh.com',
        phone: '9840123456',
        address: '45 Cross Cut Road, Gandhipuram',
        city: 'Coimbatore',
        storeType: 'Hypermarket',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 10 * 86400 * 1000),
      },
      {
        applicationId: 'APP-77142',
        businessName: 'Madurai Daily Needs',
        ownerName: 'Anand Raj',
        email: 'anand@maduraidaily.com',
        phone: '9840234567',
        address: '88 West Masi Street',
        city: 'Madurai',
        storeType: 'Supermarket',
        status: 'APPROVED',
        reviewNotes: 'Standard supermarket retail compliance verified.',
        reviewedBy: platformAdmin._id,
        reviewedAt: new Date(Date.now() - 45 * 86400 * 1000),
        createdAt: new Date(Date.now() - 48 * 86400 * 1000),
      },
      {
        applicationId: 'APP-66519',
        businessName: 'Cauvery Super Market',
        ownerName: 'Priya S',
        email: 'priya@cauverysuper.com',
        phone: '9840345678',
        address: '15 Thillai Nagar Main Road',
        city: 'Tiruchirappalli',
        storeType: 'Supermarket',
        status: 'CHANGES_REQUESTED',
        reviewNotes: 'Please upload valid trade license and clear GSTIN certificate.',
        reviewedBy: platformAdmin._id,
        reviewedAt: new Date(Date.now() - 60 * 86400 * 1000),
        createdAt: new Date(Date.now() - 65 * 86400 * 1000),
      },
      {
        applicationId: 'APP-55428',
        businessName: 'Salem Central Mart',
        ownerName: 'Venkatesh K',
        email: 'venkat@salemmart.com',
        phone: '9840456789',
        address: '102 Omalur Main Road',
        city: 'Salem',
        storeType: 'Convenience Store',
        status: 'REJECTED',
        reviewNotes: 'Commercial space does not meet fire safety guidelines.',
        reviewedBy: platformAdmin._id,
        reviewedAt: new Date(Date.now() - 90 * 86400 * 1000),
        createdAt: new Date(Date.now() - 95 * 86400 * 1000),
      },
      {
        applicationId: 'APP-44317',
        businessName: 'Nellai Express Grocery',
        ownerName: 'Muthu P',
        email: 'muthu@nellaiexpress.com',
        phone: '9840567890',
        address: '22 South Bypass Road',
        city: 'Tirunelveli',
        storeType: 'Grocery Store',
        status: 'APPROVED',
        reviewNotes: 'Verified local retail merchant documents.',
        reviewedBy: platformAdmin._id,
        reviewedAt: new Date(Date.now() - 120 * 86400 * 1000),
        createdAt: new Date(Date.now() - 125 * 86400 * 1000),
      },
    ];

    for (const appData of extraApplications) {
      const existing = await StoreApplication.findOne({ applicationId: appData.applicationId });
      if (!existing) {
        await StoreApplication.create(appData);
        totalCreated++;
        console.log(`[CREATED] Platform Application: ${appData.applicationId} (${appData.businessName} - ${appData.status})`);
      } else {
        console.log(`[EXISTS] Application already exists: ${appData.applicationId}`);
      }
    }

    // 7B. Corresponding Extra Stores (for growth and status charts)
    const extraStores = [
      {
        name: 'Madurai Daily Needs',
        storeCode: 'STR-7714',
        email: 'anand@maduraidaily.com',
        businessEmail: 'anand@maduraidaily.com',
        phone: '9840234567',
        address: '88 West Masi Street',
        city: 'Madurai',
        state: 'Tamil Nadu',
        status: 'ACTIVE',
        statusReason: 'Approved standard operational supermarket',
        createdAt: new Date(Date.now() - 45 * 86400 * 1000),
      },
      {
        name: 'Nellai Express Grocery',
        storeCode: 'STR-4431',
        email: 'muthu@nellaiexpress.com',
        businessEmail: 'muthu@nellaiexpress.com',
        phone: '9840567890',
        address: '22 South Bypass Road',
        city: 'Tirunelveli',
        state: 'Tamil Nadu',
        status: 'ACTIVE',
        statusReason: 'Approved retail grocery store',
        createdAt: new Date(Date.now() - 120 * 86400 * 1000),
      },
      {
        name: 'Kongu Supermarket',
        storeCode: 'STR-3329',
        email: 'kongu@kongumart.com',
        businessEmail: 'kongu@kongumart.com',
        phone: '9840678901',
        address: '56 Avinashi Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        status: 'SUSPENDED',
        statusReason: 'Annual compliance certificate submission pending',
        createdAt: new Date(Date.now() - 75 * 86400 * 1000),
      },
    ];

    for (const stData of extraStores) {
      const existing = await Store.findOne({ storeCode: stData.storeCode });
      if (!existing) {
        await Store.create(stData);
        totalCreated++;
        console.log(`[CREATED] Platform Store: ${stData.name} (${stData.storeCode} - ${stData.status})`);
      } else {
        console.log(`[EXISTS] Store already exists: ${stData.name}`);
      }
    }

    // 7C. Complaint Tickets
    const demoComplaints = [
      {
        ticketNo: 'TICK-1001',
        store: ramStore._id,
        raisedBy: storeAdmin._id,
        category: 'BUG',
        priority: 'MEDIUM',
        subject: 'Barcode scanner delay during peak billing hours',
        description: 'When cashiers scan items rapidly back-to-back, there is occasional 1-second lag before item appears in cart.',
        status: 'RESOLVED',
        resolvedAt: new Date(Date.now() - 2 * 86400 * 1000),
        messages: [
          {
            author: storeAdmin._id,
            authorName: storeAdmin.name,
            authorRole: storeAdmin.role,
            text: 'Barcode scanner delay observed during Friday evening rush hour.',
            createdAt: new Date(Date.now() - 3 * 86400 * 1000),
          },
          {
            author: platformAdmin._id,
            authorName: platformAdmin.name,
            authorRole: platformAdmin.role,
            text: 'Optimized barcode indexed lookup query. Please verify performance.',
            internal: false,
            createdAt: new Date(Date.now() - 2 * 86400 * 1000),
          },
        ],
        createdAt: new Date(Date.now() - 3 * 86400 * 1000),
      },
      {
        ticketNo: 'TICK-1002',
        store: ramStore._id,
        raisedBy: storeAdmin._id,
        category: 'FEATURE_REQUEST',
        priority: 'LOW',
        subject: 'Request for scheduled monthly CSV financial export',
        description: 'Would like an automatic monthly export sent to our accountant email address on the 1st of every month.',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 1 * 86400 * 1000),
      },
      {
        ticketNo: 'TICK-1003',
        store: ramStore._id,
        raisedBy: cashier._id,
        category: 'PERFORMANCE',
        priority: 'HIGH',
        subject: 'UPI QR code generation latency',
        description: 'Generating dynamic UPI payment QR takes a few seconds when network bandwidth drops.',
        status: 'IN_PROGRESS',
        assignedTo: platformAdmin._id,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
    ];

    for (const cData of demoComplaints) {
      const existing = await Complaint.findOne({ ticketNo: cData.ticketNo });
      if (!existing) {
        await Complaint.create(cData);
        totalCreated++;
        console.log(`[CREATED] Complaint Ticket: ${cData.ticketNo} (${cData.subject} - ${cData.status})`);
      } else {
        console.log(`[EXISTS] Complaint ticket already exists: ${cData.ticketNo}`);
      }
    }

    // 7D. Activity Logs and Login Events for Platform Audit stream
    const existingLogins = await LoginEvent.countDocuments();
    if (existingLogins === 0) {
      await LoginEvent.create([
        {
          user: platformAdmin._id,
          userEmail: platformAdmin.email,
          role: platformAdmin.role,
          type: 'LOGIN',
          ip: '127.0.0.1',
          userAgent: 'Chrome 122.0 Windows 11',
          createdAt: new Date(Date.now() - 3600 * 1000),
        },
        {
          user: storeAdmin._id,
          userEmail: storeAdmin.email,
          store: ramStore._id,
          role: storeAdmin.role,
          type: 'LOGIN',
          ip: '127.0.0.1',
          userAgent: 'Firefox 123.0 Windows 11',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000),
        },
        {
          user: cashier._id,
          userEmail: cashier.email,
          store: ramStore._id,
          role: cashier.role,
          type: 'LOGIN',
          ip: '127.0.0.1',
          userAgent: 'Edge 122.0 POS Terminal 1',
          createdAt: new Date(Date.now() - 6 * 3600 * 1000),
        },
      ]);
      totalCreated += 3;
      console.log(`[CREATED] Login events for Platform Admin overview stream`);
    }

    const existingActivity = await ActivityLog.countDocuments();
    if (existingActivity === 0) {
      await ActivityLog.create([
        {
          actor: platformAdmin._id,
          actorName: platformAdmin.name,
          actorRole: platformAdmin.role,
          action: 'STORE_APPROVAL',
          targetType: 'Store',
          targetId: ramStore._id.toString(),
          details: { message: 'Approved Ram Store for production POS operations' },
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - 7 * 86400 * 1000),
        },
        {
          actor: storeAdmin._id,
          actorName: storeAdmin.name,
          actorRole: storeAdmin.role,
          store: ramStore._id,
          action: 'STAFF_INVITATION_ACCEPTED',
          targetType: 'User',
          targetId: cashier._id.toString(),
          details: { message: 'Cashier User2 activated via token invitation' },
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - 6 * 86400 * 1000),
        },
      ]);
      totalCreated += 2;
      console.log(`[CREATED] Activity audit logs for Platform Admin overview stream`);
    }

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    if (totalCreated > 0) {
      console.log(`🎉 SEEDING COMPLETE: Successfully created ${totalCreated} new record(s).`);
    } else {
      console.log('✨ All seed records are already present. 0 records inserted.');
    }
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedAll();
