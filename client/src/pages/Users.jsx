import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, UserCircle, Shield, Mail } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const Users = () => {
  // Mock data since full Auth backend was optional
  const [users] = useState([
    { _id: '1', name: 'Sharmila U', email: 'admin@novapos.com', role: 'ADMIN', status: 'Active' },
    { _id: '2', name: 'Cashier One', email: 'cashier1@novapos.com', role: 'CASHIER', status: 'Active' },
    { _id: '3', name: 'Manager John', email: 'john@novapos.com', role: 'MANAGER', status: 'Offline' },
  ]);

  return (
    <div className="space-y-6 relative z-10">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">System Users</h1>
          <p className="text-slate-500 font-medium">Manage cashiers, managers, and system access</p>
        </div>
        
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-500/25 transition-all font-bold active:scale-95">
          <Plus size={18} />
          <span>Invite User</span>
        </button>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {users.map((user, i) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <GlassCard className="p-6 relative overflow-hidden group shadow-xl border-t-2" style={{ borderTopColor: user.role === 'ADMIN' ? '#8b5cf6' : user.role === 'MANAGER' ? '#3b82f6' : '#10b981' }}>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16}/></button>
                  <button className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center border border-border-color">
                    <UserCircle size={32} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text-color leading-tight">{user.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold mt-1">
                      <Shield size={12} className={user.role === 'ADMIN' ? 'text-violet-500' : 'text-blue-500'} />
                      <span className={user.role === 'ADMIN' ? 'text-violet-500' : 'text-blue-500'}>{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-400'}`}></div>
                    <span>{user.status}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Users;
