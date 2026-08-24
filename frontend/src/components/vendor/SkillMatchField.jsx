import React, { useState } from 'react';
import { Cpu, Check, Plus, Lock, ShieldCheck } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

const PRESET_SKILLS = [
  'React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Python',
  'Solidity', 'TypeScript', 'Kubernetes', 'Cybersecurity', 'ISO 27001', 'PostgreSQL'
];

export default function SkillMatchField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const requiredSkills = requirements.requiredSkills || ['React', 'Node.js', 'MongoDB'];
  const minimumMatch = requirements.minimumMatch || 2;

  const [selectedSkills, setSelectedSkills] = useState(initialData?.skills || ['React', 'Node.js', 'MongoDB']);
  const [customSkill, setCustomSkill] = useState('');
  const [doc, setDoc] = useState(initialData?.doc || null);

  const toggleSkill = (skill) => {
    let updated;
    if (selectedSkills.includes(skill)) {
      updated = selectedSkills.filter(s => s !== skill);
    } else {
      updated = [...selectedSkills, skill];
    }
    setSelectedSkills(updated);
    emitChange(updated, doc);
  };

  const handleAddCustomSkill = () => {
    if (!customSkill.trim()) return;
    const trimmed = customSkill.trim();
    if (!selectedSkills.includes(trimmed)) {
      const updated = [...selectedSkills, trimmed];
      setSelectedSkills(updated);
      emitChange(updated, doc);
    }
    setCustomSkill('');
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(selectedSkills, uploadedDoc);
  };

  const emitChange = (skills, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'SKILL_MATCH',
      data: { skills },
      documents: document ? [document] : []
    });
  };

  const matchedCount = requiredSkills.filter(r => 
    selectedSkills.some(s => s.trim().toLowerCase() === r.trim().toLowerCase())
  ).length;

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Technical Skill Match'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-teal-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          matchedCount >= minimumMatch 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          {matchedCount >= minimumMatch ? '✓ MIN MATCH MET' : `NEED ${minimumMatch - matchedCount} MORE`}
        </span>
      </div>

      {/* ADMIN REQUIREMENTS DISPLAY */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-slate-400">
          <span>Required Skills:</span>
          <span className="text-teal-400 font-bold">Minimum Match: {minimumMatch}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {requiredSkills.map(req => (
            <span key={req} className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-200 rounded text-[11px] font-bold">
              {req}
            </span>
          ))}
        </div>
      </div>

      {/* VENDOR SKILL SELECTOR */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">Your Technical Skills (Private Input):</label>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set([...requiredSkills, ...PRESET_SKILLS, ...selectedSkills])).map(skill => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-lg border border-teal-400 scale-[1.02]'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {isSelected && <Check size={13} />}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>

        {/* CUSTOM SKILL INPUT */}
        <div className="flex items-center gap-2 pt-1 font-mono">
          <input
            type="text"
            placeholder="Add additional skill..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            className="p-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 outline-none flex-1"
          />
          <button
            type="button"
            onClick={handleAddCustomSkill}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* PRIVACY CALLOUT */}
      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-start space-x-2">
        <Lock size={14} className="text-teal-400 mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Zero-Knowledge Privacy:</strong> Your full skill list is evaluated locally and stays private. Only the cryptographic proof that your skill match $\ge$ {minimumMatch} is published.
        </p>
      </div>

      {/* TECHNICAL DOCUMENT UPLOADER */}
      <DocumentUploader
        label="Upload Technical Architecture Document / SLA Certificate"
        documentType="TECHNICAL_DOCUMENT"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
