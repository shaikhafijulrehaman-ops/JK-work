import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { catalog as staticCatalog } from '../store/catalog';
import { getCache } from '../utils/cache';
import { 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle, 
  ShieldCheck, 
  Lock,
  ChevronLeft,
  Sparkles,
  MapPin as PinIcon,
  MessageSquare,
  FileText,
  User,
  Heart,
  Search,
  AlertCircle
} from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const initialVariant = searchParams.get('variant');

  const { createBooking } = useBookingStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [service, setService] = useState(() => {
    if (!serviceId) return null;
    const cachedServices = getCache('services_catalog');
    if (cachedServices) {
      const match = cachedServices.find(s => s.id === serviceId);
      if (match) return match;
    }
    return staticCatalog.find(s => s.id === serviceId) || null;
  });
  const [loading, setLoading] = useState(() => {
    if (!serviceId) return false;
    const cachedServices = getCache('services_catalog');
    if (cachedServices && cachedServices.some(s => s.id === serviceId)) return false;
    return true;
  });

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      const matchedStatic = staticCatalog.find(s => s.id === serviceId);
      try {
        const res = await fetch(`/api/services/${serviceId}`);
        const data = await res.json();
        if (data.success) {
          setService(data.service);
        } else if (!service) {
          setService(matchedStatic);
        }
      } catch (err) {
        console.warn('Backend service offline. Falling back to static catalog...', err);
        if (!service) {
          setService(matchedStatic);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  // Form controls
  const [variant, setVariant] = useState(initialVariant || '2BHK');
  const [qty, setQty] = useState(1);

  // Compact Native Date & Time controls
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('10:00'); // HH:MM format for native time picker

  // Personal details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address
  const [address, setAddress] = useState('Flat 402, Block A, Prestige Jindal City, Anchepalya, Bengaluru - 560073');
  const [landmark, setLandmark] = useState('Near Jindal Nagar Metro Station');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560073');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Preferences
  const [hasPet, setHasPet] = useState(false);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [notes, setNotes] = useState('');



  // Booking result states
  const [bookingState, setBookingState] = useState('FORM'); // 'FORM', 'AWAITING_PAYMENT', 'PAYMENT_SUCCESS'
  const [tempBookingId, setTempBookingId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Typewriter lines loop
  const phrases = [
    'Book trusted professionals instantly',
    'Professional home services at your doorstep',
    'Safe, verified, and trained experts',
    'Get premium service in just 9 minutes',
    'Clean, secure, and reliable assistance'
  ];
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Pre-fill fields on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      setPhone(user.phone || '9876543210');
      setFullName(user.name || '');
      setEmail(user.email || '');
    } else if (!isAuthenticated) {
      navigate('/services');
      const { setShowLoginModal } = useAuthStore.getState();
      setShowLoginModal(true);
      return;
    }
    // Set default date to today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, [isAuthenticated, user, navigate]);

  // Typewriter effect logic
  useEffect(() => {
    let timer;
    const currentPhrase = phrases[currentPhraseIdx];
    const speed = isDeleting ? 25 : 55;

    if (!isDeleting && typedText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setCurrentPhraseIdx((prev) => (prev + 1) % phrases.length);
    } else {
      timer = setTimeout(() => {
        setTypedText(
          isDeleting 
            ? currentPhrase.substring(0, typedText.length - 1)
            : currentPhrase.substring(0, typedText.length + 1)
        );
      }, speed);
    }
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, currentPhraseIdx]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="text-center space-y-4">
          <h2 className="font-poppins font-black text-xl text-slate-800">No Service Selected</h2>
          <p className="text-slate-500 text-xs">Please return to our catalog to select a service.</p>
          <button 
            onClick={() => navigate('/services')}
            className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs rounded-xl uppercase tracking-wider transition-all"
          >
            Go to Catalog
          </button>
        </div>
      </div>
    );
  }

  // Calculations
  const getServicePrice = () => {
    let base = service.price;
    if (service.name === 'House Painting') {
      base = variant === '3BHK' ? 23499.0 : 20099.0;
    }
    return base * qty;
  };

  const getTaxes = () => getServicePrice() * 0.05; // 5% Platform Dispatch Taxes
  const getFinalTotal = () => getServicePrice() + getTaxes();

  // GPS Simulator
  const handleGPSDetect = () => {
    setDetectingLoc(true);
    setTimeout(() => {
      setAddress('Flat 302, Tower 4, Prestige Jindal City, Anchepalya, Tumkur Main Road, Bengaluru - 560073');
      setLandmark('Near Jindal Nagar Metro');
      setDetectingLoc(false);
      addNotification('GPS Location Synced', 'Successfully pinpointed Anchepalya coordinates!');
    }, 1500);
  };

  // Dispatch / Checkout Confirmation
  const handleBookingConfirm = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      const { setShowLoginModal } = useAuthStore.getState();
      setShowLoginModal(true);
      return;
    }

    const generatedId = `JK-${Math.floor(100000 + Math.random() * 900000)}`;
    setTempBookingId(generatedId);
    setBookingState('AWAITING_PAYMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayNow = async () => {
    setIsProcessingPayment(true);
    setErrorMsg('');

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg('Failed to load payment gateway. Please check your internet connection.');
      setIsProcessingPayment(false);
      return;
    }

    const amountInINR = getFinalTotal();

    try {
      // Step 1: Create Order on Backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({
          amount: Math.round(amountInINR * 100), // in paise
          currency: 'INR',
          receipt: tempBookingId
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.message || 'Failed to create payment order from server.');
      }

      const orderData = await orderRes.json();
      const orderId = orderData.order_id;
      const finalRazorpayKey = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sxuenvd2uTsPCn';

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        key: finalRazorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'JK Enterprises',
        description: `Payment for ${service.name}`,
        image: '/favicon.svg',
        order_id: orderId,
        handler: async function (response) {
          try {
            setIsProcessingPayment(true);
            // Step 3: Verify Signature on Backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: tempBookingId
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.message || 'Signature verification failed.');
            }

            const paymentId = response.razorpay_payment_id;
            setTransactionId(paymentId);
            await handlePaymentSuccess(paymentId);
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            if (import.meta.env.MODE === 'production') {
              setErrorMsg('Payment verification failed. Please contact customer support with your transaction details.');
            } else {
              setErrorMsg(verifyError.message || 'Failed to verify transaction signature.');
            }
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: fullName,
          email: email,
          contact: phone
        },
        notes: {
          bookingId: tempBookingId
        },
        theme: {
          color: '#0891b2'
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setErrorMsg('Payment was cancelled by the user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      // Handle payment.failed event
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        setErrorMsg(response.error.description || 'Payment transaction failed.');
        setIsProcessingPayment(false);
      });

      rzp.open();
    } catch (orderError) {
      console.error('Order creation error:', orderError);
      if (import.meta.env.MODE === 'production') {
        setErrorMsg('Failed to initialize payment transaction. Please try again shortly.');
      } else {
        setErrorMsg(orderError.message || 'Failed to initialize payment transaction.');
      }
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (payId) => {
    setIsProcessingPayment(true);
    try {
      const payload = {
        booking_id: tempBookingId,
        customer_name: fullName,
        phone: phone,
        email: email || 'no-email@waitlist.com',
        service_name: service.name,
        amount: getFinalTotal(),
        address: `${address} | Landmark: ${landmark} | City: ${city}`,
        area: city,
        pincode: pincode,
        notes: notes || specialInstructions || '',
        transaction_id: payId
      };

      const res = await fetch('/api/bookings/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      setIsProcessingPayment(false);

      if (data.success) {
        setBookingState('PAYMENT_SUCCESS');
        addNotification('Payment Successful! 🎉', `Booking Ref #${tempBookingId} confirmed.`);
        
        const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const waMessage = `New Booking Request

Booking ID:
#${tempBookingId}

Customer Name:
${fullName}

Mobile Number:
${phone}

Email:
${email || 'N/A'}

Service:
${service.name}

Amount Paid:
₹${getFinalTotal()}

Address:
${address} | Landmark: ${landmark} | City: ${city}

Area:
${city}

Pincode:
${pincode}

Additional Notes:
${notes || specialInstructions || 'None'}

Payment Status:
PAID

Transaction ID:
${payId}

Booking Time:
${formattedDate}`;

        setTimeout(() => {
          try {
            const encodedText = encodeURIComponent(waMessage);
            window.location.href = `https://wa.me/918431588235?text=${encodedText}`;
          } catch (waError) {
            console.error('[JK Booking Monitoring] WhatsApp redirect failure:', waError);
          }
        }, 1500);

      } else {
        setErrorMsg(data.message || 'Payment capture failed. Please contact support.');
      }

    } catch (err) {
      console.error('Payment confirmation error:', err);
      setIsProcessingPayment(false);
      setErrorMsg('Network error confirming payment status. Your payment succeeded - please contact support.');
    }
  };

  // Custom Animated Pill Toggle Switch Child Component
  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100/50 rounded-xl transition-all duration-300">
      <span className="text-[10px] font-bold text-slate-700 text-left">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 flex-shrink-0 outline-none ${
          checked ? 'bg-brand' : 'bg-slate-300'
        }`}
      >
        <div
          className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 overflow-y-auto">
      
      {/* Full-Viewport Endlessly Looping Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden">
        <video 
          src="/cleaning_animation.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-slate-950/45"></div>
      </div>

      {/* Floating Header Back Navigation Button */}
      <button 
        onClick={() => navigate('/services')}
        className="absolute top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all flex items-center justify-center space-x-1.5 z-30 text-[10px] font-black uppercase tracking-wider shadow-sm border border-white/10"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Catalog</span>
      </button>

      {/* Form wrapper centered floating overlay */}
      <div className="w-full max-w-lg z-10 flex flex-col items-center space-y-4 my-8">
        
        {/* Floating Typewriter Header banner */}
        <div className="text-center space-y-1.5 w-full">
          <span className="text-[9px] font-black text-brand-light uppercase tracking-widest bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full w-max mx-auto block backdrop-blur-xs">
            ✨ Premium Doorstep SLA
          </span>
          <h2 className="font-poppins font-black text-lg sm:text-xl text-white tracking-tight h-12 flex items-center justify-center">
            <span className="leading-tight">{typedText}</span>
            <span className="w-1 h-5 bg-brand-light ml-1 border-r-2 border-brand-light animate-pulse"></span>
          </h2>
        </div>

        {bookingState === 'AWAITING_PAYMENT' ? (
          /* ==================== AWAITING PAYMENT STATE ==================== */
          <div className="bg-white/90 border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-blur-fade-in w-full text-slate-800 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-cyan-100 px-3 py-1 rounded-full w-max mx-auto block">
                Step 2: Pay Securely
              </span>
              <h3 className="font-poppins font-black text-xl text-slate-900 uppercase tracking-tight pt-2">
                THANK YOU FOR YOUR BOOKING
              </h3>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200/30 rounded-2xl p-5 text-left space-y-3.5 text-xs shadow-inner leading-relaxed">
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Service Name</span>
                <span className="font-extrabold text-slate-800 text-right">{service.name} (x{qty})</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Booking ID</span>
                <span className="font-mono font-extrabold text-brand bg-cyan-50 px-2 py-0.5 rounded">#{tempBookingId}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Status</span>
                <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/50 uppercase text-[9px] font-black">Awaiting Payment</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-poppins font-black text-slate-800 text-sm">
                <span className="uppercase tracking-wider text-[10px]">Booking Amount</span>
                <span className="text-brand text-base">₹{getFinalTotal().toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handlePayNow}
                disabled={isProcessingPayment}
                className="w-full bg-slate-950 hover:bg-slate-850 text-white font-poppins font-black text-xs py-4 rounded-xl uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 transition-all animate-pulse-slow"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span>
                    <span>Opening Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>PAY NOW</span>
                    <span className="text-[10px] text-slate-400 font-normal">Powered by Razorpay</span>
                  </>
                )}
              </button>



              <button
                onClick={() => setBookingState('FORM')}
                disabled={isProcessingPayment}
                className="bg-transparent hover:bg-slate-100 text-slate-500 font-poppins font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider transition-all"
              >
                Back to Details
              </button>
            </div>
            {errorMsg && (
              <div className="text-red-500 text-[10px] font-extrabold text-center mt-3 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl animate-shake select-none">
                {errorMsg}
              </div>
            )}
          </div>
        ) : bookingState === 'PAYMENT_SUCCESS' ? (
          /* ==================== PAYMENT SUCCESS STATE ==================== */
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-10 text-center space-y-6 animate-blur-fade-in w-full text-slate-800">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-poppins font-black text-xl text-slate-900 uppercase tracking-tight">
                PAYMENT SUCCESSFUL
              </h3>
              <p className="text-xs text-slate-500 font-semibold max-w-[270px] mx-auto leading-relaxed">
                Your booking has been confirmed successfully.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 text-left space-y-3 text-xs leading-normal">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Booking ID:</span>
                <span className="font-mono font-extrabold text-slate-800">#{tempBookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-extrabold text-emerald-600">₹{getFinalTotal()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{transactionId}</span>
              </div>
            </div>

            {/* Loading Dispatch Spinner */}
            <div className="pt-4 flex flex-col items-center space-y-3.5">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                Redirecting to WhatsApp in 1.5s...
              </p>
            </div>
          </div>
        ) : (
          /* ==================== FORM ENTRY STATE ==================== */
          <form onSubmit={handleBookingConfirm} className="bg-white/75 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl p-5 sm:p-8 w-full space-y-5 animate-blur-fade-in text-slate-800">
            
            {/* Selected Service Header summary card */}
            <div className="bg-slate-50/60 border border-slate-100/50 rounded-2xl p-3 flex items-center space-x-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 shadow-inner">
                <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[8px] font-black text-brand uppercase tracking-wider bg-cyan-100/55 px-1.5 py-0.2 rounded-full leading-none">{service.category}</span>
                <h4 className="font-poppins font-extrabold text-xs text-slate-800 mt-0.5">{service.name}</h4>
                <span className="text-[9px] text-slate-400 font-semibold block">Base Price: Rs. {service.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Section 1: Personal Details */}
            <div className="space-y-3.5">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Personal Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <input 
                    type="text" 
                    id="fullName"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                </div>
                <div className="form-group">
                  <input 
                    type="email" 
                    id="email"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                  <label htmlFor="email" className="form-label">Email</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <input 
                    type="text" 
                    id="phone"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    id="altPhone"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={altPhone} 
                    onChange={e => setAltPhone(e.target.value)} 
                  />
                  <label htmlFor="altPhone" className="form-label">Alt Phone</label>
                </div>
              </div>
            </div>

            {/* Section 2: Booking Schedule (Minimal Pickers) */}
            <div className="space-y-3.5 border-t border-slate-100/50 pt-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Booking Schedule</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Native Calendar Picker for Date */}
                <div className="form-group">
                  <input 
                    type="date" 
                    id="selectedDate"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    required 
                  />
                  <label htmlFor="selectedDate" className="form-label flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-brand mr-1" /> Preferred Date
                  </label>
                </div>
                {/* Native Clock Picker for Time */}
                <div className="form-group">
                  <input 
                    type="time" 
                    id="selectedTime"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={selectedSlot} 
                    onChange={e => setSelectedSlot(e.target.value)} 
                    required 
                  />
                  <label htmlFor="selectedTime" className="form-label flex items-center">
                    <Clock className="w-3.5 h-3.5 text-brand mr-1" /> Preferred Time
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Service Address */}
            <div className="space-y-3.5 border-t border-slate-100/50 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Address</h3>
                <button 
                  type="button"
                  onClick={handleGPSDetect}
                  disabled={detectingLoc}
                  className="text-[8px] font-black text-brand uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded px-2 py-0.5 transition-all"
                >
                  GPS Sync
                </button>
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  id="address"
                  className="form-input text-slate-800" 
                  placeholder=" "
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                />
                <label htmlFor="address" className="form-label flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-brand mr-1" /> Flat / Doorstep Address
                </label>
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  id="landmark"
                  className="form-input text-slate-800" 
                  placeholder=" "
                  value={landmark} 
                  onChange={e => setLandmark(e.target.value)} 
                  required 
                />
                <label htmlFor="landmark" className="form-label">Landmark / Block details</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <input 
                    type="text" 
                    id="city"
                    className="form-input text-slate-800 animate-pulse-slow" 
                    placeholder=" "
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
                  <label htmlFor="city" className="form-label">City</label>
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    id="pincode"
                    className="form-input text-slate-800" 
                    placeholder=" "
                    value={pincode} 
                    onChange={e => setPincode(e.target.value)} 
                    required 
                  />
                  <label htmlFor="pincode" className="form-label">Pincode</label>
                </div>
              </div>
            </div>

            {/* Section 4: Preferences */}
            <div className="space-y-3.5 border-t border-slate-100/50 pt-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Additional Preferences</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <ToggleSwitch 
                  label="Pets at Home"
                  checked={hasPet}
                  onChange={setHasPet}
                />
                <ToggleSwitch 
                  label="Parking Available"
                  checked={parkingAvailable}
                  onChange={setParkingAvailable}
                />
              </div>

              <div className="form-group">
                <textarea 
                  id="specialInstructions"
                  className="form-input min-h-[40px] py-1.5 text-slate-800" 
                  placeholder=" "
                  value={specialInstructions} 
                  onChange={e => setSpecialInstructions(e.target.value)} 
                ></textarea>
                <label htmlFor="specialInstructions" className="form-label">Special instructions / Notes</label>
              </div>
            </div>

            {/* Bottom Section: Compact Invoice details & Pay After Service Badge */}
            <div className="border-t border-slate-100/50 pt-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-poppins font-black text-slate-800 uppercase tracking-wider text-[10px]">Invoice Summary</span>
                <span className="font-poppins font-black text-brand text-sm">Rs. {getFinalTotal().toLocaleString()}</span>
              </div>
              
              {/* Trust Badge */}
              <div className="bg-cyan-50/50 border border-cyan-100/50 rounded-xl p-2.5 flex items-center space-x-2 text-cyan-800">
                <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-[9.5px] font-semibold text-cyan-700 text-left">
                  Secure checkout via UPI, Card or Netbanking powered by Razorpay.
                </span>
              </div>

              {/* Confirm Button */}
              <button 
                type="submit"
                className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-lg shadow-brand/10 flex items-center justify-center space-x-1.5 transition-all duration-300"
              >
                <span>CONFIRM BOOKING</span>
                <CheckCircle className="w-4.5 h-4.5 text-white" />
              </button>

              {/* Error Alert Display */}
              {errorMsg && (
                <div className="text-red-500 text-[10px] font-extrabold text-center mt-3 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl animate-shake select-none">
                  {errorMsg}
                </div>
              )}
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
