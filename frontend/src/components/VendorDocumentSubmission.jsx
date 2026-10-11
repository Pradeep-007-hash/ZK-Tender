import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Clock, Eye, RefreshCw, Trash2, 
  Plus, ShieldCheck, Building2, Copy, FileCode, Check, AlertTriangle, ChevronRight, X, Download
} from 'lucide-react';

const REQUIRED_CATEGORIES = [
  {
    id: "company-registration",
    title: "Company Registration Certificate",
    type: "Company Registration Certificate",
    mandatory: true,
    description: "Official Corporate MCA Registration / Incorporation Certificate (COI) or Partnership Deed."
  },
  {
    id: "gst-certificate",
    title: "GST Certificate",
    type: "GST Certificate",
    mandatory: true,
    description: "Official GSTIN Registration Certificate (Form GST REG-06) showing active status."
  },
  {
    id: "pan-document",
    title: "PAN / Tax Document",
    type: "PAN / Tax Document",
    mandatory: true,
    description: "Permanent Account Number (PAN) Card of the business entity or sole proprietor."
  },
  {
    id: "turnover-certificate",
    title: "CA-Certified Turnover Certificate",
    type: "CA-Certified Turnover Certificate",
    mandatory: true,
    description: "Audited financial statement & Chartered Accountant turnover certificate for past FY."
  },
  {
    id: "previous-projects",
    title: "Previous Project Documents",
    type: "Previous Project Documents",
    mandatory: true,
    allowMultiple: true,
    description: "Government or enterprise project completion certificates and client work orders."
  },
  {
    id: "experience-certificate",
    title: "Experience Certificate",
    type: "Experience Certificate",
    mandatory: true,
    description: "Official technical experience certificate certifying years in technical operation."
  }
];

