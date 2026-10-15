const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-environment-jwt-secret-minimum-32-chars-long';
}
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const ActivityLog = require('./models/ActivityLog');
const Settings = require('./models/Settings');
const LoginEvent = require('./models/LoginEvent');
const { registerUser, registerStore, loginUser, googleAuth } = require('./controllers/authController');

async function runAuthTests() {
  console.log('====================================================');
  console.log('   STOREFLOW AUTH CONTROLLER & VALIDATION TESTS     ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  function mockReqRes(body = {}) {
    return {
      req: {
        body,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner' },
        socket: { remoteAddress: '127.0.0.1' },
      },
      res: {
        statusCode: 200,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        },
      },
    };
  }

  // Mock in-memory DB collections for isolated test execution
  const mockUsers = [];
  const mockStores = [];

  // Silence audit logs in unit test
  ActivityLog.create = async () => ({});
  LoginEvent.create = async () => ({});
  Settings.create = async (doc) => ({ _id: 'mock_settings_id', ...doc });

  // Mock Store model
  Store.findOne = async (query = {}) => {
    if (query.storeCode) return mockStores.find((s) => s.storeCode === query.storeCode) || null;
    return null;
  };
  Store.findById = async (id) => mockStores.find((s) => s._id === id?.toString()) || null;
  Store.create = async (doc) => {
    const store = {
      _id: 'store_' + Math.random().toString(36).substring(7),
      ...doc,
      status: doc.status || 'PENDING',
      save: async function () {
        return this;
      },
    };
    mockStores.push(store);
    return store;
  };

  // Mock User model
  User.countDocuments = async () => mockUsers.length;
  User.findOne = (query = {}) => {
    const cleanEmail = (query.email || '').trim().toLowerCase();
    const found = mockUsers.find((u) => u.email === cleanEmail) || null;

    // Support chained populate('store')
    return {
      populate: function () {
        if (!found) return Promise.resolve(null);
        let storeObj = null;
        if (found.store) {
          storeObj = mockStores.find((s) => s._id === (found.store._id || found.store));
        }
        return Promise.resolve({
          ...found,
          store: storeObj || found.store,
        });
      },
      then: function (resolve) {
        return resolve(found);
      },
    };
  };

  User.create = async ({ name, email, password, role, store, status }) => {
    const user = {
      _id: 'user_' + Math.random().toString(36).substring(7),
      name,
      email: (email || '').trim().toLowerCase(),
      password: 'hashed_' + password,
      role,
      store: store || null,
      status: status || 'Active',
      isActive: true,
      createdAt: new Date(),
      matchPassword: async (pwd) => pwd === password,
      save: async function () {
        return this;
      },
    };
    mockUsers.push(user);
    return user;
  };

  // TEST 1: Public direct staff sign-up without store is strictly rejected
  {
    const { req, res } = mockReqRes({
      name: 'Cashier Applicant',
      email: 'staff@example.com',
      password: 'Password123',
    });
    await registerUser(req, res);
    assert(
      res.statusCode === 400 &&
        res.data?.message?.includes('Public registration is only available for supermarkets'),
      'Public staff sign-up without store is forbidden with 400'
    );
  }

  // TEST 2: Supermarket registration - Owner name validation (< 2 chars)
  {
    const { req, res } = mockReqRes({
      storeName: 'Fresh Mart',
      ownerName: 'A',
      email: 'owner@freshmart.com',
      password: 'Password123',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 400 && res.data?.message?.includes('Owner name is required'),
      'Rejects supermarket registration with owner name < 2 characters'
    );
  }

  // TEST 3: Supermarket registration - Email format validation
  {
    const { req, res } = mockReqRes({
      storeName: 'Fresh Mart',
      ownerName: 'Owner Name',
      email: 'invalid-email-address',
      password: 'Password123',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 400 && res.data?.message?.includes('valid email'),
      'Rejects supermarket registration with invalid email format'
    );
  }

  // TEST 4: Supermarket registration - Password length (< 8 chars)
  {
    const { req, res } = mockReqRes({
      storeName: 'Fresh Mart',
      ownerName: 'Owner Name',
      email: 'owner@freshmart.com',
      password: 'short1',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 400 && res.data?.message?.includes('at least 8 characters'),
      'Rejects password shorter than 8 characters'
    );
  }

  // TEST 5: Supermarket registration - Password complexity (requires letter + number)
  {
    const { req, res } = mockReqRes({
      storeName: 'Fresh Mart',
      ownerName: 'Owner Name',
      email: 'owner@freshmart.com',
      password: 'lettersallwithoutnumbers',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 400 && res.data?.message?.includes('letter and one number'),
      'Rejects password without at least one number'
    );
  }

  // TEST 6: Supermarket registration - Store name validation (< 2 chars)
  {
    const { req, res } = mockReqRes({
      storeName: 'F',
      ownerName: 'Owner Name',
      email: 'owner@freshmart.com',
      password: 'Password123',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 400 && res.data?.message?.includes('Supermarket name is required'),
      'Rejects supermarket registration with store name < 2 characters'
    );
  }

  // TEST 7: Successful Supermarket Registration
  // - Creates PENDING store
  // - Assigns store_admin role
  // - NO auto-login (no JWT token returned)
  // - Message confirms awaiting platform approval
  let registeredOwnerEmail = 'owner@freshmart.com';
  let registeredPassword = 'SecurePassword123';
  let pendingStoreId = null;

  {
    const { req, res } = mockReqRes({
      storeName: 'Fresh Mart Supermarket',
      ownerName: 'Ravi Kumar',
      email: registeredOwnerEmail,
      password: registeredPassword,
      phone: '+91 9876543210',
      address: '123 Market Road, Chennai',
    });
    await registerStore(req, res);
    pendingStoreId = res.data?.data?.store?._id;

    assert(
      res.statusCode === 201 &&
        res.data?.success === true &&
        res.data?.data?.user?.role === 'store_admin' &&
        res.data?.data?.store?.status === 'PENDING' &&
        res.data?.token === undefined &&
        res.data?.message === 'Registration submitted, waiting for platform approval',
      'Successful registration creates store_admin, PENDING store, NO token (no auto-login)'
    );
  }

  // TEST 8: Duplicate email registration returns 409
  {
    const { req, res } = mockReqRes({
      storeName: 'Another Store',
      ownerName: 'Another Owner',
      email: registeredOwnerEmail,
      password: 'Password123',
    });
    await registerStore(req, res);
    assert(
      res.statusCode === 409 &&
        res.data?.message?.includes('already exists'),
      'Duplicate email returns 409 conflict error'
    );
  }

  // TEST 9: Forwarding from registerUser when storeName is provided
  {
    const { req, res } = mockReqRes({
      storeName: 'New Horizon Foods',
      name: 'Priya Sharma',
      email: 'priya@newhorizon.com',
      password: 'NewHorizonPass123',
    });
    await registerUser(req, res);
    assert(
      res.statusCode === 201 &&
        res.data?.data?.user?.role === 'store_admin' &&
        !res.data?.token,
      'registerUser forwards store registrations with storeName to registerStore'
    );
  }

  // TEST 10: Store Status Guard on Login - PENDING store cannot log in (returns 403 STORE_PENDING)
  {
    const { req, res } = mockReqRes({
      email: registeredOwnerEmail,
      password: registeredPassword,
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 403 &&
        res.data?.code === 'STORE_PENDING' &&
        res.data?.message === 'Registration submitted, waiting for platform approval',
      'Pending supermarket owner login is blocked with 403 STORE_PENDING'
    );
  }

  // TEST 11: Store Status Guard on Login - REJECTED store cannot log in (returns 403 STORE_REJECTED)
  {
    // Mark store as REJECTED
    const targetStore = mockStores.find((s) => s._id === pendingStoreId);
    if (targetStore) targetStore.status = 'REJECTED';

    const { req, res } = mockReqRes({
      email: registeredOwnerEmail,
      password: registeredPassword,
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 403 &&
        res.data?.code === 'STORE_REJECTED',
      'Rejected supermarket owner login is blocked with 403 STORE_REJECTED'
    );
  }

  // TEST 12: Store Status Guard on Login - SUSPENDED store cannot log in (returns 403 STORE_SUSPENDED)
  {
    // Mark store as SUSPENDED
    const targetStore = mockStores.find((s) => s._id === pendingStoreId);
    if (targetStore) targetStore.status = 'SUSPENDED';

    const { req, res } = mockReqRes({
      email: registeredOwnerEmail,
      password: registeredPassword,
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 403 &&
        res.data?.code === 'STORE_SUSPENDED',
      'Suspended supermarket owner login is blocked with 403 STORE_SUSPENDED'
    );
  }

  // TEST 13: Approved / ACTIVE store owner can log in successfully
  {
    // Mark store as ACTIVE (platform approval)
    const targetStore = mockStores.find((s) => s._id === pendingStoreId);
    if (targetStore) targetStore.status = 'ACTIVE';

    const { req, res } = mockReqRes({
      email: registeredOwnerEmail,
      password: registeredPassword,
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 200 &&
        res.data?.success === true &&
        res.data?.data?.role === 'store_admin' &&
        !!res.data?.token,
      'Approved / ACTIVE store owner can log in successfully and receives JWT'
    );
  }

  // TEST 14: Login with incorrect password returns 401
  {
    const { req, res } = mockReqRes({
      email: registeredOwnerEmail,
      password: 'IncorrectPassword999!',
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 401 &&
        res.data?.message === 'Invalid email or password',
      'Login with incorrect password returns 401 Invalid email or password'
    );
  }

  // TEST 15: Platform Super Admin login succeeds without store requirement
  {
    mockUsers.push({
      _id: 'super_admin_mock_id',
      name: 'Platform Super Admin',
      email: 'admin.test@storeflow.com',
      password: 'hashed_password',
      role: 'PLATFORM_SUPER_ADMIN',
      status: 'Active',
      isActive: true,
      store: null,
      createdAt: new Date(),
      matchPassword: async (pwd) => pwd === 'TestPass123!',
      save: async function () {
        return this;
      },
    });

    const { req, res } = mockReqRes({
      email: 'admin.test@storeflow.com',
      password: 'TestPass123!',
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 200 &&
        res.data?.success === true &&
        res.data?.data?.role === 'PLATFORM_SUPER_ADMIN' &&
        res.data?.data?.isPlatformAdmin === true,
      'Platform Super Admin login succeeds and returns isPlatformAdmin: true'
    );
  }

  // TEST 16: googleAuth rejects missing credential with 400
  {
    const { req, res } = mockReqRes({});
    await googleAuth(req, res);
    assert(
      res.statusCode === 400 &&
        res.data?.message?.includes('credential ID token is required'),
      'googleAuth returns 400 when credential ID token is missing'
    );
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runAuthTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
