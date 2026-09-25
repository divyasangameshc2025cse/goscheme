import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(form.email, form.password);
      if (!data.success) {
        setError(data.message || 'Login failed');
      } else {
        navigate(data.user?.isProfileComplete ? '/dashboard' : '/profile-setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <SEO title="Log in" path="/login" />
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-navy">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to see schemes matched to your profile.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-navy">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <p className="text-sm font-semibold text-rose" role="alert">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-bold text-royal hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
