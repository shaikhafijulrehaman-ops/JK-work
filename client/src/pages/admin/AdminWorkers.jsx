import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Users, Star, DollarSign, Activity, CheckCircle, XCircle, Briefcase, FileText, Check, X
} from 'lucide-react';

export default function AdminWorkers() {
  const { bookings } = useBookingStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED

  // Sandbox active workers state
  const [workers, setWorkers] = useState([
    { id: 'w-1', name: 'Ramesh Kumar', phone: '7766554433', rating: 4.8, commissionRate: 0.75, status: 'AVAILABLE', approvalStatus: 'APPROVED', skills: 'Deep Cleaning, Dusting, Pest Control', experience: 5, category: 'Cleaning' },
    { id: 'w-2', name: 'Vijay Kumar', phone: '8877665544', rating: 4.9, commissionRate: 0.70, status: 'AVAILABLE', approvalStatus: 'APPROVED', skills: 'Electrician repairs', experience: 4, category: 'Technical' },
    { id: 'w-new1', name: 'Sanjay Dutt', phone: '9988776611', rating: 0, commissionRate: 0.70, status: 'AVAILABLE', approvalStatus: 'PENDING', skills: 'Plumbing', experience: 2, category: 'Technical' }
  ]);

  const filteredWorkers = workers.filter(w => w.approvalStatus === activeTab);

  const handleApprove = (id) => {
    setWorkers(workers.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w));
    addNotification('Worker Approved', `Service Partner has been approved successfully.`);
  };

  const handleReject = (id) => {
    setWorkers(workers.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED' } : w));
    addNotification('Worker Rejected', `Service Partner application rejected.`);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Partner Verifications & Payroll</h1>
          <p className="text-xs text-slate-500 mt-1">Review onboarding applications, verify Aadhaar, and manage active service partners.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-6 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider mb-6">
          {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 ${activeTab === tab ? 'text-brand border-b-2 border-brand font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab} Workers ({workers.filter(w => w.approvalStatus === tab).length})
            </button>
          ))}
        </div>

        {/* Dynamic Payroll grid lists */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Partner Profile</th>
                  <th className="p-4">Category / Exp.</th>
                  {activeTab === 'APPROVED' && <th className="p-4">Commission Splits</th>}
                  {activeTab === 'PENDING' && <th className="p-4">Documents Provided</th>}
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No {activeTab.toLowerCase()} workers found in the database.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 bg-brand/10 text-brand rounded-full flex items-center justify-center font-poppins font-black">
                            {w.name[0]}
                          </span>
                          <div>
                            <span className="font-poppins font-extrabold text-slate-800 block">{w.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{w.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 block">{w.category || w.skills}</span>
                        <span className="text-[10px] text-slate-500">{w.experience} Years Exp.</span>
                      </td>
                      {activeTab === 'APPROVED' && (
                        <td className="p-4 font-semibold text-slate-400 uppercase tracking-tight">
                          {w.commissionRate * 100}% splits
                        </td>
                      )}
                      {activeTab === 'PENDING' && (
                        <td className="p-4">
                          <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-500">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> <span>Aadhaar uploaded</span>
                          </div>
                        </td>
                      )}
                      <td className="p-4 text-right">
                        {activeTab === 'PENDING' ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleApprove(w.id)} className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors flex items-center" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(w.id)} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors flex items-center" title="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : activeTab === 'APPROVED' ? (
                          <span className="text-green-600 font-bold flex justify-end items-center"><CheckCircle className="w-4 h-4 mr-1" /> Approved</span>
                        ) : (
                          <span className="text-red-500 font-bold flex justify-end items-center"><XCircle className="w-4 h-4 mr-1" /> Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-400 leading-relaxed max-w-2xl">
          💡 <strong>Verification Notice:</strong> Approving a worker automatically shifts them to AVAILABLE status in the registry and dispatches an instant WhatsApp notification allowing them to accept live bookings.
        </div>
      </div>
    </div>
  );
}
