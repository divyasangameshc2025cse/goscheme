import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await register(form);
      if (!data.success) {
        setError(data.message || 'Registration failed');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <SEO title="Create account" path="/register" />
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">One profile unlocks every scheme you qualify for.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-semibold text-navy">Full name</label>
            <input
              id="fullName"
              required
              className="input-field"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-navy">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-navy">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-navy">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <p className="text-sm font-semibold text-rose" role="alert">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-royal hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
