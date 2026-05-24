import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Users, 
  Star, 
  DollarSign, 
  Activity, 
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react';

export default function AdminWorkers() {
  const { bookings } = useBookingStore();
  const { addNotification } = useNotificationStore();

  // Sandbox active workers state populating brochure parameters
  const [workers, setWorkers] = useState([
    { id: 'w-1', name: 'Ramesh Kumar', phone: '7766554433', rating: 4.8, commissionRate: 0.75, status: 'AVAILABLE', skills: 'Deep Cleaning, Dusting, Pest Control' },
    { id: 'w-2', name: 'Vijay Kumar', phone: '8877665544', rating: 4.9, commissionRate: 0.70, status: 'AVAILABLE', skills: 'Electrician repairs' },
    { id: 'w-3', name: 'Anitha Reddy', phone: '9988776655', rating: 4.7, commissionRate: 0.80, status: 'AVAILABLE', skills: 'Baby Care support, Cooking' },
    { id: 'w-4', name: 'Suresh Prasad', phone: '6655443322', rating: 4.6, commissionRate: 0.70, status: 'AVAILABLE', skills: 'House Shifting' },
    { id: 'w-5', name: 'Rakesh Sharma', phone: '5544332211', rating: 4.8, commissionRate: 0.75, status: 'AVAILABLE', skills: 'House Painting, Security' }
  ]);

  // Dynamic Payroll ledger data
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    // Relate finished jobs from bookings to calculate live salaries automatically
    const completed = bookings.filter(b => b.status === 'COMPLETED');

    const updatedLedger = workers.map(w => {
      // Find jobs completed by this worker in current session
      const workerJobs = completed.filter(b => b.workerId === w.id);
      
      // Dynamic jobs count
      const localJobsCount = w.id === 'w-2' ? 6 : w.id === 'w-1' ? 8 : w.id === 'w-3' ? 4 : 2;
      const totalJobsCompleted = localJobsCount + workerJobs.length;

      // Base salary plus dynamic commission splits (70-80% splits)
      const baseEarnings = w.id === 'w-2' ? 4200 : w.id === 'w-1' ? 7400 : w.id === 'w-3' ? 2400 : 1800;
      const activeCommission = workerJobs.reduce((sum, b) => sum + (b.workerEarnings > 0 ? b.workerEarnings : b.finalPrice * w.commissionRate), 0.0);
      const totalEarningsDue = baseEarnings + activeCommission;

      return {
        ...w,
        totalJobs: totalJobsCompleted,
        earningsDue: totalEarningsDue
      };
    });

    setLedger(updatedLedger);
  }, [bookings, workers]);

  const toggleStatus = (id) => {
    const updated = workers.map(w => {
      if (w.id === id) {
        const next = w.status === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE';
        addNotification('Worker status transformed', `${w.name} status updated to ${next}`);
        return { ...w, status: next };
      }
      return w;
    });
    setWorkers(updated);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Worker & Payroll Ledger</h1>
            <p className="text-xs text-slate-500 mt-1">Track jobs completed and auto-calculate commissions (70% - 80% splits)</p>
          </div>
        </div>

        {/* Dynamic Payroll grid lists */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Worker Profile Details</th>
                  <th className="p-4">Mapped Skills</th>
                  <th className="p-4">Performance Score</th>
                  <th className="p-4">Completed Count</th>
                  <th className="p-4">Commission Splits</th>
                  <th className="p-4">Active Operations</th>
                  <th className="p-4 text-right">Payroll Salary Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {ledger.map((w) => (
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
                      <span className="text-[10px] text-slate-500 leading-normal max-w-[200px] block truncate" title={w.skills}>
                        {w.skills}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-royal-gold font-bold flex items-center">
                        <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {w.rating}★
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{w.totalJobs} jobs</td>
                    <td className="p-4 font-semibold text-slate-400 uppercase tracking-tight">{w.commissionRate * 100}% splits</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(w.id)}
                        className={`text-[9px] font-poppins font-black px-3 py-1 rounded uppercase tracking-wider shadow-sm flex items-center space-x-1 ${
                          w.status === 'AVAILABLE' 
                            ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {w.status === 'AVAILABLE' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Active: Toggle</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>Inactive: Toggle</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right text-brand font-poppins font-black text-sm">
                      Rs. {w.earningsDue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Ledger Notice */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-400 leading-relaxed max-w-2xl">
          💡 <strong>Enterprise Payroll Notice:</strong> Salaries are auto-calculated dynamically: 70% to 80% splits are applied instantly when workers slide active job statuses to COMPLETED. Platform settlement clears directly to Chikkabidarakallu dispatch ledger lists.
        </div>

      </div>
    </div>
  );
}
