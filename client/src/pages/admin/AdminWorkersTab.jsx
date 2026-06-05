import React, { useState, useEffect } from 'react';
import { getCache, setCache, invalidateCache } from '../../utils/cache';
import { fetchWithTimeout } from '../../utils/api';
import { TableSkeleton } from '../../components/Skeletons';
import { useNotificationStore } from '../../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, ShieldCheck, Eye, Phone, X, Check, XCircle
} from 'lucide-react';

const isDocumentUploaded = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (url.startsWith('http') && url.includes('supabase.co')) {
    return true;
  }
  return !lower.includes('unsplash.com') && 
         !lower.includes('sample') && 
         url !== 'profile.jpg' && 
         url !== 'selfie.jpg' && 
         url !== 'profile' && 
         url !== 'selfie' && 
         url !== 'aadhaar_front' && 
         url !== 'aadhaar_back' && 
         url !== 'aadhaar';
};

const parseJson = (str, fallback = {}) => {
  try {
    return typeof str === 'string' ? JSON.parse(str) || fallback : str || fallback;
  } catch (e) {
    return fallback;
  }
};

const AdminWorkersTab = React.memo(({ activeTab }) => {
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Audit Center selected worker
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [checklist, setChecklist] = useState({
    identity: false,
    mobile: false,
    experience: false,
    area: false,
    bank: false
  });

  const loadData = async (forceRefetch = false) => {
    const cachedWorkers = getCache('admin_workers');
    const cachedBookings = getCache('admin_bookings_minimal');

    if (cachedWorkers && cachedBookings && !forceRefetch) {
      setWorkers(cachedWorkers);
      setBookings(cachedBookings);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [workersRes, bookingsRes] = await Promise.all([
        fetchWithTimeout('/api/admin/workers', { credentials: 'include' }),
        fetchWithTimeout('/api/admin/bookings', { credentials: 'include' })
      ]);

      const workersData = await workersRes.json();
      const bookingsData = await bookingsRes.json();

      if (workersData.success && bookingsData.success) {
        setWorkers(workersData.workers || []);
        setBookings(bookingsData.bookings || []);
        setCache('admin_workers', workersData.workers || []);
        setCache('admin_bookings_minimal', bookingsData.bookings || []);
      } else {
        throw new Error('Failed to retrieve partner database records.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load partner database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update cached workers when local list changes
  const updateWorkersLocal = (updatedList) => {
    setWorkers(updatedList);
    setCache('admin_workers', updatedList);
    // Invalidate dashboard totals as well to force recount
    invalidateCache('dashboard_analytics');
  };

  // Actions
  const handleApprovePartner = async (id) => {
    try {
      const res = await fetch(`/api/admin/workers/${id}/approve`, { 
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        addNotification('Partner Approved', 'Service partner approved successfully and registered.');
        const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w);
        updateWorkersLocal(updated);
      }
    } catch (err) {
      const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w);
      const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
      const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w);
      localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
      updateWorkersLocal(updated);
      addNotification('Partner Approved', 'Service partner approved successfully (Sandbox mode).');
    }
    setSelectedWorker(null);
  };

  const handleRejectPartner = async (id) => {
    const reason = prompt('Please enter the reason for rejecting this application:', 'Document details mismatch.');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/workers/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        addNotification('Application Rejected', `Partner rejected. Reason: ${reason}`);
        const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED', availability: reason } : w);
        updateWorkersLocal(updated);
      }
    } catch (err) {
      const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED', availability: reason } : w);
      const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
      const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED', availability: reason } : w);
      localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
      updateWorkersLocal(updated);
      addNotification('Application Rejected', `Partner rejected (Sandbox mode). Reason: ${reason}`);
    }
    setSelectedWorker(null);
  };

  const handleMoveToReview = async (id) => {
    try {
      const res = await fetch(`/api/admin/workers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'UNDER_REVIEW' })
      });
      if (res.ok) {
        addNotification('Status Updated', 'Application status moved to Under Review.');
        const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'UNDER_REVIEW' } : w);
        updateWorkersLocal(updated);
      }
    } catch (err) {
      const updated = workers.map(w => w.id === id ? { ...w, approvalStatus: 'UNDER_REVIEW' } : w);
      const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
      const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'UNDER_REVIEW' } : w);
      localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
      updateWorkersLocal(updated);
      addNotification('Status Updated', 'Application status moved to Under Review (Sandbox mode).');
    }
    setSelectedWorker(null);
  };

  const openVerificationDrawer = (w) => {
    setSelectedWorker(w);
    setChecklist({
      identity: false,
      mobile: false,
      experience: false,
      area: false,
      bank: false
    });
  };

  // Previews builder
  const renderDocumentPreview = (title, base64Data) => {
    const isUploaded = isDocumentUploaded(base64Data);
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h5 className="font-bold text-xs text-slate-800">{title}</h5>
            <span className="text-[10px] text-slate-400">Uploaded on registration</span>
          </div>
          {isUploaded ? (
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Uploaded
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Image Not Available
            </span>
          )}
        </div>
        <div className="relative aspect-video bg-white rounded-xl border border-slate-150 overflow-hidden flex items-center justify-center p-2 shadow-inner">
          {isUploaded ? (
            <img 
              src={base64Data} 
              alt={title} 
              className="w-full h-full object-contain rounded-lg border border-slate-100 hover:scale-[1.03] transition-transform duration-300" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div className="text-slate-400 font-bold text-xs text-center select-none" style={{ display: isUploaded ? 'none' : 'block' }}>
            Image Not Available
          </div>
        </div>
      </div>
    );
  };

  // Metrics mapping
  const pendingWorkers = workers.filter(w => ['PENDING', 'UNDER_REVIEW'].includes(w.approvalStatus));

  const getPartnerPerformance = () => {
    const today = new Date().toDateString();
    const getWeekRange = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const getMonthRange = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return workers.filter(w => w.approvalStatus === 'APPROVED').map(w => {
      const wBookings = bookings.filter(b => b.workerId === w.id && b.status === 'COMPLETED');
      const jobsToday = wBookings.filter(b => new Date(b.createdAt).toDateString() === today).length;
      const jobsWeek = wBookings.filter(b => new Date(b.createdAt) >= getWeekRange()).length;
      const jobsMonth = wBookings.filter(b => new Date(b.createdAt) >= getMonthRange()).length;
      
      const earnings = wBookings.reduce((sum, b) => sum + (b.finalPrice * 0.7), 0);
      const cat = w.skills && w.skills[0] ? w.skills[0].service?.name : 'General Helper';

      return {
        ...w,
        category: cat,
        jobsToday,
        jobsWeek,
        jobsMonth,
        earnings
      };
    }).sort((a, b) => b.jobsMonth - a.jobsMonth || b.rating - a.rating);
  };

  if (loading) {
    return <TableSkeleton cols={7} rows={6} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center space-y-3 my-12 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-800">Connection Failed</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button onClick={() => loadData(true)} className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ==================== VIEW 1: PARTNER APPROVAL CENTER ==================== */}
      {activeTab === 'partner-approvals' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-poppins font-black text-2xl text-slate-800">Partner Approvals Queue</h2>
            <p className="text-xs text-slate-400 mt-1">Audit and verify incoming service professional applications</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">Partner Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Service Category</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Area</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {pendingWorkers.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-850">{w.user?.name}</td>
                      <td className="p-4 font-mono">{w.user?.phone}</td>
                      <td className="p-4">
                        <span className="bg-brand/10 text-brand px-2 py-0.5 rounded text-[10px] font-bold">
                          {w.skills?.[0]?.service?.name || 'Helper'}
                        </span>
                      </td>
                      <td className="p-4">{w.experienceYears || 0} Years</td>
                      <td className="p-4 text-slate-500">{w.address?.split(',')?.[0] || 'Bengaluru'}</td>
                      <td className="p-4 text-slate-500">{new Date(w.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          w.approvalStatus === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {w.approvalStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2 shrink-0">
                        <button 
                          onClick={() => openVerificationDrawer(w)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center space-x-1 shadow-sm"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View Application</span>
                        </button>
                        <a 
                          href={`tel:${w.user?.phone}`}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center space-x-1 shadow-sm"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Call</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {pendingWorkers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No Partner Applications Available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: ACTIVE PARTNERS PERFORMANCE ==================== */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-poppins font-black text-2xl text-slate-800">Partner Performance</h2>
            <p className="text-xs text-slate-400 mt-1">Review approved worker performance, completed jobs, and earnings</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">Partner Name</th>
                    <th className="p-4">Service Category</th>
                    <th className="p-4">Area</th>
                    <th className="p-4">Jobs Today</th>
                    <th className="p-4">Jobs This Week</th>
                    <th className="p-4">Jobs This Month</th>
                    <th className="p-4">Average Rating</th>
                    <th className="p-4 text-right">Total Earnings (70%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {getPartnerPerformance().map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{w.user?.name}</td>
                      <td className="p-4 font-mono">{w.category}</td>
                      <td className="p-4 text-slate-500">{w.address?.split(',')?.[0] || 'Anchepalya'}</td>
                      <td className="p-4 text-slate-700 font-bold">{w.jobsToday}</td>
                      <td className="p-4 text-slate-700 font-bold">{w.jobsWeek}</td>
                      <td className="p-4 text-brand font-black">{w.jobsMonth}</td>
                      <td className="p-4 font-extrabold text-amber-500">{w.rating} ★</td>
                      <td className="p-4 text-right text-emerald-600 font-extrabold">Rs. {w.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                  {workers.filter(w => w.approvalStatus === 'APPROVED').length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No partner profiles yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VERIFICATION AUDIT CENTER DRAWER ==================== */}
      <AnimatePresence>
        {selectedWorker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorker(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    Audit Verification Center
                  </span>
                  <h3 className="font-poppins font-black text-slate-800 text-lg mt-1">{selectedWorker.user?.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Audit uploaded assets and review registry details</p>
                </div>
                <button 
                  onClick={() => setSelectedWorker(null)}
                  className="p-1 rounded bg-slate-50 border border-slate-150 text-slate-400 hover:text-slate-700 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto scrollbar-none">
                
                {/* Details Card */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Profile</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{selectedWorker.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Skill / Trade</span>
                      <span className="font-bold text-brand block mt-0.5">{selectedWorker.skills?.[0]?.service?.name || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Contact Phone</span>
                      <span className="font-bold text-slate-800 block mt-0.5 font-mono">{selectedWorker.user?.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Email Address</span>
                      <span className="font-bold text-slate-800 block mt-0.5 truncate">{selectedWorker.user?.email}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-slate-400 block font-medium">Coverage Address</span>
                      <span className="font-bold text-slate-800 block mt-0.5 leading-relaxed">{selectedWorker.address || 'Anchepalya, Bengaluru'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Bank Details</span>
                    <div className="grid grid-cols-2 gap-4 text-xs bg-white p-3.5 rounded-xl border border-slate-150 shadow-inner">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Account Holder</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{parseJson(selectedWorker.bankDetails).holderName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Bank Name</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{parseJson(selectedWorker.bankDetails).bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Account Number</span>
                        <span className="font-bold text-slate-800 mt-0.5 block font-mono">{parseJson(selectedWorker.bankDetails).accountNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">UPI ID</span>
                        <span className="font-bold text-brand mt-0.5 block font-mono">{parseJson(selectedWorker.bankDetails).upi || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Documents & Viewer */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Documents</h4>
                  {renderDocumentPreview('Selfie Scanning Photo', parseJson(selectedWorker.profilePhoto).selfie)}
                  {renderDocumentPreview('Aadhaar Card Front Scan', parseJson(selectedWorker.aadhaar).front)}
                  {renderDocumentPreview('Aadhaar Card Back Scan', parseJson(selectedWorker.aadhaar).back)}
                </div>

                {/* Verification Audit Checklist */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Verification Checklist</span>
                  </h4>
                  
                  <div className="space-y-2.5">
                    {[
                      { id: 'identity', label: `Verify Aadhaar Name matches "${selectedWorker.user?.name}"` },
                      { id: 'mobile', label: `Verify Mobile Number is "${selectedWorker.user?.phone}"` },
                      { id: 'experience', label: `Verify Category & Experience is "${selectedWorker.skills?.[0]?.service?.name || 'Helper'}"` },
                      { id: 'area', label: `Verify Address is inside "${selectedWorker.address || 'Anchepalya'}"` },
                      { id: 'bank', label: `Verify Bank Account matches "${parseJson(selectedWorker.bankDetails).holderName || 'Name'}"` }
                    ].map(item => (
                      <label key={item.id} className="flex items-center space-x-3 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={checklist[item.id]}
                          onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="rounded text-brand focus:ring-0 bg-white border-slate-300 cursor-pointer" 
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button 
                  onClick={() => handleRejectPartner(selectedWorker.id)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition-all shadow-md shadow-rose-600/10"
                >
                  Reject Account
                </button>

                <button 
                  onClick={() => handleMoveToReview(selectedWorker.id)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase px-4 py-3 rounded-xl transition-all shadow-sm"
                >
                  Under Review
                </button>

                <button 
                  disabled={!checklist.identity || !checklist.mobile || !checklist.experience || !checklist.area || !checklist.bank}
                  onClick={() => handleApprovePartner(selectedWorker.id)}
                  className="flex-1 bg-brand disabled:bg-slate-200 hover:bg-brand-dark text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition-all disabled:text-slate-450 disabled:cursor-not-allowed shadow-md shadow-brand/10 disabled:shadow-none"
                >
                  Approve Partner
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
});

export default AdminWorkersTab;
