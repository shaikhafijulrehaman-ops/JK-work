import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User, Phone, MapPin, ChevronLeft, CheckCircle, 
  ChevronRight, Key, ShieldCheck, Compass, AlertTriangle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Valid Bangalore Service Zones
const SERVICE_ZONES = [
  { name: 'Nagasandra', pincode: '560073' },
  { name: 'Bagalagunte', pincode: '560073' },
  { name: 'Anchepalya', pincode: '560073' },
  { name: 'Peenya Industrial Area', pincode: '560058' },
  { name: 'Peenya', pincode: '560058' },
  { name: 'Madavara', pincode: '562123' },
  { name: 'Chikkabidarakallu', pincode: '560073' },
  { name: 'Doddabidarakallu', pincode: '560073' }
];

export default function CustomerSignup({ onBack }) {
  const { register, sendOtp, simulatedOtp, otpSent, loading, joinWaitlist } = useAuthStore();
  const navigate = useNavigate();

  // Onboarding Step State:
  // 1: Mobile Verification, 2: Basic Details, 3: Service Location, 4: Availability Check, 5: Create Account
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Form Field States
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI/UX Visual Helper States
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [isLocating, setIsLocating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Password Validation States
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber && hasSpecialChar;

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  // Dynamic header titles based on step
  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Verify Phone';
      case 2: return 'Basic Details';
      case 3: return 'Service Area';
      case 4: return 'Service Status';
      case 5: return 'Create Password';
      default: return 'Sign Up';
    }
  };

  // Navigate Steps with custom directions for slide animations
  const nextStep = () => {
    setDirection(1);
    setStep(prev => prev + 1);
    setErrorMsg('');
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
    setErrorMsg('');
  };

  // STEP 1 Actions: OTP dispatch & verify
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const sent = await sendOtp(phone);
    if (sent) {
      setOtpCountdown(30);
      setSuccessToast('Verification code dispatched!');
      setTimeout(() => setSuccessToast(''), 3000);
    } else {
      setErrorMsg('Failed to send verification code. Try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsVerifyingOtp(true);

    if (otpCode && otpCode.length === 6) {
      setTimeout(() => {
        setIsVerifyingOtp(false);
        setSuccessToast('Phone verified successfully! ✨');
        setTimeout(() => {
          setSuccessToast('');
          nextStep();
        }, 1000);
      }, 1200);
    } else {
      setIsVerifyingOtp(false);
      setErrorMsg('Please enter a valid 6-digit verification code.');
    }
  };

  // STEP 2 Action: Validate Basic Details
  const handleBasicDetails = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    nextStep();
  };

  // STEP 3 Action: Geolocation & Pincode Lookup
  const handleAutoDetectLocation = () => {
    setErrorMsg('');
    setIsLocating(true);
    
    // Simulate high precision GPS locator sweep
    setTimeout(() => {
      const randomZone = SERVICE_ZONES[2]; // Anchepalya
      setPincode(randomZone.pincode);
      setServiceArea(randomZone.name);
      setIsLocating(false);
      setSuccessToast('GPS Lock: Anchepalya (560073)');
      setTimeout(() => setSuccessToast(''), 2500);
    }, 1800);
  };

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pincode) {
      setErrorMsg('Please enter your pincode.');
      return;
    }
    if (!serviceArea) {
      setErrorMsg('Please select your service area.');
      return;
    }

    nextStep();
  };

  // STEP 4 Checks: Service Availability Routing
  const selectedZoneData = SERVICE_ZONES.find(
    z => z.name.toLowerCase() === serviceArea.toLowerCase() && z.pincode === pincode
  );
  
  const isServiceAvailable = !!selectedZoneData && serviceArea !== 'Other / Not Listed';

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const result = await joinWaitlist(name, phone, email || 'no-email@waitlist.com', serviceArea, pincode);
    if (result.success) {
      setSuccessToast('Successfully joined the waitlist! 🎉');
      setTimeout(() => {
        setSuccessToast('');
        onBack(); // Go back to selector
      }, 2000);
    } else {
      setErrorMsg('Failed to join waitlist. Please try again.');
    }
  };

  // STEP 5: Final Account Creation & Confetti login
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordStrong) {
      setErrorMsg('Password must satisfy all security rules.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const result = await register(
        email || `${phone}@jkenterprises.com`,
        password,
        name,
        phone,
        'USER',
        { pincode, serviceArea }
      );

      if (result.success) {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          navigate('/services');
        }, 3000);
      } else {
        setErrorMsg(result.error || 'Account creation failed. Please check the console for details.');
      }
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during account creation.');
    }
  };

  // Stepper Header Components
  const stepsMeta = [
    { num: 1, label: 'Verify' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Location' },
    { num: 4, label: 'Availability' },
    { num: 5, label: 'Register' }
  ];

  // Framer Motion Animation Variants for card sliders
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.15 }
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.12 }
      }
    })
  };

  return (
    <div className="w-full flex flex-col h-full bg-transparent text-left relative overflow-x-hidden pt-8 pb-4 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Header Sticky Navigation with Proper Safe Padding and Step title */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-20 pt-4 pb-3 border-b border-slate-100 select-none">
        <div className="flex items-center">
          <button 
            onClick={step === 1 ? onBack : prevStep} 
            type="button" 
            className="p-1.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors mr-2.5 border border-slate-200/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h3 className="font-poppins font-black text-sm text-slate-950 leading-tight">{getStepTitle()}</h3>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              Step {step} of 5 • Onboarding
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Horizontal Progress Indicator */}
      <div className="mb-5 px-1 select-none">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand to-teal-400"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / (stepsMeta.length - 1)) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          {stepsMeta.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center z-10 relative">
                <motion.div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-poppins font-black text-[9px] border transition-all ${
                    isCompleted 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : isActive 
                        ? 'bg-brand text-white border-brand shadow-sm ring-4 ring-cyan-50' 
                        : 'bg-white text-slate-400 border-slate-200'
                  }`}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  {isCompleted ? '✓' : s.num}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Slider Container with Hidden Scrollbars */}
      <div className="flex-1 relative flex flex-col justify-between [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex-grow flex flex-col justify-between [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* ==================== STEP 1: MOBILE VERIFICATION ==================== */}
            {step === 1 && (
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col h-full justify-between text-left relative overflow-hidden select-none">
                <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div>
                    <h4 className="font-poppins font-extrabold text-base text-slate-900 leading-tight">Verify Mobile Number</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1 font-semibold">
                      Enter your mobile number to get started. We will send a secure validation passcode.
                    </p>
                  </div>

                  {!otpSent ? (
                    <div className="form-group relative mt-2">
                      <input 
                        type="tel" 
                        maxLength={10}
                        className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all pr-12 text-sm" 
                        placeholder="Mobile Number" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                        required 
                      />
                      <label className="form-label flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Mobile Number
                      </label>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        +91
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-2">
                      <div className="p-3 bg-cyan-50/50 border border-brand/10 rounded-2xl flex items-center space-x-3">
                        <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
                        <span className="text-[10.5px] text-slate-600 font-bold">
                          OTP Sent successfully to <strong className="text-slate-950">+91 {phone}</strong>
                        </span>
                      </div>

                      <div className="form-group">
                        <input 
                          type="text" 
                          maxLength={6}
                          className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 text-center font-black tracking-widest transition-all text-sm" 
                          placeholder="6-Digit OTP Code" 
                          value={otpCode} 
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                          required 
                        />
                        <label className="form-label flex items-center justify-center space-x-1 w-full text-center">
                          <Key className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Enter 6-Digit OTP Code
                        </label>
                      </div>

                      <div className="flex justify-between items-center px-1 text-[10.5px] font-extrabold text-slate-400">
                        {otpCountdown > 0 ? (
                          <span>Resend code in <strong className="text-brand font-black">{otpCountdown}s</strong></span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={handleSendOtp}
                            className="text-brand hover:underline font-black"
                          >
                            Resend Code
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => { setPhone(''); useAuthStore.setState({ otpSent: false }); }}
                          className="hover:text-slate-600 font-black"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky bottom CTA button */}
                <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                  <button 
                    type="submit" 
                    disabled={loading || isVerifyingOtp}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest flex items-center justify-center space-x-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Verifying...</span>
                      </>
                    ) : loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>{otpSent ? 'Verify & Continue' : 'Verify Mobile'}</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ==================== STEP 2: BASIC DETAILS ==================== */}
            {step === 2 && (
              <form onSubmit={handleBasicDetails} className="flex flex-col h-full justify-between text-left relative overflow-hidden select-none">
                <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div>
                    <h4 className="font-poppins font-extrabold text-base text-slate-900 leading-tight">Basic Details</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1 font-semibold">
                      Please enter your name and email address to customize your home service requests.
                    </p>
                  </div>

                  <div className="form-group mt-2">
                    <input 
                      type="text" 
                      className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all text-sm" 
                      placeholder="Full Name" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Full Name
                    </label>
                  </div>

                  <div className="form-group">
                    <input 
                      type="email" 
                      className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all text-sm" 
                      placeholder="Email Address" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Email Address (Optional)
                    </label>
                  </div>
                </div>

                {/* Sticky bottom CTA button */}
                <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest flex items-center justify-center space-x-1"
                  >
                    <span>Proceed to Location</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ==================== STEP 3: SERVICE LOCATION ==================== */}
            {step === 3 && (
              <form onSubmit={handleLocationSubmit} className="flex flex-col h-full justify-between text-left relative overflow-hidden select-none">
                <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div>
                    <h4 className="font-poppins font-extrabold text-base text-slate-900 leading-tight">Service Area</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1 font-semibold">
                      Provide your area pincode and select from our supported regions in Bangalore.
                    </p>
                  </div>

                  <div className="flex space-x-2 mt-2">
                    <div className="form-group flex-1">
                      <input 
                        type="text" 
                        maxLength={6}
                        className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all text-sm" 
                        placeholder="Pincode" 
                        value={pincode} 
                        onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} 
                        required 
                      />
                      <label className="form-label flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Pincode
                      </label>
                    </div>

                    <button 
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isLocating}
                      className="px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-brand font-black text-[10px] uppercase tracking-wider select-none h-[46px] mt-0.5"
                    >
                      {isLocating ? (
                        <Compass className="w-3.5 h-3.5 animate-spin text-brand mr-1" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-brand mr-1" />
                      )}
                      {isLocating ? 'Locating...' : 'Auto Detect'}
                    </button>
                  </div>

                  <div className="form-group relative">
                    <select
                      className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all appearance-none pr-8 cursor-pointer text-sm"
                      value={serviceArea}
                      onChange={e => {
                        setServiceArea(e.target.value);
                        const zone = SERVICE_ZONES.find(z => z.name === e.target.value);
                        if (zone) setPincode(zone.pincode);
                      }}
                      required
                    >
                      <option value="" disabled hidden>Choose Service Area</option>
                      {SERVICE_ZONES.map(zone => (
                        <option key={zone.name} value={zone.name}>{zone.name}</option>
                      ))}
                      <option value="Other / Not Listed">Other / Not Listed</option>
                    </select>
                    <label className="form-label flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Service Area
                    </label>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none border-l pl-2 text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Sticky bottom CTA button */}
                <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest flex items-center justify-center space-x-1"
                  >
                    <span>Check Service Area</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ==================== STEP 4: SERVICE AVAILABILITY CHECK ==================== */}
            {step === 4 && (
              <div className="flex flex-col h-full justify-between text-left relative overflow-hidden select-none">
                {isServiceAvailable ? (
                  /* --- AVAILABLE HAPPY FLOW --- */
                  <div className="flex flex-col h-full justify-between animate-scale-up">
                    <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle className="w-9 h-9 animate-bounce" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-poppins font-black text-base text-slate-900">✅ Great News!</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-[270px] mx-auto">
                          JK Enterprises services are fully active in <strong className="text-slate-950">{serviceArea}</strong>.
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left max-w-sm mx-auto shadow-inner space-y-1">
                        <h5 className="font-poppins font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Service Zone Parameters</h5>
                        <div className="text-xs text-slate-600 font-bold space-y-1 pt-1">
                          <p>📍 Sector: <span className="text-slate-900">{serviceArea}</span></p>
                          <p>📮 Pincode: <span className="text-slate-900">{pincode}</span></p>
                          <p>⚡ Status: <span className="text-emerald-600">Priority Active</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Sticky bottom CTA button */}
                    <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                      <button 
                        type="button" 
                        onClick={nextStep}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest flex items-center justify-center space-x-1"
                      >
                        <span>Continue Registration</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- UNAVAILABLE WAITLIST FLOW --- */
                  <form onSubmit={handleWaitlistSubmit} className="flex flex-col h-full justify-between animate-scale-up">
                    <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                        <div className="flex items-center space-x-2 text-amber-700">
                          <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                          <h4 className="font-poppins font-black text-xs uppercase tracking-wider leading-none">🚧 Not Available Yet</h4>
                        </div>
                        <p className="text-[10.5px] text-amber-800/80 leading-relaxed font-semibold">
                          We are currently not delivering in <strong className="text-slate-900">{serviceArea}</strong>. Join our priority waitlist below to get notified when we launch nearby!
                        </p>
                      </div>

                      <div className="text-left mt-1 space-y-3">
                        <h5 className="font-poppins font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Waitlist Fields</h5>
                        
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-bold text-sm" 
                            placeholder="Name" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                          />
                          <label className="form-label flex items-center space-x-1"><User className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Full Name</label>
                        </div>

                        <div className="form-group">
                          <input 
                            type="tel" 
                            className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-bold text-sm" 
                            placeholder="Mobile Number" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            required 
                          />
                          <label className="form-label flex items-center space-x-1"><Phone className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Mobile Number</label>
                        </div>

                        <div className="form-group">
                          <input 
                            type="email" 
                            className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-bold text-sm" 
                            placeholder="Email Address" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                          />
                          <label className="form-label flex items-center space-x-1"><Mail className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Email Address</label>
                        </div>
                      </div>
                    </div>

                    {/* Sticky bottom CTA buttons */}
                    <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex space-x-2.5">
                      <button 
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-poppins font-black text-xs transition-colors uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest"
                      >
                        {loading ? 'Joining waitlist...' : 'Join Priority Waitlist'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ==================== STEP 5: CREATE ACCOUNT ==================== */}
            {step === 5 && (
              <form onSubmit={handleCreateAccount} className="flex flex-col h-full justify-between text-left relative overflow-hidden select-none">
                <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div>
                    <h4 className="font-poppins font-extrabold text-base text-slate-900 leading-tight">Create Password</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1 font-semibold">
                      Choose a secure account credentials to complete registration.
                    </p>
                  </div>

                  <div className="form-group mt-2">
                    <input 
                      type="password" 
                      className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all text-sm" 
                      placeholder="Password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Password
                    </label>
                  </div>

                  {/* Compact Password Conditions Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[8.5px] font-bold text-slate-500 bg-slate-50/80 p-2 rounded-xl border border-slate-100/80 select-none">
                    <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${hasMinLength ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span>8+ Chars</span>
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${hasLetter ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span>Letter</span>
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${hasNumber ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span>Number</span>
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded ${hasSpecialChar ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span>Symbol</span>
                    </span>
                  </div>

                  <div className="form-group">
                    <input 
                      type="password" 
                      className="form-input bg-white/60 border border-slate-200 focus:bg-white text-slate-950 font-bold transition-all text-sm" 
                      placeholder="Confirm Password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Confirm Password
                    </label>
                  </div>
                </div>

                {/* Sticky bottom CTA button */}
                <div className="pt-3 pb-1 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                  <button 
                    type="submit" 
                    disabled={loading || !isPasswordStrong || password !== confirmPassword}
                    className="w-full bg-gradient-to-r from-brand-navy via-brand-dark to-brand hover:opacity-95 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-md transition-all uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? 'Registering Account...' : 'Complete Onboarding'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Interactive Toast Alert */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-4 right-4 z-50 p-3 bg-slate-900 text-white font-poppins font-black text-xs rounded-2xl flex items-center space-x-2.5 shadow-xl justify-center max-w-sm mx-auto"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern validation error messages without developer/technical terms */}
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-500 text-[10px] font-extrabold text-center mt-3 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl animate-shake select-none"
        >
          {errorMsg}
        </motion.div>
      )}

      {/* ==================== PREMIUM SUCCESS FULL-SCREEN CELEBRATION ==================== */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-center p-6 select-none"
          >
            {/* Custom Confetti Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => {
                const colors = ['bg-cyan-400', 'bg-teal-400', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400'];
                const color = colors[i % colors.length];
                return (
                  <motion.div
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full ${color}`}
                    initial={{ x: '50vw', y: '50vh', scale: 0.5 }}
                    animate={{ 
                      x: `${Math.random() * 100}vw`, 
                      y: `${Math.random() * 100}vh`, 
                      scale: [0.5, 1.2, 0.6], 
                      rotate: Math.random() * 360 
                    }}
                    transition={{ 
                      duration: 2.2 + Math.random() * 1.5, 
                      repeat: Infinity,
                      ease: 'easeOut' 
                    }}
                  />
                );
              })}
            </div>

            <motion.div 
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="premium-glass-card p-8 rounded-[2.5rem] border border-white/20 bg-white/10 text-white max-w-sm w-full shadow-2xl relative z-10"
            >
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md mb-6 relative">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-slate-700"
                  animate={{ scale: [1, 1.25, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
              </div>

              <h3 className="font-poppins font-black text-xl tracking-wide mb-2">Welcome to JK!</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold mb-6">
                Your account is ready. Redirecting you to access premium home services.
              </p>

              <div className="inline-flex items-center space-x-1.5 bg-slate-900/60 border border-slate-700/50 rounded-full px-4 py-1.5 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Logging in...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
