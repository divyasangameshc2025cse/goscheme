import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import SectorCard from '../components/SectorCard.jsx';
import { sectorsApi } from '../services/api.js';

const STEPS = [
  { title: 'Enter your details', desc: 'Create a profile once with your age, income, education and occupation.' },
  { title: 'We match by sector', desc: 'Schemes are grouped by sector so you only load what you actually need.' },
  { title: 'Apply with confidence', desc: 'Jump straight to the official government page to apply.' },
];

export default function Landing() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sectorsApi
      .list()
      .then(({ data }) => setSectors(data.sectors || []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Home"
        description="Discover every Tamil Nadu and Central Government scheme you're eligible for, split by sector for a fast, mobile-friendly experience."
        path="/"
      />

      <section className="bg-gradient-to-b from-royal-light/40 to-transparent">
        <div className="container-app grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <span className="badge bg-royal-light text-royal">Tamil Nadu &amp; Central Government</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl md:text-5xl">
              One profile. Every scheme you're eligible for.
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-500 sm:text-lg">
              GO SCHEME organizes government schemes sector-by-sector — agriculture, education,
              health, housing and more — so the site stays fast even as the list grows.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary">Get started free</Link>
              <Link to="/explore" className="btn-secondary">Browse schemes</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(loading ? Array.from({ length: 4 }) : sectors.slice(0, 4)).map((s, i) => (
              <div key={s?.slug || i} className="card">
                {s ? (
                  <>
                    <span className="text-2xl" aria-hidden="true">{s.icon}</span>
                    <p className="mt-2 text-sm font-bold text-navy">{s.category}</p>
                    <p className="text-xs font-semibold text-slate-400">{s.count} schemes</p>
                  </>
                ) : (
                  <div className="skeleton h-16 w-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-navy">Browse by sector</h2>
          <Link to="/explore" className="text-sm font-bold text-royal hover:underline">See all →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-28" />)
            : sectors.map((s) => (
                <Link key={s.slug} to={`/explore?sector=${s.slug}`}>
                  <SectorCard sector={s} />
                </Link>
              ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-14">
        <div className="container-app">
          <h2 className="text-2xl font-extrabold text-navy">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-bold text-navy">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
