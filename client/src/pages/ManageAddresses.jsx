import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, MapPin, Plus, Trash2, Edit3, CheckCircle, 
  Home, Briefcase, Tag, AlertCircle, Sparkles, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageAddresses() {
  const { fetchAddresses, addAddress, editAddress, removeAddress, setAddressDefault, user } = useAuthStore();
  const navigate = useNavigate();

  // State vars
  const [addresses, setAddresses] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form states
  const [houseFlat, setHouseFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [tagType, setTagType] = useState('Home'); // Home, Work, Other
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load addresses on mount
  const loadAddressesList = async () => {
    setLoadingList(true);
    const data = await fetchAddresses();
    setAddresses(data || []);
    setLoadingList(false);
  };

  useEffect(() => {
    loadAddressesList();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setHouseFlat('');
    setStreet('');
    setLandmark('');
    setAltMobile('');
    setIsDefault(addresses.length === 0); // First address is default
    setTagType('Home');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setHouseFlat(addr.houseFlat);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setAltMobile(addr.altMobile || '');
    setIsDefault(addr.isDefault);
    setTagType(addr.landmark?.includes('(Work)') ? 'Work' : addr.landmark?.includes('(Other)') ? 'Other' : 'Home');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!houseFlat.trim() || !street.trim()) {
      setErrorMsg('Please enter both House/Flat number and Street address.');
      setIsSubmitting(false);
      return;
    }

    // Embed tag in landmark or keep separate (e.g. tag suffix in landmark to avoid schema changes)
    const suffix = tagType === 'Work' ? ' (Work)' : tagType === 'Other' ? ' (Other)' : '';
    const cleanLandmark = landmark.trim() + suffix;

    const payload = {
      houseFlat: houseFlat.trim(),
      street: street.trim(),
      landmark: cleanLandmark || null,
      altMobile: altMobile.trim() || null,
      isDefault
    };

    let result;
    if (editingAddress) {
      result = await editAddress(editingAddress.id, payload);
    } else {
      result = await addAddress(payload);
    }

    setIsSubmitting(false);
    if (result.success) {
      setSuccessToast(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
      setShowModal(false);
      loadAddressesList();
      setTimeout(() => setSuccessToast(''), 3000);
    } else {
      setErrorMsg(result.message || 'Failed to save address.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const result = await removeAddress(id);
      if (result.success) {
        setSuccessToast('Address deleted successfully!');
        loadAddressesList();
        setTimeout(() => setSuccessToast(''), 3000);
      }
    }
  };

  const handleSetDefault = async (id) => {
    const result = await setAddressDefault(id);
    if (result.success) {
      setSuccessToast('Default address updated!');
      loadAddressesList();
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-24 text-slate-800 relative">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/account')} 
              className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors mr-2 border border-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-poppins font-black text-lg text-slate-900">📍 Saved Addresses</h1>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-slate-900 text-white font-poppins font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:bg-slate-800 transition-all select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loadingList ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <span className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand animate-spin mb-4"></span>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading address book...</p>
            </motion.div>
          ) : addresses.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100">
                <MapPin className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-poppins font-extrabold text-base text-slate-800 mb-1">No Addresses Saved Yet</h3>
              <p className="text-xs text-slate-400 leading-normal max-w-[280px] mx-auto mb-6">
                Add your home or work address for lightning-fast catalog ordering and 9-minute service checks.
              </p>
              <button 
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-poppins font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Address</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {addresses.map((addr) => {
                const isWork = addr.landmark?.includes('(Work)');
                const isOther = addr.landmark?.includes('(Other)');
                const cleanLandmark = addr.landmark
                  ? addr.landmark.replace(' (Work)', '').replace(' (Other)', '')
                  : '';

                return (
                  <motion.div 
                    layout
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                      addr.isDefault 
                        ? 'border-brand/40 shadow-md ring-1 ring-brand/10' 
                        : 'border-slate-200/60 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3.5 text-left">
                        <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${
                          addr.isDefault 
                            ? 'bg-cyan-50 border-brand/20 text-brand' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}>
                          {isWork ? <Briefcase className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-poppins font-black text-sm text-slate-900">
                              {isWork ? 'Work Address' : isOther ? 'Other Address' : 'Home Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                            {addr.houseFlat}, {addr.street}
                          </p>

                          {cleanLandmark && (
                            <p className="text-[10.5px] text-slate-500 font-semibold">
                              📍 Landmark: <span className="text-slate-700">{cleanLandmark}</span>
                            </p>
                          )}

                          {addr.altMobile && (
                            <p className="text-[10.5px] text-slate-500 font-semibold">
                              📞 Alternate Phone: <span className="text-slate-700">+91 {addr.altMobile}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Header actions */}
                      <div className="flex items-center space-x-1 flex-shrink-0 select-none">
                        <button 
                          onClick={() => handleOpenEdit(addr)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(addr.id)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    {!addr.isDefault && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure settings</span>
                        <button 
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[10.5px] font-extrabold text-brand hover:text-brand-dark transition-colors flex items-center hover:underline bg-cyan-50/50 border border-brand/20 px-3 py-1 rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Set as Default Address
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-4 right-4 z-50 p-3 bg-slate-900 border border-slate-800 text-white font-poppins font-black text-xs rounded-2xl flex items-center space-x-2.5 shadow-xl justify-center max-w-sm mx-auto"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Glassmorphic Dialog Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl max-w-[450px] w-full text-left relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100 relative pr-6">
                <h3 className="font-poppins font-bold text-base text-slate-850 tracking-tight leading-none">
                  {editingAddress ? 'Edit Saved Address' : 'Add Saved Address'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute -top-1 -right-1 p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tag type selectors */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block font-poppins">Address Tag Label</label>
                  <div className="flex space-x-3 select-none">
                    {['Home', 'Work', 'Other'].map(type => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => setTagType(type)}
                        className={`flex-1 py-2.5 rounded-xl border font-poppins font-bold text-[10.5px] transition-all flex items-center justify-center space-x-1.5 ${
                          tagType === type 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        {type === 'Home' && <Home className="w-3.5 h-3.5" />}
                        {type === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                        {type === 'Other' && <Tag className="w-3.5 h-3.5" />}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="House / Flat / Block No." 
                    value={houseFlat} 
                    onChange={e => setHouseFlat(e.target.value)} 
                    required 
                  />
                  <label className="form-label flex items-center space-x-1"><Home className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> House / Flat / Block No.</label>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Street Address / Area" 
                    value={street} 
                    onChange={e => setStreet(e.target.value)} 
                    required 
                  />
                  <label className="form-label flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Street Address / Area</label>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Landmark (Optional)" 
                    value={landmark} 
                    onChange={e => setLandmark(e.target.value)} 
                  />
                  <label className="form-label flex items-center space-x-1"><Tag className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Landmark (Optional)</label>
                </div>

                <div className="form-group">
                  <input 
                    type="tel" 
                    maxLength={10}
                    className="form-input bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 font-semibold" 
                    placeholder="Alternate Mobile Number (Optional)" 
                    value={altMobile} 
                    onChange={e => setAltMobile(e.target.value.replace(/\D/g, ''))} 
                  />
                  <label className="form-label flex items-center space-x-1"><Tag className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Alternate Mobile Number (Optional)</label>
                </div>

                {/* Default checkbox */}
                {(!editingAddress || !editingAddress.isDefault) && (
                  <label className="flex items-center space-x-2.5 py-1 px-1 cursor-pointer select-none text-xs font-bold text-slate-655">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-350 text-brand focus:ring-brand w-4 h-4" 
                      checked={isDefault}
                      onChange={e => setIsDefault(e.target.checked)}
                    />
                    <span>Set as primary default address</span>
                  </label>
                )}

                {errorMsg && (
                  <div className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-100 p-2 rounded-xl flex items-center space-x-1.5 font-poppins">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-poppins font-bold text-xs rounded-xl uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-poppins font-bold text-xs py-3 rounded-xl uppercase tracking-widest shadow-sm transition-all"
                  >
                    {isSubmitting ? 'Saving Address...' : editingAddress ? 'Save Changes' : 'Add Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
