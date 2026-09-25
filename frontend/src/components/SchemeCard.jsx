import { Link } from 'react-router-dom';

export default function SchemeCard({ scheme, onToggleSave, isSaved }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`badge ${
            scheme.level === 'Central' ? 'bg-royal-light text-royal' : 'bg-teal-light text-teal'
          }`}
        >
          {scheme.level === 'Central' ? 'Central' : scheme.state || 'State'}
        </span>
        {scheme.isNew && <span className="badge bg-emerald-light text-emerald">New</span>}
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-navy line-clamp-2">{scheme.title}</h3>
      <p className="mt-1 text-xs font-semibold text-slate-400">{scheme.department}</p>
      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{scheme.description}</p>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-navy">
        {scheme.benefits}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link to={`/schemes/${scheme.id}`} className="btn-primary flex-1 !py-2 text-sm">
          View details
        </Link>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(scheme.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save scheme'}
            aria-pressed={isSaved}
            className={`shrink-0 rounded-xl border p-2.5 transition ${
              isSaved ? 'border-rose bg-rose-light text-rose' : 'border-slate-200 text-slate-400 hover:text-rose'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
