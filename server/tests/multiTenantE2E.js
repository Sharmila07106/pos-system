const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { registerStore, loginUser } = require('../controllers/authController');
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
const { requireActiveStore, forbidPlatformAdmin } = require('../middleware/authMiddleware');

const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Complaint = require('../models/Complaint');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');

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
