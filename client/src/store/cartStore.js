import { create } from 'zustand';
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    if (!code) return { success: false, message: 'Please enter a coupon code.' };
    try {
      const subtotal = get().items.reduce((sum, item) => sum + item.price * item.quantity, 0.0);
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (data.success) {
        set({ couponCode: code.toUpperCase(), activeCoupon: data.coupon });
        return { success: true, message: 'Coupon applied successfully!' };
      } else {
        set({ couponCode: '', activeCoupon: null });
        return { success: false, message: data.message || 'Invalid or expired promotional code.' };
      }
    } catch (e) {
      console.warn('Coupon validation offline fallback...', e);
      if (code.toUpperCase() === '9MINUTES') {
        const mockCoupon = { code: '9MINUTES', discountType: 'PERCENTAGE', discountValue: 15.0, minOrderValue: 0, maxDiscount: 200 };
        set({ couponCode: '9MINUTES', activeCoupon: mockCoupon });
        return { success: true, message: 'Coupon applied successfully!' };
      }
      if (code.toUpperCase() === 'WELCOME10') {
        const mockCoupon = { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10.0, minOrderValue: 0, maxDiscount: 100 };
        set({ couponCode: 'WELCOME10', activeCoupon: mockCoupon });
        return { success: true, message: 'Coupon applied successfully!' };
      }
      return { success: false, message: 'Invalid or expired promotional code.' };
    }
  },

  // Calculate pricing summaries
  getSummary: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0.0);
    const activeCoupon = get().activeCoupon;
    
    let discount = 0.0;
    if (activeCoupon && subtotal >= (activeCoupon.minOrderValue || 0)) {
      if (activeCoupon.discountType === 'FLAT') {
        discount = activeCoupon.discountValue;
      } else if (activeCoupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * activeCoupon.discountValue) / 100;
        if (activeCoupon.maxDiscount !== null && activeCoupon.maxDiscount !== undefined && discount > activeCoupon.maxDiscount) {
          discount = activeCoupon.maxDiscount;
        }
      }
    }
    
    discount = parseFloat(discount.toFixed(2));
    const platformFee = subtotal > 0 ? 49.0 : 0.0;
    const total = Math.max(0, subtotal - discount + platformFee);

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
