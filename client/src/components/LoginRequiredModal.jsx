import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function LoginRequiredModal() {
  const { showLoginModal, setShowLoginModal } = useAuthStore();
  const navigate = useNavigate();

  if (!showLoginModal) return null;

  const handleAction = (mode) => {
    setShowLoginModal(false);
    navigate(`/auth?mode=${mode}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      {/* Modal Container: Clean, Minimal, Professional Swiggy/Zomato Style */}
      <div className="bg-white w-full max-w-[450px] rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col items-center text-center space-y-6 relative overflow-hidden animate-scale-up">
        
        {/* Subtle top-bar close button */}
        <button 
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Section with Premium Spacing */}
        <div className="space-y-2 pt-2">
          <h3 className="font-poppins font-bold text-lg text-slate-850 tracking-tight leading-none">
            Login Required
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs font-poppins">
            Please sign in or create an account to continue with your booking.
          </p>
        </div>

        {/* Clean and Professional Buttons: No emojis, no decorative symbols */}
        <div className="w-full flex flex-col space-y-2 pt-1">
          <button
            onClick={() => handleAction('login')}
            className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs py-3 rounded-xl transition-all"
          >
            Login
          </button>
          
          <button
            onClick={() => handleAction('signup')}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-poppins font-bold text-xs py-3 rounded-xl border border-slate-200 transition-all"
          >
            Create Account
          </button>

          <button
            onClick={() => setShowLoginModal(false)}
            className="w-full bg-transparent text-slate-450 hover:text-slate-650 font-poppins font-bold text-xs py-2 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
