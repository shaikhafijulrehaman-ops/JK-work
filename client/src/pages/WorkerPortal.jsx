import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Phone, Briefcase, CheckCircle, Truck, DollarSign, Star,
  ShieldCheck, Clock, FileText, CreditCard, HelpCircle, LogOut, Activity, User as UserIcon,
  ChevronLeft, ChevronRight, Sliders, Settings, Send, ArrowUpRight, TrendingUp, AlertCircle,
  Bell, Check, Map, RefreshCw, Smartphone, Landmark, ShieldAlert, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkerPortal() {
  const { bookings, fetchBookings, updateJobStatus } = useBookingStore();
  const { user, logout } = useAuthStore();
  const { addNotification, notifications } = useNotificationStore();
  const navigate = useNavigate();

  // Redirect guard for Customers
  useEffect(() => {
    if (user && user.role === 'USER') {
      navigate('/services', { replace: true });
    }
  }, [user, navigate]);

  // Load real bookings from store on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Primary view state: 'dashboard', 'jobs', 'earnings', 'bank', 'availability', 'ratings', 'areas', 'documents', 'notifications', 'support', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // My Jobs sub-tab filter: 'new', 'assigned', 'ongoing', 'completed'
  const [jobsSubTab, setJobsSubTab] = useState('assigned');

  // Duty status & local states
  const [isOnline, setIsOnline] = useState(() => {
    const val = localStorage.getItem('jk_worker_online');
    return val !== null ? JSON.parse(val) : true;
  });

  const [dutyType, setDutyType] = useState(() => {
    return localStorage.getItem('jk_worker_duty_type') || 'Full Time';
  });

  const [bankDetails, setBankDetails] = useState(() => {
    try {
      if (user?.workerProfile?.bankDetails) {
        return JSON.parse(user.workerProfile.bankDetails);
      }
    } catch (e) {}
    return {
      bankName: 'HDFC Bank Ltd',
      accNo: 'XXXXXX843128',
      ifsc: 'HDFC0000213',
      holderName: user?.name || 'Vijay Kumar'
    };
  });

  const [savingBank, setSavingBank] = useState(false);

  // Chat messages simulator state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi partner! I am the JK Enterprises Partner Assistant. How can I help you today?', time: '12:30 PM' }
  ]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Broadcast requests simulation
  const [broadcastRequests, setBroadcastRequests] = useState([
    {
      id: 'req-101',
      serviceName: 'Full House Deep Cleaning',
      category: 'Cleaning',
      finalPrice: 1999,
      timeSlot: 'Today, 4:00 PM',
      address: 'Sobha Lavender, HSR Layout, Sector 3, Bangalore',
      distance: '1.8 km away',
      expiresIn: 179
    },
    {
      id: 'req-102',
      serviceName: 'Kitchen Sink Tap Replacement',
      category: 'Plumbing',
      finalPrice: 699,
      timeSlot: 'Tomorrow, 10:00 AM',
      address: 'Prestige Sunrise, Block C-302, Electronic City Phase 1, Bangalore',
      distance: '3.4 km away',
      expiresIn: 239
    }
  ]);

  // Countdown timers for live requests
  useEffect(() => {
    const timer = setInterval(() => {
      setBroadcastRequests((prev) => 
        prev
          .map((req) => ({ ...req, expiresIn: req.expiresIn - 1 }))
          .filter((req) => req.expiresIn > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic matched requests fetching from Postgres database
  useEffect(() => {
    let requestsInterval;

    const fetchMatchedRequests = async () => {
      if (approvalStatus === 'APPROVED' && isOnline) {
        try {
          const res = await fetch('http://localhost:5000/api/workers/requests', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jk_token')}`
            }
          });
          const data = await res.json();
          if (data.success) {
            // Map real database bookings to broadcastRequests format!
            const mapped = data.bookings.map(b => {
              return {
                id: `req-${b.id}`,
                isRealDb: true,
                serviceName: b.items?.[0]?.service?.name || 'Home Service',
                category: b.serviceCategory || 'Cleaning',
                finalPrice: b.finalPrice,
                timeSlot: b.timeSlot,
                address: b.address,
                distance: 'Anchepalya Zone',
                expiresIn: 180,
                rawBooking: b
              };
            });
            
            setBroadcastRequests(prev => {
              // Merge real DB requests and filter duplicates
              const nonReal = prev.filter(r => !r.isRealDb);
              return [...nonReal, ...mapped];
            });
          }
        } catch (e) {
          console.warn("Offline requests matching fallback active.");
        }
      }
    };

    if (approvalStatus === 'APPROVED' && isOnline) {
      fetchMatchedRequests();
      requestsInterval = setInterval(fetchMatchedRequests, 3000);
    }

    return () => clearInterval(requestsInterval);
  }, [approvalStatus, isOnline]);

  // Safe JSON Parsing utility
  const parseJson = (str, fallback = {}) => {
    try {
      if (!str) return fallback;
      return JSON.parse(str) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  const aadhaarDocs = parseJson(user?.workerProfile?.aadhaar, { front: null, back: null });
  const photoDocs = parseJson(user?.workerProfile?.profilePhoto, { profile: null, selfie: null });

  // Verification Status Checks
  const rawStatus = user?.workerProfile?.approvalStatus || user?.approvalStatus || 'PENDING';
  const approvalStatus = rawStatus.toUpperCase();

  // =========================================================
  // PENDING & UNDER_REVIEW SCREEN
  // =========================================================
  if (approvalStatus === 'PENDING' || approvalStatus === 'UNDER_REVIEW') {
    return (
      <div className="bg-slate-950 min-h-screen font-inter flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-navy to-brand"></div>
          
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border bg-amber-500/10 border-amber-500/20">
            <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
          
          <h2 className="font-poppins font-black text-2xl text-white mb-4 tracking-tight">Verification In Progress</h2>
          
          {/* Status Badge */}
          <div className="mb-6">
            <span className="bg-amber-500/20 text-amber-300 font-poppins font-black text-xs px-3.5 py-1.5 rounded-full border border-amber-500/30 uppercase tracking-widest inline-block shadow-sm">
              Status: {approvalStatus === 'UNDER_REVIEW' ? 'Under Active Review' : 'Pending Verification'}
            </span>
          </div>

          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-8">
            Your application has been submitted successfully.
            <br /><br />
            Our verification team is reviewing your details.
            <br /><br />
            You will receive SMS, WhatsApp and Email after approval.
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
                navigate('/auth');
              }}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-brand/20 animate-pulse"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // REJECTED STATE SCREEN
  // =========================================================
  if (approvalStatus === 'REJECTED') {
    return (
      <div className="bg-slate-950 min-h-screen font-inter flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border bg-rose-500/10 border-rose-500/20">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          
          <h2 className="font-poppins font-black text-2xl text-white mb-4 tracking-tight">Application Rejected</h2>
          
          <div className="mb-6">
            <span className="bg-rose-500/20 text-rose-400 font-poppins font-black text-xs px-3.5 py-1.5 rounded-full border border-rose-500/30 uppercase tracking-widest inline-block shadow-sm">
              Status: REJECTED
            </span>
          </div>

          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-8">
            Unfortunately, your application did not meet our verification standards. 
            <br /><br />
            Please reach out to our partner support center for detailed feedback or document resubmissions.
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={async () => {
                await logout();
                navigate('/auth');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all"
            >
              Log Out Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DYNAMIC REAL-DATABASE METRICS & STATISTICS (APPROVED STATE)
  // =========================================================
  
  // Filter bookings belonging to this partner
  const myBookings = bookings.filter(b => b.workerId === user?.workerProfile?.id || b.workerId === user?.id);

  // Group real jobs
  const newBroadJobs = broadcastRequests;
  const assignedJobs = myBookings.filter(b => b.status === 'ASSIGNED' || b.status === 'ON_THE_WAY');
  const ongoingJobs = myBookings.filter(b => b.status === 'IN_PROGRESS' || b.status === 'STARTED');
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');

  // Dynamic Commission Rate
  const commissionRate = user?.workerProfile?.commissionRate || 0.70;

  // 1. Today's Earnings
  const todayStr = new Date().toDateString();
  const todayCompleted = completedJobs.filter(b => new Date(b.createdAt).toDateString() === todayStr);
  const todayEarnings = todayCompleted.reduce((sum, b) => sum + (b.finalPrice * commissionRate), 0);

  // 2. Monthly Earnings
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyCompleted = completedJobs.filter(b => {
    const d = new Date(b.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyEarnings = monthlyCompleted.reduce((sum, b) => sum + (b.finalPrice * commissionRate), 0);

  // 3. Lifetime Earnings
  const lifetimeEarnings = completedJobs.reduce((sum, b) => sum + (b.finalPrice * commissionRate), 0);

  // 4. Completed Jobs
  const totalCompletedJobs = completedJobs.length;

  // 5. Average Rating
  const avgRating = user?.workerProfile?.rating || 5.0;

  // 6. Completion Rate
  const totalAssignedCount = myBookings.length;
  const completionRate = totalAssignedCount > 0 
    ? Math.round((completedJobs.length / totalAssignedCount) * 100) 
    : 100;

  // Handlers
  const handleToggleOnlineStatus = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    localStorage.setItem('jk_worker_online', JSON.stringify(nextVal));
    addNotification(
      nextVal ? 'Duty Online' : 'Duty Offline',
      `Status toggled to ${nextVal ? 'ONLINE' : 'OFFLINE'}. You are ${nextVal ? 'active to receive new broadcast alerts' : 'resting'}.`
    );
  };

  const handleStatusTransition = async (bookingId, currentStatus) => {
    let target = 'ON_THE_WAY';
    if (currentStatus === 'ASSIGNED') target = 'ON_THE_WAY';
    else if (currentStatus === 'ON_THE_WAY') target = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') target = 'COMPLETED';

    const ok = await updateJobStatus(bookingId, target);
    if (ok) {
      addNotification('Job Shifted', `Booking Ref #${bookingId.substring(0,8)} moved successfully to ${target.replace(/_/g, ' ')}.`);
      fetchBookings();
    }
  };

  const handleAcceptRequest = async (req) => {
    if (req.isRealDb) {
      const { acceptBooking } = useBookingStore.getState();
      const res = await acceptBooking(req.rawBooking.id);
      if (res.success) {
        addNotification('Job Accepted! 🎉', `You have accepted "${req.serviceName}". Head over to My Jobs to begin.`);
        setActiveTab('jobs');
        setJobsSubTab('assigned');
      } else {
        alert(res.error || 'Failed to accept booking request.');
      }
      return;
    }

    const newB = {
      id: req.id.replace('req-', ''),
      serviceName: req.serviceName,
      category: req.category,
      finalPrice: req.finalPrice,
      timeSlot: req.timeSlot,
      address: req.address,
      phone: '8431588235',
      status: 'ASSIGNED',
      paymentStatus: 'UNPAID',
      workerId: user?.workerProfile?.id || user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [{ service: { name: req.serviceName }, quantity: 1, price: req.finalPrice }]
    };

    const current = JSON.parse(localStorage.getItem('jk_bookings')) || [];
    current.push(newB);
    localStorage.setItem('jk_bookings', JSON.stringify(current));
    
    await fetchBookings();
    setBroadcastRequests(prev => prev.filter(r => r.id !== req.id));
    addNotification('Job Accepted! 🎉', `You have accepted "${req.serviceName}". Head over to My Jobs to begin.`);
    setActiveTab('jobs');
    setJobsSubTab('assigned');
  };

  const handleRejectRequest = async (reqOrId) => {
    const reqId = typeof reqOrId === 'string' ? reqOrId : reqOrId.id;
    if (reqOrId && typeof reqOrId === 'object' && reqOrId.isRealDb) {
      const { rejectBooking } = useBookingStore.getState();
      await rejectBooking(reqOrId.rawBooking.id);
    }
    setBroadcastRequests(prev => prev.filter(r => r.id !== reqId));
    addNotification('Alert Dismissed', 'Incoming broadcast request declined.');
  };

  const handleSaveBank = (e) => {
    e.preventDefault();
    setSavingBank(true);
    setTimeout(() => {
      setSavingBank(false);
      alert('🏦 Bank Details & IFSC registry records updated successfully!');
      setActiveTab('dashboard');
    }, 1000);
  };

  const handleSendChatSupport = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: typedMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const prompt = typedMessage.toLowerCase();
    setTypedMessage('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Support representative noted down your chat. We will call you within 15 minutes.";
      if (prompt.includes('pay') || prompt.includes('earn') || prompt.includes('wallet')) {
        reply = "🏦 All partner earnings payouts are processed dynamically. Instant settlement is enabled for active cashouts. Check the wallet logs.";
      } else if (prompt.includes('cancel') || prompt.includes('job')) {
        reply = "⚠️ If you or a client need to cancel an active dispatch, please notify client support immediately at +91 99000 88223.";
      }
      setIsTyping(false);
      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-inter pb-24 md:pb-12 selection:bg-teal-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* PROFESSIONAL HEADER BAR */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-b from-brand-navy to-slate-900 pt-8 pb-20 px-4 rounded-b-[2.5rem] shadow-2xl relative border-b border-teal-500/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          
          <div className="flex items-center space-x-4 text-left">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-full blur-md opacity-70 animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-teal-400 overflow-hidden shadow-lg relative z-10">
                {photoDocs.selfie || photoDocs.profile || user?.profilePhoto ? (
                  <img src={photoDocs.selfie || photoDocs.profile || user?.profilePhoto} alt="Partner Selfie" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-teal-400" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-1 shadow-md border-2 border-slate-900 z-20">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-poppins font-black text-xl text-white tracking-tight">{user?.name}</h1>
                <span className="bg-teal-500/20 text-teal-300 font-poppins font-black text-[9px] px-2 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest flex items-center">
                  <Check className="w-2.5 h-2.5 mr-0.5" /> Approved
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {user?.workerProfile?.id?.substring(0,8) || user?.id?.substring(0,8)} • +91 {user?.phone}</p>
              
              <div className="flex flex-wrap gap-2 mt-2 font-bold">
                <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-teal-400 text-[10px]">
                  {user?.workerProfile?.skills?.[0]?.service?.name || user?.category || 'Cleaning Specialist'}
                </span>
                <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-slate-300 text-[10px]">
                  {user?.workerProfile?.experienceYears || 5} Years Exp
                </span>
                {user?.serviceArea && (
                  <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-slate-300 text-[10px] flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-teal-400" /> {user.serviceArea}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={async () => {
                if (confirm('Log out from Partner Portal?')) {
                  await logout();
                  navigate('/');
                }
              }}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/40 px-4 py-2.5 rounded-xl font-poppins font-black text-xs uppercase tracking-wider shadow-md transition-colors"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* DASHBOARD CONTENT PANEL */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 space-y-6">
        
        {/* Availability Toggle & Live Counter bar */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm block text-slate-200">Online Broadcasting Status</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Duty: {isOnline ? 'Online / Receive Requests' : 'Offline / Resting'} • {dutyType}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOnline ? 'text-teal-400' : 'text-slate-500'}`}>
                {isOnline ? 'Active' : 'Offline'}
              </span>
              <button 
                onClick={handleToggleOnlineStatus}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 outline-none ${isOnline ? 'bg-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-800 border border-slate-700'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'dashboard', label: 'Overview', icon: Activity },
            { id: 'jobs', label: 'My Jobs', icon: Briefcase, badge: assignedJobs.length + ongoingJobs.length },
            { id: 'earnings', label: 'Earnings', icon: DollarSign },
            { id: 'bank', label: 'Bank Details', icon: Landmark },
            { id: 'availability', label: 'Availability', icon: Clock },
            { id: 'ratings', label: 'Reviews', icon: Star },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'support', label: 'Support Assistant', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & PARTNER DASHBOARD CARDS */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Partner Dashboard Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Today's Earnings</span>
                  <span className="font-poppins font-black text-base text-white block mt-3">₹{todayEarnings.toFixed(0)}</span>
                  <span className="text-[8px] text-teal-400 mt-2 block font-semibold">Today completed</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Monthly Earnings</span>
                  <span className="font-poppins font-black text-base text-teal-400 block mt-3">₹{monthlyEarnings.toFixed(0)}</span>
                  <span className="text-[8px] text-slate-500 mt-2 block font-semibold">Month-to-date</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jobs Completed</span>
                  <span className="font-poppins font-black text-base text-white block mt-3">{totalCompletedJobs} Jobs</span>
                  <span className="text-[8px] text-slate-500 mt-2 block font-semibold">Lifetime settled</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Rating</span>
                  <span className="font-poppins font-black text-base text-white block mt-3 flex items-center">
                    <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                    {avgRating.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-2 block font-semibold">Customer reviews</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative group col-span-2 md:col-span-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Completion Rate</span>
                  <span className="font-poppins font-black text-base text-white block mt-3">{completionRate}%</span>
                  <span className="text-[8px] text-slate-500 mt-2 block font-semibold">Total assigned match</span>
                </div>

              </div>

              {/* Live Alerts Broadcasting Alerts */}
              {isOnline && broadcastRequests.length > 0 ? (
                <div className="bg-slate-900 border border-teal-500/20 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping"></span>
                    <h3 className="font-poppins font-black text-xs uppercase tracking-wider text-white">Matched Live Broadcast Alerts ({broadcastRequests.length})</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {broadcastRequests.map(req => (
                      <div key={req.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{req.category}</span>
                            <span className="text-[9px] text-slate-500">{req.distance}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1">{req.serviceName}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1 font-semibold">
                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> {req.timeSlot}</span>
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> {req.address}</span>
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center justify-between gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Your Earning</span>
                            <span className="text-base font-poppins font-black text-teal-400">Rs. {Math.round(req.finalPrice * commissionRate)}</span>
                            <span className="text-[9px] text-rose-500 block mt-0.5 font-bold animate-pulse">Expires in {req.expiresIn}s</span>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAcceptRequest(req)}
                              className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-[10px] uppercase px-4 py-2 rounded-xl transition-all shadow-sm shadow-teal-500/20"
                            >
                              Accept Job
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(req)}
                              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase px-3 py-2 rounded-xl"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isOnline ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                  <Activity className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-xs font-bold">Scanning for service partner broadcasts in {user?.serviceArea || 'Anchepalya'}...</p>
                  <p className="text-[10px] text-slate-500">Live booking alerts matched to your Clean Category will appear here instantly.</p>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold">You are currently offline</p>
                  <p className="text-[10px] text-slate-500">Toggle Online status to scan and accept live customer bookings.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MY JOBS (NEW, ASSIGNED, ONGOING, COMPLETED) */}
          {/* ========================================================= */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-max">
                {[
                  { id: 'assigned', label: 'Assigned', count: assignedJobs.length },
                  { id: 'ongoing', label: 'Ongoing', count: ongoingJobs.length },
                  { id: 'completed', label: 'Completed', count: completedJobs.length }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setJobsSubTab(sub.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      jobsSubTab === sub.id 
                        ? 'bg-slate-850 text-white border border-slate-700/80 shadow-inner' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub.label} ({sub.count})
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {jobsSubTab === 'assigned' && assignedJobs.map(b => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono font-black text-brand uppercase bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">Ref: #{b.id.substring(0,8)}</span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider font-black">{b.status}</span>
                      </div>
                      <h4 className="font-poppins font-black text-base text-white">{b.items?.[0]?.service?.name || 'General Clean Job'}</h4>
                      <p className="text-xs text-slate-300 font-semibold">{b.address}</p>
                      <div className="flex items-center space-x-4 text-[10px] text-slate-400">
                        <span>Time Slot: {b.timeSlot}</span>
                        <span>Cust Mobile: {b.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-3">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Commissions</span>
                        <span className="text-base font-poppins font-black text-teal-400">Rs. {Math.round(b.finalPrice * commissionRate)}</span>
                      </div>
                      <button 
                        onClick={() => handleStatusTransition(b.id, b.status)}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-poppins font-black text-[10px] uppercase px-4 py-2.5 rounded-xl shadow-md tracking-wider"
                      >
                        {b.status === 'ASSIGNED' ? 'Mark: On The Way' : 'Mark: In Progress'}
                      </button>
                    </div>
                  </div>
                ))}

                {jobsSubTab === 'ongoing' && ongoingJobs.map(b => (
                  <div key={b.id} className="bg-slate-950 border border-teal-500/20 rounded-3xl p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono font-black text-brand uppercase bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">Ref: #{b.id.substring(0,8)}</span>
                        <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded uppercase tracking-wider font-black">Active Ongoing</span>
                      </div>
                      <h4 className="font-poppins font-black text-base text-white">{b.items?.[0]?.service?.name || 'General Clean Job'}</h4>
                      <p className="text-xs text-slate-300 font-semibold">{b.address}</p>
                      <div className="flex items-center space-x-4 text-[10px] text-slate-400">
                        <span>Time Slot: {b.timeSlot}</span>
                        <span>Client Phone: {b.phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-3 pl-2">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Active Earnings</span>
                        <span className="text-base font-poppins font-black text-teal-400">Rs. {Math.round(b.finalPrice * commissionRate)}</span>
                      </div>
                      <button 
                        onClick={() => handleStatusTransition(b.id, b.status)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-poppins font-black text-[10px] uppercase px-4 py-2.5 rounded-xl shadow-md tracking-wider animate-bounce"
                      >
                        Complete Job
                      </button>
                    </div>
                  </div>
                ))}

                {jobsSubTab === 'completed' && completedJobs.map(b => (
                  <div key={b.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono font-black text-slate-500 uppercase bg-slate-850 px-2 py-0.5 rounded">Ref: #{b.id.substring(0,8)}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-black">Completed & Settled</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{b.items?.[0]?.service?.name || 'General Clean Job'}</h4>
                      <p className="text-[11px] text-slate-400">{b.address}</p>
                      <span className="text-[9.5px] text-slate-500 block">Date Settled: {new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Settled Sum</span>
                      <span className="text-base font-poppins font-black text-emerald-400">Rs. {Math.round(b.finalPrice * commissionRate)}</span>
                    </div>
                  </div>
                ))}

                {((jobsSubTab === 'assigned' && assignedJobs.length === 0) ||
                  (jobsSubTab === 'ongoing' && ongoingJobs.length === 0) ||
                  (jobsSubTab === 'completed' && completedJobs.length === 0)) && (
                  <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-3xl text-slate-500">
                    <Briefcase className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No jobs listed in this section.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: EARNINGS LEDGER */}
          {/* ========================================================= */}
          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Today</span>
                  <span className="font-poppins font-black text-xl text-white mt-2 block">Rs. {todayEarnings.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Weekly Earning</span>
                  <span className="font-poppins font-black text-xl text-teal-400 mt-2 block">Rs. {lifetimeEarnings.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Monthly Earning</span>
                  <span className="font-poppins font-black text-xl text-white mt-2 block">Rs. {monthlyEarnings.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Lifetime settled</span>
                  <span className="font-poppins font-black text-xl text-white mt-2 block">Rs. {lifetimeEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Performance ledger table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-4">
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Dynamic Payout History</h3>
                
                <div className="overflow-x-auto border-t border-slate-800 pt-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="text-slate-500 font-bold uppercase border-b border-slate-800">
                      <tr>
                        <th className="pb-3">Reference ID</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Service Details</th>
                        <th className="pb-3 text-right">Settled Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                      {completedJobs.map(b => (
                        <tr key={b.id} className="hover:bg-slate-850/30">
                          <td className="py-3 font-mono font-bold text-teal-400">TXN-{b.id.substring(0,8).toUpperCase()}</td>
                          <td className="py-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 font-bold text-white">{b.items?.[0]?.service?.name || 'Cleaning Service'}</td>
                          <td className="py-3 text-right font-black text-teal-400">Rs. {Math.round(b.finalPrice * commissionRate)}</td>
                        </tr>
                      ))}
                      {completedJobs.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500 font-semibold">No payouts settled in this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BANK DETAILS */}
          {/* ========================================================= */}
          {activeTab === 'bank' && (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left max-w-md mx-auto space-y-6"
            >
              <div>
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">🏦 Bank Details Configuration</h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure your primary savings account for dynamic direct settlements.</p>
              </div>

              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Bank Name</label>
                  <input 
                    type="text" 
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Account Number</label>
                  <input 
                    type="text" 
                    value={bankDetails.accNo}
                    onChange={(e) => setBankDetails({ ...bankDetails, accNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-bold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">IFSC Code</label>
                  <input 
                    type="text" 
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-bold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Beneficiary Name</label>
                  <input 
                    type="text" 
                    value={bankDetails.holderName}
                    onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-poppins font-black text-xs py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md shadow-teal-500/10 pt-4"
                >
                  {savingBank ? 'Saving Ledger...' : 'Update Bank Credentials'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AVAILABILITY CONTROLS */}
          {/* ========================================================= */}
          {activeTab === 'availability' && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left max-w-md mx-auto space-y-6"
            >
              <div>
                <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">📅 Shift & Availability</h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure your weekly slots and coverage bounds.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Duty Shift Toggle</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Toggle to Rest or Go ON DUTY</span>
                  </div>
                  <button 
                    onClick={handleToggleOnlineStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none ${isOnline ? 'bg-teal-500' : 'bg-slate-800 border'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Operational Mode</label>
                  
                  {[
                    { id: 'Full Time', desc: '8-10 hour shifts daily, priority broadcast algorithms' },
                    { id: 'Part Time', desc: 'Flexible hours, weekend/evening only requests' },
                    { id: 'Online', desc: 'Active instantly, open to remote dispatch calls' },
                    { id: 'Offline', desc: 'Temporarily resting/off-duty mode' }
                  ].map(mode => (
                    <div 
                      key={mode.id}
                      onClick={() => {
                        setDutyType(mode.id);
                        localStorage.setItem('jk_worker_duty_type', mode.id);
                        setIsOnline(mode.id !== 'Offline');
                        localStorage.setItem('jk_worker_online', JSON.stringify(mode.id !== 'Offline'));
                      }}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start space-x-3 text-left ${
                        dutyType === mode.id 
                          ? 'bg-teal-500/5 border-teal-500/30' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full border-2 mt-0.5 flex items-center justify-center ${dutyType === mode.id ? 'border-teal-400' : 'border-slate-600'}`}>
                        {dutyType === mode.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />}
                      </div>
                      <div>
                        <span className="font-poppins font-black text-xs text-white block">{mode.id}</span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-normal">{mode.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: RATINGS & CUSTOMER REVIEWS */}
          {/* ========================================================= */}
          {activeTab === 'ratings' && (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">⭐ Verified Customer Feedback</h3>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-3 py-1 rounded-full">{avgRating.toFixed(2)} ★ Rating</span>
                </div>

                <div className="space-y-4">
                  {completedBookings.filter(b => b.review).map((b, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-xs">{b.user?.name || 'Verified Customer'}</span>
                        <div className="flex items-center space-x-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`w-3 h-3 ${idx < b.review.rating ? 'text-amber-400 fill-current' : 'text-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-400 italic font-semibold leading-relaxed">
                        "{b.review.comment || 'No written text review left.'}"
                      </p>
                      <span className="text-[8.5px] text-slate-500 font-mono font-bold block mt-1">Order Ref: #{b.id.substring(0,8).toUpperCase()}</span>
                    </div>
                  ))}
                  {completedBookings.filter(b => b.review).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6">No completed client reviews found in database logs.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: VERIFICATION DOCUMENTS */}
          {/* ========================================================= */}
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Aadhaar Card Verification Front</h3>
                  <span className="bg-emerald-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center">
                    <CheckCircle className="w-3 h-3 mr-0.5" /> VERIFIED
                  </span>
                </div>

                {aadhaarDocs.front ? (
                  <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img src={aadhaarDocs.front} alt="Aadhaar Front" className="max-w-full max-h-56 object-contain rounded bg-black" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Front image not uploaded.</p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-poppins font-black text-xs text-white uppercase tracking-wider">Aadhaar Card Verification Back</h3>
                  <span className="bg-emerald-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center">
                    <CheckCircle className="w-3 h-3 mr-0.5" /> VERIFIED
                  </span>
                </div>

                {aadhaarDocs.back ? (
                  <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img src={aadhaarDocs.back} alt="Aadhaar Back" className="max-w-full max-h-56 object-contain rounded bg-black" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Back image not uploaded.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: SUPPORT CENTER (INTERACTIVE BOT SIMULATOR) */}
          {/* ========================================================= */}
          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-left flex flex-col h-[500px]"
            >
              <div className="border-b border-slate-800 pb-3.5 flex justify-between items-center shrink-0">
                <div>
                  <h4 className="font-poppins font-black text-xs text-white uppercase tracking-wider">JK Professional Support Bot</h4>
                  <span className="text-[8.5px] text-slate-500 block mt-0.5 font-bold uppercase tracking-wide">Emergency Hotlines & FAQ sync active</span>
                </div>
                <a href="tel:+919900088223" className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-black text-[9px] px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors">
                  📞 Emergency Call
                </a>
              </div>

              {/* Chat screen */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 min-h-0 scrollbar-thin">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[11.5px] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-teal-500 text-white rounded-tr-none' 
                        : 'bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <span className="text-[8px] text-slate-500 block mt-1.5 text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 text-slate-400 border border-slate-850 px-4 py-2.5 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 py-3 border-t border-slate-800/80 shrink-0">
                {[
                  'How do payouts work?',
                  'Client wants cancellation',
                  'Emergency helpline!'
                ].map((txt, i) => (
                  <button
                    key={i}
                    onClick={() => setTypedMessage(txt)}
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-400 hover:text-slate-200 font-bold text-[9px] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendChatSupport} className="flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Type a concern here..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button 
                  type="submit" 
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
