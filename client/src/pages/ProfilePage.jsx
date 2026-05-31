import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, User, Phone, Mail, MapPin, Compass,
  Sparkles, CheckCircle2, AlertCircle, PhoneCall, Home, Shield,
  Settings, HelpCircle, Bell, FileText, ArrowRight, LogOut, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout, fetchAddresses, addAddress } = useAuthStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [altMobile, setAltMobile] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => navigate('/account');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const loadAddresses = async () => {
    const data = await fetchAddresses();
    setAddresses(data || []);
    
    if (data && data.length > 0) {
      const def = data.find(a => a.isDefault) || data[0];
      setHouseFlat(def.houseFlat || '');
      setStreet(def.street || '');
      setLandmark(def.landmark ? def.landmark.replace(' (Work)', '').replace(' (Other)', '') : '');
      setAltMobile(def.altMobile || '');
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Compute profile completion percentage
  const hasName = !!user?.name;
  const hasPhone = !!user?.phone;
  const hasEmail = !!user?.email && !user?.email.includes('@jkenterprises.com');
  const hasPincode = !!user?.pincode;
  const hasServiceArea = !!user?.serviceArea;
  const hasAltMobile = !!altMobile;
  const hasAddress = addresses.length > 0;

  let completionScore = 0;
  if (hasName) completionScore += 15;
  if (hasPhone) completionScore += 15;
  if (hasEmail) completionScore += 10;
  if (hasPincode) completionScore += 15;
  if (hasServiceArea) completionScore += 15;
  if (hasAltMobile) completionScore += 15;
  if (hasAddress) completionScore += 15;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!houseFlat.trim() || !street.trim()) {
      setErrorMsg('Please enter both House/Flat number and Street address.');
      setLoading(false);
      return;
    }

    const payload = {
      houseFlat: houseFlat.trim(),
      street: street.trim(),
      landmark: landmark.trim() || null,
      altMobile: altMobile.trim() || null,
      isDefault: true
    };

    const res = await addAddress(payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Profile completed successfully! 🌟');
      loadAddresses();
      setTimeout(() => {
        setSuccessMsg('');
        setShowEditModal(false);
      }, 1500);
    } else {
      setErrorMsg(res.message || 'Failed to update profile details.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-24 text-slate-800 relative">
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-3 border border-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-poppins font-black text-lg text-slate-900">My Profile</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600 font-poppins font-black text-xs uppercase tracking-wider bg-red-50 hover:bg-red-100/50 px-3.5 py-2 rounded-xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Card Header Component */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="relative group cursor-pointer mb-4">
            <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-md flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-brand/10 group-hover:ring-brand/40 transition-all">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-brand text-white rounded-full shadow border-2 border-white">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="font-poppins font-black text-xl text-slate-950">{user?.name || 'Customer'}</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">{user?.email}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">+91 {user?.phone}</p>

          {user?.serviceArea && (
            <span className="inline-flex items-center text-[10px] font-extrabold text-brand-dark uppercase tracking-wider mt-3 bg-cyan-50 border border-brand/15 px-3 py-1 rounded-xl shadow-xs">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-brand animate-spin" /> {user.serviceArea} ({user.pincode})
            </span>
          )}
        </div>

        {/* Profile Completion Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand animate-pulse" />
              <h3 className="font-poppins font-black text-sm text-slate-950">Profile Completion</h3>
            </div>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              completionScore === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
            }`}>
              {completionScore}% Verified
            </span>
          </div>

          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-100/50">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${completionScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {completionScore < 100 ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Add an alternate contact number and primary address to unlock full-page fast checkout.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 select-none">
                {!hasAltMobile && (
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/50 p-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Missing Alternate Mobile</span>
                  </div>
                )}
                {!hasAddress && (
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/50 p-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>No Saved Address Registered</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3 rounded-xl shadow-md transition-all uppercase tracking-widest mt-2"
              >
                Complete Your Profile
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-2.5 shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-[10.5px] text-emerald-800 font-extrabold uppercase tracking-wide">
                Verified customer profile status active!
              </span>
            </div>
          )}
        </div>

        {/* Section: Personal Information */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-4">
          <h3 className="font-poppins font-black text-sm text-slate-950 pb-2 border-b border-slate-50 uppercase tracking-wider text-brand">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
              <p className="text-xs text-slate-800 font-extrabold">{user?.name || 'Not Provided'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
              <p className="text-xs text-slate-800 font-extrabold">+91 {user?.phone || 'Not Provided'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
              <p className="text-xs text-slate-800 font-extrabold">{user?.email || 'Not Provided'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alternate Mobile</span>
              <p className="text-xs text-slate-800 font-extrabold">{altMobile ? `+91 ${altMobile}` : 'Not Provided'}</p>
            </div>
          </div>
        </div>

        {/* Section: Address Management Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-poppins font-black text-sm text-slate-950 uppercase tracking-wider text-brand">
              Address Details
            </h3>
            <Link to="/account/addresses" className="text-xs font-black text-brand uppercase hover:underline">
              Manage Address
            </Link>
          </div>
          {addresses.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No saved addresses.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-start space-x-3 text-xs bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <Home className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                <div className="space-y-1 pr-2">
                  <span className="font-bold text-slate-800 block">Primary Home Address</span>
                  <p className="text-slate-500 font-semibold leading-relaxed">
                    {houseFlat}, {street}
                  </p>
                  {landmark && <p className="text-[10.5px] text-slate-400 font-bold">Landmark: {landmark}</p>}
                  <p className="text-[10.5px] text-slate-400 font-bold">Pincode: {user?.pincode} • Area: {user?.serviceArea}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid Sections: Secondary Options */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left divide-y divide-slate-100">
          <Link to="/account/bookings" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
              <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">My Bookings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
          </Link>
          <Link to="/account/addresses" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
              <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">Saved Addresses</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
          </Link>
          <Link to="/account/notifications" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
              <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">Notifications</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
          </Link>
          <Link to="/account/settings" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
              <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">Settings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
          </Link>
          <Link to="/account/help" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
              <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">Help Center</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>

      {/* Edit Details Glassmorphic dialog modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-md w-full text-left"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <h3 className="font-poppins font-extrabold text-base text-slate-900">
                    Complete Profile Information
                  </h3>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 border text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-semibold animate-transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="form-group">
                  <input 
                    type="tel" 
                    maxLength={10}
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Alternate Mobile Number" 
                    value={altMobile} 
                    onChange={e => setAltMobile(e.target.value.replace(/\D/g, ''))} 
                    required
                  />
                  <label className="form-label flex items-center space-x-1">
                    <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Alternate Mobile Number
                  </label>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="House / Flat / Block No." 
                    value={houseFlat} 
                    onChange={e => setHouseFlat(e.target.value)} 
                    required 
                  />
                  <label className="form-label flex items-center space-x-1">
                    <Home className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> House / Flat / Block No.
                  </label>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Street Address" 
                    value={street} 
                    onChange={e => setStreet(e.target.value)} 
                    required 
                  />
                  <label className="form-label flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Street Address
                  </label>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Landmark / Alt Details" 
                    value={landmark} 
                    onChange={e => setLandmark(e.target.value)} 
                  />
                  <label className="form-label flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Landmark / Alt Details
                  </label>
                </div>

                {successMsg && (
                  <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center space-x-1.5 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-3 border-t">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-poppins font-black text-xs rounded-xl uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3 rounded-xl uppercase tracking-widest shadow-md animate-transition"
                  >
                    {loading ? 'Saving...' : 'Save details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
