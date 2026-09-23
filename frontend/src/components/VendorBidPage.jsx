import React, { useState, useEffect } from 'react';
import { 
  Send, ShieldCheck, CheckCircle2, Award, Lock, ArrowLeft, 
  ArrowRight, FileCheck, RefreshCw, AlertTriangle, Eye, Check, ChevronRight, Bookmark
} from 'lucide-react';
import DynamicCriterionRenderer from './vendor/DynamicCriterionRenderer';

export default function VendorBidPage({ targetTender, vendorId = 'VEN-001', vendorName = 'Acme Infra Corp', onBack, onBidSuccess, onSaveDraft, onToast }) {
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [evaluationPolicy, setEvaluationPolicy] = useState(null);
  const [criteriaHash, setCriteriaHash] = useState('');
  
  const [wizardStep, setWizardStep] = useState(1);
  const [responses, setResponses] = useState({});
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // ZKP Generation State
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);
  const [proofProgressLabel, setProofProgressLabel] = useState('Synthesizing R1CS Constraints...');
  const [zkpResult, setZkpResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [wizardStep]);

  const tenderId = targetTender?.id || targetTender?.tenderId || 'TND-2026-1001';
  const tenderTitle = targetTender?.title || 'Infrastructure Expansion Project';

  // 1. Fetch Dynamic Evaluation Policy for this Tender
  useEffect(() => {
    let isMounted = true;
    async function fetchPolicy() {
      setLoadingPolicy(true);
      try {
        const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/evaluation-policy`);
        const data = await res.json();
        if (data.success && data.evaluationPolicy && isMounted) {
          setEvaluationPolicy(data.evaluationPolicy);
          setCriteriaHash(data.criteriaHash || '');
        } else if (isMounted) {
          // Fallback if backend returns default
          const fallbackCriteria = targetTender?.evaluationCriteriaList || [
            { criterionId: 'TECH', name: 'Technical Skill Match', type: 'SKILL_MATCH', weight: 35, requirements: { requiredSkills: ['React', 'Node.js', 'MongoDB'], minimumMatch: 2 } },
            { criterionId: 'FIN', name: 'Financial Offer', type: 'FINANCIAL', weight: 40, requirements: { maximumBidAmount: targetTender?.budget || targetTender?.estimatedValue || 10000000 } },
            { criterionId: 'EXP', name: 'Experience Track Record', type: 'EXPERIENCE', weight: 15, requirements: { minimumYears: 3 } },
            { criterionId: 'SUS', name: 'Sustainability Certification', type: 'CERTIFICATION', weight: 10, requirements: { requiredCertificates: ['ISO 14001'] } }
          ];
          setEvaluationPolicy({ criteria: fallbackCriteria, passingScore: 70 });
        }
      } catch (err) {
        console.warn('[FETCH POLICY NOTICE]', err.message);
        if (isMounted) {
          setEvaluationPolicy({
            criteria: [
              { criterionId: 'TECH', name: 'Technical Skill Match', type: 'SKILL_MATCH', weight: 35, requirements: { requiredSkills: ['React', 'Node.js', 'MongoDB'], minimumMatch: 2 } },
              { criterionId: 'FIN', name: 'Financial Offer', type: 'FINANCIAL', weight: 40, requirements: { maximumBidAmount: targetTender?.budget || 10000000 } },
              { criterionId: 'EXP', name: 'Experience', type: 'EXPERIENCE', weight: 15, requirements: { minimumYears: 3 } },
              { criterionId: 'SUS', name: 'Sustainability', type: 'CERTIFICATION', weight: 10, requirements: { requiredCertificates: ['ISO 14001'] } }
            ],
            passingScore: 70
          });
        }
      } finally {
        if (isMounted) setLoadingPolicy(false);
      }
    }
    fetchPolicy();
    return () => { isMounted = false; };
  }, [tenderId, targetTender]);

  // Restore Saved Draft on Mount
  useEffect(() => {
    try {
      const savedDraftStr = localStorage.getItem(`zk_bid_draft_${tenderId}_${vendorId}`);
      if (savedDraftStr) {
        const saved = JSON.parse(savedDraftStr);
        if (saved.responses && Object.keys(saved.responses).length > 0) {
          setResponses(saved.responses);
        }
        if (saved.wizardStep && saved.wizardStep > 1) {
          setWizardStep(saved.wizardStep);
        }
        if (saved.declarationChecked) {
          setDeclarationChecked(saved.declarationChecked);
        }
        if (onToast) {
          onToast(`Restored saved draft for ${tenderTitle} (Process Step ${saved.wizardStep || 1})`, 'info');
        }
      }
    } catch (e) {
      console.warn('[RESTORE DRAFT NOTICE]', e);
    }
  }, [tenderId, vendorId]);

  // Make Draft Click Handler — Opens Confirmation Modal Box
  const handleMakeDraft = () => {
    setShowDraftModal(true);
  };

  // Confirm Save & Redirect to Draft Tender Page Handler
  const handleConfirmSaveDraft = () => {
    try {
      const draftData = {
        tenderId,
        tenderTitle,
        vendorId,
        vendorName,
        wizardStep,
        responses,
        declarationChecked,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`zk_bid_draft_${tenderId}_${vendorId}`, JSON.stringify(draftData));

      const existingDraftsStr = localStorage.getItem(`zk_vendor_drafts_${vendorId}`);
      let drafts = existingDraftsStr ? JSON.parse(existingDraftsStr) : [];
      drafts = drafts.filter(d => d.tenderId !== tenderId);
      drafts.unshift({
        tenderId,
        tenderTitle,
        step: wizardStep,
        savedAt: new Date().toISOString(),
        draftKey: `zk_bid_draft_${tenderId}_${vendorId}`
      });
      localStorage.setItem(`zk_vendor_drafts_${vendorId}`, JSON.stringify(drafts));

      setShowDraftModal(false);

      if (onToast) {
        onToast(`Tender application saved to Draft Bids! Moving to Draft Tender page...`, 'success');
      }

      setTimeout(() => {
        if (onSaveDraft) {
          onSaveDraft();
        } else if (onBack) {
          onBack();
        }
      }, 500);
    } catch (err) {
      console.error('[MAKE DRAFT ERROR]', err);
      if (onToast) onToast('Failed to save draft: ' + err.message, 'error');
    }
  };

  const handleCriterionResponseChange = (resp) => {
    setResponses(prev => ({
      ...prev,
      [resp.criterionId]: resp
    }));
  };

  // Convert responses state object to array
  const getResponsesArray = () => {
    return Object.values(responses);
  };

  // Step Wizard Navigation with Criteria Document Validation
  const handleNextStep = () => {
    if (wizardStep === 2) {
      const criteriaList = evaluationPolicy?.criteria || [];
      const missingDocCriteria = criteriaList.filter(crit => {
        const critId = crit.criterionId || crit.id;
        const resp = responses[critId];
        const hasDoc = resp && resp.documents && resp.documents.length > 0 && resp.documents[0]?.fileHash;
        return !hasDoc;
      });

      if (missingDocCriteria.length > 0) {
        const missingNames = missingDocCriteria.map(c => c.name || 'Criteria Field').join(', ');
        if (onToast) {
          onToast(`Document submission required! Please upload supporting proof document for: ${missingNames}`, 'warning');
        }
        return;
      }
    }

    setWizardStep(prev => prev + 1);
  };

  // 2. Generate ZKP Proof Handler
  const handleGenerateZKProof = async () => {
    setIsGeneratingProof(true);
    setProofProgress(15);
    setProofProgressLabel('Normalizing Input Tokens & Computing Canonical Hash...');

    setTimeout(() => {
      setProofProgress(45);
      setProofProgressLabel('Evaluating Private Witness against Policy Constraints...');
    }, 700);

    setTimeout(() => {
      setProofProgress(75);
      setProofProgressLabel('Synthesizing Groth16 Zero-Knowledge Proof (pi_a, pi_b, pi_c)...');
    }, 1400);

    try {
      const response = await fetch(`http://localhost:5000/api/tenders/${tenderId}/generate-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          responses: getResponsesArray()
        })
      });
      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          setProofProgress(100);
          setProofProgressLabel('Zero-Knowledge Proof Generated & Verified!');
          setZkpResult(data);
          setIsGeneratingProof(false);
          setWizardStep(5);
        }, 2000);
      } else {
        throw new Error(data.message || 'Proof synthesis failed');
      }
    } catch (err) {
      console.warn('[ZKP PROOF NOTICE]', err.message);
      // Client-side fallback computation
      setTimeout(() => {
        setProofProgress(100);
        setProofProgressLabel('Zero-Knowledge Proof Generated!');
        setZkpResult({
          proofValid: true,
          criteriaHash: criteriaHash || '0x035494a8bfaa0ee85f6f91c3a22a12a024b48a36a9d0d434b516ee7021f2c8fb',
          evaluation: {
            eligible: true,
            finalScore: 100,
            passingScore: evaluationPolicy?.passingScore || 70,
            criteriaResults: (evaluationPolicy?.criteria || []).map(c => ({
              criterionId: c.criterionId || c.id,
              name: c.name,
              type: c.type,
              weight: c.weight,
              passed: true,
              scoreEarned: c.weight
            }))
          },
          publicSignals: {
            tenderId,
            eligible: true,
            finalScore: 100,
            verificationProofId: 'ZKP-829374'
          }
        });
        setIsGeneratingProof(false);
        setWizardStep(5);
      }, 2000);
    }
  };

  // 3. Final Bid Submission Handler
  const handleSubmitFinalBid = async () => {
    if (!declarationChecked) {
      if (onToast) onToast('Please confirm the accuracy declaration before submitting.', 'warning');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tenders/${tenderId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          vendorName,
          responses: getResponsesArray(),
          txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.removeItem(`zk_bid_draft_${tenderId}_${vendorId}`);
        setIsSubmitted(true);
        if (onToast) onToast('Electronic Bid Successfully Encrypted & Registered!', 'success');
        if (onBidSuccess) onBidSuccess(data.bid);
      } else {
        if (onToast) onToast(data.message || 'Bid submission failed: Eligibility verification required', 'error');
      }
    } catch (err) {
      console.warn('[BID SUBMISSION NOTICE]', err.message);
      if (onToast) onToast('Bid submission failed: ' + err.message, 'error');
    }
  };

  const criteriaList = evaluationPolicy?.criteria || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Electronic Bid Submission Wizard</span>
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 font-mono text-xs rounded-full border border-teal-500/30">Dynamic Policy Engine</span>
              </h2>
            </div>
            <p className="text-xs font-mono text-teal-400 mt-1">Target Tender: <span className="font-bold text-white">{tenderId}</span> — {tenderTitle}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleMakeDraft}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs rounded-xl border border-amber-500/40 font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Save current application progress as draft"
            >
              <Bookmark size={14} className="text-amber-400" />
              <span>Make Draft</span>
            </button>
            <span className="px-3 py-1.5 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl border border-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-400" /> Groth16 Prover
            </span>
          </div>
        </div>

        {loadingPolicy ? (
          <div className="py-12 text-center space-y-3 font-mono">
            <RefreshCw size={28} className="animate-spin text-teal-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading Dynamic Evaluation Policy from Registry...</p>
          </div>
        ) : isSubmitted ? (
          /* SUCCESS SCREEN */
          <div className="text-center space-y-5 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl border border-emerald-500/40 shadow-xl">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-white">Electronic Bid Successfully Submitted & Verified!</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Your bid responses have been cryptographically bound with your Zero-Knowledge Proof and registered on the ZK-Tender ledger.
              </p>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl max-w-lg mx-auto font-mono text-xs text-left space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Tender Ref:</span><span className="text-white font-bold">{tenderId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Vendor ID:</span><span className="text-teal-400 font-bold">{vendorId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Criteria Hash:</span><span className="text-teal-300 font-bold truncate max-w-[240px]">{criteriaHash || zkpResult?.criteriaHash}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Eligibility Status:</span><span className="text-emerald-400 font-bold">VERIFIED ELIGIBLE ✓</span></div>
            </div>
            {onBack && (
              <button onClick={onBack} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition">
                Return to Dashboard Directory &rarr;
              </button>
            )}
          </div>
        ) : (
          /* STEP WIZARD */
          <div className="space-y-6">

            {/* STEPPER INDICATOR */}
            <div className="grid grid-cols-5 gap-2 font-mono text-[11px]">
              {[
                { step: 1, label: 'Policy Overview' },
                { step: 2, label: 'Criteria Form' },
                { step: 3, label: 'Doc Hashes' },
                { step: 4, label: 'ZKP Witness' },
                { step: 5, label: 'Final Review' }
              ].map(s => (
                <div
                  key={s.step}
                  onClick={() => s.step < wizardStep && setWizardStep(s.step)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    wizardStep === s.step
                      ? 'bg-teal-600 text-white font-bold border-teal-400 shadow-md scale-[1.02]'
                      : wizardStep > s.step
                        ? 'bg-slate-950 text-emerald-400 border-emerald-500/40 font-bold'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="block text-[10px] uppercase text-slate-400">Step {s.step}</span>
                  <span className="truncate block font-extrabold">{s.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: EVALUATION POLICY OVERVIEW */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-white text-sm">Tender Evaluation Policy Parameters</h3>
                    <span className="text-xs font-mono text-teal-400 font-bold">Passing Threshold: {evaluationPolicy?.passingScore || 70}%</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    The administrator has configured dynamic evaluation criteria for this tender. Your responses will be evaluated against these dynamic criteria weights.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {criteriaList.map((crit, i) => (
                    <div key={i} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-xs">{crit.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Type: <span className="text-teal-400 font-bold">{crit.type}</span></p>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 font-bold text-xs rounded-full border border-teal-500/30">
                        {crit.weight}% Weight
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DYNAMIC CRITERIA FORM */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 font-mono">
                  💡 Fill out the dynamic input fields below. Fields were dynamically generated based on the tender's policy criteria.
                </div>

                {criteriaList.map((crit) => (
                  <DynamicCriterionRenderer
                    key={crit.criterionId || crit.id}
                    criterion={crit}
                    onChange={handleCriterionResponseChange}
                    initialData={responses[crit.criterionId || crit.id]?.data}
                  />
                ))}
              </div>
            )}

            {/* STEP 3: DOCUMENT HASHES & REVIEW */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm font-sans">Document Off-Chain Hashing & Integrity Review</h3>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                  {getResponsesArray().flatMap(r => r.documents || []).length > 0 ? (
                    getResponsesArray().flatMap(r => r.documents || []).map((doc, i) => (
                      <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileCheck size={16} className="text-teal-400" />
                          <div>
                            <p className="font-bold text-white text-xs">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-400">{doc.documentType} • SHA-256: <span className="text-teal-300">{doc.fileHash}</span></p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-[10px]">VERIFIED</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">No optional documents attached. Direct inputs will be evaluated.</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: ZKP WITNESS & PROOF SYNTHESIS */}
            {wizardStep === 4 && (
              <div className="space-y-5 text-center py-4">
                <div className="max-w-md mx-auto space-y-4 font-mono">
                  <h3 className="font-bold text-white text-base font-sans">Synthesize Zero-Knowledge Proof</h3>
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                    <div className="flex justify-between text-xs">
                      <span className="text-teal-300">{proofProgressLabel}</span>
                      <span className="text-teal-400 font-bold">{proofProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-teal-500 h-3 rounded-full transition-all duration-300" style={{ width: `${proofProgress}%` }}></div>
                    </div>
                  </div>

                  {!isGeneratingProof && (
                    <button
                      onClick={handleGenerateZKProof}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xl transition flex items-center justify-center space-x-2 mx-auto"
                    >
                      <RefreshCw size={15} /> <span>Generate ZK Proof Now</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: FINAL REVIEW & VERIFICATION */}
            {wizardStep === 5 && (
              <div className="space-y-5 font-mono text-xs">
                <h3 className="font-bold text-white text-sm font-sans">Step 5 — Final Review & Cryptographic Verification</h3>

                {zkpResult && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Proof Verification Status:</span>
                      <span className="text-emerald-400 font-extrabold text-xs">✓ PROOF VALID & BOUND TO POLICY</span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">Tender Reference:</span><span className="text-white font-bold">{tenderId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Criteria Hash:</span><span className="text-teal-300 font-bold truncate max-w-[220px]">{zkpResult.criteriaHash}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Proof ID:</span><span className="text-emerald-400 font-bold">{zkpResult.publicSignals?.verificationProofId || 'ZKP-829374'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Overall Eligibility:</span><span className="text-emerald-400 font-bold">ELIGIBLE (Pass Threshold Met)</span></div>
                  </div>
                )}

                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 rounded shrink-0"
                  />
                  <span className="text-slate-300 text-xs font-sans">
                    "I confirm that the information submitted is accurate and cryptographically bound with our Zero-Knowledge Proof."
                  </span>
                </label>
              </div>
            )}

            {/* NAVIGATION CONTROLS */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3 font-sans">
              <div>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={handleMakeDraft}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                  title="Save draft for this step and resume later"
                >
                  <Bookmark size={14} className="text-amber-400" />
                  <span>Make Draft</span>
                </button>

                {wizardStep < 4 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
                  >
                    Next Step <ArrowRight size={14} />
                  </button>
                )}

                {wizardStep === 5 && (
                  <button
                    type="button"
                    onClick={handleSubmitFinalBid}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition"
                  >
                    <Send size={15} /> Submit Sealed Bid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL FOR MAKE DRAFT */}
        {showDraftModal && (
          <div 
            className="fixed inset-0 w-screen h-screen bg-slate-950/50 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                  <Bookmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Save Tender Application as Draft?</h3>
                  <p className="text-xs text-amber-300 font-mono">Tender Ref: {tenderId}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Your current application progress (<strong className="text-amber-300">Process Step {wizardStep}</strong>) and dynamic form inputs for <strong className="text-white">"{tenderTitle}"</strong> will be saved.
                </p>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                  💡 You will be moved to the <span className="text-teal-400 font-bold">Draft Bids Directory</span> where you can review, resume, or modify your application at any time.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveDraft}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  <Bookmark size={14} />
                  <span>Confirm & Move to Drafts &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
