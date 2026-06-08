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
        set({ loading: false });
      }
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: fetchBookings failed', e);
      if (import.meta.env.MODE === 'production') {
        set({ error: 'Failed to retrieve bookings. Please try again shortly.', loading: false });
        return;
      }
      // Offline fallback lists
      const localBookings = JSON.parse(localStorage.getItem('jk_bookings')) || [];
      set({ bookings: localBookings, loading: false });
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
          'Authorization': `Bearer ${localStorage.getItem('jk_token')}`
        },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();

      if (data.success) {
        const current = get().bookings;
        current.push(data.booking);
        localStorage.setItem('jk_bookings', JSON.stringify(current));
        set({ bookings: [...current], loading: false });
        return { success: true, booking: data.booking };
      } else {
        set({ error: data.message, loading: false });
        return { success: false, error: data.message };
      }
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: createBooking failed', e);
      if (import.meta.env.MODE === 'production') {
        const errMsg = 'Failed to submit booking. Please try again shortly.';
        set({ error: errMsg, loading: false });
        return { success: false, error: errMsg };
      }
      // Local fallback mock order execution
      const mockOrder = {
        id: `booking-mock-${Date.now()}`,
        status: 'PENDING_PARTNER_ACCEPTANCE',
        paymentStatus: 'UNPAID',
        discountApplied: bookingData.discountApplied || 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...bookingData
      };
      
      const current = get().bookings;
      current.push(mockOrder);
      localStorage.setItem('jk_bookings', JSON.stringify(current));
      set({ bookings: [...current], loading: false });

      // Live dispatch acceptance simulation for offline preview
      setTimeout(() => {
        const bookingsList = JSON.parse(localStorage.getItem('jk_bookings')) || [];
        const found = bookingsList.find(b => b.id === mockOrder.id);
        if (found && found.status === 'PENDING_PARTNER_ACCEPTANCE') {
          found.status = 'PARTNER_ACCEPTED';
          found.workerId = 'w-seeded- Ramesh';
          found.acceptedAt = new Date().toISOString();
          
          // Seed a realistic database-driven worker profile
          found.worker = {
            id: 'w-1',
            rating: 4.8,
            experienceYears: 3,
            profilePhoto: '', // fallback to default or seed avatar
            user: {
              name: 'Ramesh Kumar',
              phone: '9876543210'
            }
          };

          // Save back to local storage and update Zustand state
          const updatedList = bookingsList.map(b => b.id === mockOrder.id ? found : b);
          localStorage.setItem('jk_bookings', JSON.stringify(updatedList));
          set({ bookings: updatedList });
        }
      }, 7000); // After 7 seconds, simulate Vijay or Ramesh accepting

      return { success: true, booking: mockOrder };
    }
  },

  // Update job progress status (User or Worker slide action)
  updateJobStatus: async (bookingId, status) => {
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
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
      if (import.meta.env.MODE === 'production') return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: updateJobStatus failed', e);
      if (import.meta.env.MODE === 'production') return false;
    }

    if (import.meta.env.MODE === 'production') return false;

    // Sandbox Local Mutation for live countdown preview
    const current = get().bookings;
    const idx = current.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      current[idx].status = status;
      if (status === 'COMPLETED') {
        current[idx].paymentStatus = 'PAID';
        current[idx].workerEarnings = parseFloat((current[idx].finalPrice * 0.70).toFixed(2));
      }
      localStorage.setItem('jk_bookings', JSON.stringify(current));
      set({ bookings: [...current] });
      return true;
    }
    return false;
  },

  // Admin assign worker to booking
  assignWorker: async (bookingId, partnerName, partnerMobile) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ partnerName, partnerMobile })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
      if (import.meta.env.MODE === 'production') return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: assignWorker failed', e);
      if (import.meta.env.MODE === 'production') return false;
    }

    if (import.meta.env.MODE === 'production') return false;

    // Sandbox Local Assignment
    const current = get().bookings;
    const idx = current.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      current[idx].status = 'ASSIGNED';
      current[idx].partnerName = partnerName;
      current[idx].partnerMobile = partnerMobile;

      localStorage.setItem('jk_bookings', JSON.stringify(current));
      set({ bookings: [...current] });
      return true;
    }
    return false;
  },

  // Save Customer Rating
  submitReview: async (bookingId, rating, comment) => {
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ bookingId, rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
      if (import.meta.env.MODE === 'production') return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: submitReview failed', e);
      if (import.meta.env.MODE === 'production') return false;
    }

    if (import.meta.env.MODE === 'production') return false;

    // Sandbox Local Review
    const current = get().bookings;
    const idx = current.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      current[idx].review = { rating, comment, createdAt: new Date() };
      localStorage.setItem('jk_bookings', JSON.stringify(current));
      set({ bookings: [...current] });
      return true;
    }
    return false;
  },

  // Simulated gateway checkout
  simulatePayment: async (bookingId, method) => {
    try {
      const res = await fetch(`${API_URL}/payments/simulate-success`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        },
        body: JSON.stringify({ bookingId, paymentMethod: method })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
      if (import.meta.env.MODE === 'production') return false;
    } catch (e) {
      console.error('[JK Booking Monitoring] Payment failure: simulatePayment failed', e);
      if (import.meta.env.MODE === 'production') return false;
    }

    if (import.meta.env.MODE === 'production') return false;

    // Sandbox Payout Mutation
    const current = get().bookings;
    const idx = current.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      current[idx].paymentStatus = 'PAID';
      current[idx].paymentId = `pay_sim_${Math.random().toString(36).substring(2,10)}`;
      current[idx].paymentMethod = method;
      localStorage.setItem('jk_bookings', JSON.stringify(current));
      set({ bookings: [...current] });
      return true;
    }
    return false;
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
        // Update this booking in our state
        const current = get().bookings;
        const updated = current.map(b => b.id === bookingId ? data.booking : b);
        set({ bookings: updated });
        return { success: true, booking: data.booking };
      }
      if (import.meta.env.MODE === 'production') {
        return { success: false, error: data.message || 'Booking details not found.' };
      }
    } catch (e) {
      console.error('[JK Booking Monitoring] API/Database failure: fetchBookingDetails failed', e);
      if (import.meta.env.MODE === 'production') {
        return { success: false, error: 'Booking details not found.' };
      }
    }

    if (import.meta.env.MODE === 'production') {
      return { success: false, error: 'Booking details not found.' };
    }

    // Offline fallback: find in local state
    const current = get().bookings;
    const found = current.find(b => b.id === bookingId);
    if (found) {
      return { success: true, booking: found };
    }
    return { success: false, error: 'Booking details not found.' };
  },

  // Worker: Accept a booking request
  acceptBooking: async (bookingId) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/accept`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        }
      });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        // Sync local storage and state
        await get().fetchBookings();
        return { success: true, booking: data.booking };
      }
      return { success: false, error: data.message };
    } catch (e) {
      set({ loading: false });
      
      if (import.meta.env.MODE === 'production') {
        return { success: false, error: 'Failed to accept booking. Database offline.' };
      }
      
      // Sandbox fallback accept
      const current = get().bookings;
      const idx = current.findIndex(b => b.id === bookingId);
      if (idx !== -1) {
        current[idx].status = 'PARTNER_ACCEPTED';
        current[idx].workerId = 'w-seeded';
        current[idx].acceptedAt = new Date().toISOString();
        current[idx].worker = {
          id: 'w-seeded',
          rating: 4.9,
          experienceYears: 5,
          user: { name: 'Ramesh Kumar', phone: '9876543210' }
        };
        localStorage.setItem('jk_bookings', JSON.stringify(current));
        set({ bookings: [...current] });
        return { success: true, booking: current[idx] };
      }
      return { success: false, error: 'Database network fallback error.' };
    }
  },

  // Worker: Reject a booking request
  rejectBooking: async (bookingId) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jk_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      }
    } catch (e) {
      if (import.meta.env.MODE === 'production') {
        return { success: false, error: 'Failed to reject booking. Database offline.' };
      }
    }

    if (import.meta.env.MODE === 'production') {
      return { success: true };
    }

    // Sandbox fallback reject: remove from matched list for this local session
    const current = get().bookings;
    const updated = current.filter(b => b.id !== bookingId);
    set({ bookings: updated });
    return { success: true };
  }
}));
