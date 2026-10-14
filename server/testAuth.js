const User = require('./models/User');
const { registerUser, loginUser, googleAuth } = require('./controllers/authController');

async function runAuthTests() {
  console.log('====================================================');
  console.log('   STOREFLOW AUTH CONTROLLER & VALIDATION TESTS     ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  function mockReqRes(body) {
    return {
      req: { body },
      res: {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; }
      }
    };
  }

  // Mock database storage for unit testing without requiring remote Atlas connection
  const mockDB = [];
  User.countDocuments = async () => mockDB.length;
  User.findOne = async ({ email }) => mockDB.find(u => u.email === email) || null;
  User.create = async ({ name, email, password, role, status }) => {
    const user = {
      _id: 'mock_id_' + Date.now(),
      name,
      email,
      password: 'hashed_' + password,
      role,
      status: status || 'Active',
      createdAt: new Date(),
      matchPassword: async (pwd) => pwd === password,
    };
    mockDB.push(user);
    return user;
  };

  // TEST 1: Name validation (< 2 characters)
  {
    const { req, res } = mockReqRes({ name: 'A', email: 'test@example.com', password: 'Password123' });
    await registerUser(req, res);
    assert(res.statusCode === 400 && res.data.message.includes('2 and 60'), 'Rejects name with less than 2 characters');
  }

  // TEST 2: Email validation (invalid format)
  {
    const { req, res } = mockReqRes({ name: 'Valid Name', email: 'invalid-email-format', password: 'Password123' });
    await registerUser(req, res);
    assert(res.statusCode === 400 && res.data.message.includes('valid email'), 'Rejects invalid email format');
  }

  // TEST 3: Password validation (< 8 characters)
  {
    const { req, res } = mockReqRes({ name: 'Valid Name', email: 'user@example.com', password: 'short1' });
    await registerUser(req, res);
    assert(res.statusCode === 400 && res.data.message.includes('at least 8 characters'), 'Rejects password shorter than 8 characters');
  }

  // TEST 4: Password validation (no number)
  {
    const { req, res } = mockReqRes({ name: 'Valid Name', email: 'user@example.com', password: 'allletterslong' });
    await registerUser(req, res);
    assert(res.statusCode === 400 && res.data.message.includes('letter and one number'), 'Rejects password without a number');
  }

  // TEST 5: First user registration -> Role MUST be ADMIN (when DB count is 0)
  {
    const { req, res } = mockReqRes({
      name: 'First Store Owner',
      email: 'owner@storeflow.com',
      password: 'StrongPassword123'
    });
    await registerUser(req, res);
    assert(
      res.statusCode === 201 &&
      res.data?.data?.role === 'ADMIN' &&
      res.data?.token &&
      !res.data?.data?.password,
      'First registered user in database automatically becomes ADMIN and receives JWT token'
    );
  }

  // TEST 6: Duplicate email registration -> Must return 409
  {
    const { req, res } = mockReqRes({
      name: 'Duplicate Owner',
      email: 'owner@storeflow.com',
      password: 'StrongPassword123'
    });
    await registerUser(req, res);
    assert(
      res.statusCode === 409 &&
      res.data?.message === 'An account with this email already exists',
      'Duplicate email returns 409 with exact message "An account with this email already exists"'
    );
  }

  // TEST 7: Subsequent user registration -> Role MUST be CASHIER even if client tries to send ADMIN
  {
    const { req, res } = mockReqRes({
      name: 'Public Cashier',
      email: 'cashier@storeflow.com',
      password: 'CashierPass123',
      role: 'ADMIN' // Client trying to escalate privileges!
    });
    await registerUser(req, res);
    assert(
      res.statusCode === 201 &&
      res.data?.data?.role === 'CASHIER',
      'Subsequent user registration assigns CASHIER role (ignoring client role: ADMIN)'
    );
  }

  // TEST 8: Login with mixed-case and whitespace in email
  {
    const { req, res } = mockReqRes({
      email: '  CASHIER@StoreFlow.com  ',
      password: 'CashierPass123'
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 200 &&
      res.data?.success === true &&
      res.data?.data?.email === 'cashier@storeflow.com' &&
      res.data?.token,
      'Login normalizes (trims and lowercases) email and returns JWT'
    );
  }

  // TEST 9: Login with incorrect password -> 401 Invalid email or password
  {
    const { req, res } = mockReqRes({
      email: 'cashier@storeflow.com',
      password: 'WrongPassword999'
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 401 &&
      res.data?.message === 'Invalid email or password',
      'Login with wrong password returns 401 "Invalid email or password"'
    );
  }

  // TEST 10: PLATFORM_SUPER_ADMIN login returns isPlatformAdmin: true
  {
    mockDB.push({
      _id: 'super_admin_mock_id',
      name: 'Super Admin',
      email: 'sharmila0774@gmail.com',
      password: 'hashed_password',
      role: 'PLATFORM_SUPER_ADMIN',
      status: 'Active',
      createdAt: new Date(),
      matchPassword: async (pwd) => pwd === 'sharmi12345',
    });

    const { req, res } = mockReqRes({
      email: 'sharmila0774@gmail.com',
      password: 'sharmi12345'
    });
    await loginUser(req, res);
    assert(
      res.statusCode === 200 &&
      res.data?.success === true &&
      res.data?.data?.role === 'PLATFORM_SUPER_ADMIN' &&
      res.data?.data?.isPlatformAdmin === true,
      'PLATFORM_SUPER_ADMIN login correctly sets isPlatformAdmin: true'
    );
  }

  // TEST 11: googleAuth rejects missing credential with 400
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

runAuthTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
