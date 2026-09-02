/* Admin Portal Logic & CRUD Simulation */

document.addEventListener("DOMContentLoaded", () => {
  // Admin Login
  const adminLoginForm = document.getElementById("admin-login-form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const pass = document.getElementById("adminPassword")?.value;
      if (pass === "admin123" || pass === "admin") {
        localStorage.setItem("goscheme_admin_logged_in", "true");
        showToast("Admin access granted! Redirecting...", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      } else {
        showToast("Invalid Admin Password! (Use: admin123)", "error");
      }
    });
  }

  // Admin Manage Schemes Table Render
  if (document.getElementById("admin-schemes-table-body")) {
    renderAdminSchemesTable();
  }

  // Admin Dashboard Stats
  if (document.getElementById("admin-total-schemes-count")) {
    renderAdminDashboardMetrics();
  }

  // Admin Add Scheme Form
  const addSchemeForm = document.getElementById("admin-add-scheme-form");
  if (addSchemeForm) {
    addSchemeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const schemes = getStoredSchemes();

      const newId = `TN-${String(schemes.length + 1).padStart(3, '0')}`;
      const newScheme = {
        id: newId,
        title: document.getElementById("schemeTitle").value,
        department: document.getElementById("schemeDepartment").value,
        level: document.getElementById("schemeLevel").value,
        category: document.getElementById("schemeCategory").value,
        minAge: parseInt(document.getElementById("schemeMinAge").value || "0"),
        maxAge: parseInt(document.getElementById("schemeMaxAge").value || "100"),
        gender: document.getElementById("schemeGender").value,
        incomeCap: parseInt(document.getElementById("schemeIncomeCap").value || "9999999"),
        education: [document.getElementById("schemeEducation").value],
        occupation: [document.getElementById("schemeOccupation").value],
        casteCategory: ["All"],
        districtEligibility: "All Tamil Nadu Districts",
        benefits: document.getElementById("schemeBenefits").value,
        applicationDeadline: document.getElementById("schemeDeadline").value,
        officialUrl: document.getElementById("schemeOfficialUrl").value,
        description: document.getElementById("schemeDescription").value,
        documents: document.getElementById("schemeDocuments").value.split(',').map(d => d.trim()),
        isNew: true,
        status: "Active"
      };

      schemes.unshift(newScheme);
      saveSchemes(schemes);

      showToast("New Scheme Added Successfully!", "success");
      setTimeout(() => window.location.href = "manage-schemes.html", 1200);
    });
  }
});

function renderAdminDashboardMetrics() {
  const schemes = getStoredSchemes();
  const activeCount = schemes.filter(s => s.status === "Active").length;
  const tnCount = schemes.filter(s => s.level === "Tamil Nadu").length;
  const centralCount = schemes.filter(s => s.level === "Central").length;

  if (document.getElementById("admin-total-schemes-count")) document.getElementById("admin-total-schemes-count").innerText = schemes.length;
  if (document.getElementById("admin-active-schemes-count")) document.getElementById("admin-active-schemes-count").innerText = activeCount;
  if (document.getElementById("admin-tn-schemes-count")) document.getElementById("admin-tn-schemes-count").innerText = tnCount;
  if (document.getElementById("admin-central-schemes-count")) document.getElementById("admin-central-schemes-count").innerText = centralCount;
}

function renderAdminSchemesTable() {
  const tbody = document.getElementById("admin-schemes-table-body");
  const searchInput = document.getElementById("admin-search-input");
  const schemes = getStoredSchemes();

  function drawTable() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filtered = schemes.filter(s => s.title.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No schemes found matching search criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(scheme => `
      <tr>
        <td><strong>${scheme.id}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--primary-navy);">${scheme.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${scheme.department}</div>
        </td>
        <td><span class="badge ${scheme.level === 'Tamil Nadu' ? 'badge-tn' : 'badge-central'}">${scheme.level}</span></td>
        <td><span class="badge badge-category">${scheme.category}</span></td>
        <td>
          <button onclick="toggleAdminSchemeStatus('${scheme.id}')" class="status-toggle-btn ${scheme.status === 'Active' ? 'active' : 'inactive'}">
            ${scheme.status}
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button onclick="deleteAdminScheme('${scheme.id}')" class="table-action-btn delete" title="Delete Scheme">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (searchInput) searchInput.addEventListener("input", drawTable);
  drawTable();
}

window.toggleAdminSchemeStatus = function(schemeId) {
  let schemes = getStoredSchemes();
  schemes = schemes.map(s => {
    if (s.id === schemeId) {
      const newStatus = s.status === "Active" ? "Inactive" : "Active";
      showToast(`Scheme ${s.id} status changed to ${newStatus}`, "info");
      return { ...s, status: newStatus };
    }
    return s;
  });
  saveSchemes(schemes);
  renderAdminSchemesTable();
};

window.deleteAdminScheme = function(schemeId) {
  if (confirm(`Are you sure you want to delete scheme ${schemeId}?`)) {
    let schemes = getStoredSchemes();
    schemes = schemes.filter(s => s.id !== schemeId);
    saveSchemes(schemes);
    showToast(`Scheme ${schemeId} deleted`, "error");
    renderAdminSchemesTable();
  }
};
