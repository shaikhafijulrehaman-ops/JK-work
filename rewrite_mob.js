const fs = require('fs');

const file = 'client/src/pages/Auth.jsx';
let content = fs.readFileSync(file, 'utf8');

const mobileMarker = '{/* ==================== MOBILE LAYOUT (Stacked, Premium UI) ==================== */}';
const parts = content.split(mobileMarker);

if (parts.length < 2) {
    console.error('Mobile marker not found!');
    process.exit(1);
}

const newMobileLayout = `{/* ==================== MOBILE LAYOUT (Stacked, Premium UI) ==================== */}
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
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none liquid-container opacity-90">
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-brand to-brand-light opacity-60 blur-md"
              animate={isActive ? { x: '120%', y: '50%', scale: 1.4 } : { x: '-20%', y: '10%', scale: 1 }}
              transition={{ type: 'spring', stiffness: 50, damping: 12 }}
            />
            <motion.div
              className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-[#0d9488] to-[#22d3ee] opacity-55 blur-md"
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
                          <h3 className="font-poppins font-bold text-xl text-slate-800">Sign In</h3>
                          <p className="text-xs text-slate-400">Enter your credentials to continue</p>
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

                        {localErr && <div className="text-red-500 text-xs font-semibold text-center mb-4">{localErr}</div>}

                        <div className="flex items-center justify-between px-1 mb-6 text-xs font-semibold text-slate-500">
                          <button type="button" onClick={() => setUseOtp(true)} className="text-brand hover:underline flex items-center space-x-1">
                            <PhoneCall className="w-3.5 h-3.5" /> <span>Login with OTP</span>
                          </button>
                          <span className="cursor-pointer hover:text-slate-800">Forgot password?</span>
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
                          <h3 className="font-poppins font-bold text-xl text-slate-800">OTP SMS Login</h3>
                          <p className="text-xs text-slate-400">Verify your phone to check bookings</p>
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

                        <div className="flex items-center justify-between px-1 mb-6 text-xs font-semibold text-slate-500">
                          <button type="button" onClick={() => { setUseOtp(false); setOtpSent(false); setMsg(null); }} className="text-brand hover:underline">
                            Sign In with Password
                          </button>
                          {otpSent && <span className="cursor-pointer hover:text-slate-800" onClick={handleSendOtp}>Resend code</span>}
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
                  <form onSubmit={handleSignUp}>
                    <div className="text-center mb-6">
                      <h3 className="font-poppins font-bold text-xl text-slate-800">Create Account</h3>
                      <p className="text-xs text-slate-400">Register to book instant home services</p>
                    </div>

                    <div className="space-y-4 mb-4">
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
                          <Phone className="w-3.5 h-3.5 inline mr-1" /> Phone
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

                      {/* Worker vs User toggle */}
                      <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs font-semibold backdrop-blur-sm">
                        <span className="text-slate-500">Register as:</span>
                        <div className="flex space-x-3">
                          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700">
                            <input 
                              type="radio" 
                              name="mobile-role" 
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
                              name="mobile-role" 
                              value="WORKER"
                              checked={regRole === 'WORKER'}
                              onChange={() => setRegRole('WORKER')}
                              className="text-brand focus:ring-brand w-3.5 h-3.5"
                            />
                            <span className="text-brand">Service Worker</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {localErr && <div className="text-red-500 text-xs font-semibold text-center mb-4">{localErr}</div>}

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-brand-navy via-brand-dark to-brand text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-800/10 hover:shadow-brand/20 transition-all tracking-wider uppercase disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Register'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social Logins and Onboarding Redirect */}
            <div className="mt-8 text-center space-y-5">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100/60"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-100/60"></div>
              </div>

              <div className="flex justify-center space-x-4">
                <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-100 bg-white/70 hover:bg-white text-slate-500 shadow-sm transition-all active:scale-95">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.1-5.136 4.1A5.72 5.72 0 0 1 8.2 11.8a5.72 5.72 0 0 1 5.79-5.7 5.66 5.66 0 0 1 4.07 1.68l2.5-2.4a9.124 9.124 0 0 0-6.57-2.78 9.2 9.2 0 0 0-9.2 9.2 9.2 9.2 0 0 0 9.2 9.2c5.03 0 9.1-3.6 9.1-9.2a8.67 8.67 0 0 0-.17-1.84Z"/>
                  </svg>
                </button>
                <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-100 bg-white/70 hover:bg-white text-slate-500 shadow-sm transition-all active:scale-95">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-9.3 8-4.96 8-9.75Z"/>
                  </svg>
                </button>
              </div>

              {/* Toggle Sign In / Sign Up Link */}
              <div className="text-xs font-semibold text-slate-500 pt-2">
                {!isActive ? (
                  <p>
                    New here?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setIsActive(true); setLocalErr(null); }} 
                      className="text-brand hover:underline font-bold"
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
                      className="text-brand hover:underline font-bold"
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
`;

fs.writeFileSync(file, parts[0] + newMobileLayout, 'utf8');
console.log('Mobile layout rewritten.');
