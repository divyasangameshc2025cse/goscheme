import { useState } from 'react';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    district: user?.district || '',
    income: user?.income || 0,
    occupation: user?.occupation || '',
    education: user?.education || '',
  });
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    const data = await updateProfile(form);
    if (data.success) setSaved(true);
  };

  if (!user) return null;

  return (
    <div className="container-app max-w-xl py-10">
      <SEO title="My profile" path="/profile" />
      <h1 className="text-2xl font-extrabold text-navy">My profile</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Full name</label>
          <input className="input-field" value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Phone</label>
          <input className="input-field" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">District</label>
          <input className="input-field" value={form.district} onChange={set('district')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Annual household income (₹)</label>
          <input type="number" className="input-field" value={form.income} onChange={set('income')} />
        </div>

        {saved && <p className="text-sm font-semibold text-emerald">Profile updated.</p>}

        <button type="submit" className="btn-primary">Save changes</button>
      </form>
    </div>
  );
}
