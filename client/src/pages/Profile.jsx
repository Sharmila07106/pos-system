import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield, Settings as SettingsIcon, LogOut } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6 relative z-10 max-w-5xl mx-auto pb-10">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">Profile Settings</h1>
          <p className="text-slate-500 font-medium">Manage your account preferences and security</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Sidebar Menu */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-4 lg:col-span-3 space-y-4"
        >
          <GlassCard className="p-4 shadow-xl">
            <div className="flex flex-col items-center p-4 border-b border-border-color mb-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-cyan-500/20 mb-3">
                SU
              </div>
              <h3 className="font-bold text-lg">Sharmila U</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md mt-1">
                <Shield size={12} /> Administrator
              </div>
            </div>
            
            <nav className="space-y-1">
              {[
                { id: 'general', label: 'General', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'preferences', label: 'Preferences', icon: SettingsIcon }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === item.id 
                    ? 'bg-blue-500/10 text-cyan-500 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                    : 'text-slate-500 hover:text-text-color hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
            </nav>
          </GlassCard>
          
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-red-500/30">
            <LogOut size={18} /> Sign Out
          </button>
        </motion.div>

        {/* Right Content Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-8 lg:col-span-9"
        >
          {activeTab === 'general' && (
            <GlassCard className="p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6">Personal Information</h2>
              <form className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input type="text" defaultValue="Sharmila U" className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input type="email" defaultValue="admin@novapos.com" className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium transition-all" />
                  </div>
                </div>
                <button type="button" className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/30">
                  Save Changes
                </button>
              </form>
            </GlassCard>
          )}

          {activeTab === 'security' && (
            <GlassCard className="p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6">Change Password</h2>
              <form className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium transition-all" />
                  </div>
                </div>
                <button type="button" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30">
                  Update Password
                </button>
              </form>
            </GlassCard>
          )}

          {activeTab === 'preferences' && (
            <GlassCard className="p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6">System Preferences</h2>
              <div className="space-y-4">
                <p className="text-slate-400 font-medium">Use the top-right toggle to change between Light and Dark mode globally.</p>
                {/* Additional mocked preferences could go here */}
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
