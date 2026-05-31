import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, HelpCircle, MessageSquare, Phone, Mail, 
  ChevronDown, ChevronUp, Sparkles, BookOpen, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpPage() {
  const navigate = useNavigate();
  const handleBack = () => navigate('/account');

  // FAQ states
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How does the instant 9-minute service dispatch work?",
      a: "Once you place a booking and pay the invoice, our closest verified professional (e.g. Ramesh Kumar or Vijay) departs immediately from their sector hub. Our Sandboxed GPS Timelines track their transit directly to your Anchepalya doorstep."
    },
    {
      q: "What areas are supported in Anchepalya?",
      a: "We currently support 8 core premium hubs in Anchepalya: Prestige Jindal City, Nagasandra Zone, Bagalagunte Hub, Peenya Industrial Area, Peenya Metro Sector, Madavara Corridor, Chikkabidarakallu Hub, and Doddabidarakallu Sector."
    },
    {
      q: "How do I secure platform transactions?",
      a: "All online invoices are processed via secure simulation tokens (UPI/Razorpay). Your funds are verified and dispatches are authorized instantly once the invoice is marked PAID in your Customer Dashboard."
    },
    {
      q: "Can I cancel a booking after dispatch starts?",
      a: "Yes, you can cancel dispatches through your Customer Dashboard if the professional is still in transit (Pending or Assigned status). Once the professional starts the doorstep service, cancellation is locked."
    }
  ];

  const categories = [
    { name: 'Dispatch & GPS Timelines', desc: 'Bike tracking, arrivals, delays' },
    { name: 'UPI & Invoicing Receipts', desc: 'Failed simulations, platform fees' },
    { name: 'Verification & Profile Check', desc: 'Alternate mobile numbers, credentials' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-24 text-slate-800 relative">
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={handleBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-3 border border-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-poppins font-black text-lg text-slate-900">Help Center</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Support CTA Component */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(8,145,178,0.22),transparent)] pointer-events-none"></div>
          
          <h3 className="font-poppins font-black text-lg text-brand-light">Doorstep Support Center</h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-sm">
            Our instant Anchepalya support dispatchers are active 24/7. Get real-time updates and manual bookings.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5 select-none">
            <a 
              href="https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20need%20help%20with%20my%20service%20dispatch."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-2xl shadow-md transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-current text-white" />
              <span>WhatsApp Chat</span>
            </a>
            <a 
              href="tel:+918431588235"
              className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-[11px] font-black uppercase tracking-wider py-3.5 rounded-2xl shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Helpline Support</span>
            </a>
          </div>
        </div>

        {/* Categories panel */}
        <div className="space-y-3.5 text-left">
          <h4 className="font-poppins font-black text-[10px] text-slate-400 uppercase tracking-widest pl-1">
            Common Help Categories
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-white p-4.5 rounded-2xl border border-slate-200/50 shadow-xs flex items-center justify-between cursor-pointer hover:border-brand/35 hover:bg-cyan-50/15 transition-all group">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-855 group-hover:text-brand transition-colors block">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold block">{cat.desc}</span>
                </div>
                <BookOpen className="w-4.5 h-4.5 text-slate-300 group-hover:text-brand transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQs component */}
        <div className="space-y-3 text-left">
          <h4 className="font-poppins font-black text-[10px] text-slate-400 uppercase tracking-widest pl-1">
            Frequently Asked Questions FAQs
          </h4>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white transition-colors">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between font-poppins font-bold text-xs text-slate-750 hover:bg-slate-50/50 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4.5 h-4.5 text-brand" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden bg-slate-50/60"
                      >
                        <p className="px-5 pb-5 pt-1 text-[11px] text-slate-500 font-semibold leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
