const mongoose = require('mongoose');
const dns = require('dns');

// Force reliable DNS resolvers (Google & Cloudflare) to prevent Windows SRV lookup failures
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore in sandboxed environments if not allowed
}

// Disable mongoose query buffering so offline requests fail immediately (0ms)
// instead of hanging for 10000ms with buffering timeout errors
mongoose.set('bufferCommands', false);

// Connection state tracking
const dbState = {
  isConnected: false,
  clusterName: 'unknown',
  lastError: null,
  reconnectAttempts: 0,
  timerId: null,
  isConnecting: false,
};

// Helper: mask password in MongoDB URI for safe logging
function maskMongoUri(uri) {
  if (!uri) return 'EMPTY_URI';
  return uri.replace(/:([^@/]+)@/, ':****@');
}

// Helper: extract cluster or host name
function extractClusterName(uri) {
  if (!uri) return 'none';
  try {
    const afterAt = uri.split('@')[1] || uri.split('://')[1] || '';
    const hostPart = afterAt.split('/')[0] || '';
    return hostPart.split('?')[0] || 'MongoDB';
  } catch (_) {
    return 'MongoDB';
  }
}

// Clean MONGODB_URI: strip quotes and trim whitespace
function getCleanUri() {
  let raw = process.env.MONGODB_URI || '';
  raw = raw.trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  return raw;
}

// Validate MONGODB_URI according to deployment environment
function validateProductionUri(uri) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  if (!uri) {
    console.error('\n❌ FATAL: MONGODB_URI is required in production environment.');
    console.error('Please configure your MongoDB Atlas connection string in Render environment variables.\n');
    process.exit(1);
  }

  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    console.error('\n❌ FATAL: MONGODB_URI must start with "mongodb+srv://" or "mongodb://".');
    console.error(`Received: ${maskMongoUri(uri)}\n`);
    process.exit(1);
  }

  const isLocalHost = uri.includes('localhost') || uri.includes('127.0.0.1');
  if (isLocalHost && process.env.ALLOW_LOCAL_DB !== 'true') {
    console.error('\n❌ FATAL: Local MongoDB URI is not allowed in production on cloud platforms (e.g. Render).');
    console.error('Please set an Atlas connection string or set ALLOW_LOCAL_DB=true for local production-mode testing.\n');
    process.exit(1);
  }
}

// Core connection logic with automatic retries every 3 seconds
async function attemptConnection() {
  if (dbState.isConnected) return;
  if (dbState.isConnecting) return;

  const uri = getCleanUri();
  validateProductionUri(uri);

  if (!uri) {
    const msg = 'MONGODB_URI is missing or empty in server/.env';
    dbState.lastError = msg;
    dbState.isConnected = false;
    console.error(`\n❌ MongoDB failed: ${msg}. Retrying in 3 seconds...`);
    scheduleRetry();
    return;
  }

  const cluster = extractClusterName(uri);
  dbState.clusterName = cluster;
  dbState.isConnecting = true;
  dbState.reconnectAttempts += 1;

  try {
    // If mongoose already has an open or connecting socket, disconnect cleanly first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Forces IPv4 to prevent dual-stack resolution hangs
    });

    dbState.isConnected = true;
    dbState.lastError = null;
    dbState.isConnecting = false;
    console.log(`\n✅ MongoDB connected: ${cluster}`);

    // Ensure Platform Super Admin / seed data exists once connection is live
    try {
      const { ensurePlatformAdmin } = require('../utils/seedPlatformAdmin');
      await ensurePlatformAdmin();
    } catch (_) {
      // Non-fatal notice
    }

    // Migrate any legacy disk uploads to MongoDB once connected
    try {
      const { migrateDiskUploads } = require('../utils/migrateDiskUploads');
      await migrateDiskUploads();
    } catch (_) {
      // Non-fatal notice
    }
  } catch (err) {
    dbState.isConnected = false;
    dbState.isConnecting = false;
    dbState.lastError = err.message || 'Connection failed';

    let simplifiedReason = err.message;
    if (err.message.includes("isn't whitelisted") || err.message.includes('Could not connect to any servers')) {
      simplifiedReason = 'Cluster unreachable / IP address not on Atlas Access List or cluster is paused';
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      simplifiedReason = 'Authentication failed (verify database username and password)';
    } else if (err.message.includes('querySrv') || err.message.includes('ENOTFOUND')) {
      simplifiedReason = 'DNS resolution error for Atlas SRV record';
    } else if (err.message.includes('ECONNREFUSED')) {
      simplifiedReason = 'Connection refused by target host';
    }

    console.error(`❌ MongoDB failed: [${simplifiedReason}]. Retrying in 3 seconds...`);
    scheduleRetry();
  }
}

function scheduleRetry() {
  if (dbState.timerId) {
    clearTimeout(dbState.timerId);
  }
  dbState.timerId = setTimeout(() => {
    attemptConnection();
  }, 3000); // 3-second retry loop
}

// Mongoose event listeners for drop & auto-reconnect
function setupConnectionListeners() {
  mongoose.connection.on('connected', () => {
    dbState.isConnected = true;
    dbState.lastError = null;
  });

  mongoose.connection.on('error', (err) => {
    dbState.isConnected = false;
    dbState.lastError = err.message || 'Mongoose connection error';
    console.error(`❌ MongoDB connection event error: ${dbState.lastError}`);
  });

  mongoose.connection.on('disconnected', () => {
    dbState.isConnected = false;
    console.warn('⚠️ MongoDB connection dropped. Reconnecting automatically in 3 seconds...');
    scheduleRetry();
  });
}

function connectDB() {
  setupConnectionListeners();
  attemptConnection();
}

function getDbStatus() {
  const readyState = mongoose.connection.readyState;
  const isActuallyConnected = readyState === 1 && dbState.isConnected;

  return {
    status: isActuallyConnected ? 'connected' : 'disconnected',
    database: isActuallyConnected ? 'connected' : 'disconnected',
    readyState,
    cluster: dbState.clusterName,
    reason: isActuallyConnected
      ? null
      : dbState.lastError || 'Connecting to database...',
    attempts: dbState.reconnectAttempts,
  };
}

module.exports = {
  connectDB,
  getDbStatus,
  getCleanUri,
};
