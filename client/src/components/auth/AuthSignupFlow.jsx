import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, Sparkles, ChevronRight } from 'lucide-react';

export default function AuthSignupFlow({ onCancel }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-center px-4 md:px-8 py-6 select-none bg-white">
      
      {/* Selection Header */}
      <div className="text-center mb-8">
        <span className="inline-flex bg-brand/10 text-brand px-2.5 py-0.5 rounded-full text-[9px] font-black font-poppins uppercase tracking-widest mb-2.5">
          <Sparkles className="w-3 h-3 mr-1 animate-pulse" /> Registry Portal
        </span>
        <h2 className="font-poppins font-black text-xl text-slate-800 leading-none">
          Choose Account Type
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold mt-2 max-w-[240px] mx-auto leading-normal">
          How would you like to join JK Enterprises today? Select your role to proceed.
        </p>
      </div>

      {/* Selector Options Grid */}
      <div className="space-y-4">
        
        {/* Option 1: Customer */}
        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/customer-register')}
          className="w-full border border-slate-200 hover:border-brand bg-slate-50/[0.1] hover:bg-brand/[0.01] p-4 rounded-2xl transition-all duration-300 text-left flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-poppins font-extrabold text-sm text-slate-800 leading-snug flex items-center gap-1.5">
                Join as Customer
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                Book home services instantly.
              </p>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-brand transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Option 2: Service Partner */}
        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/partner-register')}
          className="w-full border border-slate-200 hover:border-teal-500 bg-slate-50/[0.1] hover:bg-teal-500/[0.01] p-4 rounded-2xl transition-all duration-300 text-left flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-poppins font-extrabold text-sm text-slate-800 leading-snug flex items-center gap-1.5">
                Join as Service Partner
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                Provide services and earn money with JK Enterprises.
              </p>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-teal-600 transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

      </div>

      {/* Footer Info */}
      <div className="text-center mt-6 pt-4 border-t border-slate-100">
        <button 
          onClick={onCancel}
          className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
        >
          Cancel Registration
        </button>
      </div>

    </div>
  );
}
