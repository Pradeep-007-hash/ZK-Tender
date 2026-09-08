import React, { useState, useEffect, useRef } from 'react';
import WalletConnectButton from './WalletConnectButton';
import VendorBidPage from './VendorBidPage';
import EligibilityModal from './EligibilityModal';
import EvaluationDashboard from './EvaluationDashboard';

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
    if (path.includes('profile') || path.includes('company')) return 'company-profile';
    if (path.includes('bid')) return 'bidding-my-bids';
    if (path.includes('zkp')) return 'zkp-generate';
    return localStorage.getItem('zk_active_tab') || 'dashboard';
  });

  const mainContentRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('zk_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    const targetUrl = activeTab === 'settings'
      ? '/vendor/settings'
      : activeTab === 'company-profile'
        ? '/vendor/profile'
        : activeTab === 'bidding-my-bids'
          ? '/vendor/bids'
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
          const formatted = publishedOnly.map(t => ({
            id: t.tenderId || `TND-${Math.floor(1000 + Math.random() * 9000)}`,
            title: t.title || 'Untitled Tender',
            organization: t.department || 'Dept of Urban Tech',
            category: t.category || 'Infrastructure',
            location: t.city ? `${t.city}, ${t.state}` : (t.state || 'Maharashtra, India'),
            pubDate: t.pubDate ? new Date(t.pubDate).toLocaleDateString('en-IN') : 'Today',
            closingDate: t.submissionDeadline || t.closingDate || '30 Sep 2026',
            budget: Number(t.estimatedValue || t.budget || 0),
            method: t.procurementMethod || t.method || 'Competitive Bidding',
            eligibility: 'ELIGIBLE',
            status: (t.status || 'PUBLISHED').toUpperCase(),
            description: t.executiveSummary || t.detailedScope || t.description || t.title,
            txHash: t.txHash || null
          }));
          setTenders(formatted);
          if (formatted.length > 0) {
            setSelectedTender(formatted[0]);
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

  const vendorName = orgData.companyName || profileName || currentUser?.company || currentUser?.name || 'Registered Vendor';
  const rawVendorId = orgData.organizationId || profileOrgId || currentUser?.organizationId || currentUser?.vendorId || '';
  const vendorId = rawVendorId && rawVendorId !== 'ORG001' ? rawVendorId : '';

  // Titles mapping
  const titlesMap = {
    'dashboard': 'Dashboard Overview',
    'org-profile': 'Vendor Organization Profile',
    'tenders-available': 'Available Tenders Directory',
    'tenders-applied': 'Applied Tenders',
    'tender-details': 'Tender Specification & Requirements',
    'bidding-submit': 'Electronic Bid Submission Wizard',
    'bidding-drafts': 'Saved Draft Bids',
    'bidding-my-bids': 'My Submitted Bids',
    'zkp-generate': 'Zero-Knowledge Proof Generator',
    'zkp-my-proofs': 'My ZK Proofs Vault',
    'zkp-verification': 'Proof Verification Inspector',
    'eval-bid-status': 'Bid Lifecycle Inspector',
    'eval-proof-status': 'Proof Verification Status',
    'eval-results': 'Evaluation Results Scorecard',
    'company-profile': 'Company Profile & Credentials',
    'settings': 'Account & Privacy Settings'
  };

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  // Switch Tab Handler
  const handleSwitchTab = (tabId) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
    setNotifFlyoutOpen(false);
  };

  // Filter Tenders
  const filteredTenders = tenders.filter(t => {
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
    const target = tender || selectedTender || tenders[0];
    setSelectedTender(target);
    const tId = target?.id || target?.tenderId || 'T001';

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
              <div className="flex items-center space-x-3 logo-hover-wrapper cursor-pointer">

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

            {/* Vendor Profile Banner */}
            {!sidebarCollapsed && (
              <div className="p-3.5 mx-3 my-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 font-mono text-xs font-bold">
                      {getVendorInitials(vendorName)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Groth16 Prover Online"></span>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-xs text-white truncate" title={vendorName}>{vendorName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{vendorId ? <>ID: <span className="text-teal-400">{vendorId}</span></> : <span className="text-teal-400/80">Verified Vendor Account</span>}</p>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <i className="fa-solid fa-lock mr-1 text-[7px]"></i> ZK Prover Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

              {/* Organization Profile */}
              <button
                onClick={() => handleSwitchTab('org-profile')}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'org-profile' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-building w-4 text-center text-teal-400 shrink-0"></i>
                  {!sidebarCollapsed && <span>Organization Profile</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${getOrgCompletionStats(orgData).isComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {getOrgCompletionStats(orgData).percentage}%
                  </span>
                )}
              </button>

              {/* Tenders Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Tenders</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('tenders-available')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'tenders-available' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-list-check w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>Available Tenders</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">6 Live</span>}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('tenders-applied')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'tenders-applied' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-folder-closed w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>Applied Tenders</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full">4</span>}
                  </button>
                </div>
              </div>

              {/* Bidding Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Bidding</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('bidding-submit')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'bidding-submit' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-paper-plane w-4 text-center text-teal-400 shrink-0"></i>
                    {!sidebarCollapsed && <span className="text-teal-300 font-semibold">Submit Bid</span>}
                  </button>

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
                    {!sidebarCollapsed && <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">5</span>}
                  </button>
                </div>
              </div>

              {/* Zero-Knowledge Proofs Group */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Zero-Knowledge Proofs</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('zkp-generate')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'zkp-generate' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-microchip w-4 text-center text-blue-400 shrink-0"></i>
                    {!sidebarCollapsed && <span>Generate ZKP</span>}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('zkp-my-proofs')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all ${activeTab === 'zkp-my-proofs' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-key w-4 text-center shrink-0"></i>
                      {!sidebarCollapsed && <span>My Proofs</span>}
                    </div>
                    {!sidebarCollapsed && <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">6</span>}
                  </button>

                  <button
                    onClick={() => handleSwitchTab('zkp-verification')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'zkp-verification' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-shield-check w-4 text-center shrink-0"></i>
                    {!sidebarCollapsed && <span>Proof Verification</span>}
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

              {/* Account & Settings */}
              <div className="pt-2">
                {!sidebarCollapsed && <div className="px-3 pb-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Account</div>}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSwitchTab('company-profile')}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg transition-all ${activeTab === 'company-profile' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
                  >
                    <i className="fa-solid fa-building w-4 text-center shrink-0"></i>
                    {!sidebarCollapsed && <span>Company Profile</span>}
                  </button>

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
          <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800">
                <i className="fa-solid fa-bars text-lg"></i>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{titlesMap[activeTab] || 'Vendor Dashboard'}</h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">Welcome back, <span className="text-slate-200 font-semibold">{vendorName}</span></p>
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
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-mono"
                />
              </div>
            </div>

            {/* Right Nav Items */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Web3 Connect Wallet Button */}
              <WalletConnectButton user={currentUser} onToast={onToast} lightTheme={lightTheme} />

              <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-950 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                <i className="fa-solid fa-lock text-teal-400"></i>
                <span>🔐 End-to-End ZK Protected</span>
              </div>

              <button
                onClick={() => setLightTheme(!lightTheme)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border shadow-sm ${lightTheme
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                title={lightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
              >
                <i className={`fa-solid ${lightTheme ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-400'} text-sm transition-transform duration-300 ${lightTheme ? 'rotate-180' : ''}`}></i>
                <span className="text-xs font-medium font-sans hidden sm:inline">{lightTheme ? 'Light Mode' : 'Dark Mode'}</span>
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

              {/* Vendor Profile Avatar */}
              <div className="relative flex items-center space-x-2 border-l border-slate-800 pl-3">
                <button onClick={() => handleSwitchTab('company-profile')} className="flex items-center space-x-2 focus:outline-none group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
                    {getVendorInitials(vendorName)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-semibold text-white group-hover:text-teal-400 transition truncate max-w-[120px]">{vendorName}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">{vendorId || 'Verified Prover'}</span>
                  </div>
                </button>
              </div>

            </div>
          </header>

          {/* MAIN VIEW CONTENT */}
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* PRIVACY WORKFLOW BANNER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-teal-500/30 rounded-xl p-4 shadow-xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-user-shield text-lg"></i>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                      <span>Zero-Knowledge Privacy Architecture</span>
                      <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-mono text-[9px] rounded font-bold uppercase">Zero-Leakage</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Prove eligibility & financial credentials without revealing sensitive private balance sheets to evaluators.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 font-mono text-[10px] text-slate-300 overflow-x-auto w-full lg:w-auto py-1">
                  <span className="px-2 py-1 rounded bg-slate-900 border border-rose-500/30 text-rose-300 font-bold shrink-0"><i className="fa-solid fa-lock mr-1"></i> Private Input</span>
                  <i className="fa-solid fa-arrow-right text-slate-600 text-[10px]"></i>
                  <span className="px-2 py-1 rounded bg-slate-900 border border-teal-500/30 text-teal-300 font-bold shrink-0"><i className="fa-solid fa-microchip mr-1"></i> ZKP Circuit</span>
                  <i className="fa-solid fa-arrow-right text-slate-600 text-[10px]"></i>
                  <span className="px-2 py-1 rounded bg-slate-900 border border-indigo-500/30 text-indigo-300 font-bold shrink-0"><i className="fa-solid fa-key mr-1"></i> Proof</span>
                  <i className="fa-solid fa-arrow-right text-slate-600 text-[10px]"></i>
                  <span className="px-2 py-1 rounded bg-slate-900 border border-emerald-500/30 text-emerald-400 font-bold shrink-0"><i className="fa-solid fa-circle-check mr-1"></i> Compliance</span>
                </div>
              </div>
            </div>

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* 7 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div onClick={() => handleSwitchTab('tenders-available')} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow hover:border-teal-500/40 transition cursor-pointer">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Available</span>
                      <i className="fa-solid fa-list-check text-teal-400 text-xs"></i>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">06</span>
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
                      <span className="text-xl font-extrabold text-white font-mono">05</span>
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
                            {tenders.slice(0, 3).map(t => (
                              <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                <td className="p-2.5 font-mono text-teal-400 font-bold">{t.id}</td>
                                <td className="p-2.5 font-semibold text-white">{t.title}</td>
                                <td className="p-2.5 text-slate-300">{t.organization}</td>
                                <td className="p-2.5 font-mono text-amber-400 font-bold">{t.closingDate}</td>
                                <td className="p-2.5"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold font-mono">{t.status}</span></td>
                                <td className="p-2.5 text-right space-x-1">
                                  <button onClick={() => handleViewDetails(t)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px]">View</button>
                                  <button onClick={() => handleApplyTender(t)} className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold">Submit Bid</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: AVAILABLE TENDERS */}
            {activeTab === 'tenders-available' && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl">

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Available Tenders Directory</h2>
                      <p className="text-xs text-slate-400">Filter and apply to active tenders requesting Zero-Knowledge eligibility range proofs</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400"><span className="font-bold text-white">{filteredTenders.length}</span> Active Listings</span>
                      <button onClick={resetFilters} className="text-xs text-teal-400 hover:underline ml-2">Reset Filters</button>
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
                        <option value="Dept of Urban Tech">Dept of Urban Tech</option>
                        <option value="Ministry of Electronics">Ministry of Electronics</option>
                        <option value="National Cyber Agency">National Cyber Agency</option>
                        <option value="Dept of Energy">Dept of Energy</option>
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
                  {filteredTenders.map(t => {
                    const isEligible = t.eligibility === 'ELIGIBLE';
                    return (
                      <div key={t.id} className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between hover:border-teal-500/40 transition space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-teal-400">{t.id}</span>
                            <span className="px-2 py-0.5 text-[9px] font-mono rounded font-bold bg-teal-500/20 text-teal-300">{t.status}</span>
                          </div>
                          <h3 className="font-bold text-white text-sm mt-1.5 line-clamp-1" title={t.title}>{t.title}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5"><i className="fa-solid fa-building mr-1"></i>{t.organization}</p>
                          <p className="text-xs text-slate-300 mt-2 line-clamp-2">{t.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div><span className="text-slate-500 block uppercase">Est. Budget:</span><span className="text-white font-bold">₹{(t.budget).toLocaleString('en-IN')}</span></div>
                            <div><span className="text-slate-500 block uppercase">Deadline:</span><span className="text-amber-400 font-bold">{t.closingDate}</span></div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className={`inline-flex items-center text-[9px] font-mono px-2 py-0.5 rounded ${isEligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              <i className={`fa-solid ${isEligible ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1`}></i> {t.eligibility}
                            </span>
                            <div className="space-x-1">
                              <button onClick={() => handleViewDetails(t)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs">Details</button>
                              <button onClick={() => handleApplyTender(t)} className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-xs shadow">Apply</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-mono text-xs rounded font-bold">4 Active Applications</span>
                  </div>

                  <div className="mt-4 space-y-3 font-sans text-xs">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/30 transition">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-teal-400 font-bold">TND-2026-001</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[9px] rounded font-bold">TECHNICAL EVALUATION</span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1">Smart City Infrastructure</h4>
                        <p className="text-slate-400 text-[11px]">Issuing: Dept of Urban Tech | Applied: 18 Aug 2026</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[10px]">
                          <i className="fa-solid fa-shield-check mr-1"></i> ZKP Verified
                        </span>
                        <button onClick={() => handleSwitchTab('eval-bid-status')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium">Track Lifecycle</button>
                      </div>
                    </div>
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
                        <span className="font-bold text-amber-400 text-sm">{activeTender.closingDate}</span>
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
                          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                            <i className="fa-solid fa-chart-pie text-teal-400"></i>
                            <span>Evaluation Criteria Breakdown</span>
                          </h3>
                          <div className="space-y-2 font-mono text-[11px]">
                            <div>
                              <div className="flex justify-between mb-1"><span>Technical Capability (40%)</span><span className="text-teal-400 font-bold">40 Points</span></div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-teal-500 h-1.5 w-[40%] rounded-full"></div></div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1"><span>Financial Soundness & Turnover (30%)</span><span className="text-teal-400 font-bold">30 Points</span></div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-500 h-1.5 w-[30%] rounded-full"></div></div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1"><span>Past Execution Experience (20%)</span><span className="text-teal-400 font-bold">20 Points</span></div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-amber-500 h-1.5 w-[20%] rounded-full"></div></div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1"><span>Green Power PPA & Compliance (10%)</span><span className="text-teal-400 font-bold">10 Points</span></div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-1.5 w-[10%] rounded-full"></div></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                          <h4 className="font-bold text-white text-xs">ZKP Eligibility Gateways</h4>
                          <ul className="space-y-2 text-[11px] text-slate-300">
                            <li className="flex items-center space-x-2 text-teal-400"><i className="fa-solid fa-shield-check text-xs"></i><span>Annual Turnover &ge; ₹50 Cr</span></li>
                            <li className="flex items-center space-x-2 text-teal-400"><i className="fa-solid fa-shield-check text-xs"></i><span>Positive Net Worth &ge; ₹15 Cr</span></li>
                            <li className="flex items-center space-x-2 text-teal-400"><i className="fa-solid fa-shield-check text-xs"></i><span>ISO 27001 Cybersecurity</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-800">
                      <button onClick={() => handleApplyTender(activeTender)} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center space-x-2">
                        <span>Apply for Tender Now</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
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
                  onBack={() => handleSwitchTab('active-tenders')}
                  onBidSuccess={() => handleSwitchTab('bidding-my-bids')}
                  onToast={triggerToast}
                />
              );
            })()}

            {/* TAB 6: MY BIDS */}
            {activeTab === 'bidding-my-bids' && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">My Bids Directory</h2>
                      <p className="text-xs text-slate-400">All submitted sealed bid commitments and verification lifecycle statuses</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {['ALL', 'SUBMITTED', 'UNDER REVIEW', 'ACCEPTED'].map(f => (
                        <button key={f} onClick={() => setMyBidsFilter(f)} className={`px-2.5 py-1 rounded font-bold ${myBidsFilter === f ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3 rounded-l-lg">Bid ID</th>
                          <th className="p-3">Tender Ref</th>
                          <th className="p-3">Tender Name</th>
                          <th className="p-3">Bid Amount</th>
                          <th className="p-3">Submission Date</th>
                          <th className="p-3">Bid Status</th>
                          <th className="p-3">ZKP Status</th>
                          <th className="p-3 rounded-r-lg text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {filteredMyBids.map(b => (
                          <tr key={b.bidId} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-mono text-teal-400 font-bold">{b.bidId}</td>
                            <td className="p-3 font-mono text-slate-300">{b.tenderId}</td>
                            <td className="p-3 font-semibold text-white">{b.tenderName}</td>
                            <td className="p-3 font-mono text-amber-400 font-bold">{b.amount}</td>
                            <td className="p-3 font-mono text-slate-400">{b.date}</td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-mono text-[10px] rounded font-bold">{b.status}</span></td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded font-bold">{b.zkpStatus}</span></td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleSwitchTab('eval-bid-status')} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px]">Track</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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

            {/* VENDOR ORGANIZATION PROFILE TAB */}
            {activeTab === 'org-profile' && (
              <div className="space-y-6 text-xs font-sans">
                {/* Header & Completion Card */}
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                          <i className="fa-solid fa-building text-teal-400"></i>
                          <span>Vendor Organization Profile</span>
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${orgData.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : orgData.verificationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {orgData.verificationStatus}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Official corporate, tax, contact, and address credentials stored in MongoDB</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {orgEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setOrgEditMode(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveOrgProfile}
                            disabled={orgSaving}
                            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                          >
                            {orgSaving ? 'Saving...' : 'Save Organization Profile'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOrgEditMode(true)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg transition flex items-center space-x-2"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          <span>Edit Organization Profile</span>
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
                          <span className="font-mono text-slate-300 font-bold flex items-center space-x-2">
                            <span>Profile Completion:</span>
                            <span className={stats.isComplete ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>{stats.percentage}%</span>
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">({stats.filledCount} of {stats.totalRequired} required fields complete)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-teal-400'}`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                        {!stats.isComplete && (
                          <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center space-x-2 text-amber-300 text-xs">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>Complete your organization profile before participating in tenders.</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Main Form Body */}
                <form onSubmit={handleSaveOrgProfile} className="space-y-6">

                  {/* 1. COMPANY INFORMATION */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                      <i className="fa-solid fa-building-columns text-teal-400"></i>
                      <span>1. Company Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Organization ID (Auto-Generated)</label>
                        <input
                          type="text"
                          value={orgData.organizationId || 'Auto-generated on save'}
                          disabled
                          className="w-full p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-lg text-teal-400 font-mono text-xs cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Company Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.companyName}
                          onChange={(e) => setOrgData({ ...orgData, companyName: e.target.value })}
                          placeholder="e.g. ABC Technologies Pvt. Ltd."
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Organization Type <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.organizationType}
                          onChange={(e) => setOrgData({ ...orgData, organizationType: e.target.value })}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
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
                        <label className="block text-slate-300 font-medium mb-1">Registration Number <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.registrationNumber}
                          onChange={(e) => setOrgData({ ...orgData, registrationNumber: e.target.value })}
                          placeholder="e.g. REG-892019"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">GSTIN Number</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.gstNumber}
                          onChange={(e) => setOrgData({ ...orgData, gstNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. 27AABCU9603R1ZM"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">PAN Number</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.panNumber}
                          onChange={(e) => setOrgData({ ...orgData, panNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. ABCDE1234F"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          CIN Number {(orgData.organizationType === 'Private Limited' || orgData.organizationType === 'Public Limited') && <span className="text-red-400">* (Req)</span>}
                        </label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.cinNumber}
                          onChange={(e) => setOrgData({ ...orgData, cinNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. U72200MH2020PTC123456"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required={orgData.organizationType === 'Private Limited' || orgData.organizationType === 'Public Limited'}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Year Established</label>
                        <input
                          type="number"
                          disabled={!orgEditMode}
                          value={orgData.yearEstablished}
                          onChange={(e) => setOrgData({ ...orgData, yearEstablished: e.target.value })}
                          min="1800"
                          max={new Date().getFullYear()}
                          placeholder="e.g. 2018"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Company Size</label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.companySize}
                          onChange={(e) => setOrgData({ ...orgData, companySize: e.target.value })}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                        >
                          <option value="Micro">Micro (1-10 employees)</option>
                          <option value="Small">Small (11-50 employees)</option>
                          <option value="Medium">Medium (51-250 employees)</option>
                          <option value="Large">Large (251-1000 employees)</option>
                          <option value="Enterprise">Enterprise (1000+ employees)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Business Category <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.businessCategory}
                          onChange={(e) => setOrgData({ ...orgData, businessCategory: e.target.value })}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
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

                  {/* 2. CONTACT INFORMATION */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                      <i className="fa-solid fa-address-book text-teal-400"></i>
                      <span>2. Contact Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Contact Person Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.contactPerson}
                          onChange={(e) => setOrgData({ ...orgData, contactPerson: e.target.value })}
                          placeholder="e.g. Vikas Sharma"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Designation <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.designation}
                          onChange={(e) => setOrgData({ ...orgData, designation: e.target.value })}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        >
                          <option value="Managing Director">Managing Director</option>
                          <option value="CEO">CEO</option>
                          <option value="Proprietor">Proprietor</option>
                          <option value="Manager">Manager</option>
                          <option value="Tender Officer">Tender Officer</option>
                          <option value="Authorized Representative">Authorized Representative</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Email Address <span className="text-red-400">*</span></label>
                        <input
                          type="email"
                          disabled={!orgEditMode}
                          value={orgData.email}
                          onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                          placeholder="company@domain.com"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Phone Number <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.phone}
                          onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.website}
                          onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                          placeholder="e.g. https://www.company.com"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. REGISTERED ADDRESS */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                      <i className="fa-solid fa-location-dot text-teal-400"></i>
                      <span>3. Registered Business Address</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-slate-300 font-medium mb-1">Full Registered Address <span className="text-red-400">*</span></label>
                        <textarea
                          disabled={!orgEditMode}
                          value={orgData.address}
                          onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                          placeholder="e.g. Suite 402, Corporate Tech Park, Sector 5"
                          rows={2}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">State / Union Territory <span className="text-red-400">*</span></label>
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
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        >
                          {Object.keys(indianStatesAndDistricts).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">District <span className="text-red-400">*</span></label>
                        <select
                          disabled={!orgEditMode}
                          value={orgData.district}
                          onChange={(e) => setOrgData({ ...orgData, district: e.target.value })}
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        >
                          {(indianStatesAndDistricts[orgData.state] || ["Main District", "Other"]).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">City <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.city}
                          onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                          placeholder="e.g. Mumbai"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Pincode (6 digits) <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          disabled={!orgEditMode}
                          value={orgData.pincode}
                          onChange={(e) => setOrgData({ ...orgData, pincode: e.target.value })}
                          placeholder="e.g. 400001"
                          className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs ${orgEditMode ? 'focus:border-teal-500 focus:outline-none' : 'cursor-not-allowed text-slate-300'}`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. VERIFICATION INFORMATION */}
                  <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                      <i className="fa-solid fa-shield-check text-teal-400"></i>
                      <span>4. Government Verification & Account Status</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[10px]">Verification Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${orgData.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : orgData.verificationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                          {orgData.verificationStatus}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[10px]">Verified Date</span>
                        <span className="text-slate-200 font-bold block">
                          {orgData.verifiedAt ? new Date(orgData.verifiedAt).toLocaleDateString('en-IN') : 'Not yet verified'}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400 block text-[10px]">Account Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${orgData.accountStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                          {orgData.accountStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ZKP Privacy Banner */}
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 text-xs flex items-start space-x-3">
                    <i className="fa-solid fa-lock text-teal-400 text-base mt-0.5 shrink-0"></i>
                    <div>
                      <h4 className="font-bold text-teal-200">Zero-Knowledge Privacy Note</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                        Confidential financial information (turnover, bank balance, net worth) is kept strictly isolated in the ZKP Financial Module and is never stored in this general organization profile.
                      </p>
                    </div>
                  </div>

                  {orgEditMode && (
                    <div className="pt-2 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setOrgEditMode(false)}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={orgSaving}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                      >
                        {orgSaving ? 'Saving Changes to MongoDB...' : 'Save Organization Profile'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* VIEW & EDIT COMPANY PROFILE TAB */}
            {activeTab === 'company-profile' && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">Company & User Profile</h2>
                    <p className="text-slate-400 text-xs">View and update your account details stored in MongoDB</p>
                  </div>
                  <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-mono rounded-full font-bold">
                    Role: {profileRole}
                  </span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Full Name / Officer Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Vikas Sharma"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email Address (Verified)</label>
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        placeholder="user@example.com"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-lg text-slate-400 text-xs cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Organization / Company Name</label>
                      <input
                        type="text"
                        value={profileCompany}
                        onChange={(e) => setProfileCompany(e.target.value)}
                        placeholder="e.g. ABC Technologies Pvt. Ltd."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Organization ID</label>
                      <input
                        type="text"
                        value={profileOrgId}
                        onChange={(e) => setProfileOrgId(e.target.value)}
                        placeholder="e.g. ORG001"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-teal-400 font-mono text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">GSTIN / Tax ID</label>
                      <input
                        type="text"
                        value={profileGst}
                        onChange={(e) => setProfileGst(e.target.value)}
                        placeholder="e.g. 27AABCU9603R1ZM"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Registered Address</label>
                    <textarea
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="e.g. Corporate Tech Park, Sector 5, Cyber City"
                      rows={2}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400 font-mono">
                      <span>Prover Key Status: </span>
                      <span className="text-emerald-400 font-bold">Loaded (Groth16_Poseidon)</span>
                    </div>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2"
                    >
                      {profileSaving ? 'Saving to MongoDB...' : 'Save Profile Changes'}
                    </button>
                  </div>
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
              <EvaluationDashboard selectedTenderId={selectedTender?.id || 'T001'} currentUser={currentUser} />
            )}

          </main>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL OVERLAY WITH BLUR */}
      {showLogoutModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-lg text-rose-500"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Log Out</h3>
                <p className="text-xs text-slate-500">Are you sure you want to end your session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
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
    </div>
  );
}
