import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Clock, MapPin, Phone, CreditCard, Calendar, 
  CheckCircle, Truck, Activity, Star, ShieldCheck, Smartphone, 
  ChevronRight, Sparkles, FileText, AlertCircle, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingsPage() {
  const { bookings, fetchBookings, updateJobStatus, submitReview, simulatePayment } = useBookingStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Live map routing countdown variables
  const [mapPercentage, setMapPercentage] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(540); // 9 minutes = 540s

  const handleBack = () => navigate('/account');

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update selected booking references dynamically when lists sync
  useEffect(() => {
    if (selectedBooking) {
      const fresh = bookings.find(b => b.id === selectedBooking.id);
      if (fresh) setSelectedBooking(fresh);
    } else if (bookings.length > 0) {
      setSelectedBooking(bookings[bookings.length - 1]);
    }
  }, [bookings]);

  // Handle mock GPS worker routing animations
  useEffect(() => {
    let interval = null;
    if (selectedBooking && selectedBooking.status === 'ON_THE_WAY') {
      interval = setInterval(() => {
        setMapPercentage((prev) => {
          if (prev >= 100) {
            updateJobStatus(selectedBooking.id, 'IN_PROGRESS');
            addNotification('Service Call Started!', 'Your professional has arrived at your doorstep and started the job.');
            return 0;
          }
          return prev + 1;
        });
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 540));
      }, 1000);
    } else {
      setMapPercentage(0);
      setSecondsLeft(540);
    }
    return () => clearInterval(interval);
  }, [selectedBooking]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const ok = await submitReview(selectedBooking.id, rating, comment);
    if (ok) {
      setReviewSubmitted(true);
      addNotification('Review Submitted', 'Thank you for grading your service worker!');
      setTimeout(() => {
        setReviewSubmitted(false);
        setComment('');
      }, 3000);
    }
  };

  const getTimelineSteps = (status) => {
    return [
      { name: 'Pending', active: true, done: ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(status) },
      { name: 'Assigned', active: ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(status), done: ['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(status) },
      { name: 'On The Way', active: ['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(status), done: ['IN_PROGRESS', 'COMPLETED'].includes(status) },
      { name: 'In Progress', active: ['IN_PROGRESS', 'COMPLETED'].includes(status), done: status === 'COMPLETED' },
      { name: 'Completed', active: status === 'COMPLETED', done: status === 'COMPLETED' }
    ];
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const ss = secs % 60;
    return `${mins}:${ss < 10 ? '0' : ''}${ss}`;
  };

  // Filter bookings based on selected status tabs
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return ['PENDING', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(b.status);
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen font-inter pb-24 text-slate-800 relative">
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-3 border border-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-poppins font-black text-lg text-slate-900">My Bookings</h1>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl border">
            Total Orders: {bookings.length}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Booking Category Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white p-1 rounded-2xl border shadow-sm max-w-md select-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedBooking(null); // Reset selection to trigger auto select on filter change
              }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-poppins font-extrabold transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <h3 className="font-poppins font-black text-base text-slate-800">No Bookings Found</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                You don't have any orders listed in this category right now.
              </p>
            </div>
            <button 
              onClick={() => navigate('/services')}
              className="bg-slate-950 hover:bg-slate-800 text-white font-poppins font-black text-xs px-6 py-3 rounded-xl shadow-md transition-colors uppercase tracking-widest"
            >
              Browse home services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* List of bookings */}
            <div className="lg:col-span-1 space-y-3.5">
              <h2 className="font-poppins font-black text-[10px] text-slate-400 uppercase tracking-widest text-left mb-1 pl-1">
                Order History ({filteredBookings.length})
              </h2>
              
              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`bg-white border p-4.5 rounded-2xl shadow-xs cursor-pointer transition-all duration-300 ${
                      selectedBooking && selectedBooking.id === b.id 
                        ? 'border-brand ring-2 ring-brand/10 bg-brand/5' 
                        : 'border-slate-200/60 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 leading-none">
                        #{b.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md leading-none ${
                        b.status === 'COMPLETED' ? 'bg-cyan-100 text-cyan-700' :
                        b.status === 'PENDING' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-brand/10 text-brand'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-black text-slate-800 truncate mb-1 text-left">
                      {b.items && b.items.length > 0 ? b.items[0].service.name : 'Cleaning Service'}
                      {b.items && b.items.length > 1 && ` + ${b.items.length - 1} other`}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center mb-2.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-300" /> {new Date(b.scheduledAt).toLocaleDateString()} ({b.timeSlot})
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-bold text-slate-500">
                      <span className={b.paymentStatus === 'PAID' ? 'text-cyan-600 flex items-center' : 'text-amber-600 flex items-center'}>
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> {b.paymentStatus}
                      </span>
                      <span className="font-poppins font-black text-slate-800">Rs. {b.finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Dispatch tracker column */}
            <div className="lg:col-span-2 space-y-6">
              {selectedBooking ? (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
                  
                  {/* Summary & Reference */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 text-left">
                    <div>
                      <h3 className="font-poppins font-black text-sm text-slate-850">
                        Dispatch Timelines
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Reference: {selectedBooking.id}</p>
                    </div>
                    
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full ${
                      selectedBooking.status === 'COMPLETED' ? 'bg-cyan-100 text-cyan-700' :
                      selectedBooking.status === 'PENDING' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-brand/10 text-brand'
                    }`}>
                      {selectedBooking.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Operational Timeline steps */}
                  <div className="relative flex items-center justify-between w-full max-w-lg mx-auto py-2">
                    <div className="absolute left-0 top-[22px] w-full h-1 bg-slate-100 -z-1"></div>
                    
                    {getTimelineSteps(selectedBooking.status).map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center z-10">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ring-4 ring-white shadow transition-all ${
                          step.done ? 'bg-brand text-white' : 
                          step.active ? 'bg-brand/25 text-brand ring-brand/10 border border-brand' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {step.done ? '✓' : idx + 1}
                        </span>
                        <span className={`text-[9px] font-black mt-2.5 uppercase tracking-wider ${
                          step.active ? 'text-brand font-black' : 'text-slate-400'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Simulated Bike GPS Map countdown */}
                  {selectedBooking.status === 'ON_THE_WAY' && (
                    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-850 relative overflow-hidden text-left shadow-lg">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(8,145,178,0.18),transparent)] pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                          <span className="font-poppins font-black text-xs uppercase tracking-wider text-brand-light">Live GPS Dispatch Active</span>
                        </div>
                        <span className="font-poppins font-black text-lg text-amber-400 animate-pulse">
                          {formatTime(secondsLeft)}
                        </span>
                      </div>

                      <div className="h-10 bg-slate-800/80 border border-slate-700/50 rounded-lg relative flex items-center px-4 mb-4 select-none">
                        <div className="absolute left-3 text-[9px] font-bold text-slate-500">Anchepalya Hub</div>
                        <div className="absolute right-3 text-[9px] font-bold text-slate-300">Your Location</div>

                        <div 
                          className="absolute transition-all duration-1000 flex items-center space-x-1"
                          style={{ left: `${15 + (mapPercentage * 0.55)}%` }}
                        >
                          <Truck className="w-5 h-5 text-brand-light transform -scale-x-100 animate-bounce" />
                          <span className="text-[8px] bg-brand text-white px-1.5 py-0.5 rounded leading-none uppercase font-bold tracking-tight">Ramesh Kumar</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                        Vijay/Ramesh has departed Chikkabidarakallu dispatch base. Verification code is active. Professional arriving at doorstep in Anchepalya.
                      </p>
                    </div>
                  )}

                  {/* Simulation action items */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3 text-left">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
                      <span>Dispatch Status Simulator (Grade flow updates)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 select-none">
                      <button 
                        onClick={() => updateJobStatus(selectedBooking.id, 'ON_THE_WAY')}
                        disabled={['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(selectedBooking.status)}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] px-3.5 py-2 rounded-xl font-bold shadow-xs disabled:opacity-50 transition-colors"
                      >
                        Depart On The Way
                      </button>
                      <button 
                        onClick={() => updateJobStatus(selectedBooking.id, 'IN_PROGRESS')}
                        disabled={['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(selectedBooking.status)}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] px-3.5 py-2 rounded-xl font-bold shadow-xs disabled:opacity-50 transition-colors"
                      >
                        Start Service Call
                      </button>
                      <button 
                        onClick={() => updateJobStatus(selectedBooking.id, 'COMPLETED')}
                        disabled={['PENDING', 'ASSIGNED', 'COMPLETED'].includes(selectedBooking.status)}
                        className="bg-brand text-white hover:bg-brand-dark text-[10px] px-3.5 py-2 rounded-xl font-bold shadow-xs disabled:opacity-50 transition-all"
                      >
                        Complete Invoice
                      </button>
                    </div>
                  </div>

                  {/* Invoice Summary Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 border-t border-slate-100 pt-5 text-left">
                    <div className="space-y-2">
                      <h4 className="font-poppins font-black text-slate-800 uppercase tracking-wider text-[10px] text-brand">Receipt Breakdown</h4>
                      <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        {selectedBooking.items ? selectedBooking.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-semibold">
                            <span>{item.service.name} (x{item.quantity})</span>
                            <span className="font-extrabold text-slate-800">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        )) : (
                          <div className="flex justify-between font-semibold">
                            <span>Service</span>
                            <span className="font-extrabold text-slate-800">Rs. {selectedBooking.totalPrice.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="border-t border-slate-200/50 pt-1.5 flex justify-between font-bold text-slate-700">
                          <span>Subtotal</span>
                          <span>Rs. {selectedBooking.totalPrice.toLocaleString()}</span>
                        </div>
                        {selectedBooking.discountApplied > 0 && (
                          <div className="flex justify-between text-cyan-600 font-extrabold">
                            <span>Coupon Savings</span>
                            <span>- Rs. {selectedBooking.discountApplied.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Platform Dispatch Fee</span>
                          <span>Rs. 49</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-poppins font-black text-brand text-sm">
                          <span>Final Paid</span>
                          <span>Rs. {selectedBooking.finalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <h4 className="font-poppins font-black text-slate-800 uppercase tracking-wider text-[10px] text-brand">Doorstep Coordinates</h4>
                      <div className="space-y-3 text-[11px] font-semibold">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-700">Service Location:</span>
                            <span className="text-slate-400 leading-normal">{selectedBooking.address}</span>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-700">Scheduled Time Slot:</span>
                            <span className="text-slate-400">{new Date(selectedBooking.scheduledAt).toLocaleDateString()} • {selectedBooking.timeSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Phone className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-700">Dispatcher Phone:</span>
                            <span className="text-slate-400">+91 {selectedBooking.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment checkout simulation */}
                  {selectedBooking.paymentStatus === 'UNPAID' && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                      <div className="flex items-center space-x-3 text-xs">
                        <CreditCard className="w-8 h-8 text-amber-500 flex-shrink-0" />
                        <div>
                          <span className="font-black text-amber-800 block">Invoice Payment Required</span>
                          <span className="text-amber-600 leading-none">Your doorstep professional is paused until paid.</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => simulatePayment(selectedBooking.id, 'UPI')}
                        className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-poppins font-black text-xs px-6 py-3 rounded-xl uppercase tracking-widest shadow-sm flex items-center justify-center space-x-1 cursor-pointer animate-transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pay Rs. {selectedBooking.finalPrice.toLocaleString()} Now</span>
                      </button>
                    </div>
                  )}

                  {/* Assigned Worker Profile component */}
                  {selectedBooking.workerId && (() => {
                    const firstItem = selectedBooking.items && selectedBooking.items[0];
                    const category = firstItem ? firstItem.service.category : 'Cleaning';
                    const workerAvatars = {
                      'Care': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=120&auto=format&fit=crop',
                      'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=120&auto=format&fit=crop',
                      'Shifting': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=120&auto=format&fit=crop',
                      'Cooking': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=120&auto=format&fit=crop',
                      'Painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=120&auto=format&fit=crop',
                      'Technical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=120&auto=format&fit=crop'
                    };
                    const avatarUrl = workerAvatars[category] || workerAvatars['Cleaning'];
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-xs text-left">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0">
                            <img src={avatarUrl} alt="Professional avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block">Assigned Service Professional</span>
                            <span className="text-slate-400 font-semibold">{selectedBooking.worker && selectedBooking.worker.user ? selectedBooking.worker.user.name : 'Ramesh Kumar'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-royal-gold font-black flex items-center">
                            <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> 4.8★
                          </span>
                          <a href={`tel:${selectedBooking.worker && selectedBooking.worker.user ? selectedBooking.worker.user.phone : '7766554433'}`} className="p-2.5 bg-white rounded-full border border-slate-200 text-brand">
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Customer Review Feedback submission form */}
                  {selectedBooking.status === 'COMPLETED' && (
                    <div className="border-t border-slate-100 pt-6 text-left">
                      <h4 className="font-poppins font-black text-xs text-slate-450 uppercase tracking-wider mb-4">
                        Rate Your Experience
                      </h4>

                      {selectedBooking.review || reviewSubmitted ? (
                        <div className="bg-cyan-50 border border-cyan-200/50 text-cyan-700 text-xs p-4 rounded-xl flex items-center justify-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-cyan-500" />
                          <span className="font-bold">Thank you! Your verified rating and comments have been recorded.</span>
                        </div>
                      ) : (
                        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-700">Choose Rating:</span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => setRating(score)}
                                  className={`p-1 transition-colors cursor-pointer ${score <= rating ? 'text-royal-gold' : 'text-slate-200'}`}
                                >
                                  <Star className="w-6 h-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="form-group">
                            <textarea
                              className="form-input min-h-[80px]"
                              placeholder="Write a comment about your home service professional's grade of work..."
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              required
                            ></textarea>
                            <label className="form-label">Write comment...</label>
                          </div>

                          <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs px-6 py-3 rounded-xl uppercase tracking-widest shadow-md animate-transition cursor-pointer"
                          >
                            Submit Verified Rating
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs text-slate-400 font-semibold">Select an order from the history panel to track dispatch details.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
