import React, { useState } from 'react';
import { FolderTree, ArrowRight } from 'lucide-react';

const browseDirectories = {
  categories: [
    { name: "GeM Tenders", url: "https://www.tenderdetail.com/e-procurement-tender-list/gem-tender" },
    { name: "Private Tenders", url: "https://www.tenderdetail.com/tenders/ownership/private-organizations" },
    { name: "Exempted Tenders", url: "https://www.tenderdetail.com/tenders/type/emd-exemption-tenders" },
    { name: "NewsPaper Tenders", url: "https://www.tenderdetail.com/tenders/type/newspaper-tenders" },
    { name: "Online Tenders", url: "https://www.tenderdetail.com/tenders/type/online-tenders" },
    { name: "Bank Tenders", url: "https://www.tenderdetail.com/tenders/sector/banking-and-finance" },
    { name: "Defence Tenders", url: "https://www.tenderdetail.com/tenders/sector/defence" },
    { name: "Railway Tenders", url: "https://www.tenderdetail.com/tenders/sector/railways" },
    { name: "More →", url: "https://www.tenderdetail.com/tenders" }
  ],
  city: [
    { name: "Mumbai Tenders (2,730+)", url: "https://www.tenderdetail.com/location/mumbai-tenders" },
    { name: "Delhi Tenders (4,025+)", url: "https://www.tenderdetail.com/location/delhi-tenders" },
    { name: "Bangalore Tenders (1,728+)", url: "https://www.tenderdetail.com/location/bangalore-tenders" },
    { name: "Hyderabad Tenders (1,542+)", url: "https://www.tenderdetail.com/location/hyderabad-tenders" },
    { name: "Chennai Tenders (4,683+)", url: "https://www.tenderdetail.com/location/chennai-tenders" },
    { name: "Lucknow Tenders (2,612+)", url: "https://www.tenderdetail.com/location/lucknow-tenders" },
    { name: "Ahmedabad Tenders (2,880+)", url: "https://www.tenderdetail.com/location/ahmedabad-tenders" },
    { name: "Kolkata Tenders (3,167+)", url: "https://www.tenderdetail.com/location/kolkata-tenders" },
    { name: "More →", url: "https://www.tenderdetail.com/City-tenders" }
  ],
  state: [
    { name: "Uttar Pradesh Tenders (20,488+)", url: "https://www.tenderdetail.com/State-tenders/uttar-pradesh-tenders" },
    { name: "Maharashtra Tenders (17,662+)", url: "https://www.tenderdetail.com/State-tenders/maharashtra-tenders" },
    { name: "Gujarat Tenders (14,016+)", url: "https://www.tenderdetail.com/State-tenders/gujarat-tenders" },
    { name: "Tamil Nadu Tenders (13,856+)", url: "https://www.tenderdetail.com/State-tenders/tamil-nadu-tenders" },
    { name: "Madhya Pradesh Tenders (11,012+)", url: "https://www.tenderdetail.com/State-tenders/madhya-pradesh-tenders" },
    { name: "Karnataka Tenders (9,971+)", url: "https://www.tenderdetail.com/State-tenders/karnataka-tenders" },
    { name: "Andhra Pradesh Tenders (6,088+)", url: "https://www.tenderdetail.com/State-tenders/andhra-pradesh-tenders" },
    { name: "Telangana Tenders (5,836+)", url: "https://www.tenderdetail.com/State-tenders/telangana-tenders" },
    { name: "More →", url: "https://www.tenderdetail.com/StateTenders/List" }
  ],
  authority: [
    { name: "CPWD Tenders", url: "https://www.tenderdetail.com/government-tenders/central-public-works-department-tenders/1?agid=9550" },
    { name: "ONGC Tenders", url: "https://www.tenderdetail.com/government-tenders/oil-and-natural-gas-corporation-limited-tenders/1?agid=9599" },
    { name: "IOCL Tenders", url: "https://www.tenderdetail.com/government-tenders/indian-oil-corporation-limited-tenders/1?agid=1288" },
    { name: "PMGSY Tenders", url: "https://www.tenderdetail.com/government-tenders/pradhan-mantri-gram-sadak-yojana-tenders/1?agid=2386" },
    { name: "NHAI Tenders", url: "https://www.tenderdetail.com/government-tenders/national-highways-authority-of-india-tenders/1?agid=2046" },
    { name: "PWD Tenders", url: "https://www.tenderdetail.com/government-tenders/public-works-department-tenders/1?agid=3002" },
    { name: "SBI Tenders", url: "https://www.tenderdetail.com/government-tenders/state-bank-of-india-tenders/1?agid=2673" },
    { name: "MSTC Tenders", url: "https://www.tenderdetail.com/government-tenders/maharashtra-state-textile-corporation-mstc-tenders/1?agid=90063" },
    { name: "More →", url: "https://www.tenderdetail.com/Authority-tenders" }
  ]
};

export default function BrowseHub() {
  const [activeTab, setActiveTab] = useState('categories');

  const currentList = browseDirectories[activeTab] || [];

  return (
    <section id="browse-tenders" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <FolderTree size={16} /> BROWSE TENDER DIRECTORIES
          </div>
          <h2 className="section-title">Explore Tenders by <span className="gradient-gold">Category, City, State & Authority</span></h2>
          <p className="section-desc">Quick navigation to specific tender listings across thousands of buying organizations.</p>
        </div>

        <div className="browse-tabs">
          <button className={`browse-tab-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Tender Categories</button>
          <button className={`browse-tab-item ${activeTab === 'city' ? 'active' : ''}`} onClick={() => setActiveTab('city')}>Tender by City</button>
          <button className={`browse-tab-item ${activeTab === 'state' ? 'active' : ''}`} onClick={() => setActiveTab('state')}>Tender by State</button>
          <button className={`browse-tab-item ${activeTab === 'authority' ? 'active' : ''}`} onClick={() => setActiveTab('authority')}>Tender by Authority</button>
        </div>

        <div className="browse-links-grid">
          {currentList.map((item, idx) => (
            <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="directory-link-card">
              <span>{item.name}</span>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
