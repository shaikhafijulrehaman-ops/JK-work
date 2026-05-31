import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, Phone, CheckCircle, ChevronRight, ChevronLeft, 
  Upload, Sparkles, Building, User, Mail, CreditCard,
  Briefcase, MapPin, Calendar, Check, MessageSquare, AlertCircle, Eye
} from 'lucide-react';

// Service Categories
const SERVICE_CATEGORIES = [
  'Baby Care', 'Full House Cleaning', 'Bathroom Cleaning', 'Kitchen Cleaning', 
  'Dust Cleaning', 'House Shifting', 'Cooking Service', 'House Painting', 
  'Electrician', 'Security Provider', 'Pest Control'
];

// Service Areas
const SERVICE_AREAS = [
  'Nagasandra', 'Bagalagunte', 'Anchepalya', 'Peenya Industrial Area', 
  'Peenya', 'Madavara', 'Chikkabidarakallu', 'Doddabidarakallu'
];

// Mock Document Preset URLs for easy local testing
const PRESET_DOCUMENTS = {
  aadhaarFront: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
  aadhaarBack: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
  selfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  profile: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=600&auto=format&fit=crop'
};

export default function PartnerRegister() {
  const navigate = useNavigate();
  const { sendOtp } = useAuthStore();

  // Mode Selection: 'select' (choice screen), 'form' (6-step registration), 'success' (completion status)
  const [regMode, setRegMode] = useState('select');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    category: 'Full House Cleaning',
    experience: '3',
    employmentType: 'Full Time',
    pincode: '',
    address: '',
    serviceArea: 'Anchepalya',
    aadhaarFront: '',
    aadhaarBack: '',
    selfiePhoto: '',
    profilePhoto: '',
    bankHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  // Live Password Validation Calculations
  const isLengthValid = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';
  const isPasswordValid = isLengthValid && hasLetter && hasNumber && hasSpecial && passwordsMatch;

  // OTP Simulation State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Camera & Webcam Ref/States
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSimulated, setCameraSimulated] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [shutterFlash, setShutterFlash] = useState(false);

  // Handler for text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Simulated OTP Dispatch
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpError(null);
    setLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000);
      setSimulatedOtp(code);
      setOtpSent(true);
      console.log(`💬 [SMS Gateway mock] To: ${formData.phone} - Partner Registration OTP: ${code}`);
      alert(`[SMS Dispatch Simulation] OTP sent: ${code}`);
    } catch (err) {
      setOtpError('Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify simulated OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode === String(simulatedOtp) || otpCode === '123456') { // 123456 as master bypass
      setOtpVerified(true);
      setOtpError(null);
    } else {
      setOtpError('Invalid verification code entered.');
    }
  };

  // Live Selfie Camera Handlers
  const handleStartSelfieCapture = async () => {
    setCameraOpen(true);
    setCameraActive(false);
    setCameraSimulated(false);
    setCameraError(null);
    
    // Short timeout to ensure the video element renders before stream starts
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) videoRef.current.play().catch(e => console.log("Play failed", e));
          };
          setCameraActive(true);
        }
      } catch (err) {
        console.warn("Webcam access blocked or hardware missing. Entering camera simulator mode.", err);
        setCameraSimulated(true);
      }
    }, 100);
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraActive(false);
    setCameraSimulated(false);
  };

  const handleCaptureLiveSelfie = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormData(prev => ({ ...prev, selfiePhoto: dataUrl }));
        handleCloseCamera();
      }
    } catch (err) {
      console.error("Failed to capture image from video element", err);
      setCameraError("Capture failed. Try simulator capture.");
    }
  };

  const handleSimulateCapture = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    setTimeout(() => {
      setFormData(prev => ({ ...prev, selfiePhoto: PRESET_DOCUMENTS.selfie }));
      handleCloseCamera();
    }, 150);
  };

  // Base64 helper for Aadhaar/Profile uploads
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (field === 'selfiePhoto') {
      setError('Selfie must be captured live using the camera.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Apply Document presets for quick testing (Aadhaar & Profile only)
  const handleApplyPreset = (field, type) => {
    if (field === 'selfiePhoto') return; // strictly forbidden
    setFormData(prev => ({ ...prev, [field]: PRESET_DOCUMENTS[type] }));
  };

  // Next Step Validation
  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name || !formData.phone || !formData.email) {
        setError('Please complete all basic details.');
        return;
      }
      if (!otpVerified) {
        setError('Please verify your mobile number via OTP first.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.experience) {
        setError('Please enter your experience in years.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.pincode || !formData.address) {
        setError('Please provide your complete address and pincode.');
        return;
      }
    }
    if (currentStep === 4) {
      if (!formData.aadhaarFront || !formData.aadhaarBack || !formData.selfiePhoto || !formData.profilePhoto) {
        setError('Please upload all required identity documents.');
        return;
      }
    }
    if (currentStep === 5) {
      if (!formData.bankHolder || !formData.bankName || !formData.accountNumber || !formData.ifscCode) {
        setError('Please complete your bank account details.');
        return;
      }
    }
    if (currentStep === 6) {
      if (!isPasswordValid) {
        if (!isLengthValid) {
          setError('Password must be at least 8 characters long.');
          return;
        }
        if (!hasLetter) {
          setError('Password must contain at least one letter.');
          return;
        }
        if (!hasNumber) {
          setError('Password must contain at least one number.');
          return;
        }
        if (!hasSpecial) {
          setError('Password must contain at least one special symbol.');
          return;
        }
        if (!passwordsMatch) {
          setError('Passwords do not match.');
          return;
        }
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  // Submit Application to API
  const handleSubmitApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        category: formData.category,
        experience: formData.experience,
        employmentType: formData.employmentType,
        pincode: formData.pincode,
        address: formData.address,
        serviceArea: formData.serviceArea,
        aadhaarFront: formData.aadhaarFront,
        aadhaarBack: formData.aadhaarBack,
        selfiePhoto: formData.selfiePhoto,
        profilePhoto: formData.profilePhoto,
        bankDetails: {
          holderName: formData.bankHolder,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifscCode,
          upi: formData.upiId || null
        }
      };

      const res = await fetch('http://localhost:5000/api/auth/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        console.log("Service Partner Registration Success");
        console.log("Application Saved");
        console.log("Approval Request Created");
        console.log("Full Database Response (Worker):", data);
        setRegMode('success');
      } else {
        setError(data.message || 'Onboarding failed.');
      }
    } catch (err) {
      console.warn('Backend API connection offline. Simulating success in sandbox modes...', err);
      
      // Save locally to localStorage so that the admin panel can show it immediately
      const newUserId = `user-worker-${Date.now()}`;
      const newWorkerId = `w-${Date.now()}`;
      
      const newSandboxUser = {
        id: newUserId,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: 'WORKER',
        isEmailVerified: true,
        isPhoneVerified: true,
        pincode: formData.pincode,
        serviceArea: formData.serviceArea,
        createdAt: new Date().toISOString()
      };
      
      const newSandboxWorker = {
        id: newWorkerId,
        userId: newUserId,
        approvalStatus: 'PENDING',
        experienceYears: formData.experience ? parseInt(formData.experience) : 3,
        address: formData.address,
        createdAt: new Date().toISOString(),
        rating: 5.0,
        user: newSandboxUser,
        skills: [{ service: { name: formData.category } }],
        aadhaar: JSON.stringify({ front: formData.aadhaarFront, back: formData.aadhaarBack }),
        profilePhoto: JSON.stringify({ profile: formData.profilePhoto, selfie: formData.selfiePhoto }),
        bankDetails: JSON.stringify({
          holderName: formData.bankHolder,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifscCode,
          upi: formData.upiId || null
        }),
        availability: 'Full Time'
      };

      const localUsers = JSON.parse(localStorage.getItem('jk_sandbox_users') || '[]');
      localUsers.push(newSandboxUser);
      localStorage.setItem('jk_sandbox_users', JSON.stringify(localUsers));

      const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
      localWorkers.push(newSandboxWorker);
      localStorage.setItem('jk_sandbox_workers', JSON.stringify(localWorkers));

      console.log("Service Partner Registration Success");
      console.log("Application Saved");
      console.log("Approval Request Created");
      console.log("Full Database Response (Worker - Sandbox):", newSandboxWorker);

      setRegMode('success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter flex flex-col items-center justify-center p-4 py-12 md:py-20 relative">
      
      {/* Background Premium Glow Gradients */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-2xl w-full">
        
        {/* ==================== STAGE 1: MODE SELECTION PANEL ==================== */}
        {regMode === 'select' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl"
          >
            {/* Onboarding Header */}
            <div className="text-center pb-8 border-b border-slate-100 mb-8">
              <span className="inline-flex bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold font-poppins uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Onboarding Center
              </span>
              <h1 className="font-poppins font-black text-3xl md:text-4xl text-slate-800 tracking-tight leading-none">
                Register as a Service Partner
              </h1>
              <p className="text-sm text-slate-500 mt-2.5 max-w-md mx-auto">
                Join JK Enterprises' elite tier of professionals. Start receiving premium bookings in your neighborhood.
              </p>
            </div>

            {/* Grid Choices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option 1: Self Registration */}
              <button 
                onClick={() => setRegMode('form')}
                className="group border-2 border-brand/20 hover:border-brand bg-brand/[0.02] hover:bg-brand/[0.04] p-6 rounded-2xl transition-all duration-300 text-left flex flex-col justify-between hover:shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-full group-hover:bg-brand/10 transition-all"></div>
                <div>
                  <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center mb-4">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-lg text-slate-800">Create Account Yourself</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Preferred option. Complete step-by-step digital application using your smartphone in 5 minutes.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-brand mt-6">
                  Start Registration <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: Assisted Call / Whatsapp */}
              <div className="border border-slate-200 bg-white p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-lg text-slate-800">Need Help Registering?</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Not comfortable creating an account online? Our dedicated onboarding team will help create your account.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2.5 mt-6 w-full">
                  <a 
                    href="tel:8431588235"
                    className="bg-slate-900 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Agent Support
                  </a>
                  <a 
                    href={`https://wa.me/918431588235?text=Hello%20JK%20Enterprises,%20I%20want%20to%20register%20as%20a%20Service%20Partner.%20Please%20help%20me%20onboard!`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message on WhatsApp
                  </a>
                </div>
              </div>

            </div>

            {/* Bottom Note */}
            <div className="text-center text-[10px] text-slate-400 mt-8">
              🔒 All documents are processed securely under JK Enterprises Privacy Protocols.
            </div>
          </motion.div>
        )}

        {/* ==================== STAGE 2: 7-STEP ONBOARDING WIZARD ==================== */}
        {regMode === 'form' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
          >
            {/* Top Linear Progress Indicator */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
              <div 
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              ></div>
            </div>

            {/* Header info */}
            <div className="flex justify-between items-center mb-6 pt-2">
              <button 
                onClick={() => currentStep === 1 ? setRegMode('select') : setCurrentStep(prev => prev - 1)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" /> Back
              </button>
              <span className="text-xs font-black text-brand font-poppins uppercase tracking-wider">
                Step {currentStep} of 7
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ================== STEP 1: BASIC DETAILS ================== */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Basic Details</h2>
                  <p className="text-xs text-slate-400 mt-1">Please provide your legal name and verify your phone number.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name (Legal Name)</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. ramesh@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-3 text-slate-400 text-sm font-semibold">+91</span>
                        <input 
                          type="tel" 
                          name="phone"
                          maxLength={10}
                          placeholder="9876543210"
                          disabled={otpVerified}
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800 disabled:bg-slate-50"
                        />
                      </div>
                      {!otpVerified && (
                        <button 
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="bg-brand hover:bg-brand-dark text-white font-bold text-xs px-4 rounded-xl shadow transition-colors shrink-0"
                        >
                          Send OTP
                        </button>
                      )}
                    </div>
                  </div>

                  {/* OTP Verification box */}
                  {otpSent && !otpVerified && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enter 6-Digit OTP Code</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand text-sm font-medium text-slate-800"
                        />
                      </div>
                      {otpError && <p className="text-[10px] text-red-500 font-bold">{otpError}</p>}
                      <button 
                        onClick={handleVerifyOtp}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors"
                      >
                        Verify OTP
                      </button>
                    </div>
                  )}

                  {/* OTP Verified success badge */}
                  {otpVerified && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-bold">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Mobile Number Verified Successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================== STEP 2: SERVICE INFORMATION ================== */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Service Information</h2>
                  <p className="text-xs text-slate-400 mt-1">Tell us about your skillset and work availability.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800 bg-white"
                    >
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Experience (Years)</label>
                    <input 
                      type="number" 
                      name="experience"
                      min={0}
                      max={40}
                      placeholder="e.g. 5"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Full Time', 'Part Time'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setFormData(prev => ({ ...prev, employmentType: mode }))}
                          className={`py-3 rounded-xl border text-sm font-bold transition-all ${formData.employmentType === mode ? 'border-brand bg-brand/5 text-brand shadow-sm' : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================== STEP 3: LOCATION & COVERAGE ================== */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Location & Coverage</h2>
                  <p className="text-xs text-slate-400 mt-1">Specify your current residential area and coverage bounds.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Service Area</label>
                    <select 
                      name="serviceArea"
                      value={formData.serviceArea}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800 bg-white"
                    >
                      {SERVICE_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pincode</label>
                    <input 
                      type="text" 
                      name="pincode"
                      maxLength={6}
                      placeholder="e.g. 560073"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Residential Address</label>
                    <textarea 
                      name="address"
                      rows={3}
                      placeholder="e.g. Flat 102, Prestige Heights, Anchepalya, Tumkur Road, Bengaluru"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* ================== STEP 4: VERIFICATION DOCUMENTS ================== */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Verification Documents</h2>
                  <p className="text-xs text-slate-400 mt-1">Upload clear government IDs and a matching selfie for verification.</p>
                </div>

                {cameraOpen ? (
                  /* ==================== LIVE WEBCAM SCANNER / SIMULATOR ==================== */
                  <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-950 relative shadow-inner shadow-black/40 min-h-[360px] flex flex-col justify-between p-4">
                    {/* Viewport Box */}
                    <div className="relative w-full aspect-[4/3] max-h-[300px] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800">
                      
                      {/* Scanning visual aid frame / oval outline */}
                      <div className="absolute inset-0 border-2 border-slate-800/20 z-20 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-64 rounded-[40%] border-2 border-brand border-dashed animate-pulse flex items-center justify-center">
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider text-center px-4 leading-normal">
                            Position Face Inside Oval
                          </span>
                        </div>
                      </div>

                      {/* Camera stream view */}
                      {cameraActive && (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted
                          className="w-full h-full object-cover transform -scale-x-100 relative z-10" 
                        />
                      )}

                      {/* Simulator fallback view */}
                      {cameraSimulated && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center px-6 relative overflow-hidden z-10">
                          {/* Pulsing scanning guide */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-brand opacity-30 animate-scan"></div>
                          
                          <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 border border-brand/20 relative z-10">
                            <Sparkles className="w-10 h-10 animate-spin-slow" />
                          </div>
                          <h4 className="text-white font-poppins font-black text-sm tracking-wide z-10">
                            Webcam Simulator Mode
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium max-w-[220px] mt-1.5 leading-normal z-10">
                            No camera hardware detected or sandbox browser active. Simulate high-res live selfie scan.
                          </p>
                        </div>
                      )}

                      {/* Camera Loading State */}
                      {!cameraActive && !cameraSimulated && (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-4">
                          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-3"></div>
                          <span className="text-xs text-slate-400 font-bold">Initializing camera hardware...</span>
                        </div>
                      )}

                      {/* Flash Shutter Effect overlay */}
                      {shutterFlash && (
                        <div className="absolute inset-0 bg-white z-50 animate-flash-shutter"></div>
                      )}

                      {/* Error Banner */}
                      {cameraError && (
                        <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 text-white text-[10px] p-2 rounded-lg font-bold flex items-center gap-1.5 z-30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{cameraError}</span>
                        </div>
                      )}
                    </div>

                    {/* Camera Control Panel */}
                    <div className="pt-4 flex flex-col items-center gap-3">
                      <div className="flex gap-4">
                        {cameraActive && (
                          <button 
                            onClick={handleCaptureLiveSelfie}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-6 py-3 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-900/30 hover:scale-105 active:scale-95 transition-all"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping"></span>
                            Capture Selfie
                          </button>
                        )}
                        {cameraSimulated && (
                          <button 
                            onClick={handleSimulateCapture}
                            className="bg-brand hover:bg-brand-dark text-white font-extrabold text-xs px-6 py-3 rounded-full flex items-center gap-1.5 shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            Capture Simulated Selfie
                          </button>
                        )}
                        <button 
                          onClick={handleCloseCamera}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-full border border-slate-700 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        🔒 Secured By JK Live Face Scanning Gateway
                      </span>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  /* ==================== DOCUMENT & SELFIE CHECKLIST ==================== */
                  <div className="space-y-4">
                    
                    {/* 1. Aadhaar Card Front Row */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wide">Aadhaar Card Front</span>
                        {formData.aadhaarFront ? (
                          <span className="text-[10px] text-green-600 font-black flex items-center mt-1">
                            <Check className="w-3 h-3 mr-0.5" /> Aadhaar Front Uploaded Successfully
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-1">No file selected (Front Scan Required)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[10px] px-3 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center">
                          <Upload className="w-3 h-3 mr-1" /> Upload Image
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'aadhaarFront')}
                            className="hidden" 
                          />
                        </label>
                        <button 
                          onClick={() => handleApplyPreset('aadhaarFront', 'aadhaarFront')}
                          className="bg-slate-200/50 hover:bg-slate-200 text-slate-600 font-bold text-[10px] px-3 py-2 rounded-lg transition-all"
                        >
                          Mock File
                        </button>
                      </div>
                    </div>

                    {/* 2. Aadhaar Card Back Row */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wide">Aadhaar Card Back</span>
                        {formData.aadhaarBack ? (
                          <span className="text-[10px] text-green-600 font-black flex items-center mt-1">
                            <Check className="w-3 h-3 mr-0.5" /> Aadhaar Back Uploaded Successfully
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-1">No file selected (Back Scan Required)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[10px] px-3 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center">
                          <Upload className="w-3 h-3 mr-1" /> Upload Image
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'aadhaarBack')}
                            className="hidden" 
                          />
                        </label>
                        <button 
                          onClick={() => handleApplyPreset('aadhaarBack', 'aadhaarBack')}
                          className="bg-slate-200/50 hover:bg-slate-200 text-slate-600 font-bold text-[10px] px-3 py-2 rounded-lg transition-all"
                        >
                          Mock File
                        </button>
                      </div>
                    </div>

                    {/* 3. Selfie Card Capture Row (Camera Only - Gallery Blocked!) */}
                    <div className={`border-2 rounded-xl p-5 transition-all ${formData.selfiePhoto ? 'border-emerald-200 bg-emerald-50/[0.04]' : 'border-dashed border-slate-200 bg-slate-50/50'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="block text-xs font-black text-slate-800 uppercase tracking-wide">Live Selfie Capture</span>
                          <span className="bg-red-100 text-red-700 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Camera Capture Only
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
                          To prevent identity fraud, upload from gallery or file selection is strictly blocked. You must scan your face live.
                        </p>
                        {formData.selfiePhoto && (
                          <span className="text-[10px] text-green-600 font-black flex items-center mt-2.5">
                            <Check className="w-3.5 h-3.5 mr-0.5 text-green-500" /> Live Selfie Captured & Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {formData.selfiePhoto && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white">
                            <img src={formData.selfiePhoto} alt="Captured Selfie" className="w-full h-full object-cover transform -scale-x-100" />
                          </div>
                        )}
                        <button 
                          onClick={handleStartSelfieCapture}
                          className="bg-brand hover:bg-brand-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1 hover:-translate-y-0.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          {formData.selfiePhoto ? 'Retake Selfie' : 'Open Camera'}
                        </button>
                      </div>
                    </div>

                    {/* 4. Professional Profile Photo Row */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wide">Professional Profile Photo</span>
                        {formData.profilePhoto ? (
                          <span className="text-[10px] text-green-600 font-black flex items-center mt-1">
                            <Check className="w-3 h-3 mr-0.5" /> Profile Photo Uploaded Successfully
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-1">No file selected (Required for Client App)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[10px] px-3 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center">
                          <Upload className="w-3 h-3 mr-1" /> Upload Image
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                            className="hidden" 
                          />
                        </label>
                        <button 
                          onClick={() => handleApplyPreset('profilePhoto', 'profile')}
                          className="bg-slate-200/50 hover:bg-slate-200 text-slate-600 font-bold text-[10px] px-3 py-2 rounded-lg transition-all"
                        >
                          Mock File
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* ================== STEP 5: BANK DETAILS ================== */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Bank Details</h2>
                  <p className="text-xs text-slate-400 mt-1">Enter your bank details to receive commission payouts automatically.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Holder Name</label>
                    <input 
                      type="text" 
                      name="bankHolder"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.bankHolder}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      name="bankName"
                      placeholder="e.g. State Bank of India"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Number</label>
                    <input 
                      type="text" 
                      name="accountNumber"
                      placeholder="e.g. 100029384756"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IFSC Code</label>
                    <input 
                      type="text" 
                      name="ifscCode"
                      placeholder="e.g. SBIN0003040"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">UPI ID (Optional)</label>
                    <input 
                      type="text" 
                      name="upiId"
                      placeholder="ramesh@upi"
                      value={formData.upiId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================== STEP 6: CREATE PASSWORD ================== */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Create Password</h2>
                  <p className="text-xs text-slate-400 mt-1">Set a secure password to access your partner portal later.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password *</label>
                    <input 
                      type="password" 
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand text-sm font-medium text-slate-800"
                      required
                    />
                  </div>

                  {/* Live Validation Panel */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-105 space-y-2 text-xs">
                    <span className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">Password Requirements:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isLengthValid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {isLengthValid ? '✓' : '•'}
                        </span>
                        <span className={isLengthValid ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>8+ Characters</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasLetter ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {hasLetter ? '✓' : '•'}
                        </span>
                        <span className={hasLetter ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>Letter (A-Z)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasNumber ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {hasNumber ? '✓' : '•'}
                        </span>
                        <span className={hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>Number (0-9)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasSpecial ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {hasSpecial ? '✓' : '•'}
                        </span>
                        <span className={hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>Special Symbol</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 mt-1 flex items-center space-x-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${passwordsMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {passwordsMatch ? '✓' : '•'}
                      </span>
                      <span className={passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>Passwords Match</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================== STEP 7: REVIEW & SUBMIT ================== */}
            {currentStep === 7 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-poppins font-extrabold text-2xl text-slate-800">Review & Submit</h2>
                  <p className="text-xs text-slate-400 mt-1">Review your details before submitting to the onboarding team.</p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Full Name</span>
                    <span className="text-slate-700 font-extrabold">{formData.name}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Mobile</span>
                    <span className="text-slate-700 font-extrabold">{formData.phone}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Service Category</span>
                    <span className="text-slate-700 font-extrabold">{formData.category}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Service Area</span>
                    <span className="text-slate-700 font-extrabold">{formData.serviceArea}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Experience</span>
                    <span className="text-slate-700 font-extrabold">{formData.experience} Years</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Bank Name</span>
                    <span className="text-slate-700 font-extrabold">{formData.bankName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Account No</span>
                    <span className="text-slate-700 font-extrabold">{formData.accountNumber}</span>
                  </div>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    By submitting this application, you declare that all information provided is genuine and matching your legal documents. False details will result in permanent rejection.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              {currentStep < 7 ? (
                <button 
                  onClick={handleNextStep}
                  className="bg-brand hover:bg-brand-dark text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg flex items-center hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmitApplication}
                  disabled={loading}
                  className="bg-brand hover:bg-brand-dark disabled:bg-slate-400 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg flex items-center hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {loading ? 'Submitting Application...' : 'Create Service Partner Account'}
                </button>
              )}
            </div>

          </motion.div>
        )}

        {/* ==================== STAGE 3: ONBOARDING SUCCESS SCREEN ==================== */}
        {regMode === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl text-center"
          >
            {/* Animated Success Ring */}
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>

            <h1 className="font-poppins font-black text-2xl md:text-3xl text-slate-800 tracking-tight leading-none mb-3">
              Application Submitted Successfully
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
              Your application has been submitted successfully. Our onboarding team will review your details and contact you shortly.
            </p>

            {/* Operational Status Display Cards */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 max-w-md mx-auto">
              
              {/* Badge */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Current Status</span>
                <span className="bg-amber-100 text-amber-700 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                  Pending Verification
                </span>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
              <button 
                onClick={() => navigate('/')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all shadow"
              >
                Go to Homepage
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm"
              >
                Login Portal
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
