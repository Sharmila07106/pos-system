import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Sparkles,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { resolveProductImage, getSuggestedProductImage } from '../utils/productImage';

// Add/Edit Product Modal
const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Grocery',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '5',
    supplier: '',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      const initialImg = product.imageUrl || product.image || '';
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || 'Grocery',
        price: product.price !== undefined ? String(product.price) : '',
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
        stock: product.stock !== undefined ? String(product.stock) : '',
        lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '5',
        supplier: product.supplier || '',
        imageUrl: initialImg,
      });
      setPreviewUrl(resolveProductImage(product));
    } else {
      const defaultCat = 'Grocery';
      setFormData({
        name: '',
        barcode: '',
        category: defaultCat,
        price: '',
        costPrice: '',
        stock: '',
        lowStockThreshold: '5',
        supplier: '',
        imageUrl: '',
      });
      setPreviewUrl(getSuggestedProductImage('', defaultCat));
    }
    setImageFile(null);
  }, [product, isOpen]);

  // Handle local photo selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // Re-suggest vector packaging illustration based on name & category
  const handleUseSuggested = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const suggested = getSuggestedProductImage(formData.name, formData.category);
    setFormData(prev => ({ ...prev, imageUrl: suggested }));
    setPreviewUrl(suggested);
    toast.success('Assigned suggested packaging illustration');
  };

  // Remove custom image and reset to category default
  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const fallback = getSuggestedProductImage(formData.name, formData.category);
    setFormData(prev => ({ ...prev, imageUrl: fallback }));
    setPreviewUrl(fallback);
  };

  // Automatically update preview if user changes name/category and hasn't uploaded a file
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, category: newCategory };
      if (!imageFile && (!updated.imageUrl || updated.imageUrl.startsWith('/product-images/'))) {
        const suggested = getSuggestedProductImage(updated.name, newCategory);
        updated.imageUrl = suggested;
        setPreviewUrl(suggested);
      }
      return updated;
    });
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name: newName };
      if (!imageFile && (!updated.imageUrl || updated.imageUrl.startsWith('/product-images/'))) {
        const suggested = getSuggestedProductImage(newName, updated.category);
        updated.imageUrl = suggested;
        setPreviewUrl(suggested);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Product name is required');
    if (!formData.barcode.trim()) return toast.error('Barcode is required');
    if (formData.price === '' || Number(formData.price) < 0) return toast.error('Valid price is required');
    if (formData.stock === '' || Number(formData.stock) < 0) return toast.error('Valid stock quantity is required');

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // If user uploaded a new local file, upload it first to /products/upload-image
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await api.post('/products/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data?.imageUrl || uploadRes.data?.data) {
          finalImageUrl = uploadRes.data.imageUrl || uploadRes.data.data;
        }
      }

      if (!finalImageUrl) {
        finalImageUrl = getSuggestedProductImage(formData.name, formData.category);
      }

      const payload = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category.trim(),
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        supplier: formData.supplier.trim(),
        imageUrl: finalImageUrl,
        image: finalImageUrl,
      };

      if (product) {
        await api.put(`/products/${product._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product added successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Save product error:', error);
      const msg = error.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/40 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg bg-white rounded-[20px] border border-[#E5EAF1] shadow-2xl overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5EAF1] bg-[#F8FAFC] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#0B1B3A]">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-xs text-[#55607A] mt-0.5">
                  Enter supermarket item details, barcode, pricing, and packaging image
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#55607A] hover:text-[#0B1B3A] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E5EAF1]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Product Image Section */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5EAF1]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-2.5">
                  Product Image & Packaging Illustration
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-20 h-20 rounded-2xl bg-white border border-[#E5EAF1] p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Product preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/product-images/generic-grocery.svg';
                        }}
                      />
                    ) : (
                      <ImageIcon size={28} className="text-[#8B96AB]" />
                    )}
                  </div>

                  {/* Image Action Buttons */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="product-image-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#12A58B] hover:text-[#12A58B] text-[#0F1B33] text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        <Upload size={13} />
                        Upload Image
                      </label>
                      <button
                        type="button"
                        onClick={handleUseSuggested}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E2F6F3] text-[#0E8C76] hover:bg-[#12A58B] hover:text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Sparkles size={13} />
                        Use Suggested
                      </button>
                      {(imageFile || formData.imageUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#E5484D] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8B96AB]">
                      Max 2MB (JPG, PNG, WEBP). Or auto-assign vector packaging illustration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Basmati Rice 1kg, Amul Butter 500g"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Barcode / SKU *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 8901030010011"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-mono font-medium text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                    >
                      <option value="Grocery">Grocery</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Fruits">Fruits & Vegetables</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Household">Household & Cleaning</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 95.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0E8C76] focus:outline-none focus:border-[#12A58B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Cost Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 75.00"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Initial Stock Quantity *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Default 5"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#55607A] block mb-1">
                    Supplier / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Consumer Products, Britannia Industries"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E5EAF1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#55607A] hover:bg-[#F4F7FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#12A58B] hover:bg-[#0E8C76] active:bg-[#0B7260] text-white font-bold text-sm shadow-[0_2px_8px_rgba(18,165,139,0.25)] transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{product ? 'Save Changes' : 'Create Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
      setProducts(data.data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      const msg = error.response?.data?.message || 'Failed to delete product';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
            Product Catalogue
          </h1>
          <p className="text-sm text-[#55607A] font-medium mt-1">
            Manage your supermarket inventory, live stock, barcodes, and product packaging
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#12A58B] hover:bg-[#0E8C76] active:bg-[#0B7260] text-white rounded-xl shadow-[0_2px_8px_rgba(18,165,139,0.25)] transition-all font-bold text-sm shrink-0"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[20px] border border-[#E5EAF1] shadow-[0_1px_3px_rgba(11,27,58,0.04)] overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E5EAF1] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by product name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-[#0F1B33] placeholder-[#8B96AB] focus:outline-none focus:border-[#12A58B] transition-colors"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-auto bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#0F1B33] focus:outline-none focus:border-[#12A58B] transition-colors"
            >
              <option value="">All Categories</option>
              <option value="Grocery">Grocery</option>
              <option value="Dairy">Dairy</option>
              <option value="Bakery">Bakery</option>
              <option value="Snacks">Snacks</option>
              <option value="Beverages">Beverages</option>
              <option value="Fruits">Fruits & Vegetables</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Household">Household</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#55607A] w-full md:w-auto justify-end">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF1] shadow-xs">
              Total: {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5EAF1] text-xs font-bold text-[#55607A] uppercase tracking-wider">
                <th className="py-3.5 px-5">Product</th>
                <th className="py-3.5 px-5">Barcode</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Price</th>
                <th className="py-3.5 px-5">Live Stock</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF1]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-24 text-center">
                    <div className="inline-block w-8 h-8 border-3 border-[#CBD5E1] border-t-[#12A58B] rounded-full animate-spin mb-3" />
                    <p className="text-sm font-semibold text-[#55607A]">Loading product catalogue...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="w-16 h-16 bg-[#F4F7FB] border border-[#E5EAF1] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#CBD5E1]">
                      <ShoppingBag size={30} strokeWidth={1.5} />
                    </div>
                    <p className="font-bold text-[#0F1B33] text-base">No products found</p>
                    <p className="text-xs text-[#55607A] mt-1 max-w-sm mx-auto">
                      {search || category
                        ? 'Try clearing or modifying your search and filter criteria.'
                        : 'No products registered in this supermarket yet. Click "Add Product" above to create your first item.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);
                  const imageSrc = resolveProductImage(product);

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-[#F4F9F8] transition-colors group"
                    >
                      {/* Product Name & 48px Image */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-[#F4F7FB] border border-[#E5EAF1] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={imageSrc}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/product-images/generic-grocery.svg';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#0F1B33] text-sm leading-snug">
                              {product.name}
                            </div>
                            {product.supplier && (
                              <div className="text-xs text-[#55607A] truncate">
                                {product.supplier}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#55607A]">
                        {product.barcode}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-[#F4F7FB] border border-[#E5EAF1] text-xs font-bold text-[#55607A]">
                          {product.category}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-5 font-extrabold text-[#0E8C76] text-base tabular-nums">
                        ₹{Number(product.price || 0).toFixed(2)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-5 font-extrabold text-[#0F1B33] text-sm tabular-nums">
                        {product.stock} units
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#FCA5A5]/40 shadow-xs">
                            <AlertTriangle size={12} /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1E3] text-[#FF8A1F] border border-[#FF8A1F]/30 shadow-xs">
                            <AlertTriangle size={12} /> Low Stock (≤{product.lowStockThreshold || 5})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]/40 shadow-xs">
                            <CheckCircle2 size={12} /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-[#E2F6F3] text-[#0E8C76] hover:bg-[#12A58B] hover:text-white transition-colors"
                            title="Edit product"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product._id)}
                            className="p-2 rounded-lg bg-[#FEE2E2] text-[#E5484D] hover:bg-[#E5484D] hover:text-white transition-colors"
                            title="Deactivate product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
