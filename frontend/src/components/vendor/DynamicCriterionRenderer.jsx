import React from 'react';
import SkillMatchField from './SkillMatchField';
import FinancialField from './FinancialField';
import ExperienceField from './ExperienceField';
import CertificationField from './CertificationField';
import MinScoreField from './MinScoreField';
import TeamSizeField from './TeamSizeField';
import LocationField from './LocationField';
import DocumentUploader from './DocumentUploader';

export default function DynamicCriterionRenderer({ criterion, onChange, initialData }) {
  if (!criterion) return null;

  const criterionType = (criterion.type || '').toUpperCase();

  switch (criterionType) {
    case 'SKILL_MATCH':
      return <SkillMatchField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'FINANCIAL':
      return <FinancialField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'EXPERIENCE':
      return <ExperienceField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'CERTIFICATION':
      return <CertificationField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'MIN_SCORE':
      return <MinScoreField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'TEAM_SIZE':
      return <TeamSizeField criterion={criterion} onChange={onChange} initialData={initialData} />;

    case 'LOCATION':
      return <LocationField criterion={criterion} onChange={onChange} initialData={initialData} />;

    default:
      return (
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">{criterion.name || 'Custom Criteria'}</h3>
              <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-teal-400 font-bold">{criterion.weight}%</span></p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Detailed Response / Evidence Data:</label>
            <textarea
              rows="3"
              defaultValue={initialData?.customResponse || "Full compliance with requested directive."}
              onChange={(e) => onChange({
                criterionId: criterion.criterionId || criterion.id,
                criterionType: 'CUSTOM',
                data: { customResponse: e.target.value }
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-teal-500"
            />
          </div>
          <DocumentUploader
            label="Upload Supporting Evidence Document"
            documentType="CUSTOM_DOCUMENT"
            onDocumentChange={(doc) => onChange({
              criterionId: criterion.criterionId || criterion.id,
              criterionType: 'CUSTOM',
              data: { customResponse: 'Document attached' },
              documents: [doc]
            })}
            initialDoc={initialData?.doc}
          />
        </div>
      );
  }
}
