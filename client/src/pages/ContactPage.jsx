import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, Compass, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Us - JK Enterprises';
  }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-inter py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 text-brand rounded-2xl mb-4 shadow-sm border border-brand/20">
            <Mail className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900 tracking-tight">
            Contact Us
          </h1>
          <p className="mt-3 text-slate-500 text-sm font-medium max-w-lg mx-auto">
            Have a question, feedback, or need booking assistance? Get in touch with our team. We are here to help 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Official details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-left space-y-8">
              <h3 className="font-poppins font-black text-lg text-slate-900">
                Official Business Info
              </h3>

              <div className="space-y-6">
                
                {/* Entity Name */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Registered Entity Name</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">JK Enterprises</span>
                    <span className="text-xs text-slate-500 block mt-0.5">(Jaya Ketana Enterprises)</span>
                  </div>
                </div>

                {/* Helpline */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Customer Care Hotline</span>
                    <a href="tel:+918431588235" className="text-sm font-bold text-slate-800 hover:text-brand transition-colors block mt-0.5">
                      +91 8431588235
                    </a>
                  </div>
                </div>

                {/* Email Support */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Email Support</span>
                    <a href="mailto:jayaketanaenterprises@gmail.com" className="text-sm font-bold text-slate-800 hover:text-brand transition-colors block mt-0.5 break-all">
                      jayaketanaenterprises@gmail.com
                    </a>
                  </div>
                </div>

                {/* Physical Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Registered & Physical Address</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5 leading-relaxed">
                      Anchepalya Tumkur Main Road, Anchepalya, prestige Jindal City, Bengaluru, Karnataka – 560073
                    </span>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Operating Hours</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">
                      Open 24/7 (Emergency Dispatch Hub)
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-left">
              <h3 className="font-poppins font-black text-lg text-slate-900 mb-6">
                Send Us a Message
              </h3>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl flex items-start space-x-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-poppins font-black text-sm text-emerald-900">Message Received Successfully!</h4>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Thank you for contacting JK Enterprises. A member of our support team will reply to your email address within 2 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-slate-700" 
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-slate-700" 
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Subject</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-slate-700" 
                      placeholder="Question about booking #12345"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Message Details</label>
                    <textarea 
                      required
                      rows="5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-slate-700" 
                      placeholder="Write your query details here..."
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-md shadow-brand/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Submit Query</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
