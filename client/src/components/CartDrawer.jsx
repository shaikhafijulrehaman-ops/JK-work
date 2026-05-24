import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  MapPin, 
  Clock, 
  Calendar, 
  Tag, 
  CheckCircle,
  CreditCard,
  QrCode,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, pincode, isPincodeValid, checkPincode, applyCoupon, couponCode, discountPct, getSummary, clearCart, updateQty, removeItem } = useCartStore();
  const { createBooking } = useBookingStore();
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [pinInput, setPinInput] = useState(pincode);
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponMsg, setCouponMsg] = useState('');
  
  const [address, setAddress] = useState('Flat 402, Block A, Prestige Jindal City, Anchepalya, Bengaluru - 560073');
  const [phone, setPhone] = useState('9876543210');
  const [slot, setSlot] = useState('10:00 AM - 11:00 AM');
  const [date, setDate] = useState('2026-05-24');

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  const { subtotal, discount, platformFee, total } = getSummary();

  const handlePincode = async (e) => {
    e.preventDefault();
    await checkPincode(pinInput);
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    const res = await applyCoupon(couponInput);
    setCouponMsg(res.message);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      onClose();
      return;
    }

    if (!isPincodeValid) {
      alert('We currently do not offer doorstep dispatches in this pincode.');
      return;
    }

    const payload = {
      items: items.map(i => ({ serviceId: i.service.id, quantity: i.quantity, variant: i.variant })),
      pincode,
      address,
      scheduledAt: new Date(date),
      timeSlot: slot,
      phone,
      paymentMethod: 'CASH', // Cash on Delivery
      couponCode,
      totalPrice: subtotal,
      discountApplied: discount,
      finalPrice: total
    };

    const res = await createBooking(payload);
    if (res.success) {
      // Calculate mock arrival time (9 minutes from now)
      const now = new Date();
      now.setMinutes(now.getMinutes() + 9);
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      let hrs = now.getHours() % 12;
      hrs = hrs ? hrs : 12;
      const mins = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();

      addNotification('Booking Confirmed!', `Your instant service request Ref #${res.booking.id.substring(0,8).toUpperCase()} is placed! Pay Cash After Service.`);
      setCheckoutBooking({
        ...res.booking,
        arrivalTime: `${hrs}:${mins} ${ampm}`
      });
      setShowCheckout(true);
      clearCart();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in font-inter">
      <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 border-l border-slate-100 flex flex-col justify-between animate-slide-in relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-brand" />
            <h3 className="font-poppins font-extrabold text-sm text-slate-800">
              Selected Services ({items.length})
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================== CART ITEMS / FIELDS LISTS ==================== */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 px-1">
          {items.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              Your service cart is empty. Add services from the brochure.
            </div>
          ) : (
            <>
              {/* Added services list */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-poppins font-extrabold text-slate-800 block">
                        {item.service.name}
                        {item.variant && <span className="text-[10px] text-brand ml-1.5 font-bold">({item.variant})</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">Price: Rs. {item.price.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 rounded-md">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2.5 py-1 text-slate-500 font-bold hover:bg-slate-50">-</button>
                        <span className="px-2 font-black text-slate-700">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2.5 py-1 text-slate-500 font-bold hover:bg-slate-50">+</button>
                      </div>
                      
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Service Area / Pincode Feasibility Check */}
              <form onSubmit={handlePincode} className="space-y-2">
                <div className="flex gap-2">
                  <div className="form-group flex-1">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Pincode"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      required 
                    />
                    <label className="form-label flex items-center"><MapPin className="w-3.5 h-3.5 text-brand mr-1" /> Anchepalya Pincode</label>
                  </div>
                  <button type="submit" className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-200 max-h-[44px]">Check</button>
                </div>
                {isPincodeValid ? (
                  <span className="text-[10px] text-cyan-600 font-bold flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Service feasible! Step-progress dispatcher active in Anchepalya.</span>
                ) : (
                  <span className="text-[10px] text-red-500 font-bold flex items-center">⚠️ Service unfeasible. We serve Anchepalya (560073) only.</span>
                )}
              </form>

              {/* Scheduling Coordinates (Date / Slot) */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                  <Clock className="w-4 h-4 text-brand mr-1" /> Service Scheduling Coordinates
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400">Date:</span>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border border-slate-200 rounded bg-white outline-none font-bold" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400">Time Slot:</span>
                    <select value={slot} onChange={e => setSlot(e.target.value)} className="p-2 border border-slate-200 rounded bg-white outline-none font-bold">
                      <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                      <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col space-y-1 pt-1.5">
                  <span className="text-[10px] text-slate-400">Doorstep Delivery Address (Anchepalya):</span>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="p-2 border border-slate-200 rounded bg-white outline-none text-[11px] leading-normal min-h-[50px]"></textarea>
                </div>
              </div>

              {/* Dynamic Coupon Codes Engine */}
              <form onSubmit={handleCoupon} className="flex gap-2">
                <div className="form-group flex-1">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Coupon"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                  />
                  <label className="form-label flex items-center"><Tag className="w-3.5 h-3.5 text-brand mr-1" /> Promo Coupon Code</label>
                </div>
                <button type="submit" className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-200 max-h-[44px]">Apply</button>
              </form>
              {couponMsg && <div className="text-[10px] text-brand font-bold -mt-3">{couponMsg}</div>}
            </>
          )}
        </div>

        {/* ==================== BOTTOM INVOICE BREAKDOWN ==================== */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-cyan-600 font-semibold">
                  <span>Promo Coupon Discount</span>
                  <span>- Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Platform Dispatch Fee</span>
                <span>Rs. {platformFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-poppins font-black text-brand text-sm">
                <span>Total Invoice Due</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleBooking}
              className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs py-3.5 rounded-lg shadow-md shadow-brand/20 transition-all uppercase tracking-wider"
            >
              Checkout Service Booking
            </button>
          </div>
        )}

        {/* ==================== SECURE CHECKOUT PAYMENTS MODAL ==================== */}
        {showCheckout && checkoutBooking && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-slate-800">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center animate-scale-up space-y-6">
              
              <div className="w-16 h-16 rounded-full bg-brand/15 border border-brand/20 text-brand flex items-center justify-center animate-bounce">
                <CheckCircle className="w-9 h-9 fill-current text-brand" />
              </div>

              <div className="space-y-1">
                <h3 className="font-poppins font-black text-base text-slate-800">Booking Confirmed!</h3>
                <p className="text-xs text-slate-400 font-semibold font-poppins">Reference ID: #{checkoutBooking.id.substring(0, 8).toUpperCase()}</p>
              </div>

              {/* Pay After Service Badge */}
              <div className="w-full bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex items-center space-x-2 text-cyan-800 text-left">
                <ShieldCheck className="w-5 h-5 text-cyan-600 fill-cyan-100 flex-shrink-0" />
                <div className="leading-none">
                  <span className="font-poppins font-black text-xs uppercase tracking-wide block">Pay After Service Active</span>
                  <span className="text-[9.5px] font-semibold text-cyan-600 mt-0.5 block">Zero prepayment required</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full text-left space-y-2 text-xs leading-normal">
                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Date:</span>
                  <span className="font-extrabold text-slate-700">{new Date(checkoutBooking.scheduledAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="font-extrabold text-slate-700">{checkoutBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Arrival:</span>
                  <span className="font-extrabold text-brand">{checkoutBooking.arrivalTime || 'In 9 Minutes'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-extrabold text-cyan-600 font-bold uppercase">Cash on Delivery / COD</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-poppins font-black text-slate-800">
                  <span>Total Amount Due:</span>
                  <span>Rs. {checkoutBooking.finalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs py-3 rounded-lg uppercase tracking-wider shadow-sm transition-all"
                >
                  Track Booking (Dashboard)
                </button>
                <a
                  href={`https://wa.me/918431588235?text=Hello%20JK%20Enterprises%2C%20I%20want%20to%20query%20my%20booking%20Ref%20%23${checkoutBooking.id.substring(0, 8).toUpperCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 font-poppins font-black text-xs py-3 rounded-lg uppercase tracking-wider text-center block transition-all"
                >
                  WhatsApp Support Chat
                </a>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    onClose();
                  }}
                  className="w-full bg-transparent hover:bg-slate-50 border border-slate-200 text-slate-600 font-poppins font-bold text-xs py-3 rounded-lg uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
