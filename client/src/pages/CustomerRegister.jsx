import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSignup from '../components/auth/CustomerSignup';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function CustomerRegister() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen font-inter flex flex-col items-center justify-center p-4 py-12 md:py-20 relative">
      
      {/* Background Glow Accents */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-xl w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Top visual gradient border */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-teal-400"></div>

        <div className="text-center pb-4 border-b border-slate-100 mb-6 select-none">
          <span className="inline-flex bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold font-poppins uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Customer Registry
          </span>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-slate-800 tracking-tight leading-none">
            Create Customer Account
          </h1>
          <p className="text-[11px] text-slate-400 mt-2.5 max-w-sm mx-auto font-medium">
            Join JK Enterprises to find professional, verified service providers in 9 minutes.
          </p>
        </div>

        {/* Embedded Customer Signup Flow */}
        <CustomerSignup onBack={() => navigate('/auth')} />
      </div>
    </div>
  );
}
