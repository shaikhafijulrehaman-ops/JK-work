import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, User, Phone, CheckCircle, PhoneCall, Key } from 'lucide-react';
import AuthSignupFlow from '../components/auth/AuthSignupFlow';

export default function Auth() {
  const { login, register, sendOtp, verifyOtp, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const [isActive, setIsActive] = useState(false); // Controls sliding card trigger
  const [useOtp, setUseOtp] = useState(false); // Toggle email vs OTP login
  const [otpSent, setOtpSent] = useState(false);

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('USER'); // USER or WORKER
  const [otpCode, setOtpCode] = useState('');

  const [msg, setMsg] = useState(null);
  const [localErr, setLocalErr] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState(null); // PENDING, UNDER_REVIEW, REJECTED

  // Handles Email Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    setPartnerStatus(null);
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'ADMIN') navigate('/admin');
      else if (res.user.role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/services');
    } else {
      if (res.approvalStatus) {
        setPartnerStatus({
          status: res.approvalStatus,
          message: res.error,
          name: res.workerName || 'Partner'
        });
      } else {
        setLocalErr(res.error);
      }
    }
  };

  // Handles Registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    if (!phone || phone.length < 10) {
      setLocalErr('Please enter a valid 10-digit phone number.');
      return;
    }
    const res = await register(regEmail, regPassword, name, phone, regRole);
    if (res.success) {
      if (res.user.role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/services');
    } else {
      setLocalErr(res.error);
    }
  };

  // Handles Phone OTP Login dispatch
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    if (!phone) {
      setLocalErr('Please provide your phone number.');
      return;
    }
    const sent = await sendOtp(phone);
    if (sent) {
      setOtpSent(true);
      setMsg('Simulated OTP code dispatched successfully! Check developer console or use mock validation.');
    } else {
      setLocalErr('Failed to send OTP.');
    }
  };

  // Handles OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    const res = await verifyOtp(phone, otpCode);
    if (res.success) {
      navigate('/services');
    } else {
      setLocalErr(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-4 font-inter">
      
      {/* ==================== DESKTOP LAYOUT (Hidden on Mobile) ==================== */}
      <div 
        className={`hidden md:block auth-container relative overflow-hidden bg-white w-[768px] max-w-full min-h-[520px] rounded-xl shadow-2xl transition-all duration-600 ease-in-out ${isActive ? 'active' : ''}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)'
        }}
      >
        
        {/* ==================== SIGN UP COMPONENT ==================== */}
        <div className="absolute top-0 left-0 w-1/2 h-full transition-all duration-600 ease-in-out sign-up-container opacity-0 z-1 pointer-events-none">
          <div className="h-full bg-white">
            <AuthSignupFlow />
          </div>
        </div>

        {/* ==================== SIGN IN COMPONENT ==================== */}
        <div className="absolute top-0 left-0 w-1/2 h-full transition-all duration-600 ease-in-out sign-in-container z-2 pointer-events-auto">
          {!useOtp ? (
            /* Email / Password Form */
            <form onSubmit={handleSignIn} className="flex flex-col items-center justify-center h-full px-10 bg-white text-center">
              <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-wide mb-1">
                Sign In
              </h2>
              <p className="text-xs text-slate-400 mb-4">Enter your credentials to book services</p>

              {/* Social Logins */}
              <div className="flex space-x-3 mb-4">
                <button type="button" className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.72 5.72 0 0 1 8.2 11.8a5.72 5.72 0 0 1 5.79-5.7 5.66 5.66 0 0 1 4.07 1.68l2.5-2.4a9.124 9.124 0 0 0-6.57-2.78 9.2 9.2 0 0 0-9.2 9.2 9.2 9.2 0 0 0 9.2 9.2c5.03 0 9.1-3.6 9.1-9.2a8.67 8.67 0 0 0-.17-1.84Z"/>
                  </svg>
                </button>
                <button type="button" className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75Z"/>
                  </svg>
                </button>
                <button type="button" className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/>
                  </svg>
                </button>
              </div>

              <div className="w-full space-y-3 px-2 mb-2">
                <div className="form-group">
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required 
                  />
                  <label className="form-label flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address
                  </label>
                </div>

                <div className="form-group">
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required 
                  />
                  <label className="form-label flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
                  </label>
                </div>
              </div>

              {partnerStatus && (
                <div className="bg-amber-50 border border-amber-200 text-slate-700 p-4 rounded-xl text-left space-y-2 mb-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-poppins font-bold text-xs text-slate-800">Hello, {partnerStatus.name}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${partnerStatus.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : partnerStatus.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {partnerStatus.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">{partnerStatus.message}</p>
                  <p className="text-[9px] text-slate-400 font-medium">JK Enterprises manual approval is required before logging into the partner console.</p>
                </div>
              )}

              {localErr && <div className="text-red-500 text-[10px] font-semibold mb-2">{localErr}</div>}

              <div className="flex items-center justify-between w-full px-2 mb-4 text-[10px] font-semibold text-slate-500">
                <button type="button" onClick={() => setUseOtp(true)} className="text-brand hover:underline flex items-center space-x-0.5">
                  <PhoneCall className="w-3 h-3" /> <span>Login with OTP</span>
                </button>
                <span className="cursor-pointer hover:text-slate-800">Forgot password?</span>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-navy to-brand text-white font-poppins font-bold text-xs py-3 rounded-lg hover:shadow-lg hover:shadow-brand/20 transition-all tracking-wider uppercase disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* OTP SMS Login Form */
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col items-center justify-center h-full px-10 bg-white text-center">
              <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-wide mb-1">
                OTP Verification
              </h2>
              <p className="text-xs text-slate-400 mb-6">Verify your phone to check bookings</p>

              <div className="w-full space-y-4 px-2 mb-2">
                {!otpSent ? (
                  <div className="form-group">
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="Phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 inline mr-1" /> Mobile Number
                    </label>
                  </div>
                ) : (
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="OTP Code"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      required 
                    />
                    <label className="form-label flex items-center space-x-1">
                      <Key className="w-3.5 h-3.5 inline mr-1" /> OTP Code (Console log)
                    </label>
                  </div>
                )}
              </div>

              {localErr && <div className="text-red-500 text-[10px] font-semibold mb-2">{localErr}</div>}
              {msg && <div className="text-green-600 text-[10px] font-semibold mb-2 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" /> {msg}</div>}

              <div className="flex items-center justify-between w-full px-2 mb-4 text-[10px] font-semibold text-slate-500">
                <button type="button" onClick={() => { setUseOtp(false); setOtpSent(false); setMsg(null); }} className="text-brand hover:underline">
                  Sign In with Password
                </button>
                {otpSent && <span className="cursor-pointer hover:text-slate-800" onClick={handleSendOtp}>Resend code</span>}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-navy to-brand text-white font-poppins font-bold text-xs py-3 rounded-lg hover:shadow-lg hover:shadow-brand/20 transition-all tracking-wider uppercase"
              >
                {otpSent ? 'Verify OTP' : 'Send Code'}
              </button>
            </form>
          )}
        </div>

        {/* ==================== DUAL ACTION SLIDING OVERLAY ==================== */}
        <div 
          className="absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 ease-in-out overlay-container z-100"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div 
            className="relative -left-full h-full w-[200%] transform translate-x-0 transition-all duration-600 ease-in-out overlay bg-gradient-to-r from-brand-navy to-brand text-white"
          >
            
            {/* Left Overlay panel (Visible on register state) */}
            <div className="absolute top-0 flex flex-col items-center justify-center h-full w-1/2 px-10 text-center transform translate-x-[-20%] transition-all duration-600 ease-in-out overlay-left">
              <h1 className="font-poppins font-extrabold text-3xl mb-3 tracking-wide">
                Welcome Back!
              </h1>
              <p className="text-xs text-white/80 leading-relaxed max-w-[240px] mb-8 font-inter">
                Already registered at JK Enterprises? Sign in with your account parameters.
              </p>
              <button 
                type="button"
                onClick={() => { setIsActive(false); setLocalErr(null); }}
                className="border-2 border-white/40 hover:border-white/80 text-white font-poppins font-bold text-[10px] px-8 py-3 rounded-lg hover:bg-white hover:text-brand transition-all tracking-wider uppercase"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay panel (Visible on login state) */}
            <div className="absolute top-0 right-0 flex flex-col items-center justify-center h-full w-1/2 px-10 text-center transform translate-x-0 transition-all duration-600 ease-in-out overlay-right">
              <h1 className="font-poppins font-extrabold text-3xl mb-3 tracking-wide">
                Hey There!
              </h1>
              <p className="text-xs text-white/80 leading-relaxed max-w-[240px] mb-8 font-inter">
                Need professional baby care, shifting, cleaning, or electrical repair in Anchepalya?
              </p>
              <button 
                type="button"
                onClick={() => { setIsActive(true); setLocalErr(null); }}
                className="border-2 border-white/40 hover:border-white/80 text-white font-poppins font-bold text-[10px] px-8 py-3 rounded-lg hover:bg-white hover:text-brand transition-all tracking-wider uppercase"
              >
                Sign Up
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ==================== MOBILE LAYOUT (Stacked, Premium UI) ==================== */}
      <div className="block md:hidden w-full min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden relative">
        
        {/* Liquid Morph SVG Waves (Ice Cream Melt Effect) */}
        <div className="absolute top-0 left-0 right-0 h-[38vh] z-0 select-none pointer-events-none drop-shadow-2xl">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mob-grad-back" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#081820" />
                <stop offset="100%" stopColor="#044d5d" />
              </linearGradient>
              <linearGradient id="mob-grad-front" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a212c" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            {/* Background rippling path */}
            <motion.path
              d={isActive ? "M 0 0 L 100 0 L 100 94 Q 60 104 30 94 T 0 98 Z" : "M 0 0 L 100 0 L 100 79 Q 60 89 30 75 T 0 83 Z"}
              fill="url(#mob-grad-back)"
              animate={{ d: isActive ? "M 0 0 L 100 0 L 100 94 Q 60 104 30 94 T 0 98 Z" : "M 0 0 L 100 0 L 100 79 Q 60 89 30 75 T 0 83 Z" }}
              transition={{ type: "spring", stiffness: 35, damping: 11, mass: 1.1 }}
            />
            {/* Foreground organic morphing path */}
            <motion.path
              d={isActive ? "M 0 0 L 100 0 L 100 88 Q 40 99 70 89 T 0 93 Z" : "M 0 0 L 100 0 L 100 73 Q 40 85 70 71 T 0 77 Z"}
              fill="url(#mob-grad-front)"
              animate={{ d: isActive ? "M 0 0 L 100 0 L 100 88 Q 40 99 70 89 T 0 93 Z" : "M 0 0 L 100 0 L 100 73 Q 40 85 70 71 T 0 77 Z" }}
              transition={{ type: "spring", stiffness: 45, damping: 9, mass: 0.95 }}
            />
          </svg>
        </div>

        {/* 1. TOP SECTION: Premium Branding/Welcome Panel */}
        <div className="h-[32vh] min-h-[220px] w-full flex flex-col justify-center items-center px-6 text-center relative z-10 select-none">
          {/* Logo Icon with Floating Effect */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand to-brand-light flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 animate-float">
            <span className="font-poppins font-extrabold text-xl text-white">JK</span>
          </div>

          {/* Dynamic Welcomes with Morph Dissolve */}
          <AnimatePresence mode="wait">
            {!isActive ? (
              <motion.div
                key="mob-login-welcome"
                initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="space-y-1.5"
              >
                <h1 className="font-poppins font-extrabold text-3xl text-white tracking-tight leading-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-cyan-200/80 max-w-[280px] mx-auto font-medium leading-relaxed">
                  Your trusted home services, just a tap away.
                </p>
                <div className="inline-flex items-center space-x-1.5 bg-cyan-950/60 border border-cyan-800/50 rounded-full px-3 py-1 mt-2 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">Anchepalya in 9 Mins</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mob-signup-welcome"
                initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="space-y-1.5"
              >
                <h1 className="font-poppins font-extrabold text-3xl text-white tracking-tight leading-tight">
                  Join Us Today
                </h1>
                <p className="text-xs text-cyan-200/80 max-w-[280px] mx-auto font-medium leading-relaxed">
                  Register to book premium services instantly.
                </p>
                <div className="inline-flex items-center space-x-1.5 bg-cyan-950/60 border border-cyan-800/50 rounded-full px-3 py-1 mt-2 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">Quick Onboarding</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. BOTTOM SECTION: Forms inside Glassmorphic Liquid Morphing Card */}
        <motion.div 
          layout
          className="flex-grow w-full premium-glass-card rounded-t-[2.5rem] px-8 pt-8 pb-10 flex flex-col justify-between relative z-10 shadow-[0_-15px_40px_-15px_rgba(8,145,178,0.25)] overflow-hidden"
          transition={{ type: "spring", stiffness: 85, damping: 15 }}
        >
          {/* Gooey Liquid Blobs Behind the Frosted Glass */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none liquid-container opacity-40">
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-brand to-brand-light opacity-20 blur-3xl"
              animate={isActive ? { x: '120%', y: '50%', scale: 1.4 } : { x: '-20%', y: '10%', scale: 1 }}
              transition={{ type: 'spring', stiffness: 50, damping: 12 }}
            />
            <motion.div
              className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-[#0d9488] to-[#22d3ee] opacity-15 blur-3xl"
              animate={isActive ? { x: '-10%', y: '90%', scale: 1.1 } : { x: '130%', y: '70%', scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 45, damping: 10 }}
            />
          </div>

          <div className="w-full relative z-10">
            <AnimatePresence mode="wait">
              {!isActive ? (
                /* ==================== SIGN IN CONTAINER ==================== */
                <motion.div
                  key="mob-signin-form-block"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)', y: 20 }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)', y: -15 }}
                  transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                  className="w-full"
                >
                  <AnimatePresence mode="wait">
                    {!useOtp ? (
                      /* Email Login */
                      <motion.form
                        key="mob-email-login-form"
                        onSubmit={handleSignIn}
                        initial={{ opacity: 0, filter: 'blur(6px)', y: 15 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        exit={{ opacity: 0, filter: 'blur(6px)', y: -15 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="text-center mb-6">
                          <h3 className="font-poppins font-bold text-xl text-slate-900">Sign In</h3>
                          <p className="text-xs text-slate-600 font-medium">Enter your credentials to continue</p>
                        </div>

                        <div className="space-y-4 mb-4">
                          <div className="form-group">
                            <input 
                              type="email" 
                              className="form-input" 
                              placeholder="Email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              required 
                            />
                            <label className="form-label flex items-center space-x-1">
                              <Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address
                            </label>
                          </div>

                          <div className="form-group">
                            <input 
                              type="password" 
                              className="form-input" 
                              placeholder="Password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              required 
                            />
                            <label className="form-label flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
                            </label>
                          </div>
                        </div>

                        {partnerStatus && (
                          <div className="bg-amber-50 border border-amber-200 text-slate-700 p-4 rounded-xl text-left space-y-2 mb-4 animate-fade-in">
                            <div className="flex justify-between items-center">
                              <span className="font-poppins font-bold text-xs text-slate-800">Hello, {partnerStatus.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${partnerStatus.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : partnerStatus.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                {partnerStatus.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal font-medium">{partnerStatus.message}</p>
                            <p className="text-[9px] text-slate-400 font-medium">JK Enterprises manual approval is required before logging into the partner console.</p>
                          </div>
                        )}

                        {localErr && <div className="text-red-500 text-xs font-semibold text-center mb-4">{localErr}</div>}

                        <div className="flex items-center justify-between px-1 mb-6 text-xs font-bold text-slate-700">
                          <button type="button" onClick={() => setUseOtp(true)} className="text-brand-dark hover:underline flex items-center space-x-1">
                            <PhoneCall className="w-3.5 h-3.5 text-brand-dark" /> <span>Login with OTP</span>
                          </button>
                          <span className="cursor-pointer text-slate-600 hover:text-slate-900">Forgot password?</span>
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-brand-navy via-brand-dark to-brand text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-800/10 hover:shadow-brand/20 transition-all tracking-wider uppercase disabled:opacity-50"
                        >
                          {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                      </motion.form>
                    ) : (
                      /* OTP Login */
                      <motion.form
                        key="mob-otp-login-form"
                        onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                        initial={{ opacity: 0, filter: 'blur(6px)', y: 15 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        exit={{ opacity: 0, filter: 'blur(6px)', y: -15 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="text-center mb-6">
                          <h3 className="font-poppins font-bold text-xl text-slate-900">OTP SMS Login</h3>
                          <p className="text-xs text-slate-600 font-medium">Verify your phone to check bookings</p>
                        </div>

                        <div className="space-y-4 mb-4">
                          {!otpSent ? (
                            <div className="form-group">
                              <input 
                                type="tel" 
                                className="form-input" 
                                placeholder="Phone"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                required 
                              />
                              <label className="form-label flex items-center space-x-1">
                                <Phone className="w-3.5 h-3.5 inline mr-1" /> Mobile Number
                              </label>
                            </div>
                          ) : (
                            <div className="form-group">
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="OTP Code"
                                value={otpCode}
                                onChange={e => setOtpCode(e.target.value)}
                                required 
                              />
                              <label className="form-label flex items-center space-x-1">
                                <Key className="w-3.5 h-3.5 inline mr-1" /> OTP Code (Console log)
                              </label>
                            </div>
                          )}
                        </div>

                        {localErr && <div className="text-red-500 text-xs font-semibold text-center mb-4">{localErr}</div>}
                        {msg && <div className="text-green-600 text-xs font-semibold text-center mb-4 flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> {msg}</div>}

                        <div className="flex items-center justify-between px-1 mb-6 text-xs font-bold text-slate-700">
                          <button type="button" onClick={() => { setUseOtp(false); setOtpSent(false); setMsg(null); }} className="text-brand-dark hover:underline">
                            Sign In with Password
                          </button>
                          {otpSent && <span className="cursor-pointer text-slate-600 hover:text-slate-900" onClick={handleSendOtp}>Resend code</span>}
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-brand-navy via-brand-dark to-brand text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-800/10 hover:shadow-brand/20 transition-all tracking-wider uppercase disabled:opacity-50"
                        >
                          {otpSent ? 'Verify OTP' : 'Send Code'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                /* ==================== SIGN UP CONTAINER ==================== */
                <motion.div
                  key="mob-signup-form-block"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)', y: 20 }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)', y: -15 }}
                  transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                  className="w-full"
                >
                  <div className="min-h-[460px] flex flex-col justify-between scrollbar-none">
                    <AuthSignupFlow onCancel={() => { setIsActive(false); setLocalErr(null); }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social Logins and Onboarding Redirect */}
            <div className="mt-8 text-center space-y-5">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200/80"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-200/80"></div>
              </div>

              <div className="flex justify-center space-x-4">
                <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-600 shadow-sm transition-all active:scale-95">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.72 5.72 0 0 1 8.2 11.8a5.72 5.72 0 0 1 5.79-5.7 5.66 5.66 0 0 1 4.07 1.68l2.5-2.4a9.124 9.124 0 0 0-6.57-2.78 9.2 9.2 0 0 0-9.2 9.2 9.2 9.2 0 0 0 9.2 9.2c5.03 0 9.1-3.6 9.1-9.2a8.67 8.67 0 0 0-.17-1.84Z"/>
                  </svg>
                </button>
                <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white/90 hover:bg-white text-slate-600 shadow-sm transition-all active:scale-95">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-9.3 8-4.96 8-9.75Z"/>
                  </svg>
                </button>
              </div>

              {/* Toggle Sign In / Sign Up Link */}
              <div className="text-xs font-bold text-slate-700 pt-2">
                {!isActive ? (
                  <p>
                    New here?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setIsActive(true); setLocalErr(null); }} 
                      className="text-brand-dark hover:underline font-extrabold"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setIsActive(false); setLocalErr(null); }} 
                      className="text-brand-dark hover:underline font-extrabold"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
