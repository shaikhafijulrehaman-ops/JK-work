import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Tag, ChevronLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerSignup({ onBack }) {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [referral, setReferral] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [err, setErr] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (!phone || phone.length < 10) {
      setErr("Please enter a valid 10-digit phone number.");
      return;
    }
    const res = await register(email, password, name, phone, 'USER', { location, referral });
    if (res.success) {
      navigate('/services');
    } else {
      setErr(res.error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-full bg-white md:bg-transparent"
    >
      <div className="flex items-center mb-6 sticky top-0 bg-white/90 md:bg-transparent backdrop-blur-sm z-10 py-2">
        <button onClick={onBack} type="button" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors mr-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-left">
          <h3 className="font-poppins font-bold text-xl text-slate-800 leading-tight">Customer Sign Up</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick & minimal onboarding</p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col flex-1 pb-6 overflow-y-auto pr-2" style={{ maxHeight: '100%' }}>
        <div className="space-y-4 mb-6 mt-2">
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
          <div className="form-group">
            <input type="password" className="form-input" placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
            <label className="form-label flex items-center space-x-1"><CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Confirm Password</label>
          </div>
          
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between py-2 text-xs font-bold text-brand hover:text-brand-dark transition-colors bg-cyan-50/50 md:bg-white/50 px-3 rounded-lg border border-cyan-100/50 mt-4">
            <span>Optional Details (Location & Referral)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showAdvanced && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
              <div className="form-group">
                <input type="text" className="form-input" placeholder="Area / Location" value={location} onChange={e=>setLocation(e.target.value)} />
                <label className="form-label flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Location</label>
              </div>
              <div className="form-group">
                <input type="text" className="form-input" placeholder="Referral Code" value={referral} onChange={e=>setReferral(e.target.value)} />
                <label className="form-label flex items-center space-x-1"><Tag className="w-3.5 h-3.5 inline mr-1" /> Referral Code</label>
              </div>
            </motion.div>
          )}
        </div>

        {err && <div className="text-red-500 text-[10px] font-semibold text-center mb-4 bg-red-50 p-2 rounded-lg">{err}</div>}

        <div className="mt-auto pt-4 pb-4">
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-navy to-brand text-white font-poppins font-bold text-sm py-3.5 rounded-xl shadow-md hover:shadow-brand/20 transition-all uppercase tracking-wider disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Join as Customer'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
