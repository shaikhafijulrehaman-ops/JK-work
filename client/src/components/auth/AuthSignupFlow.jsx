import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Briefcase, ChevronRight } from 'lucide-react';
import CustomerSignup from './CustomerSignup';
import PartnerSignup from './PartnerSignup';

export default function AuthSignupFlow({ onCancel }) {
  const [mode, setMode] = useState('select'); // select, customer, partner

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col pt-4 md:pt-0">
      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div 
            key="select" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="flex flex-col items-center justify-center h-full px-6 md:px-10 text-center w-full"
          >
            <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-wide mb-2 mt-4 md:mt-0">
              Join JK Enterprises
            </h2>
            <p className="text-xs text-slate-400 mb-8 max-w-[280px]">
              Choose how you want to use our platform today.
            </p>

            <div className="w-full space-y-4">
              {/* Customer Option */}
              <button 
                onClick={() => setMode('customer')}
                type="button"
                className="w-full group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-brand/50 shadow-sm hover:shadow-lg transition-all p-4 text-left flex items-center"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center text-brand mr-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-poppins font-bold text-sm text-slate-800">Join as Customer</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Book instant home services easily</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors transform group-hover:translate-x-1" />
              </button>

              {/* Partner Option */}
              <button 
                onClick={() => setMode('partner')}
                type="button"
                className="w-full group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl transition-all p-4 text-left flex items-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white mr-4 group-hover:scale-110 transition-transform z-10">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1 z-10">
                  <h3 className="font-poppins font-bold text-sm text-white">Join as Service Partner</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Start earning with your skills</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors transform group-hover:translate-x-1 z-10" />
              </button>
            </div>

            {onCancel && (
               <button type="button" onClick={onCancel} className="mt-8 text-xs font-semibold text-slate-500 hover:text-brand hover:underline md:hidden">
                 Back to Sign In
               </button>
            )}
          </motion.div>
        )}

        {mode === 'customer' && <CustomerSignup key="customer" onBack={() => setMode('select')} />}
        {mode === 'partner' && <PartnerSignup key="partner" onBack={() => setMode('select')} />}
      </AnimatePresence>
    </div>
  );
}
