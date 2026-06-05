import React, { useEffect } from 'react';
import { ShieldCheck, BookOpen, Scale, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms & Conditions - JK Enterprises';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 text-brand rounded-2xl mb-4 shadow-sm border border-brand/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-slate-500 text-sm font-medium">
            Last updated: June 5, 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8 text-left text-sm leading-relaxed text-slate-600">
          
          <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-4 flex items-start space-x-3 text-cyan-900">
            <AlertCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold">
              Please read these terms and conditions carefully before using our platform. By accessing or using the services provided by JK Enterprises, you agree to be bound by these terms.
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>1. Operations and Service Agreement</span>
            </h3>
            <p>
              This website is operated by <strong>JK Enterprises</strong> (also referred to as "Jaya Ketana Enterprises"). Throughout the site, the terms "we", "us" and "our" refer to JK Enterprises. We offer home care, deep cleaning, security, baby care, cooking, house shifting, and technical services (plumbing, electrical) subject to your acceptance of all terms, conditions, policies, and notices stated here.
            </p>
            <p>
              Our services are available to registered users residing in our active service zones in Bengaluru (specifically Anchepalya, Tumkur Road, and neighboring zones). Services are carried out by verified service professionals.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>2. Accounts and Registration</span>
            </h3>
            <p>
              To book a service, you are required to register an account with us. You must provide complete, accurate, and current information, including your mobile number, email, and home address. You are solely responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p>
              If we detect any unauthorized or suspicious activity under your account, we reserve the right to suspend or terminate access immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>3. Payments, Pricing, and Invoicing</span>
            </h3>
            <p>
              All pricing listed on our services page is in Indian Rupees (INR) and inclusive of applicable taxes, unless stated otherwise. We reserve the right to modify pricing at any time without prior notice, though modifications will not affect already confirmed bookings.
            </p>
            <p>
              Payments can be made online via secure payment gateways integrated into the checkout flow (UPI, Debit/Credit Card, and Netbanking powered by <strong>Razorpay</strong>) or via Cash on Service (COS). Invoices are generated automatically upon successful service booking and can be managed directly in the Customer Dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>4. Service Execution and SLA Guarantee</span>
            </h3>
            <p>
              We guarantee a dispatch time of 9 minutes for emergency service bookings in active zones, subject to weather conditions, traffic constraints, and worker availability. The assigned worker will verify their credentials upon arrival at your physical address.
            </p>
            <p>
              You must ensure a safe working environment for our service partners. Any harassment, unsafe working conditions, or illegal activity will result in instant cancellation of the service without refund and may be reported to law enforcement.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>5. Intellectual Property</span>
            </h3>
            <p>
              The content, design, code, graphics, and layout of this platform are protected by copyright, trademark, and intellectual property laws of India. Any unauthorized reproduction, distribution, or commercial exploitation of our content is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>6. Governing Law & Dispute Resolution</span>
            </h3>
            <p>
              These Terms & Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction resting in the courts of <strong>Bengaluru, Karnataka</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>7. Contact Information</span>
            </h3>
            <p>
              Questions about these Terms & Conditions should be sent to us at:
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
