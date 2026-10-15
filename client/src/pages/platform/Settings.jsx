import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Calendar,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { accentColor } = useOutletContext() || {};
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setUpdating(true);
      const res = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
          Platform Admin Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
          View platform administrator credentials, security access levels, and manage authentication passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
              <div
                style={{ backgroundColor: accentColor || '#0FA38F' }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-xs"
              >
                SA
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#0B1B3A]">
                  {user?.name || 'Platform Super Administrator'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0FA38F] uppercase tracking-wider">
                  <ShieldCheck size={13} /> {user?.role || 'PLATFORM_SUPER_ADMIN'}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                <span className="text-[#8B96AB] font-bold uppercase block text-[10px]">
                  Administrator Email
                </span>
                <span className="font-bold text-[#0B1B3A] mt-0.5 flex items-center gap-1.5 text-sm">
                  <Mail size={14} className="text-[#8B96AB]" />
                  {user?.email || 'admin@storeflow.com'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                <span className="text-[#8B96AB] font-bold uppercase block text-[10px]">
                  System Access Scope
                </span>
                <span className="font-bold text-[#0B1B3A] mt-0.5 block">
                  All Supermarket Tenants & Global Schemas
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                <span className="text-[#8B96AB] font-bold uppercase block text-[10px]">
                  Platform Security Status
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-extrabold text-[#0FA38F]">
                  <CheckCircle2 size={14} />
                  <span>Two-Factor Authentication Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F1F5F9] text-xs text-[#8B96AB]">
            StoreFlow Multi-Tenant Cloud Architecture v2.0
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E3E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <KeyRound size={18} style={{ color: accentColor || '#0FA38F' }} />
              <h3 className="font-extrabold text-base text-[#0B1B3A]">Security & Password</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs text-[#8B96AB] hover:text-[#0B1B3A] flex items-center gap-1 cursor-pointer"
            >
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPasswords ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0B1B3A] mb-1.5 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1B3A] mb-1.5 uppercase tracking-wider">
                New Password (Min 8 characters)
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1B3A] mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              style={{ backgroundColor: accentColor || '#0FA38F' }}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{updating ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
