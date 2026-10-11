import React from 'react';
import { 
  CheckCircle2, AlertCircle, FileText, DollarSign, MapPin, 
  Clock, ShieldCheck, Upload, Sliders, Award, Rocket, ChevronRight, Layers
} from 'lucide-react';

const ICON_MAP = {
  FileText: FileText,
  DollarSign: DollarSign,
  MapPin: MapPin,
  Clock: Clock,
  ShieldCheck: ShieldCheck,
  Upload: Upload,
  Sliders: Sliders,
  Award: Award,
  Rocket: Rocket
};

export const CHECKLIST_SECTIONS = [
  { id: 1, name: 'Basic Information', desc: 'Title, ID & Category', iconKey: 'FileText', isZkp: false },
  { id: 2, name: 'Financial Framework', desc: 'Estimates, EMD & Fees', iconKey: 'DollarSign', isZkp: false },
  { id: 3, name: 'Location & Scope', desc: 'Work Area & Duration', iconKey: 'MapPin', isZkp: false },
  { id: 4, name: 'Timeline Engine', desc: 'Dates & Chronology', iconKey: 'Clock', isZkp: false },
  { id: 5, name: 'Vendor Eligibility', desc: 'Requirements & Gateways', iconKey: 'ShieldCheck', isZkp: true, badge: 'ZKP Gate' },
  { id: 6, name: 'Required Documents', desc: 'Checklist & Verification', iconKey: 'Upload', isZkp: true, badge: 'ZKP Verified' },
  { id: 7, name: 'Config & Rules', desc: 'Stage, Encryption & Validity', iconKey: 'Sliders', isZkp: false },
  { id: 8, name: 'Evaluation', desc: 'QCBS Criteria Builder', iconKey: 'Award', isZkp: true, badge: 'QCBS Matrix' },
  { id: 9, name: 'Review & Register', desc: 'Inspector & Ledger Registration', iconKey: 'Rocket', isZkp: false }
];

export default function NineSectionChecklist({
  activeSection = 1,
  validationErrors = [],
  onSelectSection = () => {},
  completedSections = [],
  lightTheme = false,
  sections = CHECKLIST_SECTIONS
}) {
  const totalSections = sections.length;
  const issueCount = validationErrors.length;
  const isValidated = issueCount === 0;

  // Calculate completed section count
  const completedCount = sections.filter(sec => {
    const hasErr = validationErrors.some(e => e.section === sec.id);
    const explicitlyCompleted = completedSections.includes(sec.id);
    return !hasErr && (explicitlyCompleted || activeSection > sec.id);
  }).length;

  const progressPercent = Math.round((completedCount / totalSections) * 100);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-colors font-sans ${
      lightTheme 
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900 border-slate-800 text-white shadow-sm'
    }`}>
      {/* HEADER SECTION */}
      <div className="space-y-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              lightTheme ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              <Layers size={17} />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                9-Section Checklist
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official E-Procurement Specification
              </p>
            </div>
          </div>

          {/* ISSUES BADGE */}
          <div>
            {issueCount > 0 ? (
              <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-md font-mono text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle size={12} className="shrink-0" />
                <span>{issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-mono text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Validated</span>
              </span>
            )}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Section Progress</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{completedCount}/{totalSections} Completed ({progressPercent}%)</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 9 SECTIONS LIST */}
      <div className="space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1 custom-scrollbar">
        {sections.map((sec) => {
          const secErrors = validationErrors.filter(e => e.section === sec.id);
          const hasError = secErrors.length > 0;
          const isActive = activeSection === sec.id;
          const isCompleted = !hasError && (completedSections.includes(sec.id) || (sec.id < activeSection && secErrors.length === 0));

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between group ${
                isActive 
                  ? lightTheme 
                    ? 'bg-slate-100 border border-slate-300 text-slate-900' 
                    : 'bg-slate-800 border border-slate-700 text-white'
                  : hasError
                    ? lightTheme
                      ? 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    : lightTheme 
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900' 
                      : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {/* LEFT SIDE: NUMBER BADGE + TEXT */}
              <div className="flex items-center space-x-2.5 min-w-0">
                {/* CLEAN NUMBER BADGE */}
                <div className="shrink-0">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : hasError
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : lightTheme
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {sec.id}
                  </span>
                </div>

                {/* TEXT INFO */}
                <div className="min-w-0 text-left">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className={`truncate text-xs font-semibold ${
                      isActive 
                        ? 'text-slate-900 dark:text-white' 
                        : lightTheme ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      {sec.name}
                    </span>

                    {/* BADGE CHIP (NO EMOJIS) */}
                    {sec.badge && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                        isActive
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sec.desc}
                  </p>
                </div>
              </div>

              {/* RIGHT STATUS INDICATOR */}
              <div className="shrink-0 pl-2">
                {hasError ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {secErrors.length} Issue{secErrors.length === 1 ? '' : 's'}
                  </span>
                ) : isCompleted ? (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                ) : (
                  <ChevronRight size={15} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
