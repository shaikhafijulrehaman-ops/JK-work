import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard, 
  Calendar,
  CheckCircle,
  Truck,
  Activity,
  Award,
  Star,
  ShieldCheck,
  Smartphone,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse text-left">
    <div className="lg:col-span-1 space-y-4">
      <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-4 rounded-xl space-y-3">
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
    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
        <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
      </div>
      <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
      <div className="h-32 w-full bg-slate-200 rounded-xl"></div>
      <div className="h-24 w-full bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { bookings, fetchBookings, updateJobStatus, submitReview, verifyArrival, loading } = useBookingStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [customerOpinion, setCustomerOpinion] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Clear feedback validation state when opening/closing
  useEffect(() => {
    if (!isFeedbackOpen) {
      setFeedbackError(null);
      setIsSubmittingFeedback(false);
    }
  }, [isFeedbackOpen]);

  // Live map routing percentage
  const [mapPercentage, setMapPercentage] = useState(0);

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
    if (selectedBooking && selectedBooking.status === 'ASSIGNED') {
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
    const ok = await submitReview(selectedBooking.id, rating, customerOpinion);
    setIsSubmittingFeedback(false);
    if (ok) {
      setReviewSubmitted(true);
      addNotification('Review Submitted', 'Thank you for confirming completion and leaving feedback!');
      setTimeout(() => {
        setReviewSubmitted(false);
        setCustomerOpinion('');
        setIsFeedbackOpen(false);
      }, 3000);
    } else {
      const storeError = useBookingStore.getState().error;
      setFeedbackError(storeError || 'Failed to submit review. Please try again.');
    }
  };

  const handleVerifyArrival = async (e) => {
    e.preventDefault();
    if (otpInput.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    const res = await verifyArrival(selectedBooking.id, otpInput);
    setIsVerifyingOtp(false);
    if (res.success) {
      setOtpInput('');
      addNotification('Arrival Verified', 'Service partner arrival verified successfully!');
    } else {
      setOtpError(res.error || 'Incorrect OTP. Arrival verification failed.');
    }
  };

  const getTimelineSteps = (status) => {
    return [
      { name: 'Pending', active: true, done: ['ASSIGNED', 'ARRIVED', 'COMPLETED'].includes(status) },
      { name: 'Assigned', active: ['ASSIGNED', 'ARRIVED', 'COMPLETED'].includes(status), done: ['ARRIVED', 'COMPLETED'].includes(status) },
      { name: 'Arrived', active: ['ARRIVED', 'COMPLETED'].includes(status), done: ['ARRIVED', 'COMPLETED'].includes(status) },
      { name: 'Completed', active: ['ARRIVED', 'COMPLETED'].includes(status), done: status === 'COMPLETED' }
    ];
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Customer Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor active instant bookings and dispatch timelines</p>
        </div>

        {loading && bookings.length === 0 ? (
          <DashboardSkeleton />
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-poppins font-bold text-sm text-slate-700">No Service Bookings Yet</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto mb-6">
              You haven't placed any bookings. Head over to our catalog to select instant services in Anchepalya.
            </p>
            <Link to="/services" className="bg-brand text-white font-poppins font-bold text-xs px-6 py-3 rounded-lg shadow-md shadow-brand/10 transition-all uppercase tracking-wider">
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ==================== LEFT COLUMN: BOOKINGS LIST ==================== */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="font-poppins font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                Booking History ({bookings.length})
              </h2>
              
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`bg-white border p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-300 ${
                      selectedBooking && selectedBooking.id === b.id 
                        ? 'border-brand ring-1 ring-brand bg-brand/5' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-400 leading-none">
                        Ref: #{b.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none ${
                        b.status === 'CANCELLED' ? 'bg-rose-105 text-rose-700' :
                        b.status === 'ARRIVED' ? 'bg-teal-100 text-teal-700' :
                        b.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status === 'PENDING' ? 'Pending' : b.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate mb-1">
                      {b.items && b.items.length > 0 ? b.items[0].service.name : 'Cleaning Service'}
                      {b.items && b.items.length > 1 && ` + ${b.items.length - 1} other`}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center mb-2">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(b.scheduledAt).toLocaleDateString()} ({b.timeSlot})
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-semibold text-slate-600">
                      <span className={b.paymentStatus === 'PAID' ? 'text-cyan-600 flex items-center' : 'text-amber-600 flex items-center'}>
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> {b.paymentStatus}
                      </span>
                      <span className="font-poppins font-black text-slate-700">Rs. {b.finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ==================== RIGHT COLUMN: DETAILED DISPATCH TRACKER ==================== */}
            <div className="lg:col-span-2 space-y-6">
              {selectedBooking && (
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-6">
                  
                  {/* Title & Ref */}
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <div>
                      <h3 className="font-poppins font-extrabold text-sm text-slate-800">
                        Dispatch Tracker Details
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">Order Reference ID: {selectedBooking.id}</p>
                    </div>
                    
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                      selectedBooking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 font-bold' :
                      selectedBooking.status === 'ARRIVED' ? 'bg-teal-100 text-teal-700 font-bold' :
                      selectedBooking.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800 font-bold' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedBooking.status === 'PENDING' ? 'Pending' : selectedBooking.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Cancelled status alert box or progressive stepper timeline */}
                  {selectedBooking.status === 'CANCELLED' ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600 font-extrabold text-lg">
                        ✕
                      </div>
                      <h3 className="font-poppins font-black text-slate-800 text-base">Booking Cancelled & Refunded</h3>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                        This booking has been cancelled by the administrator. A full refund of <strong>Rs. {selectedBooking.finalPrice.toLocaleString()}</strong> has been processed back to your original payment method.
                      </p>
                      {selectedBooking.refundId && (
                        <div className="bg-white border border-rose-100 p-3 rounded-lg max-w-xs mx-auto text-left text-[11px] space-y-1 font-mono">
                          <div className="flex justify-between text-slate-500">
                            <span>Refund Status:</span>
                            <span className="text-emerald-600 font-bold uppercase">Success</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Refund Ref ID:</span>
                            <span className="text-slate-800 font-bold select-all">{selectedBooking.refundId}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Dynamic Timeline stepper */}
                      <div className="relative flex items-center justify-between w-full max-w-lg mx-auto py-2">
                        {/* Background line */}
                        <div className="absolute left-0 top-[22px] w-full h-1 bg-slate-100 -z-1"></div>
                        
                        {getTimelineSteps(selectedBooking.status).map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center z-10">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow transition-all ${
                              step.done ? 'bg-brand text-white' : 
                              step.active ? 'bg-brand/20 text-brand ring-brand/10 border border-brand' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {step.done ? '✓' : idx + 1}
                            </span>
                            <span className={`text-[9px] font-bold mt-2 uppercase tracking-wide ${
                              step.active ? 'text-brand font-black' : 'text-slate-400'
                            }`}>
                              {step.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Operational dispatch tracker section */}
                      {['ASSIGNED', 'ARRIVED'].includes(selectedBooking.status) && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 relative overflow-hidden text-left shadow-xl animate-fade-up">
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
                                {selectedBooking.status === 'ARRIVED'
                                  ? 'Arrived - Service partner has arrived at your doorstep.'
                                  : 'Travelling - Service partner is on the way to your doorstep.'}
                              </span>
                            </div>
                          </div>

                          {/* OTP input field for ASSIGNED status */}
                          {selectedBooking.status === 'ASSIGNED' && (
                            <form onSubmit={handleVerifyArrival} className="mt-4 pt-4 border-t border-slate-700/30 space-y-3 relative z-10">
                              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-450">
                                Verify Service Partner Arrival
                              </span>
                              <div className="flex flex-col sm:flex-row items-center gap-3">
                                <input 
                                  type="text"
                                  maxLength="4"
                                  placeholder="[ _ _ _ _ ]"
                                  value={otpInput}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) setOtpInput(val);
                                  }}
                                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold tracking-widest text-center focus:outline-none focus:border-cyan-400 w-full sm:w-40"
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={isVerifyingOtp}
                                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-750 text-white font-poppins font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center justify-center space-x-1.5 w-full sm:w-auto"
                                >
                                  {isVerifyingOtp ? 'Verifying...' : 'Verify Arrival'}
                                </button>
                              </div>
                              {otpError && (
                                <p className="text-rose-400 text-[10px] font-extrabold mt-1">{otpError}</p>
                              )}
                            </form>
                          )}

                          {/* Success Message for verified arrival */}
                          {selectedBooking.status === 'ARRIVED' && (
                            <div className="bg-emerald-950 border border-emerald-800/40 text-emerald-400 text-[11px] p-3.5 rounded-xl flex items-center space-x-2 font-bold mb-1 relative z-10 shadow-inner">
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-450" />
                              <span>Service Partner Arrival Verified</span>
                            </div>
                          )}

                          {/* Small animated bike/rider moving effect */}
                          {selectedBooking.status !== 'ARRIVED' && (
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
                          )}
                        </div>
                      )}

                      {/* Customer controlled completion button for ARRIVED status */}
                      {selectedBooking.status === 'ARRIVED' && (
                        <button 
                          onClick={() => setIsConfirmOpen(true)}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 cursor-pointer animate-transition"
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                          <span>Confirm Work Completed</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Detailed receipt breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 border-t border-slate-50 pt-4">
                    <div className="space-y-2">
                      <h4 className="font-poppins font-bold text-slate-800">Booking Summary</h4>
                      <div className="bg-slate-50 p-3 rounded-lg space-y-1.5">
                        {selectedBooking.items ? selectedBooking.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-medium">
                            <span>{item.service.name} (x{item.quantity})</span>
                            <span className="font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        )) : (
                          <div className="flex justify-between font-medium">
                            <span>Service</span>
                            <span className="font-bold">Rs. {selectedBooking.totalPrice.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="border-t border-slate-200/50 pt-1.5 flex justify-between font-bold text-slate-800">
                          <span>Subtotal</span>
                          <span>Rs. {selectedBooking.totalPrice.toLocaleString()}</span>
                        </div>
                        {selectedBooking.discountApplied > 0 && (
                          <div className="flex justify-between text-cyan-600 font-semibold">
                            <span>Promo Discount</span>
                            <span>- Rs. {selectedBooking.discountApplied.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Platform Dispatch Fee</span>
                          <span>Rs. 0</span>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between font-poppins font-black text-brand text-sm">
                          <span>Final Total</span>
                          <span>Rs. {selectedBooking.finalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="font-poppins font-bold text-slate-800">Operational Inclusions</h4>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-700">Doorstep Location:</span>
                            <span className="text-slate-400 leading-normal">{selectedBooking.address}</span>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-700">Scheduled Time Slot:</span>
                            <span className="text-slate-400">{new Date(selectedBooking.scheduledAt).toLocaleDateString()} • {selectedBooking.timeSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Phone className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-700">Dispatcher Phone:</span>
                            <span className="text-slate-400">{selectedBooking.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment pending information card */}
                  {selectedBooking.paymentStatus === 'UNPAID' && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-5 flex items-center space-x-3 text-xs text-left">
                      <CreditCard className="w-8 h-8 text-amber-500 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-amber-800 block">Payment Pending</span>
                        <span className="text-amber-600 leading-none">Please complete the payment to proceed with your service.</span>
                      </div>
                    </div>
                  )}

                  {/* Assigned Custom Partner Details */}
                  {selectedBooking.partnerName && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0 flex items-center justify-center bg-brand/5 text-brand font-black text-xs">
                          {selectedBooking.partnerName.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-850 block">Assigned Service Partner</span>
                          <span className="text-slate-500 font-semibold">{selectedBooking.partnerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="bg-brand/10 text-brand font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          Assigned
                        </span>
                        <a href={`tel:${selectedBooking.partnerMobile}`} className="p-2 bg-white rounded-full border border-slate-200 text-brand shadow-sm hover:bg-slate-50 transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Customer Review Feedback submission form */}
                  {selectedBooking.status === 'COMPLETED' && (
                    <div className="border-t border-slate-100 pt-6 text-left">
                      <h4 className="font-poppins font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">
                        Rate Your Experience
                      </h4>

                      {selectedBooking.review || reviewSubmitted ? (
                        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-700">Your Rating:</span>
                            <div className="flex space-x-0.5">
                              {[1, 2, 3, 4, 5].map((score) => {
                                const finalRating = selectedBooking.review?.rating || rating;
                                return (
                                  <Star
                                    key={score}
                                    className={`w-4 h-4 fill-current ${score <= finalRating ? 'text-amber-500' : 'text-slate-200'}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                          {(selectedBooking.review?.customerOpinion || customerOpinion) && (
                            <div className="text-left bg-white p-3 rounded-xl border border-slate-100">
                              <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Your Feedback:</span>
                              <p className="text-slate-750 font-semibold italic text-xs leading-normal">
                                "{selectedBooking.review?.customerOpinion || customerOpinion}"
                              </p>
                            </div>
                          )}
                          <div className="bg-emerald-50 border border-emerald-200/20 text-emerald-700 text-[10px] p-2.5 rounded-xl flex items-center justify-center space-x-1.5 font-bold shadow-inner">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Rating & Feedback Recorded</span>
                          </div>
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
                                  className={`p-1 transition-colors cursor-pointer ${score <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                                >
                                  <Star className={`w-6 h-6 fill-current ${score <= rating ? 'text-amber-500' : 'text-slate-200'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <textarea
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all font-semibold min-h-[80px]"
                              placeholder="Share your experience with the service partner..."
                              value={customerOpinion}
                              onChange={e => setCustomerOpinion(e.target.value)}
                            ></textarea>
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

              {selectedBooking.review || reviewSubmitted ? (
                <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">Your Rating:</span>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const finalRating = selectedBooking.review?.rating || rating;
                        return (
                          <Star
                            key={score}
                            className={`w-4 h-4 fill-current ${score <= finalRating ? 'text-amber-500' : 'text-slate-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {(selectedBooking.review?.customerOpinion || customerOpinion) && (
                    <div className="text-left bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Your Feedback:</span>
                      <p className="text-slate-755 font-semibold italic text-xs leading-normal">
                        "{selectedBooking.review?.customerOpinion || customerOpinion}"
                      </p>
                    </div>
                  )}
                  <div className="bg-emerald-50 border border-emerald-200/20 text-emerald-700 text-[10px] p-2.5 rounded-xl flex items-center justify-center space-x-1.5 font-bold shadow-inner">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Feedback Recorded Successfully</span>
                  </div>
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customer Opinion (Optional)</label>
                    <textarea 
                      placeholder="Share your experience with the service partner..."
                      value={customerOpinion}
                      onChange={(e) => setCustomerOpinion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all font-semibold min-h-[100px]"
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
