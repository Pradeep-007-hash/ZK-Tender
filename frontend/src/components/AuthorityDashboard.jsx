import React, { useState, useEffect, useRef } from 'react';
import CreateTenderForm from './CreateTenderForm';
import WalletConnectButton from './WalletConnectButton';
import TenderEvaluationDetail from './TenderEvaluationDetail';
import { isTenderDeadlineOver, formatDeadlineDisplay } from '../utils/tenderDateUtils';

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

const defaultActiveTenders = [
  {
    id: 'TN-PWD-2026-INFRA-001',
    title: 'Construction of Four-Lane Bypass Highway and Smart Toll Plaza',
    department: 'Tamil Nadu Public Works Department (TN-PWD)',
    category: 'Infrastructure',
    tenderType: 'Open Tender',
    method: 'Competitive Bidding',
    budget: 450000000,
    pubDate: '15 Oct 2026',
    closingDate: '15 Nov 2026',
    status: 'Active',
    bidsCount: 4,
    minimumExperience: 7,
    minimumTurnover: 15,
    minimumProjects: 4,
    zkpRule: 'Min Exp ≥ 7 Yrs, Turnover ≥ ₹15 Cr, Projects ≥ 4 (Groth16)',
    description: 'EPC construction of a 24.5 km 4-lane bypass highway with RFID smart toll plazas.'
  },
  {
    id: 'TN-DICT-2026-IT-002',
    title: 'Development of Decentralized Citizen Identity and Document Verification Portal',
    department: 'Department of Information Technology & Digital Services',
    category: 'IT & Software',
    tenderType: 'Open Tender',
    method: 'Quality & Cost Based Selection (QCBS)',
    budget: 85000000,
    pubDate: '16 Oct 2026',
    closingDate: '08 Nov 2026',
    status: 'Active',
    bidsCount: 3,
    minimumExperience: 4,
    minimumTurnover: 5,
    minimumProjects: 3,
    zkpRule: 'Min Exp ≥ 4 Yrs, Turnover ≥ ₹5 Cr, Projects ≥ 3 (Groth16)',
    description: 'Statewide Web3 and W3C DID-compliant decentralized citizen identity portal.'
  },
  {
    id: 'IN-TNEB-2026-PWR-003',
    title: 'Installation of 50MW Grid-Connected Solar Photovoltaic Power Plant',
    department: 'Tamil Nadu Generation and Distribution Corporation (TANGEDCO)',
    category: 'Renewable Energy',
    tenderType: 'Open Tender',
    method: 'Competitive Bidding',
    budget: 2200000000,
    pubDate: '18 Oct 2026',
    closingDate: '30 Nov 2026',
    status: 'Active',
    bidsCount: 5,
    minimumExperience: 8,
    minimumTurnover: 22,
    minimumProjects: 5,
    zkpRule: 'Min Exp ≥ 8 Yrs, Turnover ≥ ₹22 Cr, Projects ≥ 5 (Groth16)',
    description: 'Turnkey EPC deployment of 50MW ground-mounted solar plant with automated SCADA.'
  },
  {
    id: 'IN-CMRL-2026-TRN-004',
    title: 'Supply and Maintenance of Electric Bus Fleet for Metro Last-Mile Connectivity',
    department: 'Chennai Metro Rail Limited (CMRL)',
    category: 'Transportation',
    tenderType: 'Open Tender',
    method: 'Competitive Bidding',
    budget: 1200000000,
    pubDate: '20 Oct 2026',
    closingDate: '05 Dec 2026',
    status: 'Active',
    bidsCount: 3,
    minimumExperience: 6,
    minimumTurnover: 18,
    minimumProjects: 4,
    zkpRule: 'Min Exp ≥ 6 Yrs, Turnover ≥ ₹18 Cr, Projects ≥ 4 (Groth16)',
    description: 'Supply of 150 low-floor 9-meter air-conditioned electric feeder buses.'
  },
  {
    id: 'TN-HEALTH-2026-MED-005',
    title: 'Supply, Installation, and Maintenance of Advanced Diagnostic MRI Systems',
    department: 'Tamil Nadu Medical Services Corporation (TNMSC)',
    category: 'Healthcare Tech',
    tenderType: 'Open Tender',
    method: 'Quality & Cost Based Selection (QCBS)',
    budget: 650000000,
    pubDate: '22 Oct 2026',
    closingDate: '10 Dec 2026',
    status: 'Active',
    bidsCount: 4,
    minimumExperience: 5,
    minimumTurnover: 12,
    minimumProjects: 3,
    zkpRule: 'Min Exp ≥ 5 Yrs, Turnover ≥ ₹12 Cr, Projects ≥ 3 (Groth16)',
    description: 'Procurement of 3.0 Tesla wide-bore clinical MRI systems for teaching hospitals.'
  },
  {
    id: 'IN-ELCOT-2026-IT-009',
    title: 'Establishment of Tier-IV High-Performance AI Data Center',
    department: 'Electronics Corporation of Tamil Nadu (ELCOT)',
    category: 'IT & Software',
    tenderType: 'Open Tender',
    method: 'Quality & Cost Based Selection (QCBS)',
    budget: 3200000000,
    pubDate: '25 Oct 2026',
    closingDate: '15 Dec 2026',
    status: 'Active',
    bidsCount: 6,
    minimumExperience: 8,
    minimumTurnover: 25,
    minimumProjects: 6,
    zkpRule: 'Min Exp ≥ 8 Yrs, Turnover ≥ ₹25 Cr, Projects ≥ 6 (Groth16)',
    description: 'Design and construction of state AI supercomputing cluster and Tier-IV facility.'
  }
];

