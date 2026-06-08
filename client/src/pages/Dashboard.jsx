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
  Smartphone
} from 'lucide-react';

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
  const { bookings, fetchBookings, updateJobStatus, submitReview, simulatePayment, loading } = useBookingStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Live map routing countdown variables
  const [mapPercentage, setMapPercentage] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(540); // 9 minutes = 540s

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
            // Auto transition sandbox to In Progress when map completes
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
      addNotification('Review Submitted', 'Thank you for grading your service worker Ramesh Kumar/Vijay!');
      setTimeout(() => {
        setReviewSubmitted(false);
        setComment('');
      }, 3000);
    }
  };

  const getTimelineSteps = (status) => {
    const steps = [
      { name: 'Pending', active: true, done: ['ASSIGNED', 'ON_THE_WAY'].includes(status) },
      { name: 'Assigned', active: ['ASSIGNED', 'ON_THE_WAY'].includes(status), done: status === 'ON_THE_WAY' },
      { name: 'On The Way', active: status === 'ON_THE_WAY', done: status === 'ON_THE_WAY' }
    ];
    return steps;
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const ss = secs % 60;
    return `${mins}:${ss < 10 ? '0' : ''}${ss}`;
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
                        b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                        b.status === 'ON_THE_WAY' ? 'bg-cyan-100 text-cyan-700' :
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
                      selectedBooking.status === 'ON_THE_WAY' ? 'bg-cyan-100 text-cyan-700 font-bold' :
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

                      {/* GPS Anchepalya dispatch countdown mock map */}
                      {selectedBooking.status === 'ON_THE_WAY' && (
                        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(8,145,178,0.2),transparent)] pointer-events-none"></div>
                          
                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping"></span>
                              <span className="font-poppins font-black text-xs uppercase tracking-wider text-brand-light">Live GPS Dispatch Dispatcher</span>
                            </div>
                            <span className="font-poppins font-black text-xl text-royal-gold animate-pulse">
                              {formatTime(secondsLeft)}
                            </span>
                          </div>

                          {/* Map Animation Road */}
                          <div className="h-10 bg-slate-800/80 border border-slate-700/50 rounded-lg relative flex items-center px-4 mb-4">
                            {/* Start (Anchepalya base) */}
                            <div className="absolute left-3 text-[10px] font-bold text-slate-500">Anchepalya Hub</div>
                            {/* End (Customer Doorstep) */}
                            <div className="absolute right-3 text-[10px] font-bold text-slate-300">Prestige Jindal City</div>

                            {/* Worker Bike symbol moving */}
                            <div 
                              className="absolute transition-all duration-1000 flex items-center space-x-1"
                              style={{ left: `${15 + (mapPercentage * 0.55)}%` }}
                            >
                              <Truck className="w-5 h-5 text-brand-light transform -scale-x-100 animate-bounce" />
                              <span className="text-[8px] bg-brand text-white px-1.5 py-0.5 rounded leading-none uppercase font-bold tracking-tight">{selectedBooking.partnerName || 'Expert'}</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                            Your service partner is now on the way to your doorstep. Estimated arrival: <strong>Within 9 Minutes</strong>.
                          </p>
                        </div>
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
                          <span>Rs. 49</span>
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

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
