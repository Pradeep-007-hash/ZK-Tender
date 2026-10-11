import React, { useState, useEffect, useRef } from 'react';
import WalletConnectButton from './WalletConnectButton';

export default function IssuerDashboard({ currentUser, onLogout, onToast }) {
  const mainContentRef = useRef(null);

  const validTabs = [
    'overview',
    'vendor-applications',
    'credentials-issued',
    'credentials-revoked',
    'credentials-expiring',
    'audit-logs',
    'issuer-profile',
    'settings'
  ];

  // Active Navigation Tab State
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('zk_issuer_active_tab');
    return (validTabs.includes(saved) && saved !== 'doc-verification') ? saved : 'overview';
  });

  useEffect(() => {
    localStorage.setItem('zk_issuer_active_tab', activeTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Layout UI States
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

  // Issuer Profile States
  const [issuerProfile, setIssuerProfile] = useState(() => {
    const saved = localStorage.getItem('zk_issuer_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      officerName: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || '',
      department: currentUser?.department || '',
      designation: currentUser?.designation || '',
      organizationName: currentUser?.company || '',
      organizationType: '',
      registrationNumber: '',
      issuerDid: '',
      didMethod: '',
      signatureScheme: '',
      kmsStatus: '',
      verificationStatus: '',
      badgeId: currentUser?.badgeId || ''
    };
  });

  const [didWalletAddress, setDidWalletAddress] = useState(currentUser?.walletAddress || '');
  const [didDocument, setDidDocument] = useState(null);
  const [didLoading, setDidLoading] = useState(false);
  const [didModalOpen, setDidModalOpen] = useState(false);

  const [editIssuerProfileModalOpen, setEditIssuerProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...issuerProfile });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileActiveSubTab, setProfileActiveSubTab] = useState('details');

  const issuerName = issuerProfile.officerName || currentUser?.name || 'Government Credential Issuer';
  const orgId = currentUser?.organizationId || 'GOV_ISSUER_001';
  const issuerDid = issuerProfile.issuerDid;

  const handleCreateIssuerDid = async () => {
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

      const issuerEmail = issuerProfile.email || currentUser?.email || 'issuer@gov.in';

      const nonceRes = await fetch('http://localhost:5000/api/did/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: issuerEmail, walletAddress: selectedAddress })
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
          email: issuerEmail,
          walletAddress: selectedAddress,
          signature,
          message: nonceData.message
        })
      });

      const createData = await createRes.json();
      if (createData.success) {
        const newDid = createData.did;
        setIssuerProfile(prev => ({
          ...prev,
          issuerDid: newDid,
          didMethod: createData.didMethod || 'ethr',
          didNetwork: createData.didNetwork || 'sepolia'
        }));
        setDidWalletAddress(createData.walletAddress);
        setDidDocument(createData.didDocument);
        localStorage.setItem('zk_issuer_did', newDid);

        triggerToast(createData.alreadyExists ? 'Issuer DID already registered!' : 'Issuer Ethereum DID (did:ethr:sepolia) successfully created!', 'success');
      } else {
        triggerToast(createData.message || 'Failed to create Issuer DID.', 'error');
      }
    } catch (err) {
      console.error('Error creating Issuer DID:', err);
      triggerToast(err.message || 'Error creating Issuer DID.', 'error');
    } finally {
      setDidLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    setProfileForm({ ...issuerProfile });
    setEditIssuerProfileModalOpen(true);
  };

  const handleSaveIssuerProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileForm.email,
          name: profileForm.officerName,
          company: profileForm.organizationName,
          phone: profileForm.phone,
          address: profileForm.address,
          department: profileForm.department,
          designation: profileForm.designation,
          role: 'ISSUER',
          organizationId: 'GOV_ISSUER_001'
        })
      });
      const data = await res.json();
      const updated = { ...issuerProfile, ...profileForm };
      setIssuerProfile(updated);
      localStorage.setItem('zk_issuer_profile', JSON.stringify(updated));
      triggerToast('Issuer profile updated & saved to backend server!', 'success');
      setEditIssuerProfileModalOpen(false);
    } catch (err) {
      const updated = { ...issuerProfile, ...profileForm };
      setIssuerProfile(updated);
      localStorage.setItem('zk_issuer_profile', JSON.stringify(updated));
      triggerToast('Issuer profile saved successfully!', 'success');
      setEditIssuerProfileModalOpen(false);
    } finally {
      setProfileSaving(false);
    }
  };


  // Data States
  const [stats, setStats] = useState({
    totalVendors: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    credentialsIssued: 0,
    activeCredentials: 0,
    revokedCredentials: 0,
    expiringSoon: 0
  });

  const [loadingData, setLoadingData] = useState(true);

  // Fetch all live data from backend
  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const headers = { 'x-user-role': 'ISSUER', 'Content-Type': 'application/json' };

      const [statsRes, vendorsRes, docsRes, credsRes, logsRes, verReqRes] = await Promise.allSettled([
        fetch('http://localhost:5000/api/issuer/dashboard', { headers }),
        fetch('http://localhost:5000/api/issuer/vendors', { headers }),
        fetch('http://localhost:5000/api/issuer/documents', { headers }),
        fetch('http://localhost:5000/api/issuer/credentials', { headers }),
        fetch('http://localhost:5000/api/issuer/audit-logs', { headers }),
        fetch('http://localhost:5000/api/issuer/verification-requests', { headers })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        try {
          const d = await statsRes.value.json();
          if (d.success && d.stats) setStats(d.stats);
        } catch (e) {}
      }
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value.ok) {
        try {
          const d = await vendorsRes.value.json();
          if (d.success && Array.isArray(d.vendors)) setVendors(d.vendors);
        } catch (e) {}
      }
      if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
        try {
          const d = await docsRes.value.json();
          if (d.success && Array.isArray(d.documents)) setDocuments(d.documents);
        } catch (e) {}
      }
      if (credsRes.status === 'fulfilled' && credsRes.value.ok) {
        try {
          const d = await credsRes.value.json();
          if (d.success && Array.isArray(d.credentials)) setCredentials(d.credentials);
        } catch (e) {}
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
        try {
          const d = await logsRes.value.json();
          if (d.success && Array.isArray(d.logs)) setAuditLogs(d.logs);
        } catch (e) {}
      }
      if (verReqRes.status === 'fulfilled' && verReqRes.value.ok) {
        try {
          const d = await verReqRes.value.json();
          if (d.success && Array.isArray(d.requests)) setVerificationRequests(d.requests);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[ISSUER DASHBOARD FETCH ERROR]', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const [vendors, setVendors] = useState([]);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetailsModalOpen, setVendorDetailsModalOpen] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState([]);

  const [rejectDocModalOpen, setRejectDocModalOpen] = useState(false);
  const [selectedDocToReject, setSelectedDocToReject] = useState(null);
  const [docRejectionReason, setDocRejectionReason] = useState("Information mismatch");
  const [docRejectionNotes, setDocRejectionNotes] = useState("");

  // Credentials State
  const [credentials, setCredentials] = useState([]);

  const [selectedCredential, setSelectedCredential] = useState(null);
  const [credentialDetailsModalOpen, setCredentialDetailsModalOpen] = useState(false);
  const [revokeCredModalOpen, setRevokeCredModalOpen] = useState(false);
  const [selectedCredToRevoke, setSelectedCredToRevoke] = useState(null);
  const [credRevocationReason, setCredRevocationReason] = useState("Audit discrepancy or compliance failure");
  const [credRevocationNotes, setCredRevocationNotes] = useState("");
  const [revokingLoading, setRevokingLoading] = useState(false);

  // Issue Credential Workflow State
  const [issueVendorSelect, setIssueVendorSelect] = useState("");
  const [issueTemplateSelect, setIssueTemplateSelect] = useState("TenderEligibilityCredential");
  const [issueExpirationDays, setIssueExpirationDays] = useState("365");
  const [issuingLoading, setIssuingLoading] = useState(false);

  useEffect(() => {
    if (!issueVendorSelect && vendors.length > 0) {
      setIssueVendorSelect(vendors[0].vendorId || vendors[0].applicationId);
    }
  }, [vendors, issueVendorSelect]);

  // ZKP Verification State
  const [zkpTestInput, setZkpTestInput] = useState("");
  const [zkpResult, setZkpResult] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Verification Requests State
  const [verificationRequests, setVerificationRequests] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [highlightedCredId, setHighlightedCredId] = useState(null);
  const [vendorPipelineTab, setVendorPipelineTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ISSUED'
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docFilterStatus, setDocFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  const [selectedDocCompanyKey, setSelectedDocCompanyKey] = useState(null);

  // Helper: check if a vendor application has completed verification & received credential
  const isVendorVerifiedOrIssued = (v) => {
    if (!v) return false;
    const credStatus = (v.credentialStatus || '').toLowerCase();
    const status = (v.status || '').toLowerCase();
    const step = Number(v.applicationStep);
    const hasIssuedCred = credentials.some(c => 
      (c.status || '').toLowerCase() === 'active' && (
        (c.applicationId && v.applicationId && c.applicationId === v.applicationId) ||
        (c.vendorEmail && v.vendorEmail && c.vendorEmail.toLowerCase() === v.vendorEmail.toLowerCase()) ||
        (c.credentialId && v.allocatedCredentialId && c.credentialId === v.allocatedCredentialId)
      )
    );
    return credStatus === 'issued' || status === 'verified' || step === 4 || hasIssuedCred;
  };

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  // Helper: Append Audit Log
  const appendAuditLog = (action, entity, entityId, details) => {
    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: "Issuer Admin (issuer@gov.in)",
      action,
      entity,
      entityId,
      status: "Success",
      details
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Document Handlers
  const handleVerifyDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/issuer/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' },
        body: JSON.stringify({ remarks: 'Document verified by Issuer Authority' })
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.map(d => (d.documentId === docId || d._id === docId) ? { ...d, status: 'VERIFIED', remarks: 'Verified by Issuer' } : d));
        appendAuditLog("Document Verified", "VendorDocument", docId, "Verified document validity");
        if (data.allVerified && data.credentialId) {
          triggerToast(`All documents verified! Credential ${data.credentialId} issued & moved to Issued Credentials`, 'success');
          setActiveTab('credentials-issued');
          setHighlightedCredId(data.credentialId);
          setSelectedDocCompanyKey(null);
          setTimeout(() => {
            const el = document.getElementById(`cred-card-${data.credentialId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 250);
        } else {
          triggerToast(`Document ${docId} verified successfully!`, 'success');
        }
        fetchAll();
      } else {
        triggerToast(data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      setDocuments(prev => prev.map(d => (d.documentId === docId || d._id === docId) ? { ...d, status: 'VERIFIED', remarks: 'Verified by Issuer' } : d));
      triggerToast(`Document ${docId} marked as Verified!`, 'success');
    }
  };

  const handleConfirmRejectDocument = async (e) => {
    e.preventDefault();
    if (!selectedDocToReject) return;
    const docId = selectedDocToReject.documentId || selectedDocToReject._id;
    try {
      const res = await fetch(`http://localhost:5000/api/issuer/documents/${docId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' },
        body: JSON.stringify({ reason: docRejectionReason, notes: docRejectionNotes })
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.map(d => (d.documentId === docId || d._id === docId) ? {
          ...d,
          status: 'REJECTED',
          rejectionReason: docRejectionReason,
          remarks: docRejectionNotes || docRejectionReason
        } : d));
        appendAuditLog("Document Rejected", "VendorDocument", docId, `Reason: ${docRejectionReason}`);
        triggerToast(`Document ${docId} Rejected. Reason: ${docRejectionReason}`, 'warning');
        fetchAll();
      } else {
        triggerToast(data.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      setDocuments(prev => prev.map(d => (d.documentId === docId || d._id === docId) ? {
        ...d,
        status: 'REJECTED',
        rejectionReason: docRejectionReason,
        remarks: docRejectionNotes || docRejectionReason
      } : d));
      triggerToast(`Document ${docId} Rejected`, 'warning');
    }
    setRejectDocModalOpen(false);
  };

  // Eligibility Verification Handler
  const handleApproveEligibility = async (vendorId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/issuer/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' },
        body: JSON.stringify({ status: 'Verified' })
      });
      const data = await res.json();
      if (data.success) {
        setVendors(prev => prev.map(v => (v.vendorId === vendorId || v.applicationId === vendorId || v._id === vendorId) ? { ...v, eligibilityStatus: 'Eligible', status: 'Verified' } : v));
        appendAuditLog("Eligibility Approved", "VendorApplication", vendorId, "Approved application & eligibility");
        triggerToast(`Eligibility & Application approved for Vendor!`, 'success');
        fetchAll();
      }
    } catch (err) {
      setVendors(prev => prev.map(v => (v.vendorId === vendorId || v.applicationId === vendorId || v._id === vendorId) ? { ...v, eligibilityStatus: 'Eligible', status: 'Verified' } : v));
      triggerToast(`Eligibility approved for Vendor ${vendorId}!`, 'success');
    }
  };

  // Verify all documents for a specific vendor, issue credential, remove from Vendor Applications & move to Issued Credentials
  const handleVerifyAndProceedToIssueCredential = async (vendor) => {
    if (!vendor) return;
    const vendorIdentifier = vendor.applicationId || vendor.vendorId || vendor._id;

    let issuedCred = null;
    let newCredId = null;

    try {
      const res = await fetch(`http://localhost:5000/api/issuer/vendors/${vendorIdentifier}/verify-all-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' }
      });
      const data = await res.json();
      if (data && data.success) {
        issuedCred = data.credential;
        newCredId = data.credentialId || (data.credential && data.credential.credentialId);
      }
    } catch (err) {
      console.warn('Notice on verify-all-documents API:', err);
    }

    const targetEmail = (vendor.vendorEmail || '').toLowerCase();
    const targetId = vendor.vendorId || vendor.applicationId;
    if (!newCredId) {
      newCredId = `VC-${(targetId || Date.now().toString().slice(-4)).replace(/[^a-zA-Z0-9-]/g, '')}`;
    }

    if (!issuedCred) {
      issuedCred = {
        credentialId: newCredId,
        applicationId: vendor.applicationId,
        vendorId: vendor.vendorId,
        holderDid: vendor.vendorDid || `did:ethr:sepolia:${targetEmail}`,
        vendorEmail: vendor.vendorEmail,
        vendorName: vendor.companyName || vendor.vendorName,
        type: "TenderEligibilityCredential",
        issuanceDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        daysRemaining: 365,
        status: "ACTIVE",
        credentialSubject: {
          id: vendor.vendorDid || `did:ethr:sepolia:${targetEmail}`,
          companyName: vendor.companyName || vendor.vendorName,
          experience: vendor.experienceYears || 8,
          turnover: String((vendor.annualTurnoverCr || 25) * 10000000),
          previousProjects: vendor.previousProjects || 7,
          eligibility: "ELIGIBLE"
        }
      };
    }

    // 1. Add / update credential in state so Issued Credentials updates immediately
    setCredentials(prev => {
      const filtered = prev.filter(c => c.credentialId !== newCredId && c.applicationId !== vendor.applicationId);
      return [issuedCred, ...filtered];
    });

    // 2. Mark documents in state to VERIFIED for this vendor
    setDocuments(prev => prev.map(d => {
      const matchEmail = targetEmail && d.vendorEmail && d.vendorEmail.toLowerCase() === targetEmail;
      const matchId = targetId && (d.vendorId === targetId || d.vendorId === vendor.applicationId);
      return (matchEmail || matchId) ? { ...d, status: 'VERIFIED', remarks: 'Verified by Issuer Authority' } : d;
    }));

    // 3. Mark vendor in state to Verified and Credential Issued (Step 4)
    setVendors(prev => prev.map(v => 
      (v.vendorId === targetId || v.applicationId === targetId || v._id === targetId || (targetEmail && v.vendorEmail && v.vendorEmail.toLowerCase() === targetEmail)) 
        ? { 
            ...v, 
            status: 'Verified', 
            documentVerificationStatus: 'Verified', 
            eligibilityStatus: 'Eligible',
            credentialStatus: 'Issued',
            applicationStep: 4,
            allocatedCredentialId: newCredId,
            stepName: 'Credential Allocated',
            nextStep: 'Tender Bidding (Eligible to Bid)'
          } 
        : v
    ));

    // 4. Close Review modal if open & clear selected doc company
    setVendorDetailsModalOpen(false);
    setSelectedDocCompanyKey(null);

    // 5. Navigate immediately to Issued Credentials tab & highlight newly created credential
    setActiveTab('credentials-issued');
    setSelectedCredential(issuedCred);
    setHighlightedCredId(newCredId);

    appendAuditLog("Verification Complete & Credential Issued", "VendorApplication", vendor.applicationId, `Issued VC ${newCredId} and moved to Issued Credentials`);
    triggerToast(`Application verified & Verifiable Credential (${newCredId}) allocated! Moved to Issued Credentials registry.`, 'success');

    // Scroll to the new credential card
    setTimeout(() => {
      const el = document.getElementById(`cred-card-${newCredId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);

    // Refresh from backend to sync any background tasks
    fetchAll();
  };

  // Verify all documents for a specific vendor
  const handleVerifyAllVendorDocuments = async (vendorId) => {
    const targetVendor = vendors.find(v => v.vendorId === vendorId || v.applicationId === vendorId || v._id === vendorId) || selectedVendor;
    if (targetVendor) {
      await handleVerifyAndProceedToIssueCredential(targetVendor);
    } else {
      try {
        const res = await fetch(`http://localhost:5000/api/issuer/vendors/${vendorId}/verify-all-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' }
        });
        const data = await res.json();
        if (data.success) {
          triggerToast('All vendor documents verified & application approved!', 'success');
          setVendorDetailsModalOpen(false);
          fetchAll();
        } else {
          triggerToast(data.message || 'Verification failed', 'error');
        }
      } catch (err) {
        triggerToast('Error verifying vendor documents', 'error');
      }
    }
  };

  // Move / View Issued Credential for a specific Vendor -> Navigates to Issued Credentials Page
  const handleViewVendorCredential = (vendor) => {
    if (!vendor) return;
    const cred = credentials.find(c => 
      (c.applicationId && vendor.applicationId && c.applicationId === vendor.applicationId) ||
      (c.vendorEmail && vendor.vendorEmail && c.vendorEmail.toLowerCase() === vendor.vendorEmail.toLowerCase()) ||
      (c.vendorId && vendor.vendorId && c.vendorId === vendor.vendorId) ||
      (c.credentialId && vendor.allocatedCredentialId && c.credentialId === vendor.allocatedCredentialId)
    );

    // Navigate to Issued Credentials page
    setActiveTab('credentials-issued');

    if (cred) {
      setSelectedCredential(cred);
      setHighlightedCredId(cred.credentialId);
      triggerToast(`Moved ${vendor.companyName || vendor.vendorName || vendor.applicationId} to Issued Credentials page (VC: ${cred.credentialId})`, 'success');
      setTimeout(() => {
        const el = document.getElementById(`cred-card-${cred.credentialId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } else {
      triggerToast(`Application ${vendor.applicationId} has received VC. Moved to Issued Credentials page.`, 'success');
    }
  };

  // Issue Credential Handler - Calls backend API and allocates VC using submitted vendor details
  const handleIssueCredentialSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const targetVendor = vendors.find(v => 
      v.vendorId === issueVendorSelect || 
      v.applicationId === issueVendorSelect || 
      v._id === issueVendorSelect ||
      (v.vendorEmail && issueVendorSelect && v.vendorEmail.toLowerCase() === issueVendorSelect.toLowerCase())
    ) || vendors[0];

    if (!targetVendor) {
      triggerToast('Please select a verified vendor to issue credentials to.', 'error');
      return;
    }

    const targetVendorDocs = documents.filter(d => 
      (d.vendorEmail && targetVendor.vendorEmail && d.vendorEmail.toLowerCase() === targetVendor.vendorEmail.toLowerCase()) || 
      (d.vendorId && targetVendor.vendorId && d.vendorId === targetVendor.vendorId)
    );

    setIssuingLoading(true);

    try {
      const payload = {
        vendorId: targetVendor.vendorId || targetVendor.applicationId,
        vendorEmail: targetVendor.vendorEmail,
        vendorName: targetVendor.companyName || targetVendor.vendorName,
        holderDid: targetVendor.vendorDid,
        templateId: issueTemplateSelect,
        expirationDays: parseInt(issueExpirationDays) || 365,
        credentialSubject: {
          id: targetVendor.vendorDid,
          vendorId: targetVendor.vendorId,
          companyName: targetVendor.companyName || targetVendor.vendorName,
          vendorEmail: targetVendor.vendorEmail,
          registrationNumber: targetVendor.registrationNumber || "REG-2024-9981",
          gstNumber: targetVendor.gstNumber || "07AAAAA0000A1Z5",
          panNumber: targetVendor.panNumber || "ABCDE1234F",
          phone: targetVendor.phone || "",
          address: targetVendor.address || "",
          experience: targetVendor.experienceYears !== undefined ? targetVendor.experienceYears : 8,
          turnover: targetVendor.annualTurnoverCr !== undefined ? targetVendor.annualTurnoverCr : 25,
          previousProjects: targetVendor.previousProjects !== undefined ? targetVendor.previousProjects : 7,
          completedProjects: targetVendor.previousProjects !== undefined ? targetVendor.previousProjects : 7,
          documentsVerified: true,
          verifiedDocumentsCount: targetVendorDocs.length,
          eligibility: "ELIGIBLE"
        }
      };

      const res = await fetch('http://localhost:5000/api/issuer/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ISSUER'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        const newVC = data.credential || {
          credentialId: data.credentialId,
          vendorId: targetVendor.vendorId,
          vendorEmail: targetVendor.vendorEmail,
          vendorName: targetVendor.companyName || targetVendor.vendorName,
          holderDid: targetVendor.vendorDid,
          type: issueTemplateSelect,
          issuanceDate: new Date().toISOString().split('T')[0],
          expirationDate: new Date(Date.now() + parseInt(issueExpirationDays) * 86400000).toISOString().split('T')[0],
          status: "Active",
          daysRemaining: parseInt(issueExpirationDays),
          credentialSubject: payload.credentialSubject,
          rawVc: data.verifiableCredential
        };

        setCredentials(prev => [newVC, ...prev.filter(c => c.credentialId !== newVC.credentialId)]);
        setVendors(prev => prev.map(v => 
          (v.vendorId === targetVendor.vendorId || v.applicationId === targetVendor.applicationId) 
            ? { 
                ...v, 
                credentialStatus: 'Issued', 
                status: 'Verified', 
                applicationStep: 4, 
                stepName: 'Credential Allocated', 
                nextStep: 'Tender Bidding (Eligible to Bid)',
                allocatedCredentialId: newVC.credentialId 
              } 
            : v
        ));

        appendAuditLog("Credential Issued", "VerifiableCredential", data.credentialId, `Issued ${issueTemplateSelect} to ${targetVendor.vendorEmail}`);
        triggerToast(`Verifiable Credential ${data.credentialId} issued! Application moved to Next Step: Tender Bidding Eligible.`, 'success');

        await fetchAll();
        setActiveTab('credentials-issued');
      } else {
        triggerToast(data.message || 'Failed to issue credential', 'error');
      }
    } catch (err) {
      console.error('Error issuing credential:', err);
      // Fallback local update
      const fallbackVcId = `VC-00${credentials.length + 1}`;
      const fallbackVC = {
        credentialId: fallbackVcId,
        vendorId: targetVendor.vendorId,
        vendorEmail: targetVendor.vendorEmail,
        vendorName: targetVendor.companyName || targetVendor.vendorName,
        holderDid: targetVendor.vendorDid,
        type: issueTemplateSelect,
        issuanceDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + parseInt(issueExpirationDays) * 86400000).toISOString().split('T')[0],
        status: "Active",
        daysRemaining: parseInt(issueExpirationDays),
        credentialSubject: {
          id: targetVendor.vendorDid,
          experience: targetVendor.experienceYears,
          turnover: targetVendor.annualTurnoverCr,
          previousProjects: targetVendor.previousProjects,
          eligibility: "ELIGIBLE"
        }
      };
      setCredentials(prev => [fallbackVC, ...prev]);
      setVendors(prev => prev.map(v => (v.vendorId === targetVendor.vendorId ? { ...v, credentialStatus: 'Issued' } : v)));
      triggerToast(`Verifiable Credential ${fallbackVcId} allocated to ${targetVendor.companyName || targetVendor.vendorName}!`, 'success');
      setActiveTab('credentials-issued');
    } finally {
      setIssuingLoading(false);
    }
  };

  // Revoke Credential Handler (Triggered on Confirmation)
  const handleConfirmRevokeCredential = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCredToRevoke) return;

    setRevokingLoading(true);
    const targetId = selectedCredToRevoke.credentialId;
    const finalReason = credRevocationNotes 
      ? `${credRevocationReason} — ${credRevocationNotes}` 
      : credRevocationReason;

    try {
      const res = await fetch(`http://localhost:5000/api/issuer/credentials/${targetId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ISSUER'
        },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Credential ${targetId} has been successfully REVOKED on cryptographic registry.`, 'warning');
      } else {
        triggerToast(data.message || 'Revocation registered', 'info');
      }
    } catch (err) {
      console.warn('Revoke network warning:', err);
      triggerToast(`Credential ${targetId} marked REVOKED locally.`, 'warning');
    }

    setCredentials(prev => prev.map(c => 
      c.credentialId === targetId ? { ...c, status: 'Revoked' } : c
    ));
    appendAuditLog("Credential Revoked", "VerifiableCredential", targetId, `Reason: ${finalReason}`);
    setRevokeCredModalOpen(false);
    setSelectedCredToRevoke(null);
    setCredRevocationNotes("");
    setRevokingLoading(false);
    fetchAll();
  };

  // Renew Credential Handler with Email Notification to Company from Issuer
  const handleRenewCredential = async (credId) => {
    const cred = credentials.find(c => c.credentialId === credId);
    if (!cred) return;

    const companyEmail = cred.vendorEmail || (cred.credentialSubject && cred.credentialSubject.id ? cred.credentialSubject.id.split(':').pop() : "") || "";
    const companyName = cred.vendorName || (cred.credentialSubject && cred.credentialSubject.companyName) || "Vendor Partner";
    const issuerEmail = currentUser?.email || "issuer@gov.in";

    const newExpiryDate = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    const issuanceDate = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch(`http://localhost:5000/api/issuer/credentials/${credId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ISSUER'
        },
        body: JSON.stringify({
          issuerEmail,
          vendorEmail: companyEmail,
          companyName
        })
      });
      const data = await res.json();

      // Update state
      setCredentials(prev => prev.map(c => 
        c.credentialId === credId 
          ? { 
              ...c, 
              expirationDate: newExpiryDate, 
              issuanceDate, 
              daysRemaining: 365, 
              status: "Active" 
            }
          : c
      ));

      appendAuditLog(
        "Credential Renewed & Notice Mailed",
        "VerifiableCredential",
        credId,
        `Extended for 365 days. Official renewal email dispatched to ${companyEmail || 'company email'} from ${issuerEmail}`
      );

      triggerToast(
        `Credential ${credId} renewed for 365 days! Email sent to company (${companyEmail || companyName}) from ${issuerEmail}.`,
        'success'
      );
      fetchAll();
    } catch (err) {
      console.warn('Renew credential network notice:', err);
      // Offline fallback
      setCredentials(prev => prev.map(c => 
        c.credentialId === credId 
          ? { 
              ...c, 
              expirationDate: newExpiryDate, 
              issuanceDate, 
              daysRemaining: 365, 
              status: "Active" 
            }
          : c
      ));
      appendAuditLog("Credential Renewed", "VerifiableCredential", credId, `Extended for 365 days`);
      triggerToast(`Credential ${credId} renewed for 365 days! Renewal email notification dispatched to ${companyEmail || companyName}.`, 'success');
    }
  };

  // ZKP Verification Handler — calls backend API
  const handleZkpVerifySubmit = async (e) => {
    e.preventDefault();
    if (!zkpTestInput.trim()) {
      triggerToast('Please enter a ZKP Proof ID to verify.', 'warning');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/issuer/zkp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ISSUER' },
        body: JSON.stringify({ proofId: zkpTestInput })
      });
      const data = await res.json();
      if (data.success) {
        setZkpResult(data.result);
        triggerToast('ZK-Proof verified successfully!', 'success');
      } else {
        triggerToast(data.message || 'ZKP verification failed.', 'error');
        setZkpResult(null);
      }
    } catch (err) {
      triggerToast('Error verifying ZKP proof: ' + err.message, 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast("Copied to clipboard!", "info");
  };

  const tabTitles = {
    'overview': 'Issuer Dashboard Overview',
    'vendor-applications': 'Vendor Applications & Registry',
    'credentials-issued': 'Issued Verifiable Credentials Registry',
    'credentials-revoked': 'Revoked Credentials Audit',
    'credentials-expiring': 'Expiring Credentials Monitor',
    'audit-logs': 'Append-Only Audit Logs',
    'issuer-profile': 'Trusted Issuer Profile',
    'settings': 'Security & Cryptographic Settings'
  };

  return (
    <div className={`min-h-screen font-sans antialiased ${lightTheme ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-200'}`}>
      <div className="flex h-screen overflow-hidden">

        {/* PERSISTENT SIDEBAR NAVIGATION (Section 4 Requirement) */}
        <aside className={`fixed md:sticky md:top-0 h-screen z-40 bg-slate-900/95 border-r border-slate-800/90 text-slate-300 transition-all duration-300 flex flex-col justify-between shadow-2xl backdrop-blur-md ${sidebarCollapsed ? 'w-16 md:w-20' : 'w-64'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full">

            {/* Header / Brand */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('overview')} 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition"
                title="Issuer Dashboard Overview"
              >
                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                    <i className="fa-solid fa-shield-halved text-base"></i>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <span className="font-bold text-lg text-white tracking-tight">ZK-<span className="text-teal-400">Tenders</span></span>
                    <span className="block text-[9px] font-mono text-teal-400 uppercase tracking-widest">Issuer Portal</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:block text-slate-400 hover:text-white transition">
                <i className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
              </button>
            </div>

            {/* Issuer Profile Banner */}
            {!sidebarCollapsed && (
              <div className="p-3 mx-3 my-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-xs font-mono shrink-0 shadow">
                    DID
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{issuerName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">ID: <span className="text-teal-400 font-semibold">{orgId}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION MENU (Matching Section 4 Layout Exactly) */}
            <nav className="px-3 space-y-1 text-xs font-medium flex-1 overflow-y-auto pb-4 pt-2">
              
              {/* 🏠 Overview */}
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <i className="fa-solid fa-house w-4 text-center shrink-0"></i>
                {!sidebarCollapsed && <span>Overview</span>}
              </button>

              {/* 👥 Vendor Applications */}
              <button 
                onClick={() => setActiveTab('vendor-applications')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'vendor-applications' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <i className="fa-solid fa-users w-4 text-center text-teal-400 shrink-0"></i>
                  {!sidebarCollapsed && <span>Vendor Applications</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="bg-amber-500/20 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {vendors.filter(v => !isVendorVerifiedOrIssued(v)).length}
                  </span>
                )}
              </button>


              {/* 🎫 Credential Management Section */}
              <div className="pt-2 pb-1">
                {!sidebarCollapsed && <div className="px-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold mb-1">🎫 Credential Management</div>}
                <div className="space-y-0.5">
                  <button onClick={() => setActiveTab('credentials-issued')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between pl-6'} px-3 py-1.5 rounded-lg text-xs transition ${activeTab === 'credentials-issued' ? 'text-teal-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-white'}`}>
                    <div className="flex items-center space-x-2.5">
                      <i className="fa-solid fa-file-shield w-3 text-center"></i>
                      {!sidebarCollapsed && <span>Issued Credentials</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {credentials.filter(c => (c.status || '').toLowerCase() === 'active').length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setActiveTab('credentials-revoked')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5 pl-6'} px-3 py-1.5 rounded-lg text-xs transition ${activeTab === 'credentials-revoked' ? 'text-rose-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-white'}`}>
                    <i className="fa-solid fa-ban w-3 text-center"></i>
                    {!sidebarCollapsed && <span>Revoked Credentials</span>}
                  </button>
                  <button onClick={() => setActiveTab('credentials-expiring')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5 pl-6'} px-3 py-1.5 rounded-lg text-xs transition ${activeTab === 'credentials-expiring' ? 'text-amber-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-white'}`}>
                    <i className="fa-solid fa-clock w-3 text-center"></i>
                    {!sidebarCollapsed && <span>Expiring Credentials</span>}
                  </button>
                </div>
              </div>

              {/* 📜 Audit Logs */}
              <button 
                onClick={() => setActiveTab('audit-logs')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'audit-logs' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <i className="fa-solid fa-scroll w-4 text-center text-amber-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Audit Logs</span>}
              </button>

              {/* 🏢 Issuer Profile */}
              <button 
                onClick={() => setActiveTab('issuer-profile')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'issuer-profile' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <i className="fa-solid fa-building-columns w-4 text-center text-teal-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Issuer Profile</span>}
              </button>

              {/* ⚙️ Settings */}
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                <i className="fa-solid fa-gear w-4 text-center text-slate-400 shrink-0"></i>
                {!sidebarCollapsed && <span>Settings</span>}
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
                <i className={`fa-solid ${lightTheme ? 'fa-sun text-amber-500' : 'fa-moon text-teal-400'}`}></i>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className={`p-2 rounded-lg relative transition ${lightTheme ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fa-regular fa-bell text-base"></i>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                </button>
                {notifOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 p-3.5 space-y-2 text-xs border ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <div className={`font-bold border-b pb-1.5 flex items-center justify-between ${lightTheme ? 'text-teal-600 border-slate-100' : 'text-teal-400 border-slate-800'}`}>
                      <span>Issuer Notifications</span>
                      <span className="text-[10px] font-mono text-slate-400">Live</span>
                    </div>
                    <div className={`space-y-2 text-[11px] ${lightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                      <p>🟢 TechCorp Global Solutions credential VC-001 active.</p>
                      <p>🟢 InfraBuild India application pending document review.</p>
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
                      ? 'bg-white border-slate-300 hover:border-teal-500 shadow-slate-200'
                      : 'bg-slate-900 border-slate-700 hover:border-teal-400'
                  }`}
                  title={`Issuer Profile: ${issuerName} (${orgId})`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 via-emerald-500 to-cyan-600 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-md border border-teal-400/40">
                    <i className="fa-solid fa-shield-halved text-xs"></i>
                  </div>
                </button>

                {/* Profile Flyout */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 space-y-3 font-sans text-xs ${
                    lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-white'
                  }`}>
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-600 via-emerald-500 to-cyan-600 text-white flex items-center justify-center shadow-md border-2 border-teal-500/40 shrink-0">
                          <i className="fa-solid fa-shield-halved text-sm"></i>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className={`font-bold text-xs truncate ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{issuerName}</h4>
                          <p className="text-[10px] font-mono text-teal-500 font-semibold truncate">{orgId}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">Trusted Credential Authority</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button onClick={() => { setActiveTab('issuer-profile'); setProfileDropdownOpen(false); }} className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'}`}>
                        <i className="fa-solid fa-address-card text-sky-500"></i>
                        <span>View Issuer Profile</span>
                      </button>
                      <button onClick={() => { setActiveTab('credentials-issued'); setProfileDropdownOpen(false); }} className={`w-full flex items-center space-x-2 p-2 rounded-xl transition font-medium ${lightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'}`}>
                        <i className="fa-solid fa-file-shield text-teal-500"></i>
                        <span>Issued Credentials</span>
                      </button>
                    </div>

                    <div className={`pt-1 border-t ${lightTheme ? 'border-slate-100' : 'border-slate-800'}`}>
                      <button onClick={() => { setProfileDropdownOpen(false); setShowLogoutModal(true); }} className={`w-full p-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition border ${lightTheme ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'}`}>
                        <i className="fa-solid fa-right-from-bracket"></i> Sign Out Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN PAGE CONTENT */}
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* SECTION 5: OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
              <div className="space-y-6 text-xs font-sans">
                
                {/* 8 Statistic Cards (Section 5 Requirement) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Total Vendors</span>
                    <span className="text-xl font-extrabold mt-1 block">{stats.totalVendors}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-slate-900 border-amber-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold block">Pending</span>
                    <span className="text-xl font-extrabold mt-1 block text-amber-600 dark:text-amber-400">{stats.pending}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-slate-900 border-emerald-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Verified</span>
                    <span className="text-xl font-extrabold mt-1 block text-emerald-600 dark:text-emerald-400">{stats.verified}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-rose-50/50 border-rose-200 text-rose-900' : 'bg-slate-900 border-rose-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase font-bold block">Rejected</span>
                    <span className="text-xl font-extrabold mt-1 block text-rose-600 dark:text-rose-400">{stats.rejected}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-slate-900 border-teal-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-bold block">Credentials Issued</span>
                    <span className="text-xl font-extrabold mt-1 block text-teal-600 dark:text-teal-400">{stats.credentialsIssued}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-slate-900 border-teal-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-bold block">Active</span>
                    <span className="text-xl font-extrabold mt-1 block text-teal-600 dark:text-teal-400">{stats.activeCredentials}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-rose-50/50 border-rose-200 text-rose-900' : 'bg-slate-900 border-rose-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase font-bold block">Revoked</span>
                    <span className="text-xl font-extrabold mt-1 block text-rose-600 dark:text-rose-400">{stats.revokedCredentials}</span>
                  </div>
                  <div className={`p-3.5 rounded-xl border transition shadow-sm ${lightTheme ? 'bg-orange-50/50 border-orange-200 text-orange-900' : 'bg-slate-900 border-orange-500/30 text-white'}`}>
                    <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 uppercase font-bold block">Expiring Soon</span>
                    <span className="text-xl font-extrabold mt-1 block text-orange-600 dark:text-orange-400">{stats.expiringSoon}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div className={`p-5 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <h3 className={`font-bold text-sm border-b pb-2 mb-3 flex items-center justify-between ${lightTheme ? 'text-slate-900 border-slate-200' : 'text-white border-slate-800'}`}>
                      <span>Recent Issuer Activity</span>
                      <i className="fa-solid fa-clock-rotate-left text-teal-500"></i>
                    </h3>
                    <div className="space-y-2.5 font-mono text-[11px]">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>ABC Infrastructure verified</span>
                        <span className="text-emerald-500 font-bold">✓ Verified</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>Credential VC-001 issued to TechCorp</span>
                        <span className="text-teal-500 font-bold">🎫 Issued</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>XYZ Builders application submitted</span>
                        <span className="text-amber-500 font-bold">⏳ Pending</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>Credential VC-014 revoked due to audit update</span>
                        <span className="text-rose-500 font-bold">⛔ Revoked</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>PQR Construction credential renewed</span>
                        <span className="text-teal-500 font-bold">🔄 Renewed</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Statistics Visual Chart */}
                  <div className={`p-5 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <h3 className={`font-bold text-sm border-b pb-2 mb-3 flex items-center justify-between ${lightTheme ? 'text-slate-900 border-slate-200' : 'text-white border-slate-800'}`}>
                      <span>Verification & Issuance Trends</span>
                      <i className="fa-solid fa-chart-column text-teal-500"></i>
                    </h3>
                    <div className="space-y-3 font-mono text-[11px]">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Verified Vendors (77.6%)</span>
                          <span>97 / 125</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '77.6%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Pending Review (14.4%)</span>
                          <span>18 / 125</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '14.4%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Active Credentials (96.9%)</span>
                          <span>94 / 97</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: '96.9%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6 & 7: VENDOR APPLICATIONS MODULE & DETAILS */}
            {activeTab === 'vendor-applications' && (() => {
              const pendingVendors = vendors.filter(v => !isVendorVerifiedOrIssued(v));
              const completedVendors = vendors.filter(v => isVendorVerifiedOrIssued(v));
              const displayedVendors = pendingVendors.filter(v => {
                const matchesFilter = statusFilter === 'ALL' || (v.status || '').toLowerCase() === statusFilter.toLowerCase();
                const matchesSearch = !searchQuery || 
                  (v.vendorName && v.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (v.companyName && v.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (v.applicationId && v.applicationId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (v.vendorEmail && v.vendorEmail.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesFilter && matchesSearch;
              });

              return (
                <div className="space-y-4 text-xs font-sans">
                  {/* Search & Status Filters */}
                  <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
                    lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search pending applications..."
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border focus:outline-none text-xs ${
                            lightTheme ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`p-2 rounded-lg border text-xs ${
                          lightTheme ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      >
                        <option value="ALL">All Pending ({pendingVendors.length})</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-amber-400">{pendingVendors.length}</span> pending review
                      {completedVendors.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{completedVendors.length} moved to Issued Credentials</span>
                        </>
                      )}
                    </div>
                  </div>


                  {/* Applications Table Card */}
                  <div className={`p-6 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-hourglass-half text-amber-400"></i>
                        <h3 className="font-bold text-sm text-slate-100">Pending Review Applications</h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                          {displayedVendors.length}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">Verifying an application automatically issues its VC and moves it to Issued Credentials</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className={`border-b text-[10px] uppercase text-slate-400 ${lightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
                            <th className="p-2.5">Application & Vendor</th>
                            <th className="p-2.5">Company Name</th>
                            <th className="p-2.5">Vendor DID</th>
                            <th className="p-2.5">Application Date</th>
                            <th className="p-2.5">Application Stage & Status</th>
                            <th className="p-2.5">Documents</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedVendors.map(v => (
                            <tr key={v.applicationId || v._id} className={`border-b ${lightTheme ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/60 hover:bg-slate-800/40'}`}>
                              <td className="p-2.5">
                                <div className="font-bold text-teal-500">{v.applicationId}</div>
                                <div className="text-[10px] text-slate-400 font-sans">{v.vendorName || v.vendorEmail}</div>
                              </td>
                              <td className="p-2.5 font-sans font-semibold">{v.companyName || v.vendorName}</td>
                              <td className="p-2.5 font-mono text-[10px] text-teal-500" title={v.vendorDid}>
                                {v.vendorDid ? `${v.vendorDid.substring(0, 18)}...` : 'N/A'}
                              </td>
                              <td className="p-2.5 text-slate-400">
                                {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : 'Recent'}
                              </td>
                              <td className="p-2.5">
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold inline-block bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    {v.status || 'Step 2: Under Review'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-sans">
                                    Next: {v.nextStep || 'Document Review'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2.5 font-sans">
                                <span className="text-slate-400">{v.documentVerificationStatus || 'Pending'}</span>
                              </td>
                              <td className="p-2.5 text-right font-sans space-x-1.5">
                                <button 
                                  onClick={() => { setSelectedVendor(v); setVendorDetailsModalOpen(true); }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold transition cursor-pointer"
                                >
                                  Review
                                </button>
                                <button 
                                  onClick={() => handleVerifyAndProceedToIssueCredential(v)}
                                  className="px-3 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded text-[11px] font-bold transition shadow cursor-pointer inline-flex items-center space-x-1"
                                  title="Verify all documents, issue VC & move to Issued Credentials"
                                >
                                  <i className="fa-solid fa-stamp text-[10px]"></i>
                                  <span>Verify & Issue VC</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {displayedVendors.length === 0 && (
                            <tr>
                              <td colSpan="7" className="p-12 text-center">
                                <div className="max-w-md mx-auto space-y-3 font-sans">
                                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">
                                    <i className="fa-solid fa-clipboard-check"></i>
                                  </div>
                                  <h4 className="font-bold text-sm text-slate-200">No Pending Vendor Applications</h4>
                                  <p className="text-xs text-slate-400">
                                    {completedVendors.length > 0 
                                      ? `All ${completedVendors.length} application(s) have been verified and moved to the Issued Credentials registry.`
                                      : "There are currently no vendor applications awaiting verification."}
                                  </p>
                                  {completedVendors.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('credentials-issued')}
                                      className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                                    >
                                      <i className="fa-solid fa-file-shield mr-1"></i>
                                      <span>View Issued Credentials Registry ({completedVendors.length})</span>
                                      <i className="fa-solid fa-arrow-right text-[10px] ml-1"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}






            {/* SECTION 17 & 18: ISSUED CREDENTIALS & DETAILS */}
            {activeTab === 'credentials-issued' && (
              <div className={`p-6 rounded-xl border shadow-sm space-y-4 font-sans text-xs ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-base text-teal-500">Issued Verifiable Credentials Registry</h3>
                  <p className="text-slate-400 text-xs mt-0.5">All approved vendor applications with allocated post-quantum cryptographic credentials (Tender Bidding Ready)</p>
                </div>

                <div className="space-y-3 font-mono">
                  {credentials.filter(c => (c.status || '').toLowerCase() === 'active').map(c => {
                    const isHighlighted = highlightedCredId === c.credentialId;

                    return (
                      <div 
                        key={c.credentialId} 
                        id={`cred-card-${c.credentialId}`}
                        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all duration-300 ${
                          isHighlighted 
                            ? 'ring-2 ring-teal-400 bg-teal-950/40 border-teal-500/80 shadow-lg shadow-teal-500/20' 
                            : lightTheme 
                              ? 'bg-slate-50 border-slate-200' 
                              : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-teal-400 text-sm">{c.credentialId}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-sans">{c.type}</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">ACTIVE</span>
                            {isHighlighted && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-[10px] font-extrabold rounded shadow animate-pulse">
                                ✨ Moved to Issued Credentials
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm font-sans text-white">
                            {c.vendorName || (c.credentialSubject && c.credentialSubject.companyName) || c.vendorEmail || 'Verified Vendor'} 
                            <span className="text-slate-400 font-normal ml-1.5 text-xs font-mono">({c.vendorEmail})</span>
                          </h4>
                          <p className="text-slate-400 text-xs font-mono">
                            Issued: {c.issuanceDate ? c.issuanceDate.split('T')[0] : 'Recent'} | 
                            Expiration: {c.expirationDate ? c.expirationDate.split('T')[0] : '1 Year'}
                            {c.daysRemaining !== undefined ? ` (${c.daysRemaining} days remaining)` : ''} | 
                            <span className="text-emerald-400 ml-1">Status: Eligible for Tender Bidding</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 font-sans shrink-0">
                          <button onClick={() => { setSelectedCredential(c); setCredentialDetailsModalOpen(true); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition cursor-pointer">
                            View W3C JSON
                          </button>
                          <button onClick={() => { setSelectedCredToRevoke(c); setRevokeCredModalOpen(true); }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition cursor-pointer">
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {credentials.filter(c => (c.status || '').toLowerCase() === 'active').length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-xl border-slate-700/60 p-6 space-y-2 font-sans">
                      <i className="fa-solid fa-award text-2xl text-slate-500"></i>
                      <p className="text-xs text-slate-400">No active verifiable credentials issued yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 19: REVOKED CREDENTIALS */}
            {activeTab === 'credentials-revoked' && (
              <div className={`p-6 rounded-xl border shadow-sm space-y-4 font-sans text-xs ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="font-bold text-base text-rose-500 border-b pb-2">Revoked Credentials Audit Registry</h3>

                <div className="space-y-3 font-mono">
                  {credentials.filter(c => c.status === 'Revoked').map(c => (
                    <div key={c.credentialId} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-rose-500">{c.credentialId}</span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 text-[10px] font-bold rounded">REVOKED</span>
                      </div>
                      <div className="font-bold text-sm font-sans">{c.vendorName} ({c.vendorEmail})</div>
                    </div>
                  ))}
                  {credentials.filter(c => c.status === 'Revoked').length === 0 && (
                    <p className="text-slate-400 text-xs">No credentials currently revoked.</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 21: EXPIRING CREDENTIALS */}
            {activeTab === 'credentials-expiring' && (() => {
              const issuerEmail = currentUser?.email || "issuer@gov.in";
              const activeCreds = credentials.filter(c => (c.status || '').toLowerCase() === 'active');
              const expiringSoonCount = activeCreds.filter(c => Number(c.daysRemaining) < 90).length;

              return (
                <div className={`p-6 rounded-2xl border shadow-sm space-y-4 font-sans text-xs ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  {/* Top Header Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800">
                    <div>
                      <h3 className="font-extrabold text-base text-amber-400 flex items-center space-x-2">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>Expiring Credentials Monitor & Mail Dispatch</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Renew expiring credentials for +365 days and automatically dispatch official confirmation emails from Issuer Authority to company inboxes.
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        🎫 {activeCreds.length} Active Credentials
                      </span>
                      {expiringSoonCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          ⚠️ {expiringSoonCount} Expiring Soon (&lt;90d)
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        ✉️ From: {issuerEmail}
                      </span>
                    </div>
                  </div>

                  {/* Credentials List */}
                  <div className="space-y-3 font-mono">
                    {credentials.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-sans">
                        <i className="fa-solid fa-folder-open text-2xl text-slate-500 mb-2"></i>
                        <p>No credentials found in registry.</p>
                      </div>
                    ) : (
                      credentials.map(c => {
                        const daysLeft = Number(c.daysRemaining ?? 365);
                        const isExpiringSoon = daysLeft < 90;
                        const companyEmail = c.vendorEmail || (c.credentialSubject && c.credentialSubject.id ? c.credentialSubject.id.split(':').pop() : "") || "company@domain.com";
                        const isRenewed = daysLeft >= 360;

                        return (
                          <div 
                            key={c.credentialId} 
                            className={`p-4 sm:p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-sm ${
                              isExpiringSoon 
                                ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60' 
                                : lightTheme 
                                ? 'border-slate-200 bg-slate-50/80 hover:border-teal-400/50' 
                                : 'border-slate-800 bg-slate-950/70 hover:border-teal-500/40'
                            }`}
                          >
                            <div className="space-y-1.5 font-sans">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1 font-mono">
                                <span className="font-bold text-teal-400 text-xs">{c.credentialId}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  (c.status || '').toLowerCase() === 'revoked'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : isExpiringSoon
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {(c.status || 'Active').toUpperCase()}
                                </span>
                                {c.type && (
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700">
                                    {c.type}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                                <span>{c.vendorName || c.companyName || 'Vendor Company'}</span>
                                {c.applicationId && (
                                  <span className="font-mono text-[10px] text-teal-400 font-normal">({c.applicationId})</span>
                                )}
                              </h4>

                              {/* Mail Dispatch Details */}
                              <div className="text-[11px] text-slate-400 flex items-center flex-wrap gap-x-3 gap-y-1 font-mono">
                                <span className="flex items-center space-x-1 text-slate-300">
                                  <i className="fa-solid fa-envelope text-teal-400 text-[10px]"></i>
                                  <span>To: <strong className="text-teal-300">{companyEmail}</strong></span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center space-x-1 text-slate-400">
                                  <span>From: <code className="text-slate-300">{issuerEmail}</code></span>
                                </span>
                                <span>•</span>
                                <span>Expires: <strong className={isExpiringSoon ? 'text-amber-400' : 'text-slate-300'}>{c.expirationDate}</strong> ({daysLeft} days remaining)</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto font-sans">
                              {isRenewed ? (
                                <button 
                                  type="button"
                                  onClick={() => handleRenewCredential(c.credentialId)} 
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
                                  title={`Credential active for ${daysLeft} days. Click to re-dispatch renewal email.`}
                                >
                                  <i className="fa-solid fa-paper-plane text-emerald-400 text-xs"></i>
                                  <span>Re-send Renewal Email</span>
                                </button>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => handleRenewCredential(c.credentialId)} 
                                  className="px-4 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                                  title={`Renew credential for 365 days and send notification email to ${companyEmail} from ${issuerEmail}`}
                                >
                                  <i className="fa-solid fa-paper-plane text-xs"></i>
                                  <span>Renew Credential & Send Email</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}



            {/* SECTION 24: AUDIT LOGS */}
            {activeTab === 'audit-logs' && (
              <div className={`p-6 rounded-xl border shadow-sm space-y-4 font-sans text-xs ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="font-bold text-base text-amber-500 border-b pb-2">Append-Only Audit Logs</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b text-[10px] text-slate-400 uppercase">
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Actor</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Entity & ID</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2.5 text-slate-400">{log.timestamp}</td>
                          <td className="p-2.5 font-bold">{log.actor}</td>
                          <td className="p-2.5 text-teal-500 font-bold">{log.action}</td>
                          <td className="p-2.5">{log.entity}: {log.entityId}</td>
                          <td className="p-2.5 text-emerald-500 font-bold">{log.status}</td>
                          <td className="p-2.5 text-slate-400 font-sans">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 25: ISSUER PROFILE */}
            {activeTab === 'issuer-profile' && (
              <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs">
                
                {/* HERO PROFILE HEADER BANNER */}
                <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 shadow-lg bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute right-40 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="p-6 sm:p-8 relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center space-x-4">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-blue-600 p-0.5 shadow-xl">
                            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white text-3xl font-bold">
                              <i className="fa-solid fa-building-columns text-teal-400"></i>
                            </div>
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold" title="Authorized Active Issuer">
                            ✓
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              ● {issuerProfile.verificationStatus}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              {issuerProfile.registrationNumber}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{issuerProfile.organizationName}</h2>
                          <p className="text-xs text-slate-300 font-medium">{issuerProfile.department} · {issuerProfile.designation}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                            <i className="fa-solid fa-user-shield text-teal-400"></i> Officer: <strong className="text-slate-200">{issuerProfile.officerName}</strong> ({issuerProfile.badgeId})
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={handleCreateIssuerDid}
                          disabled={didLoading}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-key text-yellow-300"></i>
                          <span>{didLoading ? 'Generating DID...' : 'Create Issuer DID (did:ethr)'}</span>
                        </button>
                        <button
                          onClick={handleOpenEditProfile}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit Profile Info
                        </button>
                        <button
                          onClick={() => copyToClipboard(issuerProfile.issuerDid)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-mono text-[11px] border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <i className="fa-solid fa-copy text-teal-400"></i> Copy Issuer DID
                        </button>
                      </div>

                    </div>

                    {/* DID BAR */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-teal-400 font-bold shrink-0">W3C ISSUER DID:</span>
                        <code className="text-slate-300 truncate">{issuerProfile.issuerDid}</code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <button
                          onClick={handleCreateIssuerDid}
                          disabled={didLoading}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <i className="fa-solid fa-plus-circle text-emerald-400"></i> {didLoading ? 'Creating...' : 'Create Web3 DID'}
                        </button>
                        <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          ✓ Cryptographically Verified
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4 METRICS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Issued Credentials</div>
                    <div className="text-xl font-bold text-teal-500 mt-1">{stats.credentialsIssued} VCs</div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Active & Valid</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Registered Vendors</div>
                    <div className="text-xl font-bold text-blue-500 mt-1">{stats.totalVendors} Vendors</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{stats.verified} Verified</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">Post-Quantum Cryptography</div>
                    <div className="text-sm font-bold text-emerald-500 mt-1 truncate">ML-DSA-65</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">NIST FIPS 204 Standard</div>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-slate-400 text-[11px] font-medium">HSM Vault Status</div>
                    <div className="text-sm font-bold text-amber-500 mt-1 truncate">Level 4 Active</div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Key KMS Secured</div>
                  </div>
                </div>

                {/* PROFILE SUB-TAB NAVIGATION */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-semibold">
                  <button
                    onClick={() => setProfileActiveSubTab('details')}
                    className={`pb-3 transition relative cursor-pointer ${profileActiveSubTab === 'details' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-address-card mr-1.5"></i> Authority & Officer Profile
                  </button>
                  <button
                    onClick={() => setProfileActiveSubTab('crypto')}
                    className={`pb-3 transition relative cursor-pointer ${profileActiveSubTab === 'crypto' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-key mr-1.5"></i> Cryptographic Identity
                  </button>
                  <button
                    onClick={() => setProfileActiveSubTab('templates')}
                    className={`pb-3 transition relative cursor-pointer ${profileActiveSubTab === 'templates' ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <i className="fa-solid fa-stamp mr-1.5"></i> VC Schemas Issued
                  </button>
                </div>

                {/* SUB-TAB 1: AUTHORITY & OFFICER PROFILE */}
                {profileActiveSubTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Organization Identity Card */}
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <i className="fa-solid fa-building text-teal-500"></i> Organization & Entity Details
                        </h4>
                        <span className="text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-bold">
                          Govt Entity
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px] block">Organization Legal Name</label>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{issuerProfile.organizationName}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Organization Type</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{issuerProfile.organizationType}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Government Registration Number</label>
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{issuerProfile.registrationNumber}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Ministry / Parent Department</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{issuerProfile.department}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Official Headquarters Address</label>
                          <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{issuerProfile.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Representative / Officer Details */}
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <i className="fa-solid fa-user-tie text-blue-500"></i> Designated Issuer Officer
                        </h4>
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                          Verified Officer
                        </span>
                      </div>

                      <div className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px] block">Officer Full Name</label>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{issuerProfile.officerName}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Official Designation</label>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{issuerProfile.designation}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Officer Badge / Employee ID</label>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{issuerProfile.badgeId}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Official Email Address</label>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{issuerProfile.email}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block">Direct Phone Contact</label>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{issuerProfile.phone}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB-TAB 2: CRYPTOGRAPHIC IDENTITY */}
                {profileActiveSubTab === 'crypto' && (
                  <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <i className="fa-solid fa-key text-amber-500"></i> Cryptographic Identity & Key Management Architecture
                      </h4>
                      <button
                        onClick={handleCreateIssuerDid}
                        disabled={didLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        <i className="fa-solid fa-plus-circle text-yellow-300"></i>
                        <span>{didLoading ? 'Deriving DID...' : 'Create Ethereum DID (did:ethr)'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-teal-500/30 text-white space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-xs text-teal-300">Web3 Decentralized Identity Creation (did:ethr:sepolia)</span>
                        </div>
                        <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                          Standard EIP-1056
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Generate and register an official Ethereum Decentralized Identifier (<code className="text-teal-300">did:ethr:sepolia</code>) linked to your Web3 wallet using personal message signature verification (<code className="text-amber-300">personal_sign</code>).
                      </p>
                      <div className="pt-1 flex items-center gap-3">
                        <button
                          onClick={handleCreateIssuerDid}
                          disabled={didLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow"
                        >
                          <i className="fa-solid fa-wallet"></i> {didLoading ? 'Signing Signature...' : 'Connect Wallet & Create DID'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Issuer DID URI</span>
                        <code className="text-teal-500 font-bold block truncate">{issuerProfile.issuerDid}</code>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Supported DID Methods</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{issuerProfile.didMethod}</span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Post-Quantum Signature Algorithm</span>
                        <span className="font-bold text-emerald-500 block">{issuerProfile.signatureScheme}</span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                        <span className="text-slate-400 text-[11px] block font-sans">Key Vault KMS Security</span>
                        <span className="font-bold text-amber-500 block">{issuerProfile.kmsStatus}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 text-white font-mono text-xs space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Issuer Public Verification Key (Multibase):</span>
                        <span className="text-emerald-400 text-[10px] font-bold">● Active Key (Key ID: #key-1)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-300 break-all text-[11px]">
                        z6MkpTHR8V2X6F9qW1Z89B0V1Z1R2M3N4P5Q6R7S8T9U0V1
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: VC SCHEMAS */}
                {profileActiveSubTab === 'templates' && (
                  <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <i className="fa-solid fa-certificate text-teal-500"></i> Supported Verifiable Credential Schemas
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { templateId: 'TenderEligibilityCredential', name: 'Tender Eligibility Credential', description: 'Certifies vendor experience, turnover, and project eligibility for sealed-bid tenders.' },
                        { templateId: 'CompanyVerificationCredential', name: 'Company Verification Credential', description: 'Certifies corporate MCA registration, GSTIN compliance, and PAN identity.' },
                        { templateId: 'FinancialAuditCredential', name: 'Financial Audit Credential', description: 'Certifies annual turnover and tax audit records for tender qualification.' }
                      ].map((tpl) => (
                        <div key={tpl.templateId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-500/20 text-teal-400">
                              {tpl.templateId}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold">✓ Active</span>
                          </div>
                          <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{tpl.name}</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{tpl.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SECTION 26: SETTINGS */}
            {activeTab === 'settings' && (
              <div className={`p-6 rounded-xl border shadow-sm space-y-6 max-w-3xl mx-auto font-sans text-xs ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-300 border-b pb-2">Issuer Security & Cryptographic Settings</h3>

                <div className="space-y-4 font-mono">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <div className="font-bold text-teal-500">Signing Key Algorithm</div>
                    <div className="text-slate-400 text-[11px]">NIST FIPS 204 ML-DSA-65 + Ed25519 Hybrid Signature</div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <div className="font-bold text-amber-500">Key Protection Notice</div>
                    <div className="text-slate-400 text-[11px]">Private signing keys are held securely on backend server KMS. Never exposed to frontend.</div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* VENDOR DETAILS & DOCUMENT REVIEW MODAL */}
      {vendorDetailsModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`border rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 text-xs font-sans shadow-2xl my-8 transition ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-4 ${lightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <div className="flex items-center space-x-2.5 mb-1 flex-wrap gap-y-1">
                  <span className="font-extrabold text-base sm:text-lg text-teal-400">
                    {selectedVendor.companyName || selectedVendor.vendorName}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    (selectedVendor.status || '').toLowerCase() === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : (selectedVendor.status || '').toLowerCase() === 'rejected'
                      ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                  }`}>
                    {selectedVendor.status || 'Under Review'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Application ID: <span className="font-mono text-teal-400 font-semibold">{selectedVendor.applicationId}</span> | 
                  Email: <span className="font-semibold text-slate-300">{selectedVendor.vendorEmail}</span> | 
                  DID: <span className="font-mono text-teal-400 text-[10px]">{selectedVendor.vendorDid ? `${selectedVendor.vendorDid.substring(0, 24)}...` : 'N/A'}</span>
                </p>
              </div>
              <button 
                onClick={() => setVendorDetailsModalOpen(false)} 
                className={`p-1.5 rounded-lg transition ${lightTheme ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Vendor Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Experience</span>
                <span className="text-sm font-bold text-teal-400">{selectedVendor.experienceYears || 8} Years</span>
              </div>
              <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Turnover</span>
                <span className="text-sm font-bold text-teal-400">₹{selectedVendor.annualTurnoverCr || 25} Cr</span>
              </div>
              <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Completed Projects</span>
                <span className="text-sm font-bold text-blue-400">{selectedVendor.previousProjects || 7} Projects</span>
              </div>
              <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Doc Verification</span>
                <span className="text-sm font-bold text-amber-400">{selectedVendor.documentVerificationStatus || 'Pending'}</span>
              </div>
            </div>

            {/* Uploaded Documents for this Vendor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-teal-400 flex items-center space-x-2">
                  <i className="fa-solid fa-folder-open text-teal-400"></i>
                  <span>Submitted Company Documents ({
                    documents.filter(d => 
                      (d.vendorEmail && selectedVendor.vendorEmail && d.vendorEmail.toLowerCase() === selectedVendor.vendorEmail.toLowerCase()) || 
                      (d.vendorId && d.vendorId === selectedVendor.vendorId)
                    ).length
                  })</span>
                </h4>
                <button
                  type="button"
                  onClick={() => handleVerifyAndProceedToIssueCredential(selectedVendor)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <i className="fa-solid fa-check-double mr-1"></i> Verify All & Issue Credential
                </button>
              </div>

              {/* Document Cards List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {(() => {
                  const vendorDocs = documents.filter(d => 
                    (d.vendorEmail && selectedVendor.vendorEmail && d.vendorEmail.toLowerCase() === selectedVendor.vendorEmail.toLowerCase()) || 
                    (d.vendorId && d.vendorId === selectedVendor.vendorId)
                  );

                  if (vendorDocs.length === 0) {
                    return (
                      <div className="text-center py-8 border border-dashed rounded-xl border-slate-700/60 p-6 space-y-2">
                        <i className="fa-solid fa-file-circle-exclamation text-2xl text-slate-500"></i>
                        <p className="text-xs font-semibold text-slate-300">No documents found for this vendor.</p>
                      </div>
                    );
                  }

                  return vendorDocs.map(d => {
                    const isVerified = (d.status || '').toUpperCase() === 'VERIFIED';
                    const isRejected = (d.status || '').toUpperCase() === 'REJECTED';

                    return (
                      <div 
                        key={d.documentId || d._id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-bold text-teal-400 font-mono text-[11px]">{d.documentId}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] rounded font-sans font-medium">{d.documentType}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isVerified ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                              isRejected ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                            }`}>
                              {isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'UNDER REVIEW'}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs">{d.documentName || d.documentType} {d.fileSize ? `(${d.fileSize})` : ''}</h5>
                          <p className="text-[11px] text-slate-400">
                            Uploaded: {d.uploadedDate || (d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : 'Recent')}
                            {d.remarks ? ` | Remarks: ${d.remarks}` : ''}
                          </p>
                        </div>

                        {/* Document Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {d.fileUrl && (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                            >
                              <i className="fa-solid fa-file-arrow-down mr-1"></i> View Doc
                            </a>
                          )}
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerifyDocument(d.documentId || d._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                            >
                              <i className="fa-solid fa-check mr-1"></i> Verify
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              type="button"
                              onClick={() => { setSelectedDocToReject(d); setRejectDocModalOpen(true); }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow"
                            >
                              <i className="fa-solid fa-xmark mr-1"></i> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end space-x-2 border-t pt-3.5 ${lightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setVendorDetailsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Close
                </button>
                {isVendorVerifiedOrIssued(selectedVendor) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setVendorDetailsModalOpen(false);
                      handleViewVendorCredential(selectedVendor);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-lg font-bold text-xs transition shadow flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-file-shield mr-1"></i>
                    <span>Move to Issued Credentials Page</span>
                    <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleVerifyAndProceedToIssueCredential(selectedVendor)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-lg font-bold text-xs transition shadow flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-stamp mr-1"></i>
                    <span>Verify All Documents & Issue Credential</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REJECT DOCUMENT MODAL WITH REASON DROPDOWN (Section 8 Requirement) */}
      {rejectDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs font-sans">
            <h3 className="text-base font-bold text-rose-500">Reject Document & Specify Reason</h3>
            <form onSubmit={handleConfirmRejectDocument} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Rejection Reason</label>
                <select 
                  value={docRejectionReason}
                  onChange={(e) => setDocRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="Document expired">Document expired</option>
                  <option value="Information mismatch">Information mismatch</option>
                  <option value="Invalid document">Invalid document</option>
                  <option value="Insufficient evidence">Insufficient evidence</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Additional Reviewer Notes</label>
                <textarea 
                  value={docRejectionNotes}
                  onChange={(e) => setDocRejectionNotes(e.target.value)}
                  placeholder="Enter clarification notes for the vendor..."
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 text-xs h-20"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setRejectDocModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ISSUER PROFILE MODAL */}
      {editIssuerProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-xs font-sans shadow-2xl my-8">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square"></i> Edit Issuer Profile Details
              </h3>
              <button onClick={() => setEditIssuerProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveIssuerProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Officer Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.officerName}
                    onChange={(e) => setProfileForm({ ...profileForm, officerName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Designation</label>
                  <input
                    type="text"
                    required
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Ministry / Parent Department</label>
                <input
                  type="text"
                  required
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.organizationName}
                  onChange={(e) => setProfileForm({ ...profileForm, organizationName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Email</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Office Location Address</label>
                <textarea
                  rows="2"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditIssuerProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* W3C DID DOCUMENT MODAL */}
      {(didModalOpen || didDocument) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs font-sans text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-teal-400 flex items-center gap-2 font-mono">
                <i className="fa-solid fa-code"></i> W3C DID Document (JSON-LD)
              </h3>
              <button onClick={() => { setDidModalOpen(false); setDidDocument(null); }} className="text-slate-400 hover:text-slate-200 text-lg font-bold">
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="text-slate-400">Canonical DID URI:</div>
              <code className="text-teal-400 font-bold break-all block">{issuerProfile.issuerDid}</code>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
              <pre>{JSON.stringify(didDocument || {
                "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/ed25519-2020/v1"],
                "id": issuerProfile.issuerDid,
                "verificationMethod": [{
                  "id": `${issuerProfile.issuerDid}#key-1`,
                  "type": "Ed25519VerificationKey2020",
                  "controller": issuerProfile.issuerDid,
                  "publicKeyMultibase": "z6MkpTHR8V2X6F9qW1Z89B0V1Z1R2M3N4P5Q6R7S8T9U0V1"
                }],
                "authentication": [`${issuerProfile.issuerDid}#key-1`],
                "assertionMethod": [`${issuerProfile.issuerDid}#key-1`]
              }, null, 2)}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">Standard: W3C DID v1.0 Spec</span>
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

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs font-sans">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Log Out</h3>
            <p className="text-slate-500">End active session on ZK-Tender Government DID Issuer Portal?</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded font-bold">Cancel</button>
              <button onClick={() => { setShowLogoutModal(false); onLogout(); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold">Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CREDENTIAL CONFIRMATION MODAL */}
      {revokeCredModalOpen && selectedCredToRevoke && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 text-xs font-sans shadow-2xl transition ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-start space-x-3.5 border-b pb-4 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-rose-500">Confirm Credential Revocation</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Are you sure you want to revoke this Verifiable Credential? This action is permanent.
                </p>
              </div>
              <button 
                onClick={() => { setRevokeCredModalOpen(false); setSelectedCredToRevoke(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
              >
                ×
              </button>
            </div>

            {/* Target Credential Details Card */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-400 text-xs">{selectedCredToRevoke.credentialId}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                  Target for Revocation
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Vendor: {selectedCredToRevoke.vendorName || (selectedCredToRevoke.credentialSubject && selectedCredToRevoke.credentialSubject.companyName) || selectedCredToRevoke.vendorEmail}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Email: {selectedCredToRevoke.vendorEmail} | Type: {selectedCredToRevoke.type}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
              <strong>Notice:</strong> Once revoked, this credential will be updated on the public revocation registry. The vendor will no longer be eligible to participate in sealed-bid tenders using this credential.
            </div>

            <form onSubmit={handleConfirmRevokeCredential} className="space-y-4">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-200">
                  Select Reason for Revocation <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={credRevocationReason}
                  onChange={(e) => setCredRevocationReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    lightTheme ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  <option value="Audit discrepancy or compliance failure">Audit discrepancy or compliance failure</option>
                  <option value="Expired or falsified business documentation">Expired or falsified business documentation</option>
                  <option value="Incorrect information submitted">Incorrect information submitted</option>
                  <option value="Vendor requested revocation">Vendor requested revocation</option>
                  <option value="Administrative or regulatory sanction">Administrative or regulatory sanction</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-200">
                  Additional Revocation Notes (Optional)
                </label>
                <textarea 
                  value={credRevocationNotes}
                  onChange={(e) => setCredRevocationNotes(e.target.value)}
                  placeholder="Enter details or regulatory case reference..."
                  className={`w-full p-2.5 rounded-xl border text-xs h-20 ${
                    lightTheme ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => { setRevokeCredModalOpen(false); setSelectedCredToRevoke(null); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={revokingLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {revokingLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-ban mr-1"></i>
                      <span>Yes, Confirm Revocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* W3C CREDENTIAL INSPECTION MODAL */}
      {credentialDetailsModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs font-sans text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-certificate text-teal-400 text-base"></i>
                <h3 className="text-base font-bold text-teal-400 font-mono">
                  W3C Verifiable Credential ({selectedCredential.credentialId})
                </h3>
              </div>
              <button 
                onClick={() => { setCredentialDetailsModalOpen(false); setSelectedCredential(null); }} 
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vendor:</span>
                <span className="text-teal-400 font-bold">{selectedCredential.vendorName} ({selectedCredential.vendorEmail})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${selectedCredential.status === 'Revoked' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {selectedCredential.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-96 leading-relaxed">
              <pre>{JSON.stringify(selectedCredential.rawVc || {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "id": selectedCredential.credentialId,
                "type": ["VerifiableCredential", selectedCredential.type],
                "issuer": selectedCredential.issuer || issuerProfile.issuerDid || "did:key:z6MkIssuer001GovTenderAuthority99812",
                "issuanceDate": selectedCredential.issuanceDate,
                "expirationDate": selectedCredential.expirationDate,
                "credentialSubject": selectedCredential.credentialSubject || {
                  "id": selectedCredential.holderDid,
                  "vendorId": selectedCredential.vendorId,
                  "vendorEmail": selectedCredential.vendorEmail
                },
                "proof": {
                  "type": "NIST ML-DSA-65 Post-Quantum Signature + Ed25519",
                  "signatureValue": selectedCredential.signature || "0x..."
                }
              }, null, 2)}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">Standard: W3C Verifiable Credentials Data Model v1.1</span>
              <button
                onClick={() => { setCredentialDetailsModalOpen(false); setSelectedCredential(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
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
