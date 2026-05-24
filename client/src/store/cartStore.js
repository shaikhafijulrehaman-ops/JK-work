import { create } from 'zustand';

const API_URL = 'http://localhost:5000/api';

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('jk_cart')) || [],
  pincode: '560073', // Default to Anchepalya
  isPincodeValid: true,
  couponCode: '',
  discountPct: 0.0,
  activeCoupon: null,

  // Add Item with details
  addItem: (service, variant = null) => {
    const current = get().items;
    const key = `${service.id}-${variant || 'default'}`;
    const idx = current.findIndex(i => `${i.service.id}-${i.variant || 'default'}` === key);

    let price = service.price;
    if (service.name === 'House Painting' && variant === '3BHK') {
      price = 23499.0;
    } else if (service.name === 'House Painting' && variant === '2BHK') {
      price = 20099.0;
    }

    if (idx !== -1) {
      current[idx].quantity += 1;
    } else {
      current.push({
        id: key,
        service,
        quantity: 1,
        price,
        variant
      });
    }

    localStorage.setItem('jk_cart', JSON.stringify(current));
    set({ items: [...current] });
  },

  // Remove Item
  removeItem: (id) => {
    const updated = get().items.filter(i => i.id !== id);
    localStorage.setItem('jk_cart', JSON.stringify(updated));
    set({ items: updated });
  },

  // Update item quantity
  updateQty: (id, qty) => {
    const current = get().items;
    const idx = current.findIndex(i => i.id === id);
    if (idx !== -1) {
      current[idx].quantity = Math.max(1, qty);
      localStorage.setItem('jk_cart', JSON.stringify(current));
      set({ items: [...current] });
    }
  },

  // Validate active pincode area in Anchepalya
  checkPincode: async (pin) => {
    try {
      const res = await fetch(`${API_URL}/servicesArea/${pin}`).catch(() => null);
      if (res) {
        const data = await res.json();
        set({ pincode: pin, isPincodeValid: data.success });
        return data.success;
      }
      // Offline fallback: 560073 (Anchepalya) and 560074 are valid
      const valid = pin === '560073' || pin === '560074';
      set({ pincode: pin, isPincodeValid: valid });
      return valid;
    } catch (e) {
      const valid = pin === '560073' || pin === '560074';
      set({ pincode: pin, isPincodeValid: valid });
      return valid;
    }
  },

  // Validate promotional coupon codes
  applyCoupon: async (code) => {
    if (code.toUpperCase() === '9MINUTES') {
      set({ couponCode: code.toUpperCase(), discountPct: 15.0, activeCoupon: '9MINUTES' });
      return { success: true, message: 'Promo code applied! 15% discount deducted.' };
    }
    if (code.toUpperCase() === 'WELCOME10') {
      set({ couponCode: code.toUpperCase(), discountPct: 10.0, activeCoupon: 'WELCOME10' });
      return { success: true, message: 'Promo code applied! 10% discount deducted.' };
    }
    return { success: false, message: 'Invalid or expired promotional code.' };
  },

  // Calculate pricing summaries
  getSummary: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0.0);
    const discount = (subtotal * get().discountPct) / 100;
    const platformFee = subtotal > 0 ? 49.0 : 0.0;
    const total = subtotal - discount + platformFee;

    return {
      subtotal,
      discount,
      platformFee,
      total
    };
  },

  clearCart: () => {
    localStorage.removeItem('jk_cart');
    set({ items: [], couponCode: '', discountPct: 0.0, activeCoupon: null });
  }
}));
