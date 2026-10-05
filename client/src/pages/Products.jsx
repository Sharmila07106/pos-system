import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${search}`);
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
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm">Manage your store catalog and inventory</p>
        </div>
        
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all active:scale-95">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4 bg-[#0a0f25]/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search products by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#030712]/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-[#030712]/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none">
              <option value="">All Categories</option>
              <option value="Dairy">Dairy</option>
              <option value="Snacks">Snacks</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a0f25]/80 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Barcode</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#030712]/30">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="mt-2 text-slate-400">Loading products...</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-500" />
                        )}
                      </div>
                      <span className="font-medium text-white">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.barcode}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">₹{product.price}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      {product.stock === 0 ? (
                        <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs">Out of Stock</span>
                      ) : product.stock <= product.lowStockThreshold ? (
                        <span className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs">Low Stock</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
