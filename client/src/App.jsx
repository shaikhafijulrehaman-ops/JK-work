import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Global stores
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';

// Components
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import WorkerPortal from './pages/WorkerPortal';
import NotificationsPage from './pages/NotificationsPage';
import AccountPage from './pages/AccountPage';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminBookings from './pages/admin/AdminBookings';
import AdminWorkers from './pages/admin/AdminWorkers';
import AdminServices from './pages/admin/AdminServices';

export default function App() {
  const { checkSession, isAuthenticated, user } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();

  const [cartOpen, setCartOpen] = useState(false);

  // Sync user credentials on client mount
  useEffect(() => {
    checkSession();
  }, []);

  // Fetch notifications once logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-brand selection:text-white">
        
        {/* Navigation Header */}
        <Navbar onCartToggle={() => setCartOpen(!cartOpen)} />

        {/* Global Cart side drawer */}
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            
            {/* ==================== PUBLIC PATHS ==================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/services" replace /> : <Auth />} />

            {/* ==================== USER PROTECTED DASHBOARD ==================== */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <AccountPage />
              </ProtectedRoute>
            } />

            {/* ==================== WORKER PORTAL ==================== */}
            <Route path="/worker/dashboard" element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerPortal />
              </ProtectedRoute>
            } />

            {/* ==================== ADMIN COMMAND CONSOLE (RBAC) ==================== */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/workers" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWorkers />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminServices />
              </ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>

      </div>
    </Router>
  );
}
