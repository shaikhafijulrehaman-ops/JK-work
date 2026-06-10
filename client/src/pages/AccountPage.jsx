import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, User as UserIcon, LogOut, 
  MapPin, Heart, ShieldQuestion, Star, Settings, FileText, Bell,
  Sparkles, CheckCircle2, AlertCircle, PhoneCall, Compass, Home,
  Gift, CreditCard, Award, ChevronDown, Check, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountPage() {
  const { user, logout, fetchAddresses } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const navigate = useNavigate();

  // Redirect guard for Service Partners
  useEffect(() => {
    if (user && user.role === 'WORKER') {
      navigate('/worker/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Load real user bookings on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const [activeSubView, setActiveSubView] = useState('menu'); // 'menu', 'coupons', 'payments', 'favorites', 'reviews'
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('jk_customer_favorites');
    return saved ? JSON.parse(saved) : ['Baby Care', 'Bathroom Deep Cleaning'];
  });

  const handleRemoveFavorite = (name) => {
    const updated = favorites.filter(f => f !== name);
    setFavorites(updated);
    localStorage.setItem('jk_customer_favorites', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filter bookings for this customer
  const userBookings = bookings.filter(b => b.userId === user?.id || !b.userId); // sandbox safety fallback
  const upcomingBookings = userBookings.filter(b => ['PENDING', 'ASSIGNED', 'ARRIVED'].includes(b.status));
  const completedBookings = userBookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = userBookings.filter(b => b.status === 'CANCELLED');

  // Completed bookings requiring rating / review
  const reviewsPending = completedBookings.filter(b => !b.review);

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-24 text-slate-800 relative">
      {/* Dynamic Sub-view Sticky Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {activeSubView !== 'menu' && (
              <button 
                onClick={() => setActiveSubView('menu')}
                className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-2 border border-slate-100/60"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-poppins font-black text-lg text-slate-900">
              {activeSubView === 'menu' && 'My Account'}
              {activeSubView === 'coupons' && 'Coupons & Offers'}
              {activeSubView === 'payments' && 'Payments & Invoices'}
              {activeSubView === 'favorites' && 'Favourite Services'}
              {activeSubView === 'reviews' && 'Ratings & Reviews'}
            </h1>
          </div>
          {activeSubView === 'menu' && (
            <button 
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-700 font-poppins font-black text-xs uppercase tracking-wider bg-rose-50 hover:bg-rose-100/50 px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* MAIN ACCOUNT VIEW */}
          {/* ========================================================= */}
          {activeSubView === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Premium Urban Company Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center space-x-4 text-left relative z-10">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-brand/20 shadow-inner">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-poppins font-black text-base text-slate-900 leading-tight">{user?.name || 'Customer Profile'}</span>
                    <span className="text-xs font-bold text-slate-400 mt-1">{user?.email}</span>
                    <span className="text-xs font-bold text-slate-500 mt-0.5">+91 {user?.phone || '99999 99999'}</span>
                    
                    {user?.serviceArea && (
                      <span className="inline-flex items-center text-[9px] font-extrabold text-brand uppercase tracking-wider mt-2.5 bg-cyan-50 border border-brand/15 px-2 py-0.5 rounded-md w-max">
                        <Compass className="w-3 h-3 mr-1 animate-spin text-brand" /> {user.serviceArea} ({user.pincode})
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/account/profile')}
                  className="text-brand font-poppins font-bold text-xs uppercase tracking-wider border border-brand/20 bg-white hover:bg-cyan-50/50 px-4 py-2 rounded-xl transition-all shadow-xs relative z-10"
                >
                  Edit
                </button>
              </div>

              {/* Bookings Status Quick Counter */}
              <div className="grid grid-cols-3 gap-3 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center">
                <Link to="/account/bookings" className="hover:bg-slate-50/80 p-2.5 rounded-2xl transition-all">
                  <span className="font-poppins font-black text-xl text-brand block">{upcomingBookings.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Upcoming</span>
                </Link>
                <Link to="/account/bookings" className="hover:bg-slate-50/80 p-2.5 rounded-2xl transition-all border-x border-slate-100">
                  <span className="font-poppins font-black text-xl text-emerald-600 block">{completedBookings.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Completed</span>
                </Link>
                <Link to="/account/bookings" className="hover:bg-slate-50/80 p-2.5 rounded-2xl transition-all">
                  <span className="font-poppins font-black text-xl text-rose-500 block">{cancelledBookings.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Cancelled</span>
                </Link>
              </div>

              {/* Premium Customer Navigation Link Items */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left divide-y divide-slate-100">
                
                {/* 1. My Bookings */}
                <Link to="/account/bookings" className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left">
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">My Bookings</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Track, modify and reschedule jobs</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </Link>

                {/* 2. Saved Addresses */}
                <Link to="/account/addresses" className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left">
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Saved Addresses</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Manage locations for instant dispatch</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </Link>

                {/* 3. Notifications */}
                <Link to="/account/notifications" className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left">
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Notifications</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Alerts, updates and tracking briefs</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </Link>

                {/* 4. Ratings & Reviews */}
                <button 
                  onClick={() => setActiveSubView('reviews')} 
                  className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left border-none bg-transparent"
                >
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <Star className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight inline-flex items-center">
                      Ratings & Reviews
                      {reviewsPending.length > 0 && (
                        <span className="ml-2 bg-amber-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                          {reviewsPending.length}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                      {reviewsPending.length > 0 ? `${reviewsPending.length} pending reviews left` : 'Share service partner feedback'}
                    </span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </button>

                {/* 5. Coupons & Offers */}
                <button 
                  onClick={() => setActiveSubView('coupons')} 
                  className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left border-none bg-transparent"
                >
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Coupons & Offers</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Active promo codes and discount vouchers</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </button>

                {/* 6. Payments & Invoices */}
                <button 
                  onClick={() => setActiveSubView('payments')} 
                  className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left border-none bg-transparent"
                >
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Payments & Invoices</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Billing logs, transactional receipts, and taxes</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </button>

                {/* 7. Favourite Services */}
                <button 
                  onClick={() => setActiveSubView('favorites')} 
                  className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left border-none bg-transparent"
                >
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Favourite Services</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Bookmarked cleaning & utility jobs</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </button>

                {/* 8. Help Center */}
                <Link to="/account/help" className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-slate-100/60 text-left">
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <ShieldQuestion className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Help Center</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">24/7 client care support and dispute resolution</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </Link>

                {/* 9. Settings */}
                <Link to="/account/settings" className="h-[76px] px-[20px] flex items-center w-full hover:bg-[#F8FAFC] cursor-pointer transition-colors text-left border-none">
                  <div className="w-[64px] flex-shrink-0 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                    <span className="font-poppins font-semibold text-sm text-slate-800 leading-tight block">Settings</span>
                    <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">Onboarding checks, notifications and account logs</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </Link>

              </div>

              {/* Version & copyright footer info */}
              <div className="text-center py-6 select-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">JK Enterprises Marketplace</span>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SUB-VIEW 1: COUPONS & OFFERS */}
          {/* ========================================================= */}
          {activeSubView === 'coupons' && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {[
                { code: 'WELCOME50', type: 'FLAT discount', val: 'Rs. 50 OFF', desc: 'Applicable on first order above Rs. 200.', status: 'Active' },
                { code: 'WELCOME10', type: 'PERCENTAGE discount', val: '10% OFF', desc: 'Up to Rs. 100 on kitchen sanitation packages.', status: 'Active' },
                { code: '9MINUTES', type: 'FLASH sale', val: 'Rs. 99 OFF', desc: 'Fuzzy superfast Anchepalya deep disinfection.', status: 'Flash Offer' }
              ].map((c, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden text-left flex justify-between items-center group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand" />
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-xs bg-cyan-50 border border-brand/20 text-brand px-3 py-1 rounded-lg tracking-wider block uppercase">{c.code}</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">{c.status}</span>
                    </div>
                    <span className="font-poppins font-black text-sm text-slate-900 block mt-2">{c.val}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">{c.desc}</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      alert(`📋 Code "${c.code}" copied to clipboard!`);
                    }}
                    className="bg-brand/10 hover:bg-brand/20 text-brand font-poppins font-black text-[9px] uppercase px-3 py-2 rounded-lg tracking-wider"
                  >
                    Copy Code
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SUB-VIEW 2: PAYMENTS & INVOICES */}
          {/* ========================================================= */}
          {activeSubView === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-4">Ref ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Billing Service</th>
                        <th className="p-4">Method</th>
                        <th className="p-4 text-right">Invoice Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {userBookings.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-brand uppercase">{b.id.substring(0,8)}</td>
                          <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-slate-800">{b.items?.[0]?.service?.name || 'Home Disinfection'}</td>
                          <td className="p-4 font-mono">{b.paymentMethod || 'UPI'}</td>
                          <td className="p-4 text-right font-bold text-slate-900">Rs. {b.finalPrice}</td>
                        </tr>
                      ))}
                      {userBookings.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No payment invoices registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SUB-VIEW 3: FAVOURITE SERVICES */}
          {/* ========================================================= */}
          {activeSubView === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {favorites.map((fav, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex justify-between items-center text-left">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h4 className="font-poppins font-black text-xs text-slate-900 block">{fav}</h4>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Home Utility</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate('/services')} 
                      className="bg-brand text-white font-poppins font-black text-[9px] uppercase px-3.5 py-2 rounded-lg tracking-wider hover:opacity-90 transition-all shadow-xs"
                    >
                      Book Now
                    </button>
                    <button 
                      onClick={() => handleRemoveFavorite(fav)} 
                      className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 font-poppins font-black text-[9px] uppercase px-2.5 py-2 rounded-lg transition-colors border"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="text-center py-12 space-y-3 bg-white border border-slate-200/80 rounded-3xl shadow-xs max-w-sm mx-auto">
                  <Heart className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No bookmarked services found.</p>
                  <button 
                    onClick={() => navigate('/services')} 
                    className="bg-brand text-white font-poppins font-black text-[9px] uppercase px-4 py-2.5 rounded-xl mt-2 tracking-wider"
                  >
                    Browse Catalog
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SUB-VIEW 4: RATINGS & REVIEWS */}
          {/* ========================================================= */}
          {activeSubView === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {completedBookings.map((b, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden text-left space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-poppins font-black text-xs text-slate-900 block">{b.items?.[0]?.service?.name || 'Utility Service'}</h4>
                      <span className="text-[8.5px] text-slate-400 font-mono font-bold block mt-0.5">RefID: #{b.id.substring(0,8)} • completed {new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    {b.worker && (
                      <span className="bg-slate-100 text-slate-500 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Partner: {b.worker.user?.name}
                      </span>
                    )}
                  </div>
                  {b.review ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, idx) => (
                          <Star 
                            key={idx} 
                            className={`w-3.5 h-3.5 ${idx < b.review.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic bg-slate-50 border p-2.5 rounded-xl">
                        "{b.review.comment || 'No textual feedback supplied.'}"
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 flex justify-between items-center bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold block">Review submission pending</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Share feedback to improve service quality standards</span>
                      </div>
                      <Link 
                        to="/account/bookings" 
                        className="bg-amber-500 text-white font-poppins font-black text-[9px] uppercase px-3.5 py-2 rounded-lg tracking-wider"
                      >
                        Submit Rating
                      </Link>
                    </div>
                  )}
                </div>
              ))}
              {completedBookings.length === 0 && (
                <div className="text-center py-12 space-y-3 bg-white border border-slate-200/80 rounded-3xl shadow-xs max-w-sm mx-auto">
                  <Star className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No completed bookings found to review.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
