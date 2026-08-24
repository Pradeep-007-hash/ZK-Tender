import React, { useState } from 'react';
import { Cpu, CheckCircle2, Send, ShieldCheck, PhoneCall } from 'lucide-react';

export default function AiPlatform({ onOpenDemo }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onOpenDemo) onOpenDemo('Competitive Bid Analysis');
      setSubmitted(false);
      setFormData({ fullName: '', email: '', phone: '', company: '', message: '' });
    }, 2000);
  };

  return (
    <section id="ai-platform" className="ai-platform-blue-section">
      <div className="container">
        <div className="ai-blue-grid">
          
          {/* LEFT SIDE: TEXT CONTENT */}
          <div className="ai-left-content">
            <div className="ai-blue-badge">
              <Cpu size={16} /> ZK-DRIVEN TENDER INTELLIGENCE PLATFORM
            </div>

            <h2 className="ai-blue-title">
              Stop Guessing.<br />
              <span className="gradient-gold">Start Winning Tenders</span> — Intelligently.
            </h2>

            <p className="ai-blue-desc">
              Competitive Bid Analysis that transforms tender data into pricing intelligence, competitor insights, and winning strategies.
            </p>

            <p className="ai-blue-highlight">
              Most tenders are lost before submission. We make sure yours isn’t.
            </p>

            <div className="ai-blue-checklist">
              <div className="blue-check-item">
                <CheckCircle2 size={20} color="#34D399" />
                <span>Built for EPCs & PSU Vendors</span>
              </div>
              <div className="blue-check-item">
                <CheckCircle2 size={20} color="#34D399" />
                <span>Data-backed decisions</span>
              </div>
              <div className="blue-check-item">
                <CheckCircle2 size={20} color="#34D399" />
                <span>Response within 24 hours</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: CONTACT FORM CARD */}
          <div className="ai-contact-form-card">
            <div className="form-card-header">
              <PhoneCall size={22} className="form-header-icon" />
              <div>
                <h3>Request Free Demo & Call Back</h3>
                <p>Get personalized pricing & competitor bid analysis</p>
              </div>
            </div>

            {submitted ? (
              <div className="form-success-box">
                <ShieldCheck size={40} color="#10B981" />
                <h4>Inquiry Submitted!</h4>
                <p>Our tender intelligence specialist will reach out to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ai-contact-form">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input 
                    type="text" 
                    id="fullName" 
                    name="fullName" 
                    required 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    placeholder="Enter your full name" 
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="email">Work Email *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="name@company.com" 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      required 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company / Organization Name</label>
                  <input 
                    type="text" 
                    id="company" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleChange} 
                    placeholder="e.g. Acme Infra Pvt Ltd" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Tender Details / Inquiry Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="3" 
                    value={formData.message} 
                    onChange={handleChange} 
                    placeholder="Mention specific tender ID or requirements..." 
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-emerald btn-full">
                  <Send size={16} /> Submit Request & Get Call Back
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
