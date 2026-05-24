import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  MapPin,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  MessageSquare,
  Search,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ onCartToggle }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const { notifications } = useNotificationStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  // Interactive Location state variables
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Prestige Jindal City, Anchepalya');
  
  // Dynamic search in Navbar
  const [navSearch, setNavSearch] = useState('');

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotif = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/services?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  const serviceAreas = [
    'Prestige Jindal City, Anchepalya',
    'Tumkur Main Road, Anchepalya',
    'Chikkabidarakallu, Anchepalya',
    'Anchepalya Village Base',
    'Jindal Nagar Metro Sector'
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass bg-white/85 shadow-sm border-b border-slate-100 font-inter transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-9 h-9 bg-brand rounded-lg text-white font-poppins font-bold text-lg shadow-md shadow-brand/20">
                JK
              </span>
              <div className="flex flex-col">
                <span className="font-poppins font-extrabold text-brand leading-tight tracking-wide text-sm sm:text-base">
                  JK ENTERPRISES
                </span>
                <span className="text-[9px] font-medium text-slate-400 -mt-0.5 tracking-tighter">
                   Anchepalya • 9 Min dispatch
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation & Sleek Search Bar */}
          <div className="hidden md:flex items-center space-x-6 flex-1 max-w-xl mx-8">
            <Link to="/services" className="text-slate-600 hover:text-brand font-semibold text-xs transition-colors uppercase tracking-wider">
              Our Services
            </Link>
            
            {/* Integrated Search capsule */}
            <form onSubmit={handleNavSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search home services..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/60 border border-slate-200/80 rounded-full outline-none text-xs focus:border-brand focus:bg-white transition-all font-medium"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </form>
          </div>

          {/* User Controls & CTA Panel */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* WhatsApp CTA */}
            <a 
              href="https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20want%20to%20book%20a%20home%20service."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1.5 transition-all font-bold tracking-wide"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500 fill-current" />
              <span>WhatsApp Chat</span>
            </a>

            {/* Interactive Location Dropdown Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowLocationSelect(!showLocationSelect)}
                className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-full px-3.5 py-1.5 hover:bg-slate-100/80 transition-all font-bold cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span className="truncate max-w-[120px]">{selectedLocation.split(',')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showLocationSelect && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-1.5 border-b border-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Select Service Area
                  </div>
                  <div className="max-h-48 overflow-y-auto px-1 py-1">
                    {serviceAreas.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setShowLocationSelect(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedLocation === loc 
                            ? 'bg-brand/10 text-brand font-black' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown Trigger */}
            {isAuthenticated && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotif > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4.5 h-4.5 bg-red-500 text-[9px] font-bold text-white rounded-full ring-2 ring-white">
                      {unreadNotif}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer */}
                {showNotif && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                      <span className="font-poppins font-bold text-xs text-slate-800">Alert Center</span>
                      <span className="text-[10px] text-slate-400">Live Updates</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto px-2">
                      {notifications.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-6">No new notifications.</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-2.5 my-1.5 rounded-lg text-xs transition-colors ${n.isRead ? 'bg-white' : 'bg-slate-50 border-l-2 border-brand'}`}>
                            <div className="font-bold text-slate-800">{n.title}</div>
                            <div className="text-slate-500 mt-0.5">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart Bag */}
            <button 
              onClick={onCartToggle}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4.5 h-4.5 bg-brand text-[9px] font-bold text-white rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Session Profile details */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-100">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[9px] font-bold text-brand tracking-tighter uppercase">{user.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="bg-brand hover:bg-brand-dark text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow-md shadow-brand/10 hover:shadow-brand/20 transition-all font-inter"
              >
                Log In
              </Link>
            )}

          </div>

          {/* Mobile responsive toggle */}
          <div className="md:hidden flex items-center space-x-3">
            <button onClick={onCartToggle} className="relative p-2 text-slate-600">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4.5 h-4.5 bg-brand text-[9px] font-bold text-white rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-3 animate-fade-in">
          {/* Mobile search bar */}
          <form onSubmit={handleNavSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search home services..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs focus:border-brand transition-colors font-medium"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </form>

          {/* WhatsApp mobile CTA */}
          <a 
            href="https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20want%20to%20book%20a%20home%20service."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 w-full font-bold mb-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500 fill-current" />
            <span>WhatsApp Contact Support</span>
          </a>

          <Link to="/services" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">
            Our Services
          </Link>
          {isAuthenticated && user && (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">
                  Admin Panel
                </Link>
              )}
              {user.role === 'WORKER' && (
                <Link to="/worker/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">
                  Worker Portal
                </Link>
              )}
              {user.role === 'USER' && (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">
                  My Bookings
                </Link>
              )}
              <div className="border-t border-slate-50 pt-2 flex items-center justify-between px-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-1 text-red-500 text-xs font-medium">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
          {!isAuthenticated && (
            <Link to="/auth" onClick={() => setIsOpen(false)} className="block text-center bg-brand text-white font-medium text-sm py-2 rounded-lg mt-2">
              Log In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
