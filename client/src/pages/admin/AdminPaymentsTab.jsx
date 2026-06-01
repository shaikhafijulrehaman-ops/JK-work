import React, { useState, useEffect } from 'react';
import { getCache, setCache } from '../../utils/cache';
import { fetchWithTimeout } from '../../utils/api';
import { TableSkeleton } from '../../components/Skeletons';
import { AlertCircle, TrendingUp } from 'lucide-react';

const AdminPaymentsTab = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState({
    todayRev: 0,
    weekRev: 0,
    monthRev: 0,
    paymentList: []
  });

  const loadData = async (forceRefetch = false) => {
    const cached = getCache('payments_data');
    if (cached && !forceRefetch) {
      setPaymentData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithTimeout('http://localhost:5000/api/admin/payments', { credentials: 'include' });
      const data = await res.json();
      
      if (data.success) {
        const payload = {
          todayRev: data.todayRev || 0,
          weekRev: data.weekRev || 0,
          monthRev: data.monthRev || 0,
          paymentList: data.paymentList || []
        };
        setPaymentData(payload);
        setCache('payments_data', payload);
      } else {
        throw new Error(data.message || 'Failed to retrieve payments database.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load payment ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
        <TableSkeleton cols={6} rows={5} />
      </div>
    );
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
      <div>
        <h2 className="font-poppins font-black text-2xl text-slate-800">Payment Ledger</h2>
        <p className="text-xs text-slate-400 mt-1">Audit all billing flows, platform commission splits, and payouts</p>
      </div>

      {/* Revenue totals cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Today's Revenue</span>
            <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">Rs. {paymentData.todayRev.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Weekly Revenue</span>
            <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">Rs. {paymentData.weekRev.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Monthly Revenue</span>
            <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">Rs. {paymentData.monthRev.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Booking payments table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Date</th>
                <th className="p-4">Booking Amount</th>
                <th className="p-4">Partner Share (70%)</th>
                <th className="p-4">Platform Share (30%)</th>
                <th className="p-4 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {paymentData.paymentList.map(pay => {
                const partnerShare = (pay.amount * 0.70).toFixed(2);
                const platformShare = (pay.amount * 0.30).toFixed(2);
                return (
                  <tr key={pay.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-brand">{pay.id.substring(0,8)}</td>
                    <td className="p-4 text-slate-500">{new Date(pay.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-slate-800">Rs. {pay.amount}</td>
                    <td className="p-4 text-emerald-600 font-bold">Rs. {partnerShare}</td>
                    <td className="p-4 text-brand font-bold">Rs. {platformShare}</td>
                    <td className="p-4 text-right">
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        pay.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        pay.status === 'FAILED' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paymentData.paymentList.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No payments recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default AdminPaymentsTab;
