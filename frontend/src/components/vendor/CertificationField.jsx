import React, { useState } from 'react';
import { ShieldCheck, Check, Lock } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

const PRESET_CERTS = [
  'ISO 14001', 'ISO 9001', 'ISO 27001', 'CMMI Level 5', 'CMMI Level 3',
  'LEED Gold', 'Green Building Certificate', 'SOC 2 Type II'
];

export default function CertificationField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const requiredCerts = requirements.requiredCertificates || requirements.requiredCertifications || ['ISO 14001'];

  const [selectedCerts, setSelectedCerts] = useState(initialData?.certifications || ['ISO 14001']);
  const [doc, setDoc] = useState(initialData?.doc || null);

  const toggleCert = (cert) => {
    let updated;
    if (selectedCerts.includes(cert)) {
      updated = selectedCerts.filter(c => c !== cert);
    } else {
      updated = [...selectedCerts, cert];
    }
    setSelectedCerts(updated);
    emitChange(updated, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(selectedCerts, uploadedDoc);
  };

  const emitChange = (certifications, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'CERTIFICATION',
      data: { certifications },
      documents: document ? [document] : []
    });
  };

  const hasAllRequired = requiredCerts.every(rc => 
    selectedCerts.some(sc => sc.trim().toLowerCase() === rc.trim().toLowerCase())
  );

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Statutory & Sustainability Certification'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-teal-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          hasAllRequired 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          {hasAllRequired ? '✓ CERTIFICATIONS VALIDATED' : '⚠ MISSING CERTIFICATION'}
        </span>
      </div>

      {/* ADMIN REQUIRED CERTIFICATIONS DISPLAY */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
        <span className="text-slate-400">Mandatory Required Certifications:</span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {requiredCerts.map(req => (
            <span key={req} className="px-2.5 py-1 bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded font-bold">
              {req}
            </span>
          ))}
        </div>
      </div>

      {/* VENDOR CERTIFICATION SELECTOR */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">Your ISO / Quality Certifications:</label>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set([...requiredCerts, ...PRESET_CERTS, ...selectedCerts])).map(cert => {
            const isSelected = selectedCerts.includes(cert);
            return (
              <button
                type="button"
                key={cert}
                onClick={() => toggleCert(cert)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-lg border border-teal-400'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {isSelected && <Check size={13} />}
                <span>{cert}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRIVACY CALLOUT */}
      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-start space-x-2">
        <Lock size={14} className="text-teal-400 mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Zero-Knowledge Certification Guarantee:</strong> Certificate details remain off-chain. The ZKP proves that your organisation possesses the required certificate without exposing proprietary audit keys.
        </p>
      </div>

      {/* CERTIFICATE DOCUMENT UPLOADER */}
      <DocumentUploader
        label="Upload ISO Certificate Audit File / Accreditation Document"
        documentType="CERTIFICATE"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
