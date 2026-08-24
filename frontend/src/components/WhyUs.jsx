import React from 'react';
import { Radar, ClipboardCheck, FileText, TrendingUp, Eye, Headphones } from 'lucide-react';

const pillars = [
  {
    icon: Radar,
    title: "Tender Identification",
    desc: "Continuous monitoring of all relevant government portals to surface matching opportunities before deadlines."
  },
  {
    icon: ClipboardCheck,
    title: "Eligibility Assessment",
    desc: "Detailed review of your financials, certifications, and past experience against each tender's specific criteria."
  },
  {
    icon: FileText,
    title: "Documentation & Bid Preparation",
    desc: "Complete preparation of technical and financial bid packages, compliant with government submission standards."
  },
  {
    icon: TrendingUp,
    title: "Pricing Strategy Support",
    desc: "Data-backed pricing recommendations based on historical award prices and competitive intelligence."
  },
  {
    icon: Eye,
    title: "Competition Intelligence",
    desc: "Analysis of likely competing firms, their past bid behavior, and strategies to position your bid favorably."
  },
  {
    icon: Headphones,
    title: "End-to-End Tender Management",
    desc: "Full lifecycle management from opportunity to award — including query responses, clarifications, and follow-up."
  }
];

export default function WhyUs() {
  return (
    <section id="why-us" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            COMPLETE END-TO-END SOLUTIONS
          </div>
          <h2 className="section-title">Why Businesses Choose <span style={{ color: '#2563EB' }}>ZK-Tenders</span></h2>
          <p className="section-desc">From daily opportunity alerts to final contract execution — we power your complete tender bidding lifecycle.</p>
        </div>

        <div className="features-grid">
          {pillars.map((pil, idx) => {
            const IconComp = pil.icon;
            return (
              <div key={idx} className="feature-card">
                <div className="feature-icon">
                  <IconComp size={24} />
                </div>
                <h3 className="feature-title">{pil.title}</h3>
                <p className="feature-desc">{pil.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
