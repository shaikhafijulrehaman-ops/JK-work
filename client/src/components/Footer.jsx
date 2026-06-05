import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, PhoneCall, Mail, Compass } from 'lucide-react';

export default function Footer() {
  const location = useLocation();

  // Hide the footer on Admin and Worker dashboards to preserve full-screen layout integrity
  const hideFooter = location.pathname.startsWith('/admin') || location.pathname.startsWith('/worker');
  if (hideFooter) return null;

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
        
        {/* Column 1: Company details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <span className="flex items-center justify-center w-8 h-8 bg-brand rounded text-white font-poppins font-bold text-base">
              JK
            </span>
            <span className="font-poppins font-black text-sm tracking-widest uppercase">
              JK Enterprises
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            Anchepalya’s certified service platform. We dispatch Police-vetted specialists in 9 minutes under strict SLA guarantees.
          </p>
          <div className="space-y-1.5 text-[10.5px]">
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> 
              <span>Anchepalya, Tumkur Road, Bengaluru - 560073</span>
            </div>
            <div className="flex items-center">
              <PhoneCall className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> 
              <span>Ph: 8431588235</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> 
              <span className="break-all">jayaketanaenterprises@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Column 2: Our Services */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">Our Services</h4>
          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-semibold">
            <Link to="/services?category=Cleaning" className="hover:text-brand transition-colors block">Deep Cleaning</Link>
            <Link to="/services?category=Care" className="hover:text-brand transition-colors block">Baby Care</Link>
            <Link to="/services?category=Cleaning" className="hover:text-brand transition-colors block">Bathroom Clean</Link>
            <Link to="/services?category=Cleaning" className="hover:text-brand transition-colors block">Kitchen Clean</Link>
            <Link to="/services?category=Cleaning" className="hover:text-brand transition-colors block">Dust Cleaning</Link>
            <Link to="/services?category=Shifting" className="hover:text-brand transition-colors block">House Shifting</Link>
            <Link to="/services?category=Cooking" className="hover:text-brand transition-colors block">Cooking Service</Link>
            <Link to="/services?category=Painting" className="hover:text-brand transition-colors block">House Painting</Link>
            <Link to="/services?category=Technical" className="hover:text-brand transition-colors block">Electrician</Link>
            <Link to="/services?category=Care" className="hover:text-brand transition-colors block">Security Guard</Link>
          </div>
        </div>

        {/* Column 3: Quick Navigation */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">Navigation</h4>
          <ul className="space-y-2 text-[10.5px] font-semibold">
            <li><Link to="/services" className="hover:text-brand transition-colors">Find and Book Services</Link></li>
            <li><Link to="/auth" className="hover:text-brand transition-colors">Customer Login / SignUp</Link></li>
            <li><Link to="/contact" className="hover:text-brand transition-colors">Contact Us (24/7)</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand transition-colors">Customer Dashboard</Link></li>
            <li><Link to="/worker/dashboard" className="hover:text-brand transition-colors">Service Worker Portal</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal & Policies (Razorpay Requirements) */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest">Legal & Policies</h4>
          <ul className="space-y-2 text-[10.5px] font-semibold">
            <li><Link to="/terms" className="hover:text-brand transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link></li>
            <li><Link to="/refund" className="hover:text-brand transition-colors">Refund & Cancellation Policy</Link></li>
            <li><Link to="/shipping" className="hover:text-brand transition-colors">Shipping & Delivery Policy</Link></li>
            <li><Link to="/contact" className="hover:text-brand transition-colors">Contact Details</Link></li>
          </ul>

          {/* Prestige Jindal City indicator card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5 shadow-sm mt-4">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700">
              <Compass className="w-4.5 h-4.5 text-brand animate-pulse" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-[9.5px] font-extrabold text-white block">Prestige Jindal City Base</span>
              <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">Anchepalya Tumkur Main Rd</span>
            </div>
          </div>
        </div>

      </div>

      {/* Legal copyrights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-600 font-semibold">
        <span>© 2026 JK Enterprises. All Rights Reserved.</span>
        <span>Anchepalya Tumkur Main Road, Anchepalya, prestige Jindal City, Bengaluru – 560073</span>
      </div>
    </footer>
  );
}
