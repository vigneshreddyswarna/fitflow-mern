import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';
import { useAuth } from '../auth-context';
import { Icon } from '../ui';
import OtpField from '../components/OtpField';
import PasswordField from '../components/PasswordField';

function AuthPitch({ eyebrow, title, children }) {
  return <div className="auth-pitch"><Link to="/" className="brand light"><span><Icon name="bolt" size={18}/></span>FITFLOW</Link><div><div className="eyebrow"><span />{eyebrow}</div>{title}{children}</div><small>(c) 2026 FitFlow</small></div>;
}

function PasswordResetOtp({ initialEmail = '', onBack }) {
  const { notify } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [busy, setBusy] = useState(false);
  const requestCode = async (targetEmail = email) => {
    setBusy(true);
    try {
      const cleanEmail = String(targetEmail || '').trim();
      const result = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: cleanEmail }) });
      setEmail(cleanEmail); setSent(true); notify(result.message);
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const submitEmail = e => { e.preventDefault(); requestCode(new FormData(e.currentTarget).get('email')); };
  const verifyCode = async e => {
    e.preventDefault(); setBusy(true);
    const code = String(new FormData(e.currentTarget).get('resetOtpCode') || '').replace(/\D/g, '');
    try {
      const result = await api('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email, code }) });
      setVerifiedCode(code); notify(result.message);
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const reset = async e => {
    e.preventDefault(); setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code: verifiedCode, password: form.get('authPassword') }) });
      notify(result.message); onBack();
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };

  return <section className="auth-page"><AuthPitch eyebrow="Password help" title={<h1>Reset with<br/><em>email OTP.</em></h1>}><p>We send a 6-digit code to your account email. Use it here to create a new password.</p></AuthPitch>
    <div className="auth-form-wrap">{!sent ? <form className="auth-form" onSubmit={submitEmail} autoComplete="off"><span className="form-kicker">RESET PASSWORD</span><h2>Where should we send it?</h2><label>Email address<input name="email" type="email" defaultValue={email} placeholder="you@example.com" autoComplete="off" required /></label><button className="button primary full" disabled={busy}>{busy ? 'Sending...' : 'Send reset code'}<Icon name="arrow" /></button><p className="switch"><button type="button" onClick={onBack}>Back to login</button></p></form> : !verifiedCode ? <form className="auth-form" onSubmit={verifyCode} autoComplete="off"><span className="form-kicker">RESET PASSWORD</span><h2>Check your email.</h2><OtpField name="resetOtpCode" /><button className="button primary full" disabled={busy}>{busy ? 'Checking...' : 'Verify code'}<Icon name="check" /></button><p className="switch">No code? <button type="button" onClick={() => requestCode(email)}>Send again</button></p><p className="switch"><button type="button" onClick={onBack}>Back to login</button></p></form> : <form className="auth-form" onSubmit={reset} autoComplete="off"><span className="form-kicker">RESET PASSWORD</span><h2>Create new password.</h2><PasswordField label="New password" minLength="8" /><button className="button primary full" disabled={busy}>{busy ? 'Updating...' : 'Update password'}<Icon name="check" /></button></form>}</div>
  </section>;
}

function OtpScreen({ email, onBack }) {
  const { setUser, notify } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const verify = async e => {
    e.preventDefault(); setBusy(true);
    const code = String(new FormData(e.currentTarget).get('emailOtpCode') || '').replace(/\D/g, '');
    try {
      const result = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
      if (result.user) setUser(result.user);
      notify(result.message);
      navigate('/dashboard');
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const resend = async () => {
    try { const result = await api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }); notify(result.message); } catch (error) { notify(error.message); }
  };

  return <section className="auth-page"><AuthPitch eyebrow="Check your inbox" title={<h1>Enter your<br/><em>6-digit code.</em></h1>}><p>We sent a verification code to {email}. The code expires in 10 minutes.</p></AuthPitch>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={verify} autoComplete="off"><span className="form-kicker">EMAIL VERIFICATION</span><h2>Confirm it is you.</h2><OtpField name="emailOtpCode" /><button className="button primary full" disabled={busy}>{busy ? 'Checking...' : 'Verify email'}<Icon name="check" /></button><p className="switch">No code? <button type="button" onClick={resend}>Send again</button></p><p className="switch"><button type="button" onClick={onBack}>Back to login</button></p></form></div>
  </section>;
}

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const { user, setUser, notify } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !user.isEmailVerified) setPendingEmail(user.email); }, [user]);
  const forgot = e => {
    const authEmail = e.currentTarget.form?.elements.authEmail?.value?.trim();
    setResetEmail(authEmail || ' ');
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.email = data.authEmail;
    data.password = data.authPassword;
    delete data.authEmail;
    delete data.authPassword;
    try {
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) });
      setToken(result.token); setUser(result.user);
      if (!result.user.isEmailVerified) {
        setPendingEmail(result.user.email);
        if (mode === 'login') {
          const resend = await api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: result.user.email }) });
          notify(resend.message);
        } else {
          notify('Verification code sent to your email');
        }
        return;
      }
      notify(`Welcome${mode === 'register' ? ' to FitFlow' : ' back'}, ${result.user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  };

  if (pendingEmail) return <OtpScreen email={pendingEmail} onBack={() => setPendingEmail('')} />;
  if (resetEmail) return <PasswordResetOtp initialEmail={resetEmail.trim()} onBack={() => setResetEmail('')} />;
  return <section className="auth-page"><AuthPitch eyebrow="Start where you are" title={<h1>Your strongest routine is one you'll <em>actually enjoy.</em></h1>}><p>Join a community building healthier lives, one repeatable week at a time.</p></AuthPitch>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={submit} autoComplete="off"><span className="form-kicker">{mode === 'register' ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</span><h2>{mode === 'register' ? "Let's build momentum." : 'Keep it moving.'}</h2>
      {mode === 'register' && <label>Full name<input name="name" placeholder="Your name" required /></label>}
      <label>Email address<input name="authEmail" type="email" placeholder="you@example.com" autoComplete="off" autoCapitalize="none" spellCheck="false" required /></label>
      <PasswordField minLength="6" placeholder="At least 6 characters" />
      {mode === 'login' && <button className="forgot-link" type="button" onClick={forgot}>Forgot password?</button>}
      {mode === 'register' && <label>Your main goal<select name="goal"><option>Build strength</option><option>Lose weight</option><option>Improve fitness</option><option>Stay active</option></select></label>}
      <button className="button primary full" disabled={busy}>{busy ? 'One moment...' : mode === 'register' ? 'Create free account' : 'Log in'}<Icon name="arrow" /></button>
      <p className="switch">{mode === 'register' ? 'Already a member?' : 'New to FitFlow?'} <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Log in' : 'Create account'}</button></p>
    </form></div>
  </section>;
}
