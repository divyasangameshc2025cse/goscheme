import { useEffect, useState } from 'react';
import SEO from '../components/SEO.jsx';
import SchemeCard from '../components/SchemeCard.jsx';
import { savedApi } from '../services/api.js';

export default function SavedSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    savedApi
      .list()
      .then(({ data }) => setSchemes(data.schemes || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleSave = async (schemeId) => {
    await savedApi.toggle(schemeId);
    load();
  };

  return (
    <div className="container-app py-10">
      <SEO title="Saved schemes" path="/saved" />
      <h1 className="text-2xl font-extrabold text-navy">Saved schemes</h1>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      ) : schemes.length === 0 ? (
        <p className="mt-6 text-slate-500">You haven't saved any schemes yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((s) => (
            <SchemeCard key={s.id} scheme={s} onToggleSave={toggleSave} isSaved />
          ))}
        </div>
      )}
    </div>
  );
}
