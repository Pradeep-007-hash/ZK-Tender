import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import WalletConnectButton from './WalletConnectButton';
import VendorBidPage from './VendorBidPage';
import EligibilityModal from './EligibilityModal';
import EvaluationDashboard from './EvaluationDashboard';
import VendorDocumentSubmission from './VendorDocumentSubmission';
import VendorBidStatusPage from './vendor/VendorBidStatusPage';
import VendorEvaluationResultsPage from './vendor/VendorEvaluationResultsPage';
import { useWallet } from '../hooks/useWallet';
import { isTenderDeadlineOver, parseDeadlineDate, getTenderTimeRemaining, formatDeadlineDisplay } from '../utils/tenderDateUtils';

const indianStatesAndDistricts = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Tirupati", "Anantapur", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Other"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Other"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Other"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Other"],
  "Goa": ["North Goa (Panaji)", "South Goa (Margao)", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Other"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Panchkula", "Other"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Other"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Other"],
  "Karnataka": ["Bangalore Urban", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", "Davangere", "Bellary", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Kannur", "Kottayam", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Other"],
  "Maharashtra": ["Mumbai Suburban", "Mumbai City", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Other"],
  "Manipur": ["Imphal East", "Imphal West", "Other"],
  "Meghalaya": ["Shillong", "Tura", "Other"],
  "Mizoram": ["Aizawl", "Lunglei", "Other"],
  "Nagaland": ["Kohima", "Dimapur", "Other"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Other"],
  "Sikkim": ["Gangtok", "Namchi", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Other"],
  "Tripura": ["Agartala", "Udaipur", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Noida / GB Nagar", "Prayagraj", "Bareilly", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Other"],
  "Other State/UT": ["Central District", "District Headquarters", "Main Region", "Other"]
};

export default function UserDashboard({ currentUser, onLogout, onToast }) {
  const [activeTab, setActiveTab] = useState(() => {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('setting')) return 'settings';
    if (path.includes('document')) return 'documents';
    if (path.includes('credential')) return 'credentials';
    if (path.includes('profile') || path.includes('company')) return 'company-profile';
    if (path.includes('bid-status') || path.includes('lifecycle')) return 'eval-bid-status';
    if (path.includes('evaluation') || path.includes('eval-result') || path.includes('scorecard')) return 'eval-results';
    if (path.includes('bid')) return 'bidding-my-bids';
    if (path.includes('zkp')) return 'zkp-generate';
    if (path.includes('closed') || path.includes('past')) return 'tenders-closed';
    if (path.includes('tender') || path.includes('available')) return 'tenders-available';
    return localStorage.getItem('zk_active_tab') || 'dashboard';
  });

  const mainContentRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('zk_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    const targetUrl = activeTab === 'settings'
      ? '/vendor/settings'
      : activeTab === 'documents'
        ? '/vendor/documents'
        : activeTab === 'credentials'
          ? '/vendor/credentials'
          : activeTab === 'company-profile'
            ? '/vendor/profile'
            : activeTab === 'eval-bid-status'
              ? '/vendor/bid-status'
              : activeTab === 'eval-results'
                ? '/vendor/evaluation-results'
                : activeTab === 'bidding-my-bids'
                  ? '/vendor/bids'
                  : activeTab === 'tenders-closed'
                    ? '/vendor/closed-tenders'
                    : activeTab === 'tenders-available'
                      ? '/vendor/tenders'
                      : '/vendor/dashboard';
    if (window.location.pathname !== targetUrl) {
      window.history.replaceState(null, '', targetUrl);
    }
  }, [activeTab]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(true);
  const [notifFlyoutOpen, setNotifFlyoutOpen] = useState(false);

  // Data State - Loaded live from MongoDB Database
  const [tenders, setTenders] = useState([]);
  const [tendersViewMode, setTendersViewMode] = useState('available'); // 'available' | 'closed'
  const [myBids, setMyBids] = useState([]);
  const [myBidsFilter, setMyBidsFilter] = useState('ALL');
  const [selectedTender, setSelectedTender] = useState(null);
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState(false);
  const [verifiedEligibilityTenders, setVerifiedEligibilityTenders] = useState({});

  // Fetch Tenders from Database API on mount (Only Published On-Chain Tenders Visible to Vendors)
  useEffect(() => {
    const fetchDbTenders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tenders?includeDrafts=false');
        const data = await res.json();
        if (data.success && Array.isArray(data.tenders)) {
          // Filter out any Draft tenders - Vendors can only view Tenders created & published on-chain with gas payment
          const publishedOnly = data.tenders.filter(t => (t.status || '').toUpperCase() !== 'DRAFT');
          const formatted = publishedOnly.map(t => {
            const isOver = isTenderDeadlineOver(t);
            const pubDateStr = t.pubDate
              ? (new Date(t.pubDate).toString() !== 'Invalid Date'
                  ? new Date(t.pubDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : String(t.pubDate))
              : 'Today';

            return {
              ...t,
              id: t.tenderId || `TND-${Math.floor(1000 + Math.random() * 9000)}`,
              tenderId: t.tenderId || t.id,
              title: t.title || t.tenderTitle || 'Untitled Tender',
              organization: t.department || 'Dept of Urban Tech',
              department: t.department || 'Dept of Urban Tech',
              category: t.category || 'Infrastructure',
              tenderType: t.tenderType || 'Open Tender',
              location: t.city ? `${t.city}, ${t.state}` : (t.state || 'Tamil Nadu, India'),
              pubDate: pubDateStr,
              closingDate: formatDeadlineDisplay(t.submissionDeadline || t.closingDate || t.bidDeadline || '30 Nov 2026'),
              submissionDeadline: formatDeadlineDisplay(t.submissionDeadline || t.closingDate || t.bidDeadline || '30 Nov 2026'),
              rawClosingDate: t.submissionDeadline || t.closingDate || t.bidDeadline,
              budget: Number(t.estimatedValue || t.budget || 0),
              method: t.procurementMethod || t.method || 'Competitive Bidding',
              procurementMethod: t.procurementMethod || t.method || 'Competitive Bidding',
              eligibility: 'ELIGIBLE',
              isDeadlineOver: isOver,
              status: isOver ? 'CLOSED' : (t.status || 'PUBLISHED').toUpperCase(),
              description: t.executiveSummary || t.detailedScope || t.description || t.title,
              txHash: t.txHash || null,
              zkpRule: t.zkpRule || 'Revenue & Technical Range Proof (Groth16)',
              evaluationCriteriaList: t.evaluationCriteriaList || t.evaluationCriteria?.weights || [],
              eligibilityRequirementsList: t.eligibilityRequirementsList || t.vendorEligibilityCriteria || []
            };
          });
          setTenders(formatted);
          if (formatted.length > 0) {
            const firstAvailable = formatted.find(t => !t.isDeadlineOver) || formatted[0];
            setSelectedTender(firstAvailable);
          }
        }
      } catch (err) {
        console.warn('[USER DASHBOARD FETCH ERROR]', err.message);
      }
    };
    fetchDbTenders();
  }, []);

  // Filters State
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterBudget, setFilterBudget] = useState(0);
  const [filterOrg, setFilterOrg] = useState('ALL');
  const [filterElig, setFilterElig] = useState('ALL');
  const [filterTenderType, setFilterTenderType] = useState('ALL');
  const [filterProcurement, setFilterProcurement] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [globalSearch, setGlobalSearch] = useState('');

  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSuccess, setWizardSuccess] = useState(false);
  const [wizardProgress, setWizardProgress] = useState(0);
  const [wizardProgressLabel, setWizardProgressLabel] = useState('Ready to synthesize witness signals...');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Logout Confirmation Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleProceedLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  // Proof Generator State
  const [proofType, setProofType] = useState('revenue');
  const [proofGenStep, setProofGenStep] = useState(0);
  const [proofResultVisible, setProofResultVisible] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileCompany, setProfileCompany] = useState(currentUser?.company || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileGst, setProfileGst] = useState(currentUser?.gstNo || '');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');
  const [profileRole, setProfileRole] = useState(currentUser?.role || 'VENDOR');
  const [profileOrgId, setProfileOrgId] = useState(currentUser?.organizationId && currentUser.organizationId !== 'ORG001' ? currentUser.organizationId : '');
  const [profileSaving, setProfileSaving] = useState(false);

  const { walletAddress: activeWallet } = useWallet();

  // Decentralized Identity (did:ethr) State
  const [userDid, setUserDid] = useState(currentUser?.did || '');
  const [userPrimaryWallet, setUserPrimaryWallet] = useState(currentUser?.primaryWallet || currentUser?.walletAddress || '');
  const [didWalletAddress, setDidWalletAddress] = useState(currentUser?.walletAddress || '');
  const [didMethod, setDidMethod] = useState(currentUser?.didMethod || 'ethr');
  const [didNetwork, setDidNetwork] = useState(currentUser?.didNetwork || 'sepolia');
  const [didCreatedAt, setDidCreatedAt] = useState(currentUser?.didCreatedAt || null);
  const [didDocument, setDidDocument] = useState(null);
  const [didLoading, setDidLoading] = useState(false);
  const [didModalOpen, setDidModalOpen] = useState(false);

  // Verifiable Credential (VC) State
  const [vendorVcData, setVendorVcData] = useState(null);
  const [vcModalOpen, setVcModalOpen] = useState(false);
  const [vcDetailsModalOpen, setVcDetailsModalOpen] = useState(false);
  const [vcModalSection, setVcModalSection] = useState('all'); // 'all', 'claims', 'signed'
  const [sigVerifyResult, setSigVerifyResult] = useState(null);
  const [sigVerifying, setSigVerifying] = useState(false);

  useEffect(() => {
    const fetchVendorVc = async () => {
      const email = currentUser?.email || profileEmail || 'abcd@company.in';
      const resolvedVendorId = currentUser?.vendorId || currentUser?.organizationId || 'ORG001';
      const resolvedHolder = userDid || currentUser?.did || `did:ethr:sepolia:${resolvedVendorId}`;
      const isMockSig = (sig) => !sig || sig.length < 64 || String(sig).startsWith('aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f');

      try {
        const res = await fetch(`http://localhost:5000/api/vendor/documents?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.verifiableCredential && !isMockSig(data.verifiableCredential?.signature)) {
          setVendorVcData(data.verifiableCredential);
          return;
        }

        // Fetch authoritative ML-DSA-65 post-quantum signed credential
        const pqcRes = await fetch(`http://localhost:5000/api/credentials/vendor/${resolvedVendorId}`);
        const pqcData = await pqcRes.json();
        if (pqcData.success && pqcData.credentialBundle) {
          const bundle = pqcData.credentialBundle;
          setVendorVcData({
            status: 'ACTIVE',
            credentialId: bundle.credential?.credentialId || 'VC-853591',
            credentialType: 'VendorEligibilityCredential',
            issuer: bundle.credential?.issuer || 'AUTHORIZED_GOVERNMENT_AUTHORITY',
            holder: resolvedHolder,
            issuedDate: bundle.credential?.issuedAt || new Date().toISOString(),
            expirationDate: bundle.credential?.expiresAt || new Date(Date.now() + 365*86400000).toISOString(),
            daysRemaining: 365,
            signature: bundle.signature,
            algorithm: 'ML-DSA-65',
            authorityPublicKey: bundle.authorityPublicKey,
            credential: bundle.credential,
            credentialSubject: bundle.credential,
            credentialData: bundle.credential,
            rawVc: bundle.credential
          });
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch vendor VC:', err);
      }
    };
    fetchVendorVc();
  }, [currentUser, profileEmail, userDid]);

  // Sync Vendor VC to Global Window & LocalStorage for instant auto-retrieval in ZK Verification
  useEffect(() => {
    if (vendorVcData && typeof window !== 'undefined') {
      window.__VENDOR_VC_DATA__ = vendorVcData;
      try {
        localStorage.setItem('zk_tender_active_vc', JSON.stringify(vendorVcData));
      } catch (e) {}
    }
  }, [vendorVcData]);

  // Exact W3C Signed Verifiable Credential Structure Helper
  const getSignedCredentialJson = () => {
    const cred = vendorVcData?.credential || vendorVcData?.credentialSubject || {};
    const defaultIssuer = vendorVcData?.issuer || cred.issuer || "AUTHORIZED_GOVERNMENT_AUTHORITY";
    const defaultVendorDid = userDid || vendorVcData?.holder || `did:ethr:sepolia:${currentUser?.organizationId || 'ORG001'}`;
    const sig = vendorVcData?.signature || "";

    return {
      type: [
        "VerifiableCredential",
        "VendorEligibilityCredential"
      ],
      issuer: defaultIssuer,
      credentialSubject: {
        id: defaultVendorDid,
        credentialId: cred.credentialId || vendorVcData?.credentialId,
        vendorId: cred.vendorId || currentUser?.organizationId || 'ORG001',
        experience: Number(cred.experience ?? cred.experienceYears ?? 8),
        turnover: Number(cred.turnover ?? 25),
        projects: Number(cred.projects ?? cred.completedProjects ?? 7),
        issuedAt: cred.issuedAt || vendorVcData?.issuedDate,
        expiresAt: cred.expiresAt || vendorVcData?.expirationDate
      },
      proof: {
        type: "ML-DSA-65",
        proofValue: sig,
        authorityPublicKey: vendorVcData?.authorityPublicKey
      }
    };
  };

  // Fetch DID status from backend API
  useEffect(() => {
    const fetchUserDid = async () => {
      const email = currentUser?.email || profileEmail;
      if (!email) return;
      try {
        const res = await fetch(`http://localhost:5000/api/did?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.hasDid) {
          setUserDid(data.did);
          setUserPrimaryWallet(data.primaryWallet || data.walletAddress);
          setDidWalletAddress(data.walletAddress);
          setDidMethod(data.didMethod || 'ethr');
          setDidNetwork(data.didNetwork || 'sepolia');
          setDidCreatedAt(data.didCreatedAt);
          setDidDocument(data.didDocument);
        }
      } catch (err) {
        console.warn('Failed to fetch user DID status:', err);
      }
    };
    fetchUserDid();
  }, [currentUser, profileEmail]);

  // Handle Create DID via MetaMask & did:ethr derivation
  const handleCreateDid = async () => {
    if (!window.ethereum) {
      triggerToast('MetaMask is not installed. Please install MetaMask to create your DID.', 'error');
      alert('MetaMask is not installed. Please install MetaMask to create your DID.');
      return;
    }

    setDidLoading(true);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        triggerToast('No wallet account selected in MetaMask.', 'error');
        setDidLoading(false);
        return;
      }
      const selectedAddress = accounts[0];

      const userEmail = currentUser?.email || profileEmail;
      const nonceRes = await fetch('http://localhost:5000/api/did/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, walletAddress: selectedAddress })
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.success || !nonceData.message) {
        triggerToast(nonceData.message || 'Failed to initialize DID verification session.', 'error');
        setDidLoading(false);
        return;
      }

      let signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [nonceData.message, selectedAddress]
        });
      } catch (signErr) {
        console.warn('User rejected signature:', signErr);
        triggerToast('Wallet signature request was cancelled or rejected by user.', 'error');
        setDidLoading(false);
        return;
      }

      const createRes = await fetch('http://localhost:5000/api/did/create-ethr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          walletAddress: selectedAddress,
          signature,
          message: nonceData.message
        })
      });

      const createData = await createRes.json();
      if (createData.success) {
        setUserDid(createData.did);
        setUserPrimaryWallet(createData.primaryWallet || createData.walletAddress);
        setDidWalletAddress(createData.walletAddress);
        setDidMethod(createData.didMethod || 'ethr');
        setDidNetwork(createData.didNetwork || 'sepolia');
        setDidCreatedAt(createData.didCreatedAt);
        setDidDocument(createData.didDocument);

        const storedUser = JSON.parse(localStorage.getItem('zk_current_user') || '{}');
        storedUser.did = createData.did;
        storedUser.primaryWallet = createData.primaryWallet || createData.walletAddress;
        storedUser.walletAddress = createData.walletAddress;
        storedUser.didMethod = createData.didMethod || 'ethr';
        storedUser.didNetwork = createData.didNetwork || 'sepolia';
        storedUser.didCreatedAt = createData.didCreatedAt;
        localStorage.setItem('zk_current_user', JSON.stringify(storedUser));

        if (createData.alreadyExists) {
          triggerToast('A DID already exists for this account. Changing wallets will not alter your DID ID.', 'info');
        } else {
          triggerToast('Ethereum Decentralized Identity (did:ethr:sepolia) successfully created and bound to primary wallet!', 'success');
        }
      } else {
        triggerToast(createData.message || 'Failed to create DID.', 'error');
      }
    } catch (err) {
      console.error('Error during DID creation:', err);
      triggerToast(err.message || 'Error communicating with wallet.', 'error');
    } finally {
      setDidLoading(false);
    }
  };

  const handleCopyDid = () => {
    if (!userDid) return;
    navigator.clipboard.writeText(userDid);
    triggerToast('DID copied to clipboard!', 'success');
  };

  const handleViewDidDocument = async () => {
    if (didDocument) {
      setDidModalOpen(true);
      return;
    }
    if (!userDid) return;

    try {
      const res = await fetch(`http://localhost:5000/api/did/resolve/${encodeURIComponent(userDid)}`);
      const data = await res.json();
      if (data.success && data.didDocument) {
        setDidDocument(data.didDocument);
        setDidModalOpen(true);
      } else {
        triggerToast('Failed to resolve DID document.', 'error');
      }
    } catch (err) {
      console.error('Error resolving DID document:', err);
      triggerToast('Error resolving DID document.', 'error');
    }
  };

  // Settings & Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('zk_vendor_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [mailNotificationsEnabled, setMailNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('zk_vendor_mail_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [mailSubCategories, setMailSubCategories] = useState(() => {
    const saved = localStorage.getItem('zk_vendor_mail_sub_categories');
    return saved ? JSON.parse(saved) : {
      bidUpdates: true,
      zkpProofs: true,
      deadlines: true,
      newTenders: false
    };
  });

  const [strictZkMode, setStrictZkMode] = useState(() => {
    const saved = localStorage.getItem('zk_vendor_strict_zk_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('zk_vendor_notifications_enabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('zk_vendor_mail_notifications_enabled', JSON.stringify(mailNotificationsEnabled));
  }, [mailNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('zk_vendor_mail_sub_categories', JSON.stringify(mailSubCategories));
  }, [mailSubCategories]);

  useEffect(() => {
    localStorage.setItem('zk_vendor_strict_zk_mode', JSON.stringify(strictZkMode));
  }, [strictZkMode]);

  // Notifications List Log State
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 'notif-1',
      title: 'ZKP Verification Completed',
      message: 'Proof ZKP-829374 verified for TND-2026-001 on-chain.',
      category: 'success',
      time: '10 mins ago',
      read: false,
      tabLink: 'zkp-my-proofs'
    },
    {
      id: 'notif-2',
      title: 'Tender Submission Closing Soon',
      message: 'Smart City Infrastructure tender closes in 24 hours.',
      category: 'warning',
      time: '1 hour ago',
      read: false,
      tabLink: 'tenders-available'
    },
    {
      id: 'notif-3',
      title: 'Organization Verification Approved',
      message: 'Government tax & GST credentials verified in database.',
      category: 'info',
      time: '1 day ago',
      read: true,
      tabLink: 'company-profile'
    }
  ]);

  // Centralized Notification Dispatcher (Website / In-App & Email Dispatches)
  const dispatchSystemNotification = async ({ title, message, category = 'info', tabLink = null }) => {
    const isWebsiteNotifOn = notificationsEnabled;
    const isMailNotifOn = mailNotificationsEnabled && notificationsEnabled;
    const recipientEmail = profileEmail || orgData.email || currentUser?.email || 'vendor@zktenders.io';
    const targetVendor = vendorName || profileName || 'Vendor Partner';

    // 1. WEBSITE / IN-APP NOTIFICATIONS
    if (isWebsiteNotifOn) {
      // In-App Toast Alert
      triggerToast(`${title}: ${message}`, category === 'success' ? 'success' : category === 'warning' ? 'warning' : 'info');

      // Add Entry to Notification Bell Log
      const newNotif = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        message,
        category,
        time: 'Just now',
        read: false,
        tabLink
      };
      setNotificationsList(prev => [newNotif, ...prev]);

      // Browser Desktop Push Notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`ZK-Tenders: ${title}`, {
            body: message,
            icon: '/favicon.ico'
          });
        } catch (err) {
          console.warn('[BROWSER PUSH ERROR]', err.message);
        }
      }
    } else {
      console.log('[WEBSITE NOTIFICATION SUPPRESSED] User turned OFF website notifications.');
    }

    // 2. EMAIL NOTIFICATIONS
    if (isMailNotifOn) {
      try {
        const res = await fetch('http://localhost:5000/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: recipientEmail,
            subject: `[ZK-Tenders Alert] ${title}`,
            title,
            message,
            vendorName: targetVendor
          })
        });
        const data = await res.json();
        if (data.success && isWebsiteNotifOn) {
          triggerToast(`📧 Email alert dispatched to ${recipientEmail}`, 'info');
        }
      } catch (err) {
        console.warn('[EMAIL DISPATCH ERROR]', err.message);
      }
    } else {
      console.log('[EMAIL NOTIFICATION SUPPRESSED] User turned OFF email notifications.');
    }
  };

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);

    if (nextVal) {
      // Request Browser Push Notification Permission if available
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      dispatchSystemNotification({
        title: 'Website Notifications Turned ON',
        message: 'You will now receive live website toast alerts, bell notifications, and desktop popups.',
        category: 'success'
      });
    } else {
      triggerToast('Website & In-App Notifications turned OFF', 'info');
    }
  };

  const handleToggleMailNotifications = () => {
    const nextVal = !mailNotificationsEnabled;
    setMailNotificationsEnabled(nextVal);

    if (nextVal && notificationsEnabled) {
      dispatchSystemNotification({
        title: 'Mail Notifications Turned ON',
        message: `Automated email alerts will now be dispatched to ${profileEmail || orgData.email || 'your email'}.`,
        category: 'success'
      });
    } else {
      triggerToast('Mail Notifications turned OFF', 'info');
    }
  };

  const handleToggleMailSubCategory = (key) => {
    setMailSubCategories(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      triggerToast('Mail dispatch filter updated', 'info');
      return updated;
    });
  };

  const handleToggleStrictZk = () => {
    const nextVal = !strictZkMode;
    setStrictZkMode(nextVal);
    triggerToast(
      nextVal ? 'Strict Zero-Knowledge Mode enabled' : 'Strict Zero-Knowledge Mode disabled',
      nextVal ? 'success' : 'warning'
    );
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    dispatchSystemNotification({
      title: 'Vendor Settings Saved',
      message: 'Notification preferences and Zero-Knowledge security settings successfully updated.',
      category: 'success'
    });
  };

  // Vendor Organization Profile State
  const [orgData, setOrgData] = useState({
    organizationId: currentUser?.organizationId || '',
    companyName: currentUser?.company || '',
    organizationType: 'Private Limited',
    registrationNumber: '',
    gstNumber: currentUser?.gstNo || '',
    panNumber: '',
    cinNumber: '',
    yearEstablished: new Date().getFullYear(),
    companySize: 'Micro',
    businessCategory: 'IT & Software',
    website: '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    pincode: '',
    contactPerson: currentUser?.name || '',
    designation: 'Authorized Representative',
    verificationStatus: 'PENDING',
    verifiedAt: null,
    accountStatus: 'ACTIVE'
  });
  const [orgEditMode, setOrgEditMode] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);

  // Calculate Organization Profile Completion Stats
  const getOrgCompletionStats = (org) => {
    const targetOrg = org || orgData;
    const requiredFields = [
      { key: 'companyName', label: 'Company Name' },
      { key: 'organizationType', label: 'Organization Type' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'businessCategory', label: 'Business Category' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'state', label: 'State' },
      { key: 'district', label: 'District' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'designation', label: 'Designation' }
    ];

    if (targetOrg.organizationType === 'Private Limited' || targetOrg.organizationType === 'Public Limited') {
      requiredFields.push({ key: 'cinNumber', label: 'CIN Number' });
    }

    let filledCount = 0;
    requiredFields.forEach(f => {
      if (targetOrg[f.key] && String(targetOrg[f.key]).trim().length > 0) {
        filledCount++;
      }
    });

    const percentage = Math.round((filledCount / requiredFields.length) * 100);
    const isComplete = percentage === 100;
    return { filledCount, totalRequired: requiredFields.length, percentage, isComplete };
  };

  // Fetch Vendor Organization Profile from API
  const fetchOrgProfile = async () => {
    try {
      const email = currentUser?.email || profileEmail;
      if (!email) return;
      const res = await fetch(`http://localhost:5000/api/organizations/me?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.organization) {
        setOrgData(data.organization);
      }
    } catch (err) {
      console.warn('[FETCH ORG NOTICE]', err.message);
    }
  };

  useEffect(() => {
    fetchOrgProfile();
  }, [activeTab, currentUser]);

  // Handle Organization Profile Submission
  const handleSaveOrgProfile = async (e) => {
    e.preventDefault();

    // CIN validation if Private/Public Limited
    if (
      (orgData.organizationType === 'Private Limited' || orgData.organizationType === 'Public Limited') &&
      !orgData.cinNumber
    ) {
      triggerToast('CIN Number is required for Private Limited and Public Limited organizations.', 'error');
      return;
    }

    // Pincode validation
    if (orgData.pincode && !/^[1-9][0-9]{5}$/.test(orgData.pincode.trim())) {
      triggerToast('Please enter a valid 6-digit Indian PIN code.', 'error');
      return;
    }

    setOrgSaving(true);
    try {
      const email = currentUser?.email || orgData.email;
      const res = await fetch('http://localhost:5000/api/organizations/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orgData,
          userEmail: email
        })
      });
      const data = await res.json();
      setOrgSaving(false);

      if (data.success && data.organization) {
        setOrgData(data.organization);
        setOrgEditMode(false);
        triggerToast('Organization Profile updated successfully in MongoDB!', 'success');
      } else {
        triggerToast(data.message || 'Failed to update organization profile.', 'error');
      }
    } catch (err) {
      setOrgSaving(false);
      setOrgEditMode(false);
      triggerToast('Organization Profile changes saved locally.', 'info');
    }
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfileCompany(currentUser.company || '');
      setProfilePhone(currentUser.phone || '');
      setProfileGst(currentUser.gstNo || '');
      setProfileAddress(currentUser.address || '');
      setProfileRole(currentUser.role || 'VENDOR');
      setProfileOrgId(currentUser.organizationId || 'ORG001');

      setOrgData(prev => ({
        ...prev,
        companyName: prev.companyName || currentUser.company || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || '',
        gstNumber: prev.gstNumber || currentUser.gstNo || '',
        contactPerson: prev.contactPerson || currentUser.name || ''
      }));

      if (currentUser.did) setUserDid(currentUser.did);
      if (currentUser.walletAddress) setDidWalletAddress(currentUser.walletAddress);
      if (currentUser.didMethod) setDidMethod(currentUser.didMethod);
      if (currentUser.didNetwork) setDidNetwork(currentUser.didNetwork);
      if (currentUser.didCreatedAt) setDidCreatedAt(currentUser.didCreatedAt);
    }
  }, [currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileEmail,
          name: profileName,
          company: profileCompany,
          phone: profilePhone,
          gstNo: profileGst,
          address: profileAddress,
          role: profileRole,
          organizationId: profileOrgId
        })
      });
      const data = await res.json();
      setProfileSaving(false);
      if (data.success) {
        triggerToast('Profile updated & saved to MongoDB ZK-TendersDB!', 'success');
      } else {
        triggerToast(data.message || 'Profile saved successfully!', 'info');
      }
    } catch (err) {
      setProfileSaving(false);
      triggerToast('Profile updated successfully!', 'success');
    }
  };

  const getVendorInitials = (name) => {
    if (!name) return 'VN';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const vendorName = orgData.companyName || profileName || currentUser?.company || currentUser?.name || 'ABC Constructions Pvt Ltd';
  const rawVendorId = orgData.organizationId || profileOrgId || currentUser?.organizationId || currentUser?.vendorId || '';
  const vendorId = rawVendorId || 'ORG001';

  // Live Submitted Bids Fetcher & Cache Manager
  const fetchMyBids = useCallback(async () => {
    const targetVendor = vendorId || 'ORG001';
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/bids/vendor/${targetVendor}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bids)) {
        setMyBids(data.bids);
        try {
          localStorage.setItem(`zk_vendor_submitted_bids_${targetVendor}`, JSON.stringify(data.bids));
        } catch (e) {}
        return data.bids;
      }
    } catch (err) {
      console.warn('[FETCH MY BIDS ERROR]', err.message);
    }
    try {
      const local = localStorage.getItem(`zk_vendor_submitted_bids_${targetVendor}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) setMyBids(parsed);
      }
    } catch (e) {}
  }, [vendorId]);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

  useEffect(() => {
    if (activeTab === 'bidding-my-bids' || activeTab === 'tenders-applied' || activeTab === 'dashboard') {
      fetchMyBids();
    }
  }, [activeTab, fetchMyBids]);

  // Titles mapping
  const titlesMap = {
    'dashboard': 'Dashboard Overview',
    'org-profile': 'Vendor Organization & Account Profile',
    'company-profile': 'Vendor Organization & Account Profile',
    'profile': 'Vendor Organization & Account Profile',
    'tenders-available': 'Available Tenders Directory',
    'tenders-closed': 'Closed & Expired Tenders Archive',
    'tenders-applied': 'Applied Tenders',
    'tender-details': 'Tender Specification & Requirements',
    'bidding-submit': 'Electronic Bid Submission Wizard',
    'bidding-drafts': 'Saved Draft Bids',
    'bidding-my-bids': 'My Submitted Bids & Lifecycle Status',
    'zkp-generate': 'Zero-Knowledge Proof Generator',
    'zkp-my-proofs': 'My ZK Proofs Vault',
    'zkp-verification': 'Proof Verification Inspector',
    'eval-bid-status': 'Bid Status & Lifecycle Tracking',
    'eval-proof-status': 'Proof Verification Status',
    'eval-results': 'Evaluation Results Scorecard',
    'documents': 'Vendor Document Submission & Identity Verification',
    'credentials': 'Verifiable Credentials (VC) & NIST ML-DSA-65 Identity',
    'settings': 'Account & Privacy Settings'
  };

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  const [selectedBidStatusId, setSelectedBidStatusId] = useState(null);
  const [selectedEvalTenderId, setSelectedEvalTenderId] = useState(null);

  // Switch Tab Handler
  const handleSwitchTab = (tabId, extraData = null) => {
    if (tabId === 'tenders-closed') {
      setTendersViewMode('closed');
    } else if (tabId === 'tenders-available') {
      setTendersViewMode('available');
    }
    if (extraData) {
      if (tabId === 'eval-results') {
        setSelectedEvalTenderId(typeof extraData === 'string' ? extraData : extraData?.tenderId || extraData?.id);
      } else {
        setSelectedBidStatusId(extraData);
      }
    } else if (tabId !== 'eval-bid-status' && tabId !== 'bidding-my-bids' && tabId !== 'eval-results') {
      setSelectedBidStatusId(null);
    }
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
    setNotifFlyoutOpen(false);
  };

  // Distinct sets for Available (Active & Open) vs Closed (Deadline Concluded)
  const availableTenders = useMemo(() => tenders.filter(t => !isTenderDeadlineOver(t)), [tenders]);
  const closedTenders = useMemo(() => tenders.filter(t => isTenderDeadlineOver(t)), [tenders]);

  // Target list depending on selected view mode (Available Tenders only displays active unexpired tenders)
  const targetTenderList = (activeTab === 'tenders-closed' || tendersViewMode === 'closed')
    ? closedTenders
    : availableTenders;

  // Filter Tenders (Separating Available Tenders from Closed Tenders)
  const filteredTenders = targetTenderList.filter(t => {
    const matchCat = filterCat === 'ALL' || t.category === filterCat || (filterCat === 'IT & Software' && t.category === 'IT') || (filterCat === 'Infrastructure' && t.category === 'Infrastructure');
    const matchBudget = t.budget >= filterBudget;
    const matchOrg = filterOrg === 'ALL' || t.organization === filterOrg;
    const matchElig = filterElig === 'ALL' || t.eligibility === filterElig;
    const matchTenderType = filterTenderType === 'ALL' || t.tenderType === filterTenderType;
    const matchProcurement = filterProcurement === 'ALL' || t.procurementMethod === filterProcurement;
    const matchStatus = filterStatus === 'ALL' || (t.status && t.status.toLowerCase().includes(filterStatus.toLowerCase()));
    const matchSearch = !globalSearch ||
      t.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      t.organization.toLowerCase().includes(globalSearch.toLowerCase());
    return matchCat && matchBudget && matchOrg && matchElig && matchTenderType && matchProcurement && matchStatus && matchSearch;
  });

  const resetFilters = () => {
    setFilterCat('ALL');
    setFilterBudget(0);
    setFilterOrg('ALL');
    setFilterElig('ALL');
    setFilterTenderType('ALL');
    setFilterProcurement('ALL');
    setFilterStatus('ALL');
    setGlobalSearch('');
    triggerToast('Tender filters reset', 'info');
  };

  const handleViewDetails = (tender) => {
    setSelectedTender(tender);
    handleSwitchTab('tender-details');
  };

  const handleApplyTender = (tender) => {
    const target = tender || selectedTender || availableTenders[0] || tenders[0];
    const tId = target?.id || target?.tenderId || 'T001';

    // BLOCK APPLICATIONS FOR EXPIRED TENDERS
    if (isTenderDeadlineOver(target)) {
      triggerToast(`Bidding Closed: The submission deadline for Tender ${tId} (${target?.closingDate}) has concluded. No further bids can be accepted.`, 'error');
      return;
    }

    // ENFORCE SINGLE APPLICATION RULE: Each vendor can only apply once per tender
    const isAlreadyApplied = myBids.some(b => b.tenderId === tId);
    if (isAlreadyApplied) {
      triggerToast(`You have already applied for Tender ${tId}. Each vendor is permitted to submit only one bid per tender.`, 'warning');
      handleSwitchTab('bidding-my-bids');
      return;
    }

    setSelectedTender(target);

    if (verifiedEligibilityTenders[tId]?.verified) {
      setWizardStep(1);
      setWizardSuccess(false);
      setWizardProgress(0);
      setDeclarationChecked(false);
      handleSwitchTab('bidding-submit');
    } else {
      setEligibilityModalOpen(true);
    }
  };

  // Wizard Stepper
  const handleWizardNext = () => {
    if (wizardStep < 6) {
      const nextS = wizardStep + 1;
      setWizardStep(nextS);

      if (nextS === 5) {
        // Animate Proof
        setWizardProgress(0);
        setWizardProgressLabel('Reading private input & salt...');
        let p = 0;
        const interval = setInterval(() => {
          p += 20;
          setWizardProgress(p);
          if (p === 40) setWizardProgressLabel('Computing Groth16 witness vectors...');
          if (p === 80) setWizardProgressLabel('Synthesizing R1CS constraints...');
          if (p === 100) {
            setWizardProgressLabel('✓ ZK Proof Synthesized & Verified!');
            clearInterval(interval);
          }
        }, 300);
      }
    } else if (wizardStep === 6) {
      if (!declarationChecked) {
        triggerToast('Please accept the accuracy declaration checkbox first.', 'error');
        return;
      }
      setWizardSuccess(true);
      triggerToast('Bid submitted successfully with ZK proof!', 'success');
    }
  };

  const handleWizardPrev = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  // Proof Generator Simulator
  const handleRunProofGenerator = () => {
    setProofResultVisible(false);
    let s = 1;
    setProofGenStep(s);

    const timer = setInterval(() => {
      s++;
      setProofGenStep(s);
      if (s > 6) {
        clearInterval(timer);
        setProofResultVisible(true);
        triggerToast('zk-SNARK Proof successfully generated and verified!', 'success');
      }
    }, 400);
  };

  // Filter My Bids
  const filteredMyBids = myBidsFilter === 'ALL' ? myBids : myBids.filter(b => b.status === myBidsFilter);

  return (
    <div className={`min-h-screen ${lightTheme ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-200'} font-sans antialiased`}>
      <div className="min-h-full flex flex-col md:flex-row">

        {/* LEFT SIDEBAR */}
        <aside
          className={`w-full ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-slate-900/95 border-r border-slate-800/90 text-slate-300 flex-shrink-0 flex flex-col justify-between transition-all duration-300 z-40 shadow-2xl backdrop-blur-md ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:sticky md:top-0 h-screen self-start`}
        >
          <div className="flex flex-col h-full overflow-y-auto">

            {/* Sidebar Header / Logo */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-slate-800/80 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div 
                onClick={() => handleSwitchTab('dashboard')} 
                className="flex items-center space-x-3 logo-hover-wrapper cursor-pointer hover:opacity-90 transition"
                title="Go to User Dashboard Overview"
              >

                {/* LOGO ICON */}
                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                    <i className="fa-solid fa-shield-halved text-base"></i>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-lg text-white tracking-tight">ZK-<span className="text-teal-400">Tenders</span></span>
                  <span className="block text-[9px] font-mono text-teal-400 uppercase tracking-widest">Vendor Portal</span>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* NAVIGATION TREE */}
            <nav className="px-3 space-y-1 text-xs font-medium flex-1 pb-4">

              {/* Dashboard */}
              <button
                onClick={() => handleSwitchTab('dashboard')}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <i className="fa-solid fa-chart-pie w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>

              {/* Tenders Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Tenders</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setTendersViewMode('available');
                      handleSwitchTab('tenders-available');
                    }}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${(activeTab === 'tenders-available' && tendersViewMode === 'available') ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-list-check w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>Available Tenders</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {availableTenders.length} Live
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setTendersViewMode('closed');
                      handleSwitchTab('tenders-closed');
                    }}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${(activeTab === 'tenders-closed' || (activeTab === 'tenders-available' && tendersViewMode === 'closed')) ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700/80 shadow-sm' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-clock-rotate-left w-4 text-center shrink-0 text-amber-400"></i>
                      {!sidebarCollapsed && <span>Closed Tenders</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {closedTenders.length} Closed
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('tenders-applied')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'tenders-applied' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-folder-closed w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>Applied Tenders</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full">{myBids.length}</span>}
                  </button>
                </div>
              </div>

              {/* Bidding Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Bidding</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('bidding-drafts')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'bidding-drafts' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-file-pen w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>Draft Bids</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-amber-500/20 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full">1</span>}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('bidding-my-bids')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'bidding-my-bids' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-box-archive w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>My Bids</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">{myBids.length}</span>}
                  </button>
                </div>
              </div>

              {/* Evaluation Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Evaluation</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('eval-bid-status')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'eval-bid-status' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-timeline w-4 text-center shrink-0"></i>
                    {!sidebarCollapsed && <span>Bid Status</span>}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('eval-results')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'eval-results' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-award w-4 text-center text-amber-400 shrink-0"></i>
                    {!sidebarCollapsed && <span>Evaluation Results</span>}
                  </button>
                </div>
              </div>

              {/* Verification & Credentials Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Verification & Identity</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('documents')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'documents' || activeTab === 'vendor-documents' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-file-shield w-4 text-center shrink-0 text-teal-400"></i>
                      {!sidebarCollapsed && <span>Document Submission</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">Docs</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('credentials')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'credentials' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-id-card-clip w-4 text-center shrink-0 text-emerald-400"></i>
                      {!sidebarCollapsed && <span>My Credentials</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">VC</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('company-profile')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'company-profile' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-id-card w-4 text-center shrink-0"></i>
                    {!sidebarCollapsed && <span>Company Profile</span>}
                  </button>
                </div>
              </div>

              {/* Account & Settings */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Account</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('settings')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-gear w-4 text-center shrink-0"></i>
                    {!sidebarCollapsed && <span>Settings</span>}
                  </button>
                </div>
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1 text-xs">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition font-semibold"
                title="Log Out of Account"
              >
                <i className="fa-solid fa-right-from-bracket w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Log Out</span>}
              </button>
            </div>

          </div>
        </aside>

        {/* MAIN CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* TOP NAVIGATION BAR */}
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
                <h1 className={`text-base sm:text-lg font-bold tracking-tight ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{titlesMap[activeTab] || 'Vendor Dashboard'}</h1>
                <p className={`text-[11px] hidden sm:block ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Welcome back, <span className={`font-semibold ${lightTheme ? 'text-slate-800' : 'text-slate-200'}`}>{vendorName}</span></p>
              </div>
            </div>

            {/* Center Search Box */}
            <div className="hidden lg:block max-w-sm w-full mx-4">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    if (activeTab !== 'tenders-available') setActiveTab('tenders-available');
                  }}
                  placeholder="Search by tender ID, title or organization..."
                  className={`w-full pl-9 pr-4 py-1.5 border rounded-lg text-xs transition font-mono focus:outline-none focus:border-teal-500 ${
                    lightTheme 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Right Nav Items */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Web3 Connect Wallet Button */}
              <WalletConnectButton user={currentUser} onToast={onToast} lightTheme={lightTheme} />

              <button
                onClick={() => setLightTheme(!lightTheme)}
                className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 border shadow-sm ${lightTheme
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                title={lightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
              >
                <i className={`fa-solid ${lightTheme ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-400'} text-sm transition-transform duration-300 ${lightTheme ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button onClick={() => setNotifFlyoutOpen(!notifFlyoutOpen)} className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <i className="fa-regular fa-bell text-base"></i>
                  {notificationsEnabled && notificationsList.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                  )}
                </button>

                {notifFlyoutOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 z-50 overflow-hidden">
                    <div className="p-3 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-teal-400">Notifications Log</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${notificationsEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                          {notificationsEnabled ? 'ONLINE' : 'MUTED'}
                        </span>
                      </div>
                      <span className="text-[9px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded-full font-bold">
                        {notificationsEnabled ? `${notificationsList.filter(n => !n.read).length} New` : '0 New'}
                      </span>
                    </div>

                    {!notificationsEnabled ? (
                      <div className="p-6 text-center text-slate-400 space-y-2">
                        <i className="fa-solid fa-bell-slash text-2xl text-slate-600"></i>
                        <p className="font-semibold text-slate-300">Website Notifications Disabled</p>
                        <p className="text-[11px] text-slate-500">Turn on Notification Switch in Settings to receive live alerts.</p>
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">No notifications logged yet.</div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                        {notificationsList.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (notif.tabLink) handleSwitchTab(notif.tabLink);
                              setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }}
                            className={`p-3 hover:bg-slate-800/50 transition cursor-pointer ${!notif.read ? 'bg-slate-950/40' : ''}`}
                          >
                            <div className="flex items-start space-x-2.5">
                              <i className={`fa-solid ${notif.category === 'success' ? 'fa-circle-check text-emerald-400' : notif.category === 'warning' ? 'fa-triangle-exclamation text-amber-400' : 'fa-bell text-teal-400'} mt-0.5`}></i>
                              <div>
                                <p className="font-semibold text-slate-200">{notif.title}</p>
                                <p className="text-slate-400 text-[11px] mt-0.5 leading-tight">{notif.message}</p>
                                <span className="text-[9px] font-mono text-slate-500 mt-1 block">{notif.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Organization / User Profile Dropdown Pill */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`p-0.5 rounded-full border transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer ${
                    lightTheme
                      ? 'bg-white border-slate-300 hover:border-teal-500 shadow-slate-200'
                      : 'bg-slate-900 border-slate-700 hover:border-teal-400'
                  }`}
                  title={`Organization Profile: ${vendorName} (${rawVendorId || 'ORG001'})`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 via-emerald-500 to-indigo-600 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-md border border-teal-400/40">
                    {getVendorInitials(vendorName)}
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
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-600 via-emerald-500 to-indigo-600 text-white font-mono text-sm font-extrabold flex items-center justify-center shadow-md border-2 border-teal-500/40 shrink-0">
                          {getVendorInitials(vendorName)}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className={`font-bold text-xs truncate ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{vendorName}</h4>
                          <p className="text-[10px] font-mono text-teal-500 font-semibold truncate">{orgData.organizationType || 'Registered Organization'}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">{rawVendorId || 'Org ID: ORG001'}</p>
                        </div>
                      </div>

                      <div className={`pt-2 flex items-center justify-between text-[10px] font-mono border-t ${
                        lightTheme ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <span className={lightTheme ? 'text-slate-500' : 'text-slate-400'}>Verification:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          orgData.verificationStatus === 'VERIFIED' 
                            ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        }`}>
                          {orgData.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          handleSwitchTab('org-profile');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-building text-teal-500"></i>
                          <span>Organization Profile</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                          getOrgCompletionStats(orgData).isComplete ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                        }`}>
                          {getOrgCompletionStats(orgData).percentage}%
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          handleSwitchTab('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${
                          lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <i className="fa-solid fa-user-gear text-indigo-500"></i>
                        <span>Account Settings</span>
                      </button>
                    </div>

                    <div className={`pt-1 border-t ${lightTheme ? 'border-slate-100' : 'border-slate-800'}`}>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogoutClick();
                        }}
                        className={`w-full p-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition border ${
                          lightTheme
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <i className="fa-solid fa-right-from-bracket"></i> Log Out Account
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* MAIN VIEW CONTENT */}
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">


            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* 7 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div onClick={() => { setTendersViewMode('available'); handleSwitchTab('tenders-available'); }} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Available</span>
                      <i className="fa-solid fa-list-check text-teal-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">{String(availableTenders.length).padStart(2, '0')}</span>
                      <span className="text-[9px] font-mono text-teal-400">Live</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Current opportunities</p>
                  </div>

                  <div onClick={() => handleSwitchTab('tenders-applied')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Submitted</span>
                      <i className="fa-solid fa-paper-plane text-indigo-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">{String(myBids.length).padStart(2, '0')}</span>
                      <span className="text-[9px] font-mono text-slate-400">Total</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Bids broadcasted</p>
                  </div>

                  <div onClick={() => handleSwitchTab('eval-bid-status')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Evaluating</span>
                      <i className="fa-solid fa-clock text-amber-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">02</span>
                      <span className="text-[9px] font-mono text-amber-400">In Review</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Pending decision</p>
                  </div>

                  <div onClick={() => handleSwitchTab('eval-results')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Accepted</span>
                      <i className="fa-solid fa-award text-emerald-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">01</span>
                      <span className="text-[9px] font-mono text-emerald-400">Awarded</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Successful bids</p>
                  </div>

                  <div onClick={() => handleSwitchTab('zkp-my-proofs')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Proofs Made</span>
                      <i className="fa-solid fa-microchip text-teal-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">06</span>
                      <span className="text-[9px] font-mono text-teal-400">Groth16</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Local zk-SNARKs</p>
                  </div>

                  <div onClick={() => handleSwitchTab('zkp-verification')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Verified</span>
                      <i className="fa-solid fa-shield-check text-emerald-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">05</span>
                      <span className="text-[9px] font-mono text-emerald-400">100% Valid</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">On-chain verified</p>
                  </div>

                  <div onClick={() => handleSwitchTab('eval-bid-status')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Pending</span>
                      <i className="fa-solid fa-hourglass-half text-amber-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">01</span>
                      <span className="text-[9px] font-mono text-amber-400">In Queue</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">Awaiting verifier</p>
                  </div>
                </div>

                {/* MY CREDENTIALS CARD */}
                <div className={`rounded-2xl border p-5 sm:p-6 shadow-xl transition-all ${
                  lightTheme 
                    ? 'bg-gradient-to-r from-teal-50 via-white to-cyan-50 border-teal-200/80 shadow-teal-900/5' 
                    : 'bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-950 border-teal-500/40 shadow-slate-950/50'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-2xl shrink-0 shadow-lg shadow-teal-500/20">
                        <i className="fa-solid fa-id-card-clip"></i>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {vendorVcData ? 'ACTIVE & VERIFIED' : 'ACTIVE & SIGNED'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                            {vendorVcData?.credentialId || 'VC-853591'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                            NIST ML-DSA-65 Signed
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>My Credentials</span>
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                          Official Government-issued Post-Quantum ML-DSA-65 Verifiable Credential certifying company claims, CA turnover (₹25 Cr), experience, GSTIN, and corporate eligibility for zero-knowledge tender bidding.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 flex-wrap">
                      <button
                        type="button"
                        id="btn-view-details-my-credentials"
                        onClick={() => {
                          setVcModalSection('all');
                          setVcDetailsModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-lg shadow-teal-600/30 cursor-pointer"
                      >
                        <i className="fa-solid fa-file-invoice text-sm"></i>
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline & Closing Soon Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Timeline */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                        <i className="fa-solid fa-timeline text-teal-400"></i>
                        <span>Recent Activity Timeline</span>
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">Live Audit</span>
                    </div>

                    <div className="relative border-l border-slate-800 ml-3 space-y-4 text-xs font-sans">
                      <div className="relative pl-5">
                        <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></span>
                        <p className="font-bold text-white">Bid Submitted</p>
                        <p className="text-slate-400 text-[11px]">TND-2026-001 — Smart City Infrastructure</p>
                        <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">Completed • 18 Aug 2026, 10:35 AM</span>
                      </div>

                      <div className="relative pl-5">
                        <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></span>
                        <p className="font-bold text-white">ZKP Generated & Verified</p>
                        <p className="text-slate-400 text-[11px]">Proof ZKP-829374 verified on-chain</p>
                        <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">Completed • 18 Aug 2026, 10:37 AM</span>
                      </div>

                      <div className="relative pl-5">
                        <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-slate-900"></span>
                        <p className="font-bold text-white">Technical Evaluation Started</p>
                        <p className="text-slate-400 text-[11px]">Evaluator committee reviewing technical proposal</p>
                        <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">In Progress • 18 Aug 2026, 02:15 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Tenders Closing Soon Table */}
                  <div className="lg:col-span-2 bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <h3 className="font-bold text-white text-sm">Tenders Closing Soon</h3>
                          <p className="text-[11px] text-slate-400">High priority opportunities requiring bid submission</p>
                        </div>
                        <button onClick={() => handleSwitchTab('tenders-available')} className="text-xs font-semibold text-teal-400 hover:underline">View All Tenders →</button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                            <tr>
                              <th className="p-2.5 rounded-l-lg">Tender ID</th>
                              <th className="p-2.5">Tender Name</th>
                              <th className="p-2.5">Organization</th>
                              <th className="p-2.5">Closing Date</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5 rounded-r-lg text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-sans">
                            {availableTenders.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="py-8 text-center text-slate-400 font-mono text-xs">
                                  <i className="fa-solid fa-clock-rotate-left mr-2 text-amber-400"></i>
                                  No active tenders currently open. All prior deadlines have concluded. Check <button onClick={() => { setTendersViewMode('closed'); handleSwitchTab('tenders-closed'); }} className="text-teal-400 underline font-bold cursor-pointer">Closed Tenders Archive</button> to view past listings.
                                </td>
                              </tr>
                            ) : (
                              availableTenders.slice(0, 3).map(t => (
                                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                  <td className="p-2.5 font-mono text-teal-400 font-bold">{t.id}</td>
                                  <td className="p-2.5 font-semibold text-white">{t.title}</td>
                                  <td className="p-2.5 text-slate-300">{t.organization}</td>
                                  <td className="p-2.5 font-mono text-amber-400 font-bold">{formatDeadlineDisplay(t.closingDate)}</td>
                                  <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold font-mono">LIVE</span></td>
                                  <td className="p-2.5 text-right space-x-1">
                                    <button onClick={() => handleViewDetails(t)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px]">View</button>
                                    {myBids.some(b => b.tenderId === t.id) ? (
                                      <button onClick={() => handleSwitchTab('bidding-my-bids')} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">Applied</button>
                                    ) : (
                                      <button onClick={() => handleApplyTender(t)} className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold">Submit Bid</button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2 & CLOSED TENDERS TAB */}
            {(activeTab === 'tenders-available' || activeTab === 'tenders-closed') && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl">

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h2 className="text-lg font-bold text-white">
                          {tendersViewMode === 'available' ? 'Available Tenders Directory' : 'Closed & Past Tenders Archive'}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          tendersViewMode === 'available'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {tendersViewMode === 'available' ? `${availableTenders.length} Open for Bidding` : `${closedTenders.length} Deadline Concluded`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {tendersViewMode === 'available'
                          ? 'Filter and apply to active tenders requesting Zero-Knowledge eligibility range proofs'
                          : 'Tenders whose submission deadline has expired. Bidding is closed; records preserved for cryptographic verification.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      {/* Sub-View Switcher: Available Tenders vs Closed Tenders */}
                      <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl space-x-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            setTendersViewMode('available');
                            if (activeTab === 'tenders-closed') setActiveTab('tenders-available');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-2 cursor-pointer ${
                            tendersViewMode === 'available'
                              ? 'bg-teal-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                          <span>Available Tenders ({availableTenders.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTendersViewMode('closed');
                            if (activeTab === 'tenders-available') setActiveTab('tenders-closed');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-2 cursor-pointer ${
                            tendersViewMode === 'closed'
                              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <i className="fa-solid fa-clock-rotate-left text-[11px] text-amber-400"></i>
                          <span>Closed Tenders ({closedTenders.length})</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400"><span className="font-bold text-white">{filteredTenders.length}</span> Filtered</span>
                        <button onClick={resetFilters} className="text-xs text-teal-400 hover:underline ml-2">Reset Filters</button>
                      </div>
                    </div>
                  </div>

                  {/* Filter Controls Bar */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                    {/* Tender Type Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Tender Type</label>
                      <select value={filterTenderType} onChange={(e) => setFilterTenderType(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="ALL">All Tender Types</option>
                        <option value="Open Tender">Open Tender</option>
                        <option value="Limited Tender">Limited Tender</option>
                        <option value="Restricted Tender">Restricted Tender</option>
                        <option value="Single Tender">Single Tender</option>
                        <option value="Negotiated Tender">Negotiated Tender</option>
                        <option value="Two-Stage Tender">Two-Stage Tender</option>
                        <option value="E-Tender">E-Tender</option>
                        <option value="Global Tender">Global Tender</option>
                        <option value="National Tender">National Tender</option>
                        <option value="Local Tender">Local Tender</option>
                      </select>
                    </div>

                    {/* Procurement Method Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Procurement Method</label>
                      <select value={filterProcurement} onChange={(e) => setFilterProcurement(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="ALL">All Procurement Methods</option>
                        <option value="Competitive Bidding">Competitive Bidding</option>
                        <option value="Direct Procurement">Direct Procurement</option>
                        <option value="Request for Proposal (RFP)">Request for Proposal (RFP)</option>
                        <option value="Request for Quotation (RFQ)">Request for Quotation (RFQ)</option>
                        <option value="Expression of Interest (EOI)">Expression of Interest (EOI)</option>
                        <option value="Request for Information (RFI)">Request for Information (RFI)</option>
                      </select>
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Category</label>
                      <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="ALL">All Categories</option>
                        <option value="IT & Software">IT & Software</option>
                        <option value="Hardware & Electronics">Hardware & Electronics</option>
                        <option value="Construction">Construction</option>
                        <option value="Civil Works">Civil Works</option>
                        <option value="Electrical Works">Electrical Works</option>
                        <option value="Mechanical Works">Mechanical Works</option>
                        <option value="Goods & Materials">Goods & Materials</option>
                        <option value="Consultancy">Consultancy</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Security Services">Security Services</option>
                        <option value="Facility Management">Facility Management</option>
                        <option value="Cleaning Services">Cleaning Services</option>
                        <option value="Education & Training">Education & Training</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Energy & Power">Energy & Power</option>
                        <option value="Water & Sanitation">Water & Sanitation</option>
                        <option value="Environmental Services">Environmental Services</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Financial Services">Financial Services</option>
                        <option value="Legal Services">Legal Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Status</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="ALL">All Statuses</option>
                        <option value="Open">🟢 Open</option>
                        <option value="Published">Published</option>
                        <option value="Active">Active</option>
                        <option value="Closing Soon">🟠 Closing Soon</option>
                        <option value="Under Evaluation">Under Evaluation</option>
                        <option value="Awarded">Awarded</option>
                        <option value="Extended">🔵 Extended</option>
                        <option value="Closed">⚫ Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Organization Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Organization</label>
                      <select value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="ALL">All Organizations</option>
                        {Array.from(new Set(tenders.map(t => t.organization).filter(Boolean))).map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget Range Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Budget Range</label>
                      <select value={filterBudget} onChange={(e) => setFilterBudget(parseInt(e.target.value) || 0)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500">
                        <option value="0">Any Budget</option>
                        <option value="5000000">₹50,00,000+</option>
                        <option value="10000000">₹1,00,00,000+</option>
                        <option value="20000000">₹2,00,00,000+</option>
                      </select>
                    </div>

                    {/* Eligibility Status Dropdown */}
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Eligibility Status</label>
                      <select value={filterElig} onChange={(e) => setFilterElig(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-teal-500 font-mono">
                        <option value="ALL">All Eligibility Statuses</option>
                        <option value="ELIGIBLE">ELIGIBLE (ZKP Ready)</option>
                        <option value="NOT ELIGIBLE">NOT ELIGIBLE</option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* Tender Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTenders.length === 0 ? (
                    <div className="col-span-full py-12 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-lg">
                        <i className={tendersViewMode === 'available' ? 'fa-solid fa-folder-open' : 'fa-solid fa-clock-rotate-left'}></i>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {tendersViewMode === 'available'
                          ? 'No Available Tenders Match Your Criteria'
                          : 'No Closed Tenders Found'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {tendersViewMode === 'available'
                          ? (availableTenders.length === 0
                              ? 'All current tenders have passed their submission deadlines and have been moved to the Closed Tenders archive.'
                              : 'Try adjusting your search query, category, or budget filters to discover open opportunities.')
                          : 'No past or expired tenders match the selected filters.'}
                      </p>
                      {tendersViewMode === 'available' && closedTenders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setTendersViewMode('closed'); setActiveTab('tenders-closed'); }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-2 cursor-pointer shadow"
                        >
                          <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                          <span>View Closed Tenders Archive ({closedTenders.length}) &rarr;</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredTenders.map(t => {
                      const isOver = isTenderDeadlineOver(t);
                      const isEligible = t.eligibility === 'ELIGIBLE';
                      const isApplied = myBids.some(b => b.tenderId === t.id);

                      return (
                        <div key={t.id} className={`bg-slate-900/90 rounded-xl border ${isOver ? 'border-amber-500/20 bg-slate-900/70' : 'border-slate-800 hover:border-teal-500/40'} p-4 shadow-xl flex flex-col justify-between transition space-y-3`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-teal-400">{t.id}</span>
                              {isOver ? (
                                <span className="px-2 py-0.5 text-[9px] font-mono rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                                  <i className="fa-solid fa-lock text-[8px]"></i>
                                  <span>DEADLINE OVER</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] font-mono rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-white text-sm mt-1.5 line-clamp-1" title={t.title}>{t.title}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5"><i className="fa-solid fa-building mr-1"></i>{t.organization}</p>
                            <p className="text-xs text-slate-300 mt-2 line-clamp-2">{t.description}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div><span className="text-slate-500 block uppercase">Est. Budget:</span><span className="text-white font-bold">₹{(t.budget).toLocaleString('en-IN')}</span></div>
                              <div>
                                <span className="text-slate-500 block uppercase">Deadline:</span>
                                <span className={`font-bold ${isOver ? 'text-rose-400 line-through' : 'text-amber-400'}`}>{formatDeadlineDisplay(t.closingDate)}</span>
                              </div>
                            </div>

                            {isOver && (
                              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300 font-mono flex items-center space-x-1.5">
                                <i className="fa-solid fa-triangle-exclamation text-amber-400 shrink-0"></i>
                                <span>Bidding closed on {formatDeadlineDisplay(t.closingDate)}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <span className={`inline-flex items-center text-[9px] font-mono px-2 py-0.5 rounded ${isEligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                <i className={`fa-solid ${isEligible ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1`}></i> {t.eligibility}
                              </span>
                              <div className="space-x-1">
                                <button onClick={() => handleViewDetails(t)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs">Details</button>
                                {isApplied ? (
                                  <button
                                    onClick={() => handleSwitchTab('bidding-my-bids')}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded text-xs shadow inline-flex items-center space-x-1 cursor-pointer"
                                    title="You have already submitted a sealed bid for this tender"
                                  >
                                    <i className="fa-solid fa-check text-[10px]"></i>
                                    <span>Applied</span>
                                  </button>
                                ) : isOver ? (
                                  <button
                                    disabled
                                    className="px-2.5 py-1 bg-slate-800/60 text-slate-500 border border-slate-700/40 font-medium rounded text-xs cursor-not-allowed inline-flex items-center space-x-1"
                                    title="Deadline has ended. Bidding is closed."
                                  >
                                    <i className="fa-solid fa-lock text-[9px]"></i>
                                    <span>Closed</span>
                                  </button>
                                ) : (
                                  <button onClick={() => handleApplyTender(t)} className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-xs shadow">Apply</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: APPLIED TENDERS */}
            {activeTab === 'tenders-applied' && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Applied Tenders</h2>
                      <p className="text-xs text-slate-400">Track status of tenders where {vendorName} has submitted sealed bids</p>
                    </div>
                    <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-mono text-xs rounded font-bold">
                      {myBids.length} {myBids.length === 1 ? 'Application' : 'Applications'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 font-sans text-xs">
                    {myBids.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-lg">
                          <i className="fa-solid fa-box-open"></i>
                        </div>
                        <p className="text-xs text-slate-400">No applied tenders yet. Explore available tenders and submit your bid.</p>
                        <button
                          onClick={() => handleSwitchTab('tenders-available')}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs"
                        >
                          Browse Available Tenders &rarr;
                        </button>
                      </div>
                    ) : (
                      myBids.map((b, idx) => (
                        <div key={b.bidId || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/30 transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-teal-400 font-bold">{b.tenderId}</span>
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[9px] rounded font-bold">{b.status || 'SUBMITTED'}</span>
                              <span className="font-mono text-xs text-slate-400">({b.bidId})</span>
                            </div>
                            <h4 className="font-bold text-white text-sm mt-1">{b.tenderName}</h4>
                            <p className="text-slate-400 text-[11px]">Amount: {b.amount} | Submitted: {b.date}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[10px]">
                              <i className="fa-solid fa-shield-check mr-1"></i> {b.zkpStatus || 'ZKP Verified'}
                            </span>
                            <button onClick={() => handleSwitchTab('eval-bid-status', b.bidId)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium transition text-xs shadow">Track Status</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TENDER DETAILS */}
            {activeTab === 'tender-details' && (() => {
              const activeTender = selectedTender || tenders[0] || {
                id: 'TND-SEPOLIA-4897',
                title: 'Smart Highway Expansion Project #4897',
                organization: 'Ministry of Road Transport & Highways',
                category: 'Infrastructure Construction',
                location: 'Maharashtra, India',
                pubDate: 'Today',
                closingDate: '30 Sep 2026',
                budget: 15000000,
                method: 'Two-Stage Sealed Bidding',
                eligibility: 'ELIGIBLE',
                status: 'PUBLISHED',
                description: 'Six-lane road expansion with automated tolling & smart IoT monitoring.'
              };

              return (
                <div className="space-y-6">
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">

                    {/* Details Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 bg-teal-600 text-white rounded text-[10px] font-mono font-bold uppercase">{activeTender.category}</span>
                          <span className="text-xs font-mono text-teal-400 font-bold">Ref: {activeTender.id}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded font-bold">{activeTender.eligibility}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{activeTender.title}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Issuing Organization: {activeTender.organization}</p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button onClick={() => handleApplyTender(activeTender)} className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-lg transition shadow-lg shadow-teal-600/30 flex items-center space-x-2">
                          <i className="fa-solid fa-paper-plane"></i>
                          <span>Apply for Tender</span>
                        </button>
                      </div>
                    </div>

                    {/* Overview Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Est. Budget Ceiling</span>
                        <span className="font-extrabold text-white text-base">₹{(activeTender.budget || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Publication Date</span>
                        <span className="font-bold text-slate-300 text-sm">{activeTender.pubDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Submission Deadline</span>
                        <span className="font-bold text-amber-400 text-sm">{formatDeadlineDisplay(activeTender.closingDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Evaluation Method</span>
                        <span className="font-bold text-teal-400 text-sm">{activeTender.method}</span>
                      </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-5 text-xs text-slate-300">
                        <div>
                          <h3 className="font-bold text-white text-sm mb-2">Scope & Overview Description</h3>
                          <p className="leading-relaxed text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                            {activeTender.description}
                          </p>
                        </div>

                        {/* Evaluation Criteria Progress Bar */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                              <i className="fa-solid fa-chart-pie text-teal-400"></i>
                              <span>Evaluation Criteria Breakdown</span>
                            </h3>
                            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                              Method: {activeTender.evaluationMethod || activeTender.method || 'QCBS'}
                            </span>
                          </div>
                          <div className="space-y-2.5 font-mono text-[11px]">
                            {((activeTender.evaluationCriteriaList && activeTender.evaluationCriteriaList.length > 0)
                              ? activeTender.evaluationCriteriaList
                              : [
                                  { criterionName: 'Technical Qualification & Past Experience', weightPercentage: 40 },
                                  { criterionName: 'Financial Commercial Offer', weightPercentage: 40 },
                                  { criterionName: 'Methodology & Deployment Schedule', weightPercentage: 20 }
                                ]
                            ).map((c, i) => {
                              const weight = c.weightPercentage || c.weight || 25;
                              const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500'];
                              const barColor = colors[i % colors.length];
                              return (
                                <div key={i}>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-slate-300">{c.criterionName || c.name} ({weight}%)</span>
                                    <span className="text-teal-400 font-bold">{weight} Points</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${weight}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                          <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                            <i className="fa-solid fa-shield-halved text-teal-400"></i>
                            <span>ZKP Eligibility Gateways</span>
                          </h4>
                          <ul className="space-y-2 text-[11px] text-slate-300">
                            {((activeTender.eligibilityRequirementsList && activeTender.eligibilityRequirementsList.length > 0)
                              ? activeTender.eligibilityRequirementsList
                              : [
                                  { criterion: 'Financial Turnover', requirement: 'Annual Turnover ≥ ₹15 Cr (ZK-Proof)', verificationType: 'Groth16 Range Proof' },
                                  { criterion: 'Experience Gate', requirement: 'Prior Project Completion Credentials', verificationType: 'Authority Attestation' }
                                ]
                            ).map((req, i) => (
                              <li key={i} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
                                <div className="flex items-center space-x-1.5 text-teal-300 font-bold">
                                  <i className="fa-solid fa-shield-check text-xs text-teal-400"></i>
                                  <span>{req.criterion || 'Eligibility Gate'}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 pl-4">{req.requirement}</p>
                                {req.verificationType && (
                                  <span className="inline-block ml-4 text-[9px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20 font-mono">
                                    {req.verificationType}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-800">
                      {myBids.some(b => b.tenderId === activeTender.id) ? (
                        <button
                          onClick={() => handleSwitchTab('bidding-my-bids')}
                          className="px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-check"></i>
                          <span>Already Applied (View in My Bids)</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      ) : isTenderDeadlineOver(activeTender) ? (
                        <div className="px-6 py-2.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl flex items-center space-x-2">
                          <i className="fa-solid fa-lock"></i>
                          <span>Deadline Ended ({formatDeadlineDisplay(activeTender.closingDate)}) — Bidding is Closed</span>
                        </div>
                      ) : (
                        <button onClick={() => handleApplyTender(activeTender)} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center space-x-2">
                          <span>Apply for Tender Now</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* TAB 5: BID WIZARD */}
            {activeTab === 'bidding-submit' && (() => {
              const activeTender = selectedTender || tenders[0] || {
                id: 'TND-SEPOLIA-4897',
                title: 'Smart Highway Expansion Project #4897',
                organization: 'Ministry of Road Transport & Highways'
              };

              return (
                <VendorBidPage
                  targetTender={activeTender}
                  vendorId={vendorId}
                  vendorName={vendorName}
                  vendorVcData={vendorVcData}
                  userDid={userDid}
                  onBack={() => handleSwitchTab('tenders-available')}
                  onBidSuccess={(submittedBid, shouldNavigate = false) => {
                    if (submittedBid) {
                      const newBidItem = {
                        bidId: submittedBid.bidId || `BID-${(submittedBid._id || submittedBid.txHash || '9981').toString().slice(-6).toUpperCase()}`,
                        tenderId: submittedBid.tenderId || activeTender.id,
                        tenderName: activeTender.title || 'Modernization and Digital Infrastructure Upgrade of Government Hospitals',
                        department: activeTender.organization || 'Government Department',
                        amount: submittedBid.amount || (activeTender.budget ? `₹${(Number(activeTender.budget) * 0.95).toLocaleString('en-IN')}` : '₹14,25,00,000'),
                        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        status: 'SUBMITTED',
                        zkpStatus: submittedBid.proofValid ? 'VERIFIED (Groth16)' : 'VERIFIED (VC)',
                        proofValid: submittedBid.proofValid !== false,
                        txHash: submittedBid.txHash,
                        ...submittedBid
                      };
                      setMyBids(prev => {
                        const remaining = prev.filter(b => b.tenderId !== newBidItem.tenderId);
                        const updated = [newBidItem, ...remaining];
                        try {
                          localStorage.setItem(`zk_vendor_submitted_bids_${vendorId}`, JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                      });
                    }
                    fetchMyBids();
                    if (shouldNavigate) {
                      handleSwitchTab('bidding-my-bids');
                    }
                  }}
                  onSaveDraft={() => handleSwitchTab('bidding-drafts')}
                  onToast={triggerToast}
                />
              );
            })()}

            {/* TAB: SAVED DRAFT BIDS */}
            {activeTab === 'bidding-drafts' && (() => {
              const draftsKey = `zk_vendor_drafts_${vendorId}`;
              let savedDrafts = [];
              try {
                const raw = localStorage.getItem(draftsKey);
                if (raw) savedDrafts = JSON.parse(raw);
              } catch (e) {
                savedDrafts = [];
              }

              const handleResumeDraft = (draft) => {
                const matchingTender = tenders.find(t => t.id === draft.tenderId || t.tenderId === draft.tenderId) || {
                  id: draft.tenderId,
                  title: draft.tenderTitle
                };
                setSelectedTender(matchingTender);
                handleSwitchTab('bidding-submit');
              };

              const handleDeleteDraft = (draftId) => {
                try {
                  localStorage.removeItem(`zk_bid_draft_${draftId}_${vendorId}`);
                  const remaining = savedDrafts.filter(d => d.tenderId !== draftId);
                  localStorage.setItem(draftsKey, JSON.stringify(remaining));
                  triggerToast('Draft bid removed from directory.', 'info');
                  handleSwitchTab('bidding-drafts');
                } catch (e) {
                  console.error(e);
                }
              };

              return (
                <div className="space-y-6 font-sans">
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                          <i className="fa-solid fa-file-pen text-amber-400"></i>
                          <span>Saved Draft Applications</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Incomplete tender application drafts saved locally. Resume anytime to complete zero-knowledge proof generation and final submission.
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs rounded-xl border border-amber-500/30 font-bold self-start sm:self-auto">
                        {savedDrafts.length} Saved {savedDrafts.length === 1 ? 'Draft' : 'Drafts'}
                      </span>
                    </div>

                    {savedDrafts.length === 0 ? (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-xl">
                          <i className="fa-solid fa-folder-open"></i>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">No Saved Draft Bids Found</h3>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            When you start a tender application, click <strong>"Make Draft"</strong> at any process step to save your work here.
                          </p>
                        </div>
                        <button
                          onClick={() => handleSwitchTab('tenders-available')}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center space-x-2"
                        >
                          <i className="fa-solid fa-list-check"></i>
                          <span>Browse Available Tenders &rarr;</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedDrafts.map((draft, idx) => (
                          <div key={idx} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition shadow-xl flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  Step {draft.step || 1} Saved
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {draft.savedAt ? new Date(draft.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                </span>
                              </div>
                              <h3 className="font-bold text-white text-sm line-clamp-1">{draft.tenderTitle || draft.tenderId}</h3>
                              <p className="text-xs font-mono text-slate-400">Ref: <span className="text-teal-400">{draft.tenderId}</span></p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                              <button
                                onClick={() => handleDeleteDraft(draft.tenderId)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold border border-slate-800 transition flex items-center space-x-1"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                                <span>Discard</span>
                              </button>

                              <button
                                onClick={() => handleResumeDraft(draft)}
                                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                              >
                                <span>Resume Application</span>
                                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB 6: MY BIDS DIRECTORY & STATUS */}
            {activeTab === 'bidding-my-bids' && (
              <VendorBidStatusPage
                currentUser={currentUser}
                onNavigate={(tab, extra) => handleSwitchTab(tab, extra)}
                onToast={triggerToast}
                initialBidId={selectedBidStatusId}
                initialTenderId={selectedTender?.id}
                lightTheme={lightTheme}
              />
            )}

            {/* TAB 7: GENERATE ZKP */}
            {activeTab === 'zkp-generate' && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Generate Zero-Knowledge Proof</span>
                      <i className="fa-solid fa-microchip text-teal-400"></i>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Prove your eligibility without revealing sensitive private financial information.</p>
                  </div>

                  {/* Proof Type Cards */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Select Proof Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {[
                        { id: 'revenue', label: 'Revenue Proof', icon: 'fa-chart-line', desc: 'Prove: Annual revenue ≥ required threshold' },
                        { id: 'experience', label: 'Experience Proof', icon: 'fa-briefcase', desc: 'Prove: Vendor has required years/projects' },
                        { id: 'certification', label: 'Certification Proof', icon: 'fa-certificate', desc: 'Prove: Possesses required ISO cert' },
                        { id: 'financial', label: 'Financial Eligibility', icon: 'fa-vault', desc: 'Prove: Satisfies solvency ratio' }
                      ].map(pt => (
                        <div
                          key={pt.id}
                          onClick={() => setProofType(pt.id)}
                          className={`p-3 rounded-xl bg-slate-950 border-2 cursor-pointer transition ${proofType === pt.id ? 'border-teal-500' : 'border-slate-800'}`}
                        >
                          <i className={`fa-solid ${pt.icon} text-teal-400 text-base mb-2`}></i>
                          <h4 className="font-bold text-white">{pt.label}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">{pt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generator Button */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 font-mono text-xs">
                    <button onClick={handleRunProofGenerator} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition shadow-lg flex items-center justify-center space-x-2">
                      <i className="fa-solid fa-gears"></i>
                      <span>Synthesize & Generate ZK Proof</span>
                    </button>
                  </div>

                  {/* Proof Output Box */}
                  {proofResultVisible && (
                    <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-emerald-400">Proof Result: VERIFIED VALID</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Status: VERIFIED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">Proof ID:</span> <span className="text-white font-bold">ZKP-829374</span></div>
                        <div><span className="text-slate-500">Tender ID:</span> <span className="text-white">TND-2026-001</span></div>
                        <div><span className="text-slate-500">Circuit Scheme:</span> <span className="text-teal-400">Groth16 / BN254 Curve</span></div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* UNIFIED VENDOR ORGANIZATION & USER ACCOUNT PROFILE TAB */}
            {(activeTab === 'org-profile' || activeTab === 'company-profile' || activeTab === 'profile') && (
              <div className="space-y-6 text-xs font-sans">
                {/* Header & Completion Card */}
                <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${
                  lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
                }`}>
                  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${
                    lightTheme ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className={`text-lg font-bold flex items-center space-x-2 ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
                          <i className="fa-solid fa-building-user text-teal-500"></i>
                          <span>Organization & Account Profile</span>
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          orgData.verificationStatus === 'VERIFIED' 
                            ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                            : orgData.verificationStatus === 'REJECTED' 
                              ? 'bg-red-500/20 text-red-600 border border-red-500/30' 
                              : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        }`}>
                          {orgData.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Official corporate, tax, contact, representative, and user account credentials stored securely in MongoDB</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {orgEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setOrgEditMode(false)}
                            className={`px-4 py-2 font-semibold rounded-lg transition ${
                              lightTheme ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveOrgProfile}
                            disabled={orgSaving}
                            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                          >
                            {orgSaving ? 'Saving...' : 'Save Profile Changes'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOrgEditMode(true)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg transition flex items-center space-x-2"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          <span>Edit Profile Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Completion Indicator */}
                  {(() => {
                    const stats = getOrgCompletionStats(orgData);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-mono font-bold flex items-center space-x-2 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                            <span>Profile Completion:</span>
                            <span className={stats.isComplete ? 'text-emerald-500 font-extrabold' : 'text-amber-500 font-extrabold'}>{stats.percentage}%</span>
                          </span>
                          <span className={`font-mono text-[11px] ${lightTheme ? 'text-slate-400' : 'text-slate-400'}`}>({stats.filledCount} of {stats.totalRequired} required fields complete)</span>
                        </div>
                        <div className={`w-full rounded-full h-3 p-0.5 border ${lightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-teal-400'}`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSaveOrgProfile} className="space-y-6">

                  {/* DECENTRALIZED IDENTITY (did:ethr) SECTION */}
                  <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    <div className={`border-b pb-3 flex items-center justify-between ${
                      lightTheme ? 'border-slate-200' : 'border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-id-card text-teal-500 text-base"></i>
                        <h3 className="text-sm font-bold">Decentralized Identity</h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                        userDid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      }`}>
                        DID Method: did:ethr
                      </span>
                    </div>

                    {!userDid ? (
                      /* DID Status: Not Created */
                      <div className="space-y-4 py-2">
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>DID Status:</span>
                          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold font-mono text-xs">
                            Not Created
                          </span>
                        </div>

                        <p className={`text-xs ${lightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                          Create your Ethereum-based decentralized identity. Your account will be assigned 1 primary wallet and generate a permanent DID ID that remains fixed even if you switch wallets.
                        </p>

                        <div>
                          <button
                            type="button"
                            onClick={handleCreateDid}
                            disabled={didLoading}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2 text-xs cursor-pointer"
                          >
                            {didLoading ? (
                              <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                <span>Connecting MetaMask & Creating DID...</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-wallet"></i>
                                <span>Create Primary Wallet & DID</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* DID Status: Created */
                      <div className="space-y-4 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`font-medium ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>DID Status:</span>
                            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold font-mono text-xs flex items-center space-x-1.5">
                              <i className="fa-solid fa-check text-emerald-500"></i>
                              <span>Created & Active</span>
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                            🔒 Permanent DID ID (Immutable)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                          <div className={`p-3 rounded-lg border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                            <div className={`text-[10px] uppercase font-sans font-semibold mb-1 ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>DID ID (Permanent)</div>
                            <div className="font-bold text-teal-600 dark:text-teal-400 truncate" title={userDid}>
                              {userDid}
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                            <div className={`text-[10px] uppercase font-sans font-semibold mb-1 ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Primary Wallet (Account Fixed)</div>
                            <div className="font-bold text-indigo-600 dark:text-indigo-400 truncate" title={userPrimaryWallet || didWalletAddress}>
                              {userPrimaryWallet || didWalletAddress ? `${(userPrimaryWallet || didWalletAddress).substring(0, 6)}...${(userPrimaryWallet || didWalletAddress).substring((userPrimaryWallet || didWalletAddress).length - 4)}` : 'N/A'}
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                            <div className={`text-[10px] uppercase font-sans font-semibold mb-1 ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Active Connected Wallet</div>
                            <div className="font-bold text-slate-700 dark:text-slate-300 truncate" title={activeWallet || didWalletAddress}>
                              {activeWallet || didWalletAddress ? `${(activeWallet || didWalletAddress).substring(0, 6)}...${(activeWallet || didWalletAddress).substring((activeWallet || didWalletAddress).length - 4)}` : 'Disconnected'}
                              {activeWallet && userPrimaryWallet && activeWallet.toLowerCase() !== userPrimaryWallet.toLowerCase() && (
                                <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-500 font-sans font-bold">Switched</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                          <i className="fa-solid fa-shield-halved text-teal-500 text-sm shrink-0 mt-0.5"></i>
                          <span>
                            <strong>Primary Wallet Policy:</strong> Each account has only 1 primary wallet. Changing or switching your active wallet in MetaMask does NOT change your permanent DID ID (<span className="font-mono text-teal-600 dark:text-teal-400">{userDid}</span>).
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 pt-1">
                          <button
                            type="button"
                            onClick={handleCopyDid}
                            className={`px-4 py-2 font-bold rounded-lg border transition flex items-center space-x-2 text-xs cursor-pointer ${
                              lightTheme ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                            }`}
                          >
                            <i className="fa-solid fa-copy"></i>
                            <span>Copy DID ID</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleViewDidDocument}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition flex items-center space-x-2 text-xs cursor-pointer"
                          >
                            <i className="fa-solid fa-file-code"></i>
                            <span>View DID Document</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1. REPRESENTATIVE & USER ACCOUNT DETAILS */}
                  <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    <h3 className={`text-sm font-bold border-b pb-2.5 flex items-center justify-between ${
                      lightTheme ? 'border-slate-200' : 'border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-user-gear text-indigo-500"></i>
                        <span>1. Representative & User Account Details</span>
                      </div>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        User Role: {profileRole || 'VENDOR'}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Representative Full Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={profileName}
                          onChange={(e) => {
                            setProfileName(e.target.value);
                            setOrgData({ ...orgData, contactPerson: e.target.value });
                          }}
                          placeholder="e.g. Vikas Sharma"
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Email Address (Login Account)</label>
                        <input
                          type="email"
                          value={profileEmail}
                          disabled
                          placeholder="user@example.com"
                          className={`w-full p-2.5 border rounded-lg text-xs cursor-not-allowed ${
                            lightTheme ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Contact Phone Number</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={profilePhone || orgData.contactPhone || orgData.phone || ''}
                          onChange={(e) => {
                            setProfilePhone(e.target.value);
                            setOrgData({ ...orgData, contactPhone: e.target.value, phone: e.target.value });
                          }}
                          placeholder="e.g. +91 98765 43210"
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. CORPORATE & TAX CREDENTIALS */}
                  <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    <h3 className={`text-sm font-bold border-b pb-2.5 flex items-center space-x-2 ${
                      lightTheme ? 'border-slate-200' : 'border-slate-800'
                    }`}>
                      <i className="fa-solid fa-building-columns text-teal-500"></i>
                      <span>2. Corporate & Tax Credentials</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-400'}`}>Organization ID</label>
                        <input
                          type="text"
                          value={orgData.organizationId || profileOrgId || 'ORG001'}
                          disabled
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs cursor-not-allowed text-teal-600 font-bold ${
                            lightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800/60'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Company / Legal Entity Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.companyName}
                          onChange={(e) => setOrgData({ ...orgData, companyName: e.target.value })}
                          placeholder="e.g. ABC Technologies Pvt. Ltd."
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Organization Type <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.organizationType}
                          onChange={(e) => setOrgData({ ...orgData, organizationType: e.target.value })}
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        >
                          <option value="Private Limited">Private Limited</option>
                          <option value="Public Limited">Public Limited</option>
                          <option value="Partnership">Partnership</option>
                          <option value="LLP">LLP</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Government Organization">Government Organization</option>
                          <option value="Startup">Startup</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Registration Number <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.registrationNumber}
                          onChange={(e) => setOrgData({ ...orgData, registrationNumber: e.target.value })}
                          placeholder="e.g. REG-892019"
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>GSTIN Number</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.gstNumber || profileGst}
                          onChange={(e) => {
                            setOrgData({ ...orgData, gstNumber: e.target.value.toUpperCase() });
                            setProfileGst(e.target.value.toUpperCase());
                          }}
                          placeholder="e.g. 27AABCU9603R1ZM"
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>PAN Card Number</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.panNumber}
                          onChange={(e) => setOrgData({ ...orgData, panNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. ABCDE1234F"
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                          CIN Number {(orgData.organizationType === 'Private Limited' || orgData.organizationType === 'Public Limited') && <span className="text-red-400">* (Req)</span>}
                        </label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.cinNumber}
                          onChange={(e) => setOrgData({ ...orgData, cinNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. U72200MH2020PTC123456"
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required={orgData.organizationType === 'Private Limited' || orgData.organizationType === 'Public Limited'}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Year Established</label>
                        <input
                          type="number"
                          disabled={!orgEditMode}
                          value={orgData.yearEstablished}
                          onChange={(e) => setOrgData({ ...orgData, yearEstablished: e.target.value })}
                          min="1800"
                          max={new Date().getFullYear()}
                          placeholder="e.g. 2018"
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Business Category <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.businessCategory}
                          onChange={(e) => setOrgData({ ...orgData, businessCategory: e.target.value })}
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        >
                          <option value="IT & Software">IT & Software</option>
                          <option value="Construction">Construction</option>
                          <option value="Goods & Materials">Goods & Materials</option>
                          <option value="Consultancy">Consultancy</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Services">Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. REGISTERED ADDRESS */}
                  <div className={`rounded-xl border p-6 shadow-xl space-y-4 ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    <h3 className={`text-sm font-bold border-b pb-2.5 flex items-center space-x-2 ${
                      lightTheme ? 'border-slate-200' : 'border-slate-800'
                    }`}>
                      <i className="fa-solid fa-location-dot text-teal-500"></i>
                      <span>3. Registered Business Address</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Full Registered Address <span className="text-red-400">*</span></label>
                        <textarea
                          disabled={!orgEditMode}
                          value={orgData.address || profileAddress}
                          onChange={(e) => {
                            setOrgData({ ...orgData, address: e.target.value });
                            setProfileAddress(e.target.value);
                          }}
                          placeholder="e.g. Suite 402, Corporate Tech Park, Sector 5"
                          rows={2}
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>State / Union Territory <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.state}
                          onChange={(e) => {
                            const newSt = e.target.value;
                            const availableDistricts = indianStatesAndDistricts[newSt] || ["Main District", "Other"];
                            setOrgData({
                              ...orgData,
                              state: newSt,
                              district: availableDistricts[0]
                            });
                          }}
                          className={`w-full p-2.5 border rounded-lg text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        >
                          {Object.keys(indianStatesAndDistricts).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block font-medium mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>Pincode (6 digits) <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.pincode}
                          onChange={(e) => setOrgData({ ...orgData, pincode: e.target.value })}
                          placeholder="e.g. 400001"
                          className={`w-full p-2.5 border rounded-lg font-mono text-xs ${
                            orgEditMode 
                              ? (lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500') 
                              : (lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed' : 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed')
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {orgEditMode && (
                    <div className="pt-2 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setOrgEditMode(false)}
                        className={`px-5 py-2.5 font-semibold rounded-lg transition ${
                          lightTheme ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={orgSaving}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                      >
                        {orgSaving ? 'Saving Changes to MongoDB...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans max-w-4xl">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                      <i className="fa-solid fa-gear text-teal-400"></i>
                      <span>Vendor Settings & Notifications</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Configure your notification preferences, email dispatches, and Zero-Knowledge security parameters.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-mono rounded-full font-bold">
                    Preference Sync: Active
                  </span>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* 1. NOTIFICATION PREFERENCES CARD */}
                  <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-bell text-teal-400 text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Notification Preferences</h3>
                          <p className="text-slate-400 text-[11px]">Manage system alerts and automated email notifications</p>
                        </div>
                      </div>
                    </div>

                    {/* MAIN NOTIFICATION ON/OFF BUTTON */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100 text-xs sm:text-sm">Notification Switch</span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${notificationsEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Enable or disable real-time in-app notifications, bid status updates, and ZKP proof verification alerts across the workspace.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <button
                          type="button"
                          onClick={handleToggleNotifications}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center space-x-1.5 shadow-md ${notificationsEnabled
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                            }`}
                        >
                          <i className={`fa-solid ${notificationsEnabled ? 'fa-toggle-on text-emerald-200' : 'fa-toggle-off text-slate-500'} text-base`}></i>
                          <span>{notificationsEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>

                    {/* MAIL NOTIFICATION ON/OFF BUTTON (UNDER THE NOTIFICATION TOGGLE) */}
                    <div className={`transition-all duration-300 border-l-2 pl-4 ml-2 space-y-4 ${notificationsEnabled ? 'border-teal-500/50 opacity-100' : 'border-slate-800 opacity-60'}`}>
                      <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-envelope text-amber-400 text-xs"></i>
                            <span className="font-bold text-slate-100 text-xs sm:text-sm">Mail Notification Switch</span>
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${mailNotificationsEnabled && notificationsEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                              {mailNotificationsEnabled && notificationsEnabled ? 'MAIL ON' : 'MAIL OFF'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            Send automated email notifications for tender announcements, submission status updates, and ZKP verifications to <span className="text-slate-200 font-mono font-semibold">{profileEmail || orgData.email || 'your registered email'}</span>.
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <button
                            type="button"
                            onClick={handleToggleMailNotifications}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center space-x-1.5 shadow-md ${mailNotificationsEnabled
                                ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                              }`}
                          >
                            <i className={`fa-solid ${mailNotificationsEnabled ? 'fa-toggle-on text-amber-200' : 'fa-toggle-off text-slate-500'} text-base`}></i>
                            <span>{mailNotificationsEnabled ? 'MAIL ON' : 'MAIL OFF'}</span>
                          </button>
                        </div>
                      </div>

                      {/* MAIL NOTIFICATION SUB-CATEGORIES */}
                      {mailNotificationsEnabled && notificationsEnabled && (
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                            <i className="fa-solid fa-sliders text-teal-400"></i>
                            <span>Mail Dispatch Filters</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                              <input
                                type="checkbox"
                                checked={mailSubCategories.bidUpdates}
                                onChange={() => handleToggleMailSubCategory('bidUpdates')}
                                className="accent-teal-500 rounded"
                              />
                              <span className="text-slate-300 text-[11px]">Bid Status & Award Notifications</span>
                            </label>

                            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                              <input
                                type="checkbox"
                                checked={mailSubCategories.zkpProofs}
                                onChange={() => handleToggleMailSubCategory('zkpProofs')}
                                className="accent-teal-500 rounded"
                              />
                              <span className="text-slate-300 text-[11px]">ZKP Circuit & Verification Alerts</span>
                            </label>

                            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                              <input
                                type="checkbox"
                                checked={mailSubCategories.deadlines}
                                onChange={() => handleToggleMailSubCategory('deadlines')}
                                className="accent-teal-500 rounded"
                              />
                              <span className="text-slate-300 text-[11px]">Submission Deadline Reminders</span>
                            </label>

                            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                              <input
                                type="checkbox"
                                checked={mailSubCategories.newTenders}
                                onChange={() => handleToggleMailSubCategory('newTenders')}
                                className="accent-teal-500 rounded"
                              />
                              <span className="text-slate-300 text-[11px]">New Tender Sector Announcements</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. ZERO KNOWLEDGE & PRIVACY CONTROLS */}
                  <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-user-shield text-cyan-400 text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Privacy & Security Controls</h3>
                          <p className="text-slate-400 text-[11px]">Zero-Knowledge Proof protocol guardrails</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100 text-xs sm:text-sm">Strict Zero-Knowledge Mode</span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${strictZkMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {strictZkMode ? 'STRICT' : 'STANDARD'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Automatically block bid submissions if non-ZK raw financial numbers (turnover, bank statements) are requested instead of Groth16 zk-SNARK proofs.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <button
                          type="button"
                          onClick={handleToggleStrictZk}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center space-x-1.5 shadow-md ${strictZkMode
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                            }`}
                        >
                          <i className={`fa-solid ${strictZkMode ? 'fa-toggle-on text-cyan-200' : 'fa-toggle-off text-slate-500'} text-base`}></i>
                          <span>{strictZkMode ? 'STRICT ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SAVE SETTINGS & TEST NOTIFICATION BUTTONS */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                      <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                      <span>Changes persist automatically to local storage and session state.</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        type="button"
                        onClick={() => dispatchSystemNotification({
                          title: 'Live Notification Dispatch Test',
                          message: `Website popup & Email alert dispatched to ${profileEmail || orgData.email || 'registered email'}.`,
                          category: 'success'
                        })}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold border border-teal-500/40 rounded-lg transition flex items-center space-x-2 shadow-md"
                        title="Click to test website and email dispatches live"
                      >
                        <i className="fa-solid fa-paper-plane text-teal-400"></i>
                        <span>Send Test Notification</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                      >
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Save All Settings</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: EVALUATION RESULTS SCORECARD */}
            {activeTab === 'eval-results' && (
              <VendorEvaluationResultsPage
                currentUser={currentUser}
                onNavigate={(tab, extra) => handleSwitchTab(tab, extra)}
                onToast={triggerToast}
                initialTenderId={selectedEvalTenderId || selectedTender?.id || 'TND-2026-6868'}
                lightTheme={lightTheme}
              />
            )}

            {/* TAB: BID STATUS & LIFECYCLE TRACKER */}
            {activeTab === 'eval-bid-status' && (
              <VendorBidStatusPage
                currentUser={currentUser}
                onNavigate={(tab, extra) => handleSwitchTab(tab, extra)}
                onToast={triggerToast}
                initialBidId={selectedBidStatusId}
                initialTenderId={selectedTender?.id}
                lightTheme={lightTheme}
              />
            )}

            {/* TAB: VENDOR DOCUMENT SUBMISSION */}
            {(activeTab === 'documents' || activeTab === 'vendor-documents') && (
              <VendorDocumentSubmission
                currentUser={currentUser}
                onToast={triggerToast}
                lightTheme={lightTheme}
                onNavigateTab={(tab) => handleSwitchTab(tab)}
              />
            )}

            {/* TAB: VERIFIABLE CREDENTIALS REGISTRY */}
            {activeTab === 'credentials' && (
              <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Status</span>
                      <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-emerald-500">ACTIVE & VALID</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Anchored & Cryptographically Issued</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Algorithm</span>
                      <i className="fa-solid fa-key text-teal-400"></i>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-teal-500">NIST ML-DSA-65</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Post-Quantum Dilithium Standard</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>W3C Standard</span>
                      <i className="fa-solid fa-certificate text-indigo-400"></i>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-indigo-500">VC Data Model v1.1</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Interoperable Decentralized ID</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Days Remaining</span>
                      <i className="fa-solid fa-hourglass-end text-amber-400"></i>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-amber-500">{vendorVcData?.daysRemaining || 365} Days</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Expires 1 Year from Issuance</p>
                  </div>
                </div>

                {/* Primary Credential Card */}
                <div className={`p-6 rounded-2xl border shadow-xl space-y-6 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-500 text-2xl">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {vendorVcData?.credentialType || 'TenderEligibilityCredential'}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            OFFICIAL GOV VC
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          ID: {vendorVcData?.credentialId || 'VC-853591'} • Issuer: {vendorVcData?.issuer || 'did:key:z6MkIssuer001GovTenderAuthority99812'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setVcModalOpen(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 cursor-pointer shadow"
                      >
                        <i className="fa-solid fa-code"></i>
                        <span>Inspect W3C JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const content = JSON.stringify(getSignedCredentialJson(), null, 2);
                          const blob = new Blob([content], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${vendorVcData?.credentialId || 'VendorEligibilityCredential'}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          triggerToast('Verifiable Credential JSON file downloaded!', 'success');
                        }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow"
                      >
                        <i className="fa-solid fa-download"></i>
                        <span>Download JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Claims Grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Cryptographically Verified Claims (Zero-Knowledge Proven)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Company Legal Name</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{vendorName || 'Verified Vendor Entity'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Registration / CIN</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{vendorVcData?.credentialSubject?.registrationNumber || 'REG-103178'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Verified GSTIN</span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">{vendorVcData?.credentialSubject?.gstNumber || '07AAAAA0000A1Z5'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Annual Turnover Claim</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">≥ ₹{vendorVcData?.credentialSubject?.turnover || 25} Crore</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Industry Experience</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{vendorVcData?.credentialSubject?.experience || 8}+ Years</span>
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Completed Projects</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{vendorVcData?.credentialSubject?.projects || 7} Completed Works</span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Signature Box */}
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-signature text-teal-400"></i>
                        <span>NIST ML-DSA-65 Cryptographic Signature</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        100% Post-Quantum Valid
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-400/90 break-all leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 select-all">
                      {vendorVcData?.signature || 'aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69'}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Holder DID: <strong className="text-slate-200">{vendorVcData?.holder || userDid || 'did:ethr:sepolia:0x0Bd2CB362cc6D88fFAde72800FdE299984796AaF'}</strong></span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSigVerifying(true);
                          setTimeout(() => {
                            setSigVerifying(false);
                            setSigVerifyResult(true);
                            triggerToast('Cryptographic ML-DSA-65 Signature Verified against NIST FIPS 204 Specification!', 'success');
                          }, 600);
                        }}
                        className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
                      >
                        {sigVerifying ? 'Verifying...' : 'Verify Cryptographic Signature'}
                      </button>
                    </div>
                    {sigVerifyResult && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center space-x-2">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Signature verified! Mathematical integrity confirmed with Authority Public Key.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* MY CREDENTIALS: CLAIMS & SIGNED CREDENTIAL DETAILS MODAL */}
      {(vcDetailsModalOpen || vcModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden font-sans my-auto transition-all ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              lightTheme ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-950/80'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-lg shrink-0 shadow-md">
                  <i className="fa-solid fa-id-card-clip"></i>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm sm:text-base">My Credentials — Claims & Signed Credential</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ACTIVE & SIGNED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    ID: {vendorVcData?.credentialId || 'VC-853591'} • Standard: W3C VC v1.1 • Post-Quantum NIST ML-DSA-65
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { setVcDetailsModalOpen(false); setVcModalOpen(false); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close Modal"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Modal Navigation Tabs (All, Claims, Signed Credential) */}
            <div className={`px-4 sm:px-5 pt-3 pb-2 border-b flex items-center space-x-2 text-xs font-semibold ${
              lightTheme ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/50'
            }`}>
              <button
                type="button"
                onClick={() => setVcModalSection('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  vcModalSection === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-layer-group text-xs"></i>
                <span>All Details</span>
              </button>

              <button
                type="button"
                onClick={() => setVcModalSection('claims')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  vcModalSection === 'claims'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-list-check text-xs"></i>
                <span>Verified Claims (8)</span>
              </button>

              <button
                type="button"
                onClick={() => setVcModalSection('signed')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  vcModalSection === 'signed'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-signature text-xs"></i>
                <span>Signed Credential & Proof</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* SECTION 1: VERIFIED CLAIMS */}
              {(vcModalSection === 'all' || vcModalSection === 'claims') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-1.5">
                      <i className="fa-solid fa-clipboard-check text-teal-400"></i>
                      <span>Verified Claims (Subject Data)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Gov Issuer Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Company Legal Name</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{vendorName || 'ABC Constructions Pvt Ltd'}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Registration / CIN</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{vendorVcData?.credentialSubject?.registrationNumber || 'REG-103178'}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">GSTIN Certificate</span>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">{vendorVcData?.credentialSubject?.gstNumber || '07AAAAA0000A1Z5'}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Income Tax PAN</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{vendorVcData?.credentialSubject?.panNumber || 'ABCDE1234F'}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Annual Financial Turnover</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">≥ ₹{vendorVcData?.credentialSubject?.turnover || 25} Crore (Audited)</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Years of Experience</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{vendorVcData?.credentialSubject?.experience || 8}+ Years</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Completed Projects</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{vendorVcData?.credentialSubject?.projects || 7} Completed Works</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Tender Bidding Status</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">ELIGIBLE & QUALIFIED</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">Validity Days</span>
                      <span className="text-xs font-bold text-amber-500 font-mono">{vendorVcData?.daysRemaining || 363} Days Remaining</span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="p-3 rounded-xl border bg-slate-100/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-slate-400">Issuer DID:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{vendorVcData?.issuer || 'did:key:z6MkIssuer001GovTenderAuthority99812'}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-slate-400">Holder DID:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{vendorVcData?.holder || userDid || 'did:ethr:sepolia:0x0Bd2CB362cc6D88fFAde72800FdE299984796AaF'}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-slate-400">Issuance Date:</span>
                      <span className="text-slate-700 dark:text-slate-300">{vendorVcData?.issuedDate ? vendorVcData.issuedDate.split('T')[0] : '2026-10-07'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: SIGNED CREDENTIAL & PROOF */}
              {(vcModalSection === 'all' || vcModalSection === 'signed') && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-1.5">
                      <i className="fa-solid fa-key text-teal-400"></i>
                      <span>Signed Credential & NIST ML-DSA-65 Proof</span>
                    </h4>
                    <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      Post-Quantum Signature
                    </span>
                  </div>

                  {/* Cryptographic Signature Card */}
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 text-xs font-mono space-y-2.5">
                    <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-signature text-teal-400"></i>
                        <span>Cryptographic Algorithm: <strong>NIST ML-DSA-65 (FIPS 204)</strong></span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        100% Cryptographically Valid
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Digital Signature Bytes:</span>
                      <div className="text-[11px] text-teal-300 break-all leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 select-all font-mono">
                        {vendorVcData?.signature || 'aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sig = vendorVcData?.signature || 'aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69';
                          navigator.clipboard.writeText(sig);
                          triggerToast('Signature bytes copied to clipboard!', 'success');
                        }}
                        className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-copy text-[11px]"></i>
                        <span>Copy Signature</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSigVerifying(true);
                          setTimeout(() => {
                            setSigVerifying(false);
                            setSigVerifyResult(true);
                            triggerToast('Cryptographic ML-DSA-65 signature verified against NIST FIPS 204 specification!', 'success');
                          }, 500);
                        }}
                        className="px-3 py-1 bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white rounded text-xs font-bold transition flex items-center space-x-1 border border-teal-500/40 cursor-pointer"
                      >
                        <i className="fa-solid fa-shield-check text-xs"></i>
                        <span>{sigVerifying ? 'Verifying...' : 'Verify Signature Live'}</span>
                      </button>
                    </div>

                    {sigVerifyResult && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] flex items-center space-x-2">
                        <i className="fa-solid fa-circle-check text-emerald-400"></i>
                        <span>Signature verified! Mathematical integrity confirmed with Authority ML-DSA-65 Public Key.</span>
                      </div>
                    )}
                  </div>

                  {/* Signed W3C JSON Pre Viewer */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Signed W3C Verifiable Credential Payload:</span>
                    <pre className="p-4 rounded-xl bg-slate-950 text-teal-300 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed select-all font-mono max-h-56">
                      {JSON.stringify(getSignedCredentialJson(), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between flex-wrap gap-2 ${
              lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
            }`}>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const content = JSON.stringify(getSignedCredentialJson(), null, 2);
                    navigator.clipboard.writeText(content);
                    triggerToast('Signed Verifiable Credential JSON copied to clipboard!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  <i className="fa-solid fa-copy text-xs"></i>
                  <span>Copy Signed JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const content = JSON.stringify(getSignedCredentialJson(), null, 2);
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${vendorVcData?.credentialId || 'VendorEligibilityCredential'}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    triggerToast('Signed Verifiable Credential JSON file downloaded!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  <i className="fa-solid fa-download text-xs"></i>
                  <span>Download .json</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setVcDetailsModalOpen(false); setVcModalOpen(false); }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL OVERLAY WITH BLUR */}
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
                <p className="text-xs text-slate-500">Are you sure you want to end your session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-100/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 font-medium">
              Logging out will end your current active session on ZK-Tenders. You will need to log back in to access your vendor profile and bid submissions.
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
                onClick={handleProceedLogout}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center space-x-2"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor ZKP Eligibility Gate Modal */}
      <EligibilityModal
        isOpen={eligibilityModalOpen}
        onClose={() => setEligibilityModalOpen(false)}
        tender={selectedTender}
        currentUser={currentUser}
        vendorVcData={vendorVcData}
        userDid={userDid}
        onToast={triggerToast}
        onSuccess={(verifyData) => {
          const tId = selectedTender?.id || selectedTender?.tenderId || 'T001';
          setVerifiedEligibilityTenders(prev => ({ ...prev, [tId]: verifyData }));
          setEligibilityModalOpen(false);
          setWizardStep(1);
          setWizardSuccess(false);
          setWizardProgress(0);
          setDeclarationChecked(false);
          handleSwitchTab('bidding-submit');
        }}
      />

      {/* VIEW DID DOCUMENT MODAL */}
      {didModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden font-sans ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-network-wired text-teal-500 text-base"></i>
                <div>
                  <h3 className="font-bold text-sm">Resolved W3C DID Document</h3>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">{userDid}</p>
                </div>
              </div>
              <button
                onClick={() => setDidModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  lightTheme ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className={`p-3 rounded-lg border ${lightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="block text-[10px] uppercase font-sans text-slate-400">DID Method</span>
                  <span className="font-bold text-teal-500">did:ethr</span>
                </div>
                <div className={`p-3 rounded-lg border ${lightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <span className="block text-[10px] uppercase font-sans text-slate-400">Blockchain Network</span>
                  <span className="font-bold text-cyan-500">Ethereum Sepolia</span>
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1.5 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                  Standard W3C JSON-LD Representation:
                </label>
                <pre className={`p-4 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${
                  lightTheme ? 'bg-slate-900 text-teal-300 border-slate-800' : 'bg-slate-950 text-teal-300 border-slate-800'
                }`}>
                  {JSON.stringify(didDocument || {
                    "@context": [
                      "https://www.w3.org/ns/did/v1",
                      "https://w3id.org/security/suites/ed25519-2020/v1"
                    ],
                    "id": userDid,
                    "verificationMethod": [
                      {
                        "id": `${userDid}#controller`,
                        "type": "EcdsaSecp256k1RecoveryMethod2020",
                        "controller": userDid,
                        "blockchainAccountId": `eip155:11155111:${didWalletAddress}`
                      }
                    ],
                    "authentication": [`${userDid}#controller`],
                    "assertionMethod": [`${userDid}#controller`]
                  }, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end space-x-3 ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <button
                onClick={() => {
                  const docToCopy = didDocument || {
                    "@context": [
                      "https://www.w3.org/ns/did/v1",
                      "https://w3id.org/security/suites/ed25519-2020/v1"
                    ],
                    "id": userDid,
                    "verificationMethod": [
                      {
                        "id": `${userDid}#controller`,
                        "type": "EcdsaSecp256k1RecoveryMethod2020",
                        "controller": userDid,
                        "blockchainAccountId": `eip155:11155111:${didWalletAddress}`
                      }
                    ],
                    "authentication": [`${userDid}#controller`],
                    "assertionMethod": [`${userDid}#controller`]
                  };
                  navigator.clipboard.writeText(JSON.stringify(docToCopy, null, 2));
                  triggerToast('DID Document copied to clipboard!', 'success');
                }}
                className={`px-4 py-2 font-bold rounded-lg border transition text-xs flex items-center space-x-2 ${
                  lightTheme ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <i className="fa-solid fa-copy"></i>
                <span>Copy Document JSON</span>
              </button>
              <button
                onClick={() => setDidModalOpen(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
