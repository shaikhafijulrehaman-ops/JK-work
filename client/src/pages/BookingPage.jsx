import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { catalog } from '../store/catalog';
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
  Heart
} from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const initialVariant = searchParams.get('variant');

  const { createBooking } = useBookingStore();
  const { isAuthenticated, user, login, register, loading: authLoading, error: authError } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Find the selected service
  const service = catalog.find(s => s.id === serviceId);

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

  // Authentication Fields (for inline auth)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // login or signup

  // Booking result states
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

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
    }
    // Set default date to today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, [isAuthenticated, user]);

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

    // Verification check for authentication
    if (!isAuthenticated) {
      if (authMode === 'login') {
        const res = await login(authEmail, authPassword);
        if (!res.success) return;
      } else {
        const res = await register(authEmail, authPassword, fullName, phone, 'USER');
        if (!res.success) return;
      }
    }

    // Format 24h time to 12h readable time slot
    let timeLabel = selectedSlot;
    try {
      const [hours, minutes] = selectedSlot.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHr = h % 12 || 12;
      timeLabel = `${formattedHr}:${minutes} ${ampm}`;
    } catch(err) {}

    const payload = {
      items: [{ serviceId: service.id, quantity: qty, variant: service.name === 'House Painting' ? variant : null }],
      pincode: pincode,
      address: `${address} | Landmark: ${landmark} | City: ${city} | Notes: ${notes} | Instructions: ${specialInstructions} | HasPet: ${hasPet ? 'YES' : 'NO'} | Parking: ${parkingAvailable ? 'YES' : 'NO'}`,
      scheduledAt: new Date(selectedDate),
      timeSlot: timeLabel,
      phone,
      paymentMethod: 'CASH',
      totalPrice: getServicePrice(),
      discountApplied: 0.0,
      finalPrice: getFinalTotal()
    };

    const res = await createBooking(payload);
    if (res.success) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 9);
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      let hrs = now.getHours() % 12;
      hrs = hrs ? hrs : 12;
      const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();

      setBookingId(res.booking.id.substring(0, 8).toUpperCase());
      setArrivalTime(`${hrs}:${mins} ${ampm} (Instant 9-Mins dispatch active)`);
      addNotification('Service Booking Successful!', `Reference #${res.booking.id.substring(0,8).toUpperCase()} placed. Pay cash after service.`);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {isSuccess ? (
          // Success view after booking confirm
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 sm:p-10 text-center space-y-8 animate-blur-fade-in w-full">
            <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mx-auto animate-bounce shadow-xs">
              <CheckCircle className="w-9 h-9 fill-current text-brand" />
            </div>

            <div className="space-y-1">
              <h3 className="font-poppins font-black text-xl text-slate-800 tracking-tight">Booking Dispatched!</h3>
              <p className="text-xs text-slate-400 font-semibold font-poppins">Reference Order ID: #{bookingId}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2.5 text-xs leading-normal shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Service Assigned:</span>
                <span className="font-extrabold text-slate-700">{service.name} (x{qty})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated Arrival:</span>
                <span className="font-extrabold text-brand bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded animate-pulse">{arrivalTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Professional Status:</span>
                <span className="font-extrabold text-slate-700 bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Assigning Expert</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 pt-2.5 font-poppins font-black text-slate-800 text-sm leading-none">
                <span>Total Cash Due:</span>
                <span>Rs. {getFinalTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-2.5">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md shadow-brand/10 transition-all"
              >
                Track Booking (Dashboard)
              </button>
              <a
                href={`https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20want%20to%20query%20my%20booking%20Ref%20%23${bookingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 font-poppins font-black text-xs py-3.5 rounded-xl uppercase tracking-wider text-center block transition-all"
              >
                WhatsApp Support Chat
              </a>
              <button
                onClick={() => navigate('/services')}
                className="w-full bg-transparent hover:bg-slate-50 border border-slate-200 text-slate-600 font-poppins font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all"
              >
                Back to Catalog
              </button>
            </div>
          </div>
        ) : (
          // Main Advanced Checkout form wrapped inside highly transparent floating glassmorphic container card
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

            {/* Section 5: Authentication (for guest checkout verification) */}
            {!isAuthenticated && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 animate-blur-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-poppins font-black text-[10px] uppercase tracking-wider text-slate-800 flex items-center">
                    <Lock className="w-4 h-4 text-brand mr-1.5" /> Verification Gate
                  </h3>
                </div>

                {authError && (
                  <div className="text-[9.5px] bg-red-50 border border-red-100 text-red-500 p-2.5 rounded-lg font-bold">
                    ⚠️ {authError}
                  </div>
                )}

                {authMode === 'login' ? (
                  <div className="space-y-3">
                    <div className="form-group">
                      <input 
                        type="email" 
                        id="authEmail"
                        className="form-input" 
                        placeholder=" " 
                        value={authEmail} 
                        onChange={e => setAuthEmail(e.target.value)} 
                        required 
                      />
                      <label htmlFor="authEmail" className="form-label">Email</label>
                    </div>
                    <div className="form-group">
                      <input 
                        type="password" 
                        id="authPassword"
                        className="form-input" 
                        placeholder=" " 
                        value={authPassword} 
                        onChange={e => setAuthPassword(e.target.value)} 
                        required 
                      />
                      <label htmlFor="authPassword" className="form-label">Password</label>
                    </div>

                    <div className="text-center pt-1">
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('signup')}
                        className="text-[10px] text-brand hover:underline font-bold"
                      >
                        New to JK Enterprises? Sign Up →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="form-group">
                      <input 
                        type="email" 
                        id="authEmail"
                        className="form-input" 
                        placeholder=" " 
                        value={authEmail} 
                        onChange={e => setAuthEmail(e.target.value)} 
                        required 
                      />
                      <label htmlFor="authEmail" className="form-label">Email</label>
                    </div>
                    <div className="form-group">
                      <input 
                        type="password" 
                        id="authPassword"
                        className="form-input" 
                        placeholder=" " 
                        value={authPassword} 
                        onChange={e => setAuthPassword(e.target.value)} 
                        required 
                      />
                      <label htmlFor="authPassword" className="form-label">Password</label>
                    </div>

                    <div className="text-center pt-1">
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('login')}
                        className="text-[10px] text-brand hover:underline font-bold"
                      >
                        Already verified? Log In here →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  Pay cash/UPI directly after service. Secure dispatch locked.
                </span>
              </div>

              {/* Confirm Button */}
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-lg shadow-brand/10 flex items-center justify-center space-x-1.5 transition-all duration-300"
              >
                <span>{authLoading ? 'Verifying Details...' : 'Confirm Booking & Dispatch'}</span>
                <CheckCircle className="w-4.5 h-4.5 text-white" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
