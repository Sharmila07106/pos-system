const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

// Disable mongoose query buffering so offline requests fail immediately (0ms)
// instead of hanging for 10000ms with buffering timeout errors
mongoose.set('bufferCommands', false);

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
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (always accessible regardless of DB state)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'POS server is running',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
  });
});

// Database connection guard for all operational API routes
// Prevents buffering timeouts by returning an immediate, clear 503 error if DB is offline
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      code: 'DB_NOT_CONNECTED',
      message: 'Database connection is not available. Please configure MONGODB_URI in server/.env and verify your MongoDB cluster access.',
    });
  }
  next();
});

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/platform', require('./routes/platformRoutes'));
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

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ MongoDB Connected successfully');

      // Automatically verify or initialize Platform Super Admin on startup
      try {
        const { ensurePlatformAdmin } = require('./utils/seedPlatformAdmin');
        await ensurePlatformAdmin();
      } catch (seedErr) {
        console.warn('⚠️ Platform Admin bootstrap notice:', seedErr.message);
      }
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
    }
  } else {
    console.warn('\n⚠️ [StoreFlow Notice]: MONGODB_URI is not set in server/.env.');
    console.warn('To connect to MongoDB, open server/.env and paste your connection string:');
    console.warn('Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/storeflow?retryWrites=true&w=majority\n');
  }

  app.listen(PORT, () => {
    console.log(`🚀 StoreFlow POS server running on http://localhost:${PORT}`);
  });
}

startServer();