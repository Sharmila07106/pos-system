const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  inviteStaff,
  resendInvitation,
  revokeInvitation,
  getStaffLimits,
  updateStaffLimits,
} = require('../controllers/userController');
const { loginUser } = require('../controllers/authController');
const {
  protect,
  requireActiveStore,
  storeOwnerOnly,
} = require('../middleware/authMiddleware');

// For backwards compatibility with any existing client calls
router.post('/login', loginUser);

// All staff and user management endpoints require active approved store and owner/admin privileges
router.use(protect);
router.use(requireActiveStore);

// Staff Limits endpoints
router.get('/limits', storeOwnerOnly, getStaffLimits);
router.put('/limits', storeOwnerOnly, updateStaffLimits);

// Staff Invitation endpoints
router.post('/invite', storeOwnerOnly, inviteStaff);
router.post('/invite/:id/resend', storeOwnerOnly, resendInvitation);
router.delete('/invite/:id', storeOwnerOnly, revokeInvitation);

// User management endpoints (Owner / Admin only)
router.route('/')
  .get(storeOwnerOnly, getUsers)
  .post(storeOwnerOnly, createUser);

router.route('/:id')
  .put(storeOwnerOnly, updateUser)
  .delete(storeOwnerOnly, deleteUser);

module.exports = router;
