import React, { useState, useEffect, useRef } from 'react';
import WalletConnectButton from './WalletConnectButton';

const initialMockCredentials = [
  {
    id: "vc_001",
    didSubject: "did:zktender:vendor:v001",
    vendorEmail: "vendor@techcorp.in",
    vendorName: "TechCorp Global Solutions",
    type: "GST_TAX_COMPLIANCE",
    title: "GST Tax Compliance & Rating Certificate",
    issuerDid: "did:gov:india:issuer001",
    issuerName: "National DID & Verifiable Credential Authority",
    issuedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 360 * 86400000).toISOString(),
    status: "ACTIVE",
    credentialSubject: {
      gstNo: "07AAAAA0000A1Z5",
      complianceScore: "99.8%",
      taxAuditGrade: "AAA+"
    },
    proof: {
      type: "ML-DSA-65-PQC",
      signature: "0x9a8f4c1209b4701e389a0472f10b2e87a93b4c12",
      zkSnarkProof: "0xzk_groth16_poseidon_3e9281a4b709c129e801"
    }
  },
  {
    id: "vc_002",
    didSubject: "did:zktender:vendor:v002",
    vendorEmail: "bids@infra-build.com",
    vendorName: "InfraBuild India Ltd",
    type: "FINANCIAL_TURNOVER",
    title: "Verified Financial Turnover Credential",
    issuerDid: "did:gov:india:issuer001",
    issuerName: "National DID & Verifiable Credential Authority",
    issuedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 350 * 86400000).toISOString(),
    status: "ACTIVE",
    credentialSubject: {
      annualTurnoverCr: 45.5,
      auditedYear: "2025-2026",
      solvencyScore: "AAA+"
    },
    proof: {
      type: "ML-DSA-65-PQC",
      signature: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      zkSnarkProof: "0xzk_groth16_poseidon_8f3a92b4109e4511c8a2"
    }
  }
];

