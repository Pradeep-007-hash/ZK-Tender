import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function DemoModal({ isOpen, onClose, initialService, onSubmitSuccess }) {
  const [service, setService] = useState(initialService || 'Competitive Bid Analysis');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitSuccess) {
      onSubmitSuccess(`Thank you ${name}! Your demo request for "${service}" has been received. Our sales executive will call you at ${phone} within 24 hours.`);
    }
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    onClose();
  };

  return (
    <div className="modal-backdrop active">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close">&times;</button>
        <div className="section-badge" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} /> AI DEMO & CONSULTANCY REQUEST
        </div>
        <h3 className="feature-title" style={{ marginBottom: '8px' }}>
          {service ? `Request: ${service}` : 'Request Competitive Bid Analysis Demo'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Get pricing intelligence, competitor insights, and expert bid assistance for your target tenders.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label htmlFor="reqName">Contact Person Name *</label>
            <input type="text" id="reqName" className="modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vikas Rathod" required />
          </div>

          <div className="modal-form-group">
            <label htmlFor="reqEmail">Official Email *</label>
            <input type="email" id="reqEmail" className="modal-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vikas@company.com" required />
          </div>

          <div className="modal-form-group">
            <label htmlFor="reqPhone">Phone / WhatsApp Number *</label>
            <input type="tel" id="reqPhone" className="modal-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>

          <div className="modal-form-group">
            <label htmlFor="reqCompany">Company / Enterprise Name</label>
            <input type="text" id="reqCompany" className="modal-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Global Solutions Pvt. Ltd." />
          </div>

          <button type="submit" className="btn btn-primary full-width" style={{ marginTop: '10px' }}>
            Submit Demo Request →
          </button>
        </form>
      </div>
    </div>
  );
}
