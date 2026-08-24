/* ==========================================================================
   TENDERDETAIL.COM - ENTERPRISE AI APPLICATION LOGIC
   ========================================================================== */

// Real Tenders Data from Prompt
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

// Browse Directories Data
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

let currentLiveFilter = 'all';
let currentPillFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Navbar Scroll effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.background = '#082944';
      navbar.style.boxShadow = '0 6px 25px rgba(11, 59, 96, 0.4)';
    } else {
      navbar.style.background = '#0B3B60';
      navbar.style.boxShadow = '0 4px 20px rgba(11, 59, 96, 0.25)';
    }
  });

  // Render initial components
  renderLiveTenders(liveTenders);
  switchBrowseTab('categories');
  runBidSimulation();
});

/* --------------------------------------------------------------------------
   1. LIVE FEED TENDER RENDERING & FILTERS
   -------------------------------------------------------------------------- */
function renderLiveTenders(items) {
  const container = document.getElementById('liveTendersList');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        No tenders matching your filter criteria. Try expanding your search keyword or state selection.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="tender-card">
      <div>
        <div class="tender-card-header">
          <span class="tender-badge ${item.status === 'Live' ? 'badge-live' : 'badge-offline'}">${item.type} • ${item.status}</span>
          <span class="tender-id">${item.id}</span>
          <span style="color: var(--accent-cyan); font-weight: 600; font-size: 0.85rem;">📍 ${item.state}</span>
        </div>
        
        <a href="${item.link}" target="_blank" class="tender-title" style="display: block;">
          ${item.title}
        </a>

        <div class="tender-meta">
          <div class="tender-meta-item">
            <i data-lucide="building-2"></i> ${item.department}
          </div>
          <div class="tender-meta-item">
            <i data-lucide="clock"></i> Closes ${item.closes} · <strong>${item.daysLeft}</strong>
          </div>
        </div>

        <div class="tender-actions">
          ${item.docs.map(doc => `<span class="tender-tag-btn">📄 ${doc}</span>`).join('')}
        </div>
      </div>

      <div class="tender-price-box">
        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">Estimated Value</div>
        <div class="tender-price">${item.value}</div>
        <div class="tender-closing">${item.daysLeft}</div>
        <button onclick="openDemoModal('Bid Analysis: ${item.id}')" class="btn btn-outline full-width" style="margin-top: 10px; font-size: 0.82rem; padding: 8px 12px;">
          <i data-lucide="sparkles"></i> AI Bid Strategy
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function filterLiveFeed(btn, cat) {
  document.querySelectorAll('.live-feed-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentLiveFilter = cat;

  applyAllFilters();
}

/* --------------------------------------------------------------------------
   2. HERO SEARCH & QUICK PILLS
   -------------------------------------------------------------------------- */
function filterHeroPill(el, pillCat) {
  document.querySelectorAll('.hero-pills .pill-tag').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  currentPillFilter = pillCat;
  handleHeroSearch();
}

function handleHeroSearch() {
  const keyword = document.getElementById('heroSearchKeyword').value.toLowerCase().trim();
  const selectedState = document.getElementById('heroStateFilter').value;

  let filtered = liveTenders.filter(item => {
    // Keyword match
    const matchKeyword = !keyword || 
      item.title.toLowerCase().includes(keyword) || 
      item.department.toLowerCase().includes(keyword) || 
      item.id.toLowerCase().includes(keyword);

    // State match
    const matchState = !selectedState || item.state === selectedState;

    // Pill match
    let matchPill = true;
    if (currentPillFilter === 'gem') matchPill = item.category === 'gem';
    if (currentPillFilter === 'private') matchPill = item.category === 'private';
    if (currentPillFilter === 'exempted') matchPill = item.docs.some(d => d.includes('Exemption'));
    if (currentPillFilter === 'defence') matchPill = item.department.toLowerCase().includes('defence') || item.title.toLowerCase().includes('defence');
    if (currentPillFilter === 'railways') matchPill = item.department.toLowerCase().includes('railway') || item.title.toLowerCase().includes('road') || item.title.toLowerCase().includes('railway');

    return matchKeyword && matchState && matchPill;
  });

  renderLiveTenders(filtered);

  // Scroll smoothly to live feed if search initiated
  const liveSection = document.getElementById('live-feed');
  if (liveSection && (keyword || selectedState)) {
    liveSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function applyAllFilters() {
  let filtered = liveTenders;
  if (currentLiveFilter !== 'all') {
    filtered = filtered.filter(t => t.category === currentLiveFilter);
  }
  renderLiveTenders(filtered);
}

/* --------------------------------------------------------------------------
   3. BROWSE DIRECTORY TABS
   -------------------------------------------------------------------------- */
function switchBrowseTab(tabKey, clickedBtn) {
  if (clickedBtn) {
    document.querySelectorAll('.browse-tab-item').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');
  }

  const area = document.getElementById('browseContentArea');
  if (!area) return;

  const dataList = browseDirectories[tabKey] || [];

  area.innerHTML = `
    <div class="browse-links-grid">
      ${dataList.map(item => `
        <a href="${item.url}" target="_blank" class="directory-link-card">
          <span>${item.name}</span>
          <i data-lucide="arrow-right"></i>
        </a>
      `).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/* --------------------------------------------------------------------------
   4. AI BID WIN SIMULATOR
   -------------------------------------------------------------------------- */
function runBidSimulation() {
  const sector = document.getElementById('simSector')?.value || 'construction';
  const val = parseFloat(document.getElementById('simTenderVal')?.value) || 5.0;
  const margin = parseFloat(document.getElementById('simMargin')?.value) || 9.0;

  const marginDisp = document.getElementById('marginValDisp');
  if (marginDisp) marginDisp.textContent = `${margin.toFixed(1)}%`;

  // Dynamic formula based on margin & value
  let baseWinRate = 92.0 - (margin * 2.1);
  if (sector === 'it') baseWinRate += 4;
  if (sector === 'pharma') baseWinRate += 2;
  if (baseWinRate > 98) baseWinRate = 98.4;
  if (baseWinRate < 35) baseWinRate = 35.1;

  const optimumPrice = val * (1 - (margin / 100) * 0.9);

  const probEl = document.getElementById('simWinProb');
  const optEl = document.getElementById('simOptimumBid');

  if (probEl) probEl.textContent = `${baseWinRate.toFixed(1)}%`;
  if (optEl) optEl.textContent = `Recommended L1 Bid: ₹${optimumPrice.toFixed(2)} Crore`;
}

/* --------------------------------------------------------------------------
   5. DEMO MODAL HANDLERS
   -------------------------------------------------------------------------- */
function openDemoModal(serviceName) {
  const modal = document.getElementById('demoModal');
  const title = document.getElementById('modalTitle');
  const serviceInput = document.getElementById('serviceType');

  if (serviceName) {
    title.textContent = `Request Information: ${serviceName}`;
    serviceInput.value = serviceName;
  } else {
    title.textContent = `Request Competitive Bid Analysis Demo`;
    serviceInput.value = `Competitive Bid Analysis`;
  }

  if (modal) modal.classList.add('active');
}

function closeDemoModal() {
  const modal = document.getElementById('demoModal');
  if (modal) modal.classList.remove('active');
}

function handleDemoSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reqName').value;
  const email = document.getElementById('reqEmail').value;
  const phone = document.getElementById('reqPhone').value;
  const company = document.getElementById('reqCompany').value || 'Enterprise';
  const service = document.getElementById('serviceType').value;

  closeDemoModal();

  showToast(`Thank you ${name}! Your demo request for "${service}" has been received. Our sales executive will call you at ${phone} within 24 hours.`, 'success');

  // Reset form
  document.getElementById('demoReqForm').reset();
}

/* --------------------------------------------------------------------------
   5.5. LOGIN MODAL HANDLERS
   -------------------------------------------------------------------------- */
function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('active');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  closeLoginModal();
  showToast(`Welcome back! Successfully logged in as ${email}.`, 'success');
  document.getElementById('loginForm').reset();
}

/* --------------------------------------------------------------------------
   5.8. SERVICES DROPDOWN TOGGLE
   -------------------------------------------------------------------------- */
function toggleServicesDropdown(e) {
  e.preventDefault();
  const dropdown = document.getElementById('servicesDropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

// Close dropdown when clicking anywhere outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('servicesDropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

/* --------------------------------------------------------------------------
   6. TOAST SYSTEM
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-gold)';

  const icon = type === 'success' ? 'check-circle-2' : 'info';

  toast.innerHTML = `
    <i data-lucide="${icon}" style="color: ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-gold)'};"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
