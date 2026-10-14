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
} = require('../controllers/userController');
const { loginUser } = require('../controllers/authController');
const { protect, storeOwnerOnly, adminOnly } = require('../middleware/authMiddleware');

// For backwards compatibility with any existing client calls
router.post('/login', loginUser);

// Staff Invitation endpoints
router.post('/invite', protect, storeOwnerOnly, inviteStaff);
router.post('/invite/:id/resend', protect, storeOwnerOnly, resendInvitation);
router.delete('/invite/:id', protect, storeOwnerOnly, revokeInvitation);

// User management endpoints (Owner / Admin only)
router.route('/')
  .get(protect, storeOwnerOnly, getUsers)
  .post(protect, storeOwnerOnly, createUser);

router.route('/:id')
  .put(protect, storeOwnerOnly, updateUser)
  .delete(protect, storeOwnerOnly, deleteUser);

module.exports = router;
