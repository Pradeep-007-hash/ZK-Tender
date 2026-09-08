import React, { useState, useEffect } from 'react';
import { Award, BarChart3, Calculator, CheckCircle2, AlertTriangle, Play, RefreshCw, Trophy, ShieldCheck, FileSpreadsheet, ArrowUpRight } from 'lucide-react';

export default function EvaluationDashboard({ selectedTenderId = 'T001', currentUser }) {
  const [tenderId, setTenderId] = useState(selectedTenderId);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // AHP Criteria Configuration State
  const [criteria, setCriteria] = useState([
    { name: 'technical', displayName: 'Technical Score', type: 'benefit' },
    { name: 'financial', displayName: 'Financial Bid Price', type: 'cost' },
    { name: 'experience', displayName: 'Experience', type: 'benefit' },
    { name: 'sustainability', displayName: 'Sustainability', type: 'benefit' }
  ]);

  // Default Pairwise Matrix matching prompt sample
  const [matrix, setMatrix] = useState([
    [1, 3, 5, 7],
    [0.3333, 1, 3, 5],
    [0.2, 0.3333, 1, 3],
    [0.1428, 0.2, 0.3333, 1]
  ]);

  const [weights, setWeights] = useState({
    technical: 0.35,
    financial: 0.40,
    experience: 0.15,
    sustainability: 0.10
  });

  const [ahpSummary, setAhpSummary] = useState({
    consistencyRatio: 0.0456,
    isConsistent: true
  });

  const [evaluationResult, setEvaluationResult] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  // Load existing evaluation results or weights
  useEffect(() => {
    fetchEvaluationResults();
  }, [tenderId]);

  const fetchEvaluationResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/evaluation/results`);
      const data = await res.json();
      setLoading(false);

      if (data.success && data.evaluationResult) {
        setEvaluationResult(data.evaluationResult);
        if (data.evaluationResult.weights) {
          setWeights(data.evaluationResult.weights);
        }
        if (data.evaluationResult.ahpSummary) {
          setAhpSummary(data.evaluationResult.ahpSummary);
        }
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const handleMatrixChange = (r, c, val) => {
    const numVal = parseFloat(val);
    if (isNaN(numVal) || numVal <= 0) return;

    const newMatrix = matrix.map(row => [...row]);
    newMatrix[r][c] = numVal;
    if (r !== c) {
      newMatrix[c][r] = parseFloat((1 / numVal).toFixed(4));
    }
    setMatrix(newMatrix);
  };

  const handleComputeAHP = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/evaluation/weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criteriaConfig: criteria,
          ahpMatrix: matrix
        })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setWeights(data.weights);
        setAhpSummary(data.ahpSummary);
        showToast('AHP pairwise matrix validated and weights calculated successfully!', 'success');
      } else {
        showToast(data.message || 'Inconsistent matrix configuration', 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error calculating AHP weights', 'error');
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/evaluation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setEvaluating(false);

      if (data.success && data.evaluationResult) {
        setEvaluationResult(data.evaluationResult);
        showToast(`Bid evaluation completed! Winner recommended: ${data.evaluationResult.winner}`, 'success');
      } else {
        showToast(data.message || 'Evaluation failed. Make sure eligible bids exist.', 'error');
      }
    } catch (err) {
      setEvaluating(false);
      showToast('Error running bid evaluation pipeline', 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold ${
          toast.type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-200' :
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-200' :
          'bg-slate-900 border-slate-800 text-teal-300'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest font-semibold">
              MCDA Decision Module
            </span>
            <span className="text-xs text-slate-400 font-mono">Stage 2: Post-Eligibility Scoring</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-teal-400" />
            <span>Bid Evaluation & Ranking Module</span>
          </h2>
          <p className="text-xs text-slate-400">
            Combines <strong>AHP</strong> (Criterion Weights), <strong>Min-Max Normalization</strong> (Benefit/Cost), <strong>WSM</strong> (Weighted Sum Model), and <strong>Deterministic Ranking</strong>.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
        >
          {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
          <span>Run Bid Evaluation Pipeline</span>
        </button>
      </div>

      {/* Grid: AHP Matrix & Weight Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AHP Pairwise Comparison Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>AHP Pairwise Comparison Matrix</span>
              </h3>
              <span className="text-[11px] text-slate-400">Saaty 1-9 Scale relative importance matrix</span>
            </div>

            <button
              onClick={handleComputeAHP}
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-xs rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <Calculator className="w-3.5 h-3.5 text-teal-400" />}
              <span>Compute AHP Weights</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-2 text-left">Criteria</th>
                  {criteria.map((c, i) => (
                    <th key={i} className="p-2 capitalize">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((rowCrit, r) => (
                  <tr key={r} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                    <td className="p-2 text-left font-semibold text-white capitalize flex items-center space-x-1.5">
                      <span>{rowCrit.name}</span>
                      <span className={`text-[9px] font-mono px-1 rounded ${rowCrit.type === 'cost' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                        {rowCrit.type}
                      </span>
                    </td>
                    {criteria.map((colCrit, c) => (
                      <td key={c} className="p-1.5">
                        {r === c ? (
                          <div className="py-1 px-2 bg-slate-950 rounded border border-slate-800 font-mono font-bold text-teal-400">1</div>
                        ) : (
                          <input
                            type="number"
                            step="0.0001"
                            min="0.01"
                            max="9"
                            value={matrix[r][c]}
                            onChange={(e) => handleMatrixChange(r, c, e.target.value)}
                            className="w-16 p-1 text-center bg-slate-950 border border-slate-800 rounded text-xs font-mono text-white focus:border-teal-500 focus:outline-none"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Consistency Ratio Info */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-mono">Consistency Ratio (CR):</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                ahpSummary?.isConsistent !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                CR = {ahpSummary?.consistencyRatio !== undefined ? ahpSummary.consistencyRatio : '0.0456'}
              </span>
            </div>

            <span className={`text-[11px] font-mono ${ahpSummary?.isConsistent !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ahpSummary?.isConsistent !== false ? '✓ Valid (CR ≤ 0.10 Threshold)' : '⚠ Inconsistent Matrix (CR > 0.10)'}
            </span>
          </div>
        </div>

        {/* Derived Criterion Weights Summary (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Award className="w-4 h-4 text-teal-400" />
              <span>Calculated Criterion Weights</span>
            </h3>

            <div className="space-y-3 mt-4">
              {criteria.map((c, i) => {
                const w = weights[c.name] || 0.25;
                const pct = (w * 100).toFixed(1);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-200">{c.displayName || c.name}</span>
                      <span className="font-mono text-teal-400">{pct}% ({w})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl text-xs text-teal-300 space-y-1">
            <span className="font-semibold block text-teal-200">AHP Priority Vector Guarantee:</span>
            <p className="text-[11px] text-teal-300/80">
              Weights are derived from the principal eigenvector ($\lambda_{\max} = {ahpSummary?.lambdaMax || 4.12}$) and normalized so $\sum W = 1.0$.
            </p>
          </div>
        </div>

      </div>

      {/* Winner Recommendation Banner */}
      {evaluationResult?.winner && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Recommended Winning Bidder</span>
              <h3 className="text-lg font-bold text-white">{evaluationResult.winner}</h3>
              <p className="text-xs text-slate-300">
                Highest Composite WSM Score: <strong className="text-emerald-400">{(evaluationResult.rankings?.[0]?.finalScore * 100).toFixed(2)}%</strong>
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <div>Eligible Bids Evaluated: <span className="text-teal-400 font-bold">{evaluationResult.eligibleBidsCount}</span> / {evaluationResult.totalBidsCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Evaluation Version: #{evaluationResult.evaluationVersion}</div>
          </div>
        </div>
      )}

      {/* Ranking Results Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-400" />
              <span>Final Bid Evaluation & Ranking Table</span>
            </h3>
            <p className="text-xs text-slate-400">
              ZKP Eligibility Filtered Bids → Min-Max Normalization → Weighted Sum Model (WSM) Scoring
            </p>
          </div>

          {evaluationResult && (
            <span className="text-xs font-mono text-teal-400 bg-teal-950/40 px-3 py-1 rounded-lg border border-teal-500/30">
              {evaluationResult.eligibleBidsCount} Eligible Bids Evaluated
            </span>
          )}
        </div>

        {evaluationResult?.rankings && evaluationResult.rankings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Vendor / Bidder ID</th>
                  <th className="p-3">Technical Score</th>
                  <th className="p-3">Bid Price (Cost)</th>
                  <th className="p-3">Experience</th>
                  <th className="p-3">Sustainability</th>
                  <th className="p-3 text-center">WSM Final Score</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {evaluationResult.rankings.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      row.isWinner
                        ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500 hover:bg-emerald-950/40'
                        : 'hover:bg-slate-950/40'
                    }`}
                  >
                    <td className="p-3 text-center font-mono font-bold">
                      {row.isWinner ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-400">#{row.rank}</span>
                      )}
                    </td>

                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{row.vendorId}</span>
                        {row.isWinner && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            WINNER
                          </span>
                        )}
                      </div>
                      {row.vendorName && <span className="text-[10px] text-slate-400 block">{row.vendorName}</span>}
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      <div>{row.criteria?.technical || '-'}</div>
                      <span className="text-[9px] text-teal-400">norm: {row.normalizedCriteria?.technical ?? '-'}</span>
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      <div>₹{row.criteria?.financial || row.criteria?.price || '-'}</div>
                      <span className="text-[9px] text-teal-400">norm: {row.normalizedCriteria?.financial ?? '-'}</span>
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      <div>{row.criteria?.experience || '-'} Yrs</div>
                      <span className="text-[9px] text-teal-400">norm: {row.normalizedCriteria?.experience ?? '-'}</span>
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      <div>{row.criteria?.sustainability || '-'}</div>
                      <span className="text-[9px] text-teal-400">norm: {row.normalizedCriteria?.sustainability ?? '-'}</span>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-sm">
                      <span className={row.isWinner ? 'text-emerald-400 font-extrabold' : 'text-white'}>
                        {(row.finalScore * 100).toFixed(2)}%
                      </span>
                      <span className="block text-[10px] text-slate-400 font-normal">score: {row.finalScore}</span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 mr-1" /> ZK Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <BarChart3 className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">No evaluation results calculated yet for Tender <strong>{tenderId}</strong>.</p>
            <button
              onClick={handleRunEvaluation}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Run Evaluation Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