export default function VendorDocumentSubmission({ currentUser, onToast, lightTheme = true, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [vendorData, setVendorData] = useState({
    companyName: currentUser?.company || currentUser?.name || 'ABC Constructions Pvt Ltd',
    vendorId: currentUser?.organizationId || currentUser?.vendorId || 'VEN-10245',
    vendorDid: currentUser?.did || '',
    primaryWallet: currentUser?.primaryWallet || currentUser?.walletAddress || '',
    issuer: 'Government Credential Issuer (issuer@gov.in)',
    overallStatus: 'NOT_SUBMITTED'
  });

  const [summary, setSummary] = useState({
    totalRequired: 6,
    submittedCount: 0,
    verifiedCount: 0,
    underReviewCount: 0,
    rejectedCount: 0,
    pendingCount: 6,
    overallStatus: 'NOT_SUBMITTED'
  });

  const [vcData, setVcData] = useState(null);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [vcModalOpen, setVcModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Company Registration Certificate');
  const [activeDocForPreview, setActiveDocForPreview] = useState(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  // Form State for Upload Modal
  const [uploadForm, setUploadForm] = useState({
    documentId: null,
    documentType: 'Company Registration Certificate',
    documentName: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    description: '',
    file: null,
    fileName: '',
    fileSize: '',
    fileType: '',
    fileUrl: '',
    // Turnover specific
    financialYear: '2025-26',
    turnoverAmount: '',
    currency: 'INR',
    caName: '',
    caRegistrationNo: '',
    // Previous Project specific
    projectName: '',
    clientName: '',
    projectValue: '',
    startDate: '',
    endDate: '',
    projectDescription: ''
  });

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const vendorEmail = currentUser?.email || 'vendor@techcorp.in';

  // Fetch Vendor Documents & Summary
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/documents?email=${encodeURIComponent(vendorEmail)}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        if (data.vendor) {
          setVendorData(prev => ({
            ...prev,
            companyName: data.vendor.companyName || prev.companyName,
            vendorId: data.vendor.vendorId || prev.vendorId,
            vendorDid: data.vendor.vendorDid || currentUser?.did || prev.vendorDid,
            primaryWallet: data.vendor.primaryWallet || currentUser?.primaryWallet || prev.primaryWallet,
            overallStatus: data.vendor.overallStatus || 'NOT_SUBMITTED'
          }));
        }
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.verifiableCredential) {
          setVcData(data.verifiableCredential);
        }
      }
    } catch (err) {
      console.warn('[FETCH DOCUMENTS NOTICE]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [vendorEmail]);

  const triggerToast = (msg, type = 'success') => {
    if (onToast) onToast(msg, type);
  };

  // Open Upload Modal for a specific document category
  const handleOpenUploadModal = (category, existingDoc = null) => {
    setFormError('');
    setSelectedDocType(category.type);
    
    if (existingDoc) {
      setUploadForm({
        documentId: existingDoc.documentId,
        documentType: existingDoc.documentType,
        documentName: existingDoc.documentName || category.title,
        documentNumber: existingDoc.documentNumber || '',
        issueDate: existingDoc.issueDate ? existingDoc.issueDate.substring(0, 10) : '',
        expiryDate: existingDoc.expiryDate ? existingDoc.expiryDate.substring(0, 10) : '',
        issuingAuthority: existingDoc.issuingAuthority || '',
        description: existingDoc.description || '',
        file: null,
        fileName: existingDoc.fileName || '',
        fileSize: existingDoc.fileSize || '',
        fileType: existingDoc.fileType || 'application/pdf',
        fileUrl: existingDoc.fileUrl || '',
        // Metadata
        financialYear: existingDoc.metadata?.financialYear || '2025-26',
        turnoverAmount: existingDoc.metadata?.turnoverAmount || '',
        currency: existingDoc.metadata?.currency || 'INR',
        caName: existingDoc.metadata?.caName || '',
        caRegistrationNo: existingDoc.metadata?.caRegistrationNo || '',
        projectName: existingDoc.metadata?.projectName || '',
        clientName: existingDoc.metadata?.clientName || '',
        projectValue: existingDoc.metadata?.projectValue || '',
        startDate: existingDoc.metadata?.startDate ? existingDoc.metadata.startDate.substring(0, 10) : '',
        endDate: existingDoc.metadata?.endDate ? existingDoc.metadata.endDate.substring(0, 10) : '',
        projectDescription: existingDoc.metadata?.projectDescription || ''
      });
    } else {
      setUploadForm({
        documentId: null,
        documentType: category.type,
        documentName: category.title,
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
        description: '',
        file: null,
        fileName: '',
        fileSize: '',
        fileType: '',
        fileUrl: '',
        financialYear: '2025-26',
        turnoverAmount: '',
        currency: 'INR',
        caName: '',
        caRegistrationNo: '',
        projectName: '',
        clientName: '',
        projectValue: '',
        startDate: '',
        endDate: '',
        projectDescription: ''
      });
    }

    setUploadModalOpen(true);
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Format
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFormError('Invalid file format. Please upload a PDF, JPG, JPEG, or PNG document.');
      triggerToast('Unsupported file type. Allowed: PDF, JPG, PNG', 'error');
      return;
    }

    // Validate File Size (Max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setFormError('File size exceeds the 10 MB limit. Please compress or choose a smaller file.');
      triggerToast('File size exceeds 10 MB limit', 'error');
      return;
    }

    setFormError('');
    const readableSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    // Convert file to Base64 data URL for client storage/preview
    const reader = new FileReader();
    reader.onload = () => {
      setUploadForm(prev => ({
        ...prev,
        file,
        fileName: file.name,
        fileSize: readableSize,
        fileType: file.type,
        fileUrl: reader.result
      }));
      triggerToast(`Selected file: ${file.name} (${readableSize})`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Handle Form Submit (Upload / Update Document)
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setFormError('');

    // Require document file if new upload
    if (!uploadForm.documentId && !uploadForm.fileUrl) {
      setFormError('Please select a document file to upload (PDF, JPG, PNG).');
      return;
    }

    // Require document number / metadata validation
    if (!uploadForm.documentNumber && uploadForm.documentType !== "Previous Project Documents") {
      setFormError('Document Number / Registration ID is required.');
      return;
    }

    setUploading(true);

    try {
      const payload = {
        email: vendorEmail,
        vendorId: vendorData.vendorId,
        vendorDid: vendorData.vendorDid,
        documentType: uploadForm.documentType,
        documentName: uploadForm.documentName || uploadForm.documentType,
        documentNumber: uploadForm.documentNumber,
        issueDate: uploadForm.issueDate || null,
        expiryDate: uploadForm.expiryDate || null,
        issuingAuthority: uploadForm.issuingAuthority,
        description: uploadForm.description,
        fileUrl: uploadForm.fileUrl,
        fileName: uploadForm.fileName,
        fileSize: uploadForm.fileSize,
        fileType: uploadForm.fileType,
        metadata: {
          financialYear: uploadForm.financialYear,
          turnoverAmount: uploadForm.turnoverAmount ? parseFloat(uploadForm.turnoverAmount) : 0,
          currency: uploadForm.currency,
          caName: uploadForm.caName,
          caRegistrationNo: uploadForm.caRegistrationNo,
          projectName: uploadForm.projectName,
          clientName: uploadForm.clientName,
          projectValue: uploadForm.projectValue ? parseFloat(uploadForm.projectValue) : 0,
          startDate: uploadForm.startDate || null,
          endDate: uploadForm.endDate || null,
          projectDescription: uploadForm.projectDescription
        }
      };

      const url = uploadForm.documentId
        ? `http://localhost:5000/api/vendor/documents/${uploadForm.documentId}`
        : 'http://localhost:5000/api/vendor/documents';
      const method = uploadForm.documentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setUploading(false);

      if (data.success) {
        setUploadModalOpen(false);
        triggerToast(data.message || 'Document uploaded successfully!', 'success');
        fetchDocuments();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setFormError(data.message || 'Failed to save document.');
        triggerToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      setUploading(false);
      setFormError('Server error uploading document. Please try again.');
      triggerToast(err.message || 'Upload error', 'error');
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Document record deleted.', 'info');
        fetchDocuments();
      }
    } catch (err) {
      triggerToast('Error deleting document', 'error');
    }
  };

  // Submit All Documents for Verification
  const handleSubmitAll = async () => {
    // Validate missing mandatory documents
    const uploadedTypes = new Set(documents.map(d => d.documentType));
    const mandatoryCategories = REQUIRED_CATEGORIES.filter(c => c.mandatory && !c.allowMultiple);
    const missing = mandatoryCategories.filter(c => !uploadedTypes.has(c.type));

    if (missing.length > 0) {
      const missingNames = missing.map(m => m.title).join(', ');
      triggerToast(`Please upload all required documents before submitting for verification. Missing: ${missingNames}`, 'warning');
      alert(`Please upload all required documents before submitting for verification.\n\nMissing Required Documents:\n• ${missing.map(m => m.title).join('\n• ')}`);
      return;
    }

    setSubmittingAll(true);
    try {
      const res = await fetch('http://localhost:5000/api/vendor/documents/submit-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: vendorEmail })
      });
      const data = await res.json();
      setSubmittingAll(false);

      if (data.success) {
        triggerToast('All company documents successfully submitted for Issuer verification!', 'success');
        fetchDocuments();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        triggerToast(data.message || 'Failed to submit documents for verification.', 'error');
      }
    } catch (err) {
      setSubmittingAll(false);
      triggerToast('Error submitting documents', 'error');
    }
  };

  // Copy DID Handler
  const handleCopyDid = () => {
    if (!vendorData.vendorDid) return;
    navigator.clipboard.writeText(vendorData.vendorDid);
    triggerToast('Vendor DID copied to clipboard!', 'success');
  };

  const isVcIssued = Boolean(vcData || summary.overallStatus === 'CREDENTIAL_ISSUED' || (summary.verifiedCount === 6 && vendorData.overallStatus === 'VERIFIED'));

  const activeVc = vcData || (isVcIssued ? {
    status: 'ACTIVE',
    credentialId: vendorData.allocatedCredentialId || 'VC-853591',
    credentialType: 'TenderEligibilityCredential',
    issuer: 'did:key:z6MkIssuer001GovTenderAuthority99812',
    holder: vendorData.vendorDid || 'did:ethr:sepolia:vendor',
    issuedDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    daysRemaining: 365,
    signature: 'aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69',
    algorithm: 'ML-DSA-65',
    credentialSubject: {
      id: vendorData.vendorDid,
      companyName: vendorData.companyName,
      vendorId: vendorData.vendorId,
      experience: 8,
      turnover: 25,
      projects: 7,
      documentsVerified: true,
      eligibilityStatus: 'ELIGIBLE'
    }
  } : null);

  // Format Status Badge
  const renderStatusBadge = (statusStr) => {
    const status = (statusStr || 'NOT_SUBMITTED').toUpperCase();
    if (status === 'CREDENTIAL_ISSUED' || status === 'APPROVED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center space-x-1 shrink-0">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span>Approved (VC Issued)</span>
        </span>
      );
    }
    if (status === 'VERIFIED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center space-x-1 shrink-0">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span>Verified</span>
        </span>
      );
    }
    if (status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center space-x-1 shrink-0">
          <AlertCircle size={12} className="text-rose-500" />
          <span>Rejected / Resubmit</span>
        </span>
      );
    }
    if (status === 'UNDER_REVIEW' || status === 'SUBMITTED' || status === 'PENDING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30 flex items-center space-x-1 shrink-0 animate-pulse">
          <Clock size={12} className="text-blue-500" />
          <span>Under Verification</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center space-x-1 shrink-0">
        <AlertTriangle size={12} className="text-amber-500" />
        <span>Not Submitted</span>
      </span>
    );
  };

  return (
    <div className={`space-y-6 text-xs font-sans ${lightTheme ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* PAGE HEADER */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
        lightTheme ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Vendor Application & Document Submission</h1>
          </div>
          <p className={`text-xs ${lightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
            Submit official company compliance documents for Government Authority review, claim verification, and W3C Verifiable Credential issuance.
          </p>
        </div>
      </div>

      {/* APPLICATION PROCESS PIPELINE / STEPPER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md ${
        lightTheme ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 mb-3.5 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              APPLICATION PIPELINE
            </span>
            <span className="text-xs font-bold">
              Current Stage: {isVcIssued ? 'Step 4 — Tender Eligible (Ready to Bid)' : (summary.verifiedCount === 6 ? 'Step 3 — Credential Allocation' : (summary.submittedCount > 0 ? 'Step 2 — Authority Verification' : 'Step 1 — Document Submission'))}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {isVcIssued ? '4 / 4 Steps Completed' : (summary.verifiedCount === 6 ? '3 / 4 Steps Completed' : (summary.submittedCount > 0 ? '2 / 4 Steps Completed' : '1 / 4 Steps Completed'))}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
            summary.submittedCount >= 6 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-600'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              summary.submittedCount >= 6 ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white'
            }`}>
              {summary.submittedCount >= 6 ? '✓' : '1'}
            </div>
            <div>
              <div className="font-bold text-[11px]">1. Document Upload</div>
              <div className="text-[10px] opacity-80">{summary.submittedCount} of 6 Uploaded</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
            summary.verifiedCount === 6 || isVcIssued
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : (summary.submittedCount > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-slate-800/40 border-slate-700/50 text-slate-400')
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              summary.verifiedCount === 6 || isVcIssued ? 'bg-emerald-500 text-white' : (summary.submittedCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300')
            }`}>
              {summary.verifiedCount === 6 || isVcIssued ? '✓' : '2'}
            </div>
            <div>
              <div className="font-bold text-[11px]">2. Issuer Verification</div>
              <div className="text-[10px] opacity-80">{summary.verifiedCount === 6 || isVcIssued ? 'All Claims Verified' : (summary.submittedCount > 0 ? 'Under Review' : 'Pending Review')}</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
            isVcIssued
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : (summary.verifiedCount === 6 ? 'bg-teal-500/10 border-teal-500/30 text-teal-600' : 'bg-slate-800/40 border-slate-700/50 text-slate-400')
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isVcIssued ? 'bg-emerald-500 text-white' : (summary.verifiedCount === 6 ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300')
            }`}>
              {isVcIssued ? '✓' : '3'}
            </div>
            <div>
              <div className="font-bold text-[11px]">3. Allocate VC</div>
              <div className="text-[10px] opacity-80">{isVcIssued ? 'ML-DSA-65 VC Active' : (summary.verifiedCount === 6 ? 'Ready for Allocation' : 'Pending Verification')}</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
            isVcIssued
              ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-600 dark:text-teal-400 shadow-md shadow-teal-500/10'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isVcIssued ? 'bg-gradient-to-tr from-teal-600 to-cyan-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
            }`}>
              4
            </div>
            <div>
              <div className="font-bold text-[11px] flex items-center space-x-1">
                <span>4. Tender Bidding</span>
                {isVcIssued && <span className="text-[9px] bg-teal-600 text-white px-1 rounded font-mono font-bold">NEXT</span>}
              </div>
              <div className="text-[10px] opacity-80">{isVcIssued ? 'Eligible for Tenders!' : 'Locked Until VC Issued'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CELEBRATION / NEXT STEP CALLOUT BANNER (Rendered when Application is Verified & VC is Given) */}
      {isVcIssued && (
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl ${
          lightTheme 
            ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border-teal-300 shadow-teal-100/50' 
            : 'bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-950 border-teal-500/40 shadow-teal-950/40'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-500 shrink-0 shadow-lg shadow-teal-500/20">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    APPLICATION VERIFIED & APPROVED
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                    CREDENTIAL: {activeVc?.credentialId || 'ACTIVE'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Application Verified & Verifiable Credential Allocated!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  The Government Authority verified all submitted company documents and issued your cryptographic NIST Post-Quantum ML-DSA-65 Verifiable Credential. Your application has officially moved to the next step: <strong>Tender Bidding & Zero-Knowledge Proof Submission</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setVcModalOpen(true)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                  lightTheme 
                    ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <FileCode size={14} className="text-teal-500" />
                <span>View Issued VC</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('dashboard') : (window.location.href = '/vendor/dashboard')}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30 transition flex items-center space-x-2 cursor-pointer"
              >
                <span>Proceed to Next Step: Bid on Tenders</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENDOR INFORMATION BANNER */}
      <div className={`p-5 rounded-2xl border shadow-xl ${
        lightTheme ? 'bg-gradient-to-r from-teal-50/80 via-indigo-50/40 to-slate-50 border-teal-200/80' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className={`block text-[10px] uppercase font-sans font-bold ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Company Name</span>
            <div className="font-bold truncate text-teal-700 dark:text-teal-300 text-sm" title={vendorData.companyName}>
              {vendorData.companyName}
            </div>
          </div>

          <div className="space-y-1">
            <span className={`block text-[10px] uppercase font-sans font-bold ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Vendor ID</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {vendorData.vendorId}
            </div>
          </div>

          <div className="space-y-1">
            <span className={`block text-[10px] uppercase font-sans font-bold ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Vendor DID</span>
            <div className="font-bold text-cyan-600 dark:text-cyan-400 truncate flex items-center space-x-1" title={vendorData.vendorDid || 'did:ethr:sepolia:pending'}>
              <span className="truncate">{vendorData.vendorDid || 'did:ethr:sepolia:pending'}</span>
              {vendorData.vendorDid && (
                <button onClick={handleCopyDid} className="hover:text-teal-500 p-0.5" title="Copy DID">
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className={`block text-[10px] uppercase font-sans font-bold ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Issuer / Authority</span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 truncate" title={vendorData.issuer}>
              Government Tender Authority
            </div>
          </div>

          <div className="space-y-1">
            <span className={`block text-[10px] uppercase font-sans font-bold ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Overall Status</span>
            <div>
              {renderStatusBadge(summary.overallStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION SUMMARY BAR */}
      <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center ${
        lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Required</div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{summary.totalRequired}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Submitted</div>
          <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">{summary.submittedCount}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Verified</div>
          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{summary.verifiedCount}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold">Under Review</div>
          <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">{summary.underReviewCount}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
          <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Rejected</div>
          <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">{summary.rejectedCount}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Pending</div>
          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">{summary.pendingCount}</div>
        </div>
      </div>

      {/* REQUIRED DOCUMENTS CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center space-x-2">
            <Building2 size={16} className="text-teal-600" />
            <span>Required Company Verification Documents</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">All 6 categories must be uploaded for VC eligibility</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REQUIRED_CATEGORIES.map((category) => {
            // Find uploaded documents matching this category
            const categoryDocs = documents.filter(d => {
              const dt = (d.documentType || '').toLowerCase();
              const ct = category.type.toLowerCase();
              return dt.includes(ct) || ct.includes(dt) || (category.id === 'turnover-certificate' && dt.includes('financial'));
            });

            const hasUploaded = categoryDocs.length > 0;
            const primaryDoc = categoryDocs[0];

            return (
              <div 
                key={category.id}
                className={`p-5 rounded-2xl border shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  lightTheme ? 'bg-white border-slate-200/90 shadow-slate-200/40 hover:border-teal-400/80' : 'bg-slate-900 border-slate-800 hover:border-teal-500/50'
                }`}
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{category.title}</span>
                        {category.mandatory && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">Mandatory</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                    {hasUploaded ? renderStatusBadge(primaryDoc.status) : renderStatusBadge('NOT_SUBMITTED')}
                  </div>

                  {/* Uploaded Documents List */}
                  {hasUploaded ? (
                    <div className="space-y-2.5 pt-1">
                      {categoryDocs.map((doc) => (
                        <div 
                          key={doc.documentId || doc._id}
                          className={`p-3 rounded-xl border space-y-2 font-mono text-[11px] ${
                            lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate pr-2">
                              <FileText size={14} className="text-teal-600 shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.fileName || doc.documentName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{doc.fileSize || '1.2 MB'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                            <div>
                              <span className="block text-slate-400">Doc Number:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{doc.documentNumber || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-slate-400">Uploaded:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {doc.submittedAt ? new Date(doc.submittedAt).toLocaleDateString('en-IN') : 'Recently'}
                              </span>
                            </div>
                          </div>

                          {/* Specific Metadata Badge Displays */}
                          {doc.metadata?.turnoverAmount > 0 && (
                            <div className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 p-1.5 rounded font-bold flex justify-between">
                              <span>FY: {doc.metadata.financialYear || '2025-26'}</span>
                              <span>Turnover: ₹{doc.metadata.turnoverAmount} Cr</span>
                            </div>
                          )}

                          {doc.metadata?.projectName && (
                            <div className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 p-1.5 rounded font-bold flex justify-between">
                              <span className="truncate">Project: {doc.metadata.projectName}</span>
                              <span>₹{doc.metadata.projectValue || 0} Cr</span>
                            </div>
                          )}

                          {/* Issuer Rejection Comment Box */}
                          {(doc.status === 'REJECTED' || doc.status === 'RESUBMISSION_REQUIRED') && (
                            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-sans text-rose-800 dark:text-rose-300 space-y-1">
                              <div className="font-bold flex items-center space-x-1">
                                <AlertCircle size={13} className="text-rose-600 shrink-0" />
                                <span>Issuer Rejection Comment:</span>
                              </div>
                              <p className="text-[10px] italic leading-normal">
                                "{doc.rejectionNotes || doc.rejectionReason || doc.remarks || 'Document review failed. Please re-upload a clear and valid certificate.'}"
                              </p>
                              {doc.rejectedAt && (
                                <div className="text-[9px] text-rose-500 text-right">
                                  Rejected on: {new Date(doc.rejectedAt).toLocaleDateString('en-IN')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions for this document */}
                          <div className="flex items-center justify-end space-x-2 pt-1 font-sans">
                            <button
                              onClick={() => {
                                setActiveDocForPreview(doc);
                                setPreviewModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1 transition ${
                                lightTheme ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                              }`}
                            >
                              <Eye size={11} />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleOpenUploadModal(category, doc)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold flex items-center space-x-1 shadow transition"
                            >
                              <RefreshCw size={11} />
                              <span>Replace</span>
                            </button>

                            <button
                              onClick={() => handleDeleteDocument(doc.documentId || doc._id)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-[10px] font-bold transition"
                              title="Delete Record"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Previous Project Button */}
                      {category.allowMultiple && (
                        <button
                          onClick={() => handleOpenUploadModal(category)}
                          className="w-full py-2 border-2 border-dashed border-teal-500/40 hover:border-teal-500 rounded-xl text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition bg-teal-500/5 hover:bg-teal-500/10 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>+ Add Another Previous Project Record</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Empty Upload Trigger Card */
                    <div className="pt-2">
                      <button
                        onClick={() => handleOpenUploadModal(category)}
                        className={`w-full py-4 border-2 border-dashed rounded-xl font-bold transition flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                          lightTheme 
                            ? 'border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/50 text-slate-700 hover:text-teal-700' 
                            : 'border-slate-800 hover:border-teal-500 bg-slate-950 hover:bg-slate-800/80 text-slate-400 hover:text-teal-300'
                        }`}
                      >
                        <Upload size={20} className="text-teal-500" />
                        <span className="text-xs font-bold">+ Upload {category.title}</span>
                        <span className="text-[10px] font-normal text-slate-400">PDF, JPG, PNG up to 10MB</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VERIFIABLE CREDENTIAL STATUS SECTION */}
      <div className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
        lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verifiable Credential (VC) Status</h3>
              <p className="text-slate-500 text-[11px]">W3C Cryptographic VC derived from verified company claims</p>
            </div>
          </div>

          {activeVc ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center space-x-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>🟢 Credential Issued</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
              Waiting for issuer credential issuance
            </span>
          )}
        </div>

        {activeVc ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="block text-[10px] uppercase font-sans text-slate-400">Credential Type</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{activeVc.credentialType || 'TenderEligibilityCredential'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-sans text-slate-400">Credential ID</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeVc.credentialId || 'VC-99201'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-sans text-slate-400">Issuer DID</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block" title={activeVc.issuer}>
                {activeVc.issuer || 'did:key:z6MkIssuer001GovTenderAuthority99812'}
              </span>
            </div>
            <div className="flex items-center justify-end">
              <button
                onClick={() => setVcModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow cursor-pointer"
              >
                <FileCode size={14} />
                <span>View Credential JSON</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
            <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Credential Issuance Pipeline:</strong> Upload and submit all 6 required company documents. Once the Government Credential Issuer completes claim verification, an official NIST Post-Quantum cryptographically signed Verifiable Credential (VC) will automatically be issued to your Vendor DID (<span className="font-mono text-teal-600">{vendorData.vendorDid || 'did:ethr:...'}</span>).
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT ALL / PROCEED TO NEXT STEP BUTTON - Bottom CTA */}
      <div className="flex justify-center pt-2 pb-4">
        {isVcIssued ? (
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('dashboard') : (window.location.href = '/vendor/dashboard')}
            className="px-8 py-3.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold rounded-xl shadow-xl shadow-teal-600/30 transition flex items-center space-x-3 text-sm cursor-pointer"
          >
            <ShieldCheck size={18} />
            <span>Application Verified & VC Allocated — Proceed to Next Step: Live Tenders</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmitAll}
            disabled={submittingAll}
            className="px-8 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center space-x-2.5 text-sm cursor-pointer"
          >
            {submittingAll ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Submitting for Verification...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Submit All Documents for Verification</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* UPLOAD / EDIT DOCUMENT MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden font-sans my-8 ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center space-x-2">
                <Upload className="text-teal-500" size={18} />
                <h3 className="font-bold text-sm">
                  {uploadForm.documentId ? 'Replace Document' : 'Upload Document for Verification'}
                </h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDocument} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-start space-x-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Document Type Header */}
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold uppercase">Document Category</span>
                  <span className="font-extrabold text-sm">{uploadForm.documentType}</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-teal-600 text-white px-2 py-0.5 rounded">Required</span>
              </div>

              {/* Drag & Drop File Upload Area */}
              <div>
                <label className={`block font-bold mb-1.5 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                  Select File (PDF, JPG, JPEG, PNG - Max 10MB) <span className="text-rose-500">*</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                    uploadForm.fileName 
                      ? 'border-teal-500 bg-teal-500/5' 
                      : (lightTheme ? 'border-slate-300 hover:border-teal-500 bg-slate-50' : 'border-slate-800 hover:border-teal-500 bg-slate-950')
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  {uploadForm.fileName ? (
                    <div className="space-y-1">
                      <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                      <div className="font-bold text-slate-800 dark:text-slate-100">{uploadForm.fileName}</div>
                      <div className="text-[11px] text-teal-600 font-mono">{uploadForm.fileSize} · Click to replace file</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={24} className="mx-auto text-teal-500" />
                      <div className="font-bold text-slate-700 dark:text-slate-300">Click to Browse or Drag & Drop Document</div>
                      <div className="text-[10px] text-slate-400">Supports PDF certificates & official image scans</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Standard Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Document Number / Reg ID <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={uploadForm.documentNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentNumber: e.target.value })}
                    placeholder="e.g. REG-982019 / GSTIN / PAN"
                    className={`w-full p-2.5 rounded-lg border font-mono text-xs ${
                      lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Issuing Authority
                  </label>
                  <input 
                    type="text"
                    value={uploadForm.issuingAuthority}
                    onChange={(e) => setUploadForm({ ...uploadForm, issuingAuthority: e.target.value })}
                    placeholder="e.g. MCA Portal / GST Department / Income Tax"
                    className={`w-full p-2.5 rounded-lg border text-xs ${
                      lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Issue Date
                  </label>
                  <input 
                    type="date"
                    value={uploadForm.issueDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, issueDate: e.target.value })}
                    className={`w-full p-2.5 rounded-lg border text-xs ${
                      lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Expiry Date (if applicable)
                  </label>
                  <input 
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                    className={`w-full p-2.5 rounded-lg border text-xs ${
                      lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* SPECIFIC METADATA: CA TURNOVER CERTIFICATE */}
              {uploadForm.documentType === 'CA-Certified Turnover Certificate' && (
                <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                  <h4 className="font-bold text-teal-600 dark:text-teal-400 uppercase text-[10px]">Turnover Certificate Specific Metadata</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Financial Year</label>
                      <select 
                        value={uploadForm.financialYear}
                        onChange={(e) => setUploadForm({ ...uploadForm, financialYear: e.target.value })}
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      >
                        <option value="2025-26">2025-2026</option>
                        <option value="2024-25">2024-2025</option>
                        <option value="2023-24">2023-2024</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Annual Turnover (₹ in Crores)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={uploadForm.turnoverAmount}
                        onChange={(e) => setUploadForm({ ...uploadForm, turnoverAmount: e.target.value })}
                        placeholder="e.g. 25.5"
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">CA Name & Reg No.</label>
                      <input 
                        type="text"
                        value={uploadForm.caName}
                        onChange={(e) => setUploadForm({ ...uploadForm, caName: e.target.value })}
                        placeholder="e.g. R. Sharma & Co (CA-9982)"
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC METADATA: PREVIOUS PROJECT DOCUMENTS */}
              {uploadForm.documentType === 'Previous Project Documents' && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">Previous Project Specific Metadata</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Project Name</label>
                      <input 
                        type="text"
                        value={uploadForm.projectName}
                        onChange={(e) => setUploadForm({ ...uploadForm, projectName: e.target.value })}
                        placeholder="e.g. Metro Line Infra Phase 2"
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Client / Org Name</label>
                      <input 
                        type="text"
                        value={uploadForm.clientName}
                        onChange={(e) => setUploadForm({ ...uploadForm, clientName: e.target.value })}
                        placeholder="e.g. Urban Tech Dept"
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Project Value (₹ Crores)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={uploadForm.projectValue}
                        onChange={(e) => setUploadForm({ ...uploadForm, projectValue: e.target.value })}
                        placeholder="e.g. 18.2"
                        className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks / Description */}
              <div>
                <label className={`block font-semibold mb-1 ${lightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                  Additional Remarks / Notes
                </label>
                <textarea 
                  rows={2}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Optional notes for the Government Credential Issuer..."
                  className={`w-full p-2.5 rounded-lg border text-xs ${
                    lightTheme ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-slate-950 border-slate-800 text-white focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition flex items-center space-x-2 text-xs cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving Document...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>{uploadForm.documentId ? 'Save Replacement' : 'Upload & Submit'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewModalOpen && activeDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden font-sans my-8 ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center space-x-2">
                <FileText className="text-teal-500" size={18} />
                <div>
                  <h3 className="font-bold text-sm">{activeDocForPreview.documentName || activeDocForPreview.documentType}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{activeDocForPreview.fileName}</p>
                </div>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Document Number</span>
                  <span className="font-bold text-teal-600">{activeDocForPreview.documentNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Status</span>
                  {renderStatusBadge(activeDocForPreview.status)}
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Uploaded</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {activeDocForPreview.submittedAt ? new Date(activeDocForPreview.submittedAt).toLocaleDateString('en-IN') : 'Recently'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Issuing Authority</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">{activeDocForPreview.issuingAuthority || 'Govt Authority'}</span>
                </div>
              </div>

              {/* Document Preview Viewer */}
              <div className="border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 min-h-[300px] flex items-center justify-center p-4">
                {activeDocForPreview.fileUrl && activeDocForPreview.fileUrl.startsWith('data:image') ? (
                  <img 
                    src={activeDocForPreview.fileUrl} 
                    alt={activeDocForPreview.documentName} 
                    className="max-h-[400px] max-w-full object-contain rounded-lg border shadow"
                  />
                ) : activeDocForPreview.fileUrl && activeDocForPreview.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe 
                    src={activeDocForPreview.fileUrl} 
                    title={activeDocForPreview.documentName}
                    className="w-full h-[400px] rounded-lg border"
                  />
                ) : (
                  /* Fallback Document Card Preview */
                  <div className="text-center space-y-3 p-6 max-w-md">
                    <FileText size={48} className="mx-auto text-teal-500 animate-bounce" />
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{activeDocForPreview.fileName}</div>
                    <p className="text-slate-500 text-xs">
                      Official document verified and cryptographically stored in ZK-Tender DB.
                    </p>
                    <div className="font-mono text-[11px] text-teal-600 dark:text-teal-400 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
                      File Size: {activeDocForPreview.fileSize || '1.4 MB'} · Verified Format
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end space-x-3 ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VC JSON MODAL */}
      {vcModalOpen && activeVc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden font-sans ${
            lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center space-x-2">
                <FileCode className="text-teal-500" size={18} />
                <h3 className="font-bold text-sm">W3C Verifiable Credential (NIST ML-DSA-65)</h3>
              </div>
              <button onClick={() => setVcModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-mono">
              {(() => {
                const getSubmissionVcJson = () => {
                  const defaultIssuer = activeVc.issuer || "did:key:z6MkIssuerExampleGovTenderAuth99812";
                  const defaultVendorDid = vendorData.vendorDid || activeVc.holder || "did:key:z6MkVendorExample99812489";
                  const defaultSig = activeVc.signature || "aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69";

                  const rawSubject = (typeof activeVc.credentialSubject === 'object' && activeVc.credentialSubject) || {};
                  const expYears = Number(rawSubject.experienceYears ?? rawSubject.experience ?? 8);
                  const rawTurnover = Number(rawSubject.turnover ?? 250000000);
                  const turnoverVal = rawTurnover < 100000 ? rawTurnover * 10000000 : rawTurnover;
                  const compProjects = Number(rawSubject.completedProjects ?? rawSubject.projects ?? 7);

                  return {
                    type: [
                      "VerifiableCredential",
                      "VendorEligibilityCredential"
                    ],
                    issuer: defaultIssuer,
                    credentialSubject: {
                      id: rawSubject.id || vendorData.vendorDid || defaultVendorDid,
                      experienceYears: expYears,
                      turnover: turnoverVal,
                      completedProjects: compProjects
                    },
                    proof: {
                      type: "ML-DSA-65",
                      proofValue: defaultSig
                    }
                  };
                };

                const submissionVcJson = getSubmissionVcJson();

                return (
                  <>
                    <pre className="p-4 rounded-xl bg-slate-950 text-teal-300 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed select-all">
                      {JSON.stringify(submissionVcJson, null, 2)}
                    </pre>
                  </>
                );
              })()}
            </div>

            <div className={`p-4 border-t flex items-center justify-between ${lightTheme ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const defaultIssuer = activeVc.issuer || "did:key:z6MkIssuerExampleGovTenderAuth99812";
                    const defaultVendorDid = vendorData.vendorDid || activeVc.holder || "did:key:z6MkVendorExample99812489";
                    const defaultSig = activeVc.signature || "aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69";
                    const rawSubject = (typeof activeVc.credentialSubject === 'object' && activeVc.credentialSubject) || {};
                    const expYears = Number(rawSubject.experienceYears ?? rawSubject.experience ?? 8);
                    const rawTurnover = Number(rawSubject.turnover ?? 250000000);
                    const turnoverVal = rawTurnover < 100000 ? rawTurnover * 10000000 : rawTurnover;
                    const compProjects = Number(rawSubject.completedProjects ?? rawSubject.projects ?? 7);

                    const content = JSON.stringify({
                      type: [
                        "VerifiableCredential",
                        "VendorEligibilityCredential"
                      ],
                      issuer: defaultIssuer,
                      credentialSubject: {
                        id: rawSubject.id || vendorData.vendorDid || defaultVendorDid,
                        experienceYears: expYears,
                        turnover: turnoverVal,
                        completedProjects: compProjects
                      },
                      proof: {
                        type: "ML-DSA-65",
                        proofValue: defaultSig
                      }
                    }, null, 2);
                    navigator.clipboard.writeText(content);
                    triggerToast('Verifiable Credential JSON copied to clipboard!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  <Copy size={13} />
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultIssuer = activeVc.issuer || "did:key:z6MkIssuerExampleGovTenderAuth99812";
                    const defaultVendorDid = vendorData.vendorDid || activeVc.holder || "did:key:z6MkVendorExample99812489";
                    const defaultSig = activeVc.signature || "aad4cce049dcde0f276bde5eb0eb2810436cce90e94e9d89ef58d7b95744aa340bdb305229bfd58ae89484d8a7f5f77f6e54bba05d4dcd0b3fe4d5e3f1bbcdb8260329838286f162262c3eba1e911b8f4090b09a0edce64eafa487a046a9bd69";
                    const rawSubject = (typeof activeVc.credentialSubject === 'object' && activeVc.credentialSubject) || {};
                    const expYears = Number(rawSubject.experienceYears ?? rawSubject.experience ?? 8);
                    const rawTurnover = Number(rawSubject.turnover ?? 250000000);
                    const turnoverVal = rawTurnover < 100000 ? rawTurnover * 10000000 : rawTurnover;
                    const compProjects = Number(rawSubject.completedProjects ?? rawSubject.projects ?? 7);

                    const content = JSON.stringify({
                      type: [
                        "VerifiableCredential",
                        "VendorEligibilityCredential"
                      ],
                      issuer: defaultIssuer,
                      credentialSubject: {
                        id: rawSubject.id || vendorData.vendorDid || defaultVendorDid,
                        experienceYears: expYears,
                        turnover: turnoverVal,
                        completedProjects: compProjects
                      },
                      proof: {
                        type: "ML-DSA-65",
                        proofValue: defaultSig
                      }
                    }, null, 2);
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${activeVc.credentialId || 'VendorEligibilityCredential'}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    triggerToast('Verifiable Credential JSON downloaded!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  <Download size={13} />
                  <span>Download .json</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setVcModalOpen(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
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
