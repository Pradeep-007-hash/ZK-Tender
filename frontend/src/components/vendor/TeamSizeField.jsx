import React, { useState } from 'react';
import { Building2, Lock } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function TeamSizeField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const minStaff = Number(requirements.minimumTeamSize || 10);

  const [teamSize, setTeamSize] = useState(initialData?.teamSize || 25);
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleSizeChange = (val) => {
    const num = Number(val);
    setTeamSize(num);
    emitChange(num, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(teamSize, uploadedDoc);
  };

  const emitChange = (size, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'TEAM_SIZE',
      data: { teamSize: size },
      documents: document ? [document] : []
    });
  };

  const isCompliant = teamSize >= minStaff;

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Technical Team & Human Resource Strength'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-blue-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          isCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          {isCompliant ? '✓ STAFF STRENGTH VALID' : `NEED ${minStaff - teamSize} MORE STAFF`}
        </span>
      </div>

      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">Minimum Required Technical Staff:</span>
        <span className="text-blue-300 font-extrabold text-sm">{minStaff} Engineers</span>
      </div>

      <div className="space-y-2 font-mono">
        <label className="block text-xs font-bold text-slate-300 font-sans">Your Qualified Technical Workforce Count (Private Input):</label>
        <input
          type="number"
          value={teamSize}
          onChange={(e) => handleSizeChange(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-300 font-bold text-sm focus:border-blue-500 outline-none"
        />
      </div>

      <DocumentUploader
        label="Upload HR Payroll Declaration / Provident Fund Audit"
        documentType="HR_AUDIT_REPORT"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
