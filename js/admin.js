/* Admin Portal Logic & API Integration */

document.addEventListener("DOMContentLoaded", () => {
  // Admin Login
  const adminLoginForm = document.getElementById("admin-login-form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pass = document.getElementById("adminPassword")?.value;
      
      const res = await apiFetch("/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: pass })
      });

      if (res && res.success) {
        setToken(res.token);
        localStorage.setItem("goscheme_admin_logged_in", "true");
        showToast("Admin access granted! Redirecting...", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      } else if (pass === "admin123" || pass === "admin") {
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
    addSchemeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newSchemePayload = {
        title: document.getElementById("schemeTitle").value,
        department: document.getElementById("schemeDepartment").value,
        level: document.getElementById("schemeLevel").value,
        category: document.getElementById("schemeCategory").value,
        minAge: parseInt(document.getElementById("schemeMinAge").value || "0"),
        maxAge: parseInt(document.getElementById("schemeMaxAge").value || "100"),
        gender: document.getElementById("schemeGender").value,
        incomeCap: parseInt(document.getElementById("schemeIncomeCap").value || "9999999"),
        education: document.getElementById("schemeEducation").value,
        occupation: document.getElementById("schemeOccupation").value,
        benefits: document.getElementById("schemeBenefits").value,
        applicationDeadline: document.getElementById("schemeDeadline").value,
        officialUrl: document.getElementById("schemeOfficialUrl").value,
        description: document.getElementById("schemeDescription").value,
        documents: document.getElementById("schemeDocuments").value
      };

      const res = await apiFetch("/admin/schemes", {
        method: "POST",
        body: JSON.stringify(newSchemePayload)
      });

      if (res && res.success) {
        showToast("New Scheme Added Successfully!", "success");
        setTimeout(() => window.location.href = "manage-schemes.html", 1200);
        return;
      }

      // Local fallback
      const schemes = getStoredSchemes();
      const newId = `TN-${String(schemes.length + 1).padStart(3, '0')}`;
      const newScheme = {
        id: newId,
        ...newSchemePayload,
        education: [newSchemePayload.education],
        occupation: [newSchemePayload.occupation],
        casteCategory: ["All"],
        districtEligibility: "All Tamil Nadu Districts",
        documents: typeof newSchemePayload.documents === 'string' ? newSchemePayload.documents.split(',').map(d => d.trim()) : [],
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

async function renderAdminDashboardMetrics() {
  const res = await apiFetch("/admin/metrics");
  if (res && res.success && res.metrics) {
    const { totalSchemes, activeSchemes, tnSchemes, centralSchemes } = res.metrics;
    if (document.getElementById("admin-total-schemes-count")) document.getElementById("admin-total-schemes-count").innerText = totalSchemes;
    if (document.getElementById("admin-active-schemes-count")) document.getElementById("admin-active-schemes-count").innerText = activeSchemes;
    if (document.getElementById("admin-tn-schemes-count")) document.getElementById("admin-tn-schemes-count").innerText = tnSchemes;
    if (document.getElementById("admin-central-schemes-count")) document.getElementById("admin-central-schemes-count").innerText = centralSchemes;
    return;
  }

  const schemes = getStoredSchemes();
  const activeCount = schemes.filter(s => s.status === "Active").length;
  const tnCount = schemes.filter(s => s.level === "Tamil Nadu").length;
  const centralCount = schemes.filter(s => s.level === "Central").length;

  if (document.getElementById("admin-total-schemes-count")) document.getElementById("admin-total-schemes-count").innerText = schemes.length;
  if (document.getElementById("admin-active-schemes-count")) document.getElementById("admin-active-schemes-count").innerText = activeCount;
  if (document.getElementById("admin-tn-schemes-count")) document.getElementById("admin-tn-schemes-count").innerText = tnCount;
  if (document.getElementById("admin-central-schemes-count")) document.getElementById("admin-central-schemes-count").innerText = centralCount;
}

async function renderAdminSchemesTable() {
  const tbody = document.getElementById("admin-schemes-table-body");
  const searchInput = document.getElementById("admin-search-input");
  
  let schemes = [];
  const res = await apiFetch("/schemes?status=all");
  if (res && res.success && res.schemes) {
    schemes = res.schemes;
  } else {
    schemes = getStoredSchemes();
  }

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

window.toggleAdminSchemeStatus = async function(schemeId) {
  const res = await apiFetch(`/admin/schemes/${schemeId}/status`, { method: "PUT" });
  if (res && res.success) {
    showToast(`Scheme ${schemeId} status updated to ${res.newStatus}`, "info");
    renderAdminSchemesTable();
    return;
  }

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

window.deleteAdminScheme = async function(schemeId) {
  if (confirm(`Are you sure you want to delete scheme ${schemeId}?`)) {
    const res = await apiFetch(`/admin/schemes/${schemeId}`, { method: "DELETE" });
    if (res && res.success) {
      showToast(`Scheme ${schemeId} deleted`, "error");
      renderAdminSchemesTable();
      return;
    }

    let schemes = getStoredSchemes();
    schemes = schemes.filter(s => s.id !== schemeId);
    saveSchemes(schemes);
    showToast(`Scheme ${schemeId} deleted`, "error");
    renderAdminSchemesTable();
  }
};

/* ==========================================================================
   Automated Scheme Scraper Admin Controls & Live Sync Viewer
   ========================================================================== */

async function renderScraperControls() {
  const badgeEl = document.getElementById("scraper-status-badge");
  const lastRunEl = document.getElementById("scraper-last-run-time");
  const nextSchedEl = document.getElementById("scraper-next-schedule");
  const logsTbody = document.getElementById("scraper-logs-table-body");
  const triggerBtn = document.getElementById("btn-trigger-scraper");
  const btnText = document.getElementById("btn-scraper-text");

  // 1. Fetch live status from /api/scraper/status
  try {
    const res = await apiFetch("/scraper/status");
    if (res && res.success && res.data) {
      const data = res.data;
      if (badgeEl) {
        badgeEl.innerText = data.isSchedulerActive ? "🟢 Active (Cron Every 6 hrs)" : "⚪ Idle";
        badgeEl.style.color = data.isSchedulerActive ? "var(--teal)" : "var(--text-muted)";
      }
      if (lastRunEl) {
        if (data.lastLog && data.lastLog.completed_at) {
          const date = new Date(data.lastLog.completed_at);
          lastRunEl.innerText = date.toLocaleString();
        } else {
          lastRunEl.innerText = "Never / Initializing";
        }
      }
      if (nextSchedEl && data.schedule) {
        nextSchedEl.innerText = `Scheduled (${data.schedule})`;
      }
    }
  } catch (err) {
    if (lastRunEl) lastRunEl.innerText = "Local Mode";
  }

  // 2. Fetch and draw execution logs
  async function loadLogs() {
    if (!logsTbody) return;
    try {
      const res = await apiFetch("/scraper/logs?limit=10");
      if (res && res.success && res.logs && res.logs.length > 0) {
        logsTbody.innerHTML = res.logs.map(log => {
          const dateStr = log.completed_at ? new Date(log.completed_at).toLocaleString() : (log.started_at ? new Date(log.started_at).toLocaleString() : 'Just now');
          const statusBadge = log.status === 'success' 
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald-hover); font-weight: 700;">Success</span>`
            : `<span class="badge" style="background: rgba(244, 63, 94, 0.15); color: var(--rose); font-weight: 700;">${log.status}</span>`;

          return `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.65rem 0.5rem; font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap;">${dateStr}</td>
              <td style="padding: 0.65rem 0.5rem; font-weight: 600; color: var(--primary-navy);">${log.source || 'Auto'}</td>
              <td style="padding: 0.65rem 0.5rem;">${statusBadge}</td>
              <td style="padding: 0.65rem 0.5rem; font-weight: 700; color: var(--primary-navy);">${log.schemes_scraped || 0}</td>
              <td style="padding: 0.65rem 0.5rem; font-weight: 700; color: var(--teal);">${log.schemes_added || 0}</td>
              <td style="padding: 0.65rem 0.5rem; font-weight: 700; color: var(--royal-blue);">${log.schemes_updated || 0}</td>
              <td style="padding: 0.65rem 0.5rem; font-size: 0.8rem; color: var(--text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.details || ''}">
                ${log.details || 'Scrape completed'}
              </td>
            </tr>
          `;
        }).join('');
      } else {
        logsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No scraper logs recorded yet. Click "Run Scraper Now" above to initiate first scrape.</td></tr>`;
      }
    } catch (err) {
      logsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Scraper logging available when backend server is active.</td></tr>`;
    }
  }

  loadLogs();

  // 3. Wire up manual scraper trigger button
  if (triggerBtn) {
    triggerBtn.addEventListener("click", async () => {
      triggerBtn.disabled = true;
      if (btnText) btnText.innerText = "Scraping Portals...";
      triggerBtn.style.opacity = "0.7";
      showToast("Live scraper initiated! Crawling Tamil Nadu portal...", "info");

      try {
        const res = await apiFetch("/scraper/trigger", {
          method: "POST",
          body: JSON.stringify({ source: "Admin Dashboard Manual Run" })
        });

        if (res && res.success) {
          showToast(res.message || "Scraper completed! Database synchronized.", "success");
          if (lastRunEl) lastRunEl.innerText = new Date().toLocaleString();
          renderAdminDashboardMetrics();
          loadLogs();
        } else {
          showToast(res?.message || "Scraper could not complete.", "error");
        }
      } catch (err) {
        showToast("Error communicating with scraper API.", "error");
      } finally {
        triggerBtn.disabled = false;
        if (btnText) btnText.innerText = "Run Scraper Now";
        triggerBtn.style.opacity = "1";
      }
    });
  }
}

// Call renderScraperControls if panel exists on admin dashboard
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("btn-trigger-scraper")) {
    renderScraperControls();
  }
});

