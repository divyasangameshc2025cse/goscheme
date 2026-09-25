import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { schemesApi, savedApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SchemeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    schemesApi
      .detail(id)
      .then(({ data }) => setScheme(data.scheme))
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (user) {
      savedApi.list().then(({ data }) => setSaved((data.savedIds || []).includes(id))).catch(() => {});
    }
  }, [user, id]);

  const toggleSave = async () => {
    if (!user) return;
    const { data } = await savedApi.toggle(id);
    if (data.success) setSaved(data.isSaved);
  };

  if (notFound) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-xl font-bold text-navy">Scheme not found</h1>
        <Link to="/explore" className="mt-4 inline-block text-royal underline">Back to Explore</Link>
      </div>
    );
  }

  if (!scheme) return <PageLoader />;

  return (
    <div className="container-app max-w-3xl py-10">
      <SEO title={scheme.title} description={scheme.description} path={`/schemes/${scheme.id}`} />

      <span className={`badge ${scheme.level === 'Central' ? 'bg-royal-light text-royal' : 'bg-teal-light text-teal'}`}>
        {scheme.level} · {scheme.category}
      </span>
      <h1 className="mt-3 text-2xl font-extrabold text-navy sm:text-3xl">{scheme.title}</h1>
      <p className="mt-1 text-sm font-semibold text-slate-400">{scheme.department}</p>

      <p className="mt-5 text-base text-slate-600">{scheme.description}</p>

      <div className="mt-6 card">
        <h2 className="font-bold text-navy">Benefits</h2>
        <p className="mt-1 text-slate-600">{scheme.benefits}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-bold text-navy">Eligibility</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Age: {scheme.minAge}–{scheme.maxAge} years</li>
            <li>Gender: {scheme.gender}</li>
            <li>Income ceiling: ₹{scheme.incomeCap?.toLocaleString('en-IN')}</li>
            <li>Education: {scheme.education?.join(', ')}</li>
            <li>Occupation: {scheme.occupation?.join(', ')}</li>
            <li>Community: {scheme.casteCategory?.join(', ')}</li>
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold text-navy">Documents required</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            {scheme.documents?.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
          Apply on official site ↗
        </a>
        {user && (
          <button onClick={toggleSave} className="btn-secondary">
            {saved ? 'Remove from saved' : 'Save for later'}
          </button>
        )}
      </div>
    </div>
  );
}
