import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import PasswordField from '../components/PasswordField';

export default function AccountAction({ type }) {
  const [params] = useSearchParams();
  const { notify } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(type === 'verify' ? 'Verifying your email...' : 'Choose a new password');

  useEffect(() => { if (type === 'verify') api('/auth/verify-email', { method:'POST', body: JSON.stringify({ token: params.get('token'), email: params.get('email') }) }).then(r => setMessage(r.message)).catch(e => setMessage(e.message)); }, []);

  const reset = async e => {
    e.preventDefault();
    try {
      const result = await api('/auth/reset-password', { method:'POST', body: JSON.stringify({ token: params.get('token'), email: params.get('email'), password: new FormData(e.currentTarget).get('authPassword') }) });
      notify(result.message); navigate('/auth');
    } catch (e) { setMessage(e.message); }
  };

  return <section className="auth-form-wrap standalone"><div className="auth-form"><span className="form-kicker">ACCOUNT SECURITY</span><h2>{message}</h2>{type === 'reset' && <form onSubmit={reset}><PasswordField label="New password" minLength="8" /><button className="button primary full">Update password</button></form>}<Link to="/auth">Return to login</Link></div></section>;
}
