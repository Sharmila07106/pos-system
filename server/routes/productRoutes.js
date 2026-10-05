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
  uploadImage
} = require('../controllers/productController');

// Placeholder middlewares (assume authMiddleware exists)
// const { protect, authorize } = require('../middleware/authMiddleware');

// Using dummy middleware until real auth is plugged in for this phase
const protect = (req, res, next) => {
  req.user = { role: 'ADMIN' }; // dummy user
  next();
};
const authorize = (...roles) => (req, res, next) => next();

// Multer config for image upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
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
  }
});

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('ADMIN'), createProduct);

router.post('/upload-image', protect, authorize('ADMIN'), upload.single('image'), uploadImage);

router.get('/categories/all', protect, getCategories);
router.get('/barcode/:barcode', protect, getProductByBarcode);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('ADMIN'), updateProduct)
  .delete(protect, authorize('ADMIN'), deleteProduct);

module.exports = router;
