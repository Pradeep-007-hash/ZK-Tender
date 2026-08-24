import React, { useState, useEffect } from 'react';
import { Radio, Building2, Clock, Sparkles, ExternalLink } from 'lucide-react';

const liveTenders = [
  {
    id: "Offline#57021959",
    type: "Offline",
    status: "Live",
    category: "psu",
    title: "Tender For One Time Improvement Of Road Old Nh- 51 Alignment Near Charnada On Charnada- Jafrabad Section.",
    closes: "Aug 24, 2026",
    daysLeft: "7 days left",
    value: "₹3.00 Crore",
    department: "Road and Building Department",
    state: "Gujarat",
    docs: ["Tender Notice", "BOQ"],
    link: "https://www.tenderdetail.com/Indian-Tenders/TenderNotice/57021959/eed818972d03fd92470c0aa0ec276865"
  },
  {
    id: "Offline#57021948",
    type: "Offline",
    status: "Live",
    category: "psu",
    title: "Tender For Cement Nala Bandhara Amba No 2 Tq.Kannaddist.Chhsambhajinagar",
    closes: "Aug 22, 2026",
    daysLeft: "5 days left",
    value: "₹19.59 Lakh",
    department: "Rural Development Department",
    state: "Maharashtra",
    docs: ["Tender Document", "BOQ"],
    link: "https://www.tenderdetail.com/Indian-Tenders/TenderNotice/57021948/19b5b76201900c57cc7267a457ce2461"
  },
  {
    id: "Offline#57021947",
    type: "Offline",
    status: "Live",
    category: "psu",
    title: "Tender For Road Work",
    closes: "Sep 02, 2026",
    daysLeft: "16 days left",
    value: "₹1.98 Crore",
    department: "District Panchayat",
    state: "Gujarat",
    docs: ["Scan Images", "BOQ"],
    link: "https://www.tenderdetail.com/Indian-Tenders/TenderNotice/57021947/3dc575effee377460afbe8340d53d078"
  },
  {
    id: "Offline#57021946",
    type: "Offline",
    status: "Live",
    category: "psu",
    title: "Tender For The Construction Of A Dashakriya Vidhi (Post-Funeral Ritual) Shed And Allied Works At Mauje Devargaon, Taluka Nashik.",
    closes: "Aug 21, 2026",
    daysLeft: "4 days left",
    value: "₹Ref. Document",
    department: "Rural Development Department",
    state: "Maharashtra",
    docs: ["Tender Document", "Exemptions Available", "BOQ"],
    link: "https://www.tenderdetail.com/Indian-Tenders/TenderNotice/57021946/f6243957e67216d2804d12b6af1ac8c0"
  },
  {
    id: "Offline#57021945",
    type: "Offline",
    status: "Live",
    category: "private",
    title: "Auction Contract Of 42 Shop On Lease Basis.",
    closes: "Sep 30, 2026",
    daysLeft: "44 days left",
    value: "₹Ref. Document",
    department: "Smart City Development Limited",
    state: "Gujarat",
    docs: ["Tender Notice", "BOQ"],
    link: "https://www.tenderdetail.com/Indian-Tenders/TenderNotice/57021945/4dd0f8767cd2b0a900fd04698d8cf20f"
  },
  {
    id: "GeM#98410291",
    type: "GeM",
    status: "Live",
    category: "gem",
    title: "Supply, Installation & Maintenance of Enterprise Fiber Optic Network Switches",
    closes: "Aug 28, 2026",
    daysLeft: "11 days left",
    value: "₹85.40 Lakh",
    department: "Bharat Sanchar Nigam Limited (BSNL)",
    state: "Delhi",
    docs: ["GeM Document", "BOQ"],
    link: "https://www.tenderdetail.com/e-procurement-tender-list/gem-tender"
  },
  {
    id: "Global#8841029",
    type: "Global",
    status: "Live",
    category: "global",
    title: "Construction & Maintenance of Solar Photovoltaic Substation Grid",
    closes: "Sep 15, 2026",
    daysLeft: "29 days left",
    value: "$12.50 Million",
    department: "International Renewable Energy Authority",
    state: "Global",
    docs: ["RFP Document", "BOQ"],
    link: "https://www.tenderdetail.com/Global-Tenders"
  }
];

