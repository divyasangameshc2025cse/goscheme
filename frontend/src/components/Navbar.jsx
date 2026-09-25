import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore Schemes' },
  { to: '/eligible', label: 'Check Eligibility' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold transition ${isActive ? 'text-royal' : 'text-navy/70 hover:text-navy'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-[64px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="GO SCHEME home">
          <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#2563EB" />
            <path d="M12 28L20 12L28 28H23L20 21L17 28H12Z" fill="white" />
            <path d="M20 21L23 28H17L20 21Z" fill="#14B8A6" />
          </svg>
          <span className="font-extrabold tracking-tight text-navy">GO SCHEME</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-navy/70 hover:text-navy">
                {user.fullName?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-secondary !px-4 !py-2 text-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-navy/70 hover:text-navy">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-navy hover:bg-slate-100"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-royal-light text-royal' : 'text-navy'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-secondary w-full">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate('/');
                    }}
                    className="btn-primary w-full"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
