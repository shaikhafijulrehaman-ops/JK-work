import React, { useEffect } from 'react';
import { RefreshCcw, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

export default function RefundPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Refund & Cancellation Policy - JK Enterprises';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 text-brand rounded-2xl mb-4 shadow-sm border border-brand/20">
            <RefreshCcw className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900 tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-3 text-slate-500 text-sm font-medium">
            Last updated: June 5, 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8 text-left text-sm leading-relaxed text-slate-600">
          
          <p>
            At <strong>JK Enterprises</strong> (also referred to as "Jaya Ketana Enterprises"), we strive to deliver professional, reliable home care services. We understand that plans can change, and we have formulated a clear, customer-friendly Refund & Cancellation Policy to handle cancellations and refund requests transparently.
          </p>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>1. Booking Cancellations</span>
            </h3>
            <p>
              Customers can request to cancel their scheduled service bookings directly from the <strong>Bookings</strong> page inside the Customer Dashboard or by contacting our customer support team at +91 8431588235.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs font-semibold text-slate-500">
              <li>
                <strong>Cancellations made more than 2 hours before the scheduled time slot:</strong> Entitled to a full (100%) refund of any advance payments.
              </li>
              <li>
                <strong>Cancellations made within 2 hours of the scheduled time slot:</strong> Subject to a nominal late cancellation fee of ₹150 to compensate the assigned service worker for their travel coordinates and holding slot.
              </li>
              <li>
                <strong>Cancellation once the worker has reached the premises:</strong> Subject to a call-out fee of ₹250.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>2. Eligibility for Refunds</span>
            </h3>
            <p>
              Refunds are issued automatically in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs font-semibold text-slate-500">
              <li>When a booking is cancelled by the customer outside the late-cancellation window.</li>
              <li>In the rare event that JK Enterprises cancels a booking due to worker unavailability, extreme weather conditions, or service issues.</li>
              <li>If the service completed is verified to be deficient after an inspection by our quality control lead.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>3. Refund Processing Timelines</span>
            </h3>
            <p>
              All refund requests are verified instantly. Once approved, the refund is initiated through our payment gateway partner, <strong>Razorpay</strong>:
            </p>
            <p>
              - Refunds will be credited back directly to the **original payment source** (e.g. UPI ID, credit/debit card, or bank account) used during checkout.
            </p>
            <p>
              - The time taken for the amount to reflect in your account is usually **5 to 7 working days**, depending on your issuing bank's clearing cycle.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>4. Cash Payments (COS)</span>
            </h3>
            <p>
              For payments made via Cash on Service (COS), refunds are not processed online. If there is a dispute or deficiency, our support team will inspect the case and credit equivalent cash coupons/tokens directly to the customer's wallet or execute bank transfers manually.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>5. Support and Dispute Resolution</span>
            </h3>
            <p>
              If you have not received your refund within 7 working days, or if you wish to raise a quality complaint regarding a service booking, please email us with your booking ID and receipt coordinates:
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
