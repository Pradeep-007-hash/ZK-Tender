import React, { useState } from 'react';
import { DollarSign, Lock, ShieldCheck } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function FinancialField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const maxBid = Number(requirements.maximumBidAmount || requirements.maxBidCeiling || 10000000);
  const minBid = Number(requirements.minimumBidAmount || requirements.minBid || 0);

  const [bidAmount, setBidAmount] = useState(initialData?.bidAmount || 8500000);
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleAmountChange = (val) => {
    const num = Number(val);
    setBidAmount(num);
    emitChange(num, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(bidAmount, uploadedDoc);
  };

  const emitChange = (amount, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'FINANCIAL',
      data: { bidAmount: amount },
      documents: document ? [document] : []
    });
  };

  const isCompliant = bidAmount > 0 && bidAmount <= maxBid && bidAmount >= minBid;

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Financial Commercial Offer'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-emerald-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          isCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          {isCompliant ? '✓ WITHIN BUDGET CEILING' : '⚠ EXCEEDS MAXIMUM BID'}
        </span>
      </div>

      {/* ADMIN MAX BID DISPLAY */}
      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">Maximum Allowed Bid Ceiling:</span>
        <span className="text-emerald-400 font-extrabold text-sm">₹{maxBid.toLocaleString('en-IN')}</span>
      </div>

      {/* VENDOR BID AMOUNT INPUT */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">Your Financial Bid Offer Amount (₹) — (Private Input):</label>
        <div className="relative font-mono">
          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full p-2.5 pl-8 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-emerald-500 outline-none"
            placeholder="Enter offer amount..."
          />
        </div>
        <p className="text-[11px] text-slate-400 font-mono">Formatted: <span className="text-white font-bold">₹{Number(bidAmount || 0).toLocaleString('en-IN')}</span></p>
      </div>

      {/* PRIVACY CALLOUT */}
      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-start space-x-2">
        <Lock size={14} className="text-teal-400 mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Zero-Knowledge Financial Guarantee:</strong> Your actual bid amount is encrypted. The ZKP circuit proves <span className="font-mono text-white">vendorBidAmount $\le$ maximumBidAmount</span> without exposing your private commercial value.
        </p>
      </div>

      {/* FINANCIAL DOCUMENT UPLOADER */}
      <DocumentUploader
        label="Upload Financial Audit Document / Bank Balance Sheet"
        documentType="FINANCIAL_DOCUMENT"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
