/* Notification Center Logic & API Sync */

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("notifications-list-container")) {
    await renderNotificationsPage();
  }
});

async function renderNotificationsPage() {
  const container = document.getElementById("notifications-list-container");
  const countBadge = document.getElementById("notif-unread-count");
  let notifications = [];

  if (getToken()) {
    const res = await apiFetch("/notifications");
    if (res && res.success && res.notifications) {
      notifications = res.notifications;
      saveNotifications(notifications);
    }
  }

  if (notifications.length === 0) {
    notifications = getNotifications();
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  if (countBadge) {
    countBadge.innerText = `${unreadCount} Unread Notifications`;
  }

  if (notifications.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;" class="card">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; color: var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <h3 style="font-size: 1.2rem;">All caught up!</h3>
        <p style="color: var(--text-muted);">You have no notifications at this time.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notifications.map(notif => `
    <div class="card card-hover" style="margin-bottom: 1rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; ${!notif.read ? 'border-left: 4px solid var(--royal-blue); background: #F8FAFC;' : ''}">
      <div style="display: flex; gap: 1rem; align-items: flex-start;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${notif.type === 'deadline' ? 'var(--rose-light)' : 'var(--royal-blue-light)'}; color: ${notif.type === 'deadline' ? 'var(--rose)' : 'var(--royal-blue)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.25rem;">${notif.title}</h4>
          <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${notif.message}</p>
          <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">${notif.timestamp}</span>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button onclick="toggleReadNotification('${notif.id}')" class="btn btn-outline btn-sm" title="${notif.read ? 'Mark Unread' : 'Mark Read'}">
          ${notif.read ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button onclick="deleteNotification('${notif.id}')" class="btn btn-danger btn-sm" title="Delete">
          &times;
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleReadNotification = async function(notifId) {
  if (getToken()) {
    await apiFetch(`/notifications/${notifId}/read`, { method: "PUT" });
  }

  let notifications = getNotifications();
  notifications = notifications.map(n => {
    if (n.id === notifId) return { ...n, read: !n.read };
    return n;
  });
  saveNotifications(notifications);
  updateHeaderNavState();
  await renderNotificationsPage();
};

window.deleteNotification = function(notifId) {
  let notifications = getNotifications();
  notifications = notifications.filter(n => n.id !== notifId);
  saveNotifications(notifications);
  showToast("Notification removed", "info");
  updateHeaderNavState();
  renderNotificationsPage();
};

window.markAllNotificationsRead = async function() {
  let notifications = getNotifications();
  notifications = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(notifications);
  showToast("All notifications marked as read", "success");
  updateHeaderNavState();
  await renderNotificationsPage();
};
