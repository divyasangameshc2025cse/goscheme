import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EDUCATION_OPTIONS = ['Below 10th', '10th Pass', '12th Pass', 'Undergraduate', 'Postgraduate', 'Diploma'];
const OCCUPATION_OPTIONS = ['Student', 'Farmer', 'Unemployed', 'Self-Employed', 'Government Employee', 'Private Employee'];
const CASTE_OPTIONS = ['General', 'BC', 'MBC', 'SC', 'ST'];

export default function ProfileSetup() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    dob: '',
    gender: 'Female',
    caste: 'BC',
    district: 'Chennai',
    area: 'Urban',
    income: 180000,
    occupation: 'Student',
    education: 'Undergraduate',
    disabilityStatus: 'No',
    firstGenGraduate: 'Yes',
    govtSchoolStudied: 'Yes',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await updateProfile(form);
      if (!data.success) setError(data.message || 'Could not save profile');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app max-w-2xl py-12">
      <SEO title="Complete your profile" path="/profile-setup" />
      <h1 className="text-2xl font-extrabold text-navy">
        {user ? `Almost there, ${user.fullName?.split(' ')[0]}` : 'Complete your profile'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This powers your personalized eligibility match on the Check Eligibility page.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Date of birth</label>
          <input type="date" required className="input-field" value={form.dob} onChange={set('dob')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Gender</label>
          <select className="input-field" value={form.gender} onChange={set('gender')}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Community / Category</label>
          <select className="input-field" value={form.caste} onChange={set('caste')}>
            {CASTE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">District</label>
          <input className="input-field" value={form.district} onChange={set('district')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Area</label>
          <select className="input-field" value={form.area} onChange={set('area')}>
            <option>Urban</option>
            <option>Rural</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Annual household income (₹)</label>
          <input type="number" min="0" className="input-field" value={form.income} onChange={set('income')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Occupation</label>
          <select className="input-field" value={form.occupation} onChange={set('occupation')}>
            {OCCUPATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Education</label>
          <select className="input-field" value={form.education} onChange={set('education')}>
            {EDUCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">Person with disability?</label>
          <select className="input-field" value={form.disabilityStatus} onChange={set('disabilityStatus')}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">First-generation graduate?</label>
          <select className="input-field" value={form.firstGenGraduate} onChange={set('firstGenGraduate')}>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        {error && <p className="sm:col-span-2 text-sm font-semibold text-rose" role="alert">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary sm:col-span-2">
          {busy ? 'Saving…' : 'Save and see my schemes'}
        </button>
      </form>
    </div>
  );
}
