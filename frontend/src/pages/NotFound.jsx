import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center py-16">
      <SEO title="Page not found" path="/404" />
      <p className="text-6xl font-extrabold text-royal">404</p>
      <h1 className="mt-2 text-xl font-bold text-navy">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
