/* ==========================================================================
   GO SCHEME - Schemes Engine, Search, Filter & Strict Eligibility Matching Algorithm
   ========================================================================== */

// Strict & Accurate Eligibility Engine
function evaluateEligibility(scheme, user) {
  if (!user || !user.isProfileComplete) {
    return { isEligible: true, matchPercent: 100, matchReasons: ["Complete profile for personalized match"] };
  }

  const disqualificationReasons = [];
  const matchReasons = [];

  // 1. Strict Gender Constraint
  if (scheme.gender !== "All" && scheme.gender !== user.gender) {
    disqualificationReasons.push(`Requires ${scheme.gender} gender (You specified ${user.gender})`);
  } else {
    matchReasons.push(`✓ Gender Eligibility (${user.gender})`);
  }

  // 2. Strict Age Window Constraint
  if (user.age < scheme.minAge || user.age > scheme.maxAge) {
    disqualificationReasons.push(`Age limit is ${scheme.minAge}-${scheme.maxAge} years (Your age is ${user.age})`);
  } else {
    matchReasons.push(`✓ Age within ${scheme.minAge}-${scheme.maxAge} yrs`);
  }

  // 3. Strict Income Cap Constraint
  if (user.income > scheme.incomeCap) {
    disqualificationReasons.push(`Annual income ceiling is ${formatCurrency(scheme.incomeCap)} (Your income is ${formatCurrency(user.income)})`);
  } else {
    matchReasons.push(`✓ Household Income <= ${formatCurrency(scheme.incomeCap)}`);
  }

  // 4. Qualification & Occupation Constraint
  const edList = Array.isArray(scheme.education) ? scheme.education : [scheme.education];
  const occList = Array.isArray(scheme.occupation) ? scheme.occupation : [scheme.occupation];

  const edMatch = edList.includes("All") || edList.includes(user.education);
  const occMatch = occList.includes("All") || occList.includes(user.occupation);

  if (!edMatch && !occMatch) {
    disqualificationReasons.push(`Requires qualification in [${edList.join(', ')}] or occupation in [${occList.join(', ')}]`);
  } else {
    matchReasons.push(`✓ Qualification (${user.education}) & Occupation (${user.occupation})`);
  }

  // 5. Caste / Category Constraint
  const casteList = Array.isArray(scheme.casteCategory) ? scheme.casteCategory : [scheme.casteCategory];
  const casteMatch = casteList.includes("All") || casteList.includes(user.caste);
  if (!casteMatch) {
    disqualificationReasons.push(`Requires community in [${casteList.join(', ')}] (Your community is ${user.caste})`);
  } else {
    matchReasons.push(`✓ Category Eligibility (${user.caste})`);
  }

  // 6. Pudhumai Penn / Govt School Specific Rule
  if (scheme.id === "TN-001" && user.govtSchoolStudied !== "Yes") {
    disqualificationReasons.push(`Requires Class 6-12 Govt School study certificate`);
  }

  // If any hard constraint fails -> Disqualified!
  if (disqualificationReasons.length > 0) {
    return {
      isEligible: false,
      matchPercent: 0,
      matchReasons: disqualificationReasons.map(r => `✗ ${r}`)
    };
  }

  // Calculate weighted score for 100% eligible candidates
  const maxPoints = 5;
  const currentPoints = matchReasons.length;
  const matchPercent = Math.min(100, Math.round((currentPoints / maxPoints) * 100));

  return {
    isEligible: true,
    matchPercent: matchPercent >= 80 ? 100 : matchPercent,
    matchReasons
  };
}

