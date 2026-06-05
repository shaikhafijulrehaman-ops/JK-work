import React, { useEffect } from 'react';
import { ShieldAlert, Key, Eye, Lock } from 'lucide-react';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy - JK Enterprises';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 text-brand rounded-2xl mb-4 shadow-sm border border-brand/20">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-slate-500 text-sm font-medium">
            Last updated: June 5, 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8 text-left text-sm leading-relaxed text-slate-600">
          
          <p>
            At <strong>JK Enterprises</strong> (also referred to as "Jaya Ketana Enterprises"), we prioritize the privacy and security of our customers and visitors. This Privacy Policy describes how we collect, use, process, and protect your personal information when you use our website, mobile application, and home care services.
          </p>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>1. Information We Collect</span>
            </h3>
            <p>
              We collect information that helps us deliver a customized, high-quality service experience:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs font-semibold text-slate-500">
              <li><strong>Personal Identifiers:</strong> Name, email address, mobile phone number, and physical home address.</li>
              <li><strong>Billing Information:</strong> Payment transactions are handled securely via our PCI-DSS compliant partner <strong>Razorpay</strong>. We do not store card numbers, PINs, or netbanking passwords on our servers.</li>
              <li><strong>Location Data:</strong> Pincode and location coordinates to match your booking request with our nearest available service worker.</li>
              <li><strong>Technical Logs:</strong> IP addresses, browser types, operating systems, and device identifiers collected automatically through cookies and system audits.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>2. How We Use Your Information</span>
            </h3>
            <p>
              Your personal details are used strictly for service enablement and security verification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs font-semibold text-slate-500">
              <li>To create and manage your secure customer account.</li>
              <li>To process payments, manage booking billing, and issue invoices.</li>
              <li>To dispatch the correct service professional to your physical address.</li>
              <li>To send service alerts, verification codes (OTPs), and dashboard notifications.</li>
              <li>To maintain our Admin Audit Ledger for transaction security and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>3. Data Sharing and Third-Party Disclosures</span>
            </h3>
            <p>
              We do not sell, trade, or rent your personal information to marketing brokers. We only share details with authorized third parties necessary to execute your service:
            </p>
            <p>
              - <strong>Service Workers:</strong> Assigned specialists receive your name, address, phone number, and booking instructions.
            </p>
            <p>
              - <strong>Payment Gateways:</strong> Payment details are transmitted securely to <strong>Razorpay</strong> for processing.
            </p>
            <p>
              - <strong>Legal Compliance:</strong> We may disclose information if required to do so by applicable laws of India or in response to direct court orders.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>4. Data Security</span>
            </h3>
            <p>
              We implement industry-standard cryptographic techniques (SSL/TLS encryption) to secure data in transit. All user sessions are authenticated using JSON Web Tokens (JWT) and stored securely. Audit logging keeps a strict record of all login events, payment success, and profile changes to prevent database compromises.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>5. Cookies and Tracking Technologies</span>
            </h3>
            <p>
              Our website uses cookies to store login session indicators, preserve items in your service cart, and optimize page load speeds. You can configure your browser to reject cookies, though some features (such as staying logged in) will cease to function.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>6. Your Rights</span>
            </h3>
            <p>
              You have the right to request access to the personal information we hold about you, request corrections to incorrect phone numbers/addresses, or request account deactivation. To do so, please contact us at our support coordinates.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-brand rounded-full"></span>
              <span>7. Privacy Support Contact</span>
            </h3>
            <p>
              For privacy-related inquiries, data requests, or complaints:
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
