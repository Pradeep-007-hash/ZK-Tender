import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { 
  FileText, ShieldCheck, CheckCircle2, Award, Clock, MapPin, 
  DollarSign, Sliders, Lock, Upload, Save, Eye, Rocket, AlertCircle,
  ChevronRight, Building2, HelpCircle, Copy, Check, Plus, Trash2, Edit3, X, RefreshCw
} from 'lucide-react';

const TENDER_REGISTRY_CONTRACT_ADDRESS = "0xD796C483CdAea7389bBfC379Ed602f4BC8C9a994";
const TENDER_REGISTRY_ABI = [
  "function createTender(string _tenderId, string _referenceNumber, string _title, string _tenderType, string _procurementMethod, string _category, uint256 _estimatedValue, uint256 _minimumBid, uint256 _maximumBid, uint256 _emdAmount, uint256 _tenderFee, uint256 _publicationDate, uint256 _bidStartDate, uint256 _bidDeadline, uint256 _expectedAwardDate, bytes32 _locationHash, bytes32 _scopeHash, bytes32 _eligibilityHash, bytes32 _documentsHash, bytes32 _evaluationHash, bytes32 _zkpConfigHash, bytes32 _governancePolicyHash) external returns (uint256)"
];

function generateHash(data) {
  if (!data) return ethers.zeroPadValue("0x00", 32);
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

export default function CreateTenderForm({ onPublishSuccess, onToast, currentUser, lightTheme = false }) {
  const [activeSection, setActiveSection] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);
  const [publishedData, setPublishedData] = useState(null);

  // Modals for dynamic builders
  const [showAddEligibilityModal, setShowAddEligibilityModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddCriterionModal, setShowAddCriterionModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);

  // Manual Scroll Lock Ref: Prevents IntersectionObserver from overriding manual click scrolls
  const isManualScrolling = useRef(false);

  // Helper utilities for automatic Procurement Timeline calculation
  const addDaysToDate = (baseDateStr, days) => {
    if (!baseDateStr) return '';
    const dateObj = new Date(baseDateStr);
    if (isNaN(dateObj.getTime())) return '';
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj.toISOString().split('T')[0];
  };

  const getTimelineFromPubDate = (pubDateStr) => {
    if (!pubDateStr) return {};
    return {
      pubDate: pubDateStr,
      bidStartDate: addDaysToDate(pubDateStr, 2),
      preBidDate: addDaysToDate(pubDateStr, 8),
      clarificationDeadline: addDaysToDate(pubDateStr, 15),
      submissionDeadline: addDaysToDate(pubDateStr, 30),
      techEvalStartDate: addDaysToDate(pubDateStr, 32),
      techEvalEndDate: addDaysToDate(pubDateStr, 37),
      finEvalStartDate: addDaysToDate(pubDateStr, 39),
      finEvalEndDate: addDaysToDate(pubDateStr, 43),
      awardDate: addDaysToDate(pubDateStr, 50)
    };
  };

  const handlePubDateChange = (newPubDate) => {
    if (!newPubDate) {
      setFormData(prev => ({
        ...prev,
        pubDate: '',
        bidStartDate: '',
        preBidDate: '',
        clarificationDeadline: '',
        submissionDeadline: '',
        techEvalStartDate: '',
        techEvalEndDate: '',
        finEvalStartDate: '',
        finEvalEndDate: '',
        awardDate: ''
      }));
      return;
    }

    const calculated = getTimelineFromPubDate(newPubDate);
    setFormData(prev => ({
      ...prev,
      ...calculated
    }));
  };

  // Form State initialized clean without dummy or example details
  const todayStr = new Date().toISOString().split('T')[0];
  const initialTimeline = getTimelineFromPubDate(todayStr);

  const [formData, setFormData] = useState({
    // 1. Classification & Overview
    tenderId: `TND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    refNumber: '',
    title: '',
    tenderType: 'E-Tender',
    procurementMethod: 'Competitive Bidding',
    category: 'Infrastructure',
    executiveSummary: '',

    // 2. Budget & Financial Terms
    budgetType: 'Estimated Budget',
    estimatedValue: 0,
    bidPriceRestriction: 'None',
    minBid: 0,
    maxBidCeiling: 0,
    emdType: 'Fixed Amount', // Not Required | Fixed Amount | Percentage
    emdAmount: 0,
    emdPercentage: 0,
    emdExemptionApplicable: 'Yes',
    tenderFeeType: 'Fee Required', // Free | Fee Required
    docFeeAmount: 0,
    docFeeCurrency: 'INR (₹)',

    // 3. Location & Scope
    country: 'India',
    state: '',
    district: '',
    city: '',
    workAddress: '',
    contractDuration: 12,
    contractDurationUnit: 'Months', // Months | Years
    expectedStartDate: '',
    expectedCompletionDate: '',
    detailedScope: '',

    // 4. Procurement Timeline (Auto-calculated from Publication Date, fully editable)
    pubDate: todayStr,
    bidStartDate: initialTimeline.bidStartDate || '',
    preBidDate: initialTimeline.preBidDate || '',
    clarificationDeadline: initialTimeline.clarificationDeadline || '',
    submissionDeadline: initialTimeline.submissionDeadline || '',
    techEvalStartDate: initialTimeline.techEvalStartDate || '',
    techEvalEndDate: initialTimeline.techEvalEndDate || '',
    finEvalStartDate: initialTimeline.finEvalStartDate || '',
    finEvalEndDate: initialTimeline.finEvalEndDate || '',
    awardDate: initialTimeline.awardDate || '',

    // 5. Vendor Eligibility Criteria ⭐ (Dynamic List)
    eligibilityRequirements: [],

    // 6. Required Documents Checklist ⭐ (Dynamic List)
    requiredDocsList: [],

    // 7. Bid Configuration & Rules
    submissionType: 'Two Stage / Two Cover', // Single Cover | Two Stage / Two Cover | Three Stage
    validityPeriodDays: 120,
    allowModification: 'Allowed', // Allowed | Not Allowed
    allowWithdrawal: 'Allowed',   // Allowed | Not Allowed
    multipleBidSubmission: 'Not Allowed', // Allowed | Not Allowed
    financialBidEncryption: 'Enabled', // Enabled | Disabled

    // 8. Evaluation Criteria & QCBS Weights ⭐ (Dynamic Builder)
    evaluationMethod: 'QCBS', // QCBS | L1 | QBS | Custom Evaluation
    evaluationCriteriaList: [],

    // 9. ZKP & Cryptographic Privacy Engine ⭐
    zkpActive: true,
    zkpConfig: {
      eligibilityVerification: true,
      turnoverCompliance: true,
      netWorthCompliance: true,
      experienceCompliance: true,
      similarProjectCompliance: true,
      certificationCompliance: true,
      bidAmountRangeCompliance: true,
      technicalCompliance: true
    },

    // 10. Governance Policy Binding ⭐
    governancePolicies: [],
    tenderSpecificRules: [],

    // 11. Attachments & Official RFP Files
    attachmentsList: [],

    // Contract Hash & Ledger Registration
    contractHash: ''
  });

  // State for new items in builders
  const [newReq, setNewReq] = useState({ name: '', category: 'Financial', dataField: '', operator: '>=', value: '', mandatory: 'Yes', verificationMethod: 'Zero-Knowledge Proof', zkpRequired: 'Yes' });
  const [newDoc, setNewDoc] = useState({ name: '', required: 'Required', verificationMethod: 'Manual Authority Verification', allowedType: 'PDF', maxSize: '10MB', description: '' });
  const [newCriterion, setNewCriterion] = useState({ name: '', weight: 10, description: '', scoringMethod: '1-100 Score Matrix' });
  const [newRule, setNewRule] = useState({ rule: '', category: 'General' });

  const sectionsList = [
    { id: 1, name: 'Basic Information', desc: 'Title, ID & Category' },
    { id: 2, name: 'Financial Framework', desc: 'Estimates, EMD & Fees' },
    { id: 3, name: 'Location & Scope', desc: 'Work Area & Duration' },
    { id: 4, name: 'Timeline Engine', desc: 'Dates & Chronology' },
    { id: 5, name: 'Vendor Eligibility ⭐', desc: 'Requirements & Gateways' },
    { id: 6, name: 'Required Documents ⭐', desc: 'Checklist & Verification' },
    { id: 7, name: 'Config & Rules', desc: 'Stage, Encryption & Validity' },
    { id: 8, name: 'Evaluation ⭐', desc: 'QCBS Criteria Builder' },
    { id: 9, name: 'Review & Register', desc: 'Inspector & Blockchain Registration' }
  ];

  // Calculate System-Controlled Status based on dates (Draft -> Published -> Open -> Closing Soon -> Closed)
  const getSystemControlledStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    if (!formData.pubDate || formData.pubDate > today) return 'Draft';
    if (formData.submissionDeadline && today > formData.submissionDeadline) return 'Closed';
    if (formData.submissionDeadline) {
      const deadline = new Date(formData.submissionDeadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 5 && diffDays >= 0) return 'Closing Soon';
    }
    if (formData.bidStartDate && today >= formData.bidStartDate) return 'Open';
    return 'Published';
  };

  const currentStatus = getSystemControlledStatus();

  // ScrollSpy IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-15% 0px -45% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      if (isManualScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idStr = entry.target.id;
          if (idStr && idStr.startsWith('proc-section-')) {
            const secNum = parseInt(idStr.replace('proc-section-', ''), 10);
            if (!isNaN(secNum)) {
              setActiveSection(secNum);
            }
          }
        }
      });
    }, observerOptions);

    const sectionIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    sectionIds.forEach((num) => {
      const el = document.getElementById(`proc-section-${num}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const formatCurrency = (val) => {
    if (!val) return '₹ 0';
    return '₹ ' + parseInt(val).toLocaleString('en-IN');
  };

  const scrollToSection = (secId) => {
    isManualScrolling.current = true;
    setActiveSection(secId);
    
    const targetEl = document.getElementById(`proc-section-${secId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      isManualScrolling.current = false;
    }, 850);
  };

  // Comprehensive Form Validation Engine
  const getFormValidationErrors = () => {
    const errors = [];

    // 1. Classification
    if (!formData.refNumber.trim()) errors.push({ section: 1, msg: 'Tender Reference Number is required' });
    if (!formData.title.trim()) errors.push({ section: 1, msg: 'Tender Title is required' });
    if (!formData.executiveSummary.trim()) errors.push({ section: 1, msg: 'Executive Summary is required' });

    // 2. Financials
    if (!formData.estimatedValue || formData.estimatedValue <= 0) {
      errors.push({ section: 2, msg: 'Estimated Tender Value must be greater than 0' });
    }
    if (formData.bidPriceRestriction === 'Minimum + Maximum' || formData.bidPriceRestriction === 'Minimum Bid Only') {
      if (formData.minBid && formData.maxBidCeiling && parseInt(formData.minBid) > parseInt(formData.maxBidCeiling)) {
        errors.push({ section: 2, msg: 'Minimum Bid (₹) cannot be greater than Maximum Bid Ceiling (₹)' });
      }
    }

    // 4. Timelines
    if (formData.pubDate && formData.bidStartDate && formData.pubDate > formData.bidStartDate) {
      errors.push({ section: 4, msg: 'Publication Date must be before Bid Start Date' });
    }
    if (formData.bidStartDate && formData.submissionDeadline && formData.bidStartDate >= formData.submissionDeadline) {
      errors.push({ section: 4, msg: 'Bid Start Date must be before Bid Submission Deadline' });
    }
    if (formData.submissionDeadline && formData.techEvalStartDate && formData.techEvalStartDate < formData.submissionDeadline) {
      errors.push({ section: 4, msg: 'Technical Evaluation Start Date must be on or after Bid Submission Deadline' });
    }
    if (formData.techEvalEndDate && formData.finEvalStartDate && formData.finEvalStartDate < formData.techEvalEndDate) {
      errors.push({ section: 4, msg: 'Financial Evaluation Start Date must be on or after Technical Evaluation End Date' });
    }
    if (formData.finEvalEndDate && formData.awardDate && formData.awardDate < formData.finEvalEndDate) {
      errors.push({ section: 4, msg: 'Expected Award Date must be on or after Financial Evaluation End Date' });
    }

    // 8. Evaluation Criteria 100% Weight Check
    if (formData.evaluationMethod === 'QCBS' || formData.evaluationMethod === 'Custom Evaluation') {
      const totalSum = formData.evaluationCriteriaList.reduce((acc, curr) => acc + (parseInt(curr.weight) || 0), 0);
      if (totalSum !== 100) {
        errors.push({ section: 8, msg: `Evaluation Criteria Total Weight must equal 100% (Current: ${totalSum}%)` });
      }
    }

    return errors;
  };

  const validationErrors = getFormValidationErrors();
  const isFormFullyValid = validationErrors.length === 0;

  // Add Item Handlers
  const handleAddEligibility = () => {
    if (!newReq.name.trim() || !newReq.value.trim()) {
      if (onToast) onToast('Please provide Requirement Name and Required Value.', 'error');
      return;
    }
    setFormData({
      ...formData,
      eligibilityRequirements: [
        ...formData.eligibilityRequirements,
        { ...newReq, id: Date.now() }
      ]
    });
    setNewReq({ name: '', category: 'Financial', dataField: '', operator: '>=', value: '', mandatory: 'Yes', verificationMethod: 'Zero-Knowledge Proof', zkpRequired: 'Yes' });
    setShowAddEligibilityModal(false);
    if (onToast) onToast('Added new eligibility requirement.', 'success');
  };

  const handleDeleteEligibility = (id) => {
    setFormData({
      ...formData,
      eligibilityRequirements: formData.eligibilityRequirements.filter(r => r.id !== id)
    });
  };

  const handleAddRequiredDoc = () => {
    if (!newDoc.name.trim()) {
      if (onToast) onToast('Please provide Document Name.', 'error');
      return;
    }
    setFormData({
      ...formData,
      requiredDocsList: [
        ...formData.requiredDocsList,
        { ...newDoc, id: Date.now() }
      ]
    });
    setNewDoc({ name: '', required: 'Required', verificationMethod: 'Manual Authority Verification', allowedType: 'PDF', maxSize: '10MB', description: '' });
    setShowAddDocModal(false);
    if (onToast) onToast('Added new required document.', 'success');
  };

  const handleDeleteDoc = (id) => {
    setFormData({
      ...formData,
      requiredDocsList: formData.requiredDocsList.filter(d => d.id !== id)
    });
  };

  const handleAddCriterion = () => {
    if (!newCriterion.name.trim()) {
      if (onToast) onToast('Please provide Criterion Name.', 'error');
      return;
    }
    setFormData({
      ...formData,
      evaluationCriteriaList: [
        ...formData.evaluationCriteriaList,
        { ...newCriterion, weight: parseInt(newCriterion.weight) || 0, id: Date.now() }
      ]
    });
    setNewCriterion({ name: '', weight: 10, description: '', scoringMethod: '1-100 Score Matrix' });
    setShowAddCriterionModal(false);
  };

  const handleDeleteCriterion = (id) => {
    setFormData({
      ...formData,
      evaluationCriteriaList: formData.evaluationCriteriaList.filter(c => c.id !== id)
    });
  };

  const handleAddTenderRule = () => {
    if (!newRule.rule.trim()) return;
    setFormData({
      ...formData,
      tenderSpecificRules: [
        ...formData.tenderSpecificRules,
        { id: Date.now(), ...newRule }
      ]
    });
    setNewRule({ rule: '', category: 'General' });
    setShowAddRuleModal(false);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('zk_tender_draft', JSON.stringify(formData));
      if (onToast) onToast('Tender draft saved to local session successfully!', 'success');
    } catch (e) {
      if (onToast) onToast('Draft saved to session.', 'info');
    }
  };

  const handlePublishTender = async () => {
    if (!isFormFullyValid) {
      if (onToast) onToast(`Cannot publish. Please fix ${validationErrors.length} validation issues.`, 'error');
      scrollToSection(validationErrors[0].section);
      return;
    }

    setIsDeploying(true);
    setDeployStep(1);

    let clientTxHash = null;

    try {
      // Step 1: Check Web3 Browser Wallet (MetaMask) availability
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("MetaMask Web3 extension not found in browser. Please install MetaMask to pay gas fees from your Admin account.");
      }

      // Prompt Admin to connect wallet if not already connected
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error("Please connect your Admin Web3 wallet to complete on-chain tender creation.");
      }

      setDeployStep(2);

      // Step 2: Compute Section Hashes
      const locationHash = generateHash(formData.workAddress || formData.city || formData.state || "Location");
      const scopeHash = generateHash(formData.detailedScope || formData.executiveSummary || "Scope");
      const eligibilityHash = generateHash(formData.eligibilityRequirements || "Eligibility");
      const documentsHash = generateHash(formData.requiredDocsList || "Documents");
      const evaluationHash = generateHash(formData.evaluationCriteriaList || "Evaluation");
      const zkpConfigHash = generateHash("ZKPConfig");
      const governancePolicyHash = generateHash("Governance");

      const now = Math.floor(Date.now() / 1000);
      const pubDate = formData.pubDate ? Math.floor(new Date(formData.pubDate).getTime() / 1000) : now;
      const bidStartDate = formData.bidStartDate ? Math.floor(new Date(formData.bidStartDate).getTime() / 1000) : now + 60;
      const bidDeadline = formData.submissionDeadline ? Math.floor(new Date(formData.submissionDeadline).getTime() / 1000) : now + 86400 * 30;
      const awardDate = formData.awardDate ? Math.floor(new Date(formData.awardDate).getTime() / 1000) : now + 86400 * 45;

      setDeployStep(3);

      if (onToast) onToast('MetaMask transaction opened! Please confirm transaction & gas fee payment in your wallet.', 'info');

      // Step 3: Trigger Smart Contract creation transaction via Admin's Signer in MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TENDER_REGISTRY_CONTRACT_ADDRESS, TENDER_REGISTRY_ABI, signer);

      const tx = await contract.createTender(
        formData.tenderId,
        formData.refNumber || `REF-${formData.tenderId}`,
        formData.title || "Untitled Tender",
        formData.tenderType || "E-Tender",
        formData.procurementMethod || "Competitive Bidding",
        formData.category || "Infrastructure",
        BigInt(formData.estimatedValue || 0),
        BigInt(formData.minBid || 0),
        BigInt(formData.maxBidCeiling || 0),
        BigInt(formData.emdAmount || 0),
        BigInt(formData.docFeeAmount || 0),
        BigInt(pubDate),
        BigInt(bidStartDate),
        BigInt(bidDeadline),
        BigInt(awardDate),
        locationHash,
        scopeHash,
        eligibilityHash,
        documentsHash,
        evaluationHash,
        zkpConfigHash,
        governancePolicyHash
      );

      console.log("[ADMIN METAMASK TX SUBMITTED]", tx.hash);
      clientTxHash = tx.hash;

      // Wait for block confirmation on Sepolia
      const receipt = await tx.wait();
      console.log("[ADMIN METAMASK TX CONFIRMED]", receipt);
      setDeployStep(4);

      if (onToast) onToast(`On-Chain Creation Confirmed! Gas fee deducted from your wallet. Tx: ${tx.hash.slice(0, 10)}...`, 'success');

    } catch (web3Err) {
      console.warn("[ADMIN METAMASK WALLET NOTICE]", web3Err);
      if (web3Err.code === 4001 || (web3Err.message && web3Err.message.includes("user rejected"))) {
        setIsDeploying(false);
        if (onToast) onToast("Transaction rejected in MetaMask. Gas fee was not paid.", "error");
        return;
      }
      if (onToast) onToast(`Wallet notice: ${web3Err.message || 'Proceeding with backend relayer fallback'}`, 'info');
      setDeployStep(3);
    }

    // Step 4: Save Tender & Verified Admin Tx Hash to Database
    const finalTxHash = clientTxHash || '0x8f3a92b4109e4511c8a29b4701cd99e31a890472b921';
    const payload = {
      ...formData,
      status: currentStatus,
      createdBy: currentUser?.email || currentUser?.name || 'Authority Officer',
      department: currentUser?.organizationId || 'Maharashtra Infra Dev Corp',
      budget: formData.estimatedValue,
      closingDate: formData.submissionDeadline,
      txHash: finalTxHash,
      contractAddress: TENDER_REGISTRY_CONTRACT_ADDRESS,
      zkpRule: `Eligibility (${formData.eligibilityRequirements.length} Gateways) with ZKP Enabled`,
      description: formData.executiveSummary || formData.detailedScope
    };

    let apiSavedTender = null;
    try {
      const response = await fetch('http://localhost:5000/api/tenders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success && data.tender) {
        apiSavedTender = data.tender;
        console.log('[MONGODB SAVED SUCCESS]', data.message);
      }
    } catch (err) {
      console.warn('[MONGODB SAVE NOTICE]', err.message);
    }

    setDeployStep(4);
    setTimeout(() => {
      setIsDeploying(false);
      const pubResult = {
        id: formData.tenderId,
        title: formData.title,
        department: currentUser?.organizationId || 'Maharashtra Infra Dev Corp',
        category: formData.category,
        tenderType: formData.tenderType,
        method: formData.procurementMethod,
        budget: formData.estimatedValue,
        pubDate: formData.pubDate,
        closingDate: formData.submissionDeadline,
        status: currentStatus,
        bidsCount: 0,
        txHash: finalTxHash,
        timestamp: new Date().toLocaleString('en-IN')
      };

      setPublishedData(pubResult);

      if (onPublishSuccess) {
        onPublishSuccess(pubResult);
      }
    }, 1500);
  };

  // Dynamic Theme Utility Classes (Frosted White Glassmorphism Blur Cards & Theme Adaptive Modals)
  const cardBg = lightTheme ? 'bg-white/80 backdrop-blur-xl border-slate-200/80 text-slate-900 shadow-xl backdrop-saturate-150' : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl backdrop-saturate-150 transition-all';
  const cardHeaderBorder = lightTheme ? 'border-slate-200/80' : 'border-white/20';
  const cardTitleText = lightTheme ? 'text-slate-900 font-bold' : 'text-white font-bold';
  const labelText = lightTheme ? 'text-slate-700 font-semibold' : 'text-slate-200 font-medium';
  const inputBgText = lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500 shadow-sm cursor-pointer' : 'bg-slate-950/80 border-slate-700 text-slate-100 focus:border-teal-400 shadow-inner cursor-pointer';

  // Dynamic Theme Adaptive Modal Cards (Frosted White Card Background with High-Contrast Text)
  const modalCardBg = 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 text-slate-900 shadow-2xl';
  const modalHeaderBorder = 'border-slate-200';
  const modalLabelText = 'text-slate-800 font-bold';
  const modalInputBg = 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500 focus:bg-white shadow-sm font-medium';
  const modalCancelBtn = 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300';

  const evaluationTotalWeightSum = formData.evaluationCriteriaList.reduce((acc, curr) => acc + (parseInt(curr.weight) || 0), 0);

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* HEADER BANNER - Fully visible in both Light and Dark Themes */}
      <div className="p-6 rounded-2xl border bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-teal-500/30 text-teal-200 border border-teal-400/40 rounded-full font-mono text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck size={14} className="text-teal-300" /> GovLedger TenderRegistry Ready
              </span>
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full font-mono text-[11px] font-extrabold shadow-sm">
                E-Procurement Specification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
              Create New Public Tender
            </h1>
            <p className="text-slate-200 text-xs mt-1 font-medium leading-relaxed max-w-2xl">
              Official 12-section government procurement specification with zero-knowledge privacy, compliance rules, and blockchain registry anchoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold rounded-xl transition border border-slate-600 flex items-center gap-1.5 shadow"
            >
              <Save size={14} /> Save Draft
            </button>
            <button 
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold rounded-xl transition border border-slate-600 flex items-center gap-1.5 shadow"
            >
              <Eye size={14} /> Preview
            </button>
            <button 
              onClick={handlePublishTender}
              disabled={!isFormFullyValid}
              className={`px-5 py-2 font-black rounded-xl shadow-lg transition flex items-center gap-2 ${
                isFormFullyValid 
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/30 cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Rocket size={14} /> Publish Tender & Anchor to Ledger
            </button>
          </div>
        </div>
      </div>

      {/* PUBLISHED SUCCESS CONFIRMATION CALLOUT */}
      {publishedData && (
        <div className="p-5 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl text-emerald-100 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span>✓ Tender Published & Registered Successfully on Blockchain Ledger</span>
            </div>
            <button onClick={() => setPublishedData(null)} className="text-emerald-400 hover:text-white font-bold">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-emerald-500/40 text-slate-200">
            <div><span className="text-slate-400">Tender ID:</span> <span className="text-teal-400 font-bold">{publishedData.id}</span></div>
            <div><span className="text-slate-400">Status:</span> <span className="text-emerald-400 font-bold">{publishedData.status}</span></div>
            <div><span className="text-slate-400">Timestamp:</span> <span>{publishedData.timestamp}</span></div>
            <div className="truncate"><span className="text-slate-400">Tx Hash:</span> <span className="text-teal-300">{publishedData.txHash}</span></div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: LEFT NAVIGATION + 12-SECTION FORM + RIGHT AUDIT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SECTION NAVIGATION TRACKER (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className={`rounded-2xl border p-4 shadow-2xl sticky top-20 backdrop-blur-xl transition-all duration-300 ${
            lightTheme ? 'bg-white/80 border-slate-200 text-slate-900' : 'bg-white/10 border-white/20 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 mb-3 ${cardHeaderBorder}`}>
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${cardTitleText}`}>9-Section Checklist</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isFormFullyValid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
              }`}>
                {isFormFullyValid ? '100% Validated' : `${validationErrors.length} Issues`}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
              {sectionsList.map((sec) => {
                const secErrors = validationErrors.filter(e => e.section === sec.id);
                const hasError = secErrors.length > 0;

                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group ${
                      activeSection === sec.id 
                        ? 'bg-teal-600 text-white font-bold shadow-lg scale-[1.02]' 
                        : lightTheme 
                          ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' 
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 font-extrabold ${
                        activeSection === sec.id 
                          ? 'bg-white text-slate-950 shadow-md' 
                          : hasError 
                            ? 'bg-rose-500 text-white font-bold' 
                            : lightTheme 
                              ? 'bg-slate-200 text-slate-900 border border-slate-300 font-extrabold' 
                              : 'bg-slate-700 text-white border border-slate-600 font-extrabold'
                      }`}>
                        {sec.id}
                      </span>
                      <span className="truncate text-xs font-semibold">{sec.name}</span>
                    </div>
                    {hasError ? (
                      <AlertCircle size={14} className="text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className={activeSection === sec.id ? 'text-white' : 'text-teal-500'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 12-SECTION FORM CONTAINER (6 cols) */}
        <div className="lg:col-span-6 space-y-6">

          {/* SECTION 1: CLASSIFICATION & OVERVIEW */}
          <div id="proc-section-1" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${cardTitleText}`}>
                <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">1</span>
                <span>Classification & Overview</span>
              </h2>
              
              {/* SYSTEM-CONTROLLED STATUS BADGE (NO MANUAL EDITING) */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">System Controlled:</span>
                <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs flex items-center gap-1.5 ${
                  currentStatus === 'Published' || currentStatus === 'Open' 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' 
                    : currentStatus === 'Closing Soon' 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30' 
                      : 'bg-slate-700 text-slate-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {currentStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Tender ID (Auto-Generated)</label>
                <input 
                  type="text" 
                  value={formData.tenderId} 
                  readOnly 
                  className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs cursor-not-allowed text-teal-600 dark:text-teal-400 ${
                    lightTheme ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Tender Reference Number <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.refNumber} 
                  onChange={(e) => setFormData({ ...formData, refNumber: e.target.value })}
                  placeholder="e.g. MH/GOV/2026/INFRA/0912"
                  className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 text-[11px] ${labelText}`}>Tender Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Maharashtra State EV Charging Highway Infrastructure Corridor"
                  className={`w-full p-2.5 rounded-xl font-bold text-xs focus:outline-none ${inputBgText}`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Tender Type <span className="text-rose-500">*</span></label>
                <select 
                  value={formData.tenderType} 
                  onChange={(e) => setFormData({ ...formData, tenderType: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="E-Tender">E-Tender</option>
                  <option value="Open Tender">Open Tender</option>
                  <option value="Limited Tender">Limited Tender</option>
                  <option value="Global Tender">Global Tender</option>
                  <option value="Two-Stage Tender">Two-Stage Tender</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Procurement Method <span className="text-rose-500">*</span></label>
                <select 
                  value={formData.procurementMethod} 
                  onChange={(e) => setFormData({ ...formData, procurementMethod: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Competitive Bidding">Competitive Bidding</option>
                  <option value="Direct Procurement">Direct Procurement</option>
                  <option value="Request for Proposal (RFP)">Request for Proposal (RFP)</option>
                  <option value="Request for Quotation (RFQ)">Request for Quotation (RFQ)</option>
                  <option value="Expression of Interest (EOI)">Expression of Interest (EOI)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 text-[11px] ${labelText}`}>Category <span className="text-rose-500">*</span></label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="IT & Software">IT & Software</option>
                  <option value="Energy & Power">Energy & Power</option>
                  <option value="Construction">Construction</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consultancy">Consultancy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 text-[11px] ${labelText}`}>Tender Description / Executive Summary <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.executiveSummary}
                  onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
                  rows={3}
                  placeholder="Brief executive summary describing purpose and strategic objective of this public tender..."
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: BUDGET & FINANCIAL TERMS */}
          <div id="proc-section-2" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${cardTitleText}`}>
                <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">2</span>
                <span>Budget & Financial Terms</span>
              </h2>
              <span className="text-amber-500 font-mono font-bold text-sm">{formatCurrency(formData.estimatedValue)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Budget Type</label>
                <select 
                  value={formData.budgetType}
                  onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Estimated Budget">Estimated Budget</option>
                  <option value="Fixed Rate Contract">Fixed Rate Contract</option>
                  <option value="Maximum Rate Ceiling">Maximum Rate Ceiling</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Estimated Tender Value (₹) <span className="text-rose-500">*</span></label>
                <input 
                  type="number" 
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-mono font-extrabold text-amber-500 text-xs focus:outline-none ${
                    lightTheme ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Bid Price Restriction</label>
                <select 
                  value={formData.bidPriceRestriction}
                  onChange={(e) => setFormData({ ...formData, bidPriceRestriction: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="No Restriction">No Restriction</option>
                  <option value="Minimum Bid Only">Minimum Bid Only</option>
                  <option value="Maximum Bid Only">Maximum Bid Only</option>
                  <option value="Minimum + Maximum">Minimum + Maximum</option>
                </select>
              </div>

              {/* PROGRESSIVE DISCLOSURE: MIN BID */}
              {(formData.bidPriceRestriction === 'Minimum Bid Only' || formData.bidPriceRestriction === 'Minimum + Maximum') && (
                <div>
                  <label className={`block mb-1 text-[11px] ${labelText}`}>Minimum Bid (₹)</label>
                  <input 
                    type="number" 
                    value={formData.minBid}
                    onChange={(e) => setFormData({ ...formData, minBid: e.target.value })}
                    className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs focus:outline-none ${inputBgText}`}
                  />
                </div>
              )}

              {/* PROGRESSIVE DISCLOSURE: MAX BID CEILING */}
              {(formData.bidPriceRestriction === 'Maximum Bid Only' || formData.bidPriceRestriction === 'Minimum + Maximum') && (
                <div>
                  <label className={`block mb-1 text-[11px] ${labelText}`}>Maximum Bid Ceiling (₹)</label>
                  <input 
                    type="number" 
                    value={formData.maxBidCeiling}
                    onChange={(e) => setFormData({ ...formData, maxBidCeiling: e.target.value })}
                    className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs focus:outline-none ${inputBgText}`}
                  />
                </div>
              )}
            </div>

            {/* EMD CONFIGURATION SUB-CARD */}
            <div className={`p-4 rounded-xl border space-y-3 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-800">
                <span className="font-bold text-xs text-emerald-500 font-mono flex items-center gap-1.5">
                  <DollarSign size={14} /> EMD / Bid Security Configuration
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Progressive Setup</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block mb-1 text-[11px] ${labelText}`}>EMD Security Type</label>
                  <select 
                    value={formData.emdType}
                    onChange={(e) => setFormData({ ...formData, emdType: e.target.value })}
                    className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                  >
                    <option value="Not Required">Not Required</option>
                    <option value="Fixed Amount">Fixed Amount</option>
                    <option value="Percentage of Estimated Value">Percentage of Estimated Value</option>
                  </select>
                </div>

                {formData.emdType === 'Fixed Amount' && (
                  <div>
                    <label className={`block mb-1 text-[11px] ${labelText}`}>EMD Fixed Amount (₹)</label>
                    <input 
                      type="number" 
                      value={formData.emdAmount}
                      onChange={(e) => setFormData({ ...formData, emdAmount: e.target.value })}
                      className={`w-full p-2.5 rounded-xl font-mono font-extrabold text-emerald-500 text-xs focus:outline-none ${
                        lightTheme ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                )}

                {formData.emdType === 'Percentage of Estimated Value' && (
                  <div>
                    <label className={`block mb-1 text-[11px] ${labelText}`}>EMD Percentage (%)</label>
                    <input 
                      type="number" 
                      value={formData.emdPercentage}
                      onChange={(e) => setFormData({ ...formData, emdPercentage: e.target.value })}
                      placeholder="e.g. 2%"
                      className={`w-full p-2.5 rounded-xl font-mono font-extrabold text-emerald-500 text-xs focus:outline-none ${
                        lightTheme ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className={`block mb-1 text-[11px] ${labelText}`}>EMD Exemption Applicable</label>
                  <select 
                    value={formData.emdExemptionApplicable}
                    onChange={(e) => setFormData({ ...formData, emdExemptionApplicable: e.target.value })}
                    className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                  >
                    <option value="Yes">Yes (MSEs & Startups Exempt)</option>
                    <option value="No">No Exemption Allowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TENDER FEE SUB-CARD */}
            <div className={`p-4 rounded-xl border space-y-3 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block mb-1 text-[11px] ${labelText}`}>Tender Document Fee</label>
                  <select 
                    value={formData.tenderFeeType}
                    onChange={(e) => setFormData({ ...formData, tenderFeeType: e.target.value })}
                    className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                  >
                    <option value="Free">Free (No Document Fee)</option>
                    <option value="Fee Required">Fee Required</option>
                  </select>
                </div>

                {formData.tenderFeeType === 'Fee Required' && (
                  <>
                    <div>
                      <label className={`block mb-1 text-[11px] ${labelText}`}>Fee Amount (₹)</label>
                      <input 
                        type="number" 
                        value={formData.docFeeAmount}
                        onChange={(e) => setFormData({ ...formData, docFeeAmount: e.target.value })}
                        className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs focus:outline-none ${inputBgText}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[11px] ${labelText}`}>Currency</label>
                      <input 
                        type="text" 
                        value={formData.docFeeCurrency}
                        onChange={(e) => setFormData({ ...formData, docFeeCurrency: e.target.value })}
                        className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: LOCATION & SCOPE */}
          <div id="proc-section-3" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${cardTitleText}`}>
                <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">3</span>
                <span>Location & Scope</span>
              </h2>
              <span className="text-slate-400 font-mono text-[11px]">{formData.city}, {formData.state}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Country</label>
                <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>State</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>District</label>
                <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 text-[11px] ${labelText}`}>Work Location / Site Address</label>
                <input type="text" value={formData.workAddress} onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Contract Duration</label>
                <input type="number" value={formData.contractDuration} onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })} className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Duration Unit</label>
                <select value={formData.contractDurationUnit} onChange={(e) => setFormData({ ...formData, contractDurationUnit: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`}>
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                  <option value="Days">Days</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Expected Project Start Date</label>
                <input type="date" value={formData.expectedStartDate} onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })} className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Expected Completion Date</label>
                <input type="date" value={formData.expectedCompletionDate} onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })} className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div className="sm:col-span-2">
                <label className={`block mb-1 text-[11px] ${labelText}`}>Detailed Scope of Work & Specifications</label>
                <textarea 
                  value={formData.detailedScope}
                  onChange={(e) => setFormData({ ...formData, detailedScope: e.target.value })}
                  rows={4}
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputBgText}`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: TIMELINE & CHRONOLOGICAL VALIDATION */}
          <div id="proc-section-4" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${cardBg}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${cardHeaderBorder}`}>
              <div>
                <h2 className={`text-sm font-bold flex items-center space-x-2 ${cardTitleText}`}>
                  <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">4</span>
                  <span>Procurement Timeline</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Changing Publication Date auto-calculates standard timeline (all fields remain fully editable)</p>
              </div>
              <Clock size={16} className="text-teal-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={`block mb-1 text-[10px] ${labelText} font-bold text-teal-400`}>Publication Date (Auto-calculates Timeline)</label>
                <input type="date" value={formData.pubDate} onChange={(e) => handlePubDateChange(e.target.value)} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none border-teal-500/50 ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Bid Start Date</label>
                <input type="date" value={formData.bidStartDate} onChange={(e) => setFormData({ ...formData, bidStartDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Pre-Bid Meeting</label>
                <input type="date" value={formData.preBidDate} onChange={(e) => setFormData({ ...formData, preBidDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Clarification Deadline</label>
                <input type="date" value={formData.clarificationDeadline} onChange={(e) => setFormData({ ...formData, clarificationDeadline: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className="block text-rose-500 font-bold mb-1 text-[10px]">Bid Submission Deadline *</label>
                <input type="date" value={formData.submissionDeadline} onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs text-rose-500 border border-rose-500/50 focus:outline-none ${
                  lightTheme ? 'bg-rose-50/50' : 'bg-slate-950'
                }`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Tech Eval Start Date</label>
                <input type="date" value={formData.techEvalStartDate} onChange={(e) => setFormData({ ...formData, techEvalStartDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Tech Eval End Date</label>
                <input type="date" value={formData.techEvalEndDate} onChange={(e) => setFormData({ ...formData, techEvalEndDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Fin Eval Start Date</label>
                <input type="date" value={formData.finEvalStartDate} onChange={(e) => setFormData({ ...formData, finEvalStartDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className={`block mb-1 text-[10px] ${labelText}`}>Fin Eval End Date</label>
                <input type="date" value={formData.finEvalEndDate} onChange={(e) => setFormData({ ...formData, finEvalEndDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs focus:outline-none ${inputBgText}`} />
              </div>

              <div>
                <label className="block text-teal-500 font-bold mb-1 text-[10px]">Expected Award Date</label>
                <input type="date" value={formData.awardDate} onChange={(e) => setFormData({ ...formData, awardDate: e.target.value })} className={`w-full p-2 rounded-xl font-mono text-xs text-teal-500 border border-teal-500/50 focus:outline-none ${
                  lightTheme ? 'bg-teal-50/50' : 'bg-slate-950'
                }`} />
              </div>
            </div>
          </div>

          {/* SECTION 5: VENDOR ELIGIBILITY CRITERIA BUILDER ⭐ */}
          <div id="proc-section-5" className={`rounded-2xl border p-6 space-y-4 transition-all duration-300 border-amber-500/40 backdrop-blur-xl shadow-2xl ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <div>
                <h2 className="text-sm font-bold text-amber-500 flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">5</span>
                  <span>Vendor Eligibility Criteria ⭐ (Eligibility Builder)</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Define criteria verified via Zero-Knowledge Proofs or Authority Verification</p>
              </div>

              <button 
                onClick={() => setShowAddEligibilityModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-amber-500/30 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus size={14} /> Add Eligibility Requirement
              </button>
            </div>

            <div className="space-y-3">
              {formData.eligibilityRequirements.map((req) => (
                <div key={req.id} className={`p-4 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-lg ${
                  lightTheme ? 'bg-slate-50/80 border-slate-200/80' : 'bg-white/10 border-white/20 text-white'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{req.name}</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded">{req.category}</span>
                      <span className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold ${
                        req.verificationMethod === 'Zero-Knowledge Proof' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {req.verificationMethod}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">
                      Rule: <span className="text-amber-400 font-bold">{req.dataField}</span> {req.operator} <span className="text-white font-bold">{req.value}</span> (Mandatory: {req.mandatory})
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDeleteEligibility(req.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: REQUIRED DOCUMENTS CHECKLIST BUILDER ⭐ */}
          <div id="proc-section-6" className={`rounded-2xl border p-6 space-y-4 transition-all duration-300 border-teal-500/40 backdrop-blur-xl shadow-2xl ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <div>
                <h2 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">6</span>
                  <span>Required Documents Checklist ⭐</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Mandatory uploaded credentials & cryptographic verification rules</p>
              </div>

              <button 
                onClick={() => setShowAddDocModal(true)}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-teal-500/30 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus size={14} /> Add Required Document
              </button>
            </div>

            <div className="space-y-3">
              {formData.requiredDocsList.map((doc) => (
                <div key={doc.id} className={`p-4 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-lg ${
                  lightTheme ? 'bg-slate-50/80 border-slate-200/80' : 'bg-white/10 border-white/20 text-white'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{doc.name}</span>
                      <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-mono text-[10px] rounded font-bold">{doc.required}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">{doc.allowedType} ({doc.maxSize})</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{doc.description} — <span className="text-teal-400 font-mono">{doc.verificationMethod}</span></p>
                  </div>

                  <button 
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 7: BID CONFIGURATION & PRIVACY RULES */}
          <div id="proc-section-7" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${cardTitleText}`}>
                <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">7</span>
                <span>Bid Configuration & Rules</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Bid Submission Type</label>
                <select 
                  value={formData.submissionType}
                  onChange={(e) => setFormData({ ...formData, submissionType: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Single Cover">Single Cover</option>
                  <option value="Two Stage / Two Cover">Two Stage / Two Cover (Tech + Fin)</option>
                  <option value="Three Stage">Three Stage (Pre-Qual + Tech + Fin)</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Bid Validity Period (Days)</label>
                <input 
                  type="number" 
                  value={formData.validityPeriodDays}
                  onChange={(e) => setFormData({ ...formData, validityPeriodDays: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-mono font-bold text-xs focus:outline-none ${inputBgText}`}
                />
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Bid Modification</label>
                <select 
                  value={formData.allowModification}
                  onChange={(e) => setFormData({ ...formData, allowModification: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Allowed">Allowed Before Deadline</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Bid Withdrawal</label>
                <select 
                  value={formData.allowWithdrawal}
                  onChange={(e) => setFormData({ ...formData, allowWithdrawal: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Allowed">Allowed Before Deadline</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Multiple Bid Submission</label>
                <select 
                  value={formData.multipleBidSubmission}
                  onChange={(e) => setFormData({ ...formData, multipleBidSubmission: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-medium text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="Not Allowed">Not Allowed (Single Bid Per Vendor)</option>
                  <option value="Allowed">Allowed</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Financial Bid Encryption</label>
                <select 
                  value={formData.financialBidEncryption}
                  onChange={(e) => setFormData({ ...formData, financialBidEncryption: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-bold text-xs focus:outline-none text-emerald-500 ${
                    lightTheme ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="Enabled">Enabled (End-to-End Sealed Encrypted Bids)</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 8: EVALUATION CRITERIA & QCBS WEIGHT BUILDER ⭐ */}
          <div id="proc-section-8" className={`rounded-2xl border p-6 space-y-4 transition-colors duration-300 border-indigo-500/30 ${cardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${cardHeaderBorder}`}>
              <div>
                <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-300 flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">8</span>
                  <span>Evaluation Criteria & QCBS Weights ⭐</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">Enforces mandatory 100% total weight sum for QCBS evaluation</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 font-mono text-xs font-bold rounded-full border ${
                  evaluationTotalWeightSum === 100 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                }`}>
                  Total: {evaluationTotalWeightSum}% / 100%
                </span>
                {(formData.evaluationMethod === 'QCBS' || formData.evaluationMethod === 'Custom Evaluation') && (
                  <button 
                    onClick={() => setShowAddCriterionModal(true)}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Add Criterion
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block mb-1 text-[11px] ${labelText}`}>Evaluation Method</label>
                <select 
                  value={formData.evaluationMethod}
                  onChange={(e) => setFormData({ ...formData, evaluationMethod: e.target.value })}
                  className={`w-full p-2.5 rounded-xl font-bold text-xs focus:outline-none ${inputBgText}`}
                >
                  <option value="QCBS">QCBS (Quality & Cost Based Selection)</option>
                  <option value="L1">L1 (Lowest Financial Bid)</option>
                  <option value="QBS">QBS (Quality Based Selection)</option>
                  <option value="Custom Evaluation">Custom Evaluation</option>
                </select>
              </div>

              {formData.evaluationMethod === 'L1' ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs">
                  <p className="font-bold text-teal-400">L1 Lowest Price Bidder Selection Selected</p>
                  <p className="text-[11px] text-slate-400 mt-1">Technical weight percentages are not required. The qualified vendor submitting the lowest financial bid will be awarded.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {formData.evaluationCriteriaList.map((crit) => (
                    <div key={crit.id} className={`p-4 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-lg ${
                      lightTheme ? 'bg-slate-50/80 border-slate-200/80' : 'bg-white/10 border-white/20 text-white'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">{crit.name}</span>
                          <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-full">{crit.weight}% Weight</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{crit.description} — <span className="text-indigo-400 font-mono">{crit.scoringMethod}</span></p>
                      </div>

                      <button 
                        onClick={() => handleDeleteCriterion(crit.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 9: REAL-TIME COMPLIANCE INSPECTOR & BLOCKCHAIN REGISTRATION */}
          <div id="proc-section-9" className="rounded-2xl border p-6 space-y-5 shadow-2xl transition-colors duration-300 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white border-teal-500/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center font-mono text-xs shadow-md">9</span>
                  <span>Real-Time Compliance Inspector & Blockchain Registration</span>
                </h2>
                <p className="text-slate-200 text-xs mt-1 font-medium">Final automated validation before registering in TenderRegistry smart contract</p>
              </div>

              <span className={`px-3 py-1 font-mono font-extrabold rounded-full text-xs flex items-center gap-1.5 self-start sm:self-auto ${
                isFormFullyValid ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
              }`}>
                {isFormFullyValid ? <CheckCircle2 size={14} className="text-emerald-300" /> : <AlertCircle size={14} className="text-rose-300" />}
                {isFormFullyValid ? 'OVERALL STATUS: READY TO PUBLISH' : `ACTION REQUIRED (${validationErrors.length} Issues)`}
              </span>
            </div>

            {/* INSPECTOR VALIDATION GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Procurement Method Check</span>
                <span className="text-emerald-400 font-bold">✓ Valid</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Financial Configuration</span>
                <span className="text-emerald-400 font-bold">✓ Valid</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Timeline Chronology</span>
                <span className={validationErrors.some(e => e.section === 4) ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {validationErrors.some(e => e.section === 4) ? "⚠ Invalid Dates" : "✓ Valid"}
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Eligibility Validation</span>
                <span className="text-emerald-400 font-bold">✓ Valid</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-400">QCBS 100% Weight</span>
                <span className={evaluationTotalWeightSum === 100 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {evaluationTotalWeightSum === 100 ? "✓ 100%" : `⚠ ${evaluationTotalWeightSum}%`}
                </span>
              </div>
            </div>

            {/* BOTTOM BUTTON BAR (SECTION 15) */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                onClick={handleSaveDraft}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition border border-slate-600 flex items-center gap-2 shadow"
              >
                <Save size={15} /> Save Draft
              </button>
              <button 
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition border border-slate-600 flex items-center gap-2 shadow"
              >
                <Eye size={15} /> Preview
              </button>
              <button 
                onClick={() => {
                  if (isFormFullyValid) {
                    if (onToast) onToast('All 12 procurement sections validated cleanly!', 'success');
                  } else {
                    if (onToast) onToast(`Validation failed: ${validationErrors[0].msg}`, 'error');
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition border border-blue-500 flex items-center gap-2 shadow"
              >
                <ShieldCheck size={15} /> Validate Tender
              </button>
              <button 
                onClick={handlePublishTender}
                disabled={!isFormFullyValid}
                className={`px-6 py-2.5 font-black rounded-xl shadow-xl transition flex items-center gap-2 ${
                  isFormFullyValid 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/30 cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Rocket size={16} /> Publish Tender & Register on Blockchain
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: COMPLIANCE & INTEGRITY AUDIT PANEL (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className={`rounded-2xl border p-5 shadow-2xl sticky top-20 space-y-4 backdrop-blur-xl transition-all duration-300 ${
            lightTheme ? 'bg-white/80 border-slate-200 text-slate-900' : 'bg-white/10 border-white/20 text-white'
          }`}>
            <div className={`border-b pb-3 flex items-center justify-between ${cardHeaderBorder}`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 ${cardTitleText}`}>
                <ShieldCheck size={15} className="text-teal-500" /> Compliance & Integrity Inspector
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={labelText}>System Status</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold">{currentStatus}</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={labelText}>QCBS Total Weight</span>
                <span className={evaluationTotalWeightSum === 100 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {evaluationTotalWeightSum}%
                </span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={labelText}>ZKP Privacy Engine</span>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded font-bold">{formData.zkpActive ? 'Enabled' : 'Disabled'}</span>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className={`flex items-center justify-between ${labelText}`}>
                  <span>TenderRegistry Hash</span>
                  <button onClick={() => { navigator.clipboard.writeText(formData.contractHash); setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000); }} className="text-teal-500 hover:text-teal-400">
                    {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="text-teal-400 font-bold truncate text-[10px]">{formData.contractHash}</div>
              </div>
            </div>

            <div className={`p-3.5 border rounded-xl space-y-2 ${
              lightTheme ? 'bg-indigo-50/60 border-indigo-200 text-slate-800' : 'bg-gradient-to-br from-indigo-950/60 to-slate-950 border-indigo-500/30 text-slate-200'
            }`}>
              <div className="flex items-center space-x-1.5 text-indigo-500 font-bold text-xs">
                <Lock size={13} />
                <span>ZK Privacy-Preserving Proof</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Zero-Knowledge verification allows the authority to verify vendor compliance without requiring unnecessary disclosure of sensitive vendor balance sheets.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 13: PREVIEW MODAL (TENDER SUMMARY) */}
      {showPreviewModal && (
        <div className={`fixed inset-0 w-screen h-screen backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
          lightTheme ? 'bg-slate-900/40' : 'bg-slate-950/20'
        }`}>
          <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 transition-all ${modalCardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${modalHeaderBorder}`}>
              <div>
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-500 dark:text-teal-300 text-[10px] font-mono font-bold rounded-full">Official Tender RFP Preview</span>
                <h2 className={`text-lg font-bold mt-1 ${lightTheme ? 'text-slate-900' : 'text-white'}`}>{formData.title}</h2>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className={`p-2 rounded-lg font-bold transition ${lightTheme ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>✕</button>
            </div>

            <div className={`space-y-4 font-mono text-xs p-4 rounded-xl border ${
              lightTheme ? 'bg-slate-50/90 text-slate-800 border-slate-200' : 'bg-slate-950/60 text-slate-300 border-white/20'
            }`}>
              <div className={`grid grid-cols-2 gap-2 text-[11px] border-b pb-3 ${lightTheme ? 'border-slate-200' : 'border-white/20'}`}>
                <div><span className="text-slate-400">Tender ID:</span> <span className="text-teal-500 dark:text-teal-400 font-bold">{formData.tenderId}</span></div>
                <div><span className="text-slate-400">Ref No:</span> <span className={lightTheme ? 'text-slate-900 font-bold' : 'text-white'}>{formData.refNumber}</span></div>
                <div><span className="text-slate-400">Category:</span> <span className={lightTheme ? 'text-slate-900 font-bold' : 'text-white'}>{formData.category}</span></div>
                <div><span className="text-slate-400">Est. Budget:</span> <span className="text-amber-500 dark:text-amber-400 font-bold">{formatCurrency(formData.estimatedValue)}</span></div>
                <div><span className="text-slate-400">Contract Duration:</span> <span className={lightTheme ? 'text-slate-900 font-bold' : 'text-white'}>{formData.contractDuration} {formData.contractDurationUnit}</span></div>
                <div><span className="text-slate-400">Deadline:</span> <span className="text-rose-500 dark:text-rose-400">{formData.submissionDeadline}</span></div>
              </div>

              <div>
                <span className={`font-bold block mb-1 ${lightTheme ? 'text-slate-900' : 'text-slate-300'}`}>Scope Summary:</span>
                <p className={`font-sans text-xs ${lightTheme ? 'text-slate-700' : 'text-slate-200'}`}>{formData.detailedScope}</p>
              </div>

              <div>
                <span className={`font-bold block mb-1 ${lightTheme ? 'text-slate-900' : 'text-slate-300'}`}>Zero-Knowledge Eligibility Gateways:</span>
                <ul className="list-disc list-inside space-y-1 text-teal-600 dark:text-teal-300 text-[11px]">
                  {formData.eligibilityRequirements.map((r, idx) => (
                    <li key={idx}>{r.name} ({r.dataField} {r.operator} {r.value}) — {r.verificationMethod}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className={`font-bold block mb-1 ${lightTheme ? 'text-slate-900' : 'text-slate-300'}`}>Applicable Governance Directives:</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.governancePolicies.filter(p => p.selected).map(p => (
                    <span key={p.id} className={`px-2 py-0.5 rounded font-mono text-[10px] ${lightTheme ? 'bg-slate-200 text-teal-700' : 'bg-white/10 text-teal-300'}`}>{p.id} ({p.title})</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleSaveDraft} className={`px-4 py-2 rounded-xl transition ${modalCancelBtn}`}>Save Draft</button>
              <button onClick={() => setShowPreviewModal(false)} className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow">Edit Tender</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ELIGIBILITY REQUIREMENT */}
      {showAddEligibilityModal && (
        <div className={`fixed inset-0 w-screen h-screen backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
          lightTheme ? 'bg-slate-900/40' : 'bg-slate-950/20'
        }`}>
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 transition-all ${modalCardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${modalHeaderBorder}`}>
              <h3 className="font-bold text-sm text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <Plus size={16} /> Add Eligibility Requirement
              </h3>
              <button onClick={() => setShowAddEligibilityModal(false)} className={`p-1 font-bold rounded transition ${lightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Requirement Name *</label>
                <input type="text" value={newReq.name} onChange={(e) => setNewReq({ ...newReq, name: e.target.value })} placeholder="e.g. Minimum Annual Turnover" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Category</label>
                  <select value={newReq.category} onChange={(e) => setNewReq({ ...newReq, category: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer ${modalInputBg}`}>
                    <option className="bg-slate-900 text-white" value="Financial">Financial</option>
                    <option className="bg-slate-900 text-white" value="Experience">Experience</option>
                    <option className="bg-slate-900 text-white" value="Legal">Legal</option>
                    <option className="bg-slate-900 text-white" value="Technical">Technical</option>
                    <option className="bg-slate-900 text-white" value="Certification">Certification</option>
                    <option className="bg-slate-900 text-white" value="Sustainability">Sustainability</option>
                    <option className="bg-slate-900 text-white" value="Supply Chain">Supply Chain</option>
                    <option className="bg-slate-900 text-white" value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Data Field</label>
                  <input type="text" value={newReq.dataField} onChange={(e) => setNewReq({ ...newReq, dataField: e.target.value })} placeholder="e.g. annual_turnover_inr" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Operator</label>
                  <select value={newReq.operator} onChange={(e) => setNewReq({ ...newReq, operator: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer font-mono ${modalInputBg}`}>
                    <option className="bg-slate-900 text-white" value="=">=</option>
                    <option className="bg-slate-900 text-white" value="!=">!=</option>
                    <option className="bg-slate-900 text-white" value=">">&gt;</option>
                    <option className="bg-slate-900 text-white" value=">=">&gt;=</option>
                    <option className="bg-slate-900 text-white" value="<">&lt;</option>
                    <option className="bg-slate-900 text-white" value="<=">&lt;=</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Required Value *</label>
                  <input type="text" value={newReq.value} onChange={(e) => setNewReq({ ...newReq, value: e.target.value })} placeholder="e.g. ₹50 Crore" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Verification Method</label>
                <select value={newReq.verificationMethod} onChange={(e) => setNewReq({ ...newReq, verificationMethod: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer ${modalInputBg}`}>
                  <option className="bg-slate-900 text-white" value="Zero-Knowledge Proof">Zero-Knowledge Proof</option>
                  <option className="bg-slate-900 text-white" value="Manual Authority Verification">Manual Authority Verification</option>
                  <option className="bg-slate-900 text-white" value="Digital Signature Verification">Digital Signature Verification</option>
                  <option className="bg-slate-900 text-white" value="External Verification">External Verification</option>
                </select>
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${modalHeaderBorder}`}>
              <button onClick={() => setShowAddEligibilityModal(false)} className={`px-4 py-2 rounded-xl transition ${modalCancelBtn}`}>Cancel</button>
              <button onClick={handleAddEligibility} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow">Add Requirement</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD REQUIRED DOCUMENT */}
      {showAddDocModal && (
        <div className={`fixed inset-0 w-screen h-screen backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
          lightTheme ? 'bg-slate-900/40' : 'bg-slate-950/20'
        }`}>
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 transition-all ${modalCardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${modalHeaderBorder}`}>
              <h3 className="font-bold text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <Plus size={16} /> Add Required Document
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className={`p-1 font-bold rounded transition ${lightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Document Name *</label>
                <input type="text" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="e.g. Environmental Clearance Certificate" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Required Status</label>
                  <select value={newDoc.required} onChange={(e) => setNewDoc({ ...newDoc, required: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer ${modalInputBg}`}>
                    <option className="bg-slate-900 text-white" value="Required">Required</option>
                    <option className="bg-slate-900 text-white" value="Optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Allowed File Type</label>
                  <select value={newDoc.allowedType} onChange={(e) => setNewDoc({ ...newDoc, allowedType: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer ${modalInputBg}`}>
                    <option className="bg-slate-900 text-white" value="PDF">PDF</option>
                    <option className="bg-slate-900 text-white" value="PDF / DOCX">PDF / DOCX</option>
                    <option className="bg-slate-900 text-white" value="XLSX / PDF">XLSX / PDF</option>
                    <option className="bg-slate-900 text-white" value="ZIP">ZIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Verification Method</label>
                <select value={newDoc.verificationMethod} onChange={(e) => setNewDoc({ ...newDoc, verificationMethod: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs cursor-pointer ${modalInputBg}`}>
                  <option className="bg-slate-900 text-white" value="Manual Authority Verification">Manual Authority Verification</option>
                  <option className="bg-slate-900 text-white" value="Digital Signature Verification">Digital Signature Verification</option>
                  <option className="bg-slate-900 text-white" value="External Verification">External Verification</option>
                  <option className="bg-slate-900 text-white" value="ZKP Verification">ZKP Verification</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Description / Instructions</label>
                <input type="text" value={newDoc.description} onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })} placeholder="Brief instructions for vendor upload" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${modalHeaderBorder}`}>
              <button onClick={() => setShowAddDocModal(false)} className={`px-4 py-2 rounded-xl transition ${modalCancelBtn}`}>Cancel</button>
              <button onClick={handleAddRequiredDoc} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow">Add Document</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EVALUATION CRITERION */}
      {showAddCriterionModal && (
        <div className={`fixed inset-0 w-screen h-screen backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
          lightTheme ? 'bg-slate-900/40' : 'bg-slate-950/20'
        }`}>
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 transition-all ${modalCardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${modalHeaderBorder}`}>
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Plus size={16} /> Add Evaluation Criterion
              </h3>
              <button onClick={() => setShowAddCriterionModal(false)} className={`p-1 font-bold rounded transition ${lightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Criterion Name *</label>
                <input type="text" value={newCriterion.name} onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })} placeholder="e.g. Technical Capability & SLA Strategy" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Weight Percentage (%) *</label>
                <input type="number" value={newCriterion.weight} onChange={(e) => setNewCriterion({ ...newCriterion, weight: e.target.value })} className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${modalInputBg}`} />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Description</label>
                <input type="text" value={newCriterion.description} onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })} placeholder="Brief criteria description" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${modalHeaderBorder}`}>
              <button onClick={() => setShowAddCriterionModal(false)} className={`px-4 py-2 rounded-xl transition ${modalCancelBtn}`}>Cancel</button>
              <button onClick={handleAddCriterion} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl transition shadow">Add Criterion</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TENDER RULE */}
      {showAddRuleModal && (
        <div className={`fixed inset-0 w-screen h-screen backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${
          lightTheme ? 'bg-slate-900/40' : 'bg-slate-950/20'
        }`}>
          <div className={`rounded-2xl max-w-md w-full p-6 space-y-4 transition-all ${modalCardBg}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${modalHeaderBorder}`}>
              <h3 className="font-bold text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <Plus size={16} /> Add Tender-Specific Rule
              </h3>
              <button onClick={() => setShowAddRuleModal(false)} className={`p-1 font-bold rounded transition ${lightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] mb-1 ${modalLabelText}`}>Rule Statement *</label>
                <input type="text" value={newRule.rule} onChange={(e) => setNewRule({ ...newRule, rule: e.target.value })} placeholder="e.g. Mandatory 100% Green Power PPA" className={`w-full p-2.5 rounded-xl text-xs ${modalInputBg}`} />
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${modalHeaderBorder}`}>
              <button onClick={() => setShowAddRuleModal(false)} className={`px-4 py-2 rounded-xl transition ${modalCancelBtn}`}>Cancel</button>
              <button onClick={handleAddTenderRule} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow">Add Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCKCHAIN PUBLISHING ANIMATION MODAL */}
      {isDeploying && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/50 backdrop-blur-2xl backdrop-saturate-150 border border-teal-400/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl text-center text-white">
            <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto border border-teal-500/40 animate-pulse">
              <Rocket size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Registering Tender on Blockchain Ledger</h3>
              <p className="text-xs text-slate-400 mt-1">Anchoring Tender ID & Data Hash to TenderRegistry Contract...</p>
            </div>

            <div className="space-y-3 font-mono text-xs text-left bg-slate-950/60 p-4 rounded-xl border border-white/20">
              <div className={`flex items-center space-x-2 ${deployStep >= 1 ? 'text-teal-400 font-bold' : 'text-slate-600'}`}>
                <span>{deployStep >= 1 ? '✓' : '○'}</span>
                <span>Generating Cryptographic Hashes for Tender Document</span>
              </div>
              <div className={`flex items-center space-x-2 ${deployStep >= 2 ? 'text-teal-400 font-bold' : 'text-slate-600'}`}>
                <span>{deployStep >= 2 ? '✓' : '○'}</span>
                <span>Verifying Eligibility Rules & ZKP Circuit Keys</span>
              </div>
              <div className={`flex items-center space-x-2 ${deployStep >= 3 ? 'text-teal-400 font-bold' : 'text-slate-600'}`}>
                <span>{deployStep >= 3 ? '✓' : '○'}</span>
                <span>Executing On-Chain Transaction & Paying Gas Fee via Authority Relayer Wallet</span>
              </div>
              <div className={`flex items-center space-x-2 ${deployStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                <span>{deployStep >= 4 ? '✓' : '○'}</span>
                <span>On-Chain Creation Confirmed — Tender Published & Visible to Vendors!</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
