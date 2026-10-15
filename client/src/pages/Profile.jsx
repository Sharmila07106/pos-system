import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Settings as SettingsIcon, 
  LogOut, 
  Store as StoreIcon, 
  Phone, 
  FileText, 
  Check, 
  Percent,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GlassCard from '../components/ui/GlassCard';

const Profile = () => {
  const { user, logout } = useAuth();
  const isStoreAdmin = ['store_admin', 'store_owner', 'admin'].includes((user?.role || '').toLowerCase());

  const [activeTab, setActiveTab] = useState('general');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Store Settings state (for Store Admin)
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    taxRatePercent: 5,
    receiptFooter: '',
    lowStockThresholdGlobal: 5,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (isStoreAdmin && activeTab === 'store') {
      const fetchStoreSettings = async () => {
        try {
          setLoadingSettings(true);
          const { data } = await api.get('/settings');
          if (data?.data) {
            setStoreSettings({
              storeName: data.data.storeName || user?.store?.name || '',
              address: data.data.address || user?.store?.address || '',
              phone: data.data.phone || user?.store?.phone || '',
              taxRatePercent: data.data.taxRatePercent !== undefined ? data.data.taxRatePercent : 5,
              receiptFooter: data.data.receiptFooter || 'Thank you for shopping with us! Visit again.',
              lowStockThresholdGlobal: data.data.lowStockThresholdGlobal || 5,
            });
          }
        } catch (err) {
          console.error('Failed to load settings:', err);
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchStoreSettings();
    }
  }, [isStoreAdmin, activeTab, user]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirmation do not match');
    }

    setIsUpdatingPassword(true);
    try {
      const { data } = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      toast.success(data.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { data } = await api.put('/settings', storeSettings);
      toast.success('Store tax and receipt settings updated!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1B3A] tracking-tight">Profile & Store Settings</h1>
          <p className="text-xs sm:text-sm text-[#8B96AB]">
            Manage your account security, credentials, and supermarket billing parameters
          </p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Sidebar Menu */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-4 lg:col-span-3 space-y-4"
        >
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col items-center p-3 border-b border-[#E3E8F0] mb-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-extrabold text-2xl shadow-xs mb-3">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="font-extrabold text-base text-[#0B1B3A]">{user?.name || 'Staff User'}</h3>
              <p className="text-xs text-[#8B96AB] truncate max-w-[180px]">{user?.email}</p>
              
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#0FA38F] bg-[#E2F6F3] px-2.5 py-1 rounded-lg mt-2 uppercase tracking-wider">
                <Shield size={12} />
                <span>{(user?.role || '').replace('_', ' ')}</span>
              </div>
            </div>
            
            <nav className="space-y-1">
              {[
                { id: 'general', label: 'My Account', icon: User },
                { id: 'security', label: 'Security & Password', icon: Lock },
                ...(isStoreAdmin ? [{ id: 'store', label: 'Store & GST Settings', icon: StoreIcon }] : []),
                { id: 'preferences', label: 'Preferences', icon: SettingsIcon }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-bold text-xs sm:text-sm ${
                      isSelected 
                        ? 'bg-[#0FA38F] text-white shadow-[0_2px_8px_rgba(15,163,143,0.3)]' 
                        : 'text-[#53607A] hover:text-[#0B1B3A] hover:bg-[#F4F7FB]'
                    }`}
                  >
                    <Icon size={16} /> 
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FEE2E2]/60 text-[#E5484D] font-bold text-xs border border-[#FCA5A5]/40 hover:bg-[#FEE2E2] transition-colors"
          >
            <LogOut size={16} /> 
            <span>Log Out</span>
          </button>
        </motion.div>

        {/* Right Content Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-8 lg:col-span-9"
        >
          {/* TAB 1: General Account Information */}
          {activeTab === 'general' && (
            <div className="bg-white border border-[#E3E8F0] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0B1B3A]">Personal Information</h2>
                <p className="text-xs text-[#8B96AB]">Your registered user profile details</p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="text" 
                      readOnly 
                      value={user?.name || ''} 
                      className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none cursor-default" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="email" 
                      readOnly 
                      value={user?.email || ''} 
                      className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none cursor-default" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Assigned Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="text" 
                      readOnly 
                      value={(user?.role || '').replace('_', ' ').toUpperCase()} 
                      className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0FA38F] outline-none cursor-default" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Change Password & Security */}
          {activeTab === 'security' && (
            <div className="bg-white border border-[#E3E8F0] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0B1B3A]">Change Password</h2>
                <p className="text-xs text-[#8B96AB]">Ensure your account uses a secure password (minimum 8 characters)</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="password" 
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs transition-all shadow-[0_2px_8px_rgba(15,163,143,0.3)] disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Store & GST Settings (Store Admin Only) */}
          {activeTab === 'store' && isStoreAdmin && (
            <div className="bg-white border border-[#E3E8F0] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0B1B3A]">Supermarket & GST Configuration</h2>
                <p className="text-xs text-[#8B96AB]">
                  Set your store tax rate (GST %), thermal receipt footer, and low-stock alerting
                </p>
              </div>

              {loadingSettings ? (
                <div className="py-12 text-center text-[#8B96AB]">Loading store settings...</div>
              ) : (
                <form onSubmit={handleSaveStoreSettings} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Supermarket Name</label>
                    <input 
                      type="text" 
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Store Address</label>
                    <input 
                      type="text" 
                      value={storeSettings.address}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">Contact Phone</label>
                    <input 
                      type="text" 
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                        GST Tax Rate (%)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="0"
                          max="28"
                          step="0.5"
                          value={storeSettings.taxRatePercent}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, taxRatePercent: Number(e.target.value) }))}
                          className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B96AB]">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                        Low Stock Alert Qty
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        value={storeSettings.lowStockThresholdGlobal}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, lowStockThresholdGlobal: Number(e.target.value) }))}
                        className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                      Thermal Receipt Footer Note
                    </label>
                    <input 
                      type="text" 
                      value={storeSettings.receiptFooter}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                      placeholder="Thank you for shopping with us! Visit again."
                      className="w-full bg-white border border-[#E3E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="px-5 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs transition-all shadow-[0_2px_8px_rgba(15,163,143,0.3)] disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Store Configuration'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: Preferences */}
          {activeTab === 'preferences' && (
            <div className="bg-white border border-[#E3E8F0] rounded-[22px] p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl font-black text-[#0B1B3A]">System Preferences</h2>
              <p className="text-xs text-[#53607A] leading-relaxed">
                StoreFlow automatically synchronizes your keyboard shortcuts, offline data caches, and UI layout settings.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
