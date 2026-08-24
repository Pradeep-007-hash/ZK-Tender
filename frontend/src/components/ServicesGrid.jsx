import React from 'react';
import { Flag, Globe, FolderKanban, Award, KeyRound, BarChart2, Info, HelpingHand, Landmark } from 'lucide-react';

const servicesList = [
  { icon: Flag, title: "Indian Tenders" },
  { icon: Globe, title: "Global Tenders" },
  { icon: FolderKanban, title: "Projects" },
  { icon: Award, title: "Tender Results" },
  { icon: KeyRound, title: "Digital Certificate (DSC)" },
  { icon: BarChart2, title: "Competitive Bid Analysis" },
  { icon: Info, title: "Tender Info Services" },
  { icon: HelpingHand, title: "Tender Bidding Support" },
  { icon: Landmark, title: "MSME Loan Apply" }
];

export default function ServicesGrid({ onOpenDemo }) {
  return (
    <section id="services" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            ENTERPRISE SERVICES
          </div>
          <h2 className="section-title">Comprehensive Tender Services</h2>
          <p className="section-desc">Specialized bidding, intelligence, financial, and digital certificate solutions.</p>
        </div>

        <div className="services-grid">
          {servicesList.map((srv, idx) => {
            const IconComp = srv.icon;
            return (
              <div key={idx} className="service-card" onClick={() => onOpenDemo(srv.title)}>
                <div className="service-icon">
                  <IconComp size={20} />
                </div>
                <div className="service-title">{srv.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
