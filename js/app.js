/* ==========================================================================
   GO SCHEME - Global Application Utilities & API Client
   ========================================================================== */

const API_BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("goscheme_jwt_token");
}

function setToken(token) {
  if (token) localStorage.setItem("goscheme_jwt_token", token);
  else localStorage.removeItem("goscheme_jwt_token");
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("API request fallback to local mode:", err);
    return null;
  }
}

// Storage Getters & Setters
function getStoredUser() {
  const data = localStorage.getItem("goscheme_user");
  return data ? JSON.parse(data) : null;
}

function saveUser(userObj) {
  localStorage.setItem("goscheme_user", JSON.stringify(userObj));
}

function getStoredSchemes() {
  const data = localStorage.getItem("goscheme_schemes");
  return data ? JSON.parse(data) : typeof INITIAL_SCHEMES !== 'undefined' ? INITIAL_SCHEMES : [];
}

function saveSchemes(schemesArr) {
  localStorage.setItem("goscheme_schemes", JSON.stringify(schemesArr));
}

function getSavedSchemeIds() {
  const data = localStorage.getItem("goscheme_saved");
  return data ? JSON.parse(data) : [];
}

async function toggleSavedScheme(schemeId) {
  let saved = getSavedSchemeIds();
  if (saved.includes(schemeId)) {
    saved = saved.filter(id => id !== schemeId);
    showToast("Scheme removed from saved list", "info");
  } else {
    saved.push(schemeId);
    showToast("Scheme saved successfully!", "success");
  }
  localStorage.setItem("goscheme_saved", JSON.stringify(saved));

  if (getToken()) {
    await apiFetch("/saved-schemes/toggle", {
      method: "POST",
      body: JSON.stringify({ schemeId })
    });
  }

  return saved.includes(schemeId);
}

function getNotifications() {
  const data = localStorage.getItem("goscheme_notifications");
  return data ? JSON.parse(data) : [];
}

function saveNotifications(notifArr) {
  localStorage.setItem("goscheme_notifications", JSON.stringify(notifArr));
}

// Toast Notifications System
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  if (type === "success") {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  }

  toast.innerHTML = `${iconSvg} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Controllers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

// Calculate age from Date of Birth
function calculateAgeFromDOB(dobString) {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

// Format Currency
function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Global Nav & Header Renderer
async function updateHeaderNavState() {
  const userNavContainer = document.getElementById("header-user-nav");

  const isSubdir = window.location.pathname.includes('/admin/');
  const prefix = isSubdir ? '../' : '';
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let user = null;
  const token = getToken();

  if (token) {
    const res = await apiFetch("/auth/me");
    if (res && res.success && res.user) {
      user = res.user;
      saveUser(user);
    } else {
      user = getStoredUser();
    }
  }

  if (userNavContainer) {
    if (token && user && user.isProfileComplete) {
      const notifications = getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      const isNotifPage = currentPath === 'notifications.html';
      const isProfilePage = currentPath === 'profile.html';

      userNavContainer.innerHTML = `
        <a href="${prefix}notifications.html" class="nav-link ${isNotifPage ? 'active' : ''}" style="position: relative; margin-right: 0.5rem; display: flex; align-items: center;" title="Notifications">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          ${unreadCount > 0 ? `<span style="position: absolute; top: -2px; right: -4px; background: var(--rose); color: white; font-size: 0.65rem; font-weight: 800; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">${unreadCount}</span>` : ''}
        </a>
        <div class="user-menu-btn ${isProfilePage ? 'active' : ''}" style="${isProfilePage ? 'border-color: var(--royal-blue); box-shadow: 0 0 0 2px var(--royal-blue-light);' : ''}" onclick="window.location.href='${prefix}profile.html'" title="Citizen Profile">
          <div class="avatar-circle">${user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</div>
          <span class="user-name-text">${user.fullName ? user.fullName.split(' ')[0] : 'User'}</span>
        </div>
        <button onclick="logoutUser()" class="btn btn-outline btn-sm" style="margin-left: 0.5rem;" title="Log Out">Log Out</button>
      `;
    } else {
      const isLoginPage = currentPath === 'login.html';
      const isRegisterPage = currentPath === 'register.html';
      userNavContainer.innerHTML = `
        <a href="${prefix}login.html" class="btn ${isLoginPage ? 'btn-primary' : 'btn-outline'} btn-sm">Log In</a>
        <a href="${prefix}register.html" class="btn ${isRegisterPage ? 'btn-outline' : 'btn-primary'} btn-sm">Get Started</a>
      `;
    }
  }

  highlightActiveNavLink();
}

function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = href.split('#')[0].split('/').pop();

    let isMatch = false;
    if (currentPath === linkPath || (currentPath === '' && linkPath === 'index.html')) {
      isMatch = true;
    } else if (currentPath === 'scheme-details.html' && linkPath === 'explore-schemes.html') {
      isMatch = true;
    } else if (currentPath === 'profile-setup.html' && linkPath === 'eligible-schemes.html') {
      isMatch = true;
    }

    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile menu toggle handling
  const mobileToggle = document.getElementById("mobile-nav-toggle");
  const navLinksContainer = document.getElementById("main-nav-links") || document.querySelector(".nav-links");
  if (mobileToggle && navLinksContainer && !mobileToggle.dataset.bound) {
    mobileToggle.dataset.bound = "true";
    mobileToggle.addEventListener("click", () => {
      navLinksContainer.classList.toggle("mobile-open");
    });
  }
}

function logoutUser() {
  setToken(null);
  localStorage.removeItem("goscheme_user");
  showToast("Logged out successfully", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

document.addEventListener("DOMContentLoaded", () => {
  updateHeaderNavState();
  highlightActiveNavLink();
});
