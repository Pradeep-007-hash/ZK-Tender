import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function SkillMatchField({ criterion, onChange, initialData }) {
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'SKILL_MATCH',
      data: { 
        skills: initialData?.skills || ['React', 'Node.js', 'MongoDB'],
        technicalVerified: true 
      },
      documents: uploadedDoc ? [uploadedDoc] : []
    });
  };

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Technical Criteria & Architecture Proof'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-teal-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
          PROOF CRITERIA FORM
        </span>
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

