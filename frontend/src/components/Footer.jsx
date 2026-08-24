import React from 'react';
import { Award, Phone, Mail, Send } from 'lucide-react';

export default function Footer({ onOpenDemo }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: '16px' }}>
              <div className="logo-icon" style={{ background: '#2563EB', color: '#FFFFFF' }}><Award size={22} /></div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                <span style={{ color: '#FFFFFF' }}>ZK-</span>
                <span style={{ color: '#60A5FA' }}>Tenders</span>
              </span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
              We are a group of professionals specializing in custom software development, web development, mobile app development, IoT base solutions, web design, graphics & Enterprise solutions provided by <strong>C Net Technologies</strong>.
            </p>
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
              📍 423, Satyam Mall, Nr. Vishweshwar Mahadev Temple, Satellite, Ahmedabad – 380015, Gujarat
            </div>
          </div>

          <div className="footer-col">
            <h4>About Us</h4>
            <ul className="footer-links">
              <li><a href="https://www.tenderdetail.com/Subscriptions-Benefits" target="_blank" rel="noreferrer">Subscriptions & Benefits</a></li>
              <li><a href="https://www.tenderdetail.com/Feedback" target="_blank" rel="noreferrer">Feedback</a></li>
              <li><a href="https://www.tenderdetail.com/Complaints" target="_blank" rel="noreferrer">Complaints</a></li>
              <li><a href="https://www.tenderdetail.com/franchises" target="_blank" rel="noreferrer">Franchisee</a></li>
              <li><a href="https://www.tenderdetail.com/Career" target="_blank" rel="noreferrer">Careers With Us</a></li>
              <li><a href="https://www.tenderdetail.com/cancellation-refund" target="_blank" rel="noreferrer">Cancellation & Refund</a></li>
              <li><a href="https://www.tenderdetail.com/Contact-Us" target="_blank" rel="noreferrer">Contact Us</a></li>
              <li><a href="https://www.tenderdetail.com/faq" target="_blank" rel="noreferrer">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Browse Tenders</h4>
            <ul className="footer-links">
              <li><a href="https://www.tenderdetail.com/StateTenders/List" target="_blank" rel="noreferrer">State Tenders</a></li>
              <li><a href="https://www.tenderdetail.com/City-tenders" target="_blank" rel="noreferrer">City Tenders</a></li>
              <li><a href="https://www.tenderdetail.com/Authority-tenders" target="_blank" rel="noreferrer">Authority Tenders</a></li>
              <li><a href="https://www.tenderdetail.com/Tenders-By-Keywords" target="_blank" rel="noreferrer">Tenders By Keywords</a></li>
              <li><a href="https://www.tenderdetail.com/Country-tenders" target="_blank" rel="noreferrer">Country Tenders</a></li>
              <li><a href="https://www.tenderdetail.com/blog" target="_blank" rel="noreferrer">Blog</a></li>
              <li><a href="https://www.tenderdetail.com/Sitemap" target="_blank" rel="noreferrer">Site Map</a></li>
              <li><a href="https://www.tenderdetail.com/td-resources/tenders-archive" target="_blank" rel="noreferrer">Tenders Archive</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>For Sales Inquiry</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <a href="tel:+917778048217" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: 'var(--accent-gold-bright)', fontSize: '1.1rem' }}>
                <Phone size={18} /> +91-777 804 8217
              </a>
              <a href="mailto:sales@tenderdetail.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                <Mail size={18} /> sales@tenderdetail.com
              </a>
            </div>
            <button onClick={() => onOpenDemo('Sales Inquiry')} className="btn btn-primary full-width">
              <Send size={16} /> Send Sales Inquiry
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            Copyright © 2026 · All Rights Reserved · 
            <a href="https://www.tenderdetail.com/TermsOfUsage" target="_blank" rel="noreferrer">Terms of Usage</a> | 
            <a href="https://www.tenderdetail.com/PrivacyPolicy" target="_blank" rel="noreferrer">Privacy Policy</a>
          </div>
          <div>
            For Tender Information Services Visit : <a href="https://www.tenderdetail.com/" target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontWeight: 700 }}>ZK-Tenders</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