// Generate Scheme Card HTML
function createSchemeCardHTML(scheme, user = null, isEligibleOnlyPage = false) {
  const savedIds = getSavedSchemeIds();
  const isSaved = savedIds.includes(scheme.id);
  const evalResult = evaluateEligibility(scheme, user);

  // Deadline calculation
  const deadlineDate = new Date(scheme.applicationDeadline);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  const isDeadlineSoon = diffDays <= 30 && diffDays > 0;

  let badgesHTML = `
    <span class="badge ${scheme.level === 'Tamil Nadu' ? 'badge-tn' : 'badge-central'}">${scheme.level}</span>
  `;
  if (scheme.isNew) badgesHTML += `<span class="badge badge-new">New</span>`;
  if (isDeadlineSoon) badgesHTML += `<span class="badge badge-deadline">Deadline Soon</span>`;
  if (evalResult.isEligible && user && user.isProfileComplete) {
    badgesHTML += `<span class="badge badge-eligible">${evalResult.matchPercent}% Match</span>`;
  }

  let matchBoxHTML = '';
  if (isEligibleOnlyPage || (user && user.isProfileComplete && evalResult.isEligible)) {
    matchBoxHTML = `
      <div class="match-reasons-box">
        <div class="match-box-title">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Why You Match:
        </div>
        <div class="match-tags-list">
          ${evalResult.matchReasons.slice(0, 3).map(r => `<span class="match-tag-item">${r}</span>`).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="scheme-card" id="scheme-card-${scheme.id}">
      <div>
        <div class="scheme-card-top">
          <div class="scheme-badges-wrapper">${badgesHTML}</div>
          <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="onBookmarkClick('${scheme.id}', this)" title="${isSaved ? 'Remove Bookmark' : 'Bookmark Scheme'}">
            <svg width="20" height="20" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
          </button>
        </div>
        <h3 class="scheme-title">${scheme.title}</h3>
        <p class="scheme-desc-short">${scheme.description}</p>
        ${matchBoxHTML}
      </div>
      <div>
        <div class="scheme-card-footer">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Key Benefit</span>
            <span class="scheme-benefit-badge">${scheme.benefits.split('.')[0]}</span>
          </div>
          <a href="scheme-details.html?id=${scheme.id}" class="btn btn-outline btn-sm">View Details &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

// Global Bookmark Click Handler
async function onBookmarkClick(schemeId, buttonEl) {
  const isNowSaved = await toggleSavedScheme(schemeId);
  const svg = buttonEl.querySelector('svg');
  if (isNowSaved) {
    buttonEl.classList.add('saved');
    if (svg) svg.setAttribute('fill', 'currentColor');
  } else {
    buttonEl.classList.remove('saved');
    if (svg) svg.setAttribute('fill', 'none');
  }

  // If on saved-schemes.html page, re-render saved grid
  if (window.location.pathname.includes('saved-schemes.html')) {
    renderSavedSchemesPage();
  }
}

// Page Specific Renderers
document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();

  // Sync saved schemes from API if logged in
  if (getToken()) {
    const savedRes = await apiFetch("/saved-schemes");
    if (savedRes && savedRes.success && savedRes.savedIds) {
      localStorage.setItem("goscheme_saved", JSON.stringify(savedRes.savedIds));
    }
  }

  // Explore Schemes Page
  if (document.getElementById("explore-schemes-grid")) {
    renderExploreSchemes(user);
  }

  // Eligible Schemes Page
  if (document.getElementById("eligible-schemes-grid")) {
    renderEligibleSchemes(user);
  }

  // Saved Schemes Page
  if (document.getElementById("saved-schemes-grid")) {
    renderSavedSchemesPage();
  }

  // Scheme Details Page
  if (document.getElementById("scheme-details-container")) {
    renderSchemeDetailsPage(user);
  }
});

async function renderExploreSchemes(user) {
  const grid = document.getElementById("explore-schemes-grid");
  const searchInput = document.getElementById("scheme-search-input");
  const levelFilter = document.getElementById("filter-level");
  const categoryFilter = document.getElementById("filter-category");
  const countDisplay = document.getElementById("schemes-count-text");

  let schemes = [];
  const res = await apiFetch("/schemes");
  if (res && res.success && res.schemes) {
    schemes = res.schemes;
    saveSchemes(schemes);
  } else {
    schemes = getStoredSchemes().filter(s => s.status === "Active");
  }

  function filterAndDraw() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedLevel = levelFilter ? levelFilter.value : "All";
    const selectedCat = categoryFilter ? categoryFilter.value : "All";

    const filtered = schemes.filter(s => {
      const matchQuery = s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query) || s.category.toLowerCase().includes(query) || s.department.toLowerCase().includes(query);
      const matchLevel = selectedLevel === "All" || s.level === selectedLevel;
      const matchCat = selectedCat === "All" || s.category.includes(selectedCat);
      return matchQuery && matchLevel && matchCat;
    });

    if (countDisplay) {
      countDisplay.innerText = `Showing ${filtered.length} Schemes`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="card">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No schemes found</h3>
          <p style="color: var(--text-muted);">Try adjusting your search terms or filters.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(s => createSchemeCardHTML(s, user)).join('');
    }
  }

  if (searchInput) searchInput.addEventListener("input", filterAndDraw);
  if (levelFilter) levelFilter.addEventListener("change", filterAndDraw);
  if (categoryFilter) categoryFilter.addEventListener("change", filterAndDraw);

  filterAndDraw();
}

async function renderEligibleSchemes(user) {
  const grid = document.getElementById("eligible-schemes-grid");
  const countDisplay = document.getElementById("eligible-count-heading");

  if (!user || !user.isProfileComplete) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="card">
        <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">Profile incomplete</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Please set up your profile details to view customized eligible schemes.</p>
        <a href="profile-setup.html" class="btn btn-primary">Complete Profile Setup &rarr;</a>
      </div>
    `;
    return;
  }

  let eligibleList = [];
  if (getToken()) {
    const res = await apiFetch("/schemes/eligible");
    if (res && res.success && res.schemes) {
      eligibleList = res.schemes.map(s => ({ scheme: s, eval: { isEligible: true, matchPercent: s.matchPercent, matchReasons: s.matchReasons } }));
    }
  }

  if (eligibleList.length === 0) {
    const schemes = getStoredSchemes().filter(s => s.status === "Active");
    eligibleList = schemes
      .map(s => ({ scheme: s, eval: evaluateEligibility(s, user) }))
      .filter(item => item.eval.isEligible)
      .sort((a, b) => b.eval.matchPercent - a.eval.matchPercent);
  }

  if (countDisplay) {
    countDisplay.innerText = `Matched (${eligibleList.length}) Schemes For ${user.fullName}`;
  }

  if (eligibleList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="card">
        <h3>No direct matching schemes currently found</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try updating your income or qualification details in your profile.</p>
      </div>
    `;
  } else {
    grid.innerHTML = eligibleList.map(item => createSchemeCardHTML(item.scheme, user, true)).join('');
  }
}

async function renderSavedSchemesPage() {
  const grid = document.getElementById("saved-schemes-grid");
  const countDisplay = document.getElementById("saved-count-text");
  const user = getStoredUser();

  let schemes = [];
  if (getToken()) {
    const res = await apiFetch("/saved-schemes");
    if (res && res.success && res.schemes) {
      schemes = res.schemes;
      localStorage.setItem("goscheme_saved", JSON.stringify(res.savedIds));
    }
  }

  if (schemes.length === 0) {
    const savedIds = getSavedSchemeIds();
    schemes = getStoredSchemes().filter(s => savedIds.includes(s.id));
  }

  if (countDisplay) {
    countDisplay.innerText = `${schemes.length} Bookmarked Schemes`;
  }

  if (schemes.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;" class="card">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--rose);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No saved schemes yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Bookmark schemes while browsing to easily access them here later.</p>
        <a href="explore-schemes.html" class="btn btn-primary">Explore All Schemes &rarr;</a>
      </div>
    `;
  } else {
    grid.innerHTML = schemes.map(s => createSchemeCardHTML(s, user)).join('');
  }
}

