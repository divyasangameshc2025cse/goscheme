import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { schemesApi, savedApi } from '../services/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [eligibleCount, setEligibleCount] = useState(null);
  const [savedCount, setSavedCount] = useState(null);

  useEffect(() => {
    if (user?.isProfileComplete) {
      schemesApi.eligible().then(({ data }) => setEligibleCount(data.count)).catch(() => setEligibleCount(0));
    }
    savedApi.list().then(({ data }) => setSavedCount(data.schemes?.length || 0)).catch(() => setSavedCount(0));
  }, [user]);

  const cards = [
    { to: '/eligible', label: 'Eligible schemes', value: eligibleCount, hint: 'Matched to your profile' },
    { to: '/saved', label: 'Saved schemes', value: savedCount, hint: 'Bookmarked for later' },
    { to: '/explore', label: 'Explore by sector', value: '10+', hint: 'Agriculture, health, education…' },
  ];

  return (
    <div className="container-app py-10">
      <SEO title="Dashboard" path="/dashboard" />
      <h1 className="text-2xl font-extrabold text-navy">
        Welcome, {user?.fullName?.split(' ')[0] || 'there'} 👋
      </h1>

      {!user?.isProfileComplete && (
        <div className="mt-4 rounded-xl border border-amber/40 bg-amber-light p-4 text-sm font-semibold text-navy">
          Your profile isn't complete yet.{' '}
          <Link to="/profile-setup" className="text-royal underline">Finish it</Link> to see personalized matches.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card">
            <p className="text-3xl font-extrabold text-navy">{c.value ?? '—'}</p>
            <p className="mt-1 text-sm font-bold text-navy">{c.label}</p>
            <p className="text-xs text-slate-400">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/profile" className="btn-secondary">Edit profile</Link>
        <Link to="/notifications" className="btn-secondary">Notifications</Link>
      </div>
    </div>
  );
}
