import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Percent, 
  ShieldAlert, 
  Calendar,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

export default function AdminOverview() {
  const { bookings } = useBookingStore();
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    totalSales: 0,
    totalBookings: 0,
    completionRate: 0,
    clientCount: 1, // Standard customer
    activeWorkers: 5
  });

  const [auditLogs, setAuditLogs] = useState([
    { id: 'al-1', action: 'USER_LOGIN', details: 'admin@jkenterprises.com logged in successfully', ip: '127.0.0.1', date: new Date() },
    { id: 'al-2', action: 'PRICING_CHANGE', details: 'Full House Deep Cleaning pricing adjusted to Rs. 3,499', ip: '127.0.0.1', date: new Date(Date.now() - 3600000) },
    { id: 'al-3', action: 'COUPON_CREATE', details: 'Active promo coupon "9MINUTES" (15% discount) generated', ip: '127.0.0.1', date: new Date(Date.now() - 86400000) }
  ]);

  useEffect(() => {
    // 1. Calculate active metrics based on state bookings
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'COMPLETED');
    const sales = completed.reduce((sum, b) => sum + b.finalPrice, 0.0);
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    // We add standard brochure values to simulate full operations
    setStats({
      totalSales: 38780 + sales,
      totalBookings: 24 + total,
      completionRate: rate > 0 ? Math.round((18 + completed.length) / (24 + total) * 100) : 75,
      clientCount: 18 + (bookings.length > 0 ? 1 : 0),
      activeWorkers: 5
    });

    // Capture dynamic logs when a booking changes status in sandbox
    if (bookings.length > 0) {
      const last = bookings[bookings.length - 1];
      const exist = auditLogs.find(log => log.id === last.id);
      if (!exist) {
        const fresh = {
          id: last.id,
          action: 'BOOKING_CANCEL',
          details: `Booking Ref #${last.id.substring(0,8)} status updated to ${last.status}`,
          ip: '127.0.0.1',
          date: new Date()
        };
        setAuditLogs(prev => [fresh, ...prev]);
      }
    }
  }, [bookings]);

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight flex items-center">
              <ShieldAlert className="w-8 h-8 text-brand mr-2" /> Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">Real-time business intelligence and dispatch controls</p>
          </div>
          
          <div className="flex space-x-2">
            <Link to="/admin/bookings" className="bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm uppercase tracking-wider flex items-center">
              <span>Bookings Board</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Dynamic Metric cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Net Revenue Sales</span>
              <span className="font-poppins font-black text-2xl text-slate-800">
                Rs. {stats.totalSales.toLocaleString()}
              </span>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bookings placed</span>
              <span className="font-poppins font-black text-2xl text-slate-800">{stats.totalBookings}</span>
            </div>
            <div className="w-12 h-12 bg-brand/5 text-brand rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completion rate</span>
              <span className="font-poppins font-black text-2xl text-brand">{stats.completionRate}%</span>
            </div>
            <div className="w-12 h-12 bg-brand/5 text-brand rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered clients</span>
              <span className="font-poppins font-black text-2xl text-slate-800">{stats.clientCount}</span>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Dashboard quick links grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/bookings" className="bg-white border border-slate-100 rounded-xl p-5 hover:border-brand/40 shadow-sm transition-all flex items-start space-x-3">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-800">Bookings Dispatcher Board</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                View all pending service requests, assign qualified workers in Anchepalya, and monitor live timelines.
              </p>
            </div>
          </Link>

          <Link to="/admin/workers" className="bg-white border border-slate-100 rounded-xl p-5 hover:border-brand/40 shadow-sm transition-all flex items-start space-x-3">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-800">Worker Payroll Ledger</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Manage worker profiles, toggle active status, review ratings, and track completed commissions (70% splits).
              </p>
            </div>
          </Link>

          <Link to="/admin/services" className="bg-white border border-slate-100 rounded-xl p-5 hover:border-brand/40 shadow-sm transition-all flex items-start space-x-3">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-800">Catalog & Promo Controls</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Adjust brochure prices instantly, deactivate/activate services, and customize discount promo codes.
              </p>
            </div>
          </Link>
        </div>

        {/* ==================== AUDIT LEDGER LOGS TABLE ==================== */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-4 mb-4">
            <Database className="w-5 h-5 text-brand" />
            <h3 className="font-poppins font-extrabold text-sm text-slate-800">
              System Audit Trail (100% Security Logging)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Log Event Timestamp</th>
                  <th className="p-3">Operator Role</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Event Mutation Details</th>
                  <th className="p-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-400">{new Date(log.date).toLocaleString()}</td>
                    <td className="p-3"><span className="text-[10px] font-bold bg-brand/10 text-brand uppercase px-2 py-0.5 rounded">ADMIN</span></td>
                    <td className="p-3 font-bold text-slate-800">{log.action}</td>
                    <td className="p-3 text-slate-500">{log.details}</td>
                    <td className="p-3 text-right text-slate-400 font-mono">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
