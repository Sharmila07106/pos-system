const mongoose = require('mongoose');
const Counter = require('../models/Counter');

// In-memory counter store when database is disconnected (mocked test mode)
const memoryCounters = new Map();

/**
 * Atomically generates the next sequence number for a given store and counter type.
 * Uses findOneAndUpdate with $inc and upsert so concurrent requests never get the same number.
 *
 * @param {string|mongoose.Types.ObjectId} storeId - Store identifier
 * @param {string} type - Counter type ('sale', 'batch', 'receipt', etc.)
 * @returns {Promise<number>} - Next sequential integer (>= 1)
 */
async function nextSequence(storeId, type = 'sale') {
  const counterId = `${String(storeId)}:${type}`;

  // If database is not connected (e.g. running unit tests without live DB)
  if (mongoose.connection.readyState !== 1) {
    const current = memoryCounters.get(counterId) || 0;
    const nextVal = current + 1;
    memoryCounters.set(counterId, nextVal);
    return nextVal;
  }

  const record = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
  return record.seq;
}

/**
 * Returns formatted transaction ID per supermarket: TXN-00001, TXN-00002, etc.
 *
 * @param {string|mongoose.Types.ObjectId} storeId
 * @returns {Promise<string>}
 */
async function getNextTransactionId(storeId) {
  const seq = await nextSequence(storeId, 'sale');
  return `TXN-${String(seq).padStart(5, '0')}`;
}

/**
 * Returns formatted receipt number per supermarket: REC-00001, etc.
 *
 * @param {string|mongoose.Types.ObjectId} storeId
 * @returns {Promise<string>}
 */
async function getNextReceiptNo(storeId) {
  const seq = await nextSequence(storeId, 'receipt');
  return `REC-${String(seq).padStart(5, '0')}`;
}

/**
 * Returns formatted batch number per supermarket: BAT-00001, etc.
 *
 * @param {string|mongoose.Types.ObjectId} storeId
 * @returns {Promise<string>}
 */
async function getNextBatchNumber(storeId) {
  const seq = await nextSequence(storeId, 'batch');
  return `BAT-${String(seq).padStart(5, '0')}`;
}

/**
 * Initializes or bumps the counter to at least minSeq if existing data has a higher number.
 *
 * @param {string|mongoose.Types.ObjectId} storeId
 * @param {string} type
 * @param {number} minSeq
 */
async function initCounterIfHigher(storeId, type, minSeq) {
  if (!minSeq || minSeq <= 0) return;
  const counterId = `${String(storeId)}:${type}`;

  if (mongoose.connection.readyState !== 1) {
    const current = memoryCounters.get(counterId) || 0;
    if (minSeq > current) memoryCounters.set(counterId, minSeq);
    return;
  }

  await Counter.findOneAndUpdate(
    { _id: counterId },
    { $max: { seq: minSeq } },
    { upsert: true }
  );
}

module.exports = {
  nextSequence,
  getNextTransactionId,
  getNextReceiptNo,
  getNextBatchNumber,
  initCounterIfHigher,
};
