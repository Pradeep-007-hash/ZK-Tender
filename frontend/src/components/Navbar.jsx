import React, { useState, useEffect, useRef } from 'react';
import { Award, LogIn, LogOut, ChevronDown, Flag, BarChart2, Globe, HelpingHand, Landmark, KeyRound, FolderKanban, Info, CreditCard, LayoutDashboard, FileText, Search, X, ChevronRight, ShieldCheck } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';

export default function Navbar({ user, onOpenLogin, onLogout, onOpenDashboard }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (toggleMenuRef.current && !toggleMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const headerMenuItems = [
    { title: 'Indian Tenders', icon: Flag, link: 'https://www.tenderdetail.com/Indian-Tenders', badge: 'Live Feed', color: '#2563EB' },
    { title: 'Tender Results', icon: Award, link: 'https://www.tenderdetail.com/tender-results', badge: 'Latest', color: '#059669' },
    { title: 'Tender By Category', icon: FolderKanban, link: '#categories', isScroll: true, color: '#D97706' },
    { title: 'Login', icon: LogIn, action: () => onOpenLogin(), badge: 'Account', color: '#7C3AED' },
    { title: 'Request for Sample Tenders', icon: FileText, link: 'https://www.tenderdetail.com/request-sample-tender', color: '#2563EB' },
    { title: 'Advance Search', icon: Search, link: '#search', isScroll: true, color: '#0B3B60' },
    { title: 'Pay Now', icon: CreditCard, link: 'https://www.tenderdetail.com/pay-online', badge: 'Instant', color: '#EA580C' },
    { title: 'Competitive Bid Analysis', icon: BarChart2, link: 'https://www.tenderdetail.com/competitive-bid-analysis', badge: 'AI Powered', color: '#0284C7' },
    { title: 'Tender Bidding Support', icon: HelpingHand, link: 'https://www.tenderdetail.com/bidding-consultancy', color: '#059669' },
    { title: 'MSME Loan Apply', icon: Landmark, link: 'https://www.tenderdetail.com/msme-loan', badge: 'Fast Sanction', color: '#D97706' }
  ];

  return (
    <nav className="navbar" style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 10px rgba(0, 0, 0, 0.04)' }}>
      <div className="container">
        <div 
          className="logo-header-group" 
          ref={toggleMenuRef} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
        >
          {/* Animated Menu Toggle Button */}
          <div 
            className="menu-toggle-trigger"
            onClick={() => setMenuOpen(!menuOpen)}
            onMouseEnter={() => setMenuOpen(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <input 
              type="checkbox" 
              id="checkbox" 
              checked={menuOpen} 
              readOnly
            />
            <label className="toggle" title="Toggle Quick Navigation Menu" style={{ cursor: 'pointer' }}>
              <div className="bars" id="bar1"></div>
              <div className="bars" id="bar2"></div>
              <div className="bars" id="bar3"></div>
            </label>
          </div>

          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="logo-icon" style={{ background: '#2563EB', color: '#FFFFFF' }}>
              <Award size={24} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#0B3B60' }}>ZK-</span>
              <span style={{ color: '#2563EB' }}>Tenders</span>
            </span>
          </a>

          {/* HEADER MENU DROPDOWN BOX */}
          {menuOpen && (
            <div 
              className="header-dropdown-box"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '320px',
                maxHeight: '480px',
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(11, 59, 96, 0.2)',
                zIndex: 1000,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', textTransform: 'uppercase', color: '#64748B', paddingLeft: '8px', paddingBottom: '6px', fontWeight: 700, borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                Quick Access Navigation
              </div>

              {headerMenuItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={idx}
                    href={item.link || '#'}
                    target={item.link && item.link.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    onClick={(e) => {
                      if (item.action) {
                        e.preventDefault();
                        item.action();
                        setMenuOpen(false);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#0F172A',
                      textDecoration: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EFF6FF';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>

                    <span style={{ flex: 1, color: '#1E293B' }}>{item.title}</span>

                    {item.badge && (
                      <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}33` }}>
                        {item.badge}
                      </span>
                    )}

                    <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <ul className="nav-links">
          {/* SERVICES DROPDOWN */}
          <li className={`nav-item-dropdown ${dropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
            <a 
              href="#services" 
              className="nav-link dropdown-toggle"
              onClick={(e) => { e.preventDefault(); setDropdownOpen(!dropdownOpen); }}
            >
              Services <ChevronDown size={14} />
            </a>
            <div className="dropdown-menu">
              <a href="https://www.tenderdetail.com/Indian-Tenders" target="_blank" rel="noreferrer" className="dropdown-item">
                <Flag size={20} />
                <div>
                  <span className="dropdown-title">Indian Tenders</span>
                  <span className="dropdown-desc">Central & State Portal Tenders</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/competitive-bid-analysis" target="_blank" rel="noreferrer" className="dropdown-item">
                <BarChart2 size={20} />
                <div>
                  <span className="dropdown-title">Competitive Bid Analysis</span>
                  <span className="dropdown-desc">AI Competitor Pricing Strategy</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/Tender-Results" target="_blank" rel="noreferrer" className="dropdown-item">
                <Award size={20} />
                <div>
                  <span className="dropdown-title">Tender Results</span>
                  <span className="dropdown-desc">Historical L1 Bidding Archive</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/Global-Tenders" target="_blank" rel="noreferrer" className="dropdown-item">
                <Globe size={20} />
                <div>
                  <span className="dropdown-title">Global Tenders</span>
                  <span className="dropdown-desc">5,22,799+ International Bids</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/tender-bidding-consultancy-services" target="_blank" rel="noreferrer" className="dropdown-item">
                <HelpingHand size={20} />
                <div>
                  <span className="dropdown-title">Tender Bidding Support</span>
                  <span className="dropdown-desc">End-to-End Bid Preparation</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/msme-loan-apply" target="_blank" rel="noreferrer" className="dropdown-item">
                <Landmark size={20} />
                <div>
                  <span className="dropdown-title">MSME Loan Apply</span>
                  <span className="dropdown-desc">Financial Assistance & Loans</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/digital-signature-certificate" target="_blank" rel="noreferrer" className="dropdown-item">
                <KeyRound size={20} />
                <div>
                  <span className="dropdown-title">Digital Certificate</span>
                  <span className="dropdown-desc">Class 3 DSC Sign & Encrypt</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/Projects" target="_blank" rel="noreferrer" className="dropdown-item">
                <FolderKanban size={20} />
                <div>
                  <span className="dropdown-title">Projects</span>
                  <span className="dropdown-desc">Upcoming Major Contracts</span>
                </div>
              </a>
              <a href="https://www.tenderdetail.com/tender-information-services" target="_blank" rel="noreferrer" className="dropdown-item" style={{ gridColumn: 'span 2' }}>
                <Info size={20} />
                <div>
                  <span className="dropdown-title">Tender Information Services</span>
                  <span className="dropdown-desc">Daily Automated Email & WhatsApp Opportunity Alerts</span>
                </div>
              </a>
            </div>
          </li>

          <li>
            <a 
              href="https://www.tenderdetail.com/pricing" 
              target="_blank" 
              rel="noreferrer" 
              className="nav-link"
            >
              Subscription Plan
            </a>
          </li>

          <li>
            <a 
              href="https://www.tenderdetail.com/pay-online" 
              target="_blank" 
              rel="noreferrer" 
              className="nav-link"
              style={{ fontWeight: 700, color: '#D97706' }}
            >
              <CreditCard size={15} /> Pay Now
            </a>
          </li>
        </ul>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <WalletConnectButton user={user} lightTheme={true} />

              <div className="user-profile-badge" onClick={onOpenDashboard} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={user.avatar} alt={user.name} className="user-avatar-img" />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>{user.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.62rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }} title="Session Protected: Auto-logout after 15 minutes of inactivity">
                    <ShieldCheck size={10} color="#059669" /> 15m Auto-Logout Active
                  </span>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.confirm("Are you sure you want to log out of your account?")) {
                      onLogout(); 
                    }
                  }} 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.72rem', marginLeft: '4px' }}
                  title="Sign Out"
                >
                  <LogOut size={11} /> Exit
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={onOpenLogin} 
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', height: '34px' }}
            >
              <LogIn size={14} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
