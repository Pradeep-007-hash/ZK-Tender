import React from 'react';
import { Grid, MapPin, Map, Building2 } from 'lucide-react';

export default function CategoryCards() {
  const cardData = [
    {
      title: "Tender Categories",
      icon: <Grid size={20} color="#2563EB" />,
      items: [
        { name: "GeM Tenders", url: "https://www.tenderdetail.com/e-procurement-tender-list/gem-tender" },
        { name: "Private Tenders", url: "https://www.tenderdetail.com/tenders/ownership/private-organizations" },
        { name: "Exempted Tenders", url: "https://www.tenderdetail.com/tenders/type/emd-exemption-tenders" },
        { name: "NewsPaper Tenders", url: "https://www.tenderdetail.com/tenders/type/newspaper-tenders" },
        { name: "Online Tenders", url: "https://www.tenderdetail.com/tenders/type/online-tenders" },
        { name: "Bank Tenders", url: "https://www.tenderdetail.com/tenders/sector/banking-and-finance" },
        { name: "Defence Tenders", url: "https://www.tenderdetail.com/tenders/sector/defence" },
        { name: "Railway Tenders", url: "https://www.tenderdetail.com/tenders/sector/railways" },
        { name: "More →", url: "https://www.tenderdetail.com/tenders", isMore: true }
      ]
    },
    {
      title: "Tender by City",
      icon: <MapPin size={20} color="#16A34A" />,
      items: [
        { name: "Mumbai Tenders (2,568+)", url: "https://www.tenderdetail.com/location/mumbai-tenders" },
        { name: "Delhi Tenders (3,672+)", url: "https://www.tenderdetail.com/location/delhi-tenders" },
        { name: "Bangalore Tenders (1,653+)", url: "https://www.tenderdetail.com/location/bangalore-tenders" },
        { name: "Hyderabad Tenders (1,493+)", url: "https://www.tenderdetail.com/location/hyderabad-tenders" },
        { name: "Chennai Tenders (3,760+)", url: "https://www.tenderdetail.com/location/chennai-tenders" },
        { name: "Lucknow Tenders (2,513+)", url: "https://www.tenderdetail.com/location/lucknow-tenders" },
        { name: "Ahmedabad Tenders (2,259+)", url: "https://www.tenderdetail.com/location/ahmedabad-tenders" },
        { name: "Kolkata Tenders (2,968+)", url: "https://www.tenderdetail.com/location/kolkata-tenders" },
        { name: "More →", url: "https://www.tenderdetail.com/City-tenders", isMore: true }
      ]
    },
    {
      title: "Tender by State",
      icon: <Map size={20} color="#9333EA" />,
      items: [
        { name: "Uttar Pradesh Tenders (18,779+)", url: "https://www.tenderdetail.com/State-tenders/uttar-pradesh-tenders" },
        { name: "Maharashtra Tenders (16,592+)", url: "https://www.tenderdetail.com/State-tenders/maharashtra-tenders" },
        { name: "Gujarat Tenders (13,571+)", url: "https://www.tenderdetail.com/State-tenders/gujarat-tenders" },
        { name: "Tamil Nadu Tenders (13,265+)", url: "https://www.tenderdetail.com/State-tenders/tamil-nadu-tenders" },
        { name: "Madhya Pradesh Tenders (10,441+)", url: "https://www.tenderdetail.com/State-tenders/madhya-pradesh-tenders" },
        { name: "Karnataka Tenders (9,658+)", url: "https://www.tenderdetail.com/State-tenders/karnataka-tenders" },
        { name: "Andhra Pradesh Tenders (5,951+)", url: "https://www.tenderdetail.com/State-tenders/andhra-pradesh-tenders" },
        { name: "Telangana Tenders (5,628+)", url: "https://www.tenderdetail.com/State-tenders/telangana-tenders" },
        { name: "More →", url: "https://www.tenderdetail.com/StateTenders/List", isMore: true }
      ]
    },
    {
      title: "Tender By Authority",
      icon: <Building2 size={20} color="#EA580C" />,
      items: [
        { name: "CPWD Tenders", url: "https://www.tenderdetail.com/government-tenders/central-public-works-department-tenders/1?agid=9550" },
        { name: "ONGC Tenders", url: "https://www.tenderdetail.com/government-tenders/oil-and-natural-gas-corporation-limited-tenders/1?agid=9599" },
        { name: "IOCL Tenders", url: "https://www.tenderdetail.com/government-tenders/indian-oil-corporation-limited-tenders/1?agid=1288" },
        { name: "PMGSY Tenders", url: "https://www.tenderdetail.com/government-tenders/pradhan-mantri-gram-sadak-yojana-tenders/1?agid=2386" },
        { name: "NHAI Tenders", url: "https://www.tenderdetail.com/government-tenders/national-highways-authority-of-india-tenders/1?agid=2046" },
        { name: "PWD Tenders", url: "https://www.tenderdetail.com/government-tenders/public-works-department-tenders/1?agid=3002" },
        { name: "SBI Tenders", url: "https://www.tenderdetail.com/government-tenders/state-bank-of-india-tenders/1?agid=2673" },
        { name: "MSTC Tenders", url: "https://www.tenderdetail.com/government-tenders/maharashtra-state-textile-corporation-mstc-tenders/1?agid=90063" },
        { name: "More →", url: "https://www.tenderdetail.com/Authority-tenders", isMore: true }
      ]
    }
  ];

  return (
    <section className="category-cards-section">
      <div className="container">
        <div className="category-cards-grid">
          {cardData.map((card, idx) => (
            <div key={idx} className="category-group-card">
              <div className="category-card-header">
                <span className="category-card-icon">{card.icon}</span>
                <h3>{card.title}</h3>
              </div>
              <ul className="category-card-list">
                {card.items.map((item, iIdx) => (
                  <li key={iIdx}>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`category-item-link ${item.isMore ? 'more-link' : ''}`}
                    >
                      <div className="link-content">
                        <span className="item-bullet">•</span>
                        <span>{item.name}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
