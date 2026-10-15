const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Ensure destination directory exists: server/uploads/products
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for image upload (max 2MB, jpg/jpeg/png/webp)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${cleanExt}`);
  },
});

const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (JPG, JPEG, PNG, WEBP) under 2MB!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// All product routes require valid authentication, active store, and forbid platform admin
router.use(protect);
router.use(requireActiveStore);
router.use(forbidPlatformAdmin);

// Cashiers and Store Admins can view, add, and edit products, stock, and upload product photos
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
