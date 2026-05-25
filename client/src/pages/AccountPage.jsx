import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, User as UserIcon, LogOut, 
  MapPin, Heart, ShieldQuestion, Star, Settings, FileText, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const menuItems = [
    { title: 'My Bookings', icon: <FileText className="w-5 h-5 text-slate-700" />, path: '/dashboard' },
    { title: 'Manage Addresses', icon: <MapPin className="w-5 h-5 text-slate-700" />, path: '/account/addresses' },
    { title: 'Notifications', icon: <Bell className="w-5 h-5 text-slate-700" />, path: '/notifications' },
    { title: 'My Plans', icon: <Heart className="w-5 h-5 text-slate-700" />, path: '/account/plans' },
    { title: 'Ratings & Reviews', icon: <Star className="w-5 h-5 text-slate-700" />, path: '/account/reviews' },
    { title: 'Help Center', icon: <ShieldQuestion className="w-5 h-5 text-slate-700" />, path: '/help' },
    { title: 'Settings', icon: <Settings className="w-5 h-5 text-slate-700" />, path: '/account/settings' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 font-inter pb-24"
    >
      {/* Header */}
      <div className="bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-poppins font-bold text-xl text-slate-800">Account</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white px-6 py-8 mb-2 flex items-center justify-between border-b border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-brand/20">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-poppins font-bold text-xl text-slate-800">{user?.name || 'User'}</span>
              <span className="text-sm font-medium text-slate-500">{user?.phone || '+91 99999 99999'}</span>
              <span className="text-[10px] font-bold text-brand uppercase mt-1 tracking-wider">{user?.role} ACCOUNT</span>
            </div>
          </div>
          <button className="text-brand font-semibold text-sm hover:underline">
            Edit
          </button>
        </div>

        {/* Menu Items */}
        <div className="bg-white border-y border-slate-100">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-100 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all text-slate-700">
                  {item.icon}
                </div>
                <span className="font-semibold text-slate-700">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors" />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white px-6 py-5 mt-2 flex items-center justify-between hover:bg-red-50/50 transition-colors group border-y border-slate-100 text-red-500"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-red-50 group-hover:bg-white group-hover:shadow-sm transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold">Logout</span>
          </div>
        </button>

        {/* Footer info */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JK Enterprises Marketplace</p>
          <p className="text-[10px] text-slate-400">Version 2.0.0 • Made with ❤️ in Bengaluru</p>
        </div>

      </div>
    </motion.div>
  );
}
