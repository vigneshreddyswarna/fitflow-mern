import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api';
import { AuthContext } from './auth-context';
import { Icon } from './ui';
import Home from './pages/Home';
import Header from './components/Header';

const Admin = lazy(() => import('./pages/Admin'));
const Auth = lazy(() => import('./pages/Auth'));
const Coach = lazy(() => import('./pages/Coach'));
const Classes = lazy(() => import('./pages/Classes'));
const ClassDetail = lazy(() => import('./pages/Classes').then(module => ({ default: module.ClassDetail })));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const TrainerProfile = lazy(() => import('./pages/TrainerProfile'));
const AccountAction = lazy(() => import('./pages/AccountAction'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api('/auth/me').then(({ user }) => setUser(user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const notify = (message) => { setToast(message); setTimeout(() => setToast(''), 2800); };
  const auth = useMemo(() => ({ user, setUser, logout: async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); }, notify }), [user]);

  if (loading) return <div className="loader"><span /></div>;
  return <AuthContext.Provider value={auth}>
    <Header />
    <main id="main-content"><Suspense fallback={<div className="loader" aria-label="Loading page"><span /></div>}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/classes/:id" element={<ClassDetail />} />
      <Route path="/trainers/:id" element={<TrainerProfile />} />
      <Route path="/auth" element={user?.isEmailVerified ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/dashboard" element={user?.isEmailVerified ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/coach" element={user?.isEmailVerified ? <Coach /> : <Navigate to="/auth" />} />
      <Route path="/settings" element={user?.isEmailVerified ? <Settings /> : <Navigate to="/auth" />} />
      <Route path="/admin" element={user?.isEmailVerified && ['admin','trainer'].includes(user.role) ? <Admin /> : <Navigate to="/dashboard" />} />
      <Route path="/verify-email" element={<AccountAction type="verify" />} />
      <Route path="/reset-password" element={<AccountAction type="reset" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes></Suspense></main>
    {toast && <div className="toast" role="status" aria-live="polite"><Icon name="check" />{toast}</div>}
  </AuthContext.Provider>;
}

export default App;
