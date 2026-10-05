import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import GlassCard from '../components/ui/GlassCard';

// Add/Edit Product Modal
const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', barcode: '', category: 'General', price: '', stock: '', lowStockThreshold: '5'
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name, barcode: product.barcode, category: product.category,
        price: product.price, stock: product.stock, lowStockThreshold: product.lowStockThreshold
      });
      setPreview(product.image || null);
    } else {
      setFormData({ name: '', barcode: '', category: 'General', price: '', stock: '', lowStockThreshold: '5' });
      setPreview(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (imageFile) data.append('image', imageFile);

      if (product) {
        await api.put(`/products/${product._id}`, data);
        toast.success('Product updated!');
      } else {
        await api.post('/products', data);
        toast.success('Product added!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg"
          >
            <GlassCard className="p-0 overflow-hidden shadow-2xl border-cyan-500/30">
              <div className="p-5 border-b border-border-color flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex gap-6">
                  {/* Image Upload Area */}
                  <div className="w-32 flex flex-col gap-2">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border-color bg-black/10 flex items-center justify-center relative overflow-hidden group hover:border-cyan-500 transition-colors">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center">
                          <Upload size={24} className="mb-2 group-hover:text-cyan-500 transition-colors" />
                          <span className="text-xs">Upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  
                  {/* Form Fields */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Name</label>
                      <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Barcode</label>
                      <input required value={formData.barcode} onChange={e=>setFormData({...formData, barcode: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm font-mono" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Price (₹)</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Category</label>
                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm appearance-none">
                      <option className="bg-bg-color">Dairy</option>
                      <option className="bg-bg-color">Bakery</option>
                      <option className="bg-bg-color">Snacks</option>
                      <option className="bg-bg-color">Beverages</option>
                      <option className="bg-bg-color">Fruits</option>
                      <option className="bg-bg-color">Personal Care</option>
                      <option className="bg-bg-color">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Initial Stock</label>
                    <input required type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Low Alert At</label>
                    <input required type="number" value={formData.lowStockThreshold} onChange={e=>setFormData({...formData, lowStockThreshold: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-lg px-3 py-2 outline-none focus:border-cyan-500 text-sm" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center">
                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Product'}
                  </button>
                </div>
              </form>
            </GlassCard>
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
      const { data } = await api.get(`/products?search=${search}&category=${category}`);
      setProducts(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted');
        fetchProducts();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
        onSuccess={fetchProducts} 
      />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">Products</h1>
          <p className="text-slate-500 font-medium">Manage your store catalog and inventory</p>
        </div>
        
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all font-bold active:scale-95"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </motion.div>

      <GlassCard className="rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-color flex flex-col md:flex-row gap-4 bg-black/10">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-text-color outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
            />
          </div>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black/20 border border-border-color rounded-xl px-4 py-2.5 text-text-color outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none font-medium min-w-[150px]"
          >
            <option value="" className="bg-bg-color">All Categories</option>
            <option value="Dairy" className="bg-bg-color">Dairy</option>
            <option value="Snacks" className="bg-bg-color">Snacks</option>
            <option value="Beverages" className="bg-bg-color">Beverages</option>
            <option value="Fruits" className="bg-bg-color">Fruits</option>
            <option value="Bakery" className="bg-bg-color">Bakery</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color bg-black/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="inline-block w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                    <div className="text-slate-400 font-medium">Loading catalog...</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-border-color">
                      <ImageIcon size={32} className="text-slate-500" />
                    </div>
                    <div className="text-slate-400 font-medium">No products found matching your search.</div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((product, index) => (
                    <motion.tr 
                      key={product._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden border border-border-color shadow-sm group-hover:border-cyan-500/30 transition-colors">
                          {product.image ? (
                            <img src={product.image.startsWith('http') ? product.image : `http://localhost:5090${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-slate-500" />
                          )}
                        </div>
                        <span className="font-bold text-text-color">{product.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{product.barcode}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-lg bg-black/20 border border-border-color text-xs font-semibold text-slate-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-cyan-500">₹{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-text-color">{product.stock}</td>
                      <td className="px-6 py-4">
                        {product.stock === 0 ? (
                          <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">Out of Stock</span>
                        ) : product.stock <= product.lowStockThreshold ? (
                          <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]">Low Stock</span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">In Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Products;
