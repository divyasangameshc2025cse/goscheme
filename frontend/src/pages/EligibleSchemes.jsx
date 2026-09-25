import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import SchemeCard from '../components/SchemeCard.jsx';
import { schemesApi, savedApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function EligibleSchemes() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    schemesApi
      .eligible()
      .then(({ data }) => setSchemes(data.schemes || []))
      .catch((err) => {
        if (err.response?.data?.isProfileComplete === false) setNeedsProfile(true);
      })
      .finally(() => setLoading(false));

    savedApi.list().then(({ data }) => setSavedIds(data.savedIds || [])).catch(() => {});
  }, [user]);

  const toggleSave = async (schemeId) => {
    const { data } = await savedApi.toggle(schemeId);
    if (data.success) setSavedIds(data.savedIds);
  };

  return (
    <div className="container-app py-10">
      <SEO title="Check eligibility" description="See government schemes matched to your profile." path="/eligible" />
      <h1 className="text-2xl font-extrabold text-navy">Your eligible schemes</h1>

      {!user ? (
        <div className="mt-6 card">
          <p className="text-slate-600">Log in and complete your profile to see personalized matches.</p>
          <Link to="/login" className="btn-primary mt-4 inline-flex">Log in</Link>
        </div>
      ) : needsProfile ? (
        <div className="mt-6 card">
          <p className="text-slate-600">Complete your profile to unlock a personalized match.</p>
          <Link to="/profile-setup" className="btn-primary mt-4 inline-flex">Complete profile</Link>
        </div>
      ) : loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      ) : schemes.length === 0 ? (
        <p className="mt-6 text-slate-500">No eligible schemes found right now — check back soon.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((s) => (
            <SchemeCard key={s.id} scheme={s} onToggleSave={toggleSave} isSaved={savedIds.includes(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
