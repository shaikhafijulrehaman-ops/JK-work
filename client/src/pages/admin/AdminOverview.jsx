import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getCache, setCache, invalidateCache, clearCache } from '../../utils/cache';
import { fetchWithRetry } from '../../utils/api';
import { CardSkeleton, TableSkeleton, AnalyticsSkeleton } from '../../components/Skeletons';
import { 
  TrendingUp, ShoppingBag, Users, Percent, ShieldAlert, 
  Calendar, Layers, ArrowRight, Database, Search, FileText, 
  Check, X, Eye, Phone, Mail, AlertCircle, MapPin, 
  CreditCard, CheckCircle, XCircle, Settings, Award, 
  ShieldCheck, BarChart3, Landmark, Grid, HelpCircle, 
  ArrowUpRight, Download, Maximize2, LogOut, Plus, Sparkles,
  ArrowDownRight, Edit, Bell, Trash2, Menu
} from 'lucide-react';

const AdminAnalyticsTab = React.lazy(() => import('./AdminAnalyticsTab'));
const AdminPaymentsTab = React.lazy(() => import('./AdminPaymentsTab'));


const formatLogDetails = (log) => {
  let details = {};
  try {
    details = log.details ? JSON.parse(log.details) : (log.metadata ? JSON.parse(log.metadata) : {});
  } catch (e) {
    return typeof log.details === 'string' ? log.details : 'N/A';
  }
  
  if (log.action === 'BOOKING_CREATED') {
    return `Booking #${details.bookingId?.substring(0,8).toUpperCase() || ''} created for Rs. ${details.finalPrice || details.amount || ''}`;
  }
  if (log.action === 'COUPON_APPLIED') {
    return `Coupon "${details.couponCode || ''}" applied (discount: Rs. ${details.discountApplied || 0})`;
  }
  if (log.action === 'PAYMENT_SUCCESS') {
    return `Payment of Rs. ${details.amount || ''} captured. ID: ${details.paymentId || ''}`;
  }
  if (log.action === 'PAYMENT_FAILED') {
    return `Payment of Rs. ${details.amount || ''} failed. ID: ${details.paymentId || ''}`;
  }
  if (log.action === 'BOOKING_CANCELLED') {
    return `Booking #${details.bookingId?.substring(0,8).toUpperCase() || ''} cancelled`;
  }
  if (log.action === 'PROFILE_UPDATED') {
    return `Profile fields updated: ${(details.updatedFields || []).join(', ')}`;
  }
  if (log.action === 'SERVICE_CREATE') {
    return `Service "${details.name}" added at Rs. ${details.price}`;
  }
  if (log.action === 'SERVICE_UPDATE') {
    return `Service "${details.name}" modified (price: Rs. ${details.oldPrice} -> Rs. ${details.newPrice})`;
  }
  if (log.action === 'SERVICE_DELETE') {
    return `Service "${details.name}" deleted`;
  }
  if (log.action === 'WORKER_STATUS_CHANGE') {
    return `Worker #${details.workerId?.substring(0,8)} status updated to ${details.status}`;
  }
  if (log.action === 'ACCOUNT_LOGIN') {
    return `Logged in (Role: ${details.role || 'USER'})`;
  }
  if (log.action === 'ACCOUNT_CREATED') {
    return `Account registered (Email: ${details.email})`;
  }
  if (log.action === 'OTP_VERIFICATION') {
    return `OTP verified successfully`;
  }

  if (Object.keys(details).length > 0) {
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ');
  }
  return log.details || 'No details';
};

