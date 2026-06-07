import React, { useState, useEffect } from 'react';
import { getCache, setCache } from '../../utils/cache';
import { fetchWithRetry } from '../../utils/api';
import { TableSkeleton } from '../../components/Skeletons';
import { AlertCircle } from 'lucide-react';

const AdminAnalyticsTab = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaAnalytics, setAreaAnalytics] = useState([]);

  const loadData = async (forceRefetch = false) => {
    const cached = getCache('analytics_data');
    if (cached && !forceRefetch) {
      setAreaAnalytics(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parallel fetch bookings and workers with retries
      const [bookingsRes, workersRes] = await Promise.all([
        fetchWithRetry('/api/admin/bookings', { credentials: 'include' }),
        fetchWithRetry('/api/admin/workers', { credentials: 'include' })
      ]);

      const bookingsData = await bookingsRes.json();
      const workersData = await workersRes.json();

      if (bookingsData.success && workersData.success) {
        const bookings = bookingsData.bookings || [];
        const workers = workersData.workers || [];

        // Calculate geographical zone metrics
        const areas = [
          { name: 'Anchepalya', pincodes: ['560073'] },
          { name: 'Nagasandra', pincodes: ['560074'] },
          { name: 'Bagalagunte', pincodes: ['560075'] },
          { name: 'Peenya', pincodes: ['560058'] },
          { name: 'Peenya Industrial Area', pincodes: ['560059'] },
          { name: 'Madavara', pincodes: ['562123'] },
          { name: 'Chikkabidarakallu', pincodes: ['560076'] },
          { name: 'Doddabidarakallu', pincodes: ['560077'] }
        ];

        const computed = areas.map(area => {
          const areaBookings = bookings.filter(b => b.address?.toLowerCase().includes(area.name.toLowerCase()));
          const revenue = areaBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.finalPrice, 0);
          const activePartners = workers.filter(w => w.approvalStatus === 'APPROVED' && w.address?.toLowerCase().includes(area.name.toLowerCase())).length;

          return {
            name: area.name,
            bookings: areaBookings.length,
            revenue,
            activePartners
          };
        });

        setAreaAnalytics(computed);
        setCache('analytics_data', computed);
      } else {
        throw new Error('Failed to retrieve analytics databases.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <TableSkeleton cols={4} rows={6} />;
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
        <h2 className="font-poppins font-black text-2xl text-slate-800">Area Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">Analyze geographical service bookings density and local partner availability</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Geographical Zone</th>
                <th className="p-4">Total Bookings</th>
                <th className="p-4">Active Partners Residing</th>
                <th className="p-4 text-right">Completed Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {areaAnalytics.map(area => (
                <tr key={area.name} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-800">{area.name}</td>
                  <td className="p-4 text-brand font-black">{area.bookings}</td>
                  <td className="p-4 font-bold text-slate-650">{area.activePartners} Professionals</td>
                  <td className="p-4 text-right text-emerald-600 font-extrabold">Rs. {area.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default AdminAnalyticsTab;
