import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useNotificationStore } from '../../store/notificationStore';
import { fetchWithRetry } from '../../utils/api';
import { 
  Layers, 
  DollarSign, 
  Clock, 
  Percent, 
  CheckCircle,
  Plus,
  Trash,
  Tag
} from 'lucide-react';

export default function AdminServices() {
  const { applyCoupon } = useCartStore();
  const { addNotification } = useNotificationStore();

  const [catalog, setCatalog] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');

  const [editId, setEditId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, couponsRes] = await Promise.all([
        fetchWithRetry('/api/admin/services', { credentials: 'include' }).catch(() => null),
        fetchWithRetry('/api/admin/coupons', { credentials: 'include' }).catch(() => null)
      ]);

      if (servicesRes) {
        const sData = await servicesRes.json().catch(() => null);
        if (sData?.success) {
          setCatalog(sData.services || []);
        }
      }

      if (couponsRes) {
        const cData = await couponsRes.json().catch(() => null);
        if (cData?.success) {
          setPromos((cData.coupons || []).map(c => ({
            code: c.code,
            discount: `${c.discountValue}%`,
            used: c.usedCount || 0
          })));
        }
      }
    } catch (err) {
      console.warn('Error loading services & promos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriceUpdate = async (id) => {
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed) || parsed <= 0) return;

    try {
      const res = await fetchWithRetry(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parsed })
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Pricing Audit Logged', `Pricing adjusted to Rs. ${parsed}`);
        setEditId(null);
        setNewPrice('');
        loadData();
      }
    } catch (err) {
      addNotification('Operation Failed', 'Unable to update pricing. Please try again.');
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!newCode) return;
    const code = newCode.toUpperCase();

    try {
      const res = await fetchWithRetry('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountType: 'PERCENTAGE',
          discountValue: parseFloat(newDiscount),
          minOrderValue: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Coupon Created', `Discount Promo "${code}" (${newDiscount}%) added successfully.`);
        setNewCode('');
        loadData();
      } else {
        addNotification('Save Failed', data.message || 'Failed to create coupon.');
      }
    } catch (err) {
      addNotification('Operation Failed', 'Unable to save coupon. Please try again.');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-poppins font-black text-3xl text-slate-800 tracking-tight">Catalog & Promo Controls</h1>
          <p className="text-xs text-slate-500 mt-1">Adjust brochure prices instantly and generate promotional codes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ==================== LEFT COLUMN: CATALOG PRICE ADJUSTMENT ==================== */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-poppins font-bold text-xs text-slate-400 uppercase tracking-wider">
              Brochure Catalog Services ({catalog.length})
            </h2>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Service Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Package Guide</th>
                      <th className="p-3">Standard Price</th>
                      <th className="p-3 text-right">Pricing Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {catalog.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                          No catalog services available
                        </td>
                      </tr>
                    ) : (
                      catalog.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{s.name}</td>
                          <td className="p-3"><span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-bold uppercase">{s.category}</span></td>
                          <td className="p-3 font-semibold text-slate-400">{s.packageText || s.durationText || 'doorstep'}</td>
                          <td className="p-3 font-black text-slate-700">Rs. {s.price.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            {editId === s.id ? (
                              <div className="flex items-center space-x-1.5 justify-end">
                                <input
                                  type="number"
                                  className="w-20 px-2 py-1 border border-slate-200 rounded outline-none text-xs text-right font-black"
                                  placeholder="New Price"
                                  value={newPrice}
                                  onChange={e => setNewPrice(e.target.value)}
                                />
                                <button
                                  onClick={() => handlePriceUpdate(s.id)}
                                  className="bg-brand text-white font-bold px-2.5 py-1 rounded shadow-sm text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditId(s.id); setNewPrice(s.price); }}
                                className="text-brand hover:underline font-bold text-[10px]"
                              >
                                Edit Price
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: PROMO CODES ENGINE ==================== */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Promo Codes Creator */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-sm text-slate-800 flex items-center">
                <Tag className="w-4.5 h-4.5 text-brand mr-1.5" /> Promo Code Generator
              </h3>

              <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Coupon Code"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    required
                  />
                  <label className="form-label">Coupon Code (e.g. DIWALI20)</label>
                </div>

                <div className="form-group">
                  <select
                    className="form-input"
                    value={newDiscount}
                    onChange={e => setNewDiscount(e.target.value)}
                  >
                    <option value="10">10% Discount</option>
                    <option value="15">15% Discount</option>
                    <option value="20">20% Discount</option>
                    <option value="25">25% Discount</option>
                  </select>
                  <label className="form-label">Discount Percentage</label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-bold text-xs py-3 rounded-lg uppercase tracking-wider shadow-md"
                >
                  Create Promo Code
                </button>
              </form>
            </div>

            {/* Promo Codes List Grid */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-poppins font-bold text-xs text-slate-400 uppercase tracking-wider">
                Active Promotional Coupons
              </h3>

              <div className="divide-y divide-slate-50">
                {promos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No promotional coupons created yet
                  </div>
                ) : (
                  promos.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <span className="font-poppins font-black bg-brand/10 text-brand px-2.5 py-1 rounded text-[10px] tracking-wide">
                          {p.code}
                        </span>
                        <span className="text-slate-400 text-[10px] font-medium">{p.used} usages logged</span>
                      </div>
                      <span className="text-brand font-black text-sm">{p.discount} OFF</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
