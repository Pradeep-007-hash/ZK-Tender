import React, { useState } from 'react';
import { MapPin, Lock } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function LocationField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const reqLocation = requirements.requiredState || requirements.location || 'Maharashtra';

  const [state, setState] = useState(initialData?.state || 'Maharashtra');
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleStateChange = (val) => {
    setState(val);
    emitChange(val, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(state, uploadedDoc);
  };

  const emitChange = (locState, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'LOCATION',
      data: { state: locState, location: locState },
      documents: document ? [document] : []
    });
  };

  const isCompliant = !reqLocation || state.toLowerCase().includes(reqLocation.toLowerCase()) || reqLocation.toLowerCase().includes(state.toLowerCase());

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Local Office & Jurisdiction Presence'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-amber-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          isCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          {isCompliant ? '✓ JURISDICTION MATCHED' : '⚠ OUTSIDE REQUIRED REGION'}
        </span>
      </div>

      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">Target Project Execution Region:</span>
        <span className="text-amber-300 font-extrabold text-sm">{reqLocation}</span>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">Your Operating Base / Regional Headquarters State:</label>
        <input
          type="text"
          value={state}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-amber-500 outline-none"
          placeholder="Enter registered state..."
        />
      </div>

      <DocumentUploader
        label="Upload Local GST Registration / Municipal Office Lease"
        documentType="LOCATION_PROOF"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
