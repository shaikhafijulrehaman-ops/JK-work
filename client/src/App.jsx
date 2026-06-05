import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Global stores
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';

// Components
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginRequiredModal from './components/LoginRequiredModal';

// Core Pages (Statically imported for instant navigation)
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import BookingsPage from './pages/BookingsPage';
import AccountPage from './pages/AccountPage';

// Secondary Pages (Lazy loaded in background)
const WorkerPortal = React.lazy(() => import('./pages/WorkerPortal'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const ManageAddresses = React.lazy(() => import('./pages/ManageAddresses'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const PartnerRegister = React.lazy(() => import('./pages/PartnerRegister'));
const CustomerRegister = React.lazy(() => import('./pages/CustomerRegister'));

// Admin Pages
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminWorkers = React.lazy(() => import('./pages/admin/AdminWorkers'));
const AdminServices = React.lazy(() => import('./pages/admin/AdminServices'));

export default function App() {
  const { checkSession, isAuthenticated, user } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();

  const [cartOpen, setCartOpen] = useState(false);

  // Sync user credentials on client mount
  useEffect(() => {
    checkSession();
    document.title = 'JK Home Care';
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
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
            
            {/* ==================== PUBLIC PATHS ==================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/services" replace /> : <Auth />} />
            <Route path="/customer-register" element={<CustomerRegister />} />

            {/* ==================== USER PROTECTED DASHBOARD ==================== */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/notifications" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="/account/profile" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/account/bookings" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <BookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/addresses" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <ManageAddresses />
              </ProtectedRoute>
            } />
            <Route path="/account/settings" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/help" element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <HelpPage />
              </ProtectedRoute>
            } />

            {/* ==================== ADMIN COMMAND CONSOLE (RBAC) ==================== */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview defaultTab="dashboard" />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview defaultTab="bookings" />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview defaultTab="services" />
              </ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          </React.Suspense>
        </main>

        {/* Global Login Required Modal */}
        <LoginRequiredModal />

      </div>
    </Router>
  );
}
