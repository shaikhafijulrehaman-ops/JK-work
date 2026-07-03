import { create } from 'zustand';
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  // Load user / admin bookings
  fetchBookings: async (silent = false) => {
    const hasCached = get().bookings.length > 0;
    if (!hasCached && !silent) {
      set({ loading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const res = await fetch(`${API_URL}/bookings`, { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        set({ bookings: data.bookings, loading: false });
      } else {
        set({ error: data.message, loading: false });
      }
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: fetchBookings failed', e);
      set({ error: 'Failed to retrieve bookings. Please check your connection and try again.', loading: false });
    }
  },

  // Create booking
  createBooking: async (bookingData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();

      if (data.success) {
        const current = get().bookings;
        const updated = [...current, data.booking];
        set({ bookings: updated, loading: false });
        return { success: true, booking: data.booking };
      } else {
        set({ error: data.message, loading: false });
        return { success: false, error: data.message };
      }
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: createBooking failed', e);
      const errMsg = 'Failed to submit booking. Please check your connection and try again.';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  // Update job progress status
  updateJobStatus: async (bookingId, status) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        await get().fetchBookings(true);
        return true;
      }
      set({ error: data.message });
      return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: updateJobStatus failed', e);
      set({ error: 'Failed to update job status. Please check your connection.', loading: false });
      return false;
    }
  },

  // Admin assign worker to booking
  assignWorker: async (bookingId, partnerId, partnerName, partnerMobile) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ partnerId, partnerName, partnerMobile })
      });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        await get().fetchBookings(true);
        return true;
      }
      set({ error: data.message });
      return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: assignWorker failed', e);
      set({ error: 'Failed to assign partner. Please check your connection.', loading: false });
      return false;
    }
  },

  // Verify Service Partner Arrival via OTP
  verifyArrival: async (bookingId, otp) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/verify-arrival`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        await get().fetchBookings(true);
        return { success: true, message: data.message };
      }
      set({ error: data.message });
      return { success: false, error: data.message };
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: verifyArrival failed', e);
      const errMsg = 'Failed to verify partner arrival. Please check your connection.';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  submitReview: async (bookingId, rating, customerOpinion) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ bookingId, rating, customerOpinion })
      });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        await get().fetchBookings(true);
        return true;
      }
      set({ error: data.message });
      return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: submitReview failed', e);
      set({ error: 'Failed to submit review. Please check your connection.', loading: false });
      return false;
    }
  },

  // Fetch detailed booking (for real-time status updates)
  fetchBookingDetails: async (bookingId) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const current = get().bookings;
        const updated = current.map(b => b.id === bookingId ? data.booking : b);
        set({ bookings: updated });
        return { success: true, booking: data.booking };
      }
      return { success: false, error: data.message || 'Booking details not found.' };
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: fetchBookingDetails failed', e);
      return { success: false, error: 'Booking details not found due to network error.' };
    }
  }
}));
