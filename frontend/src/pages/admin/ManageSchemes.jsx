import { useEffect, useState } from 'react';
import SEO from '../../components/SEO.jsx';
import { schemesApi, adminApi } from '../../services/api.js';

const EMPTY_FORM = {
  title: '', department: '', level: 'State', state: 'Tamil Nadu', category: 'General Welfare & Benefits',
  minAge: 0, maxAge: 100, gender: 'All', incomeCap: 9999999,
  education: 'All', occupation: 'All', benefits: '', applicationDeadline: '2027-12-31',
  officialUrl: '', description: '', documents: '',
};

export default function ManageSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    schemesApi.list({ status: 'all' }).then(({ data }) => setSchemes(data.schemes || [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, state: form.level === 'Central' ? 'All India' : (form.state || 'Tamil Nadu') };
      await adminApi.createScheme(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    await adminApi.toggleStatus(id);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this scheme permanently?')) return;
    await adminApi.deleteScheme(id);
    load();
  };

  return (
    <div className="container-app py-10">
      <SEO title="Manage schemes" path="/admin/schemes" />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-navy">Manage schemes</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary !px-4 !py-2 text-sm">
          {showForm ? 'Cancel' : '+ Add scheme'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-6 grid gap-3 card sm:grid-cols-2">
          <input required placeholder="Title" className="input-field sm:col-span-2" value={form.title} onChange={set('title')} />
          <input required placeholder="Department" className="input-field" value={form.department} onChange={set('department')} />
          <select className="input-field" value={form.level} onChange={set('level')}>
            <option>State</option>
            <option>Central</option>
          </select>
          <input
            required={form.level === 'State'}
            placeholder="State (e.g. Tamil Nadu) — leave blank for Central"
            className="input-field"
            value={form.state}
            onChange={set('state')}
          />
          <input required placeholder="Category / sector" className="input-field sm:col-span-2" value={form.category} onChange={set('category')} />
          <input required placeholder="Official URL" className="input-field sm:col-span-2" value={form.officialUrl} onChange={set('officialUrl')} />
          <textarea required placeholder="Description" className="input-field sm:col-span-2" value={form.description} onChange={set('description')} />
          <textarea required placeholder="Benefits" className="input-field sm:col-span-2" value={form.benefits} onChange={set('benefits')} />
          <input placeholder="Documents (comma separated)" className="input-field sm:col-span-2" value={form.documents} onChange={set('documents')} />
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">
            {saving ? 'Saving…' : 'Create scheme'}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Level / State</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : (
              schemes.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-semibold text-navy">{s.title}</td>
                  <td className="px-4 py-3 text-slate-500">{s.category}</td>
                  <td className="px-4 py-3 text-slate-500">{s.level === 'Central' ? 'Central' : s.state}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'Active' ? 'bg-emerald-light text-emerald' : 'bg-slate-100 text-slate-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(s.id)} className="text-xs font-bold text-royal hover:underline">
                        {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(s.id)} className="text-xs font-bold text-rose hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
