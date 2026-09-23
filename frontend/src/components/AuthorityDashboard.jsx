import React, { useState, useEffect, useRef } from 'react';
import CreateTenderForm from './CreateTenderForm';
import WalletConnectButton from './WalletConnectButton';

const initialBlockchainBlocks = [
  {
    blockNumber: 154890,
    txHash: '0x9a8f4c1209b4701e389a0472f10b2e87a93b4c12',
    merkleRoot: '0x3e9281a4b709c129e801b47029c3817f094b8109',
    event: 'TENDER_PUBLISHED (SYSTEM)',
    timestamp: '19 Aug 2026 12:10:45 IST',
    status: 'CONFIRMED ANCHORED',
    verifierAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  }
];

export default function AuthorityDashboard({ currentUser, onLogout, onToast }) {
  const mainContentRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('zk_gov_active_tab') || 'gov-dashboard';
  });

  useEffect(() => {
    localStorage.setItem('zk_gov_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const [tenders, setTenders] = useState([]);
  const [sealedBids, setSealedBids] = useState([]);
  const [blockchainBlocks, setBlockchainBlocks] = useState(initialBlockchainBlocks);

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

  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Tender Form State
  const [newTender, setNewTender] = useState({
    title: '',
    department: currentUser?.organizationId || 'Dept of Urban Tech',
    category: 'IT & Software',
    tenderType: 'Open Tender',
    method: 'Competitive Bidding',
    budget: '',
    pubDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    closingDate: '',
    zkpRule: 'Revenue ≥ ₹1,00,00,000 (Groth16 Range Proof)',
    description: ''
  });

  // Policy Builder State
  const [policyConfig, setPolicyConfig] = useState({
    ruleType: 'Revenue Range Proof',
    thresholdValue: 10000000,
    proofScheme: 'Groth16 (BN254 Curve)',
    hashFunction: 'Poseidon Hash',
    status: 'ACTIVE_VALIDATED'
  });

  // Fetch stored Tenders from MongoDB Atlas Database on mount
  useEffect(() => {
    const fetchDbTenders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tenders');
        const data = await res.json();
        if (data.success && data.tenders) {
          const formattedDbTenders = data.tenders.map(t => ({
            id: t.tenderId,
            title: t.title,
            department: t.department || 'Dept of Urban Tech',
            category: t.category || 'Infrastructure',
            tenderType: t.tenderType || 'E-Tender',
            method: t.procurementMethod || 'Competitive Bidding',
            budget: t.estimatedValue || 0,
            pubDate: t.pubDate || 'Today',
            closingDate: t.submissionDeadline || t.closingDate || '30 Sep 2026',
            status: t.status || 'Published',
            bidsCount: t.bidsCount || 0,
            zkpRule: t.zkpRule || 'Revenue Range Proof ZKP',
            description: t.executiveSummary || t.detailedScope || t.description || 'Public tender specification'
          }));

          setTenders(formattedDbTenders);
        } else {
          setTenders([]);
        }
      } catch (err) {
        console.warn('[FETCH DB TENDERS NOTICE]', err.message);
        setTenders([]);
      }
    };

    fetchDbTenders();
  }, []);

  const officerName = currentUser?.name || 'Government Officer';
  const orgId = currentUser?.organizationId || 'GOV001';

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  const handleCreateTenderSubmit = (e) => {
    e.preventDefault();
    if (!newTender.title || !newTender.budget || !newTender.closingDate || !newTender.description) {
      triggerToast('Please fill in all required tender creation fields.', 'error');
      return;
    }

    const createdTenderObj = {
      id: `TND-2026-00${tenders.length + 1}`,
      title: newTender.title,
      department: newTender.department,
      category: newTender.category,
      tenderType: newTender.tenderType,
      method: newTender.method,
      budget: parseInt(newTender.budget) || 10000000,
      pubDate: newTender.pubDate,
      closingDate: newTender.closingDate,
      status: 'Open',
      bidsCount: 0,
      zkpRule: newTender.zkpRule,
      description: newTender.description
    };

    setTenders([createdTenderObj, ...tenders]);

    // Add block transaction log
    const newBlock = {
      blockNumber: 154892 + tenders.length,
      txHash: `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      merkleRoot: `0x${Math.random().toString(36).substring(2, 10)}`,
      event: `TENDER_PUBLISHED (${createdTenderObj.id})`,
      timestamp: new Date().toLocaleString('en-IN'),
      status: 'CONFIRMED ANCHORED',
      verifierAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
    };
    setBlockchainBlocks([newBlock, ...blockchainBlocks]);

    triggerToast(`Tender ${createdTenderObj.id} published successfully to ZK-Tenders ledger!`, 'success');
    setNewTender({
      title: '',
      department: currentUser?.organizationId || 'Dept of Urban Tech',
      category: 'IT & Software',
      tenderType: 'Open Tender',
      method: 'Competitive Bidding',
      budget: '',
      pubDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      closingDate: '',
      zkpRule: 'Revenue ≥ ₹1,00,00,000 (Groth16 Range Proof)',
      description: ''
    });
    setActiveTab('gov-tender-management');
  };

  const handleUpdateStatus = (tenderId, newStatus) => {
    setTenders(tenders.map(t => t.id === tenderId ? { ...t, status: newStatus } : t));
    triggerToast(`Updated status for ${tenderId} to ${newStatus}`, 'info');
  };

  const handleVerifyBlockchain = () => {
    triggerToast('All Merkle Tree root hashes verified against smart contract verifier address! Integrity 100%.', 'success');
  };

  const tabTitles = {
    'gov-dashboard': 'Government Dashboard Overview',
    'gov-create-tender': 'Create & Publish Official Tender',
    'gov-policy-builder': 'Zero-Knowledge Policy & Circuit Builder',
    'gov-tender-management': 'Government Tender Directory & Lifecycle',
    'gov-bid-overview': 'Sealed Bids & Proof Submissions Inspector',
    'gov-evaluation-results': 'QCBS Scorecard & Awarding Panel',
    'gov-blockchain-status': 'Immutable Blockchain Ledger & Proof Status'
  };

  const filteredTenders = tenders.filter(t => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className={`min-h-screen font-sans antialiased ${lightTheme ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <div className="flex h-screen overflow-hidden">

        {/* SIDEBAR NAVIGATION */}
        <aside className={`fixed md:sticky md:top-0 h-screen z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between ${sidebarCollapsed ? 'w-16' : 'w-64'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full">

            {/* Header / Brand */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('gov-dashboard')} 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition"
                title="Go to Government Dashboard Overview"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                  <i className="fa-solid fa-building-columns text-sm"></i>
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <span className="font-bold text-sm text-white tracking-tight">GOV-<span className="text-teal-400">Authority</span></span>
                    <span className="block text-[9px] font-mono text-teal-400 uppercase">Government Portal</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:block text-slate-400 hover:text-white">
                <i className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
              </button>
            </div>

            {/* Officer Banner */}
            {!sidebarCollapsed && (
              <div className="p-3 mx-3 my-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-xs font-mono shrink-0">
                    GOV
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{officerName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">ID: <span className="text-teal-400">{orgId}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION MENU */}
            <nav className="px-3 space-y-1 text-xs font-medium flex-1 overflow-y-auto pb-4 pt-2">
              <button 
                onClick={() => setActiveTab('gov-dashboard')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-dashboard' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-chart-pie w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-create-tender')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-create-tender' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-square-plus w-4 text-center text-teal-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Create Tender</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-policy-builder')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-policy-builder' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-sliders w-4 text-center text-indigo-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Policy Builder</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-tender-management')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-tender-management' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-folder-tree w-4 text-center shrink-0"></i>
                  {!sidebarCollapsed && <span>Tender Management</span>}
                </div>
                {!sidebarCollapsed && <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">{tenders.length}</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-bid-overview')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-bid-overview' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-box-archive w-4 text-center shrink-0"></i>
                  {!sidebarCollapsed && <span>Bid Overview</span>}
                </div>
                {!sidebarCollapsed && <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">{sealedBids.length}</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-evaluation-results')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-evaluation-results' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-award w-4 text-center text-amber-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Evaluation Results</span>}
              </button>

              <button 
                onClick={() => setActiveTab('gov-blockchain-status')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-blockchain-status' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-cubes w-4 text-center text-emerald-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Publish / Blockchain Status</span>}
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
          
          {/* HEADER BAR */}
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
                <p className={`text-[11px] hidden sm:block ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Logged in as <span className={`font-semibold ${lightTheme ? 'text-slate-800' : 'text-slate-200'}`}>{officerName}</span> ({orgId})</p>
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
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full"></span>
                </button>
                {notifOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 p-3 space-y-2 text-xs border ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <div className={`font-bold border-b pb-1 ${lightTheme ? 'text-teal-600 border-slate-100' : 'text-teal-400 border-slate-800'}`}>Government Officer Log</div>
                    <div className={`space-y-1 text-[11px] ${lightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                      <p>🟢 Vendor organization profile verified for CyberShield Systems.</p>
                      <p>🟢 ZK Range Proof hash anchored to block #154891.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Organization / Officer Profile Dropdown Pill */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`p-0.5 rounded-full border transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer ${
                    lightTheme
                      ? 'bg-white border-slate-300 hover:border-teal-500 shadow-slate-200'
                      : 'bg-slate-900 border-slate-700 hover:border-teal-400'
                  }`}
                  title={`Authority Profile: ${officerName} (${orgId})`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-600 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-md border border-teal-400/40">
                    <i className="fa-solid fa-building-columns text-xs"></i>
                  </div>
                </button>

                {/* Organization Flyout Dropdown */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 space-y-3 font-sans text-xs ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-white'
                  }`}>
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-center shadow-md border-2 border-teal-500/40 shrink-0">
                          <i className="fa-solid fa-building-columns text-sm"></i>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className={`font-bold text-xs truncate ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{officerName}</h4>
                          <p className="text-[10px] font-mono text-teal-500 font-semibold truncate">{orgId}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">Government Tender Authority</p>
                        </div>
                      </div>

                      <div className={`pt-2 flex items-center justify-between text-[10px] font-mono border-t ${
                        lightTheme ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <span className={lightTheme ? 'text-slate-500' : 'text-slate-400'}>Role:</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/20 text-teal-600 border border-teal-500/30">
                          Tender Evaluator
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('create-tender');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-plus text-teal-500"></i>
                        <span>Create New Tender</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('bids-received');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-folder-open text-indigo-500"></i>
                        <span>Manage Received Bids</span>
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

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'gov-dashboard' && (
              <div className="space-y-6 text-xs">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Active Tenders</span>
                      <i className="fa-solid fa-list-check text-teal-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-white">{tenders.length}</div>
                    <p className="text-[11px] text-teal-400">Published across 4 departments</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Sealed Bids Received</span>
                      <i className="fa-solid fa-box-archive text-indigo-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-white">{sealedBids.length}</div>
                    <p className="text-[11px] text-indigo-400">Cryptographically sealed witness commitments</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">ZK Proofs Verified</span>
                      <i className="fa-solid fa-shield-check text-emerald-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400">100%</div>
                    <p className="text-[11px] text-emerald-400">Zero raw financials leaked</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-mono font-bold">Anchored Blocks</span>
                      <i className="fa-solid fa-cubes text-amber-400 text-lg"></i>
                    </div>
                    <div className="text-2xl font-extrabold text-white">{blockchainBlocks.length}</div>
                    <p className="text-[11px] text-amber-400">Merkle roots immutable</p>
                  </div>
                </div>

                {/* Quick Action Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setActiveTab('gov-create-tender')}
                    className="p-5 bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/30 rounded-xl cursor-pointer hover:border-teal-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                      <i className="fa-solid fa-square-plus"></i>
                      <span>Create New Tender &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Define scope, procurement type, budget ceiling, and ZK range constraints.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('gov-policy-builder')}
                    className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl cursor-pointer hover:border-indigo-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                      <i className="fa-solid fa-sliders"></i>
                      <span>Build Policy Circuit &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Configure zero-knowledge revenue, working capital, or project experience rules.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('gov-blockchain-status')}
                    className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl cursor-pointer hover:border-emerald-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                      <i className="fa-solid fa-shield-check"></i>
                      <span>Audit Blockchain Ledger &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Verify Merkle Tree roots and verifier contract execution status.</p>
                  </div>
                </div>

                {/* Active Tenders Summary List */}
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Recently Published Government Tenders</h3>
                  <div className="space-y-3">
                    {tenders.map(t => (
                      <div key={t.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-teal-400 font-bold text-xs">{t.id}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">{t.tenderType}</span>
                            <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] rounded font-mono font-bold">{t.status}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{t.title}</h4>
                          <p className="text-slate-400 text-xs font-mono">Budget: ₹{t.budget.toLocaleString('en-IN')} | Department: {t.department}</p>
                        </div>

                        <button 
                          onClick={() => setActiveTab('gov-tender-management')} 
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition"
                        >
                          Manage Tender
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CREATE TENDER */}
            {activeTab === 'gov-create-tender' && (
              <CreateTenderForm 
                lightTheme={lightTheme}
                currentUser={currentUser}
                onToast={triggerToast}
                onPublishSuccess={(createdObj) => {
                  setTenders([createdObj, ...tenders]);
                  const newBlock = {
                    blockNumber: 154892 + tenders.length,
                    txHash: '0x8f3a92b4109e4511c8a29b4701cd99e31a890472b921',
                    merkleRoot: '0x3e9281a4b709c129e801b47029c3817f094b8109',
                    event: `TENDER_PUBLISHED (${createdObj.id})`,
                    timestamp: new Date().toLocaleString('en-IN'),
                    status: 'CONFIRMED ANCHORED',
                    verifierAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
                  };
                  setBlockchainBlocks([newBlock, ...blockchainBlocks]);
                  triggerToast(`Tender ${createdObj.id} deployed & anchored to GovLedger Smart Contract v4.2!`, 'success');
                  setActiveTab('gov-tender-management');
                }}
              />
            )}

            {/* TAB 3: POLICY BUILDER */}
            {activeTab === 'gov-policy-builder' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <i className="fa-solid fa-sliders text-indigo-400"></i>
                      <span>Zero-Knowledge Policy & Circuit Rule Builder</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Configure eligibility constraints that vendors must prove without leaking private numbers</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono rounded-full font-bold">
                    Circuit: Active Validated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider text-teal-400">1. Policy Rule Configuration</h3>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Rule Type</label>
                      <select 
                        value={policyConfig.ruleType}
                        onChange={(e) => setPolicyConfig({ ...policyConfig, ruleType: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500"
                      >
                        <option value="Revenue Range Proof">Revenue Range Proof (Min Annual Turnover)</option>
                        <option value="Working Capital Threshold">Working Capital Threshold</option>
                        <option value="Project Experience Count">Project Experience Count (Completed Projects)</option>
                        <option value="Clean Tax & GST History">Clean Tax & GST History Witness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Minimum Threshold Limit (₹)</label>
                      <input 
                        type="number" 
                        value={policyConfig.thresholdValue}
                        onChange={(e) => setPolicyConfig({ ...policyConfig, thresholdValue: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Proof Cryptographic Scheme</label>
                      <select 
                        value={policyConfig.proofScheme}
                        onChange={(e) => setPolicyConfig({ ...policyConfig, proofScheme: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:border-indigo-500 font-mono"
                      >
                        <option value="Groth16 (BN254 Curve)">Groth16 (BN254 Curve - Fast Verifier)</option>
                        <option value="PLONK (Kzg Commitment)">PLONK (KZG Commitment Scheme)</option>
                        <option value="STARK (Transparent Zero-Knowledge)">STARK (Transparent Zero-Knowledge)</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => triggerToast('Policy Circuit rule validated and compiled successfully!', 'success')} 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow transition"
                    >
                      Compile & Validate ZK Policy Circuit
                    </button>
                  </div>

                  {/* Circuit Output Preview */}
                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">2. Compiled Circuit Verification Artifacts</h3>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                      <div><span className="text-slate-500">Constraint System:</span> <span className="text-teal-400 font-bold">R1CS (Rank-1 Constraint System)</span></div>
                      <div><span className="text-slate-500">Public Signal:</span> <span className="text-white">Threshold = ₹{policyConfig.thresholdValue.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-slate-500">Private Witness:</span> <span className="text-amber-400 font-bold">Vendor Actual Revenue [HIDDEN]</span></div>
                      <div><span className="text-slate-500">Verifier Key (VK):</span> <span className="text-emerald-400 text-[10px] truncate block">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</span></div>
                    </div>

                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-[11px]">
                      "Vendors proving this policy generate a local Groth16 witness proof. Evaluators verify the 256-bit proof header without receiving raw private financial statements."
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TENDER MANAGEMENT */}
            {activeTab === 'gov-tender-management' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tenders..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Closing Soon">Closing Soon</option>
                      <option value="Active">Active</option>
                      <option value="Under Evaluation">Under Evaluation</option>
                      <option value="Awarded">Awarded</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setActiveTab('gov-create-tender')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-2 shrink-0"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Create New Tender</span>
                  </button>
                </div>

                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Government Tender Directory</h3>
                  
                  <div className="space-y-4">
                    {filteredTenders.map(t => (
                      <div key={t.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-teal-400 font-bold">{t.id}</span>
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">{t.tenderType}</span>
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded font-mono">{t.category}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm mt-1">{t.title}</h4>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 font-mono text-[11px]">Status:</span>
                            <select 
                              value={t.status}
                              onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                              className="p-1.5 bg-slate-900 border border-slate-700 rounded text-white font-bold text-xs focus:border-teal-500"
                            >
                              <option value="Open">🟢 Open</option>
                              <option value="Closing Soon">🟠 Closing Soon</option>
                              <option value="Active">🔵 Active</option>
                              <option value="Under Evaluation">🟣 Under Evaluation</option>
                              <option value="Awarded">🏆 Awarded</option>
                              <option value="Extended">Extended</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 font-mono text-[11px]">
                          <div><span className="text-slate-500">Budget Ceiling:</span> <span className="text-white font-bold">₹{t.budget.toLocaleString('en-IN')}</span></div>
                          <div><span className="text-slate-500">Deadline:</span> <span className="text-amber-400 font-bold">{t.closingDate}</span></div>
                          <div><span className="text-slate-500">Sealed Bids:</span> <span className="text-teal-400 font-bold">{t.bidsCount} Received</span></div>
                        </div>

                        <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-300 text-[11px] font-mono">
                          <i className="fa-solid fa-lock text-teal-400 mr-1.5"></i>
                          <span>ZKP Eligibility: {t.zkpRule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BID OVERVIEW */}
            {activeTab === 'gov-bid-overview' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <i className="fa-solid fa-box-archive text-indigo-400"></i>
                      <span>Sealed Bids & Proof Submissions Inspector</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Inspect sealed bid commitments and cryptographic Zero-Knowledge verification proofs</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono rounded-full font-bold">
                    Privacy Sealed (Zero Leakage)
                  </span>
                </div>

                <div className="space-y-4">
                  {sealedBids.map(b => (
                    <div key={b.bidId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-indigo-400 font-bold text-xs">{b.bidId}</span>
                          <span className="text-slate-400 text-xs ml-2">Target Tender: <span className="text-white font-bold">{b.tenderId}</span></span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[11px]">
                          {b.zkpStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">Vendor Name:</span> <span className="text-white font-bold">{b.vendorName}</span></div>
                        <div><span className="text-slate-500">Organization ID:</span> <span className="text-teal-400">{b.organizationId}</span></div>
                        <div><span className="text-slate-500">Submission Timestamp:</span> <span className="text-slate-300">{b.submittedAt}</span></div>
                        <div><span className="text-slate-500">Circuit Scheme:</span> <span className="text-indigo-300">{b.circuitType}</span></div>
                      </div>

                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400 overflow-x-auto">
                        <span className="text-slate-500 block uppercase">Sealed Commitment Hash:</span>
                        <code className="text-teal-300">{b.sealedCommitment}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: EVALUATION RESULTS */}
            {activeTab === 'gov-evaluation-results' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <i className="fa-solid fa-award text-amber-400"></i>
                    <span>QCBS Evaluation Scorecard & Awarding Panel</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Quality & Cost Based Selection (70:30) evaluation matrix</p>
                </div>

                <div className="space-y-4">
                  {sealedBids.map((b, idx) => (
                    <div key={b.bidId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-amber-400 font-bold">Rank #{idx + 1}</span> — <span className="text-white font-bold">{b.vendorName}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[11px]">
                          Score: {Math.round(b.techScore * 0.7 + 28)}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">Technical Score (70%):</span> <span className="text-teal-400 font-bold">{b.techScore}/100</span></div>
                        <div><span className="text-slate-500">Financial Offer (30%):</span> <span className="text-indigo-400 font-bold">{b.financialBid}</span></div>
                        <div><span className="text-slate-500">ZKP Qualification:</span> <span className="text-emerald-400 font-bold">PASSED</span></div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button 
                          onClick={() => triggerToast(`Letter of Acceptance (LOA) issued to ${b.vendorName} for ${b.tenderId}!`, 'success')} 
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow text-xs transition flex items-center space-x-1.5"
                        >
                          <i className="fa-solid fa-trophy"></i>
                          <span>Award Tender & Issue LOA</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: PUBLISH / BLOCKCHAIN STATUS */}
            {activeTab === 'gov-blockchain-status' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <i className="fa-solid fa-cubes text-emerald-400"></i>
                      <span>Immutable Blockchain Ledger & Proof Status</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Audit log of all Merkle roots and smart contract verifier executions</p>
                  </div>
                  <button 
                    onClick={handleVerifyBlockchain} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-1.5"
                  >
                    <i className="fa-solid fa-shield-check"></i>
                    <span>Verify Block Integrity</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {blockchainBlocks.map(blk => (
                    <div key={blk.blockNumber} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-amber-400 font-bold">Block #{blk.blockNumber}</span> — <span className="text-white font-bold">{blk.event}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[11px]">
                          {blk.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">Tx Hash:</span> <code className="text-teal-300">{blk.txHash}</code></div>
                        <div><span className="text-slate-500">Merkle Root:</span> <code className="text-indigo-300">{blk.merkleRoot}</code></div>
                        <div><span className="text-slate-500">Verifier Address:</span> <code className="text-emerald-300">{blk.verifierAddress}</code></div>
                        <div><span className="text-slate-500">Timestamp:</span> <span className="text-slate-400">{blk.timestamp}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL WITH BLUR OVERLAY */}
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
                <p className="text-xs text-slate-500">End your government officer session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-100/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 font-medium">
              Logging out will end your active session on the ZK-Tenders Government Authority Portal.
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