export default function LiveFeed({ searchParams, onOpenDemo }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [dbTenders, setDbTenders] = useState([]);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tenders');
        const data = await res.json();
        if (data.success && data.tenders) {
          const formatted = data.tenders.map(t => ({
            id: t.tenderId,
            type: t.tenderType || "E-Tender",
            status: t.status || "Live",
            category: (t.category || "psu").toLowerCase(),
            title: t.title,
            closes: t.submissionDeadline || t.closingDate || "30 Sep 2026",
            daysLeft: "Active",
            value: t.estimatedValue ? `₹${(t.estimatedValue / 10000000).toFixed(2)} Cr` : "Refer Document",
            department: t.department || "Dept of Urban Tech",
            state: t.state || "Maharashtra",
            docs: ["RFP Document", "BOQ"],
            link: "#"
          }));
          setDbTenders(formatted);
        }
      } catch (e) {
        console.warn('[LIVE FEED FETCH NOTICE]', e.message);
      }
    };
    fetchTenders();
  }, []);

  const combinedTenders = [...dbTenders, ...liveTenders];

  const filteredTenders = combinedTenders.filter(item => {
    let matchCategory = activeCategory === 'all' || item.category === activeCategory;
    
    if (searchParams) {
      const { keyword, stateFilter, activePill } = searchParams;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const matchKw = item.title.toLowerCase().includes(kw) || item.department.toLowerCase().includes(kw) || item.id.toLowerCase().includes(kw);
        if (!matchKw) matchCategory = false;
      }
      if (stateFilter && item.state !== stateFilter) matchCategory = false;
      if (activePill === 'gem' && item.category !== 'gem') matchCategory = false;
      if (activePill === 'private' && item.category !== 'private') matchCategory = false;
    }

    return matchCategory;
  });

  return (
    <section id="live-feed" className="section" style={{ background: '#F8FAFC' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Radio size={16} /> LIVE TENDER OPPORTUNITIES
          </div>
          <h2 className="section-title">Latest Tender Feed</h2>
          <p className="section-desc">Real-time updates on active government, GeM, PSU, and private tender opportunities across India and globally.</p>
        </div>

        <div className="live-feed-tabs">
          <button className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All Tenders</button>
          <button className={`tab-btn ${activeCategory === 'private' ? 'active' : ''}`} onClick={() => setActiveCategory('private')}>Private Tenders</button>
          <button className={`tab-btn ${activeCategory === 'psu' ? 'active' : ''}`} onClick={() => setActiveCategory('psu')}>PSU Tenders</button>
          <button className={`tab-btn ${activeCategory === 'gem' ? 'active' : ''}`} onClick={() => setActiveCategory('gem')}>GeM Tenders</button>
          <button className={`tab-btn ${activeCategory === 'global' ? 'active' : ''}`} onClick={() => setActiveCategory('global')}>Global Tenders</button>
        </div>

        <div className="tender-cards-list">
          {filteredTenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No tenders matching your filter criteria. Try expanding your search keyword or state selection.
            </div>
          ) : (
            filteredTenders.map(item => (
              <div key={item.id} className="tender-card">
                <div>
                  <div className="tender-card-header">
                    <span className={`tender-badge ${item.status === 'Live' ? 'badge-live' : 'badge-offline'}`}>{item.type} • {item.status}</span>
                    <span className="tender-id">{item.id}</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.85rem' }}>📍 {item.state}</span>
                  </div>
                  
                  <a href={item.link} target="_blank" rel="noreferrer" className="tender-title" style={{ display: 'block' }}>
                    {item.title}
                  </a>

                  <div className="tender-meta">
                    <div className="tender-meta-item">
                      <Building2 size={16} /> {item.department}
                    </div>
                    <div className="tender-meta-item">
                      <Clock size={16} /> Closes {item.closes} · <strong>{item.daysLeft}</strong>
                    </div>
                  </div>

                  <div className="tender-actions">
                    {item.docs.map((doc, idx) => <span key={idx} className="tender-tag-btn">📄 {doc}</span>)}
                  </div>
                </div>

                <div className="tender-price-box">
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Value</div>
                  <div className="tender-price">{item.value}</div>
                  <div className="tender-closing">{item.daysLeft}</div>
                  <button onClick={() => onOpenDemo(`Bid Analysis: ${item.id}`)} className="btn btn-outline full-width" style={{ marginTop: '10px', fontSize: '0.82rem', padding: '8px 12px' }}>
                    <Sparkles size={14} /> AI Bid Strategy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="https://www.tenderdetail.com/Indian-Tenders" target="_blank" rel="noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> View All 2,12,760+ Tenders on ZK-Tenders →
          </a>
        </div>
      </div>
    </section>
  );
}
