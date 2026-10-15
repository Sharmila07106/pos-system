const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProducts,
  getProductById,
  getProductByBarcode,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require('../controllers/productController');
const {
  protect,
  requireRole,
  requireActiveStore,
  forbidPlatformAdmin,
} = require('../middleware/authMiddleware');

// Multer config for image upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// All product routes require valid authentication, active store, and forbid platform admin
router.use(protect);
router.use(requireActiveStore);
router.use(forbidPlatformAdmin);

// Cashiers and Store Admins can view, add, and edit products and stock
const canManageProducts = requireRole(
  'store_admin',
  'STORE_ADMIN',
  'STORE_OWNER',
  'admin',
  'ADMIN',
  'cashier',
  'CASHIER'
);

// Delete product is strictly restricted to Store Admins only
const canDeleteProducts = requireRole(
  'store_admin',
  'STORE_ADMIN',
  'STORE_OWNER',
  'admin',
  'ADMIN'
);

router.route('/')
  .get(getProducts)
  .post(canManageProducts, upload.single('image'), createProduct);

router.post('/upload-image', canManageProducts, upload.single('image'), uploadImage);

router.get('/categories/all', getCategories);
router.get('/barcode/:barcode', getProductByBarcode);

router.route('/:id')
  .get(getProductById)
  .put(canManageProducts, upload.single('image'), updateProduct)
  .delete(canDeleteProducts, deleteProduct);

module.exports = router;
