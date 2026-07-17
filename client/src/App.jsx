import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, getToken, setToken } from './api';
import { AuthContext } from './auth-context';
import { Icon } from './ui';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import Coach from './pages/Coach';
import Classes, { ClassDetail } from './pages/Classes';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Settings from './pages/Settings';
import TrainerProfile from './pages/TrainerProfile';
import AccountAction from './pages/AccountAction';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me').then(({ user }) => setUser(user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);
  const notify = (message) => { setToast(message); setTimeout(() => setToast(''), 2800); };
  const auth = useMemo(() => ({ user, setUser, logout: () => { setToken(null); setUser(null); }, notify }), [user]);

  if (loading) return <div className="loader"><span /></div>;
  return <AuthContext.Provider value={auth}>
    <Header />
    <main id="main-content"><Routes>
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
    </Routes></main>
    {toast && <div className="toast"><Icon name="check" />{toast}</div>}
  </AuthContext.Provider>;
}

export default App;
