import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PageLoader from './components/PageLoader.jsx';

// Every route is its own chunk — the browser only downloads the page the
// visitor actually opens, keeping the initial load light.
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ExploreSchemes = lazy(() => import('./pages/ExploreSchemes.jsx'));
const SchemeDetails = lazy(() => import('./pages/SchemeDetails.jsx'));
const EligibleSchemes = lazy(() => import('./pages/EligibleSchemes.jsx'));
const SavedSchemes = lazy(() => import('./pages/SavedSchemes.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const ManageSchemes = lazy(() => import('./pages/admin/ManageSchemes.jsx'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<ExploreSchemes />} />
          <Route path="/schemes/:id" element={<SchemeDetails />} />
          <Route path="/eligible" element={<EligibleSchemes />} />

          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedSchemes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/schemes" element={<ManageSchemes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
