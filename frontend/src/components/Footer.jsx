import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-app grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-navy">
            <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="#2563EB" />
              <path d="M12 28L20 12L28 28H23L20 21L17 28H12Z" fill="white" />
            </svg>
            GO SCHEME
          </div>
          <p className="mt-3 text-sm text-slate-500">
            One profile. Every scheme you're eligible for — sector by sector.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/explore" className="hover:text-royal">Browse sectors</Link></li>
            <li><Link to="/eligible" className="hover:text-royal">Check eligibility</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/login" className="hover:text-royal">Log in</Link></li>
            <li><Link to="/register" className="hover:text-royal">Create account</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy">Admin</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/admin/login" className="hover:text-royal">Admin portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GO SCHEME. Scheme data sourced from official government portals.
      </div>
    </footer>
  );
}
