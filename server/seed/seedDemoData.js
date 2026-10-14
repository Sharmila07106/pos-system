const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');

async function seedDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  try {
    // 1. Locate the first approved active store
    const store = await Store.findOne({ status: 'ACTIVE' });
    if (!store) {
      console.log('No approved store found. Approve a store first, then run npm run seed');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`\nFound approved store: "${store.name}" (ID: ${store._id}, Code: ${store.storeCode || 'N/A'})`);

    // Locate staff/owner user for cashier reference
    const cashierUser =
      (await User.findOne({ store: store._id, role: { $in: ['CASHIER', 'cashier', 'STORE_ADMIN', 'store_admin', 'STORE_OWNER', 'store_owner'] } })) ||
      (await User.findOne({ store: store._id }));

    const cashierId = cashierUser ? cashierUser._id : null;
    const cashierName = cashierUser ? cashierUser.name : 'Cashier Staff';

    // 2. Define the 10 supermarket products
    const demoProducts = [
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
      },
      {
        name: 'Amul Milk 500ml',
        category: 'Dairy',
        price: 30,
        costPrice: 24,
        stock: 50,
        lowStockThreshold: 10,
        sku: 'DAIR-MLK-06',
        barcode: '8901030010066',
        supplier: 'Gujarat Co-operative Milk Marketing Federation',
      },
      {
        name: 'Amul Butter 100g',
        category: 'Dairy',
        price: 58,
        costPrice: 48,
        stock: 45,
        lowStockThreshold: 8,
        sku: 'DAIR-BUT-07',
        barcode: '8901030010073',
        supplier: 'Amul Dairy',
      },
      {
        name: 'Britannia Bread',
        category: 'Bakery',
        price: 45,
        costPrice: 35,
        stock: 40,
        lowStockThreshold: 8,
        sku: 'BAKE-BRD-08',
        barcode: '8901030010080',
        supplier: 'Britannia Industries',
      },
      {
        name: 'Parle-G Biscuits',
        category: 'Snacks',
        price: 10,
        costPrice: 7,
        stock: 120,
        lowStockThreshold: 25,
        sku: 'SNAK-PRL-09',
        barcode: '8901030010097',
        supplier: 'Parle Products',
      },
      {
        name: 'Surf Excel 1kg',
        category: 'Household',
        price: 130,
        costPrice: 105,
        stock: 75,
        lowStockThreshold: 10,
        sku: 'HOUS-SRF-10',
        barcode: '8901030010103',
        supplier: 'Hindustan Unilever Ltd',
      },
    ];

    let productsCreated = 0;
    let productsSkipped = 0;
    const seededProductsMap = new Map();

    for (const p of demoProducts) {
      const existing = await Product.findOne({
        store: store._id,
        $or: [{ barcode: p.barcode }, { sku: p.sku }],
      });

      if (existing) {
        seededProductsMap.set(p.sku, existing);
        productsSkipped++;
      } else {
        const created = await Product.create({
          ...p,
          store: store._id,
          isActive: true,
        });
        seededProductsMap.set(p.sku, created);
        productsCreated++;
      }
    }

    console.log(`\nProducts seeding: ${productsCreated} created, ${productsSkipped} skipped (already existing).`);

    // 3. Define 5 Completed Bills dated across the last 7 days
    const now = Date.now();
    const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);

    const billDefinitions = [
      {
        idSuffix: '1001',
        daysAgo: 6,
        paymentMethod: 'CASH',
        items: [
          { sku: 'GROC-RICE-01', qty: 2 },
          { sku: 'GROC-OIL-03', qty: 1 },
          { sku: 'GROC-SLT-05', qty: 1 },
        ],
      },
      {
        idSuffix: '1002',
        daysAgo: 5,
        paymentMethod: 'UPI',
        items: [
          { sku: 'DAIR-MLK-06', qty: 3 },
          { sku: 'BAKE-BRD-08', qty: 2 },
          { sku: 'DAIR-BUT-07', qty: 1 },
        ],
      },
      {
        idSuffix: '1003',
        daysAgo: 3,
        paymentMethod: 'CARD',
        items: [
          { sku: 'GROC-DAL-02', qty: 2 },
          { sku: 'GROC-SUG-04', qty: 2 },
          { sku: 'SNAK-PRL-09', qty: 5 },
        ],
      },
      {
        idSuffix: '1004',
        daysAgo: 2,
        paymentMethod: 'CASH',
        items: [
          { sku: 'HOUS-SRF-10', qty: 2 },
          { sku: 'GROC-SLT-05', qty: 2 },
        ],
      },
      {
        idSuffix: '1005',
        daysAgo: 1,
        paymentMethod: 'UPI',
        items: [
          { sku: 'GROC-RICE-01', qty: 1 },
          { sku: 'GROC-DAL-02', qty: 1 },
          { sku: 'GROC-OIL-03', qty: 2 },
          { sku: 'SNAK-PRL-09', qty: 3 },
        ],
      },
    ];

    let billsCreated = 0;
    let billsSkipped = 0;
    const storeCode = store.storeCode || 'SF';
    const taxRatePercent = store.taxRatePercent !== undefined ? store.taxRatePercent : 5;

    for (const b of billDefinitions) {
      const transactionId = `TXN-${storeCode}-${b.idSuffix}`;
      const receiptNo = `REC-${storeCode}-${b.idSuffix}`;

      const existingBill = await Sale.findOne({
        store: store._id,
        $or: [{ transactionId }, { receiptNo }],
      });

      if (existingBill) {
        billsSkipped++;
        continue;
      }

      // Compute items and totals dynamically
      let subtotal = 0;
      const saleItems = [];

      for (const itemDef of b.items) {
        const prod = seededProductsMap.get(itemDef.sku);
        if (!prod) continue;

        const lineTotal = Number((prod.price * itemDef.qty).toFixed(2));
        subtotal += lineTotal;

        saleItems.push({
          product: prod._id,
          name: prod.name,
          barcode: prod.barcode,
          quantity: itemDef.qty,
          price: prod.price,
          total: lineTotal,
        });

        // Reduce stock atomically for sold units
        const stockBefore = prod.stock;
        const stockAfter = Math.max(0, prod.stock - itemDef.qty);
        prod.stock = stockAfter;
        await prod.save();

        // Create StockMovement audit record
        await StockMovement.create({
          store: store._id,
          product: prod._id,
          type: 'SALE',
          quantityChange: -itemDef.qty,
          stockBefore,
          stockAfter,
          reference: transactionId,
          performedByUser: cashierId,
          performedBy: cashierName,
          createdAt: daysAgo(b.daysAgo),
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      const tax = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));

      await Sale.create({
        store: store._id,
        transactionId,
        receiptNo,
        items: saleItems,
        subtotal,
        tax,
        taxRate: taxRatePercent,
        discount: 0,
        total,
        paymentMethod: b.paymentMethod,
        status: 'COMPLETED',
        cashierUser: cashierId,
        cashierName,
        storeSnapshot: {
          name: store.name,
          address: store.address || '',
          phone: store.phone || '',
          gstin: store.gstin || '',
          receiptFooter: store.receiptFooter || 'Thank you for shopping with us! Visit again.',
        },
        createdAt: daysAgo(b.daysAgo),
        updatedAt: daysAgo(b.daysAgo),
      });

      billsCreated++;
    }

    console.log(`Bills seeding: ${billsCreated} created, ${billsSkipped} skipped (already existing).`);

    console.log('\n====================================================');
    console.log('   SEED DEMO DATA SUMMARY                           ');
    console.log('====================================================');
    console.log(`Supermarket Tenant : ${store.name} (${store._id})`);
    console.log(`Products Created   : ${productsCreated} (Total in catalog: ${seededProductsMap.size})`);
    console.log(`Products Skipped   : ${productsSkipped}`);
    console.log(`Bills Created      : ${billsCreated}`);
    console.log(`Bills Skipped      : ${billsSkipped}`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal error during seed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seedDemoData();
