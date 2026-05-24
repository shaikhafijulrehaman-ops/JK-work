import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, User, Phone, CheckCircle, PhoneCall, Key } from 'lucide-react';

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

  // Handles Email Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'ADMIN') navigate('/admin');
      else if (res.user.role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/services');
    } else {
      setLocalErr(res.error);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
      {/* Dynamic Sliding Auth Panel */}
      <div 
        className={`auth-container relative overflow-hidden bg-white w-[768px] max-w-full min-h-[520px] rounded-xl shadow-2xl transition-all duration-600 ease-in-out ${isActive ? 'active' : ''}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)'
        }}
      >
        
        {/* ==================== SIGN UP COMPONENT ==================== */}
        <div className="absolute top-0 left-0 w-1/2 h-full transition-all duration-600 ease-in-out sign-up-container opacity-0 z-1 pointer-events-none">
          <form onSubmit={handleSignUp} className="flex flex-col items-center justify-center h-full px-10 bg-white text-center">
            <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-wide mb-1">
              Create Account
            </h2>
            <p className="text-xs text-slate-400 mb-4">Register to book instant home services</p>

            {/* Social logins */}
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

            {/* Registration Form inputs */}
            <div className="w-full space-y-3 px-2">
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
                <label className="form-label flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 inline mr-1" /> Full Name
                </label>
              </div>

              <div className="form-group">
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Email Address"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required 
                />
                <label className="form-label flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address
                </label>
              </div>

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
                  <Phone className="w-3.5 h-3.5 inline mr-1" /> Phone (Anchepalya verification)
                </label>
              </div>

              <div className="form-group">
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required 
                />
                <label className="form-label flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Password
                </label>
              </div>

              {/* User vs Worker Registration Role Select */}
              <div className="flex items-center justify-center space-x-4 mb-4 text-xs font-semibold">
                <span className="text-slate-500">I want to register as:</span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                  <input 
                    type="radio" 
                    name="role" 
                    value="USER" 
                    checked={regRole === 'USER'}
                    onChange={() => setRegRole('USER')}
                    className="text-brand focus:ring-brand w-3.5 h-3.5"
                  />
                  <span>Customer</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                  <input 
                    type="radio" 
                    name="role" 
                    value="WORKER"
                    checked={regRole === 'WORKER'}
                    onChange={() => setRegRole('WORKER')}
                    className="text-brand focus:ring-brand w-3.5 h-3.5"
                  />
                  <span className="text-brand">Service Worker</span>
                </label>
              </div>
            </div>

            {localErr && <div className="text-red-500 text-[10px] font-semibold mb-2">{localErr}</div>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-navy to-brand text-white font-poppins font-bold text-xs py-3 rounded-lg hover:shadow-lg hover:shadow-brand/20 transition-all tracking-wider uppercase disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register'}
            </button>
          </form>
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
    </div>
  );
}
