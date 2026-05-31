import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Bell, CheckCircle, Clock, Info, 
  ShieldCheck, AlertCircle, Sparkles, Megaphone, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton Loader Card for sleek background load
const SkeletonCard = () => (
  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs animate-pulse flex items-start space-x-4">
    <div className="w-11 h-11 rounded-full bg-slate-100 flex-shrink-0 animate-pulse" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
      <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
      <div className="h-2.5 bg-slate-100 rounded w-1/4 animate-pulse" />
    </div>
  </div>
);

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAsRead, loading } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, BOOKING, OFFERS, SYSTEM

  // Handle background notifications fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING_ALERT':
      case 'BOOKING_UPDATE': 
        return <ShieldCheck className="w-5 h-5 text-brand" />;
      case 'WORKER_ASSIGNMENT':
      case 'WORKER_ASSIGNED': 
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT': 
        return <Info className="w-5 h-5 text-purple-500" />;
      case 'ADMIN_UPDATE': 
      case 'SYSTEM_ALERT': 
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'OFFERS':
      case 'PROMO':
        return <Tag className="w-5 h-5 text-cyan-500" />;
      default: 
        return <Bell className="w-5 h-5 text-brand" />;
    }
  };

  // Filter notifications based on tab selection
  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'BOOKING') return n.type === 'BOOKING_ALERT' || n.type === 'BOOKING_UPDATE' || n.type === 'WORKER_ASSIGNMENT' || n.type === 'WORKER_ASSIGNED';
    if (activeTab === 'OFFERS') return n.type === 'OFFERS' || n.type === 'PROMO';
    if (activeTab === 'SYSTEM') return n.type === 'SYSTEM_ALERT' || n.type === 'ADMIN_UPDATE';
    return true;
  });

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
            <h1 className="font-poppins font-black text-lg text-slate-900">Notifications</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-brand/10 select-none">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-black font-poppins">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Category Tabs */}
        <div className="flex border-b border-slate-200 mb-2 bg-white p-1 rounded-2xl border shadow-sm select-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'BOOKING', label: 'Bookings' },
            { id: 'OFFERS', label: 'Offers' },
            { id: 'SYSTEM', label: 'System' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-center py-2 rounded-xl text-xs font-poppins font-extrabold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              // Display sleek skeletons while loading
              <motion.div 
                key="skeletons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </motion.div>
            ) : filteredNotifs.length === 0 ? (
              // Display beautiful empty state fallback
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                  <Bell className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="font-poppins font-extrabold text-base text-slate-800 mb-1">No Notifications Available</h3>
                <p className="text-xs text-slate-400 leading-normal max-w-[280px] mx-auto">
                  You're all caught up! Doorstep alerts will appear here when they dispatch.
                </p>
              </motion.div>
            ) : (
              // Render list cards cleanly
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3.5 text-left"
              >
                {filteredNotifs.map((notif, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`relative bg-white rounded-2xl p-4.5 border transition-all cursor-pointer ${
                      notif.isRead 
                        ? 'border-slate-200/60 shadow-xs' 
                        : 'border-brand/30 shadow-md shadow-brand/5 bg-brand/5'
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-full flex-shrink-0 border ${notif.isRead ? 'bg-slate-50 border-slate-100' : 'bg-white border-brand/20'}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 pr-4">
                        <h4 className={`text-xs font-black mb-1.5 uppercase tracking-wider ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-3 select-none">
                          <Clock className="w-3.5 h-3.5 text-slate-350" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
