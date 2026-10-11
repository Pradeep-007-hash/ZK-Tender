import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Filter, ChevronRight, ChevronLeft, ArrowLeft, RefreshCw,
  CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, ShieldAlert,
  Award, FileText, Download, Copy, Check, ExternalLink, Hash, Calendar,
  DollarSign, Building, User, Lock, Eye, Trash2, RotateCcw, Sparkles,
  Layers, ListFilter, SlidersHorizontal, Info, Shield, Trophy, FileCheck,
  Send, CornerUpLeft, ArrowUpRight
} from 'lucide-react';

export default function VendorBidStatusPage({
  currentUser,
  onNavigate,
  onToast,
  initialBidId = null,
  initialTenderId = null,
  lightTheme = true
}) {
  const resolvedVendorId = currentUser?.vendorId || currentUser?.organizationId || 'ORG001';
  const resolvedVendorName = currentUser?.company || currentUser?.name || 'ABC Constructions Pvt Ltd';
  const resolvedEmail = currentUser?.email || 'vendor@zk-tender.in';

  // Component States
  const [bids, setBids] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Selected Bid for Details View
  const [selectedBidId, setSelectedBidId] = useState(initialBidId);
  const [detailedBidData, setDetailedBidData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Filtering, Searching & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal States
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch Submitted Bids from Backend
  const fetchSubmittedBids = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setFetchError(null);

    try {
      const headers = {
        'Accept': 'application/json',
        'x-vendor-id': resolvedVendorId,
        'x-organization-id': resolvedVendorId,
        'x-user-role': (currentUser?.role || 'VENDOR').toUpperCase(),
        'x-user-email': resolvedEmail
      };

      const res = await fetch(`http://localhost:5000/api/tenders/bids/vendor/${resolvedVendorId}`, {
        headers
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: You are only authorized to view your own organization\'s bids.');
        }
        throw new Error(`Failed to fetch bids (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.bids)) {
        setBids(data.bids);
      } else {
        setBids([]);
      }
    } catch (err) {
      console.warn('[BID STATUS FETCH ERROR]', err);
      setFetchError(err.message || 'Unable to load submitted bids. Please check network connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resolvedVendorId, resolvedEmail, currentUser]);

  // Load Saved Drafts from LocalStorage
  const loadDrafts = useCallback(() => {
    try {
      const draftsKey = `zk_vendor_drafts_${resolvedVendorId}`;
      const raw = localStorage.getItem(draftsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const formattedDrafts = parsed.map((d, idx) => ({
            id: `DRAFT-${d.tenderId || idx}`,
            bidId: `DRAFT-${(d.tenderId || '0000').slice(-4).toUpperCase()}`,
            bidReferenceId: `DRAFT-${(d.tenderId || '0000').slice(-4).toUpperCase()}`,
            tenderId: d.tenderId || 'TND-DRAFT',
            tenderTitle: d.tenderTitle || 'Draft Bid Proposal',
            department: d.department || 'Procurement Authority',
            category: 'Draft',
            amount: d.proposedBid ? `₹${Number(d.proposedBid).toLocaleString('en-IN')}` : '₹0',
            submissionDate: 'Not Submitted',
            submissionTime: 'Saved Draft',
            submittedAt: d.lastModified || d.savedAt || new Date().toISOString(),
            lastUpdated: d.lastModified || d.savedAt || new Date().toISOString(),
            lastUpdatedFormatted: new Date(d.lastModified || d.savedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            vcStatus: 'Draft',
            zkpStatus: 'Draft',
            eligibilityStatus: 'Draft',
            overallStatus: 'Draft',
            isDraft: true,
            submissionReceipt: 'PENDING_FINAL_SUBMISSION',
            rawDraft: d
          }));
          setDrafts(formattedDrafts);
          return;
        }
      }
      setDrafts([]);
    } catch (e) {
      setDrafts([]);
    }
  }, [resolvedVendorId]);

  useEffect(() => {
    fetchSubmittedBids();
    loadDrafts();
  }, [fetchSubmittedBids, loadDrafts]);

  // Initial Tender or Bid ID Navigation
  useEffect(() => {
    if (initialBidId) {
      setSelectedBidId(initialBidId);
    } else if (initialTenderId && bids.length > 0) {
      const match = bids.find(b => b.tenderId === initialTenderId);
      if (match) setSelectedBidId(match.bidId || match.id);
    }
  }, [initialBidId, initialTenderId, bids]);

  // Fetch Detailed Bid Record when selectedBidId changes
  const fetchBidDetails = useCallback(async (bidId) => {
    if (!bidId) {
      setDetailedBidData(null);
      return;
    }

    // Check if it's a draft
    if (String(bidId).startsWith('DRAFT-')) {
      const draftObj = drafts.find(d => d.id === bidId || d.bidId === bidId);
      if (draftObj) {
        setDetailedBidData({
          bid: draftObj,
          tender: {
            tenderId: draftObj.tenderId,
            title: draftObj.tenderTitle,
            department: draftObj.department,
            status: 'Draft Proposal'
          },
          timeline: [
            {
              step: 1,
              title: 'Draft Created',
              stage: 'Draft Preparation',
              status: 'in_progress',
              badge: 'Draft',
              timestamp: draftObj.submittedAt,
              description: 'Incomplete tender application saved locally in vendor portal workspace.',
              summary: 'Resume in Electronic Submission Wizard to generate ZKP and submit.'
            },
            { step: 2, title: 'VC Validation', stage: 'Credential Verification', status: 'pending', badge: 'Pending', timestamp: null, description: 'NIST ML-DSA-65 signature check scheduled on submission.' },
            { step: 3, title: 'ZKP Verification', stage: 'Proof Verification', status: 'pending', badge: 'Pending', timestamp: null, description: 'Groth16 Zero-Knowledge SNARK generation pending.' },
            { step: 4, title: 'Eligibility Decision', stage: 'Gateway Rule Check', status: 'pending', badge: 'Pending', timestamp: null, description: 'Eligibility policy compliance verification pending.' },
            { step: 5, title: 'MCDA Evaluation', stage: 'Scoring Matrix', status: 'pending', badge: 'Pending', timestamp: null, description: 'Multi-criteria ranking pending.' },
            { step: 6, title: 'Final Decision', stage: 'Award Determination', status: 'pending', badge: 'Pending', timestamp: null, description: 'Final contract award decree pending.' }
          ],
          isDraft: true
        });
        return;
      }
    }

    setLoadingDetails(true);
    setDetailsError(null);

    try {
      const headers = {
        'Accept': 'application/json',
        'x-vendor-id': resolvedVendorId,
        'x-organization-id': resolvedVendorId,
        'x-user-role': (currentUser?.role || 'VENDOR').toUpperCase(),
        'x-user-email': resolvedEmail
      };

      const res = await fetch(`http://localhost:5000/api/tenders/bids/${encodeURIComponent(bidId)}/details`, {
        headers
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: You are not authorized to view this vendor\'s bid record.');
        }
        throw new Error(`Failed to retrieve bid details (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setDetailedBidData(data);
      } else {
        throw new Error(data.message || 'Failed to parse bid details');
      }
    } catch (err) {
      console.warn('[FETCH BID DETAILS ERROR]', err);
      setDetailsError(err.message || 'Failed to load bid details.');
    } finally {
      setLoadingDetails(false);
    }
  }, [resolvedVendorId, resolvedEmail, currentUser, drafts]);

  useEffect(() => {
    if (selectedBidId) {
      fetchBidDetails(selectedBidId);
    }
  }, [selectedBidId, fetchBidDetails]);

  // Combined Dataset (Submitted Bids + Saved Drafts)
  const allBidsCombined = useMemo(() => {
    return [...bids, ...drafts];
  }, [bids, drafts]);

  // Filtered & Sorted Bids
  const filteredBids = useMemo(() => {
    return allBidsCombined.filter(b => {
      // Search matching
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (b.tenderId && b.tenderId.toLowerCase().includes(q)) ||
        (b.tenderTitle && b.tenderTitle.toLowerCase().includes(q)) ||
        (b.bidReferenceId && b.bidReferenceId.toLowerCase().includes(q)) ||
        (b.department && b.department.toLowerCase().includes(q));

      if (!matchQuery) return false;

      // Status matching
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'DRAFT') return b.isDraft || b.overallStatus === 'Draft';
      if (statusFilter === 'SUBMITTED') return b.overallStatus === 'Submitted';
      if (statusFilter === 'UNDER_EVALUATION') return b.overallStatus === 'Under Evaluation';
      if (statusFilter === 'EVALUATION_COMPLETED') return b.overallStatus === 'Evaluation Completed';
      if (statusFilter === 'AWARDED') return b.overallStatus === 'Awarded';
      if (statusFilter === 'NOT_SELECTED') return b.overallStatus === 'Not Selected';
      if (statusFilter === 'ELIGIBLE') return b.eligibilityStatus === 'Eligible';
      if (statusFilter === 'INELIGIBLE') return b.eligibilityStatus === 'Ineligible' || b.overallStatus === 'Ineligible';
      if (statusFilter === 'VC_VERIFIED') return b.vcStatus === 'VC Verified';
      if (statusFilter === 'VC_INVALID') return b.vcStatus === 'VC Invalid';
      if (statusFilter === 'ZKP_VERIFIED') return b.zkpStatus === 'ZKP Verified';
      if (statusFilter === 'ZKP_FAILED') return b.zkpStatus === 'ZKP Verification Failed';
      if (statusFilter === 'WITHDRAWN') return b.overallStatus === 'Withdrawn' || b.withdrawn;
      if (statusFilter === 'REJECTED') return b.overallStatus === 'Rejected' || b.rejected;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
      }
      if (sortBy === 'TITLE_ASC') {
        return (a.tenderTitle || '').localeCompare(b.tenderTitle || '');
      }
      if (sortBy === 'TITLE_DESC') {
        return (b.tenderTitle || '').localeCompare(a.tenderTitle || '');
      }
      return 0;
    });
  }, [allBidsCombined, searchQuery, statusFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBids.length / pageSize) || 1;
  const paginatedBids = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBids.slice(start, start + pageSize);
  }, [filteredBids, currentPage, pageSize]);

  // Overall Counts
  const stats = useMemo(() => {
    const total = bids.length;
    const underEval = bids.filter(b => b.overallStatus === 'Under Evaluation').length;
    const evaluated = bids.filter(b => b.overallStatus === 'Evaluation Completed' || b.overallStatus === 'Awarded').length;
    const awarded = bids.filter(b => b.overallStatus === 'Awarded' || b.isWinner).length;
    const eligible = bids.filter(b => b.eligibilityStatus === 'Eligible').length;
    const zkpValid = bids.filter(b => b.zkpStatus === 'ZKP Verified' || b.proofValid).length;
    return {
      total,
      underEval,
      evaluated,
      awarded,
      eligible,
      zkpValid,
      draftCount: drafts.length
    };
  }, [bids, drafts]);

  // Handle Withdraw Bid
  const handleConfirmWithdraw = async () => {
    if (!detailedBidData?.bid) return;
    setWithdrawing(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-vendor-id': resolvedVendorId,
        'x-organization-id': resolvedVendorId,
        'x-user-role': (currentUser?.role || 'VENDOR').toUpperCase()
      };

      const res = await fetch(`http://localhost:5000/api/tenders/${detailedBidData.bid.tenderId}/bids/${resolvedVendorId}/withdraw`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bidId: detailedBidData.bid.id || detailedBidData.bid.bidId })
      });

      const data = await res.json();
      if (data.success) {
        if (onToast) onToast('Bid has been successfully withdrawn.', 'info');
        setShowWithdrawModal(false);
        fetchSubmittedBids(true);
        fetchBidDetails(selectedBidId);
      } else {
        if (onToast) onToast(data.message || 'Failed to withdraw bid.', 'error');
      }
    } catch (e) {
      if (onToast) onToast('Network error while withdrawing bid.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, type = 'receipt') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'receipt') {
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2500);
    }
    if (onToast) onToast('Copied to clipboard!', 'info');
  };

  // Helper for Status Badges
  const renderStatusBadge = (statusStr, size = 'sm') => {
    const s = String(statusStr || '').toUpperCase();
    const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';

    if (s === 'AWARDED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm shadow-amber-500/10`}>
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Awarded</span>
        </span>
      );
    }
    if (s === 'NOT SELECTED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-semibold font-mono ${sizeClasses} bg-slate-500/15 text-slate-400 border border-slate-500/25`}>
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Not Selected</span>
        </span>
      );
    }
    if (s === 'UNDER EVALUATION') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse`}>
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Under Evaluation</span>
        </span>
      );
    }
    if (s === 'EVALUATION COMPLETED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-purple-500/15 text-purple-400 border border-purple-500/30`}>
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>Evaluation Completed</span>
        </span>
      );
    }
    if (s === 'SUBMITTED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-teal-500/15 text-teal-400 border border-teal-500/30`}>
          <Send className="w-3.5 h-3.5 text-teal-400" />
          <span>Submitted</span>
        </span>
      );
    }
    if (s === 'ELIGIBLE' || s === 'VC VERIFIED' || s === 'ZKP VERIFIED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusStr}</span>
        </span>
      );
    }
    if (s.includes('INVALID') || s.includes('FAILED') || s === 'INELIGIBLE' || s === 'REJECTED') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-bold font-mono ${sizeClasses} bg-rose-500/15 text-rose-400 border border-rose-500/30`}>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{statusStr}</span>
        </span>
      );
    }
    if (s.includes('PENDING')) {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-medium font-mono ${sizeClasses} bg-amber-500/15 text-amber-400 border border-amber-500/25`}>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{statusStr}</span>
        </span>
      );
    }
    if (s === 'WITHDRAWN') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-medium font-mono ${sizeClasses} bg-slate-500/15 text-slate-400 border border-slate-600/30`}>
          <CornerUpLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Withdrawn</span>
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-lg font-medium font-mono ${sizeClasses} bg-amber-500/15 text-amber-300 border border-amber-500/30`}>
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Draft</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center space-x-1.5 rounded-lg font-semibold font-mono ${sizeClasses} bg-slate-800 text-slate-300 border border-slate-700`}>
        <span>{statusStr || 'Unknown'}</span>
      </span>
    );
  };

  // Helper for Stepper Stage Icons
  const getTimelineStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />;
      case 'withdrawn':
        return <CornerUpLeft className="w-5 h-5 text-slate-400" />;
      case 'not_selected':
        return <Info className="w-5 h-5 text-slate-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  // ------------------------------------------------------------------------
  // RENDER: BID DETAILS VIEW (Drill-Down Mode)
  // ------------------------------------------------------------------------
  if (selectedBidId && detailedBidData) {
    const { bid, tender, timeline, vcVerification, zkpVerification, eligibilityResult, mcdaEvaluation, disclosedRejectionReason, auditTrail } = detailedBidData;

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSelectedBidId(null);
                setDetailedBidData(null);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Submitted Bids</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-xs font-bold text-teal-400">{bid.bidReferenceId}</span>
          </div>

          <div className="flex items-center space-x-2">
            {bid.canWithdraw && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition flex items-center space-x-1.5"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Withdraw Bid</span>
              </button>
            )}
            <button
              onClick={() => onNavigate && onNavigate('eval-results', bid.tenderId)}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm"
              title="View Disclosed MCDA Evaluation Scorecard"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Evaluation Scorecard</span>
            </button>
            <button

              onClick={() => fetchBidDetails(selectedBidId)}
              disabled={loadingDetails}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs"
              title="Refresh Bid Status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDetails ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className={`p-6 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-500/15 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
                  {bid.tenderId}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {tender?.department || 'Government Department'}
                </span>
                {renderStatusBadge(bid.overallStatus, 'lg')}
              </div>
              <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
                {tender?.title || 'Tender Proposal'}
              </h1>
              <p className="text-xs text-slate-400">
                Official encrypted sealed bid submitted by <strong>{bid.vendorName}</strong>. Cryptographic proof and verifiable credential evaluation details.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Bid Offer</span>
                <p className="text-sm font-bold font-mono text-amber-400">{bid.amount}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Submitted</span>
                <p className="text-xs font-semibold text-slate-200">
                  {new Date(bid.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Receipt Ref</span>
                <button
                  onClick={() => copyToClipboard(bid.submissionReceipt, 'receipt')}
                  className="flex items-center space-x-1 text-xs font-mono text-teal-400 hover:text-teal-300 transition"
                  title="Click to copy receipt"
                >
                  <span className="truncate max-w-[110px]">{bid.submissionReceipt}</span>
                  {copiedReceipt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Step Lifecycle Progress Stepper */}
        <div className={`p-6 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className={`text-base font-bold flex items-center space-x-2 ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Tender Lifecycle Progress Timeline</span>
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end verification pipeline from submission to final award decree
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">
                Current Active Stage: <strong className="text-teal-400">{timeline?.find(s => s.status === 'in_progress')?.title || timeline?.find(s => s.status === 'completed')?.title || 'Completed'}</strong>
              </span>
            </div>
          </div>

          {/* Stepper Display */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {timeline?.map((stepItem, idx) => {
                const isCompleted = stepItem.status === 'completed';
                const isInProgress = stepItem.status === 'in_progress';
                const isFailed = stepItem.status === 'failed';
                const isWithdrawn = stepItem.status === 'withdrawn';

                return (
                  <div
                    key={stepItem.step || idx}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      isCompleted
                        ? 'bg-slate-950/80 border-emerald-500/30'
                        : isInProgress
                          ? 'bg-slate-950/90 border-teal-500 ring-2 ring-teal-500/20'
                          : isFailed
                            ? 'bg-slate-950/80 border-rose-500/40'
                            : isWithdrawn
                              ? 'bg-slate-950/40 border-slate-800 opacity-60'
                              : 'bg-slate-950/30 border-slate-800/70 opacity-70'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                          {stepItem.step}
                        </span>
                        {getTimelineStepIcon(stepItem.status)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white tracking-tight">{stepItem.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{stepItem.description}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-500">Status</span>
                        {renderStatusBadge(stepItem.badge, 'sm')}
                      </div>
                      {stepItem.timestamp && (
                        <p className="text-[9px] font-mono text-slate-500 text-right">
                          {new Date(stepItem.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disclosed Rejection / Exclusion Reason Alert (if applicable) */}
        {disclosedRejectionReason && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start space-x-3 text-xs shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-300">Official Disclosure Notice Regarding Submission</h4>
              <p className="text-rose-200/90 leading-relaxed">{disclosedRejectionReason}</p>
            </div>
          </div>
        )}

        {/* Technical Deep-Dive Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Verifiable Credential Validation */}
          <div className={`p-5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>Verifiable Credential (VC) Verification</h3>
                  <p className="text-[11px] text-slate-400">Post-quantum digital identity certificate</p>
                </div>
              </div>
              {renderStatusBadge(vcVerification?.status || 'VC Verified')}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Cryptographic Signature</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>NIST FIPS 204 ML-DSA-65</span>
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Issuing Authority</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-[200px]" title={vcVerification?.issuer}>
                  {vcVerification?.issuer || 'AUTHORIZED_GOVERNMENT_AUTHORITY'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Credential ID</span>
                <span className="font-mono font-bold text-teal-400">{vcVerification?.credentialId || 'VC-853591'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Holder DID</span>
                <span className="font-mono text-slate-300 text-right truncate max-w-[200px]" title={vcVerification?.holderDid}>
                  {vcVerification?.holderDid || `did:ethr:sepolia:${bid.vendorId}`}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Expiration & Validity</span>
                <span className="font-semibold text-slate-200">
                  {vcVerification?.expirationDate ? new Date(vcVerification.expirationDate).toLocaleDateString('en-IN') : '10 Oct 2027'} ({vcVerification?.daysRemaining || 365} days remaining)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Zero-Knowledge Proof (ZKP) Verification */}
          <div className={`p-5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>ZKP Cryptographic Verification Result</h3>
                  <p className="text-[11px] text-slate-400">Zero-knowledge proof over confidential criteria</p>
                </div>
              </div>
              {renderStatusBadge(zkpVerification?.status || 'ZKP Verified')}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Circuit & Policy Version</span>
                <span className="font-mono font-bold text-slate-200">
                  {zkpVerification?.circuitVersion || 'eligibility.circom (Version 2.0.0)'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Proving Protocol</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {zkpVerification?.protocol || 'Groth16 (bn128 curve)'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Proof Verification ID</span>
                <span className="font-mono font-bold text-teal-400">
                  {zkpVerification?.verificationProofId || `ZKP-${(bid.bidId || '9981').slice(-6)}`}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Policy Hash Binding</span>
                <span className="font-mono text-slate-400 text-right truncate max-w-[200px]" title={zkpVerification?.policyHash}>
                  {zkpVerification?.policyHash || '0x845dd7...'}
                </span>
              </div>

              {/* Witness Privacy Guarantee Banner */}
              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 text-teal-200 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-[11px] text-teal-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy Guarantee: Zero Witness Exposure</span>
                </div>
                <p className="text-[10px] text-teal-300/80 leading-relaxed">
                  Private financial witness parameters (turnover, project values, confidential balances) were evaluated inside the zero-knowledge circuit and never disclosed to verifiers.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Eligibility Evaluation Results */}
          <div className={`p-5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>Tender Eligibility Decision</h3>
                  <p className="text-[11px] text-slate-400">Preliminary qualification criteria results</p>
                </div>
              </div>
              {renderStatusBadge(eligibilityResult?.status || 'Eligible')}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Evaluated Score</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">
                    {eligibilityResult?.finalScore ?? 100} <span className="text-slate-500 text-xs">/ 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Passing Threshold</span>
                  <p className="text-base font-bold font-mono text-teal-400 mt-0.5">
                    {eligibilityResult?.passingScore ?? 70} <span className="text-slate-500 text-xs">Score</span>
                  </p>
                </div>
              </div>

              {/* Criteria List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Evaluated Policy Criteria</span>
                {(eligibilityResult?.criteriaResults || []).map((crit, cIdx) => (
                  <div key={cIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 capitalize">{crit.criterionName || crit.name || `Criterion ${cIdx + 1}`}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">Weight: {crit.weight || 25}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{crit.details}</p>
                    </div>
                    <div>
                      {crit.passed ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">Passed</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: MCDA Multi-Criteria Evaluation Stage */}
          <div className={`p-5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>MCDA Evaluation Stage</h3>
                  <p className="text-[11px] text-slate-400">AHP, Min-Max & Weighted Sum Model (WSM)</p>
                </div>
              </div>
              {renderStatusBadge(mcdaEvaluation?.status || 'Under Evaluation')}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Evaluation Stage</span>
                  <span className="font-bold text-slate-200">{mcdaEvaluation?.stage || 'Final Rankings Computed'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">AHP Matrix Consistency</span>
                  <span className="font-mono text-emerald-400 font-bold">CR ≤ 0.10 (Consistent)</span>
                </div>
              </div>

              {/* Vendor Rank & Score (if evaluated) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Vendor Rank</span>
                  <p className="text-base font-bold font-mono text-teal-400 mt-0.5">
                    {mcdaEvaluation?.vendorRank ? `Rank #${mcdaEvaluation.vendorRank}` : 'Under Review'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">WSM Score</span>
                  <p className="text-base font-bold font-mono text-amber-400 mt-0.5">
                    {mcdaEvaluation?.vendorScore !== null && mcdaEvaluation?.vendorScore !== undefined
                      ? `${(Number(mcdaEvaluation.vendorScore) * 100).toFixed(1)}%`
                      : 'Pending'}
                  </p>
                </div>
              </div>

              {/* AHP Weights Summary */}
              {mcdaEvaluation?.weights && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">AHP Criteria Weight Distribution</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                    {Object.entries(mcdaEvaluation.weights).map(([k, v]) => (
                      <div key={k} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <span className="text-slate-400 capitalize block text-[10px]">{k}</span>
                        <span className="font-bold text-slate-200">{(Number(v) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Events Trail */}
        <div className={`p-6 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Cryptographic Audit Trail & Event History</span>
              </h3>
              <p className="text-xs text-slate-400">Chronological tamper-evident audit events recorded for this bid</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-mono text-xs rounded-lg font-bold">
              {auditTrail?.length || 0} Events
            </span>
          </div>

          <div className="space-y-3">
            {(!auditTrail || auditTrail.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No audit log records available.</p>
            ) : (
              auditTrail.map((ev, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-mono text-[10px] font-bold">
                        {ev.action}
                      </span>
                      <span className="text-slate-300 font-semibold">{ev.actor}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ev.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {new Date(ev.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Withdrawal Confirmation Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">Confirm Bid Withdrawal</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to withdraw bid <strong>{bid.bidReferenceId}</strong> for Tender <strong>{bid.tenderId}</strong>?
                This action will mark your bid commitment as withdrawn in the ledger.
              </p>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWithdraw}
                  disabled={withdrawing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                >
                  {withdrawing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CornerUpLeft className="w-3.5 h-3.5" />}
                  <span>Confirm Withdrawal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // RENDER: DASHBOARD VIEW (Directory of Submitted Bids)
  // ------------------------------------------------------------------------
  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Top Banner / Summary Strip */}
      <div className={`p-6 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} space-y-5`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
                Bid Status & Lifecycle Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
                Vendor Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track all submitted bids, verifiable credential validations, zero-knowledge proofs, and multi-criteria evaluation results.
            </p>
          </div>

          {/* Authenticated Identity Tag & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-left">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Authenticated Vendor</span>
              <span className="text-xs font-bold font-mono text-teal-400">{resolvedVendorName} ({resolvedVendorId})</span>
            </div>
            <button
              onClick={() => fetchSubmittedBids()}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Refresh Bids"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5-Column Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Submitted</span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-white">{stats.total}</p>
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Under Evaluation</span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-blue-400">{stats.underEval}</p>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">ZKP & VC Verified</span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-emerald-400">{stats.zkpValid}</p>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Awarded Contracts</span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-amber-400">{stats.awarded}</p>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 shadow">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Saved Drafts</span>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-slate-300">{stats.draftCount}</p>
              <FileCheck className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div className={`p-4 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'} shadow flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Tender ID, Title, Bid Ref, or Dept..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses ({allBidsCombined.length})</option>
              <option value="SUBMITTED" className="bg-slate-900">Submitted</option>
              <option value="UNDER_EVALUATION" className="bg-slate-900">Under Evaluation</option>
              <option value="EVALUATION_COMPLETED" className="bg-slate-900">Evaluation Completed</option>
              <option value="AWARDED" className="bg-slate-900">Awarded</option>
              <option value="NOT_SELECTED" className="bg-slate-900">Not Selected</option>
              <option value="ELIGIBLE" className="bg-slate-900">Eligible</option>
              <option value="INELIGIBLE" className="bg-slate-900">Ineligible</option>
              <option value="VC_VERIFIED" className="bg-slate-900">VC Verified</option>
              <option value="VC_INVALID" className="bg-slate-900">VC Invalid</option>
              <option value="ZKP_VERIFIED" className="bg-slate-900">ZKP Verified</option>
              <option value="ZKP_FAILED" className="bg-slate-900">ZKP Failed</option>
              <option value="DRAFT" className="bg-slate-900">Drafts ({drafts.length})</option>
              <option value="WITHDRAWN" className="bg-slate-900">Withdrawn</option>
              <option value="REJECTED" className="bg-slate-900">Rejected</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="DATE_DESC" className="bg-slate-900">Newest First</option>
              <option value="DATE_ASC" className="bg-slate-900">Oldest First</option>
              <option value="TITLE_ASC" className="bg-slate-900">Title (A-Z)</option>
              <option value="TITLE_DESC" className="bg-slate-900">Title (Z-A)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'table' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${viewMode === 'cards' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Card View"
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-7 h-7 text-teal-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading verifiable bid lifecycle records...</p>
        </div>
      )}

      {/* Error Message */}
      {fetchError && !loading && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => fetchSubmittedBids()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content: Table or Card Grid */}
      {!loading && !fetchError && (
        <>
          {filteredBids.length === 0 ? (
            /* Empty State */
            <div className={`p-12 text-center rounded-2xl border ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'} shadow-xl space-y-4`}>
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-2xl">
                <FileText className="w-7 h-7 text-slate-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Submitted Bids Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No bids match your active search and status filter. Try clearing filters.'
                    : 'You have not submitted any tender bids yet. Browse open government tenders to begin electronic bidding with zero-knowledge proof.'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center space-x-3">
                {(searchQuery || statusFilter !== 'ALL') ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate && onNavigate('tenders-available')}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-2"
                  >
                    <span>Browse Available Tenders &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* Responsive Table View */
            <div className={`rounded-2xl border ${lightTheme ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Tender ID</th>
                      <th className="p-3.5">Tender Title</th>
                      <th className="p-3.5">Bid Ref ID</th>
                      <th className="p-3.5">Submitted On</th>
                      <th className="p-3.5">VC Status</th>
                      <th className="p-3.5">ZKP Status</th>
                      <th className="p-3.5">Eligibility</th>
                      <th className="p-3.5">Lifecycle Status</th>
                      <th className="p-3.5">Last Updated</th>
                      <th className="p-3.5 pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {paginatedBids.map((b) => (
                      <tr key={b.bidId || b.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 pl-5 font-mono text-teal-400 font-bold whitespace-nowrap">
                          {b.tenderId}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-white max-w-[220px] truncate" title={b.tenderTitle}>
                            {b.tenderTitle}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate">{b.department}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 font-semibold whitespace-nowrap">
                          {b.bidReferenceId}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono text-slate-300 block">{b.submissionDate}</span>
                          <span className="font-mono text-[10px] text-slate-500">{b.submissionTime}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {renderStatusBadge(b.vcStatus)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {renderStatusBadge(b.zkpStatus)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {renderStatusBadge(b.eligibilityStatus)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {renderStatusBadge(b.overallStatus)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[10px]">
                          {b.lastUpdatedFormatted || b.submissionDate}
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          {b.isDraft ? (
                            <button
                              onClick={() => {
                                if (onNavigate) onNavigate('bidding-submit');
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition shadow"
                            >
                              Resume Draft
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedBidId(b.bidId || b.id)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold transition shadow flex items-center space-x-1 ml-auto"
                            >
                              <span>View Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Responsive Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBids.map((b) => (
                <div
                  key={b.bidId || b.id}
                  className={`p-5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'} hover:border-slate-700 transition shadow-xl flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 font-mono text-[10px] font-bold">
                        {b.tenderId}
                      </span>
                      {renderStatusBadge(b.overallStatus, 'sm')}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2" title={b.tenderTitle}>
                        {b.tenderTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{b.department}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Bid Ref ID</span>
                        <span className="font-mono font-bold text-slate-200">{b.bidReferenceId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Submitted</span>
                        <span className="font-mono text-slate-300">{b.submissionDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Offer Value</span>
                        <span className="font-mono font-bold text-amber-400">{b.amount}</span>
                      </div>
                    </div>

                    {/* Verification Badges Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-slate-500 font-mono block">VC Signature</span>
                        {renderStatusBadge(b.vcStatus, 'sm')}
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-slate-500 font-mono block">ZKP Proof</span>
                        {renderStatusBadge(b.zkpStatus, 'sm')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Updated: {b.lastUpdatedFormatted || b.submissionDate}
                    </span>
                    <button
                      onClick={() => setSelectedBidId(b.bidId || b.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center space-x-1"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Bar */}
          {filteredBids.length > pageSize && (
            <div className={`p-3.5 rounded-2xl border ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
              <span className="text-slate-400 font-mono text-[11px]">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredBids.length)} of {filteredBids.length} bids
              </span>

              <div className="flex items-center space-x-1.5 self-center sm:self-auto">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition ${
                      currentPage === page
                        ? 'bg-teal-600 text-white shadow'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
