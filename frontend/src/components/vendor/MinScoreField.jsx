import React, { useState } from 'react';
import { Sliders, Lock } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function MinScoreField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const minScore = Number(requirements.minimumScore || 70);

  const [score, setScore] = useState(initialData?.score || 85);
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleScoreChange = (val) => {
    const num = Number(val);
    setScore(num);
    emitChange(num, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(score, uploadedDoc);
  };

  const emitChange = (scoreVal, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'MIN_SCORE',
      data: { score: scoreVal },
      documents: document ? [document] : []
    });
  };

  const isCompliant = score >= minScore;

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Quality & Capability Audit Score'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-purple-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          isCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          {isCompliant ? '✓ SCORE THRESHOLD MET' : `BELOW THRESHOLD (${minScore})`}
        </span>
      </div>

      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">Minimum Required Capability Score:</span>
        <span className="text-purple-300 font-extrabold text-sm">{minScore} Points</span>
      </div>

      <div className="space-y-2 font-mono">
        <label className="block text-xs font-bold text-slate-300 font-sans">Your Verified Rating Score (Points):</label>
        <input
          type="number"
          value={score}
          onChange={(e) => handleScoreChange(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-purple-300 font-bold text-sm focus:border-purple-500 outline-none"
        />
      </div>

      <DocumentUploader
        label="Upload Third-Party Quality Rating Report"
        documentType="QUALITY_RATING_REPORT"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
