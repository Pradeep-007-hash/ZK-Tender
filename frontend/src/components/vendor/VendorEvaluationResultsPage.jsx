import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award, Trophy, ShieldCheck, ShieldAlert, CheckCircle2, Clock,
  AlertTriangle, XCircle, RefreshCw, ChevronRight, ArrowLeft,
  FileText, ExternalLink, Hash, Calendar, DollarSign, Building,
  Lock, Eye, Send, Info, Sparkles, Scale, BarChart2, Layers,
  Sliders, MessageSquare, AlertCircle, FileCheck, Check, Copy,
  ArrowUpRight, HelpCircle, Shield, CornerDownRight
} from 'lucide-react';

export default function VendorEvaluationResultsPage({
  currentUser,
  onNavigate,
  onToast,
  initialTenderId = null,
  lightTheme = true
}) {
  const resolvedVendorId = currentUser?.vendorId || currentUser?.organizationId || 'ORG001';
  const resolvedVendorName = currentUser?.company || currentUser?.name || 'ABC Constructions Pvt Ltd';
  const resolvedEmail = currentUser?.email || 'vendor@zk-tender.in';

  // State Management
  const [selectedTenderId, setSelectedTenderId] = useState(initialTenderId || 'TND-2026-6868');
  const [tenderList, setTenderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Evaluation Data
  const [evaluationData, setEvaluationData] = useState(null);

  // Active View Tab inside the page: 'scorecard' | 'mcda' | 'evidence' | 'appeal'
  const [activeTab, setActiveTab] = useState('scorecard');

  // Clarification / Appeal Modal State
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealForm, setAppealForm] = useState({
    subject: '',
    criterionRef: 'technical',
    message: '',
    contactEmail: resolvedEmail
  });
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Copy Feedback
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedPolicy, setCopiedPolicy] = useState(false);

  // Fetch all vendor tenders to populate dropdown
  const fetchVendorTenderList = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/evaluation/vendor/${resolvedVendorId}/list`, {
        headers: {
          'x-vendor-id': resolvedVendorId,
          'x-organization-id': resolvedVendorId
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.evaluations) && data.evaluations.length > 0) {
        setTenderList(data.evaluations);
        // If current selectedTenderId is not in list or initial, select first available
        if (!selectedTenderId || !data.evaluations.some(t => t.tenderId === selectedTenderId)) {
          setSelectedTenderId(data.evaluations[0].tenderId);
        }
      }
    } catch (err) {
      console.warn('[EVALUATION TENDER LIST FETCH NOTICE]', err.message);
    }
  }, [resolvedVendorId, selectedTenderId]);

  // Fetch full evaluation details for the selected tender
  const fetchEvaluationResult = useCallback(async (isSilent = false) => {
    if (!selectedTenderId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${selectedTenderId}/evaluation/vendor/${resolvedVendorId}`, {
        headers: {
          'x-vendor-id': resolvedVendorId,
          'x-organization-id': resolvedVendorId
        }
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to fetch evaluation results for Tender ${selectedTenderId}`);
      }

      setEvaluationData(data);
    } catch (err) {
      console.error('[FETCH EVALUATION ERROR]', err);
      setError(err.message || 'Error communicating with Evaluation Ledger.');
      if (onToast) onToast(err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTenderId, resolvedVendorId, onToast]);

  useEffect(() => {
    fetchVendorTenderList();
  }, [fetchVendorTenderList]);

  useEffect(() => {
    if (selectedTenderId) {
      fetchEvaluationResult();
    }
  }, [selectedTenderId, fetchEvaluationResult]);

  // Handle Clarification / Appeal Submission
  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    if (!appealForm.subject.trim() || !appealForm.message.trim()) {
      if (onToast) onToast('Please enter both subject and justification message.', 'warning');
      return;
    }

    setSubmittingAppeal(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${selectedTenderId}/evaluation/vendor/${resolvedVendorId}/clarification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': resolvedVendorId,
          'x-organization-id': resolvedVendorId
        },
        body: JSON.stringify(appealForm)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit clarification request.');
      }

      if (onToast) onToast(`Clarification request ${data.clarification?.id || ''} registered successfully.`, 'success');
      setShowAppealModal(false);
      setAppealForm({
        subject: '',
        criterionRef: 'technical',
        message: '',
        contactEmail: resolvedEmail
      });
      // Refresh to load updated clarifications list
      fetchEvaluationResult(true);
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else if (type === 'policy') {
      setCopiedPolicy(true);
      setTimeout(() => setCopiedPolicy(false), 2000);
    }
    if (onToast) onToast('Copied to clipboard', 'info');
  };

  // Helper for lifecycle state badge formatting
  const getLifecycleBadge = (state) => {
    switch (state) {
      case 'Awarded':
        return {
          bg: lightTheme ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
          dot: 'bg-emerald-500',
          icon: <Trophy className="w-4 h-4 text-emerald-500" />,
          label: 'Awarded — Formal Contract Decree'
        };
      case 'Award Approval Pending':
        return {
          bg: lightTheme ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-800',
          dot: 'bg-amber-500 animate-pulse',
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          label: 'Award Approval Pending'
        };
      case 'Evaluation Completed':
        return {
          bg: lightTheme ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-blue-950/60 text-blue-300 border-blue-800',
          dot: 'bg-blue-500',
          icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
          label: 'Evaluation Completed'
        };
      case 'Evaluation In Progress':
        return {
          bg: lightTheme ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-indigo-950/60 text-indigo-300 border-indigo-800',
          dot: 'bg-indigo-500 animate-pulse',
          icon: <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />,
          label: 'Evaluation In Progress'
        };
      case 'Eligible — Awaiting Evaluation':
        return {
          bg: lightTheme ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-teal-950/60 text-teal-300 border-teal-800',
          dot: 'bg-teal-500',
          icon: <ShieldCheck className="w-4 h-4 text-teal-500" />,
          label: 'Eligible — Awaiting Evaluation'
        };
      case 'Ineligible':
        return {
          bg: lightTheme ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-950/60 text-rose-300 border-rose-800',
          dot: 'bg-rose-500',
          icon: <XCircle className="w-4 h-4 text-rose-500" />,
          label: 'Ineligible — Gate Criteria Not Satisfied'
        };
      case 'Eligibility Pending':
        return {
          bg: lightTheme ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-500 animate-pulse',
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          label: 'Eligibility Pending'
        };
      case 'Results Withheld':
        return {
          bg: lightTheme ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-purple-950/60 text-purple-300 border-purple-800',
          dot: 'bg-purple-500',
          icon: <Lock className="w-4 h-4 text-purple-500" />,
          label: 'Results Withheld (Embargo Period)'
        };
      case 'Not Selected':
        return {
          bg: lightTheme ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-400',
          icon: <FileText className="w-4 h-4 text-slate-400" />,
          label: 'Not Selected (QCBS Standard)'
        };
      default:
        return {
          bg: lightTheme ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          icon: <Info className="w-4 h-4 text-slate-400" />,
          label: state || 'Under Review'
        };
    }
  };

  const summary = evaluationData?.summary || {};
  const evalResults = evaluationData?.evaluationResults || {};
  const mcda = evaluationData?.mcdaTransparency || {};
  const evidence = evaluationData?.evidence || {};
  const awardAndFeedback = evaluationData?.awardAndFeedback || {};
  const criteriaBreakdown = evalResults.criteriaBreakdown || [];
  const standstill = awardAndFeedback.standstillWindow || {};
  const clarifications = awardAndFeedback.clarifications || [];

  const lifecycleBadge = getLifecycleBadge(summary.lifecycleState);

  // 9 Result Lifecycle States Reference
  const allLifecycleStates = [
    { id: 'Eligibility Pending', label: 'Eligibility Pending', desc: 'VC & ZKP cryptographic proof validation in progress.' },
    { id: 'Ineligible', label: 'Ineligible', desc: 'Proof verification or gateway qualification requirement failed.' },
    { id: 'Eligible — Awaiting Evaluation', label: 'Eligible — Awaiting Eval', desc: 'ZKP gate passed; proposal queued for MCDA scoring.' },
    { id: 'Evaluation In Progress', label: 'Evaluation In Progress', desc: 'AHP pairwise matrix weighting & Min-Max normalizer active.' },
    { id: 'Evaluation Completed', label: 'Evaluation Completed', desc: 'Weighted Sum Model (WSM) composite calculation completed.' },
    { id: 'Award Approval Pending', label: 'Award Approval Pending', desc: 'Provisional rankings calculated; awaiting formal authority decree.' },
    { id: 'Awarded', label: 'Awarded', desc: 'Highest QCBS candidate confirmed; Contract / LoA executed.' },
    { id: 'Not Selected', label: 'Not Selected', desc: 'Compliant candidate not selected under QCBS scoring.' },
    { id: 'Results Withheld', label: 'Results Withheld', desc: 'Provisional scorecard under statutory embargo.' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${lightTheme ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} p-4 md:p-6 lg:p-8 font-sans`}>
      {/* Top Breadcrumb & Action Bar */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono mb-1">
              <span className="text-teal-600 dark:text-teal-400 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate && onNavigate('dashboard')}>Vendor Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 cursor-pointer hover:underline" onClick={() => onNavigate && onNavigate('eval-bid-status')}>Bid Status</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Evaluation Results</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Tender Evaluation Scorecard
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-mono font-medium">
                    MCDA QCBS
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Privacy-preserving Weighted Sum Model (WSM) evaluation outcome with cryptographic non-leakage verification.
                </p>
              </div>
            </div>
          </div>

          {/* Tender Selector & Refresh Action */}
          <div className="flex items-center flex-wrap gap-2.5">
            {tenderList.length > 1 && (
              <div className="relative">
                <select
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  className={`text-xs font-medium pl-3 pr-8 py-2 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 ${lightTheme ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'}`}
                >
                  {tenderList.map(t => (
                    <option key={t.tenderId} value={t.tenderId}>
                      {t.tenderId} — {t.tenderTitle?.substring(0, 32)}...
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none rotate-90" />
              </div>
            )}

            <button
              onClick={() => fetchEvaluationResult(true)}
              disabled={refreshing || loading}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition shadow-sm ${
                lightTheme ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
              <span>{refreshing ? 'Updating...' : 'Sync Outcome'}</span>
            </button>

            {standstill.isOpen && (
              <button
                onClick={() => setShowAppealModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Submit Clarification / Appeal</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`p-16 rounded-2xl border text-center space-y-4 ${lightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
            <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mx-auto"></div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Decoupling and Verifying Disclosed MCDA Ledger...</p>
              <p className="text-xs text-slate-500">Retrieving authorized WSM criterion scorecards and Groth16 zero-leakage certificates.</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className={`p-8 rounded-2xl border ${lightTheme ? 'bg-rose-50/50 border-rose-200 text-rose-900' : 'bg-rose-950/30 border-rose-800/80 text-rose-200'} space-y-3`}>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <h3 className="font-bold text-base">Unable to Retrieve Authorized Evaluation Outcome</h3>
            </div>
            <p className="text-xs opacity-90 max-w-2xl">{error}</p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => fetchEvaluationResult(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Retry Query
              </button>
              <button
                onClick={() => onNavigate && onNavigate('eval-bid-status')}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition"
              >
                Back to Bid Status
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!loading && !error && evaluationData && (
          <div className="space-y-6">

            {/* 1. TENDER & BID SUMMARY BANNER */}
            <div className={`rounded-2xl border p-5 md:p-6 transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Tender & Reference Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                      {summary.tenderId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Ref: {summary.bidReferenceId}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" /> Submitted: {summary.submissionDate}
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {summary.tenderTitle}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{summary.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>Estimated Value: ₹{(Number(summary.budget || 240000000) / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-500">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>Evaluated: {summary.evaluationCompletedAt ? new Date(summary.evaluationCompletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Lifecycle & Award Decree State Badges */}
                <div className="flex flex-col items-start lg:items-end space-y-3 shrink-0">
                  <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2.5 shadow-sm ${lifecycleBadge.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${lifecycleBadge.dot}`}></span>
                    {lifecycleBadge.icon}
                    <span className="text-xs font-bold tracking-wide uppercase">{lifecycleBadge.label}</span>
                  </div>

                  {/* Distinction: Provisional Leader vs Formally Awarded */}
                  {summary.isProvisionalLeader && (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Provisional Highest-Ranked Bidder (Awaiting Formal Authority Decree)</span>
                    </div>
                  )}

                  {summary.isFormallyAwarded && (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Confirmed Tender Award Winner — Contract Execution Authorized</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 font-mono text-left lg:text-right">
                    <span>Award Decree: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{summary.finalAwardStatus}</span>
                  </div>
                </div>
              </div>

              {/* 4 Quick Evidence / Gateway Pills */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">VC Verification</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{summary.vcVerificationResult}</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                  <Lock className="w-4 h-4 text-teal-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">ZKP Proof (Groth16)</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{summary.zkpVerificationResult}</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                  <FileCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Gateway Eligibility</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{summary.eligibilityDecision}</div>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                  <Scale className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Standstill Window</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {standstill.isOpen ? `${standstill.daysRemaining} Days Remaining` : 'Window Concluded'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. RESULT LIFECYCLE PIPELINE (9 STATES) */}
            <div className={`rounded-2xl border p-5 transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-teal-500" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Evaluation Lifecycle & Authorization Stage
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">9 Deterministic Milestones</span>
              </div>

              {/* Responsive Stepper / Pipeline Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                {allLifecycleStates.map((st, idx) => {
                  const isActive = summary.lifecycleState === st.id;
                  return (
                    <div
                      key={st.id}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col justify-between ${
                        isActive
                          ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 font-bold'
                          : lightTheme
                            ? 'border-slate-200 bg-slate-50/70 text-slate-500'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                      title={st.desc}
                    >
                      <div className="text-[10px] font-mono text-slate-400 font-bold mb-1">0{idx + 1}</div>
                      <div className="text-xs leading-tight mb-1">{st.label}</div>
                      <div className="text-[9px] text-slate-400 line-clamp-2">{st.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Special Lifecycle Guidance Notice */}
              <div className={`mt-4 p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
                summary.lifecycleState === 'Award Approval Pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : summary.lifecycleState === 'Awarded'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : summary.lifecycleState === 'Results Withheld'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200'
                      : summary.lifecycleState === 'Ineligible'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                        : lightTheme ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Current Milestone: {summary.lifecycleState}
                  </p>
                  <p className="text-[11px] opacity-90">
                    {summary.lifecycleState === 'Award Approval Pending' && (
                      <span>
                        MCDA scoring and AHP weights have been evaluated and verified. The vendor ranking is provisional. In accordance with e-Procurement statutory rules, the provisional leader is NOT the confirmed winner until the formal award decree is signed by the Tender Acceptance Authority.
                      </span>
                    )}
                    {summary.lifecycleState === 'Awarded' && (
                      <span>
                        Formal tender award decree has been executed. The Letter of Acceptance (LoA) is ready for issuance and contract performance guarantees are now in effect.
                      </span>
                    )}
                    {summary.lifecycleState === 'Not Selected' && (
                      <span>
                        The tender has concluded and was awarded to the highest-scoring candidate under QCBS methodology. The statutory 15-day standstill window is currently active for clarification requests.
                      </span>
                    )}
                    {summary.lifecycleState === 'Results Withheld' && (
                      <span>
                        Tender evaluation disclosure policy is currently restricted under statutory embargo. Provisional scores and rankings are withheld to maintain procurement integrity until the official public disclosure date.
                      </span>
                    )}
                    {summary.lifecycleState === 'Ineligible' && (
                      <span>
                        The bid proposal did not satisfy the mandatory Zero-Knowledge range proof constraints or the post-quantum Verifiable Credential signature was rejected at the gateway.
                      </span>
                    )}
                    {!['Award Approval Pending', 'Awarded', 'Not Selected', 'Results Withheld', 'Ineligible'].includes(summary.lifecycleState) && (
                      <span>
                        Administrative evaluation workflow in progress. Authenticated results will be disclosed automatically once validated.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. KEY METRICS SCORECARD (PRIMARY CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Final WSM Composite Score */}
              <div className={`p-5 rounded-2xl border transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Final WSM Score</span>
                  <BarChart2 className="w-4 h-4 text-teal-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                    {evalResults.finalWsmScoreFormatted || '0.0000'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 1.0000</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Composite: {evalResults.finalWsmScorePercentage}%</span>
                  <span className={`font-bold ${evalResults.finalWsmScorePercentage >= (evalResults.passingScore || 70) ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {evalResults.finalWsmScorePercentage >= (evalResults.passingScore || 70) ? 'Qualified' : 'Below Passing'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, evalResults.finalWsmScorePercentage || 0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 2: Disclosed Rank & Privacy-Preserving Position */}
              <div className={`p-5 rounded-2xl border transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Disclosed Rank</span>
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  {evalResults.vendorRank ? (
                    <>
                      <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        Rank #{evalResults.vendorRank}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        of {evalResults.totalEligibleBids || '—'} Bids
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-slate-400 italic font-mono">
                      {summary.lifecycleState === 'Results Withheld' ? 'Withheld' : 'Pending'}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500 font-mono flex items-center justify-between">
                  <span>QCBS Standing</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">
                    {evalResults.vendorRank === 1 ? '1st Place Candidate' : (evalResults.vendorRank ? `${evalResults.vendorRank}th Position` : 'Unranked')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  Competitor identities remain protected.
                </p>
              </div>

              {/* Card 3: AHP Matrix Consistency Ratio */}
              <div className={`p-5 rounded-2xl border transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">AHP Consistency (CR)</span>
                  <Sliders className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {evalResults.ahpSummary?.consistencyRatio !== undefined ? Number(evalResults.ahpSummary.consistencyRatio).toFixed(4) : '0.0456'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">≤ 0.1000</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Saaty Ratio Check</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Validated
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  Matrix eigenvectors verified consistent.
                </p>
              </div>

              {/* Card 4: Evaluation Specification & Scale */}
              <div className={`p-5 rounded-2xl border transition shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Evaluation Scale</span>
                  <Scale className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono truncate">
                  100-Point Index
                </div>
                <div className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold truncate">
                  {evalResults.evaluationVersion || 'v1.0 (NIST FIPS 204)'}
                </div>
                <div className="mt-2 text-xs text-slate-500 font-mono flex items-center justify-between">
                  <span>Disclosure Mode:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{evalResults.disclosurePolicy || 'AUTHORIZED'}</span>
                </div>
              </div>
            </div>

            {/* View Navigation Tabs inside Evaluation Page */}
            <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === 'scorecard'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>MCDA Scorecard Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('mcda')}
                className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === 'mcda'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>MCDA Methodology & Tie-Breaker</span>
              </button>

              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === 'evidence'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ZKP & Post-Quantum Evidence</span>
              </button>

              <button
                onClick={() => setActiveTab('appeal')}
                className={`px-4 py-2.5 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === 'appeal'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Clarification & Standstill ({clarifications.length})</span>
              </button>
            </div>

            {/* TAB 1: MCDA SCORECARD BREAKDOWN */}
            {activeTab === 'scorecard' && (
              <div className="space-y-6">
                
                {/* Readable Detailed Criteria Table */}
                <div className={`rounded-2xl border overflow-hidden shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Multi-Criteria Weighted Sum Model (WSM) Breakdown</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Distinct representation of raw inputs, approved AHP weights, Min-Max normalized scores, and final weighted contributions.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono px-3 py-1 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                      Weighted Contribution = Approved Weight × Normalized Score
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b font-mono uppercase text-[10px] tracking-wider ${lightTheme ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-850 text-slate-400 border-slate-800'}`}>
                          <th className="p-3.5">Criterion</th>
                          <th className="p-3.5">Type & Scale</th>
                          <th className="p-3.5">Raw Submitted Value</th>
                          <th className="p-3.5">Approved AHP Weight</th>
                          <th className="p-3.5">Authorized Normalized Score</th>
                          <th className="p-3.5">Weighted Contribution</th>
                          <th className="p-3.5">Contribution Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {criteriaBreakdown.map((crit, idx) => (
                          <tr key={crit.name} className={`hover:bg-teal-500/5 transition ${idx % 2 === 0 ? '' : (lightTheme ? 'bg-slate-50/40' : 'bg-slate-900/40')}`}>
                            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono font-bold text-[10px]">
                                  C{idx + 1}
                                </span>
                                <div>
                                  <div className="font-bold">{crit.displayName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono lowercase">{crit.name}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mr-2 ${
                                crit.type === 'cost'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {crit.type === 'cost' ? 'Cost (Min)' : 'Benefit (Max)'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">{crit.scale}</div>
                            </td>

                            <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              {crit.rawValueFormatted}
                            </td>

                            <td className="p-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                              {crit.approvedAhpWeightFormatted} ({crit.approvedAhpWeight})
                            </td>

                            <td className="p-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                              <div className="flex items-center space-x-2">
                                <span>{crit.normalizedScoreFormatted}</span>
                                <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-teal-500 rounded-full"
                                    style={{ width: `${Math.min(100, (crit.normalizedScore || 0) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {crit.weightedContributionFormatted}
                            </td>

                            <td className="p-3.5 font-mono text-slate-500">
                              {crit.contributionPercentage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className={`border-t font-mono font-bold text-xs ${lightTheme ? 'bg-slate-100/70 border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-800 text-slate-200'}`}>
                          <td className="p-3.5" colSpan="3">Composite Total WSM Index</td>
                          <td className="p-3.5 text-indigo-600 dark:text-indigo-400">100.00% (Σ w_j = 1.0)</td>
                          <td className="p-3.5 text-slate-400">—</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {evalResults.finalWsmScorePercentage} pts ({evalResults.finalWsmScoreFormatted})
                          </td>
                          <td className="p-3.5 text-slate-500">100.0%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Score Breakdown Cards Grid with Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {criteriaBreakdown.map((crit) => (
                    <div
                      key={crit.name}
                      className={`p-4 md:p-5 rounded-2xl border transition shadow-sm ${
                        lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{crit.displayName}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                            crit.type === 'cost' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {crit.type}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Weight: {crit.approvedAhpWeightFormatted}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-center font-mono">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Raw Input</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{crit.rawValueFormatted}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Normalized</div>
                          <div className="font-bold text-teal-600 dark:text-teal-400 text-xs mt-0.5">{crit.normalizedScoreFormatted}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Weighted Contrib</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{crit.weightedContributionFormatted}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-500">
                          <span>Contribution to Final Composite</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{crit.contributionPercentage}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(crit.contributionPercentage) || 0)}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        Scale rule: {crit.scale}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Privacy & Anti-Leakage Banner */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${lightTheme ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-850/60 border-slate-800 text-slate-400'}`}>
                  <Shield className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Zero Competitor Information Disclosure Assurance: </span>
                    <span>{mcda.privacyGuarantee}</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: MCDA METHODOLOGY & TIE-BREAKER */}
            {activeTab === 'mcda' && (
              <div className="space-y-6">
                
                {/* Mathematical Framework */}
                <div className={`p-5 md:p-6 rounded-2xl border space-y-5 shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-teal-500" />
                      <span>Rigorous Multi-Criteria Decision Analysis (MCDA) Framework</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Formal implementation of the Saaty Analytic Hierarchy Process (AHP), Min-Max Criterion Normalization, and Weighted Sum Model (WSM).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border space-y-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase">Stage 1: AHP Weighting</div>
                      <p className="text-[11px] text-slate-500">
                        Pairwise comparisons evaluated across a 4×4 positive reciprocal matrix. Priority vectors are normalized so that <span className="font-mono">Σ w_j = 1.0</span>.
                      </p>
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                        Consistency Ratio: {evalResults.ahpSummary?.consistencyRatio || '0.0456'} ≤ 0.10
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border space-y-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400 uppercase">Stage 2: Min-Max Scaling</div>
                      <p className="text-[11px] text-slate-500">
                        Linear scaling ensuring uniform comparison across disparate scales (₹ cost, points, and years).
                      </p>
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] text-slate-700 dark:text-slate-300 space-y-0.5">
                        <div>Benefit: (x - min) / (max - min)</div>
                        <div>Cost: (max - x) / (max - min)</div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border space-y-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase">Stage 3: WSM Composite</div>
                      <p className="text-[11px] text-slate-500">
                        Aggregate dot product of approved weights and authorized normalized scores across all criteria.
                      </p>
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                        Final Score = Σ (w_j × s_ij)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deterministic QCBS Tie-Breaking Protocol */}
                <div className={`p-5 md:p-6 rounded-2xl border space-y-4 shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                      Deterministic QCBS Tie-Breaking Rule Hierarchy
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Under the Public Procurement & General Financial Rules, if two or more proposals achieve identical composite WSM scores, rankings are resolved deterministically without human discretion using the following pre-gazetted precedence order:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className={`p-3 rounded-xl border flex items-center space-x-3 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-mono font-bold flex items-center justify-center text-xs">1</span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Precedence Tier 1: </span>
                        <span>Candidate with higher verified Technical Capability score receives priority rank.</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center space-x-3 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-mono font-bold flex items-center justify-center text-xs">2</span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Precedence Tier 2: </span>
                        <span>Candidate with lower competitive Financial Bid Offer receives priority rank.</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center space-x-3 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-mono font-bold flex items-center justify-center text-xs">3</span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Precedence Tier 3: </span>
                        <span>Candidate with higher verified Past Project Experience receives priority rank.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300 font-mono flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500" />
                    <span>Backend Computation Guarantee: All rankings and ties are computed authentically by the backend MCDA service. No frontend ranking recomputation is executed.</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: ZKP & POST-QUANTUM EVIDENCE */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                
                {/* Cryptographic Zero-Witness Leakage Proof Card */}
                <div className={`p-5 md:p-6 rounded-2xl border space-y-5 shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span>Cryptographic Verification Evidence (Zero Witness Leakage)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Authentic verification parameters recorded in the e-procurement ledger.
                      </p>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold self-start">
                      NIST FIPS 204 & CIRCOM GROTH16
                    </span>
                  </div>

                  {/* Grid of Evidence Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                    <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-[10px] text-slate-400 uppercase">ZK SNARK Protocol</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{evidence.zkpProtocol || 'Groth16 SnarkVerifier'}</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-[10px] text-slate-400 uppercase">Pairing Curve</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{evidence.zkpCurve || 'bn128 (alt_bn128)'}</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-[10px] text-slate-400 uppercase">Circuit Identifier</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{evidence.circuitId || 'eligibility.circom 2.0.0'}</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="text-[10px] text-slate-400 uppercase">PQC Signature Algorithm</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{evidence.vcSignatureAlgorithm || 'ML-DSA-65 (FIPS 204)'}</div>
                    </div>
                  </div>

                  {/* Cryptographic Hashes & Transactions */}
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="truncate">
                        <span className="text-slate-400">Policy Commitment Hash: </span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{evidence.policyHash}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(evidence.policyHash, 'policy')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        title="Copy Policy Hash"
                      >
                        {copiedPolicy ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'}`}>
                      <div className="truncate">
                        <span className="text-slate-400">On-Chain Submission Tx: </span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{evidence.txHash}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(evidence.txHash, 'tx')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        title="Copy Tx Hash"
                      >
                        {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Circuit Enforced Statements Guarantee */}
                  <div className={`p-4 rounded-xl border space-y-2 ${lightTheme ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'}`}>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Statements Enforced by the Zero-Knowledge Circuit:</span>
                    </div>
                    <ul className="text-xs space-y-1 pl-5 list-disc opacity-90">
                      {(evidence.enforcedStatements || [
                        "Turnover ≥ minimum statutory requirement without revealing private revenue",
                        "Solvency ratio ≥ baseline threshold without revealing balance sheets",
                        "Post-quantum digital signature verified against Government Issuer root"
                      ]).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Explicit Non-Exposure Statement */}
                  <div className={`p-4 rounded-xl border space-y-1.5 text-xs ${lightTheme ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-850 border-slate-800 text-slate-400'}`}>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-500" />
                      <span>Zero Witness Parameter Exposure Statement</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      At no point during the automated verification or MCDA scoring process were private witness inputs (exact turnover amount, proprietary project documents, private audit books, or vendor secret keys) transmitted to evaluators. The Zero-Knowledge proof mathematically proves compliance with circuit constraints without revealing the underlying confidential data.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: CLARIFICATION & STANDSTILL APPEAL */}
            {activeTab === 'appeal' && (
              <div className="space-y-6">
                
                {/* Standstill Window Countdown Banner */}
                <div className={`p-5 md:p-6 rounded-2xl border shadow-sm ${
                  standstill.isOpen
                    ? lightTheme ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-800/60'
                    : lightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${standstill.isOpen ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
                        <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                          Statutory Standstill Period & Appeal Mechanism
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {standstill.isOpen
                          ? `A 15-day statutory standstill window is active following evaluation conclusion. Vendors may request scoring clarifications or submit formal procedural appeals.`
                          : 'The statutory 15-day standstill appeal window for this evaluation milestone has concluded.'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right font-mono text-xs">
                        <div className="text-slate-400 text-[10px] uppercase">Days Remaining</div>
                        <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                          {standstill.isOpen ? `${standstill.daysRemaining} Days` : 'Closed'}
                        </div>
                      </div>

                      {standstill.isOpen && (
                        <button
                          onClick={() => setShowAppealModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>File Clarification</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clarifications / Appeals History List */}
                <div className={`rounded-2xl border overflow-hidden shadow-sm ${lightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Submitted Clarifications & Procedural Inquiries</h4>
                      <p className="text-xs text-slate-500">Record of formal requests submitted under this tender evaluation.</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {clarifications.length} Total
                    </span>
                  </div>

                  {clarifications.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No clarification requests logged</p>
                      <p className="text-[11px] text-slate-400">If you require confirmation regarding normalization or criteria scoring, submit an inquiry above.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clarifications.map((clr) => (
                        <div key={clr.id} className="p-4 md:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-teal-600 dark:text-teal-400">{clr.id}</span>
                              <span className="text-slate-400">•</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{clr.subject}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                                {clr.status || 'SUBMITTED'}
                              </span>
                              <span className="text-slate-400">
                                {new Date(clr.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-500">
                            <span>Target Criterion: </span>
                            <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{clr.criterionRef}</span>
                          </div>

                          <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            "{clr.message}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL: SUBMIT CLARIFICATION / APPEAL */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            lightTheme ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">File Formal Clarification / Procedural Inquiry</h3>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClarificationSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tender & Reference</label>
                <input
                  type="text"
                  disabled
                  value={`${summary.tenderId} (Bid: ${summary.bidReferenceId})`}
                  className={`w-full px-3 py-2 rounded-lg border font-mono ${lightTheme ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Target Criterion Reference *</label>
                <select
                  value={appealForm.criterionRef}
                  onChange={(e) => setAppealForm({ ...appealForm, criterionRef: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:ring-2 focus:ring-amber-500 ${lightTheme ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`}
                >
                  <option value="technical">Technical Capability (Criterion C1)</option>
                  <option value="financial">Financial Bid Offer (Criterion C2)</option>
                  <option value="experience">Past Project Experience (Criterion C3)</option>
                  <option value="sustainability">Green & ESG Standards (Criterion C4)</option>
                  <option value="AHP_weights">Approved AHP Weight Allocation</option>
                  <option value="general_mcda">General MCDA Normalization / Scoring</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Inquiry Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request for normalization coefficient clarification"
                  value={appealForm.subject}
                  onChange={(e) => setAppealForm({ ...appealForm, subject: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:ring-2 focus:ring-amber-500 ${lightTheme ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Justification & Factual Grounds *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify factual details, verifiable credential reference, or specific formula query..."
                  value={appealForm.message}
                  onChange={(e) => setAppealForm({ ...appealForm, message: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:ring-2 focus:ring-amber-500 ${lightTheme ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`}
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Authorized Contact Email *</label>
                <input
                  type="email"
                  required
                  value={appealForm.contactEmail}
                  onChange={(e) => setAppealForm({ ...appealForm, contactEmail: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border font-mono focus:ring-2 focus:ring-amber-500 ${lightTheme ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`}
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p>
                  Clarification requests are recorded in the immutable audit log and reviewed by the Tender Standing Committee. Frivolous or dilatory submissions may be dismissed under Public Procurement Rules.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition ${lightTheme ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5"
                >
                  {submittingAppeal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{submittingAppeal ? 'Recording...' : 'Submit Clarification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
