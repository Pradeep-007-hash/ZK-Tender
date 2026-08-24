import React from 'react';
import { FileText, Trophy, Globe, UserCheck, Home, IndianRupee } from 'lucide-react';

export default function MetricsBanner() {
  const metrics = [
    {
      icon: <FileText size={26} color="#2563EB" />,
      label: 'Live Tenders',
      value: '2,03,450+',
    },
    {
      icon: <Trophy size={26} color="#16A34A" />,
      label: 'Tender Results',
      value: '93,56,750+',
    },
    {
      icon: <Globe size={26} color="#0D9488" />,
      label: 'Live Global Tenders',
      value: '5,17,081+',
    },
    {
      icon: <UserCheck size={26} color="#9333EA" />,
      label: 'Verified Contractors',
      value: '10,31,726+',
    },
    {
      icon: <Home size={26} color="#EA580C" />,
      label: 'Authorities Covered',
      value: '11,843+',
    },
    {
      icon: <IndianRupee size={24} color="#D97706" />,
      label: 'Tender Value',
      value: '₹7,58,860+ Cr',
    }
  ];

  return (
    <div className="metrics-banner">
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div className="metric-item" key={i}>
            <div className="metric-icon-box">
              {m.icon}
            </div>
            <div className="metric-text-box">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
