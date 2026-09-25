import { useEffect, useState } from 'react';
import SEO from '../components/SEO.jsx';
import { notificationsApi } from '../services/api.js';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .list()
      .then(({ data }) => setItems(data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="container-app max-w-2xl py-10">
      <SEO title="Notifications" path="/notifications" />
      <h1 className="text-2xl font-extrabold text-navy">Notifications</h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-6 text-slate-500">You're all caught up.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`card cursor-pointer ${n.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-navy">{n.title}</p>
                {!n.read && <span className="badge bg-royal-light text-royal">New</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{n.timestamp}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
