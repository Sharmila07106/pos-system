const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

// Configure reliable DNS servers at top of server entry file
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { connectDB, getDbStatus } = require('./config/db');

const app = express();

// Flexible CORS allowing localhost on 5190, 5191, etc.
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5190',
  'http://localhost:5190',
  'http://localhost:5191',
  'http://127.0.0.1:5190',
  'http://127.0.0.1:5191',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Serve static uploads with Cross-Origin-Resource-Policy header
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

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
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5090;

function startServer() {
  // Start Express listener immediately without waiting for database
  app.listen(PORT, () => {
    console.log(`🚀 StoreFlow POS server running on http://localhost:${PORT}`);
  });

  // Connect to MongoDB in background with resilient retry loop
  connectDB();
}

startServer();