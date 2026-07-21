import React, { useState, useEffect } from 'react';
import { getCache, setCache } from '../../utils/cache';
import { fetchWithRetry } from '../../utils/api';
import { TableSkeleton } from '../../components/Skeletons';
import { Sparkles } from 'lucide-react';

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
      const [bookingsRes, partnersRes, workersRes] = await Promise.all([
        fetchWithRetry('/api/admin/bookings', { credentials: 'include' }).catch(() => null),
        fetchWithRetry('/api/admin/partners', { credentials: 'include' }).catch(() => null),
        fetchWithRetry('/api/admin/workers?status=PENDING', { credentials: 'include' }).catch(() => null)
      ]);

      if (bookingsRes) {
        const bookingsData = await bookingsRes.json().catch(() => null);
        const partnersData = partnersRes ? await partnersRes.json().catch(() => null) : null;
        const workersData = workersRes ? await workersRes.json().catch(() => null) : null;

        const bookings = bookingsData?.success ? (bookingsData.bookings || []) : [];
        const partners = partnersData?.success ? (partnersData.partners || []) : [];

        // Aggregate analytics by locality / area
        const localityMap = {};

        bookings.forEach(b => {
          const area = b.street || b.landmark || b.pincode || 'Anchepalya Central';
          if (!localityMap[area]) {
            localityMap[area] = {
              area,
              bookingsCount: 0,
              totalRevenue: 0,
              activePartnersCount: 0,
              status: 'High Demand'
            };
          }
          localityMap[area].bookingsCount += 1;
          localityMap[area].totalRevenue += (b.finalPrice || b.price || 0);
        });

        // Map partner counts
        partners.forEach(p => {
          const area = p.serviceArea || 'Anchepalya Central';
          if (localityMap[area]) {
            localityMap[area].activePartnersCount += 1;
          }
        });

        const computed = Object.values(localityMap);
        setAreaAnalytics(computed);
        setCache('analytics_data', computed);
      }
    } catch (err) {
      console.error(err);
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
              {areaAnalytics.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">
                    No area analytics recorded yet
                  </td>
                </tr>
              ) : (
                areaAnalytics.map(area => (
                  <tr key={area.area || area.name} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-800">{area.area || area.name}</td>
                    <td className="p-4 text-brand font-black">{area.bookingsCount ?? area.bookings ?? 0}</td>
                    <td className="p-4 font-bold text-slate-650">{area.activePartnersCount ?? area.activePartners ?? 0} Professionals</td>
                    <td className="p-4 text-right text-emerald-600 font-extrabold">Rs. {(area.totalRevenue ?? area.revenue ?? 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default AdminAnalyticsTab;
