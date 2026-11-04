const mongoose = require('mongoose');
const { initCounterIfHigher } = require('./counter');

/**
 * Automatically migrates indexes and initializes atomic counters on server start.
 * Safe to run repeatedly in development and production (Render).
 */
async function migrateIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('Index migration skipped: database connection not ready.');
      return;
    }

    const salesCollection = db.collection('sales');
    const productsCollection = db.collection('products');
    const batchesCollection = db.collection('batches');

    // 1. Drop old global unique index on sales if it exists
    try {
      const salesIndexes = await salesCollection.indexes();
      const hasOldTxnIndex = salesIndexes.some((idx) => idx.name === 'transactionId_1');
      if (hasOldTxnIndex) {
        await salesCollection.dropIndex('transactionId_1');
        console.log('Index migration: dropped transactionId_1');
      }
    } catch (err) {
      if (!err.message?.includes('index not found')) {
        console.warn('Index migration: notice dropping transactionId_1:', err.message);
      }
    }

    // Drop old global idempotencyKey index if it exists as unique or global
    try {
      const salesIndexes = await salesCollection.indexes();
      const hasOldIdemp = salesIndexes.find((idx) => idx.name === 'idempotencyKey_1');
      if (hasOldIdemp && hasOldIdemp.unique) {
        await salesCollection.dropIndex('idempotencyKey_1');
        console.log('Index migration: dropped old idempotencyKey_1');
      }
    } catch (_) {}

    // Drop old global batchNumber index if it exists
    try {
      const batchIndexes = await batchesCollection.indexes();
      const hasOldBatchIdx = batchIndexes.find((idx) => idx.name === 'batchNumber_1');
      if (hasOldBatchIdx && hasOldBatchIdx.unique) {
        await batchesCollection.dropIndex('batchNumber_1');
        console.log('Index migration: dropped old batchNumber_1');
      }
    } catch (_) {}

    // 2. Repair existing duplicates inside the same store
    let repairedSales = 0;
    try {
      const dupSales = await salesCollection
        .aggregate([
          { $match: { transactionId: { $exists: true, $ne: null }, store: { $exists: true, $ne: null } } },
          { $group: { _id: { store: '$store', transactionId: '$transactionId' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray();

      for (const group of dupSales) {
        const ids = group.ids.slice(1);
        for (let i = 0; i < ids.length; i++) {
          const newTxnId = `${group._id.transactionId}-DUP${i + 1}`;
          await salesCollection.updateOne(
            { _id: ids[i] },
            { $set: { transactionId: newTxnId, receiptNo: newTxnId } }
          );
          repairedSales++;
        }
      }
    } catch (err) {
      console.warn('Index migration: notice during sales duplicate repair:', err.message);
    }

    let repairedProducts = 0;
    try {
      const dupProducts = await productsCollection
        .aggregate([
          { $match: { barcode: { $exists: true, $ne: '' }, store: { $exists: true, $ne: null } } },
          { $group: { _id: { store: '$store', barcode: '$barcode' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray();

      for (const group of dupProducts) {
        const ids = group.ids.slice(1);
        for (let i = 0; i < ids.length; i++) {
          const newBarcode = `${group._id.barcode}-DUP${i + 1}`;
          await productsCollection.updateOne(
            { _id: ids[i] },
            { $set: { barcode: newBarcode } }
          );
          repairedProducts++;
        }
      }
    } catch (err) {
      console.warn('Index migration: notice during products duplicate repair:', err.message);
    }

    let repairedBatches = 0;
    try {
      const dupBatches = await batchesCollection
        .aggregate([
          { $match: { batchNumber: { $exists: true, $ne: '' }, store: { $exists: true, $ne: null } } },
          { $group: { _id: { store: '$store', batchNumber: '$batchNumber' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray();

      for (const group of dupBatches) {
        const ids = group.ids.slice(1);
        for (let i = 0; i < ids.length; i++) {
          const newBatchNumber = `${group._id.batchNumber}-DUP${i + 1}`;
          await batchesCollection.updateOne(
            { _id: ids[i] },
            { $set: { batchNumber: newBatchNumber } }
          );
          repairedBatches++;
        }
      }
    } catch (err) {
      console.warn('Index migration: notice during batches duplicate repair:', err.message);
    }

    const totalRepaired = repairedSales + repairedProducts + repairedBatches;
    console.log(`Index migration: repaired ${totalRepaired} duplicates`);

    // 3. Create compound indexes
    try {
      await salesCollection.createIndex({ store: 1, transactionId: 1 }, { unique: true, background: true });
      console.log('Index migration: created (storeId, transactionId)');
    } catch (err) {
      console.warn('Index migration: notice creating (store, transactionId):', err.message);
    }

    try {
      await salesCollection.createIndex(
        { store: 1, idempotencyKey: 1 },
        {
          unique: true,
          partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
          background: true,
        }
      );
      console.log('Index migration: created (storeId, idempotencyKey)');
    } catch (err) {
      console.warn('Index migration: notice creating (store, idempotencyKey):', err.message);
    }

    try {
      await productsCollection.createIndex({ store: 1, barcode: 1 }, { unique: true, background: true });
      console.log('Index migration: created (storeId, barcode)');
    } catch (err) {
      console.warn('Index migration: notice creating (store, barcode):', err.message);
    }

    try {
      await productsCollection.createIndex(
        { store: 1, sku: 1 },
        {
          unique: true,
          partialFilterExpression: { sku: { $type: 'string', $gt: '' } },
          background: true,
        }
      );
      console.log('Index migration: created (storeId, sku)');
    } catch (err) {
      console.warn('Index migration: notice creating (store, sku):', err.message);
    }

    try {
      await batchesCollection.createIndex({ store: 1, batchNumber: 1 }, { unique: true, background: true });
      console.log('Index migration: created (storeId, batchNumber)');
    } catch (err) {
      console.warn('Index migration: notice creating (store, batchNumber):', err.message);
    }

    // 4. Initialize counters from existing data
    try {
      const storesCollection = db.collection('stores');
      const allStores = await storesCollection.find({}, { projection: { _id: 1 } }).toArray();

      for (const st of allStores) {
        const storeId = st._id.toString();
        const sales = await salesCollection
          .find({ store: st._id }, { projection: { transactionId: 1 } })
          .toArray();

        let maxSeq = 0;
        for (const s of sales) {
          if (s.transactionId) {
            const match = s.transactionId.match(/(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxSeq) maxSeq = num;
            }
          }
        }
        await initCounterIfHigher(storeId, 'sale', maxSeq);
      }
      console.log('Index migration: counters initialised');
    } catch (err) {
      console.warn('Index migration: notice initializing counters:', err.message);
    }
  } catch (outerErr) {
    console.error('Index migration error (non-fatal):', outerErr.message);
  }
}

module.exports = { migrateIndexes };