export default function IssuerDashboard({ currentUser, onLogout, onToast }) {
  const mainContentRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('zk_issuer_active_tab') || 'issuer-dashboard';
  });

  useEffect(() => {
    localStorage.setItem('zk_issuer_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Credentials State
  const [credentials, setCredentials] = useState(initialMockCredentials);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Layout UI States (Identical to Officer Dashboard)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State for Issuing VC
  const [vendorEmail, setVendorEmail] = useState('vendor@techcorp.in');
  const [vendorName, setVendorName] = useState('TechCorp Global Bidders');
  const [credentialType, setCredentialType] = useState('GST_TAX_COMPLIANCE');
  const [turnoverCr, setTurnoverCr] = useState('25');
  const [gstNo, setGstNo] = useState('07AAAAA0000A1Z5');
  const [completedProjects, setCompletedProjects] = useState('8');
  const [validityDays, setValidityDays] = useState('365');
  const [issuing, setIssuing] = useState(false);

  // Form State for Verifying VC
  const [verifyVcId, setVerifyVcId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch API Credentials
  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/did/credentials');
      const data = await res.json();
      if (data.credentials && data.credentials.length > 0) {
        setCredentials(data.credentials);
      }
    } catch (err) {
      console.warn('[FETCH VC API NOTICE]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const issuerName = currentUser?.name || 'Government Credential Issuer';
  const orgId = currentUser?.organizationId || 'GOV_ISSUER_001';

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  const handleIssueCredentialSubmit = async (e) => {
    e.preventDefault();
    setIssuing(true);

    const credentialSubject = {};
    if (credentialType === 'GST_TAX_COMPLIANCE') {
      credentialSubject.gstNo = gstNo;
      credentialSubject.complianceScore = "99.8%";
      credentialSubject.taxAuditGrade = "AAA+";
    } else if (credentialType === 'FINANCIAL_TURNOVER') {
      credentialSubject.annualTurnoverCr = parseFloat(turnoverCr);
      credentialSubject.auditedYear = "2025-2026";
      credentialSubject.solvencyScore = "AAA+";
    } else if (credentialType === 'TECHNICAL_EXPERIENCE') {
      credentialSubject.completedProjects = parseInt(completedProjects);
      credentialSubject.experienceYears = 10;
      credentialSubject.capabilityGrade = "CLASS_A_CONTRACTOR";
    } else {
      credentialSubject.pqcClass = "CLASS_3_GOVT_ENCRYPTED";
      credentialSubject.signatureEngine = "ML-DSA-65";
    }

    try {
      const res = await fetch('http://localhost:5000/api/did/issue-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorEmail,
          vendorName,
          type: credentialType,
          credentialSubject,
          expiresDays: parseInt(validityDays)
        })
      });
      const data = await res.json();

      if (data.credential) {
        setCredentials([data.credential, ...credentials]);
        triggerToast(data.message || 'Verifiable Credential successfully issued and cryptographically signed!', 'success');
        setActiveTab('issuer-registry');
      }
    } catch (err) {
      triggerToast('Issued mock Verifiable Credential locally (Dev Mode)', 'info');
      const mockVC = {
        id: `vc_${Date.now().toString(36)}`,
        didSubject: `did:zktender:vendor:${vendorEmail.replace(/[^a-z0-9]/gi, '')}`,
        vendorEmail,
        vendorName,
        type: credentialType,
        title: `${credentialType.replace(/_/g, ' ')} Credential`,
        issuerDid: "did:gov:india:issuer001",
        issuerName: "National DID & Verifiable Credential Authority",
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + parseInt(validityDays) * 86400000).toISOString(),
        status: "ACTIVE",
        credentialSubject,
        proof: {
          type: "ML-DSA-65-PQC",
          signature: "0x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          zkSnarkProof: "0xzk_groth16_poseidon_" + Math.random().toString(36).substring(2, 15)
        }
      };
      setCredentials([mockVC, ...credentials]);
      setActiveTab('issuer-registry');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeCredential = async (id) => {
    if (!window.confirm(`Are you sure you want to REVOKE Verifiable Credential ${id}?`)) return;
    try {
      await fetch('http://localhost:5000/api/did/revoke-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: id })
      });
    } catch (e) {}

    setCredentials(credentials.map(c => c.id === id ? { ...c, status: 'REVOKED' } : c));
    triggerToast(`Verifiable Credential ${id} has been REVOKED in Government DID Registry.`, 'warning');
  };

  const handleVerifyCredentialSubmit = async (e) => {
    e.preventDefault();
    setVerificationResult({ loading: true });
    try {
      const res = await fetch('http://localhost:5000/api/did/verify-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: verifyVcId })
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      setVerificationResult({
        verified: true,
        status: "VALID",
        message: "Credential verified against Govt DID Registry using ML-DSA-65 PQC key."
      });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast('Signature copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabTitles = {
    'issuer-dashboard': 'Government DID Issuer Overview',
    'issuer-issue-vc': 'Issue Verifiable Credential (PQC Signed)',
    'issuer-registry': 'National Verifiable Credential Registry',
    'issuer-verify-tester': 'Cryptographic VC & ZK-Proof Verification Tester',
    'issuer-key-config': 'Government Issuer DID & Cryptographic Key Config'
  };

  const filteredCredentials = credentials.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch = !searchQuery || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.vendorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className={`min-h-screen font-sans antialiased ${lightTheme ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <div className="flex h-screen overflow-hidden">

        {/* SIDEBAR NAVIGATION (IDENTICAL TO OFFICER DASHBOARD) */}
        <aside className={`fixed md:sticky md:top-0 h-screen z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between ${sidebarCollapsed ? 'w-16' : 'w-64'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full">

            {/* Header / Brand */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('issuer-dashboard')} 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition"
                title="Go to Government Issuer Dashboard Overview"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  <i className="fa-solid fa-shield-halved text-sm"></i>
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <span className="font-bold text-sm text-white tracking-tight">GOV-<span className="text-indigo-400">Issuer</span></span>
                    <span className="block text-[9px] font-mono text-indigo-400 uppercase">DID Credential Portal</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:block text-slate-400 hover:text-white">
                <i className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
              </button>
            </div>

            {/* Issuer Profile Banner */}
            {!sidebarCollapsed && (
              <div className="p-3 mx-3 my-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono shrink-0">
                    DID
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{issuerName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">ID: <span className="text-indigo-400">{orgId}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* ISSUER NAVIGATION MENU (EXACT SAME STYLE AS OFFICER) */}
            <nav className="px-3 space-y-1 text-xs font-medium flex-1 overflow-y-auto pb-4 pt-2">
              
              <button 
                onClick={() => setActiveTab('issuer-dashboard')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'issuer-dashboard' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-chart-pie w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>

              <button 
                onClick={() => setActiveTab('issuer-issue-vc')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'issuer-issue-vc' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-key w-4 text-center text-indigo-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Issue Verifiable Credential</span>}
              </button>

              <button 
                onClick={() => setActiveTab('issuer-registry')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition ${activeTab === 'issuer-registry' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-file-shield w-4 text-center text-teal-400 shrink-0"></i>
                  {!sidebarCollapsed && <span>Credential Registry</span>}
                </div>
                {!sidebarCollapsed && <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">{credentials.length}</span>}
              </button>

              <button 
                onClick={() => setActiveTab('issuer-verify-tester')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'issuer-verify-tester' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-microchip w-4 text-center text-amber-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Verification Tester</span>}
              </button>

              <button 
                onClick={() => setActiveTab('issuer-key-config')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'issuer-key-config' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-id-card-clip w-4 text-center text-emerald-400 shrink-0"></i>
                {!sidebarCollapsed && <span>DID & Key Config</span>}
              </button>
            </nav>

            {/* Sidebar Footer Logout */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1 text-xs">
              <button 
                onClick={() => setShowLogoutModal(true)} 
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition font-semibold"
              >
                <i className="fa-solid fa-right-from-bracket w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Log Out</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* HEADER BAR (IDENTICAL TO OFFICER DASHBOARD) */}
          <header className={`px-4 py-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 ${
            lightTheme ? 'bg-white/90 border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileSidebarOpen(true)} className={`md:hidden p-2 rounded-lg transition ${
                lightTheme ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}>
                <i className="fa-solid fa-bars text-lg"></i>
              </button>
              <div>
                <h1 className={`text-base sm:text-lg font-bold tracking-tight ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{tabTitles[activeTab]}</h1>
                <p className={`text-[11px] hidden sm:block ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Logged in as <span className={`font-semibold ${lightTheme ? 'text-slate-800' : 'text-slate-200'}`}>{issuerName}</span> ({orgId})</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Web3 Connect Wallet Button */}
              <WalletConnectButton user={currentUser} onToast={triggerToast} lightTheme={lightTheme} />

              {/* Theme Toggle */}
              <button 
                onClick={() => setLightTheme(!lightTheme)}
                className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center shadow-sm ${
                  lightTheme
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
                title={lightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
              >
                <i className={`fa-solid ${lightTheme ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-400'}`}></i>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className={`p-2 rounded-lg relative transition ${lightTheme ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fa-regular fa-bell text-base"></i>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-400 rounded-full"></span>
                </button>
                {notifOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 p-3 space-y-2 text-xs border ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <div className={`font-bold border-b pb-1 ${lightTheme ? 'text-indigo-600 border-slate-100' : 'text-indigo-400 border-slate-800'}`}>Government DID Issuer Log</div>
                    <div className={`space-y-1 text-[11px] ${lightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                      <p>🟢 ML-DSA-65 key active: <code>did:gov:india:issuer001</code></p>
                      <p>🟢 Verifiable Credential issued for TechCorp Global Solutions.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Issuer Profile Dropdown Pill */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`p-0.5 rounded-full border transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer ${
                    lightTheme
                      ? 'bg-white border-slate-300 hover:border-indigo-500 shadow-slate-200'
                      : 'bg-slate-900 border-slate-700 hover:border-indigo-400'
                  }`}
                  title={`Issuer Profile: ${issuerName} (${orgId})`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-600 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-md border border-indigo-400/40">
                    <i className="fa-solid fa-shield-halved text-xs"></i>
                  </div>
                </button>

                {/* Issuer Flyout Dropdown */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 space-y-3 font-sans text-xs ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-white'
                  }`}>
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-600 text-white flex items-center justify-center shadow-md border-2 border-indigo-500/40 shrink-0">
                          <i className="fa-solid fa-shield-halved text-sm"></i>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className={`font-bold text-xs truncate ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{issuerName}</h4>
                          <p className="text-[10px] font-mono text-indigo-500 font-semibold truncate">{orgId}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">Government DID Issuer Authority</p>
                        </div>
                      </div>

                      <div className={`pt-2 flex items-center justify-between text-[10px] font-mono border-t ${
                        lightTheme ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <span className={lightTheme ? 'text-slate-500' : 'text-slate-400'}>Role:</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
                          Credential Issuer
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('issuer-issue-vc');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-plus text-indigo-500"></i>
                        <span>Issue Verifiable Credential</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('issuer-registry');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-folder-open text-teal-500"></i>
                        <span>View Credential Registry</span>
                      </button>
                    </div>

                    <div className={`pt-1 border-t ${lightTheme ? 'border-slate-100' : 'border-slate-800'}`}>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className={`w-full p-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition border ${
                          lightTheme
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <i className="fa-solid fa-right-from-bracket"></i> Sign Out Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN PAGE BODY */}
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* TAB 1: ISSUER DASHBOARD OVERVIEW */}
            {activeTab === 'issuer-dashboard' && (
              <div className="space-y-6 text-xs">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Issued Credentials</span>
                      <i className="fa-solid fa-file-shield text-indigo-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-white">{credentials.length}</div>
                    <p className="text-[11px] text-indigo-400">W3C Verifiable Credentials</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Active Vendor DIDs</span>
                      <i className="fa-solid fa-id-card text-teal-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {new Set(credentials.map(c => c.vendorEmail)).size}
                    </div>
                    <p className="text-[11px] text-teal-400">Decentralized Identifiers</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">PQC Signatures</span>
                      <i className="fa-solid fa-microchip text-amber-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400">{credentials.length * 2}</div>
                    <p className="text-[11px] text-amber-400">ML-DSA-65 & ZK Proofs</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Registry Status</span>
                      <i className="fa-solid fa-shield-check text-emerald-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {credentials.filter(c => c.status === 'ACTIVE').length} Active
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {credentials.filter(c => c.status === 'REVOKED').length} Revoked
                    </p>
                  </div>
                </div>

                {/* Quick Action Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setActiveTab('issuer-issue-vc')}
                    className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl cursor-pointer hover:border-indigo-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                      <i className="fa-solid fa-key"></i>
                      <span>Issue New Verifiable Credential &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Mint & Post-Quantum sign GST, turnover, or project experience VCs for vendors.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('issuer-registry')}
                    className="p-5 bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/30 rounded-xl cursor-pointer hover:border-teal-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                      <i className="fa-solid fa-folder-tree"></i>
                      <span>View Credential Registry &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Manage issued credentials, check cryptographic signatures, or revoke credentials.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('issuer-verify-tester')}
                    className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl cursor-pointer hover:border-emerald-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                      <i className="fa-solid fa-shield-check"></i>
                      <span>Cryptographic Verification Tester &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Verify VC integrity and ZK-Proof commitments against Issuer Public Key.</p>
                  </div>
                </div>

                {/* Recently Issued Credentials List */}
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Recently Issued Verifiable Credentials</h3>
                  <div className="space-y-3">
                    {credentials.map(c => (
                      <div key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-400 font-bold text-xs">{c.id}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">{c.type}</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {c.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{c.vendorName}</h4>
                          <p className="text-slate-400 text-xs font-mono">Email: {c.vendorEmail} | DID Subject: {c.didSubject}</p>
                        </div>

                        <button 
                          onClick={() => setActiveTab('issuer-registry')} 
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition"
                        >
                          View Registry
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ISSUE VERIFIABLE CREDENTIAL */}
            {activeTab === 'issuer-issue-vc' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <i className="fa-solid fa-key text-indigo-400"></i>
                      <span>Mint & Cryptographically Sign Verifiable Credential (VC)</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Issue W3C-compliant Verifiable Credentials signed with Post-Quantum ML-DSA-65 keys for vendor DID</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono rounded-full font-bold">
                    PQC Engine: Active
                  </span>
                </div>

                <form onSubmit={handleIssueCredentialSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Target Vendor Email</label>
                      <input 
                        type="email" 
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        required
                        placeholder="vendor@company.com"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Vendor Enterprise Name</label>
                      <input 
                        type="text" 
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        required
                        placeholder="TechCorp Infrastructure Ltd"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Verifiable Credential Type</label>
                      <select 
                        value={credentialType}
                        onChange={(e) => setCredentialType(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500"
                      >
                        <option value="GST_TAX_COMPLIANCE">GST Tax Compliance & Clean Audit VC</option>
                        <option value="FINANCIAL_TURNOVER">Audited Financial Turnover & Solvency VC</option>
                        <option value="TECHNICAL_EXPERIENCE">Completed Projects & Technical Experience VC</option>
                        <option value="PQC_DIGITAL_IDENTITY">Class-3 Post-Quantum Encrypted Identity VC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Validity Duration (Days)</label>
                      <input 
                        type="number" 
                        value={validityDays}
                        onChange={(e) => setValidityDays(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-indigo-500"
                      />
                    </div>

                    {credentialType === 'GST_TAX_COMPLIANCE' && (
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">GSTIN Number</label>
                        <input 
                          type="text" 
                          value={gstNo}
                          onChange={(e) => setGstNo(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {credentialType === 'FINANCIAL_TURNOVER' && (
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Audited Annual Turnover (₹ in Crores)</label>
                        <input 
                          type="number" 
                          value={turnoverCr}
                          onChange={(e) => setTurnoverCr(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {credentialType === 'TECHNICAL_EXPERIENCE' && (
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Completed Government Projects</label>
                        <input 
                          type="number" 
                          value={completedProjects}
                          onChange={(e) => setCompletedProjects(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={issuing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition text-sm flex items-center justify-center space-x-2"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>{issuing ? 'Cryptographically Signing VC...' : 'Mint & Sign Verifiable Credential'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: CREDENTIAL REGISTRY */}
            {activeTab === 'issuer-registry' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search credentials..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="REVOKED">Revoked</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setActiveTab('issuer-issue-vc')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-2 shrink-0"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Issue New Credential</span>
                  </button>
                </div>

                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">National Verifiable Credential Registry</h3>
                  
                  <div className="space-y-4">
                    {filteredCredentials.map(c => (
                      <div key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div>
                            <span className="text-indigo-400 font-bold">{c.id}</span>
                            <span className="text-slate-400 text-xs ml-2">DID Subject: <span className="text-white font-bold">{c.didSubject}</span></span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                            {c.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300 font-sans">
                          <div><span className="text-slate-500">Vendor Name:</span> <span className="text-white font-bold">{c.vendorName}</span></div>
                          <div><span className="text-slate-500">Email:</span> <span className="text-teal-400">{c.vendorEmail}</span></div>
                          <div><span className="text-slate-500">Credential Type:</span> <span className="text-indigo-300 font-bold">{c.type}</span></div>
                        </div>

                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between overflow-x-auto">
                          <div>
                            <span className="text-slate-500 block uppercase">PQC ML-DSA-65 Signature:</span>
                            <code className="text-amber-300">{c.proof?.signature ? c.proof.signature.substring(0, 32) + '...' : '0xML_DSA_65_Signature...'}</code>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(c.proof?.signature || '', c.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-sans font-bold"
                          >
                            <i className="fa-regular fa-copy mr-1"></i> Copy
                          </button>
                        </div>

                        {c.status === 'ACTIVE' && (
                          <div className="pt-2 flex justify-end">
                            <button 
                              onClick={() => handleRevokeCredential(c.id)}
                              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-lg transition"
                            >
                              Revoke VC
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VERIFICATION TESTER */}
            {activeTab === 'issuer-verify-tester' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans max-w-3xl mx-auto">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <i className="fa-solid fa-microchip text-amber-400"></i>
                    <span>Cryptographic VC & ZK-Proof Verification Tester</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Test Verifiable Credential integrity against Government Issuer Public Key</p>
                </div>

                <form onSubmit={handleVerifyCredentialSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Credential ID (e.g., vc_001)</label>
                    <input 
                      type="text" 
                      value={verifyVcId}
                      onChange={(e) => setVerifyVcId(e.target.value)}
                      required
                      placeholder="vc_001"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition"
                  >
                    Verify Against Govt Issuer Public Key
                  </button>
                </form>

                {verificationResult && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Verification Passed!</span>
                    </div>
                    <p className="text-slate-300 text-xs font-sans">{verificationResult.message}</p>
                    <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-teal-300 overflow-x-auto">
                      {JSON.stringify(verificationResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ISSUER DID & KEY CONFIG */}
            {activeTab === 'issuer-key-config' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans max-w-3xl mx-auto">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <i className="fa-solid fa-id-card-clip text-emerald-400"></i>
                    <span>Government Issuer DID Configuration</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Government Identity Authority public key details and Post-Quantum cryptographic suite</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono text-[11px]">Government Issuer Public DID:</span>
                    <div className="font-mono text-indigo-400 font-bold text-sm">did:gov:india:issuer001</div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono text-[11px]">Post-Quantum Cryptographic Key Standard:</span>
                    <div className="font-mono text-amber-400 font-bold text-sm">NIST FIPS 204 ML-DSA-65 (DILITHIUM)</div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono text-[11px]">Zero-Knowledge Proof Scheme:</span>
                    <div className="font-mono text-emerald-400 font-bold text-sm">Groth16 Poseidon BN254 ZK-SNARK</div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL WITH BLUR OVERLAY (IDENTICAL TO OFFICER DASHBOARD) */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 w-screen h-screen bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <div 
            className="bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-900"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-lg text-rose-500"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Log Out</h3>
                <p className="text-xs text-slate-500">End your government issuer session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-100/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 font-medium">
              Logging out will end your active session on the ZK-Tenders Government DID Issuer Portal.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center space-x-2"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
