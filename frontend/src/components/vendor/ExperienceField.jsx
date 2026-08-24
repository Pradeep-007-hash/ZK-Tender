import React, { useState } from 'react';
import { Award, Plus, Trash2, Lock } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

export default function ExperienceField({ criterion, onChange, initialData }) {
  const requirements = criterion.requirements || {};
  const minYears = Number(requirements.minimumYears || requirements.minExperienceYears || 3);

  const [years, setYears] = useState(initialData?.years || 5);
  const [projects, setProjects] = useState(initialData?.projects || [
    { name: 'National Highways Corridor EV Infrastructure Phase II', client: 'NHAI', duration: '24 Months' }
  ]);
  const [newProject, setNewProject] = useState({ name: '', client: '', duration: '' });
  const [doc, setDoc] = useState(initialData?.doc || null);

  const handleYearsChange = (val) => {
    const num = Number(val);
    setYears(num);
    emitChange(num, projects, doc);
  };

  const handleAddProject = () => {
    if (!newProject.name.trim()) return;
    const updated = [...projects, { ...newProject }];
    setProjects(updated);
    setNewProject({ name: '', client: '', duration: '' });
    emitChange(years, updated, doc);
  };

  const handleRemoveProject = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    emitChange(years, updated, doc);
  };

  const handleDocChange = (uploadedDoc) => {
    setDoc(uploadedDoc);
    emitChange(years, projects, uploadedDoc);
  };

  const emitChange = (expYears, projList, document) => {
    onChange({
      criterionId: criterion.criterionId || criterion.id,
      criterionType: 'EXPERIENCE',
      data: { years: expYears, projects: projList },
      documents: document ? [document] : []
    });
  };

  const isCompliant = years >= minYears;

  return (
    <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Award size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{criterion.name || 'Experience & Past Track Record'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Weight: <span className="text-indigo-400 font-bold">{criterion.weight}%</span></p>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full border ${
          isCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          {isCompliant ? '✓ EXPERIENCE QUALIFIED' : `NEED ${minYears - years} MORE YEARS`}
        </span>
      </div>

      {/* ADMIN MIN EXPERIENCE DISPLAY */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">Minimum Required Experience:</span>
        <span className="text-indigo-300 font-extrabold text-sm">{minYears} Years</span>
      </div>

      {/* VENDOR EXPERIENCE INPUT */}
      <div className="space-y-2 font-mono">
        <label className="block text-xs font-bold text-slate-300 font-sans">Your Relevant Experience (Years) — (Private Input):</label>
        <input
          type="number"
          value={years}
          onChange={(e) => handleYearsChange(e.target.value)}
          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold text-sm focus:border-indigo-500 outline-none"
        />
      </div>

      {/* PAST PROJECTS BUILDER */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-300">Previous Completed Projects:</label>
        {projects.map((proj, i) => (
          <div key={i} className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs shadow-md">
            <div>
              <p className="font-bold text-white text-xs">{proj.name}</p>
              <p className="text-[10px] text-slate-400">Client: {proj.client || 'Government Entity'} • Duration: {proj.duration || '12 Months'}</p>
            </div>
            <button onClick={() => handleRemoveProject(i)} className="p-1.5 text-slate-500 hover:text-rose-400 transition">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono pt-1">
          <input
            type="text"
            placeholder="Project Title"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            className="p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white outline-none"
          />
          <input
            type="text"
            placeholder="Client / Authority"
            value={newProject.client}
            onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
            className="p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white outline-none"
          />
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Duration"
              value={newProject.duration}
              onChange={(e) => setNewProject({ ...newProject, duration: e.target.value })}
              className="p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white outline-none flex-1"
            />
            <button onClick={handleAddProject} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* PRIVACY CALLOUT */}
      <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-start space-x-2">
        <Lock size={14} className="text-teal-400 mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Zero-Knowledge Experience Witness:</strong> Your detailed past project billing and contract records are evaluated privately off-chain. The ZKP proves <span className="font-mono text-white">vendorExperience $\ge$ {minYears} years</span> without exposing proprietary client contracts.
        </p>
      </div>

      {/* EXPERIENCE DOCUMENT UPLOADER */}
      <DocumentUploader
        label="Upload Experience Completion Certificate / Client Recommendation Letter"
        documentType="EXPERIENCE_CERTIFICATE"
        onDocumentChange={handleDocChange}
        initialDoc={doc}
      />
    </div>
  );
}
