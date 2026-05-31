import { create } from 'zustand';

const API_URL = 'http://localhost:5000/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [
    {
      id: 'n-welcome',
      title: 'Welcome to JK Enterprises!',
      message: 'Experience doorstep convenience in Anchepalya. Instant home cleaning in just 9 minutes!',
      isRead: false,
      createdAt: new Date()
    }
  ],

  loading: false,

  // Load user alerts
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/notifications`, { method: 'GET' });
      const data = await res.json();
      if (data.success) {
        set({ notifications: data.notifications, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },

  // Add a local notification instantly (for simulated feedback triggers)
  addNotification: (title, message, type = 'BOOKING_ALERT') => {
    const current = get().notifications;
    const alert = {
      id: `n-${Date.now()}`,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
      type
    };
    set({ notifications: [alert, ...current] });
  },

  // Mark single as read
  markAsRead: async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {}
    const updated = get().notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    set({ notifications: updated });
  },

  // Mark all as read
  markAllAsRead: () => {
    const updated = get().notifications.map(n => ({ ...n, isRead: true }));
    set({ notifications: updated });
  }
}));
