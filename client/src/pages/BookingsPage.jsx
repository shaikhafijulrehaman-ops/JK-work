import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Clock, MapPin, Phone, CreditCard, Calendar, 
  CheckCircle, Truck, Activity, Star, ShieldCheck, Smartphone, 
  ChevronRight, Sparkles, FileText, AlertCircle, ShoppingBag,
  Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BookingsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-pulse text-left">
    <div className="lg:col-span-1 space-y-3.5">
      <div className="h-4 w-32 bg-slate-200 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-150 p-4.5 rounded-2xl space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
              <div className="h-3 w-12 bg-slate-200 rounded"></div>
            </div>
            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
            <div className="border-t border-slate-50 pt-2 flex justify-between">
              <div className="h-3 w-12 bg-slate-200 rounded"></div>
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
        <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl"></div>
      <div className="h-24 w-full bg-slate-200 rounded-xl"></div>
      <div className="h-32 w-full bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

export default function BookingsPage() {
  const { bookings, fetchBookings, updateJobStatus, submitReview, simulatePayment, loading } = useBookingStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [appreciation, setAppreciation] = useState('');
  const [complaint, setComplaint] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  // Clear feedback validation state when opening/closing
  useEffect(() => {
    if (!isFeedbackOpen) {
      setFeedbackError(null);
      setIsSubmittingFeedback(false);
    }
  }, [isFeedbackOpen]);

  // Live map routing percentage
  const [mapPercentage, setMapPercentage] = useState(0);

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

  // Mock GPS bike animation percentage loop
  useEffect(() => {
    let interval = null;
    if (selectedBooking && ['ASSIGNED', 'ON_THE_WAY'].includes(selectedBooking.status)) {
      interval = setInterval(() => {
        setMapPercentage((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 300);
    } else {
      setMapPercentage(0);
    }
    return () => clearInterval(interval);
  }, [selectedBooking]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    const ok = await submitReview(selectedBooking.id, rating, comment, appreciation, complaint);
    setIsSubmittingFeedback(false);
    if (ok) {
      setReviewSubmitted(true);
      addNotification('Review Submitted', 'Thank you for confirming completion and leaving feedback!');
      setTimeout(() => {
        setReviewSubmitted(false);
        setComment('');
        setAppreciation('');
        setComplaint('');
        setIsFeedbackOpen(false);
      }, 3000);
    } else {
      const storeError = useBookingStore.getState().error;
      setFeedbackError(storeError || 'Failed to submit review. Please try again.');
    }
  };

  const getTimelineSteps = (status) => {
    return [
      { name: 'Pending', active: true, done: ['ASSIGNED', 'ON_THE_WAY', 'COMPLETED'].includes(status) },
      { name: 'Assigned', active: ['ASSIGNED', 'ON_THE_WAY', 'COMPLETED'].includes(status), done: ['ON_THE_WAY', 'COMPLETED'].includes(status) },
      { name: 'On The Way', active: ['ON_THE_WAY', 'COMPLETED'].includes(status), done: status === 'COMPLETED' },
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
    if (activeTab === 'ACTIVE') return ['PENDING', 'PENDING_PARTNER_ACCEPTANCE', 'PARTNER_ACCEPTED', 'ASSIGNED', 'ON_THE_WAY'].includes(b.status);
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

        {loading && bookings.length === 0 ? (
          <BookingsSkeleton />
        ) : filteredBookings.length === 0 ? (
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
                        ['PENDING', 'PENDING_PARTNER_ACCEPTANCE'].includes(b.status) ? 'bg-amber-100 text-amber-700 font-bold' :
                        b.status === 'PARTNER_ACCEPTED' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-brand/10 text-brand'
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
                      ['PENDING', 'PENDING_PARTNER_ACCEPTANCE'].includes(selectedBooking.status) ? 'bg-amber-100 text-amber-700 font-bold' :
                      selectedBooking.status === 'PARTNER_ACCEPTED' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-brand/10 text-brand'
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

                  {/* Operational dispatch tracker section */}
                  {['ASSIGNED', 'ON_THE_WAY'].includes(selectedBooking.status) && (
                    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 relative overflow-hidden text-left shadow-xl animate-fade-up">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.15),transparent)] pointer-events-none"></div>
                      
                      <div className="flex items-center space-x-2.5 mb-4 relative z-10">
                        <span className="w-2.5 h-2.5 bg-cyan-450 rounded-full animate-ping"></span>
                        <span className="font-poppins font-black text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          🚲 Professional Worker Coming
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 mb-5 text-[11px] relative z-10 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Service Partner Name:</span>
                          <span className="font-extrabold text-white text-xs">{selectedBooking.partnerName || 'Expert Partner'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Service Partner Phone:</span>
                          <a href={`tel:${selectedBooking.partnerMobile}`} className="font-extrabold text-cyan-400 text-xs hover:underline">
                            +91 {selectedBooking.partnerMobile || 'N/A'}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Service Type:</span>
                          <span className="font-extrabold text-white text-xs">{selectedBooking.serviceCategory || 'Home Service'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Booking ID:</span>
                          <span className="font-extrabold text-slate-350 text-xs font-mono">{selectedBooking.id}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-700/30">
                          <span className="text-slate-400 font-bold block mb-0.5">Estimated Arrival Status:</span>
                          <span className="font-extrabold text-amber-400 text-xs flex items-center">
                            {selectedBooking.status === 'ON_THE_WAY' 
                              ? 'Travelling - Arriving at doorstep in Chikkabidarakallu / Anchepalya zone shortly.' 
                              : 'Dispatcher assigned. Preparing to depart Chikkabidarakallu dispatch base.'}
                          </span>
                        </div>
                      </div>

                      {/* Small animated bike/rider moving effect */}
                      <div className="h-12 bg-slate-800/80 border border-slate-700/50 rounded-xl relative flex items-center px-4 select-none overflow-hidden">
                        <div className="absolute left-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Anchepalya Hub</div>
                        <div className="absolute right-3 text-[9px] font-bold text-slate-300 uppercase tracking-wider">Your Doorstep</div>

                        {/* Road Line */}
                        <div className="absolute left-20 right-20 h-0.5 border-t border-dashed border-slate-600/50"></div>

                        {/* Bike Animation */}
                        <div className="absolute left-1/4 animate-bike-travel flex items-center space-x-2">
                          <span className="text-2xl animate-bounce">🚲</span>
                          <span className="text-[9px] bg-brand text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-tight shadow shadow-brand/20">
                            {selectedBooking.partnerName?.split(' ')[0] || 'Worker'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer controlled completion button for ON_THE_WAY status */}
                  {selectedBooking.status === 'ON_THE_WAY' && (
                    <button 
                      onClick={() => setIsConfirmOpen(true)}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 cursor-pointer animate-transition"
                    >
                      <CheckCircle className="w-4.5 h-4.5" />
                      <span>Confirm Work Completed</span>
                    </button>
                  )}



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

                  {/* Assigned Partner Profile component */}
                  {selectedBooking.partnerId && (
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between text-xs text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0 flex items-center justify-center bg-brand/5 text-brand font-black text-xs">
                          {selectedBooking.partnerName?.substring(0, 2).toUpperCase() || 'SP'}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 block">Assigned Service Professional</span>
                          <span className="text-slate-400 font-semibold">{selectedBooking.partnerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-amber-500 font-black flex items-center">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> 4.8★
                        </span>
                        <a href={`tel:${selectedBooking.partnerMobile}`} className="p-2.5 bg-white rounded-full border border-slate-200 text-brand shadow-sm hover:bg-slate-50 transition-colors">
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

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

      {/* ==================== CONFIRMATION POPUP ==================== */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="fixed inset-0 bg-slate-900 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden z-10 flex flex-col p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto"><Check className="w-6 h-6" /></div>
              <h3 className="font-poppins font-black text-slate-850 text-sm">
                Has your service been completed successfully?
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Please confirm only if the doorstep professional has completed the requested service items to your satisfaction.
              </p>
              <div className="flex space-x-3.5 pt-2">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-poppins font-black text-[10px] uppercase py-3 rounded-xl tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setIsFeedbackOpen(true);
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-poppins font-black text-[10px] uppercase py-3 rounded-xl tracking-wider cursor-pointer shadow-md shadow-cyan-600/10 transition-colors"
                >
                  Yes, Complete Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== FEEDBACK & RATINGS FORM MODAL ==================== */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="fixed inset-0 bg-slate-900 cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden z-10 flex flex-col p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-poppins font-black text-sm text-slate-800">
                  Rate Your Experience
                </h3>
                <button 
                  onClick={() => setIsFeedbackOpen(false)}
                  className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reviewSubmitted ? (
                <div className="bg-cyan-50 border border-cyan-200/50 text-cyan-700 text-xs p-4 rounded-xl flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-cyan-500" />
                  <span className="font-bold">Thank you! Your feedback has been submitted successfully.</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div className="flex items-center space-x-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-750">Service Rating *</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setRating(score)}
                          className={`p-1 transition-colors cursor-pointer ${score <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Appreciation (Optional)</label>
                    <textarea 
                      placeholder="What did you appreciate about the service? (e.g. punctual, polite, efficient...)"
                      value={appreciation}
                      onChange={(e) => setAppreciation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all font-semibold min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Complaint / Feedback (Optional)</label>
                    <textarea 
                      placeholder="Any complaints or suggestions for improvements?"
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all font-semibold min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">General Comment</label>
                    <textarea 
                      placeholder="Additional remarks..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all font-semibold min-h-[60px]"
                    />
                  </div>

                  {feedbackError && (
                    <div className="text-red-500 text-[10px] font-extrabold text-center mt-3 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl select-none leading-normal">
                      {feedbackError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-poppins font-black text-[10px] uppercase py-3.5 rounded-xl transition-all shadow-md shadow-cyan-600/10 cursor-pointer mt-4 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span>
                        <span>SUBMITTING...</span>
                      </>
                    ) : (
                      <span>SUBMIT FEEDBACK</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
