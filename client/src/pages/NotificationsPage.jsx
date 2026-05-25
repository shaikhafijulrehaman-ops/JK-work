import React from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CheckCircle, Clock, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const { notifications, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING_UPDATE': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'WORKER_ASSIGNED': return <ShieldCheck className="w-5 h-5 text-brand" />;
      case 'ADMIN_UPDATE': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'PAYMENT': return <Info className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-brand" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 font-inter"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-poppins font-bold text-lg text-slate-800">Notifications</h1>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-brand font-poppins font-black border border-brand/20">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto p-4 space-y-3 pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-poppins font-bold text-slate-700 text-lg">No Notifications</h3>
            <p className="text-sm text-slate-500 mt-2">You're all caught up! We'll notify you when something happens.</p>
          </div>
        ) : (
          notifications.map((notif, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              onClick={() => !notif.isRead && markAsRead(notif.id)}
              className={`relative bg-white rounded-2xl p-4 cursor-pointer transition-all ${
                notif.isRead 
                  ? 'border border-slate-100 shadow-sm' 
                  : 'border border-brand/20 shadow-md shadow-brand/5'
              }`}
            >
              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand animate-pulse"></div>
              )}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-slate-50' : 'bg-brand/5'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 pr-4">
                  <h4 className={`text-sm font-semibold mb-1 ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center space-x-1 mt-3">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
