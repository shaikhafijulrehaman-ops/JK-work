import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  Briefcase, 
  CheckCircle,
  Truck,
  DollarSign,
  Star,
  Smartphone
} from 'lucide-react';

export default function WorkerPortal() {
  const { bookings, fetchBookings, updateJobStatus } = useBookingStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('ASSIGNED'); // ASSIGNED, COMPLETED

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings assigned to this worker
  // (In mock fallback, we identify worker Vijay using w-2 or w-1)
  const myBookings = bookings.filter(b => b.workerId === 'w-2' || b.workerId === 'w-1' || b.workerId === `user-worker-${user?.id}`);

  const activeJobs = myBookings.filter(b => ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(b.status));
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');

  // Calculate dynamic commission accumulated (using standard 70% commission)
  const totalEarnings = completedJobs.reduce((sum, b) => {
    const commission = b.workerEarnings > 0 ? b.workerEarnings : (b.finalPrice * 0.70);
    return sum + commission;
  }, 0.0);

  const handleStatusShift = async (bookingId, currentStatus) => {
    let nextStatus = 'ON_THE_WAY';
    if (currentStatus === 'ASSIGNED') nextStatus = 'ON_THE_WAY';
    else if (currentStatus === 'ON_THE_WAY') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'COMPLETED';

    const ok = await updateJobStatus(bookingId, nextStatus);
    if (ok) {
      addNotification('Job Status Transformed', `Job Ref #${bookingId.substring(0,8)} transitioned to: "${nextStatus.replace(/_/g, ' ')}"`);
      fetchBookings();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Worker Header Card */}
        <div className="bg-brand-navy text-white rounded-xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(8,145,178,0.25),transparent)] pointer-events-none"></div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <span className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-2xl font-poppins font-black border border-white/20">
              {user?.name[0]}
            </span>
            <div>
              <h1 className="font-poppins font-extrabold text-xl">{user?.name}</h1>
              <span className="text-xs text-brand-light font-bold flex items-center mt-0.5">
                <Briefcase className="w-3.5 h-3.5 mr-1" /> Anchepalya Service Partner • Vijay / Ramesh Mock
              </span>
            </div>
          </div>

          {/* Worker Payout summaries */}
          <div className="flex space-x-6 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-royal-gold font-poppins font-black text-2xl flex items-center">
                <DollarSign className="w-5 h-5 mr-0.5" /> {totalEarnings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">My Commission Earnings (70%)</span>
            </div>
            <div className="flex flex-col items-center pl-6 border-l border-white/10">
              <span className="text-white font-poppins font-black text-2xl">
                {completedJobs.length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jobs Completed</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-6 gap-6 text-xs font-semibold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('ASSIGNED')}
            className={`pb-3 font-bold ${activeTab === 'ASSIGNED' ? 'text-brand border-b-2 border-brand font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Active Service Calls ({activeJobs.length})
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={`pb-3 font-bold ${activeTab === 'COMPLETED' ? 'text-brand border-b-2 border-brand font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            History & Earnings ({completedJobs.length})
          </button>
        </div>

        {/* Jobs Lists Rendering */}
        {activeTab === 'ASSIGNED' ? (
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <div className="bg-white border border-slate-100 p-12 text-center rounded-xl text-slate-400 text-xs">
                No active service calls allocated to you at the moment. Set status as Available to receive calls in Anchepalya.
              </div>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 block">Job Reference ID</span>
                      <span className="font-semibold text-slate-700">#{job.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-400 block">Time Slot Allocated</span>
                      <span className="font-bold text-brand">{job.timeSlot}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-800 block">Requested Services</span>
                      <div className="bg-slate-50 p-3 rounded-lg font-medium">
                        {job.items ? job.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.service.name} (x{item.quantity})</span>
                            <span className="font-bold">Rs. {item.price.toLocaleString()}</span>
                          </div>
                        )) : (
                          <div className="flex justify-between">
                            <span>Service</span>
                            <span className="font-bold">Rs. {job.totalPrice.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between font-bold text-slate-800">
                          <span>Total Invoice Price</span>
                          <span>Rs. {job.finalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="font-bold text-slate-800 block">Doorstep Instructions</span>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-700 block">Customer Address:</span>
                            <span className="text-slate-400 leading-normal">{job.address}</span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Phone className="w-4 h-4 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-700 block">Customer Contact:</span>
                            <a href={`tel:${job.phone}`} className="text-brand hover:underline">{job.phone}</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status slide transitions controls */}
                  <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 text-xs">
                      <Activity className="w-4 h-4 text-brand animate-pulse" />
                      <span className="text-slate-500">Current Job Stage:</span>
                      <span className="font-bold text-brand uppercase tracking-wider">{job.status.replace(/_/g, ' ')}</span>
                    </div>

                    <button 
                      onClick={() => handleStatusShift(job.id, job.status)}
                      className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-poppins font-black text-[10px] px-8 py-3 rounded-lg uppercase tracking-wider shadow-md flex items-center justify-center space-x-1.5"
                    >
                      {job.status === 'ASSIGNED' ? (
                        <>
                          <Truck className="w-4 h-4 transform -scale-x-100" />
                          <span>Depart: Set status On The Way</span>
                        </>
                      ) : job.status === 'ON_THE_WAY' ? (
                        <>
                          <Activity className="w-4 h-4" />
                          <span>Arrived: Set status In Progress</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Finish: Set status Completed</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Ref ID</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Final Invoice</th>
                  <th className="p-4 text-right">My Commission (70%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {completedJobs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No jobs archived. Complete active service calls to build your commission balance!
                    </td>
                  </tr>
                ) : (
                  completedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">#{job.id.substring(0,8)}</td>
                      <td className="p-4">{new Date(job.updatedAt).toLocaleDateString()}</td>
                      <td className="p-4">{job.address.split(',')[0]}</td>
                      <td className="p-4 font-bold">Rs. {job.finalPrice.toLocaleString()}</td>
                      <td className="p-4 text-right text-brand font-black">
                        Rs. {(job.workerEarnings > 0 ? job.workerEarnings : (job.finalPrice * 0.70)).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
