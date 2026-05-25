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
      if (phone.length < 10) return setErr('Please enter a valid phone number.');
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
    
    // partnerDetails payload
    const partnerDetails = {
      profilePhoto: profilePhoto ? 'uploaded_mock_url' : null,
      idProof: idProof ? 'uploaded_mock_url' : null,
      category, experience, availability, address, bankDetails, emergencyContact
    };

    const res = await register(email, password, name, phone, 'WORKER', partnerDetails);
    if (res.success) {
      navigate('/worker/dashboard');
    } else {
      setErr(res.error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-full bg-white md:bg-transparent"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/90 md:bg-transparent backdrop-blur-sm z-10 py-2">
        <div className="flex items-center">
          <button type="button" onClick={step === 1 ? onBack : prevStep} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <h3 className="font-poppins font-bold text-xl text-slate-800 leading-tight">Partner Sign Up</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Step {step} of 3</p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex space-x-1 pr-2">
          {[1,2,3].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-brand' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col flex-1 pb-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '100%' }}>
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4 mb-6 mt-2">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group">
                  {profilePhoto ? (
                    <img src={URL.createObjectURL(profilePhoto)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400 group-hover:text-brand transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-2">Upload Profile Photo</span>
              </div>
              
              <div className="form-group">
                <input type="text" className="form-input" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><User className="w-3.5 h-3.5 inline mr-1" /> Full Name</label>
              </div>
              <div className="form-group">
                <input type="email" className="form-input" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address</label>
              </div>
              <div className="form-group">
                <input type="tel" className="form-input" placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><Phone className="w-3.5 h-3.5 inline mr-1" /> Phone Number</label>
              </div>
              <div className="form-group">
                <input type="password" className="form-input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><Lock className="w-3.5 h-3.5 inline mr-1" /> Password</label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4 mb-6 mt-2">
              <div className="form-group">
                <select className="form-input text-sm appearance-none bg-white md:bg-transparent" value={category} onChange={e=>setCategory(e.target.value)} required>
                  <option value="" disabled>Select Primary Service</option>
                  <option value="Cleaning">Deep Cleaning</option>
                  <option value="Care">Baby Care / Nanny</option>
                  <option value="Technical">Electrician / Plumber</option>
                  <option value="Cooking">Cooking Service</option>
                  <option value="Shifting">House Shifting</option>
                </select>
                <label className="form-label flex items-center space-x-1"><Briefcase className="w-3.5 h-3.5 inline mr-1" /> Service Category</label>
              </div>
              
              <div className="form-group">
                <select className="form-input text-sm appearance-none bg-white md:bg-transparent" value={experience} onChange={e=>setExperience(e.target.value)} required>
                  <option value="" disabled>Select Experience Level</option>
                  <option value="0-1">0-1 Years (Fresher)</option>
                  <option value="2-5">2-5 Years (Intermediate)</option>
                  <option value="5+">5+ Years (Expert)</option>
                </select>
                <label className="form-label flex items-center space-x-1"><CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Years of Experience</label>
              </div>

              <div className="form-group">
                <select className="form-input text-sm appearance-none bg-white md:bg-transparent" value={availability} onChange={e=>setAvailability(e.target.value)} required>
                  <option value="" disabled>Select Availability</option>
                  <option value="Full Time">Full Time (8am - 8pm)</option>
                  <option value="Morning">Morning Shift (8am - 2pm)</option>
                  <option value="Evening">Evening Shift (2pm - 8pm)</option>
                  <option value="Weekends">Weekends Only</option>
                </select>
                <label className="form-label flex items-center space-x-1"><Clock className="w-3.5 h-3.5 inline mr-1" /> Availability Timing</label>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4 mb-6 mt-2">
              <div className="form-group">
                <div className="relative flex items-center border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 md:bg-white/50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setIdProof(e.target.files[0])} accept="image/*,.pdf" />
                  <div className="flex items-center w-full">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-brand mr-3 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{idProof ? idProof.name : 'Upload Aadhaar / ID Proof'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">JPEG, PNG, or PDF max 5MB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <textarea className="form-input min-h-[80px] py-3 resize-none" placeholder="Full Residential Address" value={address} onChange={e=>setAddress(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Full Address</label>
              </div>

              <div className="form-group">
                <input type="text" className="form-input" placeholder="Bank Account Number / UPI ID" value={bankDetails} onChange={e=>setBankDetails(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><CreditCard className="w-3.5 h-3.5 inline mr-1" /> Bank / Payment Details</label>
              </div>

              <div className="form-group">
                <input type="tel" className="form-input" placeholder="Emergency Contact Number" value={emergencyContact} onChange={e=>setEmergencyContact(e.target.value)} required />
                <label className="form-label flex items-center space-x-1"><Phone className="w-3.5 h-3.5 inline mr-1" /> Emergency Contact Number</label>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {err && <div className="text-red-500 text-[10px] font-semibold text-center mb-4 bg-red-50 p-2 rounded-lg">{err}</div>}

        <div className="mt-auto pt-4 pb-4">
          {step < 3 ? (
            <button type="button" onClick={nextStep} className="w-full bg-slate-900 text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-slate-800">
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-navy to-brand text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-md hover:shadow-brand/20 transition-all uppercase tracking-wider disabled:opacity-50">
              {loading ? 'Submitting...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
