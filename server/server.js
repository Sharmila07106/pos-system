const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Configure reliable DNS servers at top of server entry file
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

// Ensure critical environment variables exist at startup
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing. Server cannot start.');
}

const { connectDB, getDbStatus } = require('./config/db');

// In production, validate that JWT_SECRET is present and secure (at least 32 characters)
if (process.env.NODE_ENV === 'production') {
  const secret = (process.env.JWT_SECRET || '').trim();
  const insecureDefaults = [
    'secret',
    'jwt_secret',
    'default_secret',
    'supersecret',
    'storeflow_secret',
    'change_this_secret',
    '12345678901234567890123456789012',
  ];
  if (!secret || secret.length < 32 || insecureDefaults.includes(secret.toLowerCase())) {
    console.error('\n❌ FATAL: JWT_SECRET is required in production and must be at least 32 characters long.');
    console.error('Please configure a strong random secret in your Render environment variables.\n');
    process.exit(1);
  }
}

const app = express();

// Trust reverse proxy (Render, Cloudflare, Vercel)
app.set('trust proxy', 1);

// HTTP Logging and compression in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
} else {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );
}

// Dynamic CORS configuration
function getAllowedOrigins() {
  const origins = new Set();
  const isProd = process.env.NODE_ENV === 'production';

  if (process.env.CLIENT_URL) {
    origins.add(process.env.CLIENT_URL.trim().replace(/\/$/, ''));
  }

  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim().replace(/\/$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  if (!isProd) {
    origins.add('http://localhost:5190');
    origins.add('http://localhost:5191');
    origins.add('http://127.0.0.1:5190');
    origins.add('http://127.0.0.1:5191');
  }

  return origins;
}

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server curl, health monitors)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.trim().replace(/\/$/, '');
      const dynamicOrigins = getAllowedOrigins();

      if (dynamicOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments if enabled (https://*.vercel.app)
      if (allowVercelPreviews && /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      // Allow localhost ports in development
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(cleanOrigin)) {
        return callback(null, true);
      }

      const corsError = new Error(`CORS blocked for origin: ${origin}`);
      corsError.status = 403;
      return callback(corsError, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads with Cross-Origin-Resource-Policy header (for legacy files during migration)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// Root route for Render ping and inspection
app.get('/', (req, res) => {
  res.json({ name: 'StoreFlow API', status: 'ok' });
});

// Health check endpoint (always accessible regardless of DB state)
// Returns { status, database: "connected" | "disconnected", reason }
app.get('/api/health', (req, res) => {
  const dbInfo = getDbStatus();
  res.json({
    status: 'ok',
    database: dbInfo.database, // "connected" | "disconnected"
    reason: dbInfo.reason,
  });
});

// Database connection guard for all operational API routes
// Returns immediate 503 while database connects in the background
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (req.path.startsWith('/images/')) return next();
  const dbInfo = getDbStatus();
  if (dbInfo.database !== 'connected') {
    return res.status(503).json({
      success: false,
      code: 'DB_NOT_CONNECTED',
      message: 'Server is connecting to the database. Please wait a few seconds.',
    });
  }
  next();
});

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/platform', require('./routes/platformRoutes'));
app.use('/api/platform-admin', require('./routes/platformRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// Centralized error handler (friendly JSON, never leaks raw DB errors or stack traces in production)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  let statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  let friendlyMessage = err.message || 'Internal Server Error';

  // Handle MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    statusCode = 409;
    const keyPattern = err.keyPattern || {};
    const msg = err.message || '';

    if (keyPattern.barcode || msg.includes('barcode')) {
      friendlyMessage = 'A product with this barcode already exists in your supermarket.';
    } else if (keyPattern.sku || msg.includes('sku')) {
      friendlyMessage = 'A product with this SKU already exists in your supermarket.';
    } else if (keyPattern.transactionId || msg.includes('transactionId')) {
      friendlyMessage = 'A sale with this transaction ID already exists. Please retry.';
    } else if (keyPattern.idempotencyKey || msg.includes('idempotencyKey')) {
      friendlyMessage = 'This transaction has already been processed.';
    } else if (keyPattern.email || msg.includes('email')) {
      friendlyMessage = 'An account with this email address already exists.';
    } else if (keyPattern.batchNumber || msg.includes('batchNumber')) {
      friendlyMessage = 'A batch with this batch number already exists in your supermarket.';
    } else if (keyPattern.storeCode || msg.includes('storeCode')) {
      friendlyMessage = 'A supermarket with this store code already exists.';
    } else if (keyPattern.ticketNo || msg.includes('ticketNo')) {
      friendlyMessage = 'A support ticket with this number already exists.';
    } else {
      friendlyMessage = 'A duplicate record error occurred. Please try again.';
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = err.errors ? Object.values(err.errors).map((e) => e.message) : [];
    friendlyMessage = messages.length > 0 ? messages.join('. ') : 'Validation failed for one or more fields.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    friendlyMessage = `Invalid identifier format: ${err.value}`;
  } else {
    // Sanitize any remaining raw DB error strings in any environment
    if (friendlyMessage.includes('E11000') || friendlyMessage.includes('collection:')) {
      friendlyMessage = 'A duplicate record error occurred. Please try again.';
      statusCode = 409;
    }
  }

  res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5090;

function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StoreFlow POS server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });

  setupGracefulShutdown(server);
  connectDB();
}

startServer();
