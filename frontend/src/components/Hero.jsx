import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import MetricsBanner from './MetricsBanner';

export default function Hero({ onSearch }) {
  const [keyword, setKeyword] = useState('');

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch({ keyword });
    }
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content centered">
          <h1 className="hero-title" style={{ color: '#FFFFFF' }}>
            Everything You Need to Win <span className="gradient-gold">Government & Private Tenders</span>
          </h1>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
            From Finding Tenders to Winning Contracts
          </p>
          <p className="hero-description" style={{ color: '#FFFFFF' }}>
            AI-powered Tender Search, Competitive Bid Analysis, Expert Documentation and Complete End-to-End Tender Bidding Consultancy.
          </p>

          {/* HERO SEARCH BAR */}
          <div className="hero-search-box">
            <div className="search-input-wrapper">
              <Search size={18} />
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by keywords, tender ID, department, city or product..." 
              />
              <button onClick={handleSearchClick} className="btn btn-emerald">
                <Sparkles size={16} /> AI Search
              </button>
            </div>
          </div>
        </div>

        {/* METRICS STATS AT BOTTOM OF HERO IMAGE SECTION */}
        <div className="hero-metrics-container">
          <MetricsBanner />
        </div>
      </div>
    </section>
  );
}
