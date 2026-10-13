const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { loginUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// For backwards compatibility with any existing client calls
router.post('/login', loginUser);

// User management endpoints (Admin only)
router.route('/')
  .get(protect, adminOnly, getUsers)
  .post(protect, adminOnly, createUser);

router.route('/:id')
  .put(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
