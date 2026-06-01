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

// Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WorkerPortal = React.lazy(() => import('./pages/WorkerPortal'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const AccountPage = React.lazy(() => import('./pages/AccountPage'));
const ManageAddresses = React.lazy(() => import('./pages/ManageAddresses'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const BookingsPage = React.lazy(() => import('./pages/BookingsPage'));
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
            <Route path="/partner-register" element={<PartnerRegister />} />
            <Route path="/customer-register" element={<CustomerRegister />} />

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
            <Route path="/account/notifications" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="/account/profile" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/account/bookings" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <BookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/addresses" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <ManageAddresses />
              </ProtectedRoute>
            } />
            <Route path="/account/settings" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/help" element={
              <ProtectedRoute allowedRoles={['USER', 'WORKER', 'ADMIN']}>
                <HelpPage />
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
                <AdminOverview defaultTab="dashboard" />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview defaultTab="bookings" />
              </ProtectedRoute>
            } />
            <Route path="/admin/workers" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview defaultTab="partner-approvals" />
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
