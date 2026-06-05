import React, { useEffect } from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function ShippingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Shipping & Delivery Policy - JK Enterprises';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 text-brand rounded-2xl mb-4 shadow-sm border border-brand/20">
            <Truck className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900 tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="mt-3 text-slate-500 text-sm font-medium">
            Last updated: June 5, 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8 text-left text-sm leading-relaxed text-slate-600">
          
          <p>
            This Shipping & Delivery Policy applies to the services ordered through <strong>JK Enterprises</strong> (also referred to as "Jaya Ketana Enterprises") on our website.
          </p>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>1. Delivery Mode (Home Service Execution)</span>
            </h3>
            <p>
              JK Enterprises is a service-based platform providing home cleaning, home care, electrical, plumbing, shifting, and painting services. 
            </p>
            <p>
              Therefore, **no physical shipping or packaging** of goods takes place. All service delivery is performed live by dispatching verified service professionals directly to the customer's specified home address.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>2. Delivery Address Constraints</span>
            </h3>
            <p>
              Services are only delivered within our active operational boundaries in **Bengaluru, Karnataka, India**. 
            </p>
            <p>
              At checkout, users must input a valid pincode within our active list (e.g. Anchepalya - 560073). Any bookings placed for addresses outside our active delivery sectors will be rejected, and online payments refunded instantly.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>3. Dispatch Timelines and SLA</span>
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs font-semibold text-slate-500">
              <li>
                <strong>Scheduled Bookings:</strong> The assigned service worker will arrive at your premises within the specific time slot selected during checkout (e.g. 09:00 AM - 10:00 AM).
              </li>
              <li>
                <strong>Emergency Booking Dispatches:</strong> We guarantee worker dispatch within <strong>9 minutes</strong> under our service level agreement (SLA) for emergency service requests in our base location (Prestige Jindal City & Anchepalya corridor).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>4. Service Completion & Verification</span>
            </h3>
            <p>
              Once the home service is executed, the professional will submit a completion request. You will receive a confirmation code or status update on your Customer Dashboard. A digital service invoice is immediately updated in your profile under the "Bookings" list.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>5. Delivery Questions</span>
            </h3>
            <p>
              For inquiries about service dispatch, worker tracking, or scheduling adjustments:
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 text-xs font-semibold text-slate-700">
              <p>Entity Name: JK Enterprises</p>
              <p>Support Email: jayaketanaenterprises@gmail.com</p>
              <p>Contact Phone: +91 8431588235</p>
              <p>Address: Anchepalya Tumkur Main Road, Anchepalya, prestige Jindal City, Bengaluru – 560073</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
