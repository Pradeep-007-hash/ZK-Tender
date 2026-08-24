import React, { useState } from 'react';
import { UserCheck, LogIn } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onSubmitSuccess, onOpenRegister }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitSuccess) {
      onSubmitSuccess(`Welcome back! Successfully logged in as ${email}.`);
    }
    setEmail('');
    setPass('');
    onClose();
  };

  return (
    <div className="modal-backdrop active">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close">&times;</button>
        <div className="section-badge" style={{ marginBottom: '12px' }}>
          <UserCheck size={14} /> ACCOUNT LOGIN
        </div>
        <h3 className="feature-title" style={{ marginBottom: '8px' }}>Login to ZK-Tenders</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Access live tenders, saved alerts, and competitive bid intelligence.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label htmlFor="loginEmail">Email / Username *</label>
            <input type="text" id="loginEmail" className="modal-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. vikas@company.com" required />
          </div>

          <div className="modal-form-group">
            <label htmlFor="loginPass">Password *</label>
            <input type="password" id="loginPass" className="modal-input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--header-bg)' }} /> Remember me
            </label>
            <a href="#" style={{ color: 'var(--accent-blue)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); if (onSubmitSuccess) onSubmitSuccess('Password reset link sent to your registered email.'); }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary full-width">
            <LogIn size={16} /> Sign In to Dashboard
          </button>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account? <a href="#" style={{ color: 'var(--accent-gold)', fontWeight: 700 }} onClick={(e) => { e.preventDefault(); onClose(); if (onOpenRegister) onOpenRegister('New Registration'); }}>Register Now</a>
          </div>
        </form>
      </div>
    </div>
  );
}
