import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  UserPlus, 
  CheckCircle,
  Truck,
  DollarSign,
  X,
  Star,
  Activity
} from 'lucide-react';

export default function AdminBookings() {
  const { bookings, fetchBookings, assignWorker, updateJobStatus } = useBookingStore();
  const { addNotification } = useNotificationStore();

  const [activeBooking, setActiveBooking] = useState(null); // Selected booking for assign
  const [showDrawer, setShowDrawer] = useState(false);

  // Vetted sandbox workers with skills mapping
  const workers = [
    { id: 'w-1', name: 'Ramesh Kumar', phone: '7766554433', rating: 4.8, skills: ['Full House Deep Cleaning', 'Bathroom Deep Cleaning', 'Full Kitchen Cleaning', 'Dust Cleaning', 'Pest Control'] },
    { id: 'w-2', name: 'Vijay Kumar', phone: '8877665544', rating: 4.9, skills: ['Electrician Service'] },
    { id: 'w-3', name: 'Anitha Reddy', phone: '9988776655', rating: 4.7, skills: ['Baby Care', 'Cooking Service'] },
    { id: 'w-4', name: 'Suresh Prasad', phone: '6655443322', rating: 4.6, skills: ['House Shifting'] },
    { id: 'w-5', name: 'Rakesh Sharma', phone: '5544332211', rating: 4.8, skills: ['House Painting', 'Security Provider'] }
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAssign = async (workerId) => {
    if (!activeBooking) return;
    const ok = await assignWorker(activeBooking.id, workerId);
    if (ok) {
      addNotification('Professional Dispatched', `Trained expert assigned to job #${activeBooking.id.substring(0,8)}`);
      setShowDrawer(false);
      fetchBookings();
    }
  };

  const getWorkerSkillsText = (workerSkills) => {
    return workerSkills.join(', ');
  };

  // Filter workers who possess the skill matching the booking service!
  const getMatchingWorkers = (booking) => {
    if (!booking) return [];
    
    // Determine the service name
    const serviceName = booking.items && booking.items.length > 0 
      ? booking.items[0].service.name 
      : 'Electrician Service';

    return workers.filter(w => w.skills.includes(serviceName));
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Bookings Dispatcher Board</h1>
          <p className="text-xs text-slate-500 mt-1">Match, assign, and slide instant delivery job timelines</p>
        </div>

        {/* Live Grid Lists */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Services Ordered</th>
                  <th className="p-4">Dispatch Stage</th>
                  <th className="p-4">Assigned Expert</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No customer bookings logged in system. Open catalog to place bookings.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">#{b.id.substring(0,8).toUpperCase()}</td>
                      <td className="p-4">
                        <span className="block font-bold">{new Date(b.scheduledAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400">{b.timeSlot}</span>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-800 block">{b.address.split(',')[0]}</span>
                        <span className="text-[10px] text-slate-400 flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 text-brand" /> Anchepalya</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {b.items && b.items.length > 0 ? b.items[0].service.name : 'Cleaning Call'}
                        {b.items && b.items.length > 1 && <span className="text-[10px] text-brand block font-semibold">+ {b.items.length - 1} other items</span>}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          b.status === 'PENDING' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-brand/10 text-brand'
                        }`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        {b.workerId ? (
                          <span className="flex items-center text-brand">
                            <Truck className="w-3.5 h-3.5 mr-1" /> Ramesh / Vijay
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!b.workerId ? (
                          <button 
                            onClick={() => { setActiveBooking(b); setShowDrawer(true); }}
                            className="bg-brand hover:bg-brand-dark text-white text-[9px] font-poppins font-black px-3.5 py-1.5 rounded uppercase tracking-wider shadow-sm flex items-center space-x-1.5 ml-auto"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Assign Expert</span>
                          </button>
                        ) : (
                          <span className="text-green-600 font-bold flex items-center justify-end">
                            <CheckCircle className="w-4 h-4 mr-0.5" /> Managed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== ASSIGN DISPATCHER DRAWER ==================== */}
        {showDrawer && activeBooking && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 border-l border-slate-100 flex flex-col justify-between animate-slide-in">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="font-poppins font-extrabold text-sm text-slate-800">
                      Match Anchepalya Professional
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Booking Ref: #{activeBooking.id.substring(0,8)}</p>
                  </div>
                  <button 
                    onClick={() => setShowDrawer(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Booking Info */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Selected Service:</span>
                    <span className="text-brand">
                      {activeBooking.items && activeBooking.items.length > 0 ? activeBooking.items[0].service.name : 'Cleaning Call'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Customer Address:</span>
                    <span className="text-right truncate max-w-[200px]">{activeBooking.address}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Qualified Matches In Anchepalya ({getMatchingWorkers(activeBooking).length})
                </h4>

                {/* Workers List */}
                <div className="space-y-3">
                  {getMatchingWorkers(activeBooking).length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-6">
                      No matching verified workers found for this skill in Anchepalya.
                    </div>
                  ) : (
                    getMatchingWorkers(activeBooking).map((w) => (
                      <div 
                        key={w.id}
                        className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-brand transition-all cursor-pointer shadow-sm"
                        onClick={() => handleAssign(w.id)}
                      >
                        <div className="space-y-1">
                          <span className="font-poppins font-extrabold text-xs text-slate-800 block">{w.name}</span>
                          <span className="text-[9px] text-slate-400 font-medium max-w-[240px] block truncate">
                            Skills: {getWorkerSkillsText(w.skills)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                          <span className="text-royal-gold font-bold text-xs flex items-center">
                            <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {w.rating}★
                          </span>
                          <span className="text-[9px] text-slate-400 leading-none uppercase font-bold tracking-tight">Available</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 mt-6">
                Assigning a worker shifts the state instantly to ASSIGNED, triggers real-time in-app notifications, and activates live customer dashboard GPS timelines.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