export default function AdminOverview({ defaultTab = 'dashboard' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addNotification, notifications, fetchNotifications, markAsRead } = useNotificationStore();

  // Selected view: dashboard, bookings, partner-approvals, partners, customers, payments, services, analytics, settings, coupons
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Database States
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [partnerFormName, setPartnerFormName] = useState('');
  const [partnerFormPhone, setPartnerFormPhone] = useState('');
  const [partnerFormServiceType, setPartnerFormServiceType] = useState('Cleaning');
  const [partnerFormStatus, setPartnerFormStatus] = useState('AVAILABLE');
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sub-tabs for Audit Center
  const [auditSubTab, setAuditSubTab] = useState('feed'); // feed, logins, registrations, bookings, payments, admin
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditFilter, setAuditFilter] = useState('All');

  // Strict authorization safety gate
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');


  // Selected Entity for Drawers / Modals
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Partner Assignment Input States
  const [partnerIdInput, setPartnerIdInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [partnerMobileInput, setPartnerMobileInput] = useState('');

  // Custom Assign Partner Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalBookingId, setAssignModalBookingId] = useState(null);
  const [assignModalPartnerName, setAssignModalPartnerName] = useState('');
  const [assignModalPartnerMobile, setAssignModalPartnerMobile] = useState('');

  useEffect(() => {
    if (selectedBooking) {
      setPartnerIdInput(selectedBooking.partnerId || '');
      setPartnerNameInput(selectedBooking.partnerName || '');
      setPartnerMobileInput(selectedBooking.partnerMobile || '');
    } else {
      setPartnerIdInput('');
      setPartnerNameInput('');
      setPartnerMobileInput('');
    }
  }, [selectedBooking]);

  // Admin seen-tracking for new applications
  const seenWorkerIds = React.useRef(new Set());
  const [toasts, setToasts] = useState([]);

  const showAdminToast = (title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    identity: false,
    experience: false,
    mobile: false,
    area: false,
    documents: false,
    bank: false
  });

  // Service form states
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServicePackage, setNewServicePackage] = useState('');
  const [newServiceIsActive, setNewServiceIsActive] = useState(true);
  const [addingService, setAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Coupon form states
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    id: null,
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '0',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Notifications bell & seen tracking states
  const [showNotifications, setShowNotifications] = useState(false);
  const seenNotificationIds = React.useRef(new Set());

  // Dynamic audit logs helper functions & computations
  const getPartnerLastLogin = (workerUserId) => {
    const matchedLog = auditLogs.find(log => log.action === 'USER_LOGIN' && log.userId === workerUserId);
    return matchedLog ? new Date(matchedLog.createdAt).toLocaleString() : 'N/A';
  };

  const liveActivityFeed = useMemo(() => {
    return auditLogs.map(log => {
      let text = '';
      let color = 'text-slate-600 bg-slate-50 border-slate-100';
      let details = {};
      try {
        details = log.details ? JSON.parse(log.details) : (log.metadata ? JSON.parse(log.metadata) : {});
      } catch (err) {}
      const userName = log.userName || log.user?.name || details.name || details.email || 'System';

      switch (log.action) {
        case 'ACCOUNT_CREATED':
          text = `Account created for ${userName} (${log.userEmail || details.email || ''})`;
          color = 'text-indigo-600 bg-indigo-50 border-indigo-100';
          break;
        case 'ACCOUNT_LOGIN':
          text = `${userName} logged in successfully`;
          color = 'text-emerald-600 bg-emerald-50 border-emerald-100';
          break;
        case 'ACCOUNT_LOGOUT':
          text = `${userName} logged out`;
          color = 'text-slate-500 bg-slate-50 border-slate-100';
          break;
        case 'OTP_VERIFICATION':
          text = `OTP verified for ${userName}`;
          color = 'text-purple-600 bg-purple-50 border-purple-100';
          break;
        case 'BOOKING_CREATED':
          text = `Booking #${details.bookingId?.substring(0, 8).toUpperCase() || ''} created for Rs. ${details.finalPrice || details.amount || ''}`;
          color = 'text-cyan-600 bg-cyan-50 border-cyan-100';
          break;
        case 'COUPON_APPLIED':
          text = `Coupon ${details.couponCode || ''} applied to Booking #${details.bookingId?.substring(0, 8).toUpperCase() || ''}`;
          color = 'text-rose-600 bg-rose-50 border-rose-100';
          break;
        case 'PAYMENT_SUCCESS':
          text = `Payment of Rs. ${details.amount || ''} succeeded. Ref: ${details.paymentId || ''}`;
          color = 'text-teal-600 bg-teal-50 border-teal-100';
          break;
        case 'PAYMENT_FAILED':
          text = `Payment of Rs. ${details.amount || ''} failed. Ref: ${details.paymentId || ''}`;
          color = 'text-red-600 bg-red-50 border-red-100';
          break;
        case 'BOOKING_CANCELLED':
          text = `Booking #${details.bookingId?.substring(0, 8).toUpperCase() || ''} was cancelled`;
          color = 'text-amber-600 bg-amber-50 border-amber-100';
          break;
        case 'ADDRESS_ADDED':
          text = `${userName} added address: ${details.houseFlat || ''}, ${details.street || ''}`;
          color = 'text-sky-600 bg-sky-50 border-sky-100';
          break;
        case 'PROFILE_UPDATED':
          text = `${userName} updated profile details (${(details.updatedFields || []).join(', ')})`;
          color = 'text-pink-600 bg-pink-50 border-pink-100';
          break;
        case 'SERVICE_CREATE':
          text = `Catalog service "${details.name || ''}" added by Admin`;
          color = 'text-cyan-600 bg-cyan-50 border-cyan-100';
          break;
        case 'SERVICE_UPDATE':
          text = `Catalog service "${details.name || ''}" updated by Admin`;
          color = 'text-amber-600 bg-amber-50 border-amber-100';
          break;
        case 'SERVICE_DELETE':
          text = `Catalog service "${details.name || ''}" deleted by Admin`;
          color = 'text-rose-600 bg-rose-50 border-rose-100';
          break;
        case 'WORKER_STATUS_CHANGE':
          text = `Worker status changed to ${details.status || ''}`;
          color = 'text-purple-600 bg-purple-50 border-purple-100';
          break;
        default:
          text = `${log.action}: ${typeof log.details === 'string' ? log.details : JSON.stringify(details)}`;
          color = 'text-slate-600 bg-slate-50 border-slate-100';
      }

      return {
        id: log.id,
        type: log.action,
        text,
        timestamp: new Date(log.createdAt),
        color,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      };
    });
  }, [auditLogs]);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    addNotification('Logged Out', 'Admin session terminated successfully.');
    navigate('/auth');
  };

  // Add/Edit Service handler
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServiceCategory || !newServicePrice || !newServiceDesc) {
      addNotification('Validation Error', 'Please fill in all required fields (Name, Category, Price, Description).');
      return;
    }

    setAddingService(true);
    const body = {
      name: newServiceName,
      category: newServiceCategory,
      price: parseFloat(newServicePrice),
      description: newServiceDesc,
      durationText: newServiceDuration,
      packageText: newServicePackage,
      imageUrl: newServiceImage,
      isActive: newServiceIsActive
    };

    try {
      let res;
      if (editingServiceId) {
        res = await fetch(`/api/services/${editingServiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
      }

      const data = await res.json();
      if (data.success) {
        addNotification(editingServiceId ? 'Service Updated' : 'Service Created', `Service "${newServiceName}" successfully saved.`);
        // Reset form
        setNewServiceName('');
        setNewServiceCategory('');
        setNewServicePrice('');
        setNewServiceImage('');
        setNewServiceDesc('');
        setNewServiceDuration('');
        setNewServicePackage('');
        setNewServiceIsActive(true);
        setEditingServiceId(null);
        fetchAllData();
      } else {
        addNotification('Operation Failed', data.message || 'Failed to save service.');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to save service.');
      } else {
        console.warn('Backend server offline. Simulating service save locally...', err);
        if (editingServiceId) {
          setServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...body } : s));
          addNotification('Service Updated', `Service "${newServiceName}" updated locally (Sandbox mode).`);
        } else {
          const fakeService = {
            id: `s-${Date.now()}`,
            ...body,
            imageUrl: newServiceImage || ''
          };
          setServices(prev => [...prev, fakeService]);
          addNotification('Service Created', `Service "${newServiceName}" created locally (Sandbox mode).`);
        }
        
        setNewServiceName('');
        setNewServiceCategory('');
        setNewServicePrice('');
        setNewServiceImage('');
        setNewServiceDesc('');
        setNewServiceDuration('');
        setNewServicePackage('');
        setNewServiceIsActive(true);
        setEditingServiceId(null);
      }
    } finally {
      setAddingService(false);
    }
  };

  // Delete Service handler
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Service Deleted', 'Service successfully deleted from catalog.');
        fetchAllData();
      } else {
        addNotification('Deletion Failed', data.message || 'Failed to delete service.');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to delete service.');
      } else {
        console.warn('Backend server offline. Simulating service delete locally...', err);
        setServices(prev => prev.filter(s => s.id !== serviceId));
        addNotification('Service Deleted', 'Service deleted locally (Sandbox mode).');
      }
    }
  };

  // Create or Update Coupon handler
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountType || !couponForm.discountValue) {
      addNotification('Validation Error', 'Please supply Code, Discount Type and Value.');
      return;
    }
    
    setSavingCoupon(true);
    const body = {
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      minOrderValue: parseFloat(couponForm.minOrderValue || '0'),
      maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
      usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
      expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
      isActive: couponForm.isActive
    };

    try {
      let res;
      if (couponForm.id) {
        res = await fetch(`/api/admin/coupons/${couponForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
      }
      const data = await res.json();
      if (data.success) {
        addNotification(couponForm.id ? 'Coupon Updated' : 'Coupon Created', `Coupon "${couponForm.code}" successfully saved.`);
        setCouponForm({
          id: null,
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          minOrderValue: '0',
          maxDiscount: '',
          usageLimit: '',
          expiresAt: '',
          isActive: true
        });
        fetchAllData();
      } else {
        addNotification('Save Failed', data.message || 'Failed to save coupon.');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to save coupon.');
      } else {
        console.warn('Backend server offline. Simulating coupon save locally...', err);
        const localCoupons = JSON.parse(localStorage.getItem('jk_sandbox_coupons') || '[]');
        if (couponForm.id) {
          const idx = localCoupons.findIndex(c => c.id === couponForm.id);
          const updatedCoupon = { ...body, id: couponForm.id, usedCount: 0 };
          if (idx > -1) {
            localCoupons[idx] = updatedCoupon;
          } else {
            localCoupons.push(updatedCoupon);
          }
          addNotification('Coupon Updated', `Coupon "${couponForm.code}" updated locally (Sandbox mode).`);
        } else {
          const newId = `cp-${Date.now()}`;
          const newCoupon = { ...body, id: newId, usedCount: 0 };
          localCoupons.push(newCoupon);
          addNotification('Coupon Created', `Coupon "${couponForm.code}" created locally (Sandbox mode).`);
        }
        localStorage.setItem('jk_sandbox_coupons', JSON.stringify(localCoupons));
        
        setCouponForm({
          id: null,
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          minOrderValue: '0',
          maxDiscount: '',
          usageLimit: '',
          expiresAt: '',
          isActive: true
        });
        setTimeout(() => fetchAllData(), 100);
      }
    } finally {
      setSavingCoupon(false);
    }
  };

  // Delete Coupon handler
  const handleDeleteCoupon = async (id, code) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        addNotification('Coupon Deleted', `Coupon ${code} has been deleted.`);
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to delete coupon.');
      } else {
        const localCoupons = JSON.parse(localStorage.getItem('jk_sandbox_coupons') || '[]');
        const updated = localCoupons.filter(c => c.id !== id);
        localStorage.setItem('jk_sandbox_coupons', JSON.stringify(updated));
        setCoupons(prev => prev.filter(c => c.id !== id));
        addNotification('Coupon Deleted', `Coupon ${code} deleted locally (Sandbox mode).`);
      }
    }
  };

  // Toggle Coupon Status
  const handleToggleCouponStatus = async (id, code, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: nextStatus })
      });
      if (res.ok) {
        addNotification(nextStatus ? 'Coupon Enabled' : 'Coupon Disabled', `Coupon ${code} status updated.`);
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to toggle coupon status.');
      } else {
        const localCoupons = JSON.parse(localStorage.getItem('jk_sandbox_coupons') || '[]');
        const idx = localCoupons.findIndex(c => c.id === id);
        if (idx > -1) {
          localCoupons[idx].isActive = nextStatus;
          localStorage.setItem('jk_sandbox_coupons', JSON.stringify(localCoupons));
        } else {
          const seedCoupon = coupons.find(c => c.id === id);
          if (seedCoupon) {
            localCoupons.push({ ...seedCoupon, isActive: nextStatus });
            localStorage.setItem('jk_sandbox_coupons', JSON.stringify(localCoupons));
          }
        }
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: nextStatus } : c));
        addNotification(nextStatus ? 'Coupon Enabled' : 'Coupon Disabled', `Coupon ${code} status updated locally (Sandbox mode).`);
      }
    }
  };

  // Load Sandbox fallback per tab
  const loadSandboxTab = (tab) => {
    if (import.meta.env.MODE === 'production') {
      setError('Database connection error. Service disruption active.');
      setAnalytics(null);
      return;
    }
    const mockServices = [
      { id: 's-1', name: 'Baby Care', category: 'Care', price: 799, durationText: '6 Hours', packageText: 'Daily Needs', description: 'Experienced baby care professionals.', imageUrl: '/services/babycare.jpg' },
      { id: 's-2', name: 'Full House Deep Cleaning', category: 'Cleaning', price: 3499, durationText: '', packageText: 'Deep Hygiene', description: 'Complete deep cleaning.', imageUrl: '/services/housecleaning.jpg' },
      { id: 's-3', name: 'Bathroom Deep Cleaning', category: 'Cleaning', price: 749, durationText: '', packageText: 'Premium Sanitation', description: 'Deep sanitation.', imageUrl: '/services/bathroom-cleaning.jpg' },
      { id: 's-4', name: 'Full Kitchen Cleaning', category: 'Cleaning', price: 499, durationText: '', packageText: 'Fresh Kitchen', description: 'Deep degreasing.', imageUrl: '/services/kitchen-cleaning.jpg' },
      { id: 's-5', name: 'Dust Cleaning', category: 'Cleaning', price: 149, durationText: '1 Hour', packageText: 'Quick Dusting', description: 'Dust removal.', imageUrl: '/services/dust-cleaning.jpg' },
      { id: 's-6', name: 'House Shifting', category: 'Shifting', price: 3499, durationText: '', packageText: '2BHK Package', description: 'Professional packing and moving.', imageUrl: '/services/house-shifting.jpg' },
      { id: 's-7', name: 'Cooking Service', category: 'Cooking', price: 149, durationText: '1 Hour', packageText: 'Meal Prep', description: 'Hygienic home-cooked meals.', imageUrl: '/services/cooking-service.jpg' },
      { id: 's-8', name: 'House Painting', category: 'Painting', price: 20099, durationText: '', packageText: 'All Materials Included', description: 'Wall painting.', imageUrl: '/services/house-painting.jpg' },
      { id: 's-9', name: 'Electrician Service', category: 'Technical', price: 499, durationText: '1 Hour', packageText: 'Essential Repairs', description: 'Electrical repairs.', imageUrl: '/services/electrician.jpg' },
      { id: 's-10', name: 'Security Provider', category: 'Care', price: 899, durationText: '8 Hours', packageText: 'Safe Protection', description: 'Vigilant security guards.', imageUrl: '/services/security-provider-v2.jpg' },
      { id: 's-11', name: 'Pest Control', category: 'Cleaning', price: 2599, durationText: '', packageText: '2BHK Package', description: 'Pest control treatment.', imageUrl: '/services/pest-control-v2.jpg' }
    ];

    const mockWorkers = [];

    const mockCustomers = [];

    const mockBookings = [];

    const mockCoupons = [];

    if (tab === 'dashboard') {
      const stats = {
        todayCount: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        activePartnersCount: 0,
        pendingApprovalsCount: 0,
        todayRev: 0,
        monthRev: 0,
        activeCouponsCount: 0,
        totalCouponsCount: 0
      };
      setAnalytics(stats);
      setWorkers(mockWorkers);
    } else if (tab === 'bookings') {
      setBookings(mockBookings);
    } else if (tab === 'customers') {
      setCustomers(mockCustomers);
    } else if (tab === 'services') {
      setServices(mockServices);
    } else if (tab === 'coupons') {
      setCoupons(mockCoupons);
    } else if (tab === 'audit-logs') {
      setBookings(mockBookings);
      setWorkers(mockWorkers);
      setCustomers(mockCustomers);
      setServices(mockServices);
      setCoupons(mockCoupons);
      
      const seedLogs = [];
      setAuditLogs(seedLogs);
    }
  };

  const fetchAuditLogs = async (page = 1, eventType = 'All', force = false) => {
    // If cache is present and we're not forcing refetch, load from cache
    const cacheKey = `audit_logs_${eventType}_page_${page}`;
    const cachedData = getCache(cacheKey);
    if (cachedData && !force) {
      setAuditLogs(cachedData.logs || []);
      setAuditPage(cachedData.page || 1);
      setAuditTotalPages(cachedData.totalPages || 1);
      setAuditTotalCount(cachedData.totalCount || 0);
      return;
    }

    setTabLoading(true);
    try {
      const url = `/api/admin/audit-logs?page=${page}&limit=50&eventType=${eventType}`;
      const res = await fetchWithRetry(url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
        setAuditPage(data.page || 1);
        setAuditTotalPages(data.totalPages || 1);
        setAuditTotalCount(data.totalCount || 0);
        setCache(cacheKey, {
          logs: data.logs || [],
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0
        });
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to retrieve audit logs.');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        setError('Database connection error. Unable to load audit logs.');
      } else {
        console.warn('Backend offline or error loading audit logs. Loading offline sandbox...', err);
        loadSandboxTab('audit-logs');
      }
    } finally {
      setTabLoading(false);
    }
  };

  const handleAuditSubTabChange = (subTabId) => {
    setAuditSubTab(subTabId);
    let filter = 'All';
    if (subTabId === 'logins') filter = 'LOGIN';
    else if (subTabId === 'registrations') filter = 'REGISTRATION';
    else if (subTabId === 'bookings') filter = 'BOOKING';
    else if (subTabId === 'payments') filter = 'PAYMENT';
    else if (subTabId === 'admin') filter = 'ADMIN';
    setAuditFilter(filter);
    setAuditPage(1);
  };

  // Real-time polling for audit logs (5 seconds interval when tab is active)
  useEffect(() => {
    let intervalId;
    if (activeTab === 'audit-logs') {
      fetchAuditLogs(auditPage, auditFilter, true);

      intervalId = setInterval(() => {
        const silentFetch = async () => {
          try {
            const url = `/api/admin/audit-logs?page=${auditPage}&limit=50&eventType=${auditFilter}`;
            const res = await fetchWithRetry(url, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
              setAuditLogs(data.logs || []);
              setAuditPage(data.page || 1);
              setAuditTotalPages(data.totalPages || 1);
              setAuditTotalCount(data.totalCount || 0);
            }
          } catch (err) {
            console.warn('Silent audit log polling failed:', err.message);
          }
        };
        silentFetch();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, auditPage, auditFilter]);

  // Fetch page specific data
  const fetchTabSpecificData = async (tab, forceRefetch = false) => {
    // If it's one of the extracted tabs, they handle their own data loading
    if (['analytics', 'payments', 'partner-approvals'].includes(tab)) {
      setTabLoading(false);
      setLoading(false);
      return;
    }

    const cached = getCache(`tab_${tab}`);
    if (cached && !forceRefetch) {
      if (tab === 'dashboard') {
        setAnalytics(cached.analytics);
        setWorkers(cached.workers);
      } else if (tab === 'bookings') {
        setBookings(cached);
      } else if (tab === 'customers') {
        setCustomers(cached);
      } else if (tab === 'services') {
        setServices(cached);
      } else if (tab === 'coupons') {
        setCoupons(cached);
      } else if (tab === 'audit-logs') {
        // Handled by dedicated useEffect and state
      }
      setTabLoading(false);
      setLoading(false);
      return;
    }

    setTabLoading(true);
    setError(null);

    try {
      if (tab === 'dashboard') {
        const [analyticsRes, workersRes] = await Promise.all([
          fetchWithRetry('/api/admin/analytics', { credentials: 'include' }),
          fetchWithRetry('/api/admin/workers?status=PENDING', { credentials: 'include' })
        ]);
        
        const analyticsData = await analyticsRes.json();
        const workersData = await workersRes.json();
        if (analyticsData.success && workersData.success) {
          const stats = analyticsData.analytics;
          const pendingList = workersData.workers || [];
          setAnalytics(stats);
          setWorkers(pendingList);
          setCache(`tab_dashboard`, { analytics: stats, workers: pendingList });
        } else {
          throw new Error('Failed to retrieve dashboard analytics');
        }
      } else if (tab === 'bookings') {
        const [bookingsRes, partnersRes] = await Promise.all([
          fetchWithRetry('/api/admin/bookings', { credentials: 'include' }),
          fetchWithRetry('/api/admin/partners', { credentials: 'include' }).catch(() => null)
        ]);
        const bookingsData = await bookingsRes.json();
        const partnersData = partnersRes ? await partnersRes.json() : { success: false };
        if (bookingsData.success) {
          setBookings(bookingsData.bookings || []);
          setCache(`tab_bookings`, bookingsData.bookings || []);
          if (partnersData.success) {
            setPartners(partnersData.partners || []);
          }
        } else {
          throw new Error('Failed to retrieve bookings.');
        }
      } else if (tab === 'partners') {
        const res = await fetchWithRetry('/api/admin/partners', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setPartners(data.partners || []);
          setCache(`tab_partners`, data.partners || []);
        } else {
          throw new Error('Failed to retrieve service partners.');
        }
      } else if (tab === 'customers') {
        const res = await fetchWithRetry('/api/admin/customers', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setCustomers(data.customers || []);
          setCache(`tab_customers`, data.customers || []);
        } else {
          throw new Error('Failed to retrieve customers.');
        }
      } else if (tab === 'services') {
        const res = await fetchWithRetry('/api/admin/services', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setServices(data.services || []);
          setCache(`tab_services`, data.services || []);
        } else {
          throw new Error('Failed to retrieve services.');
        }
      } else if (tab === 'coupons') {
        const res = await fetchWithRetry('/api/admin/coupons', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setCoupons(data.coupons || []);
          setCache(`tab_coupons`, data.coupons || []);
        } else {
          throw new Error('Failed to retrieve coupons.');
        }
      } else if (tab === 'audit-logs') {
        // Run background dashboard sync to populate other collections silently
        fetchWithRetry('/api/admin/dashboard-data', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setBookings(data.bookings || []);
              setCustomers(data.customers || []);
              setServices(data.services || []);
              setCoupons(data.coupons || []);
            }
          }).catch(err => console.warn('Background dashboard data sync failed:', err.message));
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        setError('Database connection error. Unable to connect to the database.');
        setAnalytics(null);
      } else {
        console.warn('Backend server offline. Simulating local Sandbox metrics...', err);
        loadSandboxTab(tab);
        setError(err.message || 'Unable to connect to service registry.');
      }
    } finally {
      setTabLoading(false);
      setLoading(false);
    }
  };

  const fetchAllData = () => {
    // Clear all caches
    clearCache();
    // Force sync audit logs if tab is active
    if (activeTab === 'audit-logs') {
      fetchAuditLogs(auditPage, auditFilter, true);
    }
    fetchTabSpecificData(activeTab, true);
  };

  useEffect(() => {
    fetchTabSpecificData(activeTab);
  }, [activeTab]);


  // watch notifications for real-time toasts
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const isInitial = seenNotificationIds.current.size === 0;
    
    notifications.forEach(n => {
      if (!seenNotificationIds.current.has(n.id)) {
        seenNotificationIds.current.add(n.id);
        if (!isInitial && !n.isRead) {
          showAdminToast(n.title, n.message);
        }
      }
    });
  }, [notifications]);

  // Actions
  const handleApprovePartner = async (id) => {
    try {
      const res = await fetch(`/api/admin/workers/${id}/approve`, { 
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        addNotification('Partner Approved', 'Service partner approved successfully and registered.');
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to approve partner.');
      } else {
        setWorkers(prev => {
          const updated = prev.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w);
          const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
          const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'APPROVED' } : w);
          localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
          return updated;
        });
        addNotification('Partner Approved', 'Service partner approved successfully (Sandbox mode).');
      }
    }
    setSelectedWorker(null);
  };

  const handleRejectPartner = async (id) => {
    const reason = prompt('Please enter the reason for rejecting this application:', 'Document details mismatch.');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/workers/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        addNotification('Application Rejected', `Partner rejected. Reason: ${reason}`);
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to reject partner.');
      } else {
        setWorkers(prev => {
          const updated = prev.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED', availability: reason } : w);
          const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
          const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'REJECTED', availability: reason } : w);
          localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
          return updated;
        });
        addNotification('Application Rejected', `Partner rejected (Sandbox mode). Reason: ${reason}`);
      }
    }
    setSelectedWorker(null);
  };

  const handleMoveToReview = async (id) => {
    try {
      const res = await fetch(`/api/admin/workers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'UNDER_REVIEW' })
      });
      if (res.ok) {
        addNotification('Status Updated', 'Application status moved to Under Review.');
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to change status.');
      } else {
        setWorkers(prev => {
          const updated = prev.map(w => w.id === id ? { ...w, approvalStatus: 'UNDER_REVIEW' } : w);
          const localWorkers = JSON.parse(localStorage.getItem('jk_sandbox_workers') || '[]');
          const updatedLocal = localWorkers.map(w => w.id === id ? { ...w, approvalStatus: 'UNDER_REVIEW' } : w);
          localStorage.setItem('jk_sandbox_workers', JSON.stringify(updatedLocal));
          return updated;
        });
        addNotification('Status Updated', 'Application status moved to Under Review (Sandbox mode).');
      }
    }
    setSelectedWorker(null);
  };

  const handleAssignPartner = async (bookingId, partnerId, partnerName, partnerMobile) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ partnerId, partnerName, partnerMobile })
      });
      if (res.ok) {
        const data = await res.json();
        addNotification('Partner Assigned', 'Service partner successfully assigned.');
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(data.booking || { ...selectedBooking, partnerId, partnerName, partnerMobile, status: 'ASSIGNED' });
        }
        fetchAllData();
      } else {
        const data = await res.json();
        addNotification('Operation Failed', data.message || 'Unable to assign partner.');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to assign partner.');
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, partnerId, partnerName, partnerMobile, status: 'ASSIGNED' } : b));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, partnerId, partnerName, partnerMobile, status: 'ASSIGNED' });
        }
        addNotification('Partner Assigned', 'Service partner successfully assigned (Sandbox mode).');
      }
    }
  };

  const handlePartnerFormSubmit = async (e) => {
    e.preventDefault();
    if (!partnerFormName || !partnerFormPhone || !partnerFormServiceType) {
      addNotification('Validation Error', 'Please fill in all fields.');
      return;
    }
    const payload = {
      name: partnerFormName,
      phone: partnerFormPhone,
      serviceType: partnerFormServiceType,
      status: partnerFormStatus
    };
    try {
      const url = editingPartnerId ? `/api/admin/partners/${editingPartnerId}` : '/api/admin/partners';
      const method = editingPartnerId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Success', data.message || 'Service partner saved successfully.');
        setIsPartnerModalOpen(false);
        fetchTabSpecificData('partners', true);
      } else {
        addNotification('Operation Failed', data.message || 'Unable to save partner.');
      }
    } catch (err) {
      addNotification('Operation Failed', 'Database connection error.');
    }
  };

  const handleChangeBookingStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addNotification('Status Updated', `Booking status changed to ${status}.`);
        fetchAllData();
      }
    } catch (err) {
      if (import.meta.env.MODE === 'production') {
        addNotification('Operation Failed', 'Database connection error. Unable to update booking status.');
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
        addNotification('Status Updated', `Booking status changed to ${status} (Sandbox mode).`);
      }
    }
  };

  // Helper selectors
  const parseJson = (str, fallback = {}) => {
    try { 
      if (!str) return fallback;
      return JSON.parse(str) || fallback; 
    } catch (e) { return fallback; }
  };

  // Dashboard Stats Calculations
  const getDashboardStats = () => {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayBookings = bookings.filter(b => new Date(b.createdAt).toDateString() === today);
    const pendingBookings = bookings.filter(b => ['PENDING', 'NEW'].includes(b.status.toUpperCase()));
    const completedBookings = bookings.filter(b => b.status.toUpperCase() === 'COMPLETED');
    const cancelledBookings = bookings.filter(b => b.status.toUpperCase() === 'CANCELLED');
    
    const activePartners = workers.filter(w => w.approvalStatus === 'APPROVED');
    const pendingApprovals = workers.filter(w => w.approvalStatus === 'PENDING');
    
    const activeCoupons = coupons.filter(c => c.isActive);

    const todayRevenue = bookings
      .filter(b => (b.paymentStatus === 'PAID' || b.payment_status === 'Paid') && new Date(b.createdAt).toDateString() === today)
      .reduce((sum, b) => sum + (b.finalPrice || b.amount || 0), 0);

    const monthRevenue = bookings
      .filter(b => (b.paymentStatus === 'PAID' || b.payment_status === 'Paid') && new Date(b.createdAt).getMonth() === currentMonth && new Date(b.createdAt).getFullYear() === currentYear)
      .reduce((sum, b) => sum + (b.finalPrice || b.amount || 0), 0);

    const preferAnalytics = activeTab === 'dashboard';

    return {
      todayCount: preferAnalytics ? (analytics?.todayCount || 0) : todayBookings.length,
      pendingCount: preferAnalytics ? (analytics?.pendingCount || 0) : pendingBookings.length,
      completedCount: preferAnalytics ? (analytics?.completedCount || 0) : completedBookings.length,
      cancelledCount: preferAnalytics ? (analytics?.cancelledCount || 0) : cancelledBookings.length,
      activePartnersCount: preferAnalytics ? (analytics?.activePartnersCount || 0) : activePartners.length,
      pendingApprovalsCount: preferAnalytics ? (analytics?.pendingApprovalsCount || 0) : pendingApprovals.length,
      todayRev: preferAnalytics ? (analytics?.todayRev || 0) : todayRevenue,
      monthRev: preferAnalytics ? (analytics?.monthRev || 0) : monthRevenue,
      activeCouponsCount: preferAnalytics ? (analytics?.activeCouponsCount || 0) : activeCoupons.length,
      totalCouponsCount: preferAnalytics ? (analytics?.totalCouponsCount || 0) : coupons.length
    };
  };

  const stats = getDashboardStats();

  // Filter lists based on Search & Tabs
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.user?.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || b.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const pendingWorkers = workers.filter(w => ['PENDING', 'UNDER_REVIEW'].includes(w.approvalStatus));



  // Service Analytics
  const getServiceAnalytics = () => {
    const serviceCounts = {};
    bookings.forEach(b => {
      if (b.items) {
        b.items.forEach(item => {
          const sName = item.service?.name || 'Uncategorized';
          if (!serviceCounts[sName]) {
            serviceCounts[sName] = { count: 0, revenue: 0 };
          }
          serviceCounts[sName].count += item.quantity;
          serviceCounts[sName].revenue += item.price * item.quantity;
        });
      }
    });

    return Object.keys(serviceCounts).map(name => ({
      name,
      count: serviceCounts[name].count,
      revenue: serviceCounts[name].revenue
    })).sort((a, b) => b.count - a.count);
  };

  const serviceAnalytics = getServiceAnalytics();



  // Customer Management Data
  const getCustomerManagement = () => {
    return customers.map(c => {
      const lastBookingText = c.lastBooking ? new Date(c.lastBooking).toLocaleDateString() : 'No bookings yet';
      return {
        ...c,
        bookingsCount: c.bookingsCount || 0,
        lastBooking: lastBookingText
      };
    });
  };

  const customerList = getCustomerManagement();

  // Open Verification Drawer
  const openVerificationDrawer = (worker) => {
    setSelectedWorker(worker);
    setChecklist({
      identity: false,
      experience: false,
      mobile: false,
      area: false,
      documents: false,
      bank: false
    });
  };

  const isDocumentUploaded = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (url.startsWith('http') && url.includes('supabase.co')) {
      return true;
    }
    return !lower.includes('unsplash.com') && 
           !lower.includes('sample') && 
           url !== 'profile.jpg' && 
           url !== 'selfie.jpg' && 
           url !== 'profile' && 
           url !== 'selfie' && 
           url !== 'aadhaar_front' && 
           url !== 'aadhaar_back' && 
           url !== 'aadhaar';
  };

  // Render Premium Document Previewer Guard (Prevents ALL fake/mock placeholder files)
  const renderDocumentPreview = (title, base64Data) => {
    const isUploaded = isDocumentUploaded(base64Data);

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h5 className="font-bold text-xs text-slate-800">{title}</h5>
            <span className="text-[10px] text-slate-400">Uploaded on registration</span>
          </div>
          {isUploaded ? (
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Uploaded
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Image Not Available
            </span>
          )}
        </div>

        {isUploaded ? (
          <div className="space-y-3">
            <div className="h-40 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative p-2 shadow-inner">
              <img src={base64Data} alt={title} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  const w = window.open();
                  w.document.write(`<img src="${base64Data}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                }}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Maximize2 className="w-3 h-3 text-slate-500" />
                <span>Open Fullscreen</span>
              </button>
              <a 
                href={base64Data} 
                download={`${title.replace(' ', '_')}.png`}
                className="flex-1 bg-brand/10 hover:bg-brand/20 text-brand font-extrabold text-[9px] uppercase py-2 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3 h-3 text-brand" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
            <span className="text-xs text-slate-400 font-medium">Image Not Available</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-inter">
      
      {/* ==================== MOBILE SIDEBAR DRAWER ==================== */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 lg:hidden flex flex-col justify-between py-6 px-4 shadow-2xl border-r border-slate-200"
            >
              <div>
                {/* Brand Logo & Close Button */}
                <div className="px-2 mb-8 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-brand w-9 h-9 rounded-xl flex items-center justify-center font-poppins font-black text-white text-lg shadow-md shadow-brand/20">JK</div>
                    <div>
                      <h1 className="font-poppins font-black text-sm tracking-tight leading-none text-slate-800">JK ENTERPRISES</h1>
                      <span className="text-[9px] font-black text-brand tracking-widest uppercase">Admin Mobile</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: Grid },
                    { id: 'audit-logs', label: 'Audit Center', icon: ShieldCheck },
                    { id: 'bookings', label: 'Bookings', icon: Calendar },
                    { id: 'customers', label: 'Customers', icon: Award },
                    { id: 'partners', label: 'Service Partners', icon: Users },
                    { id: 'payments', label: 'Payments', icon: Landmark },
                    { id: 'services', label: 'Services', icon: Layers },
                    { id: 'coupons', label: 'Coupons', icon: Percent },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                    { id: 'settings', label: 'Settings', icon: Settings }
                  ].map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                          const newPath = item.id === 'dashboard' ? '/admin' : `/admin/${item.id === 'partner-approvals' ? 'workers' : item.id === 'services' ? 'services' : item.id === 'bookings' ? 'bookings' : item.id}`;
                          window.history.pushState(null, '', newPath);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isActive 
                            ? 'bg-brand text-white shadow-md shadow-brand/10' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="px-2 border-t border-slate-100 pt-4 flex flex-col space-y-3.5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">AD</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">System Admin</h4>
                    <p className="text-[9px] text-slate-400">Mobile Panel</p>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[10px] uppercase py-2.5 rounded-xl tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout Account</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen flex-col justify-between py-6 shadow-sm">
        <div>
          {/* Brand Logo */}
          <div className="px-6 mb-8 flex items-center space-x-3">
            <div className="bg-brand w-9 h-9 rounded-xl flex items-center justify-center font-poppins font-black text-white text-lg shadow-md shadow-brand/20">JK</div>
            <div>
              <h1 className="font-poppins font-black text-sm tracking-tight leading-none text-slate-800">JK ENTERPRISES</h1>
              <span className="text-[9px] font-black text-brand tracking-widest uppercase">Admin Command</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Grid },
              { id: 'audit-logs', label: 'Audit Center', icon: ShieldCheck },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'customers', label: 'Customers', icon: Award },
              { id: 'partners', label: 'Service Partners', icon: Users },
              { id: 'payments', label: 'Payments', icon: Landmark },
              { id: 'services', label: 'Services', icon: Layers },
              { id: 'coupons', label: 'Coupons', icon: Percent },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    const newPath = item.id === 'dashboard' ? '/admin' : `/admin/${item.id === 'partner-approvals' ? 'workers' : item.id === 'services' ? 'services' : item.id === 'bookings' ? 'bookings' : item.id}`;
                    window.history.pushState(null, '', newPath);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive 
                      ? 'bg-brand text-white shadow-md shadow-brand/10' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                    }`}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info footer */}
        <div className="px-6 border-t border-slate-100 pt-4 flex flex-col space-y-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">AD</div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Administrator</h4>
              <p className="text-[9px] text-slate-400">Administrator Mode</p>
            </div>
          </div>

          {/* Sidebar Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[10px] uppercase py-2.5 rounded-xl tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
 
      {/* ==================== MAIN PANEL CONTENT ==================== */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Header bar */}
        <header className="h-16 border-b border-slate-200/60 bg-white sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200/50 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications && notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800">Notifications ({notifications.filter(n => !n.isRead).length} unread)</span>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <button 
                            onClick={() => {
                              notifications.forEach(n => {
                                if (!n.isRead) markAsRead(n.id);
                              });
                            }}
                            className="text-[10px] text-brand hover:underline font-bold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications && notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className={`p-4 text-left transition-colors ${n.isRead ? 'bg-white' : 'bg-slate-50/70'}`}>
                              <div className="flex justify-between items-start">
                                <h4 className={`text-xs font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                                {!n.isRead && (
                                  <button 
                                    onClick={() => markAsRead(n.id)}
                                    className="text-[9px] text-brand font-bold hover:underline"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal">{n.message}</p>
                              <span className="text-[8px] text-slate-400 mt-1.5 block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No notifications yet
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleLogout} 
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[10px] uppercase px-4 py-2.5 rounded-xl tracking-wider transition-all shadow-sm flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <div className="p-8 flex-1">
          {tabLoading ? (
            activeTab === 'dashboard' || activeTab === 'analytics' ? (
              <AnalyticsSkeleton />
            ) : activeTab === 'payments' ? (
              <TableSkeleton cols={6} rows={5} />
            ) : activeTab === 'partner-approvals' || activeTab === 'partners' ? (
              <TableSkeleton cols={7} rows={6} />
            ) : (
              <TableSkeleton cols={5} rows={5} />
            )
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center space-y-3 my-12 max-w-md mx-auto animate-fade-up">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Unable to load data</h3>
              <p className="text-xs text-slate-500">{error}</p>
              <button 
                onClick={() => fetchTabSpecificData(activeTab, true)} 
                className="bg-brand hover:bg-brand-dark text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl transition-all shadow-md shadow-brand/10 mt-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >

                {/* ==================== TAB 1: TODAY OVERVIEW ==================== */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-800">Today Overview</h2>
                        <p className="text-xs text-slate-400 mt-1">Live business ledger for {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Stats Metric Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      
                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Today's Revenue</span>
                          <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">Rs. {stats.todayRev.toLocaleString()}</span>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">This Month Revenue</span>
                          <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">Rs. {stats.monthRev.toLocaleString()}</span>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Today's Bookings</span>
                          <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">{stats.todayCount}</span>
                        </div>
                        <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pending Bookings</span>
                          <span className="font-poppins font-black text-xl text-amber-600 mt-1 block">{stats.pendingCount}</span>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Bookings</span>
                          <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">{stats.completedCount}</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Cancelled Bookings</span>
                          <span className="font-poppins font-black text-xl text-rose-600 mt-1 block">{stats.cancelledCount}</span>
                        </div>
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setActiveTab('customers')}>
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Customers</span>
                          <span className="font-poppins font-black text-xl text-slate-800 mt-1 block">{customerList.length}</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center"><Award className="w-5 h-5" /></div>
                      </div>

                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setActiveTab('coupons')}>
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Coupons</span>
                          <span className="font-poppins font-black text-xl text-brand mt-1 block">{stats.activeCouponsCount} / {stats.totalCouponsCount}</span>
                        </div>
                        <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Percent className="w-5 h-5" /></div>
                      </div>

                    </div>

                    {/* Operational Quick list */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      
                      {/* Recent Bookings dispatch view */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-poppins font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                            <span>Live Bookings Timeline</span>
                          </h3>
                          <button onClick={() => setActiveTab('bookings')} className="text-brand text-xs font-bold hover:underline">View All</button>
                        </div>
                        
                        <div className="space-y-3">
                          {bookings.slice(0, 4).map(b => (
                            <div key={b.id} className="bg-slate-50 border border-slate-200/40 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-mono text-slate-500 font-bold">{b.id.substring(0,8)}</span>
                                  <span className="text-[10px] bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded uppercase">{b.status}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 mt-1">{b.items?.[0]?.service?.name || 'Home Service'}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{b.user?.name} • {b.address?.split(',')[1] || 'Anchepalya'}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-800 block">Rs. {b.finalPrice}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(b.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))}
                          {bookings.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No bookings yet</p>}
                        </div>
                      </div>
                      {/* Recent Customers / Registrations view */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-poppins font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                            <span>Recent Registrations</span>
                          </h3>
                          <button onClick={() => setActiveTab('customers')} className="text-brand text-xs font-bold hover:underline">View All</button>
                        </div>

                        <div className="space-y-3">
                          {customerList.slice(0, 4).map(c => (
                            <div key={c.id} className="bg-slate-50 border border-slate-200/40 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{c.email} • {c.phone}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                          {customerList.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-8">No Customers Registered</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ==================== TAB 1.5: SYSTEM AUDIT CENTER LEDGER ==================== */}
                {activeTab === 'audit-logs' && (
                  <div className="space-y-6 animate-fade-in text-slate-800">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-850 flex items-center space-x-2">
                          <ShieldCheck className="w-6 h-6 text-brand" />
                          <span>Admin Audit Center</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Real-time ledger audit log of all database events and business metrics</p>
                      </div>
                      
                      {/* Refresh Button */}
                      <button 
                        onClick={fetchAllData}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 self-end"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-brand" />
                        <span>Force Sync DB</span>
                      </button>
                    </div>

                    {/* Operational Sub-Tabs Bar */}
                    <div className="flex overflow-x-auto flex-nowrap gap-2 pb-2 border-b border-slate-100 scrollbar-hide">
                      {[
                        { id: 'feed', label: '🔔 Live Activity Feed' },
                        { id: 'logins', label: '📋 Recent Logins' },
                        { id: 'registrations', label: '🔑 Registrations' },
                        { id: 'bookings', label: '📦 Booking Activity' },
                        { id: 'payments', label: '💰 Payment Activity' },
                        { id: 'admin', label: '🛡️ Admin Actions' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => handleAuditSubTabChange(tab.id)}
                          className={`px-4 py-2.5 rounded-xl font-poppins font-bold text-xs transition-all flex-shrink-0 ${
                            auditSubTab === tab.id
                              ? 'bg-brand text-white shadow-md shadow-brand/10'
                              : 'bg-white text-slate-600 hover:bg-slate-100/60 border border-slate-200/50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Contents */}
                    {tabLoading ? (
                      <TableSkeleton cols={6} rows={6} />
                    ) : (
                      <div className="space-y-4">
                        {/* 1. Live Activity Feed */}
                        {auditSubTab === 'feed' && (
                          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="font-poppins font-extrabold text-sm text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                              <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                              <span>Real-Time Business Activity Ledger Feed</span>
                            </h3>

                            <div className="relative border-l border-slate-200 pl-6 space-y-6 ml-3 py-2">
                              {liveActivityFeed.map((item, idx) => (
                                <div key={item.id || idx} className="relative group">
                                  {/* Timeline dot */}
                                  <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[8px] group-hover:scale-110 transition-transform shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  </span>

                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                    <div className="flex flex-col">
                                      <div className="flex items-center space-x-2.5">
                                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.color}`}>
                                          {item.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 font-poppins">{item.text}</span>
                                      </div>
                                      <div className="flex items-center space-x-2.5 mt-1 text-[9px] text-slate-400 font-mono pl-1">
                                        {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                                        {item.userAgent && <span className="truncate max-w-[200px] sm:max-w-[350px]">UA: {item.userAgent}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {item.timestamp.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {liveActivityFeed.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-10 font-poppins">No real activity events found in database ledger.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Recent Logins */}
                        {auditSubTab === 'logins' && (
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-4">User Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Login Time</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Device / User Agent</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {auditLogs.map(log => {
                                    const details = log.details ? JSON.parse(log.details) : {};
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-800">{log.userName || log.user?.name || 'Guest/System'}</td>
                                        <td className="p-4 font-mono text-slate-500">{log.userEmail || log.user?.email || details.email || 'N/A'}</td>
                                        <td className="p-4">
                                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                            (log.userRole || log.user?.role) === 'ADMIN' ? 'bg-red-50 text-red-700' : (log.userRole || log.user?.role) === 'WORKER' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'
                                          }`}>
                                            {log.userRole || log.user?.role || details.role || 'USER'}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                        <td className="p-4 font-mono text-slate-400 truncate max-w-[200px]" title={log.userAgent || 'N/A'}>{log.userAgent || 'N/A'}</td>
                                      </tr>
                                    );
                                  })}
                                  {auditLogs.length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="text-center py-10 text-slate-405 font-poppins">No real login records available.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 3. Registrations */}
                        {auditSubTab === 'registrations' && (
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-4">User Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Registration Time</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Device / User Agent</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {auditLogs.map(log => {
                                    const details = log.details ? JSON.parse(log.details) : {};
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-800">{log.userName || log.user?.name || 'Guest/System'}</td>
                                        <td className="p-4 font-mono text-slate-500">{log.userEmail || log.user?.email || details.email || 'N/A'}</td>
                                        <td className="p-4">
                                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                            (log.userRole || log.user?.role) === 'ADMIN' ? 'bg-red-50 text-red-700' : (log.userRole || log.user?.role) === 'WORKER' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'
                                          }`}>
                                            {log.userRole || log.user?.role || details.role || 'USER'}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                        <td className="p-4 font-mono text-slate-400 truncate max-w-[200px]" title={log.userAgent || 'N/A'}>{log.userAgent || 'N/A'}</td>
                                      </tr>
                                    );
                                  })}
                                  {auditLogs.length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="text-center py-10 text-slate-405 font-poppins">No real registration records available.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 4. Booking Activity */}
                        {auditSubTab === 'bookings' && (
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-4">Log ID</th>
                                    <th className="p-4">Actor</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Activity details</th>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">IP Address</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {auditLogs.map(log => {
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono font-bold text-brand">{log.id.substring(0,8).toUpperCase()}</td>
                                        <td className="p-4 font-bold text-slate-800">{log.userName || log.user?.name || 'System'}</td>
                                        <td className="p-4">
                                          <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-50 text-cyan-700">
                                            {log.action.replace(/_/g, ' ')}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-600 font-semibold">{formatLogDetails(log)}</td>
                                        <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                      </tr>
                                    );
                                  })}
                                  {auditLogs.length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="text-center py-10 text-slate-405 font-poppins">No real booking events found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 5. Payment Activity */}
                        {auditSubTab === 'payments' && (
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-4">Log ID</th>
                                    <th className="p-4">Actor</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Activity details</th>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">IP Address</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {auditLogs.map(log => {
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono font-bold text-slate-500">{log.id.substring(0,8).toUpperCase()}</td>
                                        <td className="p-4 font-bold text-slate-800">{log.userName || log.user?.name || 'System'}</td>
                                        <td className="p-4">
                                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                            log.action === 'PAYMENT_SUCCESS' ? 'bg-emerald-55 bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                          }`}>
                                            {log.action.replace(/_/g, ' ')}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-600 font-semibold">{formatLogDetails(log)}</td>
                                        <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                      </tr>
                                    );
                                  })}
                                  {auditLogs.length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="text-center py-10 text-slate-405 font-poppins">No real payment events found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 6. Admin Actions */}
                        {auditSubTab === 'admin' && (
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="p-4">Log ID</th>
                                    <th className="p-4">Admin Name</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Activity details</th>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">IP Address</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  {auditLogs.map(log => {
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono font-bold text-slate-500">{log.id.substring(0,8).toUpperCase()}</td>
                                        <td className="p-4 font-bold text-slate-800">{log.userName || log.user?.name || 'Admin'}</td>
                                        <td className="p-4">
                                          <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                            {log.action.replace(/_/g, ' ')}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-600 font-semibold">{formatLogDetails(log)}</td>
                                        <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                                      </tr>
                                    );
                                  })}
                                  {auditLogs.length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="text-center py-10 text-slate-405 font-poppins">No real admin action logs found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {auditTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-xs mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <button
                            onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                            disabled={auditPage === 1}
                            className={`relative inline-flex items-center rounded-xl border border-slate-350 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all ${
                              auditPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setAuditPage(prev => Math.min(prev + 1, auditTotalPages))}
                            disabled={auditPage === auditTotalPages}
                            className={`relative ml-3 inline-flex items-center rounded-xl border border-slate-350 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all ${
                              auditPage === auditTotalPages ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium font-poppins">
                              Showing <span className="font-extrabold text-slate-800">{(auditPage - 1) * 50 + 1}</span> to{' '}
                              <span className="font-extrabold text-slate-800">
                                {Math.min(auditPage * 50, auditTotalCount)}
                              </span>{' '}
                              of <span className="font-extrabold text-slate-800">{auditTotalCount}</span> records
                            </p>
                          </div>
                          <div>
                            <nav className="isolate inline-flex -space-x-px rounded-xl shadow-xs" aria-label="Pagination">
                              <button
                                onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                                disabled={auditPage === 1}
                                className={`relative inline-flex items-center rounded-l-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 focus:z-20 transition-all ${
                                  auditPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Previous
                              </button>
                              <span className="relative inline-flex items-center border-y border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-black text-slate-700 font-poppins">
                                Page {auditPage} of {auditTotalPages}
                              </span>
                              <button
                                onClick={() => setAuditPage(prev => Math.min(prev + 1, auditTotalPages))}
                                disabled={auditPage === auditTotalPages}
                                className={`relative inline-flex items-center rounded-r-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 focus:z-20 transition-all ${
                                  auditPage === auditTotalPages ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* ==================== TAB 3: BOOKINGS MANAGEMENT ==================== */}
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-800">Bookings Management</h2>
                        <p className="text-xs text-slate-400 mt-1">Track, dispatch, and modify client home service bookings</p>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-2.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search client or RefID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 w-48 focus:outline-none focus:border-brand transition-all"
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold text-slate-500 focus:outline-none"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="PENDING">New/Pending</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="ON_THE_WAY">On The Way</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-4">Booking ID</th>
                              <th className="p-4">Customer Name</th>
                              <th className="p-4">Mobile</th>
                              <th className="p-4">Service</th>
                              <th className="p-4">Area</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Payment Status</th>
                              <th className="p-4">Booking Status</th>
                              <th className="p-4">Date</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {filteredBookings.map(b => (
                              <tr key={b.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-brand">{b.id.startsWith('JK-') ? b.id : b.id.substring(0,8).toUpperCase()}</td>
                                <td className="p-4 font-bold text-slate-800">{b.customer_name || b.user?.name || 'Customer'}</td>
                                <td className="p-4 font-mono">{b.phone || b.user?.phone || 'N/A'}</td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-800">
                                    {b.service_name || b.items?.[0]?.service?.name || 'General Service'}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500">{b.area || b.address?.split(',')?.[1] || 'Anchepalya'}</td>
                                <td className="p-4 font-extrabold text-slate-800">₹{b.amount || b.finalPrice}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                    (b.payment_status || b.paymentStatus) === 'Paid' || (b.payment_status || b.paymentStatus) === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    (b.payment_status || b.paymentStatus) === 'Refunded' || (b.payment_status || b.paymentStatus) === 'REFUNDED' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                                    (b.payment_status || b.paymentStatus) === 'Failed' || (b.payment_status || b.paymentStatus) === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    'bg-amber-50 text-amber-700 border border-amber-250/50'
                                  }`}>
                                    {b.payment_status || b.paymentStatus || 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={b.status}
                                    onChange={async (e) => {
                                      const nextStatus = e.target.value;
                                      if (nextStatus === 'ASSIGNED') {
                                        setAssignModalBookingId(b.id);
                                        setAssignModalPartnerName(b.partnerName || '');
                                        setAssignModalPartnerMobile(b.partnerMobile || '');
                                        setAssignModalOpen(true);
                                      } else {
                                        await handleChangeBookingStatus(b.id, nextStatus);
                                        setBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: nextStatus, booking_status: nextStatus } : item));
                                      }
                                    }}
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider focus:outline-none border border-slate-200/50 cursor-pointer ${
                                      b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-750' :
                                      b.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-750' :
                                      b.status === 'ON_THE_WAY' ? 'bg-blue-50 text-blue-750' :
                                      'bg-cyan-50 text-cyan-750'
                                    }`}
                                  >
                                    <option value="PENDING">New Booking</option>
                                    <option value="ASSIGNED">Assigned</option>
                                    <option value="ON_THE_WAY">On The Way</option>
                                    <option value="CANCELLED">Cancelled</option>
                                  </select>
                                </td>
                                <td className="p-4">
                                  <div className="text-slate-700">{new Date(b.created_at || b.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 text-right space-x-1 shrink-0">
                                  <button 
                                    onClick={() => setSelectedBooking(b)}
                                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase px-2 py-1.5 rounded-lg transition-all shadow-sm"
                                  >
                                    Details
                                  </button>
                                  <a href={`tel:${b.phone || b.user?.phone}`} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-[9px] uppercase px-2 py-1.5 rounded-lg inline-block shadow-sm">Call Cust</a>
                                </td>
                              </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                              <tr>
                                <td colSpan="10" className="p-8 text-center text-slate-400 font-medium">No bookings yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                    )}

                {/* ==================== TAB 5: CUSTOMER MANAGEMENT ==================== */}
                {activeTab === 'customers' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-poppins font-black text-2xl text-slate-800">Customer Management</h2>
                      <p className="text-xs text-slate-400 mt-1">Manage platform clients and review their request histories</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-4">Customer Name</th>
                              <th className="p-4">Phone Number</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Area Coverage</th>
                              <th className="p-4">Bookings Count</th>
                              <th className="p-4">Last Booking Date</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {customerList.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-800">{c.name}</td>
                                <td className="p-4 font-mono">{c.phone}</td>
                                <td className="p-4 text-slate-500">{c.email}</td>
                                <td className="p-4 text-slate-500">{c.serviceArea || 'Anchepalya'}</td>
                                <td className="p-4 font-bold text-brand">{c.bookingsCount}</td>
                                <td className="p-4 text-slate-500">{c.lastBooking}</td>
                                <td className="p-4 text-right space-x-2">
                                  <button 
                                    onClick={() => setSelectedCustomer(c)}
                                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                  >
                                    View History
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {customerList.length === 0 && (
                              <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No customers registered yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== TAB 5.5: SERVICE PARTNER MANAGEMENT ==================== */}
                {activeTab === 'partners' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-800 text-left">Service Partners Registry</h2>
                        <p className="text-xs text-slate-400 mt-1 text-left font-semibold">Onboard and manage trained home care professionals and dispatch status</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setEditingPartnerId(null);
                          setPartnerFormName('');
                          setPartnerFormPhone('');
                          setPartnerFormServiceType('Cleaning');
                          setPartnerFormStatus('AVAILABLE');
                          setIsPartnerModalOpen(true);
                        }}
                        className="bg-brand hover:bg-brand-dark text-white font-extrabold text-[10.5px] uppercase px-5 py-3 rounded-xl transition-all shadow-md shadow-brand/10 flex items-center space-x-1.5 self-start cursor-pointer animate-transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Onboard New Partner</span>
                      </button>
                    </div>

                    {/* Partners List Table */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden text-left">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-4">Partner Name</th>
                              <th className="p-4">Phone Number</th>
                              <th className="p-4">Service Category</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Registration Date</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {partners.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-800 flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-brand/5 text-brand font-black flex items-center justify-center text-xs">
                                    {p.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span>{p.name}</span>
                                </td>
                                <td className="p-4 font-mono text-slate-500">{p.phone}</td>
                                <td className="p-4">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {p.serviceType}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    p.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                                    p.status === 'ON_JOB' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-400 text-[11px]">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right space-x-2">
                                  <button 
                                    onClick={() => {
                                      setEditingPartnerId(p.id);
                                      setPartnerFormName(p.name);
                                      setPartnerFormPhone(p.phone);
                                      setPartnerFormServiceType(p.serviceType);
                                      setPartnerFormStatus(p.status);
                                      setIsPartnerModalOpen(true);
                                    }}
                                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                        try {
                                          const res = await fetch(`/api/admin/partners/${p.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}` }
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            addNotification('Partner Deleted', 'Service partner removed successfully.');
                                            setPartners(prev => prev.filter(item => item.id !== p.id));
                                          } else {
                                            addNotification('Operation Failed', data.message || 'Unable to delete partner.');
                                          }
                                        } catch (err) {
                                          addNotification('Operation Failed', 'Database connection error.');
                                        }
                                      }
                                    }}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {partners.length === 0 && (
                              <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No service partners registered yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== TAB 6: PAYMENT MANAGEMENT ==================== */}
                {activeTab === 'payments' && (
                  <React.Suspense fallback={<TableSkeleton cols={6} rows={5} />}>
                    <AdminPaymentsTab />
                  </React.Suspense>
                )}
                {/* ==================== TAB 7: SERVICES ANALYTICS ==================== */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-800">Services Catalog & Management</h2>
                        <p className="text-xs text-slate-400 mt-1">Add new service offerings and monitor live catalog performance metrics</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column: Add New Service Form (1/3 width on large screens) */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
                        <h3 className="font-poppins font-bold text-sm text-slate-800 flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${editingServiceId ? 'bg-amber-500 animate-pulse' : 'bg-brand'}`}></span>
                          <span>{editingServiceId ? 'Edit Service Details' : 'Add New Service'}</span>
                        </h3>
                        
                        <form onSubmit={handleAddService} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Service Name *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Sofa Cleaning"
                              value={newServiceName}
                              onChange={(e) => setNewServiceName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Category *</label>
                              <select
                                value={newServiceCategory}
                                onChange={(e) => setNewServiceCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-500 focus:outline-none focus:border-brand focus:bg-white"
                                required
                              >
                                <option value="">Select</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Care">Care</option>
                                <option value="Shifting">Shifting</option>
                                <option value="Cooking">Cooking</option>
                                <option value="Painting">Painting</option>
                                <option value="Technical">Technical</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Price (Rs.) *</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 899"
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                                required
                                min="0"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Duration</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 2 hours"
                                value={newServiceDuration}
                                onChange={(e) => setNewServiceDuration(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Package Details</label>
                              <input 
                                type="text" 
                                placeholder="e.g. up to 3 BHK"
                                value={newServicePackage}
                                onChange={(e) => setNewServicePackage(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status *</label>
                            <select
                              value={newServiceIsActive ? "true" : "false"}
                              onChange={(e) => setNewServiceIsActive(e.target.value === "true")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-500 focus:outline-none focus:border-brand focus:bg-white"
                              required
                            >
                              <option value="true">Active / Enabled</option>
                              <option value="false">Disabled / Inactive</option>
                            </select>
                          </div>

                          <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Service Image Control</label>
                            
                            {/* Preview current image or fallback text */}
                            <div className="h-32 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                              {newServiceImage ? (
                                <img src={newServiceImage} alt="Preview" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-xs text-slate-400 font-semibold">Image Not Available</span>
                              )}
                            </div>

                            {/* Dropdown to assign one of the Google Drive images */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Select Drive Image (Priority 1)</label>
                              <select 
                                value={newServiceImage.startsWith('/services/') ? newServiceImage : ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setNewServiceImage(e.target.value);
                                  }
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-750 focus:outline-none"
                              >
                                <option value="">-- Custom / Uploaded / None --</option>
                                <option value="/services/babycare.jpg">Baby Care (babycare.jpg)</option>
                                <option value="/services/housecleaning.jpg">Home Cleaning (housecleaning.jpg)</option>
                                <option value="/services/bathroom-cleaning.jpg">Bathroom Cleaning (bathroom-cleaning.jpg)</option>
                                <option value="/services/kitchen-cleaning.jpg">Kitchen Cleaning (kitchen-cleaning.jpg)</option>
                                <option value="/services/dust-cleaning.jpg">Dust Cleaning (dust-cleaning.jpg)</option>
                                <option value="/services/house-shifting.jpg">House Shifting (house-shifting.jpg)</option>
                                <option value="/services/cooking-service.jpg">Cooking Service (cooking-service.jpg)</option>
                                <option value="/services/house-painting.jpg">House Painting (house-painting.jpg)</option>
                                <option value="/services/electrician.jpg">Electrician (electrician.jpg)</option>
                                <option value="/services/security-provider-v2.jpg">Security Provider (security-provider-v2.jpg)</option>
                                <option value="/services/pest-control-v2.jpg">Pest Control (pest-control-v2.jpg)</option>
                              </select>
                            </div>

                            {/* File Upload (Admin Uploaded - Priority 2) */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Upload New (Priority 2)</label>
                                <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-center py-1.5 px-3 rounded-lg text-xs cursor-pointer block border-dashed transition-all">
                                  <span>Choose File</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setNewServiceImage(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              <div className="flex flex-col justify-end">
                                <button
                                  type="button"
                                  onClick={() => setNewServiceImage('')}
                                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-1.5 rounded-lg border border-rose-200 transition-all text-center"
                                >
                                  Delete Image
                                </button>
                              </div>
                            </div>

                            {/* Input for raw image path or custom URL */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Image Path / URL / Base64</label>
                              <input 
                                type="text"
                                placeholder="No image assigned"
                                value={newServiceImage}
                                onChange={(e) => setNewServiceImage(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-750 font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Description *</label>
                            <textarea 
                              placeholder="Describe service features, inclusions, and terms..."
                              value={newServiceDesc}
                              onChange={(e) => setNewServiceDesc(e.target.value)}
                              rows="3"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all resize-none font-semibold"
                              required
                            />
                          </div>

                          <button 
                            type="submit" 
                            disabled={addingService}
                            className="w-full bg-brand hover:bg-brand-dark disabled:bg-slate-350 text-white font-extrabold text-xs uppercase py-3 rounded-xl tracking-wider transition-all shadow-md shadow-brand/10 hover:shadow-brand/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{addingService ? 'Saving...' : editingServiceId ? 'Save Changes' : 'Create Service'}</span>
                          </button>

                          {editingServiceId && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingServiceId(null);
                                setNewServiceName('');
                                setNewServiceCategory('');
                                setNewServicePrice('');
                                setNewServiceImage('');
                                setNewServiceDesc('');
                                setNewServiceDuration('');
                                setNewServicePackage('');
                                setNewServiceIsActive(true);
                              }}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase py-3 rounded-xl tracking-wider transition-all flex items-center justify-center cursor-pointer mt-2"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </form>
                      </div>

                      {/* Right Column: Catalog List & Performance (2/3 width on large screens) */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Services List Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-brand" />
                              <h3 className="font-poppins font-bold text-xs text-slate-800 uppercase tracking-wider">Active Service Catalog</h3>
                            </div>
                            <span className="bg-brand/10 text-brand text-[10px] font-extrabold px-3 py-1 rounded-full">
                              {services.length} Offerings
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                <tr>
                                  <th className="p-4 w-14">Image</th>
                                  <th className="p-4">Service Details</th>
                                  <th className="p-4">Category</th>
                                  <th className="p-4">Price</th>
                                  <th className="p-4">Duration & Package</th>
                                  <th className="p-4 text-center">Bookings Info</th>
                                  <th className="p-4 text-right">Actions & Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {services.map(srv => {
                                  // Find matched analytics
                                  const analytic = serviceAnalytics.find(a => a.name.toLowerCase() === srv.name.toLowerCase()) || { count: 0, revenue: 0 };
                                  return (
                                    <tr key={srv.id} className="hover:bg-slate-50/50">
                                      <td className="p-4">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                                          {srv.imageUrl ? (
                                            <img 
                                              src={srv.imageUrl} 
                                              alt={srv.name} 
                                              className="w-full h-full object-cover" 
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = e.target.parentNode.querySelector('.image-fallback');
                                                if (fallback) fallback.style.display = 'flex';
                                              }}
                                            />
                                          ) : null}
                                          <div 
                                            className="image-fallback absolute inset-0 flex items-center justify-center bg-slate-100 text-[6px] font-bold text-slate-400 text-center leading-none p-0.5"
                                            style={{ display: srv.imageUrl ? 'none' : 'flex' }}
                                          >
                                            Image Not Available
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4 max-w-[200px]">
                                        <h4 className="font-bold text-slate-800">{srv.name}</h4>
                                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5" title={srv.description}>{srv.description}</p>
                                      </td>
                                      <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                                          {srv.category}
                                        </span>
                                      </td>
                                      <td className="p-4 text-slate-850 font-black">
                                        Rs. {srv.price.toLocaleString()}
                                      </td>
                                      <td className="p-4 text-slate-500 text-[10px]">
                                        <div className="font-semibold text-slate-700">Duration: <span className="font-bold text-slate-500">{srv.durationText || 'N/A'}</span></div>
                                        <div className="mt-0.5 text-slate-400">Pkg: {srv.packageText || 'N/A'}</div>
                                      </td>
                                      <td className="p-4 text-center">
                                        <div className="font-black text-brand text-xs">{analytic.count} Bookings</div>
                                        <div className="text-[9px] text-emerald-600 font-extrabold mt-0.5">Rs. {analytic.revenue.toLocaleString()}</div>
                                      </td>
                                      
                                      <td className="p-4 text-right space-y-2">
                                        <div className="flex justify-end items-center space-x-1.5 mb-1">
                                          {srv.isActive ? (
                                            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                              Enabled
                                            </span>
                                          ) : (
                                            <span className="bg-slate-100 text-slate-400 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                              Disabled
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex justify-end items-center gap-1.5">
                                          <button 
                                            onClick={() => {
                                              setEditingServiceId(srv.id);
                                              setNewServiceName(srv.name);
                                              setNewServiceCategory(srv.category);
                                              setNewServicePrice(srv.price);
                                              setNewServiceImage(srv.imageUrl);
                                              setNewServiceDesc(srv.description);
                                              setNewServiceDuration(srv.durationText || '');
                                              setNewServicePackage(srv.packageText || '');
                                              setNewServiceIsActive(srv.isActive !== false);
                                            }}
                                            title="Edit Service"
                                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded shadow-sm hover:text-brand cursor-pointer flex items-center justify-center transition-colors font-bold"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>

                                          <button 
                                            onClick={() => handleDeleteService(srv.id)}
                                            title="Delete Service"
                                            className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 rounded shadow-sm cursor-pointer flex items-center justify-center transition-colors font-bold"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {services.length === 0 && (
                                  <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No services found in database</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== TAB 7.5: COUPONS MANAGEMENT ==================== */}
                {activeTab === 'coupons' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-poppins font-black text-2xl text-slate-800">Coupons & Promotions</h2>
                        <p className="text-xs text-slate-400 mt-1">Configure and manage customer promotional checkout discounts</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column: Create/Edit Coupon Form */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
                        <h3 className="font-poppins font-bold text-sm text-slate-800 flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${couponForm.id ? 'bg-amber-500 animate-pulse' : 'bg-brand'}`}></span>
                          <span>{couponForm.id ? `Edit Coupon: ${couponForm.code}` : 'Create Coupon'}</span>
                        </h3>
                        
                        <form onSubmit={handleSaveCoupon} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Coupon Code *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. WELCOME50"
                              value={couponForm.code}
                              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Discount Type *</label>
                              <select
                                value={couponForm.discountType}
                                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-500 focus:outline-none focus:border-brand focus:bg-white"
                                required
                              >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Flat (₹)</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Value *</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 50"
                                value={couponForm.discountValue}
                                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                                required
                                min="0"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Min Order Value (₹)</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 200"
                                value={couponForm.minOrderValue}
                                onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                                min="0"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Max Discount (₹)</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 100"
                                value={couponForm.maxDiscount || ''}
                                onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                                min="0"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Usage Limit (Total)</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 100"
                                value={couponForm.usageLimit || ''}
                                onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                                min="0"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Expiry Date</label>
                              <input 
                                type="date" 
                                value={couponForm.expiresAt ? couponForm.expiresAt.substring(0, 10) : ''}
                                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                              />
                            </div>
                          </div>

                          <button 
                            type="submit" 
                            disabled={savingCoupon}
                            className="w-full bg-brand hover:bg-brand-dark disabled:bg-slate-350 text-white font-extrabold text-xs uppercase py-3 rounded-xl tracking-wider transition-all shadow-md shadow-brand/10 hover:shadow-brand/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{savingCoupon ? 'Saving...' : couponForm.id ? 'Save Coupon' : 'Create Coupon'}</span>
                          </button>

                          {couponForm.id && (
                            <button 
                              type="button" 
                              onClick={() => setCouponForm({
                                id: null,
                                code: '',
                                discountType: 'PERCENTAGE',
                                discountValue: '',
                                minOrderValue: '0',
                                maxDiscount: '',
                                usageLimit: '',
                                expiresAt: '',
                                isActive: true
                              })}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase py-3 rounded-xl tracking-wider transition-all flex items-center justify-center cursor-pointer mt-2"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </form>
                      </div>

                      {/* Right Column: Coupon Table List */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-brand" />
                              <h3 className="font-poppins font-bold text-xs text-slate-800 uppercase tracking-wider">Active Promotional Coupons</h3>
                            </div>
                            <span className="bg-brand/10 text-brand text-[10px] font-extrabold px-3 py-1 rounded-full">
                              {coupons.length} Coupons
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                <tr>
                                  <th className="p-4">Coupon Code</th>
                                  <th className="p-4">Discount</th>
                                  <th className="p-4">Min Spend</th>
                                  <th className="p-4">Expiry</th>
                                  <th className="p-4">Usage</th>
                                  <th className="p-4 text-center">Status</th>
                                  <th className="p-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {coupons.map(cp => (
                                  <tr key={cp.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-brand text-sm tracking-wider font-mono">{cp.code}</td>
                                    <td className="p-4 font-bold text-slate-800">
                                      {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}%` : `₹${cp.discountValue}`}
                                      {cp.discountType === 'PERCENTAGE' && cp.maxDiscount && (
                                        <span className="text-[10px] text-slate-400 font-normal block">Max: ₹{cp.maxDiscount}</span>
                                      )}
                                    </td>
                                    <td className="p-4 font-semibold text-slate-500">₹{cp.minOrderValue || 0}</td>
                                    <td className="p-4 text-slate-500 text-[10px]">
                                      {cp.expiresAt ? new Date(cp.expiresAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-[10px]">
                                      {cp.usedCount || 0} / {cp.usageLimit || '∞'}
                                    </td>
                                    <td className="p-4 text-center">
                                      {cp.isActive ? (
                                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="bg-slate-100 text-slate-400 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                          Inactive
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 text-right space-x-1">
                                      <button 
                                        onClick={() => setCouponForm({
                                          id: cp.id,
                                          code: cp.code,
                                          discountType: cp.discountType,
                                          discountValue: cp.discountValue,
                                          minOrderValue: cp.minOrderValue || '0',
                                          maxDiscount: cp.maxDiscount || '',
                                          usageLimit: cp.usageLimit || '',
                                          expiresAt: cp.expiresAt || '',
                                          isActive: cp.isActive
                                        })}
                                        title="Edit Coupon"
                                        className="p-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded shadow-sm hover:text-brand inline-block cursor-pointer"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      <button 
                                        onClick={() => handleToggleCouponStatus(cp.id, cp.code, cp.isActive)}
                                        title={cp.isActive ? "Disable Coupon" : "Enable Coupon"}
                                        className={`p-1 border rounded shadow-sm transition-colors inline-block cursor-pointer ${
                                          cp.isActive 
                                            ? 'bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-600' 
                                            : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-600'
                                        }`}
                                      >
                                        {cp.isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                      </button>

                                      <button 
                                        onClick={() => handleDeleteCoupon(cp.id, cp.code)}
                                        title="Delete Coupon"
                                        className="p-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded shadow-sm inline-block cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {coupons.length === 0 && (
                                  <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No coupons active in database</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== TAB 8: AREA ANALYTICS ==================== */}
                {activeTab === 'analytics' && (
                  <React.Suspense fallback={<AnalyticsSkeleton />}>
                    <AdminAnalyticsTab />
                  </React.Suspense>
                )}

                {/* ==================== TAB 9: SETTINGS ==================== */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-poppins font-black text-2xl text-slate-800">System Settings</h2>
                      <p className="text-xs text-slate-400 mt-1">Configure platform rates, dispatch gates, and operational limits</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 max-w-2xl shadow-sm">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Platform Commission Split</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Define percentage share deducted per completed service job.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="number" defaultValue="30" className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none" />
                          <span className="text-xs font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Instant Anchepalya Dispatch</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Toggle automatic 9-minute dispatcher matching on new bookings.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand focus:ring-0 bg-white border-slate-350 cursor-pointer" />
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Audit Log Security Vault</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Enforce high-security system logging for every user mutation.</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ==================== MODAL 1: SERVICE PARTNER ONBOARD / EDIT MODAL ==================== */}
      <AnimatePresence>
        {isPartnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPartnerModalOpen(false)}
              className="fixed inset-0 bg-slate-900 cursor-pointer"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden z-10 flex flex-col p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-poppins font-black text-sm text-slate-800">
                  {editingPartnerId ? 'Edit Service Partner' : 'Onboard New Partner'}
                </h3>
                <button 
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePartnerFormSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Partner Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramesh Kumar"
                    value={partnerFormName}
                    onChange={(e) => setPartnerFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Phone Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9876543210"
                    value={partnerFormPhone}
                    onChange={(e) => setPartnerFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Service Category *</label>
                  <select 
                    value={partnerFormServiceType}
                    onChange={(e) => setPartnerFormServiceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                    required
                  >
                    <option value="Cleaning">Cleaning</option>
                    <option value="Care">Care</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Shifting">Shifting</option>
                    <option value="Painting">Painting</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</label>
                  <select 
                    value={partnerFormStatus}
                    onChange={(e) => setPartnerFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-brand focus:bg-white transition-all font-semibold"
                    required
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ON_JOB">ON_JOB</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand hover:bg-brand-dark text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition-all shadow-md shadow-brand/10 cursor-pointer mt-4"
                >
                  <span>{editingPartnerId ? 'Save Changes' : 'Onboard Partner'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL 1: BOOKING DETAILS MODAL ==================== */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 max-w-[450px] w-full relative z-10 space-y-6 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-poppins font-bold text-sm text-slate-850 flex items-center space-x-2">
                  <span>Booking details</span>
                  <span className="font-mono text-brand font-bold text-xs">#{selectedBooking.id.substring(0,8)}</span>
                </h3>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-650 shadow-sm transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-650">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Customer Profile</span>
                  <h4 className="font-bold text-slate-800 mt-0.5">{selectedBooking.customer_name || selectedBooking.user?.name || 'Customer'}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedBooking.phone || selectedBooking.user?.phone || 'N/A'} • {selectedBooking.email || selectedBooking.user?.email || 'N/A'}</p>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Doorstep Service Address</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed font-semibold">{selectedBooking.address}</p>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <span className="block text-[9px] font-bold text-amber-500 uppercase font-poppins">Special Instructions / Notes</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed font-semibold bg-amber-50/40 border border-amber-100/70 rounded-xl p-3 shadow-inner">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Selected Service Items</span>
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 mt-1 space-y-1.5 shadow-inner">
                    {selectedBooking.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-800">{item.service?.name || selectedBooking.service_name || 'General Service'} x {item.quantity}</span>
                        <span className="font-extrabold text-emerald-600">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs font-extrabold mt-2">
                      <span className="text-slate-500">Total Price Paid</span>
                      <span className="text-emerald-600">Rs. {selectedBooking.finalPrice}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Assigned Service Partner</span>
                  {selectedBooking.partnerName ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1 flex justify-between items-center shadow-sm">
                      <div>
                        <h5 className="font-bold text-cyan-700">{selectedBooking.partnerName}</h5>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{selectedBooking.partnerMobile}</p>
                      </div>
                      <span className="bg-cyan-50 text-cyan-750 font-black text-[9px] px-2.5 py-0.5 rounded tracking-wider uppercase">ASSIGNED</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">No service partner assigned to this job.</p>
                  )}

                  {/* Assign/Reassign Partner Form */}
                  {selectedBooking.status !== 'CANCELLED' && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3 text-left">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase font-poppins">Assign / Change Partner</h5>
                      
                      <select
                        value={partnerIdInput}
                        onChange={(e) => {
                          const p = partners.find(item => item.id === e.target.value);
                          if (p) {
                            setPartnerIdInput(p.id);
                            setPartnerNameInput(p.name);
                            setPartnerMobileInput(p.phone);
                          } else {
                            setPartnerIdInput('');
                            setPartnerNameInput('');
                            setPartnerMobileInput('');
                          }
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand w-full font-semibold cursor-pointer"
                      >
                        <option value="">Select Service Partner...</option>
                        {partners
                          .filter(p => !selectedBooking.serviceCategory || p.serviceType === selectedBooking.serviceCategory)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.serviceType} - {p.status})
                            </option>
                          ))}
                        {/* Fallback to all partners if none match category */}
                        {partners.filter(p => p.serviceType === selectedBooking.serviceCategory).length === 0 && 
                          partners.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.serviceType} - {p.status})
                            </option>
                          ))}
                      </select>

                      <button
                        onClick={() => {
                          if (!partnerIdInput) {
                            addNotification('Validation Error', 'Please select a partner from the dropdown.');
                            return;
                          }
                          handleAssignPartner(selectedBooking.id, partnerIdInput, partnerNameInput, partnerMobileInput);
                        }}
                        className="w-full bg-brand hover:bg-brand/90 text-white font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>Assign Partner</span>
                      </button>
                    </div>
                  )}

                  {selectedBooking.status === 'CANCELLED' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mt-4">
                      <h5 className="font-bold text-rose-700">Booking Cancelled</h5>
                      <p className="text-[10px] text-rose-600 mt-0.5 leading-relaxed font-semibold">
                        A full refund has been automatically initiated for this cancelled booking.
                      </p>
                      {selectedBooking.refundId && (
                        <p className="text-[9px] text-slate-400 font-mono mt-1.5">
                          Refund ID: <span className="font-bold text-slate-600 select-all">{selectedBooking.refundId}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== CUSTOM MODAL: PARTNER ASSIGNMENT MODAL ==================== */}
      <AnimatePresence>
        {assignModalOpen && assignModalBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAssignModalOpen(false);
                setAssignModalBookingId(null);
                setAssignModalPartnerName('');
                setAssignModalPartnerMobile('');
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 max-w-[380px] w-full relative z-10 space-y-4 shadow-xl text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-poppins font-bold text-sm text-slate-855">
                  Assign Partner Details
                </h3>
                <button 
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssignModalBookingId(null);
                    setAssignModalPartnerName('');
                    setAssignModalPartnerMobile('');
                  }}
                  className="p-1.5 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-650 shadow-sm transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-poppins mb-1.5">Service Partner Name</label>
                  <input
                    type="text"
                    placeholder="Enter Partner Name"
                    value={assignModalPartnerName}
                    onChange={(e) => setAssignModalPartnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-poppins mb-1.5">Service Partner Mobile</label>
                  <input
                    type="text"
                    placeholder="Enter Mobile Number"
                    value={assignModalPartnerMobile}
                    onChange={(e) => setAssignModalPartnerMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand font-medium"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100 mt-4">
                <button
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssignModalBookingId(null);
                    setAssignModalPartnerName('');
                    setAssignModalPartnerMobile('');
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase py-2.5 rounded-xl border border-slate-200 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!assignModalPartnerName || !assignModalPartnerMobile) {
                      addNotification('Validation Error', 'Please enter both partner name and mobile number.');
                      return;
                    }
                    await handleAssignPartner(assignModalBookingId, assignModalPartnerName, assignModalPartnerMobile);
                    setAssignModalOpen(false);
                    setAssignModalBookingId(null);
                    setAssignModalPartnerName('');
                    setAssignModalPartnerMobile('');
                  }}
                  className="flex-1 bg-brand hover:bg-brand/90 text-white font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Assign Partner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL 2: CUSTOMER HISTORY MODAL ==================== */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 max-w-[500px] w-full relative z-10 space-y-6 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-poppins font-bold text-sm text-slate-850">Client History Profile</h3>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{selectedCustomer.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-650 shadow-sm transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-650">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Phone</span>
                    <span className="font-bold text-slate-800 mt-0.5 block font-mono">{selectedCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Email</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{selectedCustomer.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase font-poppins">Request Log ({selectedCustomer.bookingsCount})</span>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {bookings.filter(b => b.userId === selectedCustomer.id).map(b => (
                      <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-850">{b.items?.[0]?.service?.name || 'Home service'}</span>
                            <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase">{b.status}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-emerald-600">Rs. {b.finalPrice}</span>
                      </div>
                    ))}
                    {bookings.filter(b => b.userId === selectedCustomer.id).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-4">No bookings made yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin-specific toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-start space-x-3.5"
            >
              <Bell className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-poppins font-bold text-xs">{t.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="text-slate-500 hover:text-slate-350 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
