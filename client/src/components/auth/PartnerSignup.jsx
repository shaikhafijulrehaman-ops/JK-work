import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Lock, ChevronLeft, ArrowRight, Camera, 
  Briefcase, Clock, MapPin, CreditCard, ShieldCheck, FileText, CheckCircle
} from 'lucide-react';

export default function PartnerSignup({ onBack }) {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Step 2
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');

  // Step 3
  const [idProof, setIdProof] = useState(null);
  const [address, setAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const nextStep = () => {
    setErr('');
    if (step === 1) {
      if (!name || !email || !phone || !password) return setErr('Please fill all mandatory fields.');
      if (phone.length < 10) return setErr('Please enter a 10-digit phone number.');
      setStep(2);
    } else if (step === 2) {
      if (!category || !experience || !availability) return setErr('Please select your service details.');
      setStep(3);
    }
  };

  const prevStep = () => {
    setErr('');
    if (step > 1) setStep(step - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    if (!address || !bankDetails || !emergencyContact) return setErr('Please complete all verification details.');
    
    const partnerDetails = {
      profilePhoto: profilePhoto ? 'uploaded_mock_url' : null,
      idProof: idProof ? 'uploaded_mock_url' : null,
      category, experience, availability, address, bankDetails, emergencyContact
    };

    const res = await register(email, password, name, phone, 'WORKER', partnerDetails);
    if (res.success) {
      setIsSubmitted(true);
    } else {
      setErr(res.error);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col items-center justify-center p-6 text-center space-y-6"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        
        <div>
          <h3 className="font-poppins font-black text-xl text-slate-900 leading-tight">Application Submitted Successfully</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
            Your application has been submitted successfully. Our team will review your details and contact you shortly.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 w-full">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Application Status</span>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Pending Approval
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
        >
          Go to Homepage
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-full bg-transparent"
    >
      {/* Immersive Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent backdrop-blur-sm z-10 py-2 border-b border-slate-200/40">
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={step === 1 ? onBack : prevStep} 
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors mr-2 border border-slate-200/40"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <h3 className="font-poppins font-black text-xl text-slate-950 leading-tight">Partner Portal</h3>
            <p className="text-[10px] text-brand-dark font-black uppercase tracking-wider">Step {step} of 3 • Account Setup</p>
          </div>
        </div>
        
        {/* Sleek Step Indicators */}
        <div className="flex space-x-1.5 pr-2">
          {[1,2,3].map(i => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step >= i 
                  ? 'bg-brand shadow-[0_0_8px_rgba(8,145,178,0.5)] scale-110' 
                  : 'bg-slate-200 border border-slate-300/50'
              }`} 
            />
          ))}
        </div>
      </div>

      <form 
        onSubmit={handleRegister} 
        className="flex flex-col flex-1 pb-4 overflow-y-auto pr-1 custom-scrollbar text-left" 
        style={{ maxHeight: '100%' }}
      >
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              className="space-y-4 mb-6 mt-2"
            >
              {/* Photo Upload Container */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-20 h-20 rounded-full bg-white/45 border-2 border-dashed border-slate-300/80 flex items-center justify-center overflow-hidden group shadow-inner backdrop-blur-md">
                  {profilePhoto ? (
                    <img src={URL.createObjectURL(profilePhoto)} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500 group-hover:text-brand transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                </div>
                <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-wider">Upload Profile Photo</span>
              </div>
              
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><User className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Full Name</label>
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Email Address" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><Mail className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Email Address</label>
              </div>
              <div className="form-group">
                <input 
                  type="tel" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Phone Number" 
                  value={phone} 
                  onChange={e=>setPhone(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><Phone className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Phone Number</label>
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><Lock className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Password</label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              className="space-y-4 mb-6 mt-2"
            >
              <div className="form-group">
                <select 
                  className="form-input text-sm appearance-none bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  value={category} 
                  onChange={e=>setCategory(e.target.value)} 
                  required
                >
                  <option value="" disabled className="bg-slate-900 text-white">Select Primary Service</option>
                  <option value="Cleaning" className="bg-slate-900 text-white">Deep Cleaning</option>
                  <option value="Care" className="bg-slate-900 text-white">Baby Care / Nanny</option>
                  <option value="Technical" className="bg-slate-900 text-white">Electrician / Plumber</option>
                  <option value="Cooking" className="bg-slate-900 text-white">Cooking Service</option>
                  <option value="Shifting" className="bg-slate-900 text-white">House Shifting</option>
                </select>
                <label className="form-label flex items-center space-x-1"><Briefcase className="w-3.5 h-3.5 inline mr-1 text-slate-650" /> Service Category</label>
              </div>
              
              <div className="form-group">
                <select 
                  className="form-input text-sm appearance-none bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  value={experience} 
                  onChange={e=>setExperience(e.target.value)} 
                  required
                >
                  <option value="" disabled className="bg-slate-900 text-white">Select Experience Level</option>
                  <option value="0-1" className="bg-slate-900 text-white">0-1 Years (Fresher)</option>
                  <option value="2-5" className="bg-slate-900 text-white">2-5 Years (Intermediate)</option>
                  <option value="5+" className="bg-slate-900 text-white">5+ Years (Expert)</option>
                </select>
                <label className="form-label flex items-center space-x-1"><CheckCircle className="w-3.5 h-3.5 inline mr-1 text-slate-650" /> Years of Experience</label>
              </div>

              <div className="form-group">
                <select 
                  className="form-input text-sm appearance-none bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  value={availability} 
                  onChange={e=>setAvailability(e.target.value)} 
                  required
                >
                  <option value="" disabled className="bg-slate-900 text-white">Select Availability</option>
                  <option value="Full Time" className="bg-slate-900 text-white">Full Time (8am - 8pm)</option>
                  <option value="Morning" className="bg-slate-900 text-white">Morning Shift (8am - 2pm)</option>
                  <option value="Evening" className="bg-slate-900 text-white">Evening Shift (2pm - 8pm)</option>
                  <option value="Weekends" className="bg-slate-900 text-white">Weekends Only</option>
                </select>
                <label className="form-label flex items-center space-x-1"><Clock className="w-3.5 h-3.5 inline mr-1 text-slate-650" /> Availability Timing</label>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              className="space-y-4 mb-6 mt-2"
            >
              {/* ID Proof Box */}
              <div className="form-group">
                <div className="relative flex items-center border-2 border-dashed border-slate-350 rounded-2xl p-3.5 bg-white/40 backdrop-blur-md hover:bg-white/60 transition-all cursor-pointer group shadow-sm">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => setIdProof(e.target.files[0])} accept="image/*,.pdf" />
                  <div className="flex items-center w-full">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-brand mr-3 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-950">{idProof ? idProof.name : 'Upload Aadhaar / ID Proof'}</span>
                      <span className="text-[9.5px] text-slate-600 font-bold mt-0.5">JPEG, PNG, or PDF max 5MB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <textarea 
                  className="form-input min-h-[80px] py-3 resize-none bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Full Residential Address" 
                  value={address} 
                  onChange={e=>setAddress(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Full Address</label>
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Bank Account Number / UPI ID" 
                  value={bankDetails} 
                  onChange={e=>setBankDetails(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><CreditCard className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Bank / Payment Details</label>
              </div>

              <div className="form-group">
                <input 
                  type="tel" 
                  className="form-input bg-white/50 backdrop-blur-sm border border-slate-300/60 focus:bg-white/90 text-slate-950 font-medium shadow-sm transition-all" 
                  placeholder="Emergency Contact Number" 
                  value={emergencyContact} 
                  onChange={e=>setEmergencyContact(e.target.value)} 
                  required 
                />
                <label className="form-label flex items-center space-x-1"><Phone className="w-3.5 h-3.5 inline mr-1 text-slate-600" /> Emergency Contact Number</label>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {err && <div className="text-red-500 text-[10.5px] font-bold text-center mb-4 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">{err}</div>}

        <div className="mt-auto pt-4 pb-2">
          {step < 3 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className="w-full bg-slate-950 hover:opacity-90 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center space-x-2 border border-slate-800"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-brand-navy via-brand-dark to-brand hover:opacity-95 text-white font-poppins font-black text-xs py-3.5 rounded-xl shadow-lg shadow-teal-500/10 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
