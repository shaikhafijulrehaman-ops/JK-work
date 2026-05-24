import { create } from 'zustand';

const API_URL = 'http://localhost:5000/api';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  // Load user / admin bookings
  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/bookings`, { method: 'GET' });
      const data = await res.json();
      if (data.success) {
        set({ bookings: data.bookings, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
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
      // Local fallback mock order execution
      const mockOrder = {
        id: `booking-mock-${Date.now()}`,
        status: 'PENDING',
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
      return { success: true, booking: mockOrder };
    }
  },

  // Update job progress status (User or Worker slide action)
  updateJobStatus: async (bookingId, status) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
    } catch (e) {}

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
  assignWorker: async (bookingId, workerId) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
    } catch (e) {}

    // Sandbox Local Assignment
    const current = get().bookings;
    const idx = current.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      current[idx].workerId = workerId;
      current[idx].status = 'ASSIGNED';
      
      // Simulate assigning Ramesh Kumar
      current[idx].worker = {
        id: workerId,
        rating: 4.8,
        user: { name: workerId === 'w-2' ? 'Vijay Kumar' : 'Ramesh Kumar', phone: '7766554433' }
      };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
    } catch (e) {}

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, paymentMethod: method })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchBookings();
        return true;
      }
    } catch (e) {}

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
  }
}));
