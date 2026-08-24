import React from 'react';
import { HardHat, Zap, Monitor, Pill, Gavel, Briefcase, FlaskConical, Droplet, Sprout, ShieldCheck, Microscope, Printer } from 'lucide-react';

const sectors = [
  { icon: HardHat, title: "Construction", desc: "Roads, Bridges, Civil & Buildings" },
  { icon: Zap, title: "Electrical", desc: "Transformers, Wiring & Substations" },
  { icon: Monitor, title: "IT & Telecommunications", desc: "Software, Hardware & Networks" },
  { icon: Pill, title: "Drugs & Pharmaceutical", desc: "Medical Supplies & Formulations" },
  { icon: Gavel, title: "Auction", desc: "Government Property & Scrap Sale" },
  { icon: Briefcase, title: "Services", desc: "Manpower, Security, Maintenance" },
  { icon: FlaskConical, title: "Laboratory Equipment", desc: "Testing Tools & Reagents" },
  { icon: Droplet, title: "Chemical, Oil & Gas", desc: "Refining, Piping & Solvents" },
  { icon: Sprout, title: "Agricultural Product", desc: "Seeds, Fertilizers & Machinery" },
  { icon: ShieldCheck, title: "Safety & Security Equipment", desc: "CCTV, Firefighting & Surveillance" },
  { icon: Microscope, title: "Scientific Instrument", desc: "Precision Sensors & Optics" },
  { icon: Printer, title: "Paper & Printing", desc: "Publishing, Packaging & Stationery" }
];

export default function SectorsGrid() {
  return (
    <section id="sectors" className="section" style={{ background: '#F8FAFC' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            MORE THAN 50,000 TENDERS DAILY
          </div>
          <h2 className="section-title">Industry Sector Coverage</h2>
          <p className="section-desc">Comprehensive tender opportunity monitoring tailored to every enterprise domain.</p>
        </div>

        <div className="sectors-grid">
          {sectors.map((sec, idx) => {
            const IconComp = sec.icon;
            return (
              <div key={idx} className="sector-card">
                <div className="sector-icon">
                  <IconComp size={24} />
                </div>
                <h3 className="sector-title">{sec.title}</h3>
                <p className="section-desc" style={{ fontSize: '0.85rem' }}>{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
