const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-environment-jwt-secret-minimum-32-chars-long';
}
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { registerStore, loginUser, activateStaff, changePassword } = require('../controllers/authController');
const {
  getOverview,
  getStores,
  updateStoreStatus,
  getUsers,
  resetUserPassword,
  getComplaints,
  updateComplaintStatus,
} = require('../controllers/adminController');
const { raiseComplaint, getStoreComplaints } = require('../controllers/supportController');
const {
  getPlatformSummaryReport,
  getSupermarketsReport,
  getStaffAccessReport,
  getComplaintsReport,
} = require('../controllers/reportController');
const {
  requireActiveStore,
  forbidPlatformAdmin,
  requireRole,
} = require('../middleware/authMiddleware');
const {
  inviteStaff,
  getStaffLimits,
  updateStaffLimits,
  revokeInvitation,
} = require('../controllers/userController');
const { getProductById, createProduct } = require('../controllers/productController');
const { getDashboardStats } = require('../controllers/dashboardController');
const {
  getSales,
  getSaleById,
  createSale,
  refundSale,
  exportSalesCsv,
  getDailyClosingReport,
} = require('../controllers/salesController');

const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const Complaint = require('../models/Complaint');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const Invitation = require('../models/Invitation');

async function runMultiTenantTestSuite() {
  console.log('====================================================');
  console.log('   STOREFLOW MULTI-TENANT SAAS INTEGRATION SUITE    ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${extraInfo ? `-> ${extraInfo}` : ''}`);
      failed++;
    }
  }

  const { Writable } = require('stream');

  function mockReqRes(body = {}, query = {}, params = {}, user = null, storeId = null) {
    const headers = {};
    const streamChunks = [];

    class MockResponse extends Writable {
      constructor() {
        super();
        this.statusCode = 200;
        this.data = null;
        this.headersSent = false;
        this.headers = headers;
        this.pdfBuffer = null;
      }
      setHeader(name, val) {
        headers[name] = val;
      }
      status(code) {
        this.statusCode = code;
        return this;
      }
      json(payload) {
        this.data = payload;
        return this;
      }
      send(payload) {
        this.sentData = payload;
        return this;
      }
      _write(chunk, encoding, callback) {
        streamChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      }
      end(chunk, encoding, callback) {
        super.end(chunk, encoding, () => {
          this.pdfBuffer = Buffer.concat(streamChunks);
          if (callback) callback();
        });
        return this;
      }
    }

    const res = new MockResponse();
    return {
      req: {
        body,
        query,
        params,
        user,
        storeId,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'NodeTestAgent' },
        socket: { remoteAddress: '127.0.0.1' },
      },
      res,
    };
  }

  // TEST 1: Public Store Registration (Defaults to PENDING, creates Owner & Settings)
  console.log('\n--- SUITE 1: Public Supermarket Registration ---');
  let storeAId = null;
  let storeAOwnerId = null;
  {
    const { req, res } = mockReqRes({
      ownerName: 'Supermarket Owner One',
      email: 'owner1@retailflow.com',
      password: 'Password123!',
      storeName: 'Royal Mart Supermarket',
      city: 'Chennai',
      phone: '+91 9988776655',
    });

    const origStoreCreate = Store.create;
    const origStoreFindOne = Store.findOne;
    const origUserCreate = User.create;
    const origUserFindOne = User.findOne;
    const origSettingsCreate = Settings.create;
    const origActivityCreate = ActivityLog.create;

    Store.findOne = async () => null;
    User.findOne = async () => null;
    ActivityLog.create = async () => ({});

    Store.create = async (doc) => {
      storeAId = 'store_mock_001';
      return {
        _id: storeAId,
        ...doc,
        status: doc.status || 'PENDING',
        save: async function () { return this; },
      };
    };

    User.create = async (doc) => {
      storeAOwnerId = 'user_mock_001';
      return {
        _id: storeAOwnerId,
        ...doc,
        save: async function () { return this; },
      };
    };

    Settings.create = async (doc) => ({ _id: 'set_001', ...doc });

    await registerStore(req, res);

    assert(
      res.statusCode === 201 &&
        res.data?.data?.store?.status === 'PENDING' &&
        (res.data?.data?.user?.role === 'store_admin' || res.data?.data?.user?.role === 'STORE_ADMIN') &&
        !res.data?.token,
      'Public store registration creates store_admin and PENDING store without auto-login token'
    );

    Store.create = origStoreCreate;
    Store.findOne = origStoreFindOne;
    User.create = origUserCreate;
    User.findOne = origUserFindOne;
    Settings.create = origSettingsCreate;
    ActivityLog.create = origActivityCreate;
  }

  // TEST 2: Multi-Tenant Status Guard (PENDING store blocked from POS operations)
  console.log('\n--- SUITE 2: Multi-Tenant Status Guard ---');
  {
    const { req, res } = mockReqRes();
    req.user = {
      _id: 'user_mock_001',
      role: 'STORE_OWNER',
      store: { _id: 'store_mock_001', status: 'PENDING' },
    };
    req.storeId = 'store_mock_001';

    let nextCalled = false;
    await requireActiveStore(req, res, () => {
      nextCalled = true;
    });

    assert(
      res.statusCode === 403 && res.data?.code === 'STORE_PENDING' && !nextCalled,
      'Pending store is blocked from operational POS endpoints with 403 STORE_PENDING'
    );
  }

  // TEST 3: Suspended Store Guard (SUSPENDED store blocked from POS operations)
  {
    const { req, res } = mockReqRes();
    req.user = {
      _id: 'user_mock_001',
      role: 'STORE_OWNER',
      store: { _id: 'store_mock_001', status: 'SUSPENDED' },
    };
    req.storeId = 'store_mock_001';

    let nextCalled = false;
    await requireActiveStore(req, res, () => {
      nextCalled = true;
    });

    assert(
      res.statusCode === 403 && res.data?.code === 'STORE_SUSPENDED' && !nextCalled,
      'Suspended store is blocked from operational POS endpoints with 403 STORE_SUSPENDED'
    );
  }

  // TEST 4: Active Store Allowed
  {
    const { req, res } = mockReqRes();
    req.user = {
      _id: 'user_mock_001',
      role: 'STORE_OWNER',
      store: { _id: 'store_mock_001', status: 'ACTIVE' },
    };
    req.storeId = 'store_mock_001';

    let nextCalled = false;
    await requireActiveStore(req, res, () => {
      nextCalled = true;
    });

    assert(nextCalled === true, 'Active store passes requireActiveStore guard successfully');
  }

  // TEST 4b: Platform Super Admin Approves Store -> ACTIVE
  {
    const origFindById = Store.findById;
    const origUserUpdateOne = User.updateOne;
    const origActivityCreate = ActivityLog.create;

    let userUpdated = false;
    User.updateOne = async () => {
      userUpdated = true;
      return { modifiedCount: 1 };
    };
    ActivityLog.create = async () => ({});

    const mockStoreDoc = {
      _id: 'store_mock_001',
      name: 'Fresh Mart Supermarket',
      status: 'PENDING',
      ownerUser: 'user_mock_001',
      save: async function () { return this; },
    };
    Store.findById = async () => mockStoreDoc;

    const { req, res } = mockReqRes(
      { status: 'ACTIVE', statusReason: 'Verified documentation' },
      {},
      { id: 'store_mock_001' },
      { _id: 'platform_super_admin_id', role: 'PLATFORM_SUPER_ADMIN', name: 'Super Admin' }
    );

    await updateStoreStatus(req, res);

    assert(
      res.statusCode === 200 &&
        res.data?.data?.status === 'ACTIVE' &&
        userUpdated === true,
      'Platform Super Admin approves store to ACTIVE and activates owner user'
    );

    Store.findById = origFindById;
    User.updateOne = origUserUpdateOne;
    ActivityLog.create = origActivityCreate;
  }

  // TEST 4c: Platform Super Admin Suspends Store -> SUSPENDED (locks operational APIs)
  {
    const origFindById = Store.findById;
    const origActivityCreate = ActivityLog.create;
    ActivityLog.create = async () => ({});

    const mockStoreDoc = {
      _id: 'store_mock_001',
      name: 'Fresh Mart Supermarket',
      status: 'ACTIVE',
      ownerUser: 'user_mock_001',
      save: async function () { return this; },
    };
    Store.findById = async () => mockStoreDoc;

    const { req, res } = mockReqRes(
      { status: 'SUSPENDED', statusReason: 'Audit pending' },
      {},
      { id: 'store_mock_001' },
      { _id: 'platform_super_admin_id', role: 'PLATFORM_SUPER_ADMIN', name: 'Super Admin' }
    );

    await updateStoreStatus(req, res);

    assert(
      res.statusCode === 200 &&
        res.data?.data?.status === 'SUSPENDED',
      'Platform Super Admin suspends store to SUSPENDED'
    );

    // Verify operational API guard blocks this suspended store
    const guardReqRes = mockReqRes();
    guardReqRes.req.user = {
      _id: 'user_mock_001',
      role: 'store_admin',
      store: mockStoreDoc,
    };
    guardReqRes.req.storeId = 'store_mock_001';

    let nextCalled = false;
    await requireActiveStore(guardReqRes.req, guardReqRes.res, () => {
      nextCalled = true;
    });

    assert(
      guardReqRes.res.statusCode === 403 &&
        guardReqRes.res.data?.code === 'STORE_SUSPENDED' &&
        !nextCalled,
      'Suspended store is blocked by requireActiveStore middleware'
    );

    Store.findById = origFindById;
    ActivityLog.create = origActivityCreate;
  }

  // TEST 4d: Platform Super Admin Rejects Store -> REJECTED (locks operational APIs)
  {
    const origFindById = Store.findById;
    const origActivityCreate = ActivityLog.create;
    ActivityLog.create = async () => ({});

    const mockStoreDoc = {
      _id: 'store_mock_001',
      name: 'Fresh Mart Supermarket',
      status: 'PENDING',
      ownerUser: 'user_mock_001',
      save: async function () { return this; },
    };
    Store.findById = async () => mockStoreDoc;

    const { req, res } = mockReqRes(
      { status: 'REJECTED', statusReason: 'Invalid business license' },
      {},
      { id: 'store_mock_001' },
      { _id: 'platform_super_admin_id', role: 'PLATFORM_SUPER_ADMIN', name: 'Super Admin' }
    );

    await updateStoreStatus(req, res);

    assert(
      res.statusCode === 200 &&
        res.data?.data?.status === 'REJECTED',
      'Platform Super Admin rejects store to REJECTED'
    );

    // Verify operational API guard blocks this rejected store
    const guardReqRes = mockReqRes();
    guardReqRes.req.user = {
      _id: 'user_mock_001',
      role: 'store_admin',
      store: mockStoreDoc,
    };
    guardReqRes.req.storeId = 'store_mock_001';

    let nextCalled = false;
    await requireActiveStore(guardReqRes.req, guardReqRes.res, () => {
      nextCalled = true;
    });

    assert(
      guardReqRes.res.statusCode === 403 &&
        guardReqRes.res.data?.code === 'STORE_REJECTED' &&
        !nextCalled,
      'Rejected store is blocked by requireActiveStore middleware'
    );

    Store.findById = origFindById;
    ActivityLog.create = origActivityCreate;
  }

  // TEST 5: Platform Admin Guard - Blocked from Sales / POS Checkout
  console.log('\n--- SUITE 3: Role Boundaries Matrix ---');
  {
    const { req, res } = mockReqRes();
    req.user = {
      _id: 'super_admin_001',
      role: 'PLATFORM_ADMIN',
      isPlatformAdmin: true,
    };

    let nextCalled = false;
    forbidPlatformAdmin(req, res, () => {
      nextCalled = true;
    });

    assert(
      res.statusCode === 403 && !nextCalled,
      'Platform Admin is strictly forbidden from executing store POS checkout'
    );
  }

  // TEST 6: Tenant Support Desk - PENDING Store Can Raise Complaint
  console.log('\n--- SUITE 4: Support Complaints Ticketing Flow ---');
  {
    const origComplaintCreate = Complaint.create;
    const origComplaintFindOne = Complaint.findOne;
    const origActivityCreate = ActivityLog.create;

    Complaint.findOne = async () => null;
    ActivityLog.create = async () => ({});

    Complaint.create = async (doc) => ({
      _id: 'comp_001',
      ticketNo: 'TK-123456',
      ...doc,
      save: async function () { return this; },
    });

    const { req, res } = mockReqRes(
      {
        subject: 'Inquiry regarding store activation timeline',
        category: 'ACCOUNT',
        priority: 'HIGH',
        description: 'We submitted registration documents and would like an update.',
      },
      {},
      {},
      { _id: 'user_mock_001', role: 'STORE_OWNER', name: 'Store Owner' },
      'store_mock_001'
    );

    await raiseComplaint(req, res);

    assert(
      res.statusCode === 201 &&
        res.data?.data?.ticketNo &&
        res.data?.data?.status === 'OPEN',
      'Store in PENDING status can raise support tickets to Platform Admin'
    );

    Complaint.create = origComplaintCreate;
    Complaint.findOne = origComplaintFindOne;
    ActivityLog.create = origActivityCreate;
  }

  // TEST 7: Platform Admin PDF Generation Verification
  console.log('\n--- SUITE 5: PDFKit Executive Report Generation ---');
  {
    const origStoreFind = Store.find;
    const origUserFind = User.find;
    const origProdCount = Product.countDocuments;
    const origCompFind = Complaint.find;

    Store.find = () => ({
      sort: () => ({
        populate: async () => [
          {
            name: 'Royal Mart Supermarket',
            storeCode: 'ROYAL-1001',
            city: 'Chennai',
            status: 'ACTIVE',
            ownerUser: { name: 'Owner', email: 'owner@mart.com' },
            createdAt: new Date(),
          },
        ],
      }),
    });

    User.find = () => ({
      select: async () => [
        {
          name: 'Store Staff',
          email: 'staff@mart.com',
          role: 'CASHIER',
          isActive: true,
          store: { name: 'Royal Mart' },
        },
      ],
    });

    Product.countDocuments = async () => 42;
    Complaint.find = async () => [
      {
        ticketNo: '100234',
        subject: 'Billing assistance',
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
      },
    ];

    const { req, res } = mockReqRes();
    req.user = { role: 'PLATFORM_ADMIN', isPlatformAdmin: true };

    await new Promise((resolve) => {
      res.on('finish', resolve);
      getPlatformSummaryReport(req, res);
    });

    assert(
      res.headers['Content-Type'] === 'application/pdf',
      'Report sets Content-Type to application/pdf'
    );

    assert(
      res.headers['Content-Disposition'].includes('storeflow-platform-summary.pdf'),
      'Report sets correct Content-Disposition filename'
    );

    assert(
      res.pdfBuffer && res.pdfBuffer.slice(0, 4).toString() === '%PDF',
      'Generated output contains valid PDF magic header bytes (%PDF)'
    );

    Store.find = origStoreFind;
    User.find = origUserFind;
    Product.countDocuments = origProdCount;
    Complaint.find = origCompFind;
  }

  // TEST 8: Staff Invitations, Token Activation & Quota Limits Matrix
  console.log('\n--- SUITE 6: Staff Invitations, Token Activation & Limit Enforcement ---');
  {
    const origStoreFindById = Store.findById;
    const origStoreFindByIdAndUpdate = Store.findByIdAndUpdate;
    const origUserCount = User.countDocuments;
    const origUserFindOne = User.findOne;
    const origUserCreate = User.create;
    const origInviteCount = Invitation.countDocuments;
    const origInviteFindOne = Invitation.findOne;
    const origInviteFindById = Invitation.findById;
    const origInviteCreate = Invitation.create;

    const mockStore = {
      _id: 'store_limit_test',
      status: 'ACTIVE',
      maxInventoryStaff: 2,
      maxCashiers: 3,
    };

    Store.findById = async (id) => mockStore;
    Store.findByIdAndUpdate = async (id, update) => {
      Object.assign(mockStore, update.$set);
      return mockStore;
    };

    // Sub-test 6.1: Reject invite with unauthorized role (e.g. STORE_OWNER)
    {
      const { req, res } = mockReqRes(
        { name: 'Ravi', email: 'ravi@store.com', role: 'STORE_OWNER' },
        {},
        {},
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        'store_limit_test'
      );
      await inviteStaff(req, res);
      assert(
        res.statusCode === 400 && res.data?.message?.includes('cashier'),
        'Invite rejects unauthorized role (only cashier permitted)'
      );
    }

    // Sub-test 6.2: Successful invite returns token and 48h expiry link
    {
      User.countDocuments = async () => 1;
      Invitation.countDocuments = async () => 0;
      User.findOne = async () => null;
      Invitation.findOne = async () => null;
      Invitation.create = async (doc) => ({
        _id: 'invite_123',
        ...doc,
        save: async function () { return this; },
      });

      const { req, res } = mockReqRes(
        { name: 'Kavitha Cashier', email: 'kavitha@freshmart.com', role: 'cashier' },
        {},
        {},
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        'store_limit_test'
      );
      await inviteStaff(req, res);
      assert(
        res.statusCode === 201 &&
          res.data?.activationLink?.includes('/activate-staff?token=') &&
          res.data?.data?.role === 'CASHIER',
        'Store admin can invite cashier with 48h activation token link'
      );
    }

    // Sub-test 6.3: Reject invite when cashier limit is exceeded
    {
      User.countDocuments = async () => 2;
      Invitation.countDocuments = async () => 1; // 2 active + 1 pending = 3 = maxCashiers
      const { req, res } = mockReqRes(
        { name: 'Extra Cashier', email: 'extra@freshmart.com', role: 'cashier' },
        {},
        {},
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        'store_limit_test'
      );
      await inviteStaff(req, res);
      assert(
        res.statusCode === 400 &&
          res.data?.code === 'STAFF_LIMIT_EXCEEDED' &&
          res.data?.message?.includes('limit reached'),
        'Backend rejects staff invite when cashier quota is exceeded (400 STAFF_LIMIT_EXCEEDED)'
      );
    }

    // Sub-test 6.4: Store Admin updates staff limits
    {
      const { req, res } = mockReqRes(
        { maxCashiers: 10, maxInventoryStaff: 6 },
        {},
        {},
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        'store_limit_test'
      );
      await updateStaffLimits(req, res);
      assert(
        res.statusCode === 200 &&
          res.data?.data?.maxCashiers === 10 &&
          res.data?.data?.maxInventoryStaff === 6,
        'Store admin can update staff quotas via PUT /api/users/limits'
      );
    }

    // Sub-test 6.5: Staff activation blocked if store is PENDING or SUSPENDED
    {
      Invitation.findOne = async () => ({
        _id: 'inv_pending_store',
        email: 'staff@pendingstore.com',
        token: 'token_pending_store',
        role: 'CASHIER',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        store: 'store_pending_id',
      });
      Store.findById = async () => ({
        _id: 'store_pending_id',
        status: 'PENDING',
      });

      const { req, res } = mockReqRes({
        token: 'token_pending_store',
        password: 'Password123',
      });
      await activateStaff(req, res);
      assert(
        res.statusCode === 403 && res.data?.code === 'STORE_PENDING',
        'Staff activation is blocked with 403 when supermarket store is not ACTIVE'
      );
    }

    // Sub-test 6.6: Staff activation succeeds for ACTIVE store
    {
      Store.findById = async () => ({
        _id: 'store_limit_test',
        status: 'ACTIVE',
        maxCashiers: 10,
      });
      Invitation.findOne = async () => ({
        _id: 'inv_valid',
        name: 'Kavitha Cashier',
        email: 'kavitha@freshmart.com',
        token: 'valid_token_123',
        role: 'CASHIER',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        store: 'store_limit_test',
        save: async function () { this.status = 'ACCEPTED'; return this; },
      });
      User.countDocuments = async () => 2;
      User.findOne = async () => null;
      User.create = async (doc) => ({
        _id: 'user_new_cashier',
        ...doc,
        save: async function () { return this; },
      });

      const { req, res } = mockReqRes({
        token: 'valid_token_123',
        password: 'Password123',
      });
      await activateStaff(req, res);
      assert(
        res.statusCode === 201 &&
          res.data?.token &&
          res.data?.data?.role === 'CASHIER' &&
          res.data?.data?.status === 'Active',
        'Staff activation with valid token creates account, sets role, and returns JWT session'
      );
    }

    // Sub-test 6.7: Staff activation blocked if staff quota reached
    {
      Store.findById = async () => ({
        _id: 'store_limit_test',
        status: 'ACTIVE',
        maxCashiers: 2,
      });
      Invitation.findOne = async () => ({
        _id: 'inv_over_limit',
        email: 'over@limit.com',
        token: 'over_limit_token',
        role: 'CASHIER',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        store: 'store_limit_test',
      });
      User.countDocuments = async () => 2; // Active cashiers already at max 2

      const { req, res } = mockReqRes({
        token: 'over_limit_token',
        password: 'Password123',
      });
      await activateStaff(req, res);
      assert(
        res.statusCode === 400 && res.data?.code === 'STAFF_LIMIT_EXCEEDED',
        'Staff activation is rejected with 400 STAFF_LIMIT_EXCEEDED if store quota was reached'
      );
    }

    // Sub-test 6.8: Expired or already used token rejected with 400
    {
      Invitation.findOne = async () => null;
      const { req, res } = mockReqRes({
        token: 'invalid_or_expired_token',
        password: 'Password123',
      });
      await activateStaff(req, res);
      assert(
        res.statusCode === 400 && res.data?.message?.includes('Invalid, expired, or previously used'),
        'Activation with invalid or expired token is rejected with 400'
      );
    }

    // Sub-test 6.9: Store admin revoking staff invitation
    {
      Invitation.findById = async () => ({
        _id: 'inv_to_revoke',
        email: 'staff@revoke.com',
        store: 'store_limit_test',
        status: 'PENDING',
        save: async function () { return this; },
      });
      const { req, res } = mockReqRes(
        {},
        {},
        { id: 'inv_to_revoke' },
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        'store_limit_test'
      );
      await revokeInvitation(req, res);
      assert(
        res.statusCode === 200 && res.data?.message?.includes('has been revoked'),
        'Store admin can revoke pending staff invitation'
      );
    }

    // Restore mocks
    Store.findById = origStoreFindById;
    Store.findByIdAndUpdate = origStoreFindByIdAndUpdate;
    User.countDocuments = origUserCount;
    User.findOne = origUserFindOne;
    User.create = origUserCreate;
    Invitation.countDocuments = origInviteCount;
    Invitation.findOne = origInviteFindOne;
    Invitation.findById = origInviteFindById;
    Invitation.create = origInviteCreate;
  }

  // TEST 9: Role Boundaries & Cross-Tenant Isolation Negative Tests
  console.log('\n--- SUITE 7: Role Permissions & Cross-Tenant Isolation Negative Tests ---');
  {
    // Sub-test 7.1: Cashier calling DELETE /api/products directly gets 403
    {
      const canDeleteProducts = requireRole(
        'store_admin',
        'STORE_ADMIN',
        'STORE_OWNER',
        'admin',
        'ADMIN'
      );
      const { req, res } = mockReqRes(
        {},
        {},
        { id: 'prod_1' },
        { _id: 'cashier_user_1', role: 'CASHIER' },
        'store_test_id'
      );
      let nextCalled = false;
      canDeleteProducts(req, res, () => {
        nextCalled = true;
      });
      assert(
        res.statusCode === 403 && !nextCalled,
        'Negative Test: Cashier calling DELETE /api/products directly gets 403 Forbidden'
      );
    }

    // Sub-test 7.2: Cashier calling GET /api/dashboard/stats gets 403
    {
      const { req, res } = mockReqRes(
        {},
        {},
        {},
        { _id: 'cashier_user_1', role: 'CASHIER' },
        'store_test_id'
      );
      await getDashboardStats(req, res);
      assert(
        res.statusCode === 403 && res.data?.message?.includes('Cashiers cannot view store revenue'),
        'Negative Test: Cashier calling GET /api/dashboard/stats gets 403 Forbidden'
      );
    }

    // Sub-test 7.3: Cashier calling deleteProduct controller gets 403
    {
      const { deleteProduct } = require('../controllers/productController');
      const { req, res } = mockReqRes(
        {},
        {},
        { id: 'prod_1' },
        { _id: 'cashier_user_1', role: 'CASHIER' },
        'store_test_id'
      );
      await deleteProduct(req, res);
      assert(
        res.statusCode === 403 && res.data?.message?.includes("don't have permission"),
        'Negative Test: Cashier calling deleteProduct gets 403 Forbidden'
      );
    }

    // Sub-test 7.4: Cross-tenant isolation - Store A admin cannot read Store B product data
    {
      const origProductFindById = Product.findById;
      Product.findById = async (id) => ({
        _id: id,
        name: 'Confidential Store B Product',
        store: 'store_tenant_B',
      });

      const { req, res } = mockReqRes(
        {},
        {},
        { id: 'prod_store_B' },
        { _id: 'admin_store_A', role: 'STORE_ADMIN' },
        'store_tenant_A'
      );

      let threw403 = false;
      try {
        await getProductById(req, res);
      } catch (err) {
        if (res.statusCode === 403 || err.message?.includes('from another store')) {
          threw403 = true;
        }
      }

      assert(
        threw403 || res.statusCode === 403,
        'Negative Test: Store A admin cannot read Store B product data (403 Forbidden)'
      );

      Product.findById = origProductFindById;
    }

    // Sub-test 7.5: Cross-tenant isolation - Store A admin cannot read Store B sales receipt
    {
      const origSaleFindById = Sale.findById;
      Sale.findById = () => {
        const doc = {
          _id: 'sale_store_B',
          transactionId: 'TXN-99999',
          store: 'store_tenant_B',
        };
        const mockQuery = {
          populate: () => mockQuery,
          then: (resolve) => Promise.resolve(doc).then(resolve),
          catch: (reject) => Promise.resolve(doc).catch(reject),
        };
        return mockQuery;
      };

      const { req, res } = mockReqRes(
        {},
        {},
        { id: 'sale_store_B' },
        { _id: 'admin_store_A', role: 'STORE_ADMIN' },
        'store_tenant_A'
      );

      let threwSale403 = false;
      try {
        await getSaleById(req, res);
      } catch (err) {
        if (res.statusCode === 403 || err.message?.includes('from another store')) {
          threwSale403 = true;
        }
      }

      assert(
        threwSale403 || res.statusCode === 403,
        'Negative Test: Store A admin cannot read Store B sales receipt (403 Forbidden)'
      );

      Sale.findById = origSaleFindById;
    }
  }

  // =========================================================================
  // SUITE 8: POS Atomic Checkout, Recomputed Prices, Idempotency & Stock Logic
  // =========================================================================
  console.log('\n--- SUITE 8: POS Atomic Checkout & Cashier Billing Operations ---');
  {
    const mockStoreId = 'store_pos_test';
    const mockCashier = { _id: 'cashier_user_1', name: 'Ramesh Cashier', role: 'CASHIER' };

    // Sub-test 8.1: Recomputes prices strictly from DB (never trusts client prices)
    {
      const productCola = {
        _id: 'prod_cola_123',
        name: 'Coca Cola 500ml',
        barcode: '8901234567890',
        price: 50.0, // Real DB price
        stock: 20,
        isActive: true,
        store: mockStoreId,
      };

      const origProductFind = Product.find;
      const origProductFindOneAndUpdate = Product.findOneAndUpdate;
      const origSaleCreate = Sale.create;
      const origSaleCountDocuments = Sale.countDocuments;
      const origStockMovementInsertMany = StockMovement.insertMany;

      Product.find = async () => [productCola];
      Product.findOneAndUpdate = async () => ({
        ...productCola,
        stock: 18,
      });
      Sale.countDocuments = async () => 10;
      let createdSaleDoc = null;
      Sale.create = async (doc) => {
        createdSaleDoc = { _id: 'sale_res_1', ...doc };
        return createdSaleDoc;
      };
      StockMovement.insertMany = async () => [];

      // Client maliciously or erroneously sends price: 5 instead of 50
      const { req, res } = mockReqRes(
        {
          items: [{ _id: 'prod_cola_123', qty: 2, price: 5.0 }],
          paymentMethod: 'CASH',
          amountReceived: 200,
        },
        {},
        {},
        mockCashier,
        mockStoreId
      );

      await createSale(req, res);

      assert(
        res.statusCode === 201 &&
          createdSaleDoc &&
          createdSaleDoc.items[0].price === 50.0 &&
          createdSaleDoc.subtotal === 100.0,
        'POS recomputes prices strictly from DB (client price ₹5 ignored in favor of DB price ₹50)'
      );

      Product.find = origProductFind;
      Product.findOneAndUpdate = origProductFindOneAndUpdate;
      Sale.create = origSaleCreate;
      Sale.countDocuments = origSaleCountDocuments;
      StockMovement.insertMany = origStockMovementInsertMany;
    }

    // Sub-test 8.2: Atomic decrement rolls back when any item lacks sufficient stock
    {
      const prodA = { _id: 'prod_A', name: 'Product A', stock: 10, price: 20, isActive: true, store: mockStoreId };
      const prodB = { _id: 'prod_B', name: 'Product B', stock: 1, price: 30, isActive: true, store: mockStoreId };

      const origProductFind = Product.find;
      Product.find = async () => [prodA, prodB];

      const { req, res } = mockReqRes(
        {
          items: [
            { _id: 'prod_A', qty: 2 },
            { _id: 'prod_B', qty: 5 }, // requested 5, only 1 available!
          ],
          paymentMethod: 'CASH',
        },
        {},
        {},
        mockCashier,
        mockStoreId
      );

      let threwError = false;
      let errorMsg = '';
      try {
        await createSale(req, res);
      } catch (err) {
        threwError = true;
        errorMsg = err.message;
      }

      assert(
        (threwError && errorMsg.includes('Insufficient stock for "Product B"')) || res.statusCode === 400,
        'Sale fails atomically and rolls back if any cart item has insufficient stock'
      );

      Product.find = origProductFind;
    }

    // Sub-test 8.3: Idempotency key prevents duplicate billing on repeated request
    {
      const existingProcessedSale = {
        _id: 'sale_idempotent_123',
        transactionId: 'TXN-00042',
        idempotencyKey: 'idemp-key-xyz-999',
        total: 105.0,
        status: 'COMPLETED',
      };

      const origSaleFindOne = Sale.findOne;
      Sale.findOne = async (query) => {
        if (query.idempotencyKey === 'idemp-key-xyz-999') {
          return existingProcessedSale;
        }
        return null;
      };

      const { req, res } = mockReqRes(
        {
          idempotencyKey: 'idemp-key-xyz-999',
          items: [{ _id: 'prod_1', qty: 1 }],
          paymentMethod: 'UPI',
        },
        {},
        {},
        mockCashier,
        mockStoreId
      );

      await createSale(req, res);

      assert(
        res.statusCode === 200 && res.data?.isDuplicate === true && res.data?.data?._id === 'sale_idempotent_123',
        'Idempotency key prevents duplicate billing and returns existing completed sale'
      );

      Sale.findOne = origSaleFindOne;
    }

    // Sub-test 8.4: Cashier cannot void/refund bill without store admin approval
    {
      const saleToVoid = {
        _id: 'sale_to_void_1',
        transactionId: 'TXN-00050',
        store: mockStoreId,
        status: 'COMPLETED',
        items: [{ product: 'prod_1', quantity: 2 }],
        save: async function () { return this; },
      };

      const origSaleFindById = Sale.findById;
      Sale.findById = async () => saleToVoid;

      // Cashier attempts refund without admin credentials
      const { req, res } = mockReqRes(
        { reason: 'Customer returned item' },
        {},
        { id: 'sale_to_void_1' },
        mockCashier,
        mockStoreId
      );

      await refundSale(req, res);

      assert(
        res.statusCode === 403 && res.data?.message?.includes('requires store admin privileges or store admin approval'),
        'Cashier voiding bill without store admin approval is blocked with 403 Forbidden'
      );

      // Sub-test 8.5: Cashier can void bill when store admin credentials are provided
      const origUserFindOne = User.findOne;
      const origProductFindOne = Product.findOne;
      const origStockMovementCreate = StockMovement.create;

      User.findOne = async (query) => ({
        _id: 'admin_owner_1',
        name: 'Store Owner',
        email: query.email,
        role: 'STORE_ADMIN',
        matchPassword: async (pwd) => pwd === 'ownerSecret123',
      });

      Product.findOne = async () => ({
        _id: 'prod_1',
        stock: 18,
        save: async function () { this.stock += 2; return this; },
      });
      StockMovement.create = async () => ({});

      const { req: authReq, res: authRes } = mockReqRes(
        {
          reason: 'Defective item exchange',
          adminEmail: 'owner@store.com',
          adminPassword: 'ownerSecret123',
        },
        {},
        { id: 'sale_to_void_1' },
        mockCashier,
        mockStoreId
      );

      await refundSale(authReq, authRes);

      assert(
        authRes.statusCode === 200 &&
          authRes.data?.data?.status === 'REFUNDED' &&
          authRes.data?.message?.includes('refunded successfully'),
        'Cashier voids bill successfully when verified with store admin approval credentials'
      );

      Sale.findById = origSaleFindById;
      User.findOne = origUserFindOne;
      Product.findOne = origProductFindOne;
      StockMovement.create = origStockMovementCreate;
    }

    // Sub-test 8.6: Export sales CSV formats rows and headers correctly
    {
      const mockSalesList = [
        {
          transactionId: 'TXN-00001',
          receiptNo: 'TXN-00001',
          createdAt: new Date('2026-10-14T10:00:00Z'),
          cashierName: 'Ramesh Cashier',
          items: [{ name: 'Rice 5kg', quantity: 1, price: 300 }],
          subtotal: 300,
          discount: 0,
          tax: 15,
          total: 315,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
        },
      ];

      const origSaleFind = Sale.find;
      Sale.find = () => ({
        sort: () => Promise.resolve(mockSalesList),
      });

      const { req, res } = mockReqRes(
        {},
        {},
        {},
        { _id: 'admin_1', role: 'STORE_ADMIN' },
        mockStoreId
      );

      await exportSalesCsv(req, res);

      assert(
        res.statusCode === 200 &&
          res.headers['Content-Type']?.includes('text/csv') &&
          res.sentData?.includes('Transaction ID') &&
          res.sentData?.includes('TXN-00001') &&
          res.sentData?.includes('315.00'),
        'Store admin can export sales history as CSV report with headers and totals'
      );

      // Sub-test 8.7: Platform Admin is forbidden from direct store sales operations (403)
      const { forbidPlatformAdmin } = require('../middleware/authMiddleware');
      const { req: pReq, res: pRes } = mockReqRes(
        {},
        {},
        {},
        { _id: 'plat_1', role: 'PLATFORM_SUPER_ADMIN', isPlatformAdmin: true },
        mockStoreId
      );

      let allowed = false;
      forbidPlatformAdmin(pReq, pRes, () => {
        allowed = true;
      });

      assert(
        !allowed && pRes.statusCode === 403,
        'Platform Admin calling store sales route gets 403 Forbidden'
      );

      Sale.find = origSaleFind;
    }
  }

  // =========================================================================
  // SUITE 9: Extra Features (Supplier/Expiry, Daily Closing, Password Change)
  // =========================================================================
  console.log('\n--- SUITE 9: Extra Features, Daily Closing & Store Settings ---');

  // Sub-test 9.1: Product creation persists supplier and expiryDate
  {
    const origProductFindOne = Product.findOne;
    const origProductCreate = Product.create;

    Product.findOne = async () => null;
    let createdProductData = null;
    Product.create = async (doc) => {
      createdProductData = doc;
      return { _id: 'prod_new_1', ...doc };
    };

    const { req, res } = mockReqRes(
      {
        name: 'Organic Milk 1L',
        barcode: '8901234567890',
        category: 'Dairy',
        price: 65,
        stock: 50,
        supplier: 'Heritage Foods Ltd',
        expiryDate: '2026-11-20',
        lowStockThreshold: 10,
      },
      {},
      {},
      { _id: 'admin_1', role: 'STORE_ADMIN' },
      'store_extra_test'
    );

    await createProduct(req, res);

    assert(
      res.statusCode === 201 &&
        createdProductData?.supplier === 'Heritage Foods Ltd' &&
        createdProductData?.expiryDate instanceof Date &&
        createdProductData?.expiryDate.toISOString().startsWith('2026-11-20'),
      'Product creation persists supplier name and expiryDate'
    );

    Product.findOne = origProductFindOne;
    Product.create = origProductCreate;
  }

  // Sub-test 9.2: Daily Closing Z-Report aggregates tender breakdown and net revenue
  {
    const origSaleFind = Sale.find;
    const origStoreFindById = Store.findById;

    Sale.find = async () => [
      {
        status: 'COMPLETED',
        total: 250,
        subtotal: 238,
        tax: 12,
        discount: 0,
        paymentMethod: 'CASH',
        items: [{ quantity: 2 }, { quantity: 1 }],
      },
      {
        status: 'COMPLETED',
        total: 350,
        subtotal: 330,
        tax: 20,
        discount: 10,
        paymentMethod: 'UPI',
        items: [{ quantity: 4 }],
      },
      {
        status: 'REFUNDED',
        total: 50,
        subtotal: 50,
        tax: 0,
        discount: 0,
        paymentMethod: 'CASH',
        items: [{ quantity: 1 }],
      },
    ];

    Store.findById = async () => ({
      name: 'StoreFlow Supermarket',
      address: '123 Market St',
      gstin: '33AAAAA0000A1Z5',
    });

    const { req, res } = mockReqRes(
      {},
      { date: '2026-10-14' },
      {},
      { _id: 'cashier_1', role: 'CASHIER' },
      'store_closing_test'
    );

    await getDailyClosingReport(req, res);

    assert(
      res.statusCode === 200 &&
        res.data?.data?.totalSalesCount === 2 &&
        res.data?.data?.grossRevenue === 600 &&
        res.data?.data?.refundedAmount === 50 &&
        res.data?.data?.netRevenue === 550 &&
        res.data?.data?.cashTotal === 250 &&
        res.data?.data?.upiTotal === 350 &&
        res.data?.data?.itemsSold === 7,
      'Daily Closing Z-Report aggregates gross/net revenue, tender breakdown, and refunds'
    );

    Sale.find = origSaleFind;
    Store.findById = origStoreFindById;
  }

  // Sub-test 9.3: Change password enforces minimum length and verifies current password
  {
    const origUserFindById = User.findById;

    const mockUser = {
      _id: 'user_pwd_test',
      password: 'OldHashedPassword',
      async matchPassword(pwd) {
        return pwd === 'CurrentSecret123';
      },
      async save() {
        return this;
      },
    };

    User.findById = () => {
      const p = Promise.resolve(mockUser);
      p.select = () => Promise.resolve(mockUser);
      return p;
    };

    // 9.3a: Wrong current password
    const { req: wrongReq, res: wrongRes } = mockReqRes(
      { currentPassword: 'WrongPassword', newPassword: 'NewValidPassword123' },
      {},
      {},
      { _id: 'user_pwd_test' }
    );
    await changePassword(wrongReq, wrongRes);
    assert(
      wrongRes.statusCode === 401 && wrongRes.data?.message?.includes('Current password does not match'),
      'Change password fails with 401 when current password does not match'
    );

    // 9.3b: New password too short (< 8 chars)
    const { req: shortReq, res: shortRes } = mockReqRes(
      { currentPassword: 'CurrentSecret123', newPassword: 'short' },
      {},
      {},
      { _id: 'user_pwd_test' }
    );
    await changePassword(shortReq, shortRes);
    assert(
      shortRes.statusCode === 400 && shortRes.data?.message?.includes('at least 8 characters'),
      'Change password rejects new password with length less than 8 characters'
    );

    // 9.3c: Correct password change
    const { req: validReq, res: validRes } = mockReqRes(
      { currentPassword: 'CurrentSecret123', newPassword: 'BrandNewPassword123' },
      {},
      {},
      { _id: 'user_pwd_test' }
    );
    await changePassword(validReq, validRes);
    assert(
      validRes.statusCode === 200 && validRes.data?.message?.includes('Password updated successfully'),
      'Change password succeeds with 200 when current password matches and new password meets policy'
    );

    User.findById = origUserFindById;
  }

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenantTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
