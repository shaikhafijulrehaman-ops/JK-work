import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Settings, Shield, Bell, CreditCard, Key, 
  Trash2, Globe, Eye, User, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [notifSound, setNotifSound] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [themeMode, setThemeMode] = useState('light'); // light, dark, system
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => navigate('/account');

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessToast('');

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Confirm password does not match.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      setSuccessToast('Password updated successfully! 🔐');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessToast(''), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-24 text-slate-800 relative">
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={handleBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-3 border border-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-poppins font-black text-lg text-slate-900">App Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Settings options grid */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <Bell className="w-5 h-5 text-brand" />
            <h3 className="font-poppins font-black text-sm text-slate-950">Notification Controls</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Audible SMS Dispatch Alerts</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Dispatches play notification sounds</span>
              </div>
              <input 
                type="checkbox" 
                className="rounded border-slate-350 text-brand focus:ring-brand w-5 h-5 cursor-pointer" 
                checked={notifSound}
                onChange={e => setNotifSound(e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Marketing & Promo Codes</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Offers and Platform discount updates</span>
              </div>
              <input 
                type="checkbox" 
                className="rounded border-slate-350 text-brand focus:ring-brand w-5 h-5 cursor-pointer" 
                checked={notifOffers}
                onChange={e => setNotifOffers(e.target.checked)}
              />
            </label>
          </div>
        </div>

        {/* Invoice and card security */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <CreditCard className="w-5 h-5 text-brand" />
            <h3 className="font-poppins font-black text-sm text-slate-950">Payment Settings</h3>
          </div>

          <div className="flex items-center justify-between cursor-pointer select-none">
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">1-Tap Fast Checkout Mode</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Encrypts local verified token session</span>
            </div>
            <input 
              type="checkbox" 
              className="rounded border-slate-350 text-brand focus:ring-brand w-5 h-5 cursor-pointer" 
              checked={paymentSaved}
              onChange={e => setPaymentSaved(e.target.checked)}
            />
          </div>
        </div>

        {/* Change password component */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <Key className="w-5 h-5 text-brand" />
            <h3 className="font-poppins font-black text-sm text-slate-950 font-extrabold">Change Secure Password</h3>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="form-group">
              <input 
                type="password" 
                className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                placeholder="Current Password" 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                required 
              />
              <label className="form-label">Current Password</label>
            </div>

            <div className="form-group">
              <input 
                type="password" 
                className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                placeholder="New Password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
              />
              <label className="form-label">New Password (Min 8 chars)</label>
            </div>

            <div className="form-group">
              <input 
                type="password" 
                className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
              <label className="form-label">Confirm Password</label>
            </div>

            {successToast && (
              <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center space-x-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{successToast}</span>
              </div>
            )}

            {errorMsg && (
              <div className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3 rounded-xl uppercase tracking-widest shadow-md transition-all cursor-pointer"
            >
              {loading ? 'Validating...' : 'Update Password Credentials'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
