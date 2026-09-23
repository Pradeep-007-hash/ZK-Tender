import React from 'react';
import { 
  CheckCircle2, AlertCircle, FileText, DollarSign, MapPin, 
  Clock, ShieldCheck, Upload, Sliders, Award, Rocket, ChevronRight, Sparkles, Layers
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
  { id: 5, name: 'Vendor Eligibility ⭐', desc: 'Requirements & Gateways', iconKey: 'ShieldCheck', isZkp: true, badge: 'ZKP Gate' },
  { id: 6, name: 'Required Documents ⭐', desc: 'Checklist & Verification', iconKey: 'Upload', isZkp: true, badge: 'ZKP Verified' },
  { id: 7, name: 'Config & Rules', desc: 'Stage, Encryption & Validity', iconKey: 'Sliders', isZkp: false },
  { id: 8, name: 'Evaluation ⭐', desc: 'QCBS Criteria Builder', iconKey: 'Award', isZkp: true, badge: 'QCBS Matrix' },
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
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 font-sans ${
      lightTheme 
        ? 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/80' 
        : 'bg-slate-950/80 border-slate-800 text-white shadow-slate-950/90'
    }`}>
      {/* HEADER SECTION */}
      <div className="space-y-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/20">
              <Layers size={18} className="text-slate-950" />
            </div>
            <div>
              <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                9-Section Checklist
              </h3>
              <p className="text-[10px] text-slate-700 dark:text-slate-200 font-medium">
                Official E-Procurement Specification
              </p>
            </div>
          </div>

          {/* ISSUES BADGE (e.g. "5 Issues" or "100% Validated") */}
          <div>
            {issueCount > 0 ? (
              <span className="px-2.5 py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-full font-mono text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm animate-pulse">
                <AlertCircle size={13} className="text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>100% Validated</span>
              </span>
            )}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">
            <span>Section Progress</span>
            <span className="text-teal-700 dark:text-teal-400">{completedCount}/{totalSections} Completed ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-300/50 dark:border-slate-700/50">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 9 SECTIONS LIST */}
      <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1 custom-scrollbar">
        {sections.map((sec) => {
          const secErrors = validationErrors.filter(e => e.section === sec.id);
          const hasError = secErrors.length > 0;
          const isActive = activeSection === sec.id;
          const isCompleted = !hasError && (completedSections.includes(sec.id) || (sec.id < activeSection && secErrors.length === 0));
          
          const IconComp = ICON_MAP[sec.iconKey] || FileText;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                isActive 
                  ? lightTheme 
                    ? 'bg-teal-700 text-white font-bold shadow-lg shadow-teal-700/20 ring-2 ring-teal-500 scale-[1.01]' 
                    : 'bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-900 border-l-4 border-l-teal-400 border-teal-500/50 text-white font-bold shadow-xl ring-1 ring-teal-500/40 scale-[1.01]'
                  : hasError
                    ? lightTheme
                      ? 'bg-rose-50 border border-rose-200 text-slate-800 hover:bg-rose-100/80'
                      : 'bg-rose-950/20 border border-rose-500/30 text-slate-200 hover:bg-rose-950/40'
                    : lightTheme 
                      ? 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300' 
                      : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800/90 hover:text-white hover:border-slate-700'
              }`}
            >
              {/* LEFT SIDE: HIGH VISIBILITY NUMBER BADGE + TEXT */}
              <div className="flex items-center space-x-3 min-w-0">
                
                {/* PROMINENT HIGH-CONTRAST NUMBER BADGE */}
                <div className="relative shrink-0">
                  <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm sm:text-base tracking-tight shadow-md transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-400 to-emerald-400 text-slate-950 font-black shadow-teal-400/30 scale-105 ring-2 ring-white/60'
                      : hasError
                        ? 'bg-rose-600 text-white font-black shadow-rose-600/40 border border-rose-400 ring-1 ring-rose-500/50'
                        : isCompleted
                          ? 'bg-emerald-600 text-white font-black shadow-emerald-600/30 border border-emerald-400'
                          : lightTheme
                            ? 'bg-slate-200 text-slate-900 border border-slate-300 font-black hover:bg-slate-300'
                            : 'bg-slate-800 text-white border border-slate-700 font-black hover:bg-slate-700'
                  }`}>
                    {sec.id}
                  </span>

                  {/* MINI OVERLAY STATUS ICON (COMPLETED CHECKMARK OR ERROR BADGE) */}
                  {isCompleted && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900 text-slate-950">
                      <CheckCircle2 size={10} className="text-white" />
                    </span>
                  )}
                  {hasError && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-slate-900 text-white font-black text-[9px]">
                      !
                    </span>
                  )}
                </div>

                {/* TEXT INFO */}
                <div className="min-w-0 text-left">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className={`truncate text-xs sm:text-sm font-extrabold ${
                      isActive 
                        ? 'text-white drop-shadow-sm' 
                        : hasError
                          ? 'text-rose-600 dark:text-rose-300 font-bold'
                          : lightTheme ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      {sec.name.replace(' ⭐', '')}
                    </span>

                    {/* STAR / ZKP BADGE TAG */}
                    {sec.name.includes('⭐') && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-black tracking-wide font-mono flex items-center gap-0.5 ${
                        isActive
                          ? 'bg-amber-400/30 text-amber-200 border border-amber-300/40'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        ⭐ {sec.badge || 'ZKP'}
                      </span>
                    )}
                  </div>

                  <p className={`truncate text-[11px] font-medium mt-0.5 ${
                    isActive 
                      ? 'text-teal-100' 
                      : hasError
                        ? 'text-rose-500 dark:text-rose-400/90'
                        : lightTheme ? 'text-slate-700' : 'text-slate-200'
                  }`}>
                    {hasError ? `${secErrors.length} validation ${secErrors.length === 1 ? 'issue' : 'issues'}` : sec.desc}
                  </p>
                </div>
              </div>

              {/* RIGHT STATUS INDICATOR */}
              <div className="shrink-0 pl-2">
                {hasError ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}>
                    <AlertCircle size={12} />
                    <span className="hidden sm:inline">{secErrors.length} Issue</span>
                  </span>
                ) : isCompleted ? (
                  <CheckCircle2 size={16} className={isActive ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'} />
                ) : (
                  <ChevronRight size={16} className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
                    isActive ? 'text-teal-300' : 'text-slate-400 dark:text-slate-400'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
