import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO.jsx';
import { adminApi } from '../../services/api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState('');

  const loadMetrics = () => adminApi.metrics().then(({ data }) => setMetrics(data.metrics));

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeError('');
    setScrapeResult(null);
    try {
      const { data } = await adminApi.triggerScrape();
      if (data.success) {
        setScrapeResult(data.summary);
        loadMetrics();
      } else {
        setScrapeError(data.message || 'Scrape failed');
      }
    } catch (err) {
      setScrapeError(err.response?.data?.message || 'Scrape failed. Check the server logs.');
    } finally {
      setScraping(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('goscheme_jwt_token');
    navigate('/admin/login');
  };

  const cards = metrics
    ? [
        { label: 'Total schemes', value: metrics.totalSchemes },
        { label: 'Active schemes', value: metrics.activeSchemes },
        { label: 'Tamil Nadu schemes', value: metrics.tnSchemes },
        { label: 'Central schemes', value: metrics.centralSchemes },
        { label: 'Registered users', value: metrics.registeredUsers },
      ]
    : [];

  return (
    <div className="container-app py-10">
      <SEO title="Admin dashboard" path="/admin/dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-navy">Admin dashboard</h1>
        <button onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">Log out</button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {metrics
          ? cards.map((c) => (
              <div key={c.label} className="card">
                <p className="text-2xl font-extrabold text-navy">{c.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{c.label}</p>
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
      </div>

      <div className="mt-8 card">
        <h2 className="font-bold text-navy">Refresh live scheme data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Runs the scraper against official government scheme sources and upserts new/updated schemes,
          automatically classified into a sector.
        </p>
        <button onClick={handleScrape} disabled={scraping} className="btn-primary mt-4">
          {scraping ? 'Scraping…' : 'Run scraper now'}
        </button>
        {scrapeResult && (
          <p className="mt-3 text-sm font-semibold text-emerald">
            Inserted {scrapeResult.inserted}, updated {scrapeResult.updated} (processed {scrapeResult.total}).
          </p>
        )}
        {scrapeError && <p className="mt-3 text-sm font-semibold text-rose">{scrapeError}</p>}
      </div>

      <div className="mt-6">
        <Link to="/admin/schemes" className="btn-secondary">Manage schemes →</Link>
      </div>
    </div>
  );
}