let activeSchemeOfficialUrl = "";

async function renderSchemeDetailsPage(user) {
  const container = document.getElementById("scheme-details-container");
  const urlParams = new URLSearchParams(window.location.search);
  const schemeId = urlParams.get("id");

  let scheme = null;
  if (schemeId) {
    const res = await apiFetch(`/schemes/${schemeId}`);
    if (res && res.success && res.scheme) {
      scheme = res.scheme;
    }
  }

  if (!scheme) {
    const schemes = getStoredSchemes();
    scheme = schemes.find(s => s.id === schemeId) || schemes[0];
  }

  activeSchemeOfficialUrl = scheme.officialUrl || "https://www.tn.gov.in";

  const evalResult = evaluateEligibility(scheme, user);
  const savedIds = getSavedSchemeIds();
  const isSaved = savedIds.includes(scheme.id);

  const edText = Array.isArray(scheme.education) ? scheme.education.join(', ') : scheme.education;
  const occText = Array.isArray(scheme.occupation) ? scheme.occupation.join(', ') : scheme.occupation;
  const docList = Array.isArray(scheme.documents) ? scheme.documents : typeof scheme.documents === 'string' ? scheme.documents.split(',') : [];

  container.innerHTML = `
    <div class="scheme-details-hero">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge ${scheme.level === 'Tamil Nadu' ? 'badge-tn' : 'badge-central'}">${scheme.level}</span>
          <span class="badge badge-category">${scheme.category}</span>
          ${evalResult.isEligible && user && user.isProfileComplete ? `<span class="badge badge-eligible">${evalResult.matchPercent}% Match</span>` : ''}
        </div>
        <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="onBookmarkClick('${scheme.id}', this)" style="padding: 0.5rem;">
          <svg width="24" height="24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
        </button>
      </div>

      <h1 style="font-size: 2rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 0.75rem;">${scheme.title}</h1>
      <p style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">${scheme.department}</p>

      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button onclick="confirmApplyModal()" class="btn btn-primary btn-lg">Apply on Official Government Website &nearr;</button>
        <button onclick="window.print()" class="btn btn-outline btn-lg">Print Details</button>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="details-section-box">
          <h2 class="details-section-title">Overview & Benefits</h2>
          <p style="font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 1.5rem;">${scheme.description}</p>
          
          <div style="background: var(--emerald-light); border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 1.25rem;">
            <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--emerald-hover); margin-bottom: 0.35rem;">Financial Benefit Package</h3>
            <p style="font-size: 1.1rem; font-weight: 700; color: var(--primary-navy);">${scheme.benefits}</p>
          </div>
        </div>

        <div class="details-section-box">
          <h2 class="details-section-title">Eligibility Criteria</h2>
          <ul style="display: flex; flex-direction: column; gap: 0.75rem;">
            <li style="display: flex; gap: 0.75rem; align-items: center;"><svg width="20" height="20" fill="none" stroke="var(--emerald)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> <strong>Gender:</strong> ${scheme.gender}</li>
            <li style="display: flex; gap: 0.75rem; align-items: center;"><svg width="20" height="20" fill="none" stroke="var(--emerald)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> <strong>Age Limit:</strong> ${scheme.minAge} to ${scheme.maxAge} years</li>
            <li style="display: flex; gap: 0.75rem; align-items: center;"><svg width="20" height="20" fill="none" stroke="var(--emerald)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> <strong>Income Ceiling:</strong> Up to ${formatCurrency(scheme.incomeCap)} per annum</li>
            <li style="display: flex; gap: 0.75rem; align-items: center;"><svg width="20" height="20" fill="none" stroke="var(--emerald)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> <strong>Eligible Qualifications:</strong> ${edText}</li>
            <li style="display: flex; gap: 0.75rem; align-items: center;"><svg width="20" height="20" fill="none" stroke="var(--emerald)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> <strong>Eligible Occupations:</strong> ${occText}</li>
          </ul>
        </div>

        <div class="details-section-box">
          <h2 class="details-section-title">Required Checklist Documents</h2>
          <div class="req-docs-list">
            ${docList.map(doc => `
              <div class="doc-item">
                <span class="doc-name">
                  <svg width="18" height="18" fill="none" stroke="var(--royal-blue)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  ${doc.trim()}
                </span>
                <span class="badge badge-new">Required</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div>
        <div class="countdown-card">
          <h3 style="font-size: 1rem; font-weight: 700; color: #CBD5E1;">Application Deadline</h3>
          <div style="font-size: 1.1rem; font-weight: 800; color: white; margin-top: 0.35rem;">${scheme.applicationDeadline}</div>

          <div class="countdown-timer">
            <div class="timer-unit"><div class="timer-num" id="cd-days">42</div><div class="timer-label">Days</div></div>
            <div class="timer-unit"><div class="timer-num" id="cd-hours">14</div><div class="timer-label">Hours</div></div>
            <div class="timer-unit"><div class="timer-num" id="cd-mins">28</div><div class="timer-label">Mins</div></div>
          </div>
          <button onclick="confirmApplyModal()" class="btn btn-teal btn-block" style="margin-top: 1rem;">Apply Now &rarr;</button>
        </div>
      </div>
    </div>
  `;

  // Set official apply link button href immediately
  const linkBtn = document.getElementById("official-apply-link-btn");
  if (linkBtn) {
    linkBtn.href = activeSchemeOfficialUrl;
  }

  initCountdownTimer(scheme.applicationDeadline);
}

function initCountdownTimer(deadlineStr) {
  const targetDate = new Date(deadlineStr).getTime();
  
  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      if (document.getElementById("cd-days")) document.getElementById("cd-days").innerText = "00";
      if (document.getElementById("cd-hours")) document.getElementById("cd-hours").innerText = "00";
      if (document.getElementById("cd-mins")) document.getElementById("cd-mins").innerText = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (document.getElementById("cd-days")) document.getElementById("cd-days").innerText = String(days).padStart(2, '0');
    if (document.getElementById("cd-hours")) document.getElementById("cd-hours").innerText = String(hours).padStart(2, '0');
    if (document.getElementById("cd-mins")) document.getElementById("cd-mins").innerText = String(mins).padStart(2, '0');
  }

  update();
  setInterval(update, 60000);
}

window.confirmApplyModal = function(url) {
  const targetUrl = url || activeSchemeOfficialUrl || "https://www.tn.gov.in";
  const linkBtn = document.getElementById("official-apply-link-btn");
  if (linkBtn) {
    linkBtn.href = targetUrl;
  }
  const modal = document.getElementById("apply-modal");
  if (modal) {
    openModal("apply-modal");
  } else {
    window.open(targetUrl, "_blank");
  }
};
