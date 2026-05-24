import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Clock, 
  ChevronRight,
  Star,
  Users,
  Award,
  ShieldCheck,
  CheckCircle,
  Calendar,
  CreditCard,
  ArrowRight,
  MessageSquare,
  ChevronLeft,
  Map,
  Compass,
  Mail,
  Send,
  PhoneCall
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

// Elegant robust image loader with styled initials fallback if the source fails to load
const ImageWithFallback = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  if (error || !src) {
    const initials = alt ? alt.split(' ').map(n => n[0]).join('') : 'JK';
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-xs border border-slate-200/80 uppercase tracking-widest`}>
        {initials}
      </div>
    );
  }
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)} 
    />
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { addNotification } = useNotificationStore();

  // Testimonial Carousel State
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Custom high-end minimal line SVG icons matching the reference screenshot exactly
  const BabyCareIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M15 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19 16c0-2.8-2.2-5-5-5h-1a5 5 0 0 0-5 5v3h11v-3z" />
      <path d="M4 14c0-1.8 1.4-3 3-3h1" />
    </svg>
  );

  const CleaningIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
      <path d="M19 9l-7-5.5L5 9" />
      <circle cx="12" cy="7" r="0.75" className="fill-current text-brand" />
      <circle cx="15" cy="5" r="0.75" className="fill-current text-brand" />
    </svg>
  );

  const BathroomIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2h10v4H7z" />
      <path d="M5 6h14v3H5z" />
      <path d="M12 9v13" />
      <path d="M8 22h8" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );

  const KitchenIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="12" rx="2" />
      <path d="M6 10V4h12v6" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <circle cx="9" cy="15" r="1.5" />
      <circle cx="15" cy="15" r="1.5" />
    </svg>
  );

  const DustIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6" />
      <path d="M12 14v8" />
      <path d="M6 8l12 6" />
      <path d="M18 8L6 14" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  );

  const ShiftingIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );

  const CookingIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12h20c0-5.52-4.48-10-10-10z" />
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" />
      <rect x="4" y="14" width="16" height="2" rx="1" />
      <circle cx="12" cy="6" r="1.5" />
    </svg>
  );

  const PaintingIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="6" rx="1" />
      <path d="M6 9v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
      <path d="M12 15v6" />
    </svg>
  );

  const ElectricianIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.5 2h-13A1.5 1.5 0 0 0 4 3.5v9A1.5 1.5 0 0 0 5.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 18.5 2z" />
      <line x1="8" y1="14" x2="8" y2="22" />
      <line x1="16" y1="14" x2="16" y2="22" />
      <circle cx="9" cy="8" r="2" />
      <circle cx="15" cy="8" r="2" />
    </svg>
  );

  const SecurityIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2.5" />
      <path d="M7.5 16.5c0-1.8 1.8-3 4.5-3s4.5 1.2 4.5 3" />
    </svg>
  );

  const PestControlIcon = () => (
    <svg className="w-6.5 h-6.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="1.5" className="fill-current text-brand" />
    </svg>
  );

  // Exact 11 discrete categories to render
  const categories = [
    { name: 'Baby Care', desc: 'Trained nannies', icon: BabyCareIcon, targetName: 'Care' },
    { name: 'Full House Deep Cleaning', desc: 'Complete scrub', icon: CleaningIcon, targetName: 'Cleaning' },
    { name: 'Bathroom Deep Cleaning', desc: 'Shine & sanitise', icon: BathroomIcon, targetName: 'Cleaning' },
    { name: 'Full Kitchen Cleaning', desc: 'Stove & slab degrease', icon: KitchenIcon, targetName: 'Cleaning' },
    { name: 'Dust Cleaning', desc: 'Sofa & dry mopping', icon: DustIcon, targetName: 'Cleaning' },
    { name: 'House Shifting', desc: 'Relocation logistics', icon: ShiftingIcon, targetName: 'Shifting' },
    { name: 'Cooking Service', desc: 'Hygienic prep', icon: CookingIcon, targetName: 'Cooking' },
    { name: 'House Painting', desc: 'All materials inc.', icon: PaintingIcon, targetName: 'Painting' },
    { name: 'Electrician Service', desc: 'Repairs & wiring', icon: ElectricianIcon, targetName: 'Technical' },
    { name: 'Security Provider', desc: 'Vetted gate guards', icon: SecurityIcon, targetName: 'Care' },
    { name: 'Pest Control', desc: ' Cockroach extraction', icon: PestControlIcon, targetName: 'Cleaning' }
  ];

  // Most Booked Services
  const mostBooked = [
    { id: 's-2', name: 'Full House Deep Cleaning', category: 'Cleaning', price: 3499.0, rating: '4.9★', durationText: '5-6 Hours', imageUrl: '/services/housecleaning.jpg' },
    { id: 's-9', name: 'Electrician Service', category: 'Technical', price: 499.0, rating: '4.8★', durationText: '1 Hour', imageUrl: '/services/electrician.jpg' },
    { id: 's-1', name: 'Baby Care', category: 'Care', price: 799.0, rating: '4.9★', durationText: '6 Hours', imageUrl: '/services/babycare.jpg' },
    { id: 's-7', name: 'Cooking Service', category: 'Cooking', price: 149.0, rating: '4.8★', durationText: '1 Hour', imageUrl: '/services/cooking-service.jpg' }
  ];



  // Testimonials Carousel data
  const reviews = [
    { name: 'Vani Prasad', loc: 'Prestige Jindal City', score: 5, comment: 'Placing the dust cleaning booking was so easy! The worker arrived in exactly 8 minutes, well within their 9-minute promise. Outstanding service!', service: 'Dust Cleaning' },
    { name: 'Aravind S.', loc: 'Anchepalya Main Road', score: 5, comment: 'I booked the full kitchen cleaning. Vijay did a phenomenal job. Completely spotless and professional equipment used. Highly recommended!', service: 'Full Kitchen Cleaning' },
    { name: 'Meenakshi Gowda', loc: 'Chikkabidarakallu', score: 5, comment: 'Baby Care support is highly trustworthy. The caregivers are vetted and caring. Absolute peace of mind.', service: 'Baby Care' }
  ];

  // Carousel Auto Slide Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReviewIndex(prev => (prev + 1) % reviews.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/services?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/services');
    }
  };

  const handleDirectBook = (service) => {
    navigate(`/book?serviceId=${service.id}`);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      addNotification('Promo Unlocked!', 'Congratulations! Use promo code 9MINUTES for 20% off on your first home cleaning booking.');
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-inter antialiased relative pb-16 md:pb-0">
      
      {/* Dynamic inline styles for premium floating animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: floatMedium 5.2s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: floatFast 4s ease-in-out infinite;
        }
      `}</style>

      {/* ==================== 1. PREMIUM MINIMAL HERO PANEL ==================== */}
      <section className="bg-aqua-gradient border-b border-cyan-100/20 py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Copy alignment and CTA */}
          <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-7">
            
            {/* GPS Dispatch Breadcrumb */}
            <div className="inline-flex items-center space-x-2 bg-cyan-50/40 border border-cyan-100/30 rounded-full px-3 py-1.5 text-slate-500 text-[10px] sm:text-xs font-bold shadow-xs w-max">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              <span>Anchepalya, Prestige Jindal City, Bengaluru</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-poppins font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-slate-900">
                Professional Home Services <br className="hidden sm:inline" />
                <span className="text-brand">in 9 Minutes.</span>
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm md:text-base font-semibold leading-relaxed max-w-xl md:max-w-none">
                Anchepalya’s certified instant doorstep marketplace. Police-vetted specialists, nannies, cooks, and cleaning professionals dispatched within 9 minutes under SLA guarantee.
              </p>
            </div>

            {/* Clean conversion-focused Search Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl shadow-md border border-slate-200 p-1.5 flex items-center w-full max-w-lg transition-shadow focus-within:shadow-lg">
              <div className="flex items-center flex-1 px-3 py-1 text-slate-700">
                <Search className="w-4.5 h-4.5 text-slate-400 mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search deep cleaning, nannies, electrician, cooks..." 
                  className="w-full text-xs sm:text-sm outline-none bg-transparent font-medium placeholder-slate-400"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-[10px] sm:text-xs py-3 px-6 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center shadow-sm"
              >
                Search
              </button>
            </form>

            {/* CTA Option Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
              <button 
                onClick={() => document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' })}
                className="bg-slate-950 hover:bg-slate-900 text-white font-poppins font-black text-[10px] sm:text-xs px-8 py-3.5 rounded-lg uppercase tracking-wider shadow-md shadow-slate-950/10 transition-all flex items-center space-x-1"
              >
                <span>Book Service</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => navigate('/services')}
                className="bg-transparent hover:bg-slate-50 border border-slate-200 text-slate-700 font-poppins font-black text-[10px] sm:text-xs px-8 py-3.5 rounded-lg uppercase tracking-wider transition-all"
              >
                Explore Services
              </button>
            </div>

            {/* Trust Metrics Strip */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase w-full">
              <div className="flex items-center"><Clock className="w-4 h-4 text-brand mr-1.5" /> 9 Mins Dispatch</div>
              <div className="flex items-center"><ShieldCheck className="w-4 h-4 text-brand mr-1.5" /> SLA Guaranteed</div>
              <div className="flex items-center"><Users className="w-4 h-4 text-brand mr-1.5" /> Vetted Professionals</div>
            </div>

          </div>

          {/* Right Column: Hero Cleaner Image Composition */}
          <div className="md:col-span-5 relative flex items-center justify-center w-full mt-10 md:mt-0">
            {/* Soft backdrop glow circle */}
            <div className="absolute w-72 h-72 md:w-80 md:h-80 bg-gradient-to-tr from-cyan-300/30 to-brand-light/20 rounded-full blur-2xl -z-1 opacity-70 animate-pulse" style={{ animationDuration: '4s' }}></div>
            
            {/* Decorative concentric border */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 border border-cyan-200/20 rounded-full -z-1 scale-110"></div>
            
            <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,145,178,0.12)] border border-white/40 bg-white/30 backdrop-blur-xs p-3 animate-float-medium max-w-[280px] sm:max-w-[320px] md:max-w-none">
              {/* White/cyan blending composition card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-white to-cyan-50/50">
                <img 
                  src="/hero_cleaner.png" 
                  alt="Professional Home Cleaner" 
                  className="w-full h-auto object-cover transform hover:scale-102 transition-transform duration-700"
                />
                
                {/* Floating Micro-Badge inside image composition */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-cyan-100/50 rounded-xl p-3 shadow-md flex items-center space-x-2.5 animate-bounce" style={{ animationDuration: '3.5s' }}>
                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-[10px] font-black text-slate-800 uppercase block tracking-wider">100% SLA Checked</span>
                    <span className="text-[8.5px] text-slate-400 font-semibold mt-0.5 block">Anchepalya Vetted Team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 2. CERTIFIED SERVICE CATEGORIES GRID (Symmetric Cards Overhaul) ==================== */}
      <section id="categories-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-12 space-y-2">
          <span className="text-brand font-poppins font-bold text-[10px] uppercase tracking-[0.25em] block">
            — OUR SERVICES
          </span>
          <h2 className="font-poppins font-extrabold text-3xl text-slate-800 tracking-tight leading-none pt-1">
            Professional Services for Your Home
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold max-w-md mx-auto leading-normal">
            Expert solutions for every corner of your home
          </p>
        </div>

        {/* Clean, premium grid structure - 11 equal cards distributed across 3 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-center">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <Link 
                key={idx} 
                to={`/services?category=${cat.targetName}`}
                className={`premium-card p-6 text-center flex flex-col items-center justify-between group cursor-pointer min-h-[220px] ${
                  idx === 0 ? 'col-span-2 md:col-span-1' : ''
                }`}
              >
                <div className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 rounded-full bg-cyan-50/40 border border-cyan-100/30 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-white group-hover:border-cyan-200 transition-all duration-300">
                    <IconComp />
                  </div>
                  <h3 className="font-poppins font-bold text-xs md:text-[13px] text-slate-800 tracking-tight leading-snug text-center mb-2 group-hover:text-brand transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold text-center leading-normal max-w-[140px]">
                    {cat.desc}
                  </p>
                </div>
                
                {/* Aligned Typography and clean CTA placement */}
                <div className="flex items-center justify-between w-full border-t border-slate-50 pt-3.5 mt-4 text-slate-500 group-hover:text-brand font-poppins font-bold text-[10px] uppercase tracking-wider transition-colors">
                  <span>Book Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ==================== PREMIUM TRUST-STRIP SECTION ==================== */}
        <div className="mt-16 bg-white/70 backdrop-blur-md border border-cyan-100/25 rounded-2xl p-6 md:py-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-cyan-100/20 shadow-cyan-glow max-w-6xl mx-auto">
          
          {/* Verified Professionals */}
          <div className="flex items-center space-x-3.5 w-full md:w-auto md:px-4 py-2 md:py-0">
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 11 11 13 15 9"/>
              </svg>
            </div>
            <div className="text-left leading-tight">
              <span className="font-poppins font-bold text-xs text-slate-800 block">Verified Professionals</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Background verified experts</span>
            </div>
          </div>

          {/* Instant Service */}
          <div className="flex items-center space-x-3.5 w-full md:w-auto md:pl-8 md:pr-4 py-2.5 md:py-0">
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="text-left leading-tight">
              <span className="font-poppins font-bold text-xs text-slate-800 block">Instant Service</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Service in just 9 minutes</span>
            </div>
          </div>

          {/* Affordable Pricing */}
          <div className="flex items-center space-x-3.5 w-full md:w-auto md:pl-8 md:pr-4 py-2.5 md:py-0">
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <line x1="7" y1="15" x2="7.01" y2="15"/>
                <line x1="11" y1="15" x2="13" y2="15"/>
              </svg>
            </div>
            <div className="text-left leading-tight">
              <span className="font-poppins font-bold text-xs text-slate-800 block">Affordable Pricing</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Best price guarantee</span>
            </div>
          </div>

          {/* 24/7 Support */}
          <div className="flex items-center space-x-3.5 w-full md:w-auto md:pl-8 py-2 md:py-0">
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                <path d="M12 18.5a6.5 6.5 0 0 0 0-13"/>
              </svg>
            </div>
            <div className="text-left leading-tight">
              <span className="font-poppins font-bold text-xs text-slate-800 block">24/7 Support</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Always here to help</span>
            </div>
          </div>

        </div>

      </section>

      {/* ==================== 3. ANCHEPALYA MOST BOOKED SERVICES ==================== */}
      <section className="bg-gradient-to-b from-slate-50/50 to-cyan-50/20 border-y border-cyan-100/10 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-1">
            <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-tight">
              Anchepalya's Most Booked Services
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Top recurring bookings requested around Tumkur Main Road</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mostBooked.map((service, idx) => (
              <div key={idx} className="premium-card overflow-hidden flex flex-col justify-between group">
                <div>
                  {/* Image banner with rating tag */}
                  <div className="h-40 w-full overflow-hidden bg-slate-50 relative">
                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300" />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-100 text-[9px] font-black uppercase px-2.5 py-0.5 rounded shadow-xs flex items-center">
                      <Star className="w-3 h-3 text-amber-500 fill-current mr-0.5" />
                      {service.rating.replace('★','')}
                    </span>
                  </div>
                  {/* Info details */}
                  <div className="p-4 space-y-1.5 text-left">
                    <span className="text-[9px] text-brand font-black uppercase tracking-wider bg-cyan-50 border border-cyan-100 rounded px-1.5 py-0.5">{service.category}</span>
                    <h3 className="font-poppins font-black text-xs text-slate-800 leading-tight block pt-1">{service.name}</h3>
                    <div className="flex items-center text-[10px] text-slate-400 font-semibold pt-0.5">
                      <Clock className="w-3 h-3 mr-1 text-slate-300" /> Duration: {service.durationText}
                    </div>
                  </div>
                </div>
                {/* Book Action footer */}
                <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <span className="font-poppins font-black text-xs text-brand">Rs. {service.price.toLocaleString()}</span>
                  <button 
                    onClick={() => handleDirectBook(service)}
                    className="bg-brand hover:bg-brand-dark text-white font-poppins font-black text-[9px] py-1.5 px-4 rounded-lg uppercase tracking-wider shadow-sm transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ==================== 5. BOOKING PROCESS TIMELINE ==================== */}
      <section className="bg-slate-50 border-y border-slate-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-1">
            <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-tight">
              Platform Booking Journey
            </h2>
            <p className="text-xs text-slate-400 font-semibold">From service selection to dispatch in simple steps</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto">            <div className="premium-card flex flex-col items-center text-center space-y-2 p-6 w-full md:w-48">
              <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-black">1</span>
              <h4 className="font-poppins font-extrabold text-xs text-slate-800">Choose Service</h4>
              <p className="text-[10px] text-slate-400 font-medium">Select matching brochure details</p>
            </div>

            <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

            <div className="premium-card flex flex-col items-center text-center space-y-2 p-6 w-full md:w-48">
              <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-black">2</span>
              <h4 className="font-poppins font-extrabold text-xs text-slate-800">Select Time</h4>
              <p className="text-[10px] text-slate-400 font-medium">Pick a convenient delivery slot</p>
            </div>

            <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

            <div className="premium-card flex flex-col items-center text-center space-y-2 p-6 w-full md:w-48">
              <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-black">3</span>
              <h4 className="font-poppins font-extrabold text-xs text-slate-800">Secure Payment</h4>
              <p className="text-[10px] text-slate-400 font-medium">Pay via secure UPI checkouts</p>
            </div>

            <ArrowRight className="hidden md:block w-5 h-5 text-slate-300" />

            <div className="premium-card flex flex-col items-center text-center space-y-2 p-6 w-full md:w-48">
              <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-black">4</span>
              <h4 className="font-poppins font-extrabold text-xs text-slate-800">Worker Arrives</h4>
              <p className="text-[10px] text-slate-400 font-medium">Expert reaches in 9 minutes</p>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 7. INTERACTIVE CUSTOMER TESTIMONIALS SLIDER ==================== */}
      <section className="bg-gradient-to-b from-slate-50/30 to-cyan-50/20 border-t border-cyan-100/10 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className="space-y-1">
            <h2 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-tight">
              Anchepalya Residents Feedback
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Verified ratings by Prestige Jindal City customers</p>
          </div>

          {/* Interactive Testimonial Slider Container */}
          <div className="relative bg-white border border-cyan-100/25 rounded-3xl p-8 md:p-12 shadow-cyan-glow text-left max-w-2xl mx-auto">
            
            {/* Slide info */}
            <div className="min-h-[140px] flex flex-col justify-between">
              <div>
                <div className="flex space-x-0.5 text-amber-500 mb-4">
                  {[...Array(reviews[activeReviewIndex].score)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed italic mb-6 font-medium">
                  "{reviews[activeReviewIndex].comment}"
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">
                    {reviews[activeReviewIndex].name.charAt(0)}
                  </span>
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-extrabold text-slate-800">{reviews[activeReviewIndex].name}</span>
                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">{reviews[activeReviewIndex].loc}</span>
                  </div>
                </div>
                <span className="text-[9px] text-brand font-black uppercase bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded">
                  Booked: {reviews[activeReviewIndex].service}
                </span>
              </div>
            </div>

            {/* Slider Navigation arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6">
              <button 
                onClick={() => setActiveReviewIndex(prev => (prev - 1 + reviews.length) % reviews.length)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6">
              <button 
                onClick={() => setActiveReviewIndex(prev => (prev + 1) % reviews.length)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Indicator dots */}
            <div className="flex justify-center space-x-1.5 mt-6 border-t border-slate-50 pt-4">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveReviewIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeReviewIndex === i ? 'bg-brand w-4' : 'bg-slate-200'}`}
                ></button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 8. MOBILE APP EXPERIENCE BOTTOM STICKY CTA ==================== */}
      {/* Visible only on mobile sizes, provides sticky tap-friendly trigger */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-2xl md:hidden flex items-center justify-between">
        <div className="flex flex-col text-left">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">JK Enterprises</span>
          <span className="text-xs font-black text-slate-800 mt-1">Doorstep Pros in 9 Mins</span>
        </div>
        <button 
          onClick={() => document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' })}
          className="bg-brand text-white font-poppins font-black text-[10px] py-2 px-6 rounded-lg uppercase tracking-wider"
        >
          Book Service
        </button>
      </div>

      {/* WhatsApp floating button on viewport bottom corner */}
      <a 
        href="https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20want%20to%20book%20a%20home%20service."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 md:bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center animate-bounce"
        title="Chat on WhatsApp"
        style={{ animationDuration: '3s' }}
      >
        <MessageSquare className="w-5.5 h-5.5 fill-current" />
      </a>

      {/* ==================== 9. PROFESSIONAL 4-COLUMN FOOTER & MAP ==================== */}
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
              <div className="flex items-center"><MapPin className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> Anchepalya, Tumkur Road, Bengaluru - 560073</div>
              <div className="flex items-center"><PhoneCall className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> Ph: 8431588235</div>
              <div className="flex items-center"><Mail className="w-3.5 h-3.5 text-brand mr-1.5 flex-shrink-0" /> jayaketanaenterprises@gmail.com</div>
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
              <Link to="/services?category=Cleaning" className="hover:text-brand transition-colors block">Pest Control</Link>
            </div>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-[10.5px] font-semibold">
              <li><Link to="/services" className="hover:text-brand transition-colors">Find and Book Services</Link></li>
              <li><Link to="/auth" className="hover:text-brand transition-colors">Customer Login / SignUp</Link></li>
              <li><Link to="/dashboard" className="hover:text-brand transition-colors">Customer Portal Dashboard</Link></li>
              <li><Link to="/worker/dashboard" className="hover:text-brand transition-colors">Service Worker Portal</Link></li>
              <li><Link to="/admin" className="hover:text-brand transition-colors">Admin Management Panel</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Custom Google Map indicator card */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Newsletter & Base Location</h4>
            
            {newsletterSubscribed ? (
              <div className="bg-cyan-950/40 border border-cyan-900/60 text-cyan-400 p-2.5 rounded-lg text-[10px] font-bold">
                ✓ Registered! Use coupon code 9MINUTES for 20% off.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-1">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="bg-transparent text-xs px-2.5 outline-none flex-1 text-slate-300"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bg-brand hover:bg-brand-dark p-2 rounded text-white flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Stylized Google Map Visual Plate representing Prestige Jindal City base */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700">
                <Compass className="w-5 h-5 text-brand animate-pulse" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[10px] font-extrabold text-white block">Prestige Jindal City Base</span>
                <span className="text-[8.5px] text-slate-500 font-semibold block mt-0.5">Anchepalya Tumkur Main Rd</span>
                <a 
                  href="https://maps.google.com/?q=Prestige+Jindal+City+Anchepalya+Bengaluru" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand hover:underline text-[9px] font-bold mt-1 block uppercase tracking-wider"
                >
                  Get Directions →
                </a>
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

    </div>
  );
}
