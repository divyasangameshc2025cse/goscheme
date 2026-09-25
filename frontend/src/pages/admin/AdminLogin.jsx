import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO.jsx';
import { adminApi } from '../../services/api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await adminApi.login(password);
      if (data.success) {
        localStorage.setItem('goscheme_jwt_token', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <SEO title="Admin portal" path="/admin/login" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-xl font-extrabold text-navy">Admin portal</h1>
        <p className="mt-1 text-sm text-slate-500">Restricted access for scheme administrators.</p>

        <div className="mt-6">
          <label className="mb-1 block text-sm font-semibold text-navy">Admin password</label>
          <input
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-rose" role="alert">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