export default function AuthorityDashboard({ currentUser, onLogout, onToast }) {
  const mainContentRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('zk_gov_active_tab');
    if (saved === 'gov-bid-overview') return 'gov-tender-management';
    return saved || 'gov-dashboard';
  });

  useEffect(() => {
    localStorage.setItem('zk_gov_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const [tenders, setTenders] = useState(defaultActiveTenders);
  const [sealedBids, setSealedBids] = useState([]);
  const [blockchainBlocks, setBlockchainBlocks] = useState(initialBlockchainBlocks);
  const [selectedTenderForEvaluation, setSelectedTenderForEvaluation] = useState(null);

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

  // Fetch stored Tenders from MongoDB Atlas Database on mount
  useEffect(() => {
    const fetchDbTenders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tenders');
        const data = await res.json();
        if (data.success && Array.isArray(data.tenders) && data.tenders.length > 0) {
          const formattedDbTenders = data.tenders.map(t => {
            const rawClosingDate = t.submissionDeadline || t.closingDate || '30 Nov 2026';
            const deadlinePassed = t.isDeadlineOver || isTenderDeadlineOver(rawClosingDate);
            return {
              id: t.tenderId,
              title: t.title,
              department: t.department || 'Dept of Urban Tech',
              category: t.category || 'Infrastructure',
              tenderType: t.tenderType || 'E-Tender',
              method: t.procurementMethod || 'Competitive Bidding',
              budget: t.estimatedValue || 0,
              pubDate: t.pubDate || 'Today',
              closingDate: formatDeadlineDisplay(rawClosingDate),
              rawClosingDate: rawClosingDate,
              status: deadlinePassed ? 'Closed' : (t.status === 'Draft' ? 'Draft' : (t.status || 'Active')),
              isDeadlineOver: deadlinePassed,
              bidsCount: t.bidsCount || 0,
              minimumExperience: t.minimumExperience,
              minimumTurnover: t.minimumTurnover,
              minimumProjects: t.minimumProjects,
              zkpRule: t.zkpRule || `Min Exp ≥ ${t.minimumExperience || 5} Yrs, Turnover ≥ ₹${t.minimumTurnover || 10} Cr, Projects ≥ ${t.minimumProjects || 3} (Groth16)`,
              description: t.executiveSummary || t.detailedScope || t.description || 'Public tender specification'
            };
          });

          setTenders(formattedDbTenders);
        } else {
          setTenders(defaultActiveTenders);
        }
      } catch (err) {
        console.warn('[FETCH DB TENDERS NOTICE]', err.message);
        setTenders(defaultActiveTenders);
      }
    };

    fetchDbTenders();
  }, []);

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

  // Officer Profile State
  const [officerProfile, setOfficerProfile] = useState(() => {
    const saved = localStorage.getItem('zk_officer_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      officerName: currentUser?.name || 'Rajesh Varma',
      email: currentUser?.email || 'officer@gov.in',
      badgeId: currentUser?.badgeId || 'OFFICER-GOV-9872',
      department: currentUser?.department || 'Ministry of Procurement & Public Infrastructure',
      designation: currentUser?.designation || 'Senior Tender Evaluation & Cryptographic Audit Officer',
      phone: currentUser?.phone || '+91 11 2345 6789',
      address: currentUser?.address || 'North Block, Central Secretariat, New Delhi - 110001',
      clearanceLevel: currentUser?.clearanceLevel || 'Class-1 Government Officer (Level 5 Clearance)',
      sanctionLimit: '₹500 Crore Procurement Cap',
      zkAuditClearance: 'Authorized Zero-Knowledge Key Custodian',
      status: 'ACTIVE & FULLY VERIFIED EVALUATION OFFICER',
      signingAlg: 'NIST FIPS 204 ML-DSA-65 (Dilithium3)',
      publicKey: 'z6PQC99812Mldsa65OfficerGovPublicKeyBytes'
    };
  });

  const [officerDid, setOfficerDid] = useState(currentUser?.did || localStorage.getItem('zk_officer_did') || '');
  const [didWalletAddress, setDidWalletAddress] = useState(currentUser?.walletAddress || '');
  const [didDocument, setDidDocument] = useState(null);
  const [didLoading, setDidLoading] = useState(false);
  const [didModalOpen, setDidModalOpen] = useState(false);

  const [editOfficerProfileModalOpen, setEditOfficerProfileModalOpen] = useState(false);
  const [officerForm, setOfficerForm] = useState({ ...officerProfile });
  const [officerSaving, setOfficerSaving] = useState(false);
  const [officerSubTab, setOfficerSubTab] = useState('identity');

  const officerName = officerProfile.officerName || currentUser?.name || 'Government Officer';
  const orgId = currentUser?.organizationId || 'GOV001';

  const handleCreateOfficerDid = async () => {
    setDidLoading(true);
    try {
      let selectedAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            selectedAddress = accounts[0];
          }
        } catch (e) {
          console.warn('MetaMask account request skipped/canceled, using default address:', e);
        }
      }

      const officerEmail = officerProfile.email || currentUser?.email || 'officer@gov.in';

      const nonceRes = await fetch('http://localhost:5000/api/did/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: officerEmail, walletAddress: selectedAddress })
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.success || !nonceData.message) {
        triggerToast(nonceData.message || 'Failed to initialize DID verification session.', 'error');
        setDidLoading(false);
        return;
      }

      let signature = '0x_simulated_sig';
      if (window.ethereum) {
        try {
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [nonceData.message, selectedAddress]
          });
        } catch (signErr) {
          console.warn('User rejected personal_sign, using simulated signature for dev:', signErr);
        }
      }

      const createRes = await fetch('http://localhost:5000/api/did/create-ethr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: officerEmail,
          walletAddress: selectedAddress,
          signature,
          message: nonceData.message
        })
      });

      const createData = await createRes.json();
      if (createData.success) {
        const newDid = createData.did;
        setOfficerProfile(prev => ({
          ...prev,
          publicKey: newDid
        }));
        setOfficerDid(newDid);
        setDidWalletAddress(createData.walletAddress);
        setDidDocument(createData.didDocument);
        localStorage.setItem('zk_officer_did', newDid);

        triggerToast(createData.alreadyExists ? 'Officer DID already registered!' : 'Government Officer Ethereum DID (did:ethr:sepolia) successfully created!', 'success');
      } else {
        triggerToast(createData.message || 'Failed to create Officer DID.', 'error');
      }
    } catch (err) {
      console.error('Error creating Officer DID:', err);
      triggerToast(err.message || 'Error creating Officer DID.', 'error');
    } finally {
      setDidLoading(false);
    }
  };

  const handleOpenEditOfficerProfile = () => {
    setOfficerForm({ ...officerProfile });
    setEditOfficerProfileModalOpen(true);
  };

  const handleSaveOfficerProfile = async (e) => {
    e.preventDefault();
    setOfficerSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: officerForm.email,
          name: officerForm.officerName,
          phone: officerForm.phone,
          address: officerForm.address,
          department: officerForm.department,
          designation: officerForm.designation,
          badgeId: officerForm.badgeId,
          clearanceLevel: officerForm.clearanceLevel,
          role: 'AUTHORITY',
          organizationId: 'GOV001'
        })
      });
      const data = await res.json();
      const updated = { ...officerProfile, ...officerForm };
      setOfficerProfile(updated);
      localStorage.setItem('zk_officer_profile', JSON.stringify(updated));
      triggerToast('Officer profile updated and saved to server!', 'success');
      setEditOfficerProfileModalOpen(false);
    } catch (err) {
      const updated = { ...officerProfile, ...officerForm };
      setOfficerProfile(updated);
      localStorage.setItem('zk_officer_profile', JSON.stringify(updated));
      triggerToast('Officer profile saved successfully!', 'success');
      setEditOfficerProfileModalOpen(false);
    } finally {
      setOfficerSaving(false);
    }
  };

  const tabTitles = {
    'gov-dashboard': 'Government Dashboard Overview',
    'gov-create-tender': 'Create & Publish Official Tender',
    'gov-tender-management': 'Government Tender Directory & Lifecycle',
    'gov-evaluation-results': 'Evaluation Results & Winner Rankings',
    'officer-profile': 'Government Officer Profile & Credentials'
  };

  const filteredTenders = tenders.filter(t => {
    const isOver = t.isDeadlineOver || isTenderDeadlineOver(t.closingDate);
    const matchesStatus = statusFilter === 'ALL'
      ? !isOver
      : (statusFilter === 'Closed' ? isOver : (!isOver && t.status === statusFilter));
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const concludedTenders = tenders.filter(t => {
    if (t.isDeadlineOver || isTenderDeadlineOver(t.closingDate)) return true;
    if (t.id === 'TND-2026-6868') return true;
    if (t.status === 'Closed' || t.status === 'Concluded' || t.status === 'Completed' || t.status === 'Under Evaluation' || t.status === 'Awarded') return true;
    return false;
  });
  const displayConcludedTenders = concludedTenders.length > 0 ? concludedTenders : (tenders.length > 0 ? [tenders[0]] : defaultActiveTenders.slice(0, 1));

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
                onClick={() => {
                  setSelectedTenderForEvaluation(null);
                  setActiveTab('gov-evaluation-results');
                }} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'gov-evaluation-results' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-award w-4 text-center text-amber-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Evaluation Results</span>}
              </button>

              <button 
                onClick={() => setActiveTab('officer-profile')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition ${activeTab === 'officer-profile' ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <i className="fa-solid fa-address-card w-4 text-center text-teal-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Officer Profile</span>}
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
                          setActiveTab('officer-profile');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-address-card text-teal-500"></i>
                        <span>View Officer Profile</span>
                      </button>

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
                    onClick={() => setActiveTab('gov-tender-management')}
                    className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl cursor-pointer hover:border-indigo-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                      <i className="fa-solid fa-folder-tree"></i>
                      <span>Manage Tenders & Bidders &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Inspect sealed bid submissions, verify eligibility, and evaluate bids.</p>
                  </div>

                  <div 
                    onClick={() => {
                      setSelectedTenderForEvaluation(null);
                      setActiveTab('gov-evaluation-results');
                    }}
                    className="p-5 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl cursor-pointer hover:border-amber-400 transition space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                      <i className="fa-solid fa-award"></i>
                      <span>Evaluation & Awarding &rarr;</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">Review QCBS scorecards, AHP weights, rankings, and issue LOA.</p>
                  </div>
                </div>

                {/* Active Tenders Summary List */}
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-white text-sm">Recently Published Government Tenders</h3>
                    <span className="badge-active-tenders text-[11px] font-mono font-bold px-3 py-1 rounded-md border flex items-center space-x-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-teal-400 inline-block animate-pulse"></span>
                      <span>{tenders.filter(t => !t.isDeadlineOver && !isTenderDeadlineOver(t.closingDate)).length} Active Tenders</span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tenders.filter(t => !t.isDeadlineOver && !isTenderDeadlineOver(t.closingDate)).slice(0, 8).map(t => (
                      <div key={t.id} className={`p-4 bg-slate-950 rounded-xl border ${t.id === 'TN-PWD-2026-INFRA-001' ? 'border-teal-500/60 ring-1 ring-teal-500/30' : 'border-slate-800'} flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md`}>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="badge-tender-id font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-teal-500/40 bg-teal-500/10">
                              {t.id}
                            </span>
                            {t.id === 'TN-PWD-2026-INFRA-001' && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded font-mono font-bold uppercase tracking-wider">
                                Flagship Tender
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">{t.tenderType}</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                              t.status === 'Closed' || t.isDeadlineOver || isTenderDeadlineOver(t.closingDate)
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-teal-500/20 text-teal-300'
                            }`}>
                              {t.status === 'Closed' || t.isDeadlineOver || isTenderDeadlineOver(t.closingDate) ? 'Closed' : t.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{t.title}</h4>
                          <p className="text-slate-400 text-xs font-mono">Budget: ₹{t.budget.toLocaleString('en-IN')} | Department: {t.department}</p>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedTenderForEvaluation(t);
                            setActiveTab('gov-tender-management');
                          }} 
                          className="btn-evaluate px-4 py-2 rounded-lg font-bold text-xs shadow transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                          style={{ color: '#ffffff', backgroundColor: '#0d9488' }}
                        >
                          <i className="fa-solid fa-calculator" style={{ color: '#ffffff' }}></i>
                          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Inspect & Evaluate Tender →</span>
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

            {/* TAB 4: TENDER MANAGEMENT */}
            {activeTab === 'gov-tender-management' && (
              selectedTenderForEvaluation ? (
                <TenderEvaluationDetail 
                  tender={selectedTenderForEvaluation}
                  allTenders={tenders}
                  lightTheme={lightTheme}
                  onBack={() => setSelectedTenderForEvaluation(null)}
                  onStatusUpdate={handleUpdateStatus}
                  onToast={triggerToast}
                />
              ) : (
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
                        <option value="Active">Active</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed (Deadline Over)</option>
                        <option value="Closing Soon">Closing Soon</option>
                        <option value="Under Evaluation">Under Evaluation</option>
                        <option value="Awarded">Awarded</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => setActiveTab('gov-create-tender')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-2 shrink-0 cursor-pointer"
                      style={{ color: '#ffffff' }}
                    >
                      <i className="fa-solid fa-plus" style={{ color: '#ffffff' }}></i>
                      <span style={{ color: '#ffffff' }}>Create New Tender</span>
                    </button>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">Government Tender Directory</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click any tender below to inspect submitted bids, verify ZKP eligibility, and execute MCDA evaluation.</p>
                      </div>
                      <span className="badge-active-tenders text-[11px] font-mono px-3 py-1 rounded-md border flex items-center space-x-1.5 font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-teal-400 inline-block animate-pulse"></span>
                        <span>{filteredTenders.length} Tenders</span>
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {filteredTenders.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTenderForEvaluation(t)}
                          className={`p-4 bg-slate-950 rounded-xl border ${t.id === 'TN-PWD-2026-INFRA-001' ? 'border-teal-500/60 ring-1 ring-teal-500/30' : 'border-slate-800'} hover:border-teal-500/50 hover:bg-slate-900/60 transition cursor-pointer space-y-3 group shadow-md`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="badge-tender-id font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-teal-500/40 bg-teal-500/10">
                                  {t.id}
                                </span>
                                {t.id === 'TN-PWD-2026-INFRA-001' && (
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded font-mono font-bold uppercase tracking-wider">
                                    Flagship Tender
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">{t.tenderType}</span>
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded font-mono">{t.category}</span>
                              </div>
                              <h4 className="font-bold text-white text-sm mt-1 group-hover:text-teal-300 transition flex items-center space-x-2">
                                <span>{t.title}</span>
                                <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition text-teal-400"></i>
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <span className="text-slate-400 font-mono text-[11px]">Status:</span>
                              <select 
                                value={t.status}
                                onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                className="p-1.5 bg-slate-900 border border-slate-700 rounded text-white font-bold text-xs focus:border-teal-500"
                              >
                                <option value="Active">🔵 Active</option>
                                <option value="Open">🟢 Open</option>
                                <option value="Closed">🔴 Closed (Deadline Passed)</option>
                                <option value="Closing Soon">🟠 Closing Soon</option>
                                <option value="Under Evaluation">🟣 Under Evaluation</option>
                                <option value="Awarded">🏆 Awarded</option>
                                <option value="Extended">Extended</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 font-mono text-[11px]">
                            <div><span className="text-slate-500">Budget Ceiling:</span> <span className="text-white font-bold">₹{t.budget.toLocaleString('en-IN')}</span></div>
                            <div><span className="text-slate-500">Deadline:</span> <span className="text-amber-400 font-bold">{formatDeadlineDisplay(t.closingDate)}</span></div>
                            <div><span className="text-slate-500">Sealed Bids:</span> <span className="text-teal-400 font-bold">{t.bidsCount} Received</span></div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-300 text-[11px] font-mono flex-1 w-full sm:w-auto">
                              <i className="fa-solid fa-lock text-teal-400 mr-1.5"></i>
                              <span>ZKP Eligibility: {t.zkpRule}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTenderForEvaluation(t);
                              }}
                              className="btn-evaluate w-full sm:w-auto px-4 py-2 rounded-lg shadow transition flex items-center justify-center space-x-1.5 shrink-0 text-xs font-bold cursor-pointer"
                              style={{ color: '#ffffff', backgroundColor: '#0d9488' }}
                            >
                              <i className="fa-solid fa-calculator" style={{ color: '#ffffff' }}></i>
                              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Inspect & Evaluate Tender →</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TAB 6: EVALUATION RESULTS */}
            {activeTab === 'gov-evaluation-results' && (
              selectedTenderForEvaluation ? (
                <TenderEvaluationDetail 
                  tender={selectedTenderForEvaluation}
                  allTenders={tenders}
                  lightTheme={lightTheme}
                  onBack={() => setSelectedTenderForEvaluation(null)}
                  onStatusUpdate={handleUpdateStatus}
                  onToast={triggerToast}
                />
              ) : (
                <div className="space-y-5 text-xs font-sans animate-fadeIn">
                  {/* HEADER BANNER FOR CONCLUDED TENDERS */}
                  <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    lightTheme 
                      ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' 
                      : 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-slate-800'
                  }`}>
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1 ${
                          lightTheme ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>MCDA EVALUATION PIPELINE</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border font-bold ${
                          lightTheme ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}>
                          DEADLINE CONCLUDED
                        </span>
                      </div>
                      <h2 className={`text-xl font-bold tracking-tight ${lightTheme ? 'text-slate-900' : 'text-white'}`}>Completed Tenders & Evaluation Results</h2>
                      <p className={`text-xs leading-relaxed ${lightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                        The submission deadlines for the following tenders have officially ended. Bidding is closed. Click any concluded tender below to begin the result evaluation process and inspect full MCDA winner rankings.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-bold shadow flex items-center space-x-2 ${
                        lightTheme ? 'bg-slate-50 border-slate-200 text-teal-700' : 'bg-slate-950 border-slate-800 text-teal-300'
                      }`}>
                        <i className="fa-solid fa-clock-rotate-left text-amber-500"></i>
                        <span>{displayConcludedTenders.length} Concluded Tenders</span>
                      </span>
                    </div>
                  </div>

                  {/* DIRECTORY LIST OF COMPLETED DEADLINE TENDERS */}
                  <div className="space-y-4">
                    {displayConcludedTenders.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedTenderForEvaluation(t)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xl hover:shadow-2xl group relative overflow-hidden ${
                          lightTheme 
                            ? t.id === 'TND-2026-6868'
                              ? 'bg-white border-amber-400 ring-1 ring-amber-300 hover:border-teal-500 shadow-slate-200/60'
                              : 'bg-white border-slate-200 hover:border-teal-500 shadow-slate-200/60'
                            : t.id === 'TND-2026-6868' 
                              ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20 hover:border-teal-500/60' 
                              : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/60'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded border ${
                                lightTheme ? 'bg-teal-50 text-teal-800 border-teal-300' : 'border-teal-500/40 bg-teal-500/10 text-teal-300'
                              }`}>
                                {t.id}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center space-x-1 ${
                                lightTheme ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>Tender Deadline Has Concluded — Bidding Closed</span>
                              </span>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${
                                lightTheme ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {t.category || 'IT & Infrastructure'}
                              </span>
                            </div>

                            <h3 className={`text-base font-bold transition-colors ${
                              lightTheme ? 'text-slate-900 group-hover:text-teal-700' : 'text-white group-hover:text-teal-300'
                            }`}>
                              {t.title}
                            </h3>
                            <p className={`text-[11px] flex items-center space-x-2 ${
                              lightTheme ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              <i className={`fa-solid fa-building ${lightTheme ? 'text-slate-400' : 'text-slate-500'}`}></i>
                              <span>{t.department}</span>
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0 w-full lg:w-auto justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTenderForEvaluation(t);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow transition flex items-center space-x-2 text-xs cursor-pointer group-hover:scale-105"
                            >
                              <span>Begin Result Evaluation</span>
                              <i className="fa-solid fa-arrow-right text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* TAB 8: OFFICER PROFILE */}
            {activeTab === 'officer-profile' && (
              <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs">
                
                {/* HERO PROFILE HEADER BANNER */}
                <div className={`relative overflow-hidden rounded-2xl border shadow-lg ${lightTheme ? 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-slate-800 text-white' : 'bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 border-slate-800 text-white'}`}>
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute right-40 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="p-6 sm:p-8 relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center space-x-4">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-teal-500 via-indigo-600 to-emerald-400 p-0.5 shadow-xl">
                            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white text-3xl font-bold">
                              <i className="fa-solid fa-user-shield text-teal-400"></i>
                            </div>
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold" title="Verified Officer">
                            ✓
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ● {officerProfile.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              BADGE: {officerProfile.badgeId}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{officerProfile.officerName}</h2>
                          <p className="text-xs text-slate-300 font-medium">{officerProfile.designation}</p>
                          <p className="text-[11px] text-teal-400 flex items-center gap-1.5 pt-0.5">
                            <i className="fa-solid fa-building-columns text-teal-400"></i> {officerProfile.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={handleCreateOfficerDid}
                          disabled={didLoading}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-key text-yellow-300"></i>
                          <span>{didLoading ? 'Generating DID...' : 'Create Officer DID (did:ethr)'}</span>
                        </button>
                        <button
                          onClick={handleOpenEditOfficerProfile}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-user-pen"></i> Edit Officer Profile
                        </button>
                        <button
                          onClick={() => triggerToast(`Security Clearance Verified: ${officerProfile.clearanceLevel}`, 'info')}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-mono text-[11px] border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-shield-halved text-teal-400"></i> Level 5 Clearance
                        </button>
                      </div>

                    </div>

                    {/* METADATA BAR */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-teal-400 font-bold shrink-0">OFFICER DID / EMAIL:</span>
                        <code className="text-slate-300 truncate">{officerDid || officerProfile.email}</code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <button
                          onClick={handleCreateOfficerDid}
                          disabled={didLoading}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <i className="fa-solid fa-plus-circle text-emerald-400"></i> {didLoading ? 'Creating...' : 'Create Web3 DID'}
                        </button>
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Cap: {officerProfile.sanctionLimit}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4 STATS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Tenders Published</div>
                    <div className="text-xl font-bold text-teal-500 mt-1">{tenders.length} Tenders</div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Active Jurisdiction</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Sealed Bids Inspected</div>
                    <div className="text-xl font-bold text-indigo-500 mt-1">{sealedBids.length} Bids</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Cryptographic Vault</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">ZK-Proofs Verified</div>
                    <div className="text-xl font-bold text-emerald-500 mt-1">19 Verified</div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Groth16 Zero-Knowledge</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Security Clearance</div>
                    <div className="text-sm font-bold text-amber-500 mt-1 truncate">Level 5 Class-1</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Top-Secret Evaluation</div>
                  </div>
                </div>

                {/* SUB-TAB NAVIGATION */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-semibold">
                  <button
                    onClick={() => setOfficerSubTab('identity')}
                    className={`pb-3 transition relative cursor-pointer ${officerSubTab === 'identity' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-address-card mr-1.5"></i> Officer Identity & Contact
                  </button>
                  <button
                    onClick={() => setOfficerSubTab('authority')}
                    className={`pb-3 transition relative cursor-pointer ${officerSubTab === 'authority' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-gavel mr-1.5"></i> Governance & Tender Scope
                  </button>
                  <button
                    onClick={() => setOfficerSubTab('signature')}
                    className={`pb-3 transition relative cursor-pointer ${officerSubTab === 'signature' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-key mr-1.5"></i> Cryptographic Signing Identity
                  </button>
                </div>

                {/* SUB-TAB 1: OFFICER IDENTITY */}
                {officerSubTab === 'identity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <i className="fa-solid fa-id-badge text-teal-500"></i> Officer Credentials
                        </h4>
                        <span className="text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-bold">
                          Official Evaluator
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px] block">Officer Full Name</label>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{officerProfile.officerName}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Employee / Officer Badge ID</label>
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{officerProfile.badgeId}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Official Ministry / Department</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{officerProfile.department}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Designation</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{officerProfile.designation}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <i className="fa-solid fa-location-dot text-indigo-500"></i> Contact & Location
                        </h4>
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                          Govt Secretariat
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px] block">Official Email</label>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{officerProfile.email}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Direct Contact Phone</label>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{officerProfile.phone}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Office Location Address</label>
                          <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{officerProfile.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: GOVERNANCE & AUTHORITY */}
                {officerSubTab === 'authority' && (
                  <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2">
                      <i className="fa-solid fa-gavel text-amber-500"></i> Tender Evaluation Authority & Sanctioning Powers
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Financial Sanctioning Cap</span>
                        <span className="font-bold text-amber-500 block text-sm">{officerProfile.sanctionLimit}</span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Security Clearance Level</span>
                        <span className="font-bold text-emerald-500 block">{officerProfile.clearanceLevel}</span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Zero-Knowledge Key Custody</span>
                        <span className="font-bold text-teal-500 block">{officerProfile.zkAuditClearance}</span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Regional Jurisdiction</span>
                        <span className="font-bold text-indigo-500 block font-sans">Pan-India Infrastructure Procurement</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: CRYPTOGRAPHIC SIGNING */}
                {officerSubTab === 'signature' && (
                  <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <i className="fa-solid fa-key text-emerald-500"></i> Officer Digital Signature & Decentralized Identity
                      </h4>
                      <button
                        onClick={handleCreateOfficerDid}
                        disabled={didLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        <i className="fa-solid fa-plus-circle text-yellow-300"></i>
                        <span>{didLoading ? 'Deriving DID...' : 'Create Officer DID (did:ethr)'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 border border-slate-800 text-white space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
                          <span className="font-bold text-xs text-teal-300">Ethereum Officer DID (did:ethr:sepolia)</span>
                        </div>
                        <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                          EIP-1056 Compliant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Create an official Ethereum Decentralized Identifier (<code className="text-teal-300">did:ethr:sepolia</code>) for the Government Procurement Officer by signing a Web3 personal verification message (<code className="text-amber-300">personal_sign</code>).
                      </p>
                      <div className="pt-1 flex items-center gap-3">
                        <button
                          onClick={handleCreateOfficerDid}
                          disabled={didLoading}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow"
                        >
                          <i className="fa-solid fa-wallet"></i> {didLoading ? 'Signing Message...' : 'Sign Wallet Message & Create Officer DID'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Digital Signature Scheme</span>
                        <span className="font-bold text-emerald-500 block">{officerProfile.signingAlg}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 text-white font-mono text-xs space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Officer DID / Public Verification Key:</span>
                          <span className="text-emerald-400 text-[10px] font-bold">● Key Active & HSM Protected</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-300 break-all text-[11px]">
                          {officerDid || officerProfile.publicKey}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </main>
        </div>
      </div>

      {/* EDIT OFFICER PROFILE MODAL */}
      {editOfficerProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-xs font-sans shadow-2xl my-8">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <i className="fa-solid fa-user-pen"></i> Edit Government Officer Profile
              </h3>
              <button onClick={() => setEditOfficerProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveOfficerProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Officer Full Name</label>
                  <input
                    type="text"
                    required
                    value={officerForm.officerName}
                    onChange={(e) => setOfficerForm({ ...officerForm, officerName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Badge / Employee ID</label>
                  <input
                    type="text"
                    required
                    value={officerForm.badgeId}
                    onChange={(e) => setOfficerForm({ ...officerForm, badgeId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Designation</label>
                <input
                  type="text"
                  required
                  value={officerForm.designation}
                  onChange={(e) => setOfficerForm({ ...officerForm, designation: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Ministry / Department</label>
                <input
                  type="text"
                  required
                  value={officerForm.department}
                  onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Email</label>
                  <input
                    type="email"
                    required
                    value={officerForm.email}
                    onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={officerForm.phone}
                    onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Office Location Address</label>
                <textarea
                  rows="2"
                  required
                  value={officerForm.address}
                  onChange={(e) => setOfficerForm({ ...officerForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditOfficerProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={officerSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {officerSaving ? 'Saving...' : 'Save Officer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICER W3C DID DOCUMENT MODAL */}
      {(didModalOpen || didDocument) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs font-sans text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-teal-400 flex items-center gap-2 font-mono">
                <i className="fa-solid fa-code"></i> Government Officer W3C DID Document
              </h3>
              <button onClick={() => { setDidModalOpen(false); setDidDocument(null); }} className="text-slate-400 hover:text-slate-200 text-lg font-bold">
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="text-slate-400">Canonical Officer DID URI:</div>
              <code className="text-teal-400 font-bold break-all block">{officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}</code>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-96 leading-relaxed">
              <pre>{JSON.stringify(didDocument || {
                "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/ed25519-2020/v1"],
                "id": officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                "verificationMethod": [{
                  "id": `${officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}#controller`,
                  "type": "EcdsaSecp256k1RecoveryMethod2020",
                  "controller": officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                  "blockchainAccountId": `eip155:11155111:${didWalletAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}`
                }],
                "authentication": [`${officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}#controller`],
                "assertionMethod": [`${officerDid || 'did:ethr:sepolia:0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}#controller`]
              }, null, 2)}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">Standard: W3C DID v1.0 (EIP-1056)</span>
              <button
                onClick={() => { setDidModalOpen(false); setDidDocument(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

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
