import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Phone, Briefcase, CheckCircle, Truck, DollarSign, Star,
  ShieldCheck, Clock, FileText, CreditCard, HelpCircle, LogOut, Activity, User as UserIcon,
  ChevronLeft, ChevronRight, Sliders, Settings, Send, ArrowUpRight, TrendingUp, AlertCircle,
  Bell, Check, Map, RefreshCw, Smartphone
} from 'lucide-react';

export default function WorkerPortal() {
  const { bookings, fetchBookings, updateJobStatus } = useBookingStore();
  const { user, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  // Primary view state: 'menu', 'earnings', 'active_bookings', 'booking_requests', 'completed_services', 'wallet_payouts', 'performance_ratings', 'work_schedule', 'availability_settings', 'uploaded_documents', 'support_center', 'account_settings'
  const [currentView, setCurrentView] = useState('menu');

  // Duty status & local states
  const [isOnline, setIsOnline] = useState(() => {
    const val = localStorage.getItem('jk_worker_online');
    return val !== null ? JSON.parse(val) : true;
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    const val = localStorage.getItem('jk_worker_wallet');
    return val !== null ? parseFloat(val) : 4280.00;
  });

  const [walletHistory, setWalletHistory] = useState(() => {
    const val = localStorage.getItem('jk_worker_wallet_history');
    if (val) return JSON.parse(val);
    return [
      { id: 'TXN-98431-01', amount: 1400.00, date: '2026-05-24', type: 'PAYOUT', status: 'SETTLED', desc: 'Auto-transfer to HDFC' },
      { id: 'TXN-98431-02', amount: 699.00, date: '2026-05-23', type: 'EARNING', status: 'COMPLETED', desc: 'Job Ref #bk-9821' },
      { id: 'TXN-98431-03', amount: 1999.00, date: '2026-05-22', type: 'EARNING', status: 'COMPLETED', desc: 'Job Ref #bk-4811' }
    ];
  });

  const [schedule, setSchedule] = useState(() => {
    const val = localStorage.getItem('jk_worker_schedule');
    if (val) return JSON.parse(val);
    return {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      slots: ['Morning Shift (8 AM - 12 PM)', 'Afternoon Shift (12 PM - 4 PM)']
    };
  });

  const [availability, setAvailability] = useState(() => {
    const val = localStorage.getItem('jk_worker_availability');
    if (val) return JSON.parse(val);
    return {
      autoAccept: false,
      radius: 12,
      maxJobs: 5,
      silentHours: true
    };
  });

  const [partnerProfile, setPartnerProfile] = useState({
    name: user?.name || 'Vijay Kumar',
    phone: user?.phone || '8877665544',
    email: user?.email || 'vijay@jkenterprises.com',
    category: user?.category || 'Cleaning Expert',
    bankName: 'HDFC Bank Ltd',
    accNo: 'XXXXXX843128',
    ifsc: 'HDFC0000213',
    holderName: user?.name || 'Vijay Kumar'
  });

  // Local state for interactive Support AI Chat
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi partner! I am the JK Enterprises Partner Assistant. How can I help you today?', time: '12:30 PM' }
  ]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Local state for dynamic live booking requests
  const [mockRequests, setMockRequests] = useState([
    {
      id: 'booking-req-101',
      serviceName: 'Full Home Deep Cleaning',
      category: 'Cleaning',
      finalPrice: 1999,
      timeSlot: 'Today, 4:00 PM',
      address: 'Sobha Lavender, HSR Layout, Sector 3, Bangalore',
      distance: '1.8 km away',
      expiresIn: 179
    },
    {
      id: 'booking-req-102',
      serviceName: 'Kitchen Sink Tap Replacement',
      category: 'Plumbing',
      finalPrice: 699,
      timeSlot: 'Tomorrow, 10:00 AM',
      address: 'Prestige Sunrise, Block C-302, Electronic City Phase 1, Bangalore',
      distance: '3.4 km away',
      expiresIn: 239
    }
  ]);

  // Handle countdown timers for pending requests
  useEffect(() => {
    const timer = setInterval(() => {
      setMockRequests((prev) => 
        prev
          .map((req) => ({ ...req, expiresIn: req.expiresIn - 1 }))
          .filter((req) => req.expiresIn > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync bookings & support scroll
  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Block unverified workers from entering dashboard
  const approvalStatus = user?.approvalStatus || user?.workerProfile?.approvalStatus || 'APPROVED';

  if (approvalStatus !== 'APPROVED') {
    let title = "Verification Pending";
    let message = "Your application is currently under review.";
    let submessage = "Our verification team will review your application. You will receive approval notification after successful verification.";
    let iconColor = "text-amber-400";
    let badgeBg = "bg-amber-500/10 border-amber-500/20";
    
    if (approvalStatus === 'UNDER_REVIEW') {
      title = "Under Active Review";
      message = "Your application is currently under review.";
      submessage = "We are currently checking your credentials and service area coverage. Please hold tight.";
      iconColor = "text-cyan-400";
      badgeBg = "bg-cyan-500/10 border-cyan-500/20";
    } else if (approvalStatus === 'REJECTED') {
      title = "Application Rejected";
      message = "Your application was not approved. Please contact support.";
      submessage = "Unfortunately, your application did not meet our verification standards. Please contact support for details.";
      iconColor = "text-red-400";
      badgeBg = "bg-red-500/10 border-red-500/20";
    }

    return (
      <div className="bg-slate-950 min-h-screen font-inter flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-navy to-brand"></div>
          
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border ${badgeBg}`}>
            <Clock className={`w-10 h-10 ${iconColor} animate-pulse`} />
          </div>
          
          <h2 className="font-poppins font-black text-2xl text-white mb-3 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-200 font-bold leading-normal mb-3">
            {message}
          </p>
          <p className="text-xs text-slate-400 mb-8 leading-relaxed">
            {submessage}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all"
            >
              Go to Homepage
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-brand/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter bookings assigned to this worker
  const myBookings = bookings.filter(b => b.workerId === 'w-2' || b.workerId === 'w-1' || b.workerId === `user-worker-${user?.id}`);

  // Group bookings
  const activeJobs = myBookings.filter(b => ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(b.status));
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');

  // Earnings calculations (70% commission split standard if not set)
  const totalEarnings = completedJobs.reduce((sum, b) => {
    const commission = b.workerEarnings > 0 ? b.workerEarnings : (b.finalPrice * 0.70);
    return sum + commission;
  }, 0.0);

  // Availability toggle
  const toggleOnlineStatus = () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    localStorage.setItem('jk_worker_online', JSON.stringify(nextOnline));
    addNotification(
      nextOnline ? 'Duty Online' : 'Duty Offline',
      `You are now ${nextOnline ? 'ONLINE' : 'OFFLINE'} and ${nextOnline ? 'open to receive new bookings' : 'resting'}.`
    );
  };

  // Status transitions for jobs
  const handleStatusShift = async (bookingId, currentStatus) => {
    let nextStatus = 'ON_THE_WAY';
    if (currentStatus === 'ASSIGNED') nextStatus = 'ON_THE_WAY';
    else if (currentStatus === 'ON_THE_WAY') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'COMPLETED';

    const ok = await updateJobStatus(bookingId, nextStatus);
    if (ok) {
      if (nextStatus === 'COMPLETED') {
        // Automatically add 70% split to wallet balance
        const job = myBookings.find(b => b.id === bookingId);
        const earned = job ? (job.workerEarnings > 0 ? job.workerEarnings : (job.finalPrice * 0.70)) : 500;
        setWalletBalance((prev) => {
          const next = prev + earned;
          localStorage.setItem('jk_worker_wallet', next.toString());
          return next;
        });

        // Add to wallet history
        setWalletHistory((prev) => {
          const next = [
            { id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`, amount: earned, date: new Date().toISOString().split('T')[0], type: 'EARNING', status: 'COMPLETED', desc: `Job Ref #${bookingId.substring(0,8)}` },
            ...prev
          ];
          localStorage.setItem('jk_worker_wallet_history', JSON.stringify(next));
          return next;
        });
      }
      
      addNotification('Booking Status Shifted', `Job Ref #${bookingId.substring(0,8)} moved to "${nextStatus.replace(/_/g, ' ')}" successfully.`);
      fetchBookings();
    }
  };

  // Accept a live request
  const handleAcceptRequest = async (req) => {
    // Generate active booking in store/local storage
    const newBooking = {
      id: req.id.replace('req-', ''),
      serviceName: req.serviceName,
      category: req.category,
      finalPrice: req.finalPrice,
      timeSlot: req.timeSlot,
      address: req.address,
      phone: '9843188235',
      status: 'ASSIGNED',
      paymentStatus: 'UNPAID',
      workerId: `user-worker-${user?.id}` || 'w-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Push into bookings via local simulation or store dispatch
    const currentList = JSON.parse(localStorage.getItem('jk_bookings')) || [];
    currentList.push(newBooking);
    localStorage.setItem('jk_bookings', JSON.stringify(currentList));
    
    // Remote dispatch trigger
    await fetchBookings();
    
    // Remove request from available mockRequests
    setMockRequests(prev => prev.filter(r => r.id !== req.id));

    addNotification('Job Accepted! 🎉', `Successfully accepted "${req.serviceName}". Navigate to Active Bookings to start!`);
    setCurrentView('active_bookings');
  };

  // Reject a live request
  const handleRejectRequest = (reqId) => {
    setMockRequests(prev => prev.filter(r => r.id !== reqId));
    addNotification('Request Dismissed', 'You rejected the incoming job request.');
  };

  // Withdraw funds
  const handleCashout = () => {
    if (walletBalance <= 0) return;
    
    const payoutAmount = walletBalance;
    setIsTyping(true); // temporary spinner flag
    
    setTimeout(() => {
      setIsTyping(false);
      setWalletBalance(0);
      localStorage.setItem('jk_worker_wallet', '0');

      // Append cashout to history
      setWalletHistory((prev) => {
        const next = [
          { id: `TXN-OUT-${Math.floor(10000 + Math.random() * 90000)}`, amount: payoutAmount, date: new Date().toISOString().split('T')[0], type: 'PAYOUT', status: 'SETTLED', desc: 'Instant cashout to HDFC' },
          ...prev
        ];
        localStorage.setItem('jk_worker_wallet_history', JSON.stringify(next));
        return next;
      });

      addNotification('Instant Payout Successful! 🏦', `Transferred Rs. ${payoutAmount.toLocaleString()} to HDFC Bank ****8431 successfully.`);
      alert(`🏦 Payout Cleared Successfully!\nRs. ${payoutAmount.toLocaleString()} has been sent to: \nAccount: HDFC Bank - ****8431\nReference ID: TXN-OUT-${Math.floor(10000000 + Math.random() * 90000000)}`);
    }, 1500);
  };

  // Save operational schedules
  const handleSaveSchedule = (newDays, newSlots) => {
    const nextSched = { days: newDays, slots: newSlots };
    setSchedule(nextSched);
    localStorage.setItem('jk_worker_schedule', JSON.stringify(nextSched));
    addNotification('Duty Schedule Updated', 'Your weekly work slots and off-days have been saved successfully.');
    alert('📅 Operational schedule saved successfully!');
    setCurrentView('menu');
  };

  // Save settings
  const handleSaveSettings = (updatedDetails) => {
    setPartnerProfile(updatedDetails);
    addNotification('Settings Modified', 'Your personal account profile & bank specs were updated.');
    alert('✅ Account & Bank settings updated successfully!');
    setCurrentView('menu');
  };

  // Support AI Agent responses simulation
  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: typedMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const prompt = typedMessage.toLowerCase();
    setTypedMessage('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "I have noted down your concern. Our backend support representative will review this and call you within 15 minutes.";
      if (prompt.includes('pay') || prompt.includes('earn') || prompt.includes('wallet')) {
        replyText = "🏦 Standard payout settlements are instant. If your transaction shows 'Processing', it will resolve automatically within 30 minutes. Rest assured your funds are 100% safe.";
      } else if (prompt.includes('cancel') || prompt.includes('booking')) {
        replyText = "⚠️ To cancel an active service booking, please contact the customer directly first. If they request a cancellation, trigger the 'Partner Support Helpline' for quick dispatch release.";
      } else if (prompt.includes('accident') || prompt.includes('emergency') || prompt.includes('help')) {
        replyText = "🚨 Emergency Protocol: If you are at a job site and feel unsafe or have encountered an accident, please call our 24/7 Priority Helpline immediately at +91 99000 88223.";
      } else if (prompt.includes('category') || prompt.includes('skill')) {
        replyText = "🛠️ Category additions require submitting an experience certificate. You can upload it in the 'Uploaded Documents' section for admin panel evaluation.";
      }

      setIsTyping(false);
      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1500);
  };

  // Trigger quick responses in chat
  const triggerPresetResponse = (presetText) => {
    setTypedMessage(presetText);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out of the Partner App?')) {
      await logout();
      navigate('/');
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-inter pb-24 md:pb-12 selection:bg-teal-500 selection:text-white">
      
      {/* HEADER SECTION - Rendered globally or customized inside views */}
      {currentView === 'menu' ? (
        <div className="bg-gradient-to-b from-brand-navy to-slate-900 pt-8 pb-20 px-4 rounded-b-[2.5rem] shadow-2xl relative border-b border-teal-500/10">
          <div className="max-w-4xl mx-auto flex justify-between items-start">
            
            {/* Left: Partner details & verified badge */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-full blur-md opacity-70 animate-pulse"></div>
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-teal-400 overflow-hidden shadow-lg relative z-10">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Worker Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-teal-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-1 shadow-md border-2 border-slate-900 z-20">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-poppins font-black text-xl text-white tracking-tight">{partnerProfile.name}</h1>
                  <span className="bg-teal-500/20 text-teal-300 font-poppins font-black text-[9px] px-2 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest flex items-center">
                    <Check className="w-2.5 h-2.5 mr-0.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] mt-1 font-semibold text-slate-300">
                  <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-teal-400">{partnerProfile.category}</span>
                  <span className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 mr-0.5 fill-current" /> 4.90
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Logout & Info */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setCurrentView('account_settings')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white border border-slate-700/50 shadow-md"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogout} 
                className="p-2.5 bg-rose-950/40 hover:bg-rose-900/60 rounded-full transition-colors text-rose-400 hover:text-rose-300 border border-rose-900/40 shadow-md"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* Subview Premium Sticky Header */
        <div className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-4 py-4 border-b border-slate-800 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('menu')}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl transition-all border border-slate-700/30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="font-poppins font-extrabold text-sm uppercase tracking-widest text-slate-200">
              {currentView.replace(/_/g, ' ')}
            </h2>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-teal-500/30 overflow-hidden flex items-center justify-center">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Worker Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-teal-400" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-4">
        
        {/* ========================================================= */}
        {/* VIEW 1: MAIN MENU / HOMEPAGE */}
        {/* ========================================================= */}
        {currentView === 'menu' && (
          <div className="-mt-14 space-y-6">
            
            {/* Availability Toggle & Quick Stats bar */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5">
                <div>
                  <span className="font-bold text-sm block text-slate-200">Operational Duty Status</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Toggle Online to get live broadcast requests</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isOnline ? 'text-teal-400' : 'text-slate-400'}`}>
                    {isOnline ? 'Online / Duty ON' : 'Offline / Resting'}
                  </span>
                  <button 
                    onClick={toggleOnlineStatus}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 outline-none ${isOnline ? 'bg-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-800 border border-slate-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/60 rounded-2xl p-3 text-center border border-slate-800/80 relative group hover:border-teal-500/30 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Cash</span>
                  <span className="font-poppins font-black text-base text-white flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-teal-400 mr-0.5" />
                    {totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950/60 rounded-2xl p-3 text-center border border-slate-800/80 relative group hover:border-teal-500/30 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Active Jobs</span>
                  <span className="font-poppins font-black text-base text-white flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-sky-400 mr-1" />
                    {activeJobs.length}
                  </span>
                </div>
                <div className="bg-slate-950/60 rounded-2xl p-3 text-center border border-slate-800/80 relative group hover:border-teal-500/30 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Wallet Ball</span>
                  <span className="font-poppins font-black text-base text-teal-400 flex items-center justify-center">
                    ₹{walletBalance.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE BROADCAST ALERT FOR PENDING REQUESTS */}
            {isOnline && mockRequests.length > 0 && (
              <div 
                onClick={() => setCurrentView('booking_requests')}
                className="bg-gradient-to-r from-teal-950/60 to-cyan-950/40 border border-teal-500/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-teal-400 transition-all shadow-lg animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl relative">
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Live Booking Requests Received!</h4>
                    <p className="text-[10px] text-slate-300 mt-0.5">{mockRequests.length} new customer jobs matched near your location</p>
                  </div>
                </div>
                <div className="bg-teal-500/20 hover:bg-teal-500/30 p-1.5 rounded-lg text-teal-400">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* MAIN OPERATIONAL GRID MENUS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              {/* 1. Dashboard */}
              <div 
                onClick={() => setCurrentView('menu')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-cyan-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="bg-teal-500/20 text-teal-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-teal-500/30">
                    Live
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Dashboard</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Overview & duty status</p>
                </div>
              </div>

              {/* 2. New Orders */}
              <div 
                onClick={() => setCurrentView('booking_requests')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  {mockRequests.length > 0 && (
                    <span className="bg-teal-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                      {mockRequests.length} New
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">New Orders</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Accept or reject list</p>
                </div>
              </div>

              {/* 3. Assigned Jobs */}
              <div 
                onClick={() => setCurrentView('active_bookings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-sky-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {activeJobs.length > 0 && (
                    <span className="bg-blue-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                      {activeJobs.length} Job
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Assigned Jobs</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Pending assigned bookings</p>
                </div>
              </div>

              {/* 4. Active Jobs */}
              <div 
                onClick={() => setCurrentView('active_bookings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  {activeJobs.filter(j => j.status === 'IN_PROGRESS').length > 0 && (
                    <span className="bg-sky-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Active Jobs</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Ongoing jobs in progress</p>
                </div>
              </div>

              {/* 5. Completed Jobs */}
              <div 
                onClick={() => setCurrentView('completed_services')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="bg-purple-500/20 text-purple-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30">
                    {completedJobs.length} Settled
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Completed Jobs</h3>
                  <p className="text-[9px] text-slate-400 mt-1">History & work ledger</p>
                </div>
              </div>

              {/* 6. Earnings */}
              <div 
                onClick={() => setCurrentView('earnings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-teal-400"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="bg-cyan-500/20 text-cyan-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-cyan-500/30">
                    INR
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Earnings</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Profit share analytics</p>
                </div>
              </div>

              {/* 7. Wallet */}
              <div 
                onClick={() => setCurrentView('wallet_payouts')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="bg-orange-500/20 text-orange-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-orange-500/30 font-poppins">
                    ₹{walletBalance.toFixed(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Wallet</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Ready to cashout funds</p>
                </div>
              </div>

              {/* 8. Payout History */}
              <div 
                onClick={() => setCurrentView('wallet_payouts')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <span className="bg-red-500/20 text-red-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-red-500/30">
                    History
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Payout History</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Bank transfer logs</p>
                </div>
              </div>

              {/* 9. Ratings & Reviews */}
              <div 
                onClick={() => setCurrentView('performance_ratings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5" />
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30">
                    4.9 ★
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Ratings & Reviews</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Customer feedback metrics</p>
                </div>
              </div>

              {/* 10. Availability */}
              <div 
                onClick={() => setCurrentView('availability_settings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Slots
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Availability</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Weekly shifts & coverage</p>
                </div>
              </div>

              {/* 11. Profile */}
              <div 
                onClick={() => setCurrentView('account_settings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-indigo-500/30">
                    ID
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Profile</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Personal registry specs</p>
                </div>
              </div>

              {/* 12. Documents */}
              <div 
                onClick={() => setCurrentView('uploaded_documents')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="bg-teal-500/20 text-teal-300 font-bold text-[9px] px-2.5 py-0.5 rounded-full border border-teal-500/30">
                    Verified
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Documents</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Aadhaar & photos audit</p>
                </div>
              </div>

              {/* 13. Support */}
              <div 
                onClick={() => setCurrentView('support_center')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="bg-violet-500/20 text-violet-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-violet-500/30">
                    24/7 Chat
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Support</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Help desk assistant</p>
                </div>
              </div>

              {/* 14. Settings */}
              <div 
                onClick={() => setCurrentView('account_settings')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-slate-400"></div>
                <div className="flex justify-between items-center mb-6">
                  <div className="p-2.5 bg-slate-500/10 text-slate-300 rounded-xl group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-500/20 text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded-full border border-slate-500/30">
                    System
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins font-black text-xs text-white">Settings</h3>
                  <p className="text-[9px] text-slate-400 mt-1">Preferences & parameters</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: MY EARNINGS VIEW */}
        {/* ========================================================= */}
        {currentView === 'earnings' && (
          <div className="py-6 space-y-6">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Today's Revenue</span>
                  <span className="font-poppins font-black text-2xl text-white block mt-2">Rs. {completedJobs.length > 0 ? (totalEarnings * 0.4).toFixed(0) : '0'}</span>
                </div>
                <div className="flex items-center text-[10px] text-teal-400 font-bold mt-4">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>+12.4% from yesterday</span>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Weekly Settlement</span>
                  <span className="font-poppins font-black text-2xl text-teal-400 block mt-2">Rs. {totalEarnings.toFixed(0)}</span>
                </div>
                <span className="text-[9px] text-slate-500 font-bold mt-4">Payout Period: May 18 - May 25</span>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl"></div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monthly Total</span>
                  <span className="font-poppins font-black text-2xl text-white block mt-2">Rs. {(totalEarnings * 3.2).toFixed(0)}</span>
                </div>
                <span className="text-[9px] text-teal-400 font-bold mt-4">Standard 70-30 Profit Split Applied</span>
              </div>
            </div>

            {/* GORGEOUS CSS GRAPH (SVG GRADIENT AREA BAR CHART) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Weekly Performance Curve</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Visual split representing daily commissions</p>
                </div>
                <div className="flex items-center space-x-2 text-[9px] bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full inline-block"></span>
                  <span className="text-slate-300 font-bold">Earnings (INR)</span>
                </div>
              </div>

              {/* Dynamic SVG Area & Bar combo chart */}
              <div className="h-48 w-full flex items-end justify-between px-2 pt-4 relative">
                {/* Horizontal gridlines */}
                <div className="absolute inset-x-0 top-1/4 h-[1px] bg-slate-800/40"></div>
                <div className="absolute inset-x-0 top-2/4 h-[1px] bg-slate-800/40"></div>
                <div className="absolute inset-x-0 top-3/4 h-[1px] bg-slate-800/40"></div>

                {[
                  { day: 'Mon', amt: 1200, pct: 40 },
                  { day: 'Tue', amt: 1900, pct: 75 },
                  { day: 'Wed', amt: 699,  pct: 25 },
                  { day: 'Thu', amt: 2300, pct: 90 },
                  { day: 'Fri', amt: 1400, pct: 50 },
                  { day: 'Sat', amt: 2900, pct: 100 },
                  { day: 'Sun', amt: 1800, pct: 65 }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group z-10">
                    {/* Tooltip */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-teal-500 text-white font-poppins font-black text-[9px] px-1.5 py-0.5 rounded absolute bottom-[110%] shadow-md select-none pointer-events-none transform -translate-y-1">
                      ₹{item.amt}
                    </span>
                    {/* Bar visual with turquoise gradient */}
                    <div className="w-8 rounded-t-lg bg-gradient-to-t from-teal-600/30 to-teal-400 group-hover:to-cyan-400 transition-all cursor-pointer relative overflow-hidden" style={{ height: `${item.pct * 1.3 + 10}px` }}>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    {/* Day label */}
                    <span className="text-[10px] text-slate-400 font-bold mt-2">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Ledger Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                <span className="font-poppins font-black text-xs text-white uppercase tracking-wider">Settlement Ledger</span>
                <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">70% Commission Split</span>
              </div>
              <div className="divide-y divide-slate-800">
                {completedJobs.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                    No completed jobs found. Take jobs from "Booking Requests" to populate your ledger!
                  </div>
                ) : (
                  completedJobs.map((job) => {
                    const commission = job.workerEarnings > 0 ? job.workerEarnings : (job.finalPrice * 0.70);
                    return (
                      <div key={job.id} className="p-4 flex justify-between items-center hover:bg-slate-800/40 transition-colors">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">#{job.id.substring(0, 8)}</span>
                            <span className="bg-slate-800 text-slate-300 font-bold text-[9px] px-1.5 py-0.5 rounded">
                              {job.serviceName || 'Cleaning Service'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                            {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Today'} • {job.address.split(',')[0]}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-poppins font-black text-xs text-teal-400 block">
                            + Rs. {commission.toLocaleString()}
                          </span>
                          <span className="text-[8.5px] text-slate-500 font-bold block">Final Price: ₹{job.finalPrice}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: ACTIVE BOOKINGS VIEW */}
        {/* ========================================================= */}
        {currentView === 'active_bookings' && (
          <div className="py-6 space-y-4">
            {activeJobs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-3xl flex flex-col items-center shadow-lg">
                <div className="w-16 h-16 bg-slate-850 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-white">No Active Bookings</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">Ensure your Duty Status is toggled ONLINE and accept matching bookings from the "Booking Requests" queue.</p>
                <button 
                  onClick={() => setCurrentView('booking_requests')}
                  className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-poppins font-bold text-xs px-6 py-3 rounded-xl uppercase tracking-wider transition-all"
                >
                  View Incoming Requests
                </button>
              </div>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-sky-500"></div>
                  
                  <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-white bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                          {job.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">Ref: #{job.id.substring(0,8)}</span>
                      </div>
                      <h3 className="font-poppins font-black text-sm text-white mt-2">{job.serviceName || 'Expert Cleaning'}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Scheduled Slot</span>
                      <span className="font-bold text-teal-400 text-xs bg-slate-950 px-2 py-1 rounded border border-slate-850 mt-1 inline-block">{job.timeSlot}</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-slate-300">
                    
                    {/* Location Details & Map Preview Mockup */}
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-teal-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-black text-white block">Customer Destination Address</span>
                        <span className="text-slate-400 mt-1 block leading-relaxed">{job.address}</span>
                      </div>
                    </div>

                    {/* Styled MAP MOCKUP (Stylized Dark Mode Google Map) */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-850 p-1 overflow-hidden relative group">
                      <div className="h-32 w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden">
                        
                        {/* Simulated route line */}
                        <svg className="absolute inset-0 w-full h-full">
                          <path d="M 50,80 Q 150,20 280,60" fill="none" stroke="#0891b2" strokeWidth="3" strokeDasharray="6" className="animate-[dash_5s_linear_infinite]" />
                        </svg>

                        {/* Customer Pin */}
                        <div className="absolute top-[40px] left-[270px] z-10 flex flex-col items-center">
                          <span className="w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping absolute"></span>
                          <span className="w-3 h-3 bg-rose-500 rounded-full border-2 border-white relative z-10"></span>
                          <span className="bg-rose-500/90 text-white font-poppins font-black text-[8px] px-1 rounded shadow-md mt-1">Cust</span>
                        </div>

                        {/* Worker Pin */}
                        <div className="absolute top-[70px] left-[45px] z-10 flex flex-col items-center">
                          <Truck className="w-5 h-5 text-teal-400 fill-teal-500/20" />
                          <span className="bg-teal-500/90 text-white font-poppins font-black text-[8px] px-1 rounded shadow-md mt-1">You</span>
                        </div>

                        <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg select-none">
                          1.8 km (12 mins away)
                        </span>
                      </div>
                      
                      <div className="p-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">GPS Coordinate Synced</span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-400 font-bold hover:underline flex items-center"
                        >
                          <Map className="w-3 h-3 mr-1" /> Open Live GPS
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-b border-slate-800/60 py-3 my-2">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-emerald-400 mr-2" />
                        <span className="font-bold text-white text-xs">Customer Contact:</span>
                      </div>
                      <a 
                        href={`tel:${job.phone || '9843188235'}`}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-[10px] px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                      >
                        Dial Voice Call
                      </a>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Collection Split</span>
                        <span className="font-bold text-white text-xs block mt-0.5">Collect COD Cash</span>
                      </div>
                      <div className="text-right">
                        <span className="font-poppins font-black text-sm text-teal-400">Rs. {job.finalPrice.toLocaleString()}</span>
                        <span className="text-[8px] text-slate-500 block">Payout Split: ₹{(job.finalPrice * 0.70).toFixed(0)} (70%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Status slide transitions controls */}
                  <div className="border-t border-slate-800/80 pt-4">
                    <button 
                      onClick={() => handleStatusShift(job.id, job.status)}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-teal-500/15 transition-all flex items-center justify-center space-x-2"
                    >
                      {job.status === 'ASSIGNED' ? (
                        <>
                          <Truck className="w-5 h-5 transform -scale-x-100 animate-bounce" />
                          <span>Start Trip: On The Way</span>
                        </>
                      ) : job.status === 'ON_THE_WAY' ? (
                        <>
                          <MapPin className="w-5 h-5 text-white animate-pulse" />
                          <span>Arrived at Customer Spot</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-white" />
                          <span>Complete Work & Collect Cash</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: BOOKING REQUESTS (LIVE SCANNER) */}
        {/* ========================================================= */}
        {currentView === 'booking_requests' && (
          <div className="py-6 space-y-6">
            
            {/* Live radar scanner widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden flex flex-col items-center justify-center">
              
              {/* Sonar sweep animations */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <span className="absolute inset-0 bg-teal-500/10 rounded-full border border-teal-500/30 animate-ping opacity-60"></span>
                <span className="absolute inset-4 bg-teal-500/10 rounded-full border border-teal-500/20 animate-pulse"></span>
                <div className="w-20 h-20 bg-slate-950 rounded-full border-2 border-teal-500/40 flex items-center justify-center z-10 shadow-inner">
                  <Activity className="w-10 h-10 text-teal-400 animate-pulse" />
                </div>
              </div>
              
              <h3 className="font-poppins font-black text-xs text-white uppercase tracking-widest">Live Broadcast Scanner</h3>
              <p className="text-[10px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                {mockRequests.length > 0 
                  ? `Found ${mockRequests.length} matching client request(s) around your coordinates.` 
                  : 'Scanning for matching service requests in Bangalore... Keep App open.'}
              </p>
            </div>

            {/* List of Incoming requests */}
            <div className="space-y-4">
              {mockRequests.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 text-xs font-semibold">
                  No pending broadcast requests active right now.
                </div>
              ) : (
                mockRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden transition-all hover:border-teal-500/30">
                    <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 font-poppins font-black text-[9px] px-3 py-1 rounded-bl-xl border-l border-b border-rose-500/20 uppercase tracking-widest flex items-center">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block mr-1.5 animate-ping"></span>
                      Expires in {req.expiresIn}s
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{req.category} Expert</span>
                      <h4 className="font-poppins font-black text-sm text-white mt-1">{req.serviceName}</h4>
                      <div className="flex items-center space-x-2 text-[10px] text-teal-400 font-bold mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        <span>{req.distance} • Bangalore Central</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>Time Slot:</span>
                        <span className="font-bold text-white">{req.timeSlot}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>Location:</span>
                        <span className="font-bold text-white max-w-[200px] truncate">{req.address}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[10px] border-t border-slate-900 pt-2">
                        <span>Partner Payout (70%):</span>
                        <span className="font-poppins font-black text-teal-400 text-xs">Rs. {(req.finalPrice * 0.70).toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => handleRejectRequest(req.id)}
                        className="bg-slate-950 hover:bg-slate-900 text-slate-400 font-poppins font-bold text-xs py-3 rounded-xl border border-slate-800 hover:text-white transition-all uppercase tracking-wider"
                      >
                        Ignore
                      </button>
                      <button 
                        onClick={() => handleAcceptRequest(req)}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 text-white font-poppins font-black text-xs py-3 rounded-xl shadow-md shadow-teal-500/10 transition-all uppercase tracking-wider"
                      >
                        Accept Booking
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: COMPLETED SERVICES */}
        {/* ========================================================= */}
        {currentView === 'completed_services' && (
          <div className="py-6 space-y-6">
            
            {/* Summary cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Settled</span>
                <span className="font-poppins font-black text-base text-teal-400 block mt-1">{completedJobs.length} Services</span>
              </div>
              <div className="border-l border-r border-slate-800/80">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Quality Rating</span>
                <span className="font-poppins font-black text-base text-white block mt-1">4.90 ★</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Revenue share</span>
                <span className="font-poppins font-black text-base text-white block mt-1">₹{totalEarnings.toFixed(0)}</span>
              </div>
            </div>

            {/* List of completed bookings */}
            <div className="space-y-4">
              {completedJobs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-10 text-center rounded-2xl text-slate-400 text-xs font-semibold">
                  No completed history found. Build your archive by checking out active orders.
                </div>
              ) : (
                completedJobs.map((job) => (
                  <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-4 hover:border-slate-700/60 transition-all">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                      <div>
                        <span className="font-bold text-white text-xs">Ref: #{job.id.substring(0,8)}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Today'} • Closed</span>
                      </div>
                      <div className="text-right">
                        <span className="font-poppins font-black text-xs text-teal-400 block">+ Rs. {(job.workerEarnings > 0 ? job.workerEarnings : (job.finalPrice * 0.70)).toFixed(0)}</span>
                        <span className="text-[8.5px] text-slate-500 font-bold block">Cash Collected COD</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service Executed:</span>
                        <span className="font-bold text-white">{job.serviceName || 'Home Deep Cleaning'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Address Node:</span>
                        <span className="font-bold text-white max-w-[250px] truncate">{job.address}</span>
                      </div>
                    </div>

                    {/* Customer Review display card */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 relative">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-[10px] text-slate-400 font-bold ml-1">5.0 • Verified Client Review</span>
                      </div>
                      <p className="text-[10px] text-slate-300 italic leading-relaxed">
                        "Great job by the partner! Extremely professional, arrived exactly on slot and did absolute clean work. Fully satisfied."
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: WALLET & PAYOUTS */}
        {/* ========================================================= */}
        {currentView === 'wallet_payouts' && (
          <div className="py-6 space-y-6">
            
            {/* Wallet Platinum Card Layout */}
            <div className="bg-gradient-to-tr from-brand-navy via-slate-900 to-teal-950 border border-teal-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block">Platinum Partner Wallet</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Linked Account: HDFC Bank - ****8431</span>
                </div>
                <div className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  Active Settlement
                </div>
              </div>

              <div className="mt-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-slate-400 text-lg font-bold">Rs.</span>
                  <span className="font-poppins font-black text-3xl text-white tracking-tight">{walletBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-[9px] text-slate-400 font-medium">Last automated payout cleared: Yesterday</span>
                
                <button 
                  disabled={walletBalance <= 0 || isTyping}
                  onClick={handleCashout}
                  className={`bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 text-white font-poppins font-black text-[10px] px-6 py-3 rounded-xl uppercase tracking-widest shadow-lg shadow-teal-500/10 transition-all flex items-center space-x-1.5`}
                >
                  {isTyping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      <span>Withdraw Funds</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Payout Settlements Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                <span className="font-poppins font-black text-xs text-white uppercase tracking-wider">Settlement History</span>
                <span className="text-[9px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">HDFC Linked Node</span>
              </div>
              <div className="divide-y divide-slate-800">
                {walletHistory.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-800/40 transition-all">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{item.id}</span>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${item.type === 'PAYOUT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">{item.date} • {item.desc}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-poppins font-black text-xs ${item.type === 'PAYOUT' ? 'text-rose-400' : 'text-teal-400'}`}>
                        {item.type === 'PAYOUT' ? '-' : '+'} Rs. {item.amount.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-teal-400 font-black block mt-0.5">SETTLED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: PERFORMANCE RATINGS */}
        {/* ========================================================= */}
        {currentView === 'performance_ratings' && (
          <div className="py-6 space-y-6">
            
            {/* Visual Ring Gauge Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Decorative rotating gold ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent border-l-transparent animate-[spin_3s_linear_infinite]"></div>
                  
                  <div className="z-10 flex flex-col items-center">
                    <span className="font-poppins font-black text-3xl text-white">4.90</span>
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center mt-1">
                      <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> Super Partner
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-white text-xs mt-4">Partner Quality Score (Excellent)</h4>
                <p className="text-[9.5px] text-slate-400 mt-1 max-w-xs">Calculated based on reviews from your last 50 completed bookings.</p>
              </div>

              {/* Progress Rating Breakdown */}
              <div className="space-y-3">
                {[
                  { star: 5, pct: '94%', label: 'Excellent' },
                  { star: 4, pct: '5%',  label: 'Very Good' },
                  { star: 3, pct: '1%',  label: 'Average' },
                  { star: 2, pct: '0%',  label: 'Poor' },
                  { star: 1, pct: '0%',  label: 'Critical' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-2.5 text-[10px]">
                    <span className="font-bold text-slate-400 w-3 text-right">{item.star}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full" style={{ width: item.pct }}></div>
                    </div>
                    <span className="font-bold text-white w-8">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Circular gauges row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Acceptance</span>
                <span className="font-poppins font-black text-base text-teal-400">98.5%</span>
                <span className="text-[8px] text-slate-500 block mt-1">Accept Target &gt;90%</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Completion</span>
                <span className="font-poppins font-black text-base text-cyan-400">100%</span>
                <span className="text-[8px] text-slate-500 block mt-1">Target &gt;95%</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">On-Time Index</span>
                <span className="font-poppins font-black text-base text-amber-400">96.8%</span>
                <span className="text-[8px] text-slate-500 block mt-1">Super Fast Arrival</span>
              </div>
            </div>

            {/* Customer Review Feedback badges & Comments list */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Client Feedbacks Badges</h3>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-teal-500/10 text-teal-300 font-bold text-[9px] px-2.5 py-1 rounded-xl border border-teal-500/20">⏱️ On Time Arrival (24)</span>
                <span className="bg-cyan-500/10 text-cyan-300 font-bold text-[9px] px-2.5 py-1 rounded-xl border border-cyan-500/20">🧼 Exceptionally Clean Work (18)</span>
                <span className="bg-amber-500/10 text-amber-300 font-bold text-[9px] px-2.5 py-1 rounded-xl border border-amber-500/20">🤝 Very Polite & Professional (15)</span>
              </div>

              {/* Feedbacks list */}
              <div className="divide-y divide-slate-800 border-t border-slate-800 pt-4 space-y-4">
                {[
                  { name: 'Kunal Sen', rating: 5, date: 'Today', comment: 'Vijay was highly skilled and cleaned up perfectly after unclogging the kitchen drainage. Highly recommended!' },
                  { name: 'Megha Nair', rating: 5, date: 'Yesterday', comment: 'On-time arrival and fast work execution. Handled the cleaning professionally. Very polite.' }
                ].map((fb, idx) => (
                  <div key={idx} className="pt-4 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">{fb.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{fb.date}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500">
                      {[...Array(fb.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <p className="text-slate-400 leading-relaxed mt-1 text-[10.5px]">"{fb.comment}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: WORK SCHEDULE */}
        {/* ========================================================= */}
        {currentView === 'work_schedule' && (
          <div className="py-6 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-6">
              <div>
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Weekly Duty Calendar</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Toggle days to turn scanner automatic search on/off</p>
              </div>

              {/* Day selection bubbles */}
              <div className="flex items-center justify-between gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isActive = schedule.days.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const nextDays = isActive 
                          ? schedule.days.filter(d => d !== day)
                          : [...schedule.days, day];
                        setSchedule(prev => ({ ...prev, days: nextDays }));
                      }}
                      className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all border ${
                        isActive 
                          ? 'bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/20' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Shift Slots */}
              <div className="space-y-3">
                <h4 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Shift Hour Configurations</h4>
                
                {[
                  'Morning Shift (8 AM - 12 PM)',
                  'Afternoon Shift (12 PM - 4 PM)',
                  'Evening Shift (4 PM - 8 PM)',
                  'Night Shift (8 PM - 11 PM)'
                ].map((slot) => {
                  const isSelected = schedule.slots.includes(slot);
                  return (
                    <div 
                      key={slot}
                      onClick={() => {
                        const nextSlots = isSelected
                          ? schedule.slots.filter(s => s !== slot)
                          : [...schedule.slots, slot];
                        setSchedule(prev => ({ ...prev, slots: nextSlots }));
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs">{slot}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-teal-500 border-teal-400 text-white' : 'border-slate-700'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleSaveSchedule(schedule.days, schedule.slots)}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-md"
              >
                Save Schedule Configurations
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: AVAILABILITY SETTINGS */}
        {/* ========================================================= */}
        {currentView === 'availability_settings' && (
          <div className="py-6 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-6">
              
              <div>
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Availability Settings</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Fine-tune your partner operational coordinates</p>
              </div>

              {/* Service Radius Slider */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-white">Preferred Service Radius</span>
                  <span className="text-xs font-black text-teal-400">{availability.radius} Kilometers</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="30" 
                  value={availability.radius}
                  onChange={(e) => setAvailability(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                  className="w-full accent-teal-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                />
                <span className="text-[9px] text-slate-500 block leading-relaxed">Broadcast requests within this radius will auto-popup on your radar.</span>
              </div>

              {/* Auto Accept Switch */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <div>
                  <span className="font-bold text-xs text-white block">Auto-Accept Bookings</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Instantly accept matched bookings matching schedule</span>
                </div>
                <button
                  onClick={() => setAvailability(prev => ({ ...prev, autoAccept: !prev.autoAccept }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${availability.autoAccept ? 'bg-teal-500' : 'bg-slate-800 border border-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${availability.autoAccept ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Silent hours mode */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <div>
                  <span className="font-bold text-xs text-white block">Silent Hours Mode (Rest)</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Do not dispatch push sounds after 9:00 PM</span>
                </div>
                <button
                  onClick={() => setAvailability(prev => ({ ...prev, silentHours: !prev.silentHours }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${availability.silentHours ? 'bg-teal-500' : 'bg-slate-800 border border-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${availability.silentHours ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Max daily jobs limit slider */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-white">Maximum Jobs Per Day Limit</span>
                  <span className="text-xs font-black text-teal-400">{availability.maxJobs} Jobs</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={availability.maxJobs}
                  onChange={(e) => setAvailability(prev => ({ ...prev, maxJobs: parseInt(e.target.value) }))}
                  className="w-full accent-teal-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                />
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('jk_worker_availability', JSON.stringify(availability));
                  addNotification('Duty Config Saved', 'Availability preferences saved successfully.');
                  alert('✅ Preferences saved live!');
                  setCurrentView('menu');
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-md"
              >
                Save Availability Preferences
              </button>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 10: UPLOADED DOCUMENTS */}
        {/* ========================================================= */}
        {currentView === 'uploaded_documents' && (
          <div className="py-6 space-y-6">
            
            {/* Aadhaar card layout */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Aadhaar Verification Node</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-0.5" /> Approved
                </span>
              </div>

              {/* Aadhaar Card Simulated Preview Layout */}
              <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950 rounded-2xl border border-teal-500/10 p-5 relative overflow-hidden flex flex-col justify-between h-40">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-teal-400 font-poppins font-black tracking-widest block uppercase">Unique Identification Authority of India</span>
                    <span className="text-[8px] text-slate-500 block mt-0.5">Government of India</span>
                  </div>
                  <div className="w-10 h-8 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center">
                    <span className="text-[8px] text-amber-500 font-black">CHIP</span>
                  </div>
                </div>

                <div className="flex space-x-4 items-center mt-3">
                  <div className="w-12 h-14 bg-slate-850 rounded border border-slate-750 flex items-center justify-center overflow-hidden">
                    <UserIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <div>
                    <span className="font-poppins font-black text-xs text-white block">{partnerProfile.name}</span>
                    <span className="text-[8.5px] text-slate-400 block mt-0.5">DOB: 12/04/1990 • Male</span>
                    <span className="text-[9.5px] text-white font-poppins font-bold block mt-2 tracking-widest">XXXX XXXX 8431</span>
                  </div>
                </div>

                <span className="text-[7.5px] text-slate-500 block mt-3 uppercase tracking-tighter">Verified under biometric KYC ledger matching UIDAI standards</span>
              </div>
            </div>

            {/* Certification verification card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-xs">Skill Certification Certificate</h4>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Authorized by: Urban Services Guild Guild</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Document uploader Form mock */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Upload New Certifications</h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Submit new documents to gain premium higher paid service categories.</p>
              </div>

              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/40 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950 flex flex-col items-center">
                <FileText className="w-8 h-8 text-teal-400 mb-2" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Drag & Drop Files Here</span>
                <span className="text-[9px] text-slate-500 block mt-1">Accept PDF, JPG, PNG up to 5MB</span>
                <button className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-[9px] px-3.5 py-1.5 rounded-lg mt-4 transition-colors">
                  Browse Files
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 11: SUPPORT CENTER (AI CHAT SIMULATOR) */}
        {/* ========================================================= */}
        {currentView === 'support_center' && (
          <div className="py-6 space-y-4">
            
            {/* AI Assistant Chat frame */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[520px] overflow-hidden">
              
              {/* Chat Header */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Partner Support AI Agent</h3>
                    <span className="text-[9px] text-teal-400 font-bold block mt-0.5 flex items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block mr-1.5"></span>
                      Online and Listening
                    </span>
                  </div>
                </div>

                <a 
                  href="tel:+919900088223"
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-black text-[9px] px-3 py-2 rounded-xl transition-all uppercase tracking-widest flex items-center"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" /> Help Desk
                </a>
              </div>

              {/* Messages Frame */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div 
                      className={`p-3 rounded-2xl text-[11px] leading-relaxed font-medium shadow-md ${
                        msg.sender === 'user' 
                          ? 'bg-teal-600 text-white rounded-tr-none' 
                          : 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-500 font-semibold block mt-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex flex-col items-start max-w-[75%] mr-auto">
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl rounded-tl-none flex space-x-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="text-[7.5px] text-slate-500 font-bold block mt-1">Typing...</span>
                  </div>
                )}
                
                <div ref={chatEndRef}></div>
              </div>

              {/* Preset quick replies buttons */}
              <div className="bg-slate-950 p-2.5 border-t border-slate-900 overflow-x-auto flex space-x-2 whitespace-nowrap scrollbar-none">
                <button 
                  onClick={() => triggerPresetResponse('When will I receive my active payout?')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  🏦 Payout Delayed
                </button>
                <button 
                  onClick={() => triggerPresetResponse('Customer is not responding to calls')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  📞 Client Not Responding
                </button>
                <button 
                  onClick={() => triggerPresetResponse('Emergency security / safety concern')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  🚨 Site Safety Issue
                </button>
                <button 
                  onClick={() => triggerPresetResponse('How can I add another service category?')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  🛠️ Change Category
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendSupportMessage} className="bg-slate-950 p-3 border-t border-slate-800 flex space-x-2">
                <input 
                  type="text" 
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Type your query for AI assistant..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors placeholder:text-slate-500 font-medium"
                />
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 p-2.5 rounded-xl text-white transition-colors flex items-center justify-center shadow-lg shadow-teal-500/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 12: ACCOUNT SETTINGS */}
        {/* ========================================================= */}
        {currentView === 'account_settings' && (
          <div className="py-6 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-6">
              
              <div>
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Account Configurations</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Manage partner login details & settlement banks</p>
              </div>

              {/* Personal details fields */}
              <div className="space-y-4">
                <h4 className="font-poppins font-black text-[10px] text-teal-400 uppercase tracking-widest border-b border-slate-850 pb-2">Profile Specifications</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Partner Name</label>
                    <input 
                      type="text" 
                      value={partnerProfile.name}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Registered Mobile Phone</label>
                    <input 
                      type="text" 
                      value={partnerProfile.phone}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold animate-pulse"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={partnerProfile.email}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none focus:border-teal-500 transition-colors font-semibold cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Service Skill Specialty</label>
                    <input 
                      type="text" 
                      value={partnerProfile.category}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none focus:border-teal-500 transition-colors font-semibold cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Settlement Bank details fields */}
              <div className="space-y-4">
                <h4 className="font-poppins font-black text-[10px] text-teal-400 uppercase tracking-widest border-b border-slate-850 pb-2">Settlement Bank Node</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Official Bank Name</label>
                    <input 
                      type="text" 
                      value={partnerProfile.bankName}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Savings Account Number</label>
                    <input 
                      type="text" 
                      value={partnerProfile.accNo}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, accNo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bank Branch IFSC Code</label>
                    <input 
                      type="text" 
                      value={partnerProfile.ifsc}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, ifsc: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Holder Name</label>
                    <input 
                      type="text" 
                      value={partnerProfile.holderName}
                      onChange={(e) => setPartnerProfile(prev => ({ ...prev, holderName: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSaveSettings(partnerProfile)}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 text-white font-poppins font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-md"
              >
                Save Account & Bank Changes
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
