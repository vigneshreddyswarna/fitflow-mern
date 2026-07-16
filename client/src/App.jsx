import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getToken, setToken } from './api';
import { AuthContext, useAuth } from './auth-context';
import { ConfirmModal, Empty, Icon, SkeletonGrid, Stat } from './ui';
import Admin from './pages/Admin';
import Home from './pages/Home';

const ActivityChart = lazy(() => import('./ActivityChart'));

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

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="nav-wrap">
    <Link to="/" className="brand"><span><Icon name="bolt" size={18} /></span>FITFLOW</Link>
    <nav className={open ? 'nav open' : 'nav'}>
      <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
      <NavLink to="/classes" onClick={() => setOpen(false)}>Classes</NavLink>
      {user && <NavLink to="/dashboard" onClick={() => setOpen(false)}>My progress</NavLink>}
      {user && <NavLink to="/coach" onClick={() => setOpen(false)}>AI coach</NavLink>}
      {user && <NavLink to="/settings" onClick={() => setOpen(false)}>Settings</NavLink>}
      {user && ['admin','trainer'].includes(user.role) && <NavLink to="/admin" onClick={() => setOpen(false)}>Manage</NavLink>}
      {user ? <button className="text-btn" onClick={logout}>Log out</button> : <Link className="nav-cta" to="/auth">Get started <Icon name="arrow" size={16} /></Link>}
    </nav>
    <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? 'x' : 'menu'} /></button>
  </div></header>;
}

function Classes() {
  const { user, notify } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/classes').then(setClasses).catch(e => notify(e.message)).finally(() => setLoading(false)); }, []);
  const book = async (id) => {
    if (!user) return navigate('/auth');
    try { const data = await api(`/classes/${id}/book`, { method: 'POST' }); notify(data.message); setClasses(c => c.map(x => x._id === id ? { ...x, spotsLeft: data.spotsLeft ?? x.spotsLeft } : x)); } catch (e) { notify(e.message); }
  };
  const categories = ['All', ...new Set(classes.map(c => c.category))];
  const shown = filter === 'All' ? classes : classes.filter(c => c.category === filter);
  return <section className="page section"><div className="page-head"><div><div className="eyebrow dark"><span />Move your way</div><h1>Find a class<br/><em>worth showing up for.</em></h1></div><p>Small groups, thoughtful coaching, and a level for every starting point.</p></div>
    <div className="filters">{categories.map(c => <button className={filter === c ? 'active' : ''} onClick={() => setFilter(c)} key={c}>{c}</button>)}</div>
    {loading ? <SkeletonGrid count={4} className="class-grid" /> : <div className="class-grid">{shown.map((item, index) => <article className="class-card" key={item._id} style={{'--accent': item.accent}}>
      <div className="class-art"><span>{String(index + 1).padStart(2, '0')}</span><div className="art-ring"/><b>{item.category.toUpperCase()}</b></div>
      <div className="class-body"><div className="class-meta"><span>{item.level}</span><span><Icon name="clock" size={15}/>{item.duration} min</span></div><h2>{item.title}</h2><p>Trainer: {item.trainer ? <Link to={`/trainers/${item.trainer}`}>{item.trainerName}</Link> : item.trainerName}</p><div className="class-footer"><div><small>{item.schedule}</small><b>{item.spotsLeft} spots left</b></div><button onClick={() => book(item._id)}>Book <Icon name="arrow" size={17}/></button></div></div>
    </article>)}</div>}
  </section>;
}

function TrainerProfile() {
  const { id } = useParams();
  const { notify } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api(`/trainers/${id}`).then(setTrainer).catch(error => notify(error.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <section className="page section"><SkeletonGrid count={3} /></section>;
  if (!trainer) return <section className="page section"><Empty text="Trainer profile not found." link="Explore classes" /></section>;
  const profile = trainer.trainerProfile || {};
  return <section className="trainer-page section">
    <div className="trainer-hero"><div><div className="eyebrow dark"><span />Trainer profile</div><h1>{trainer.name}</h1><p>{profile.headline || 'FitFlow trainer focused on practical, repeatable progress.'}</p></div><Link className="button primary" to="/classes">Book a class <Icon name="arrow" /></Link></div>
    <div className="trainer-layout"><article className="panel trainer-bio"><h2>Training style</h2><p>{profile.bio || 'This trainer keeps sessions clear, encouraging, and adaptable to real-life schedules.'}</p><div className="tag-row">{(profile.specialties?.length ? profile.specialties : ['Strength', 'Consistency', 'Mobility']).map(item => <span key={item}>{item}</span>)}</div>{Boolean(profile.certifications?.length) && <p className="certs"><b>Certifications:</b> {profile.certifications.join(', ')}</p>}</article>
      <article className="panel"><div className="panel-title"><div><span>UPCOMING</span><h2>Classes by {trainer.name.split(' ')[0]}</h2></div></div>{trainer.classes?.length ? <div className="booking-list">{trainer.classes.map(item => <div key={item._id}><i style={{background:item.accent}}/><div><b>{item.title}</b><span>{item.schedule} - {item.duration} min - {item.level}</span></div><strong>{item.spotsLeft} left</strong></div>)}</div> : <Empty text="No public classes assigned yet." link="Browse all classes" />}</article>
    </div>
  </section>;
}

function Auth() {
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
  return <section className="auth-page"><div className="auth-pitch"><Link to="/" className="brand light"><span><Icon name="bolt" size={18}/></span>FITFLOW</Link><div><div className="eyebrow"><span />Start where you are</div><h1>Your strongest routine is one you'll <em>actually enjoy.</em></h1><p>Join a community building healthier lives, one repeatable week at a time.</p></div><small>(c) 2026 FitFlow</small></div>
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
  return <section className="auth-page"><div className="auth-pitch"><Link to="/" className="brand light"><span><Icon name="bolt" size={18}/></span>FITFLOW</Link><div><div className="eyebrow"><span />Password help</div><h1>Reset with<br/><em>email OTP.</em></h1><p>We send a 6-digit code to your account email. Use it here to create a new password.</p></div><small>(c) 2026 FitFlow</small></div>
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
  return <section className="auth-page"><div className="auth-pitch"><Link to="/" className="brand light"><span><Icon name="bolt" size={18}/></span>FITFLOW</Link><div><div className="eyebrow"><span />Check your inbox</div><h1>Enter your<br/><em>6-digit code.</em></h1><p>We sent a verification code to {email}. The code expires in 10 minutes.</p></div><small>(c) 2026 FitFlow</small></div>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={verify} autoComplete="off"><span className="form-kicker">EMAIL VERIFICATION</span><h2>Confirm it is you.</h2><OtpField name="emailOtpCode" /><button className="button primary full" disabled={busy}>{busy ? 'Checking...' : 'Verify email'}<Icon name="check" /></button><p className="switch">No code? <button type="button" onClick={resend}>Send again</button></p><p className="switch"><button type="button" onClick={onBack}>Back to login</button></p></form></div>
  </section>;
}

function OtpField({ name }) {
  const [value, setValue] = useState('');
  const handleChange = event => setValue(event.target.value.replace(/\D/g, '').slice(0, 6));
  return <label>Verification code<input className="otp-input" name={name} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" placeholder="123456" autoComplete="new-password" autoCapitalize="none" spellCheck="false" value={value} onChange={handleChange} onInput={handleChange} required /></label>;
}

function PasswordField({ label = 'Password', name = 'authPassword', minLength, placeholder, required = true }) {
  const [shown, setShown] = useState(false);
  return <label>{label}<span className="password-field"><input name={name} type={shown ? 'text' : 'password'} placeholder={placeholder} minLength={minLength} autoComplete="new-password" required={required} /><button type="button" onClick={() => setShown(value => !value)} aria-label={shown ? 'Hide password' : 'Show password'} title={shown ? 'Hide password' : 'Show password'}><Icon name={shown ? 'eyeOff' : 'eye'} size={18}/></button></span></label>;
}

function Dashboard() {
  const { user, notify } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [booked, setBooked] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const load = () => Promise.all([api('/workouts'), api('/classes/mine/booked')]).then(([w, b]) => { setWorkouts(w); setBooked(b); }).catch(e => notify(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const addWorkout = async e => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); values.duration = Number(values.duration); values.calories = Number(values.calories); try { await api('/workouts', { method: 'POST', body: JSON.stringify(values) }); notify('Workout logged - nice work!'); setShowForm(false); load(); } catch (e) { notify(e.message); } };
  const cancelBooking = async id => { try { const result = await api(`/classes/${id}/book`, { method: 'DELETE' }); notify(result.message); setConfirm(null); load(); } catch (e) { notify(e.message); } };
  const checkout = async () => { try { const result = await api('/payments/checkout', { method: 'POST' }); window.location.assign(result.url); } catch (e) { notify(e.message); } };
  const remove = async id => { try { await api(`/workouts/${id}`, { method: 'DELETE' }); setWorkouts(w => w.filter(x => x._id !== id)); notify('Workout removed'); setConfirm(null); } catch (e) { notify(e.message); } };
  const totalMinutes = workouts.reduce((a, w) => a + w.duration, 0), calories = workouts.reduce((a, w) => a + w.calories, 0);
  const chart = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { day: d.toLocaleDateString('en', { weekday: 'short' }), minutes: workouts.filter(w => new Date(w.completedAt).toDateString() === d.toDateString()).reduce((a, w) => a + w.duration, 0) }; });
  return <section className="dashboard section"><div className="dash-head"><div><p>GOOD TO SEE YOU, {user.name.split(' ')[0].toUpperCase()}</p><h1>Keep the rhythm going.</h1></div><button className="button primary" onClick={() => setShowForm(true)}><Icon name="plus"/>Log workout</button></div>
    <div className="stats-grid"><Stat label="Workouts logged" value={workouts.length} note="All time"/><Stat label="Minutes moved" value={totalMinutes} note="Every minute counts"/><Stat label="Energy burned" value={calories} suffix=" kcal" note={`Goal: ${user.goal}`}/></div>
      <div className="dash-grid"><article className="panel chart-panel"><div className="panel-title"><div><span>LAST 7 DAYS</span><h2>Your activity</h2></div><i><Icon name="chart"/></i></div><div className="chart"><Suspense fallback={<div className="loader inline"><span/></div>}><ActivityChart data={chart}/></Suspense></div></article>
      <article className="panel"><div className="panel-title"><div><span>UP NEXT</span><h2>Your bookings</h2></div><i><Icon name="calendar"/></i></div>{loading ? <SkeletonGrid count={2} /> : booked.length ? <div className="booking-list">{booked.map(c => <div key={c._id}><i style={{background:c.accent}}/><div><b>{c.title}</b><span>{c.schedule} - {c.duration} min</span></div><button className="cancel-link" onClick={() => setConfirm({ title: 'Cancel this booking?', message: `Your spot in ${c.title} will be released.`, action: () => cancelBooking(c._id), label: 'Cancel booking' })}>Cancel</button></div>)}</div> : <Empty text="No classes booked yet." link="Browse classes"/>}<button className="upgrade-link" onClick={checkout}>Upgrade membership</button></article>
    </div>
    <article className="panel history"><div className="panel-title"><div><span>YOUR LOG</span><h2>Recent workouts</h2></div></div>{loading ? <SkeletonGrid count={3} /> : workouts.length ? <div className="workout-list">{workouts.map(w => <div key={w._id}><span className="workout-icon"><Icon name="bolt"/></span><div><b>{w.type}</b><span>{new Date(w.completedAt).toLocaleDateString()} - {w.intensity}</span></div><strong>{w.duration} min</strong><small>{w.calories} kcal</small><button onClick={() => setConfirm({ title: 'Delete this workout?', message: `${w.type} will be removed from your progress history.`, action: () => remove(w._id), label: 'Delete workout' })} aria-label="Delete workout"><Icon name="trash" size={17}/></button></div>)}</div> : <Empty text="Your first workout is waiting." action={() => setShowForm(true)} link="Log it now"/>}</article>
    {showForm && <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}><form className="modal" onSubmit={addWorkout} onMouseDown={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowForm(false)}><Icon name="x"/></button><span className="form-kicker">ADD TO YOUR LOG</span><h2>How did you move?</h2><label>Workout type<input name="type" placeholder="e.g. Strength training" required/></label><div className="form-row"><label>Minutes<input name="duration" type="number" min="1" placeholder="45" required/></label><label>Calories<input name="calories" type="number" min="0" placeholder="320"/></label></div><label>Intensity<select name="intensity"><option>Light</option><option>Moderate</option><option>Hard</option></select></label><button className="button primary full">Save workout <Icon name="check"/></button></form></div>}
    {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel={confirm.label} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
  </section>;
}

function Coach() {
  const { user, setUser, notify } = useAuth();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  useEffect(() => { api('/coach/plan').then(setPlan).catch(e => notify(e.message)); }, []);
  const generate = async e => {
    e.preventDefault(); setBusy(true);
    const form = new FormData(e.currentTarget);
    const profile = { experience: form.get('experience'), preferredMinutes: Number(form.get('preferredMinutes')), weightKg: Number(form.get('weightKg')) || undefined, limitations: form.get('limitations'), availableDays: form.getAll('availableDays'), equipment: String(form.get('equipment') || '').split(',').map(x => x.trim()).filter(Boolean) };
    try {
      const updated = await api('/auth/profile', { method: 'PATCH', body: JSON.stringify(profile) }); setUser(updated.user);
      const generated = await api('/coach/plan', { method: 'POST' }); setPlan(generated); notify(generated.source === 'ai' ? 'Your AI plan is ready' : 'Your smart plan is ready');
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const complete = async session => { try { const updated = await api(`/coach/plan/${plan._id}/session/${session._id}`, { method: 'PATCH', body: JSON.stringify({ completed: !session.completed }) }); setPlan(updated); } catch (e) { notify(e.message); } };
  return <section className="coach-page section"><div className="page-head"><div><div className="eyebrow dark"><span/>Adaptive AI Coach</div><h1>A plan built for<br/><em>your real week.</em></h1></div><p>Your AI Coach combines your goal, availability, recent activity and upcoming classes. It adapts without judging missed days.</p></div>
    <div className="coach-layout"><form className="panel coach-form" onSubmit={generate}><span className="form-kicker">TELL YOUR AI COACH</span><h2>Make this week realistic</h2><label>Experience<select name="experience" defaultValue={user.profile?.experience}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Minutes per session<input name="preferredMinutes" type="number" min="10" max="180" defaultValue={user.profile?.preferredMinutes || 30}/></label><fieldset><legend>Available days</legend><div className="day-picker">{days.map(day => <label key={day}><input type="checkbox" name="availableDays" value={day} defaultChecked={user.profile?.availableDays?.includes(day)}/><span>{day.slice(0,3)}</span></label>)}</div></fieldset><label>Equipment<input name="equipment" defaultValue={user.profile?.equipment?.join(', ')} placeholder="Dumbbells, bands, treadmill"/></label><label>Weight in kg <small>(for calorie estimates)</small><input name="weightKg" type="number" min="25" max="350" defaultValue={user.profile?.weightKg}/></label><label>Limitations or preferences<textarea name="limitations" defaultValue={user.profile?.limitations} placeholder="Keep this general; speak to a professional about medical concerns."/></label><button className="button primary full" disabled={busy}>{busy ? 'Building your week...' : plan ? 'Regenerate my week' : 'Build my week'}<Icon name="bolt"/></button></form>
      <article className="plan-board"><div className="plan-board-head"><div><span>{plan?.source === 'ai' ? 'AI-PERSONALIZED' : 'CONSISTENCY PLAN'}</span><h2>{plan ? 'Your week, at a glance' : 'Your plan will appear here'}</h2></div></div>{plan ? <><p className="plan-summary">{plan.summary}</p><div className="plan-sessions">{plan.sessions.map(session => <button key={session._id} className={session.completed ? 'completed' : ''} onClick={() => complete(session)}><i><Icon name={session.completed ? 'check' : 'calendar'} /></i><div><small>{session.day} - {session.minutes} min</small><b>{session.title}</b><span>{session.instructions}</span></div></button>)}</div><p className="safety-note">{plan.safetyNote}</p></> : <div className="plan-empty"><Icon name="chart" size={48}/><p>Choose the days you can genuinely protect, then let FitFlow do the planning.</p></div>}</article>
    </div>
  </section>;
}

function Settings() {
  const { user, setUser, notify } = useAuth();
  const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true);
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: form.get('name'),
      goal: form.get('goal'),
      experience: form.get('experience'),
      preferredMinutes: Number(form.get('preferredMinutes')),
      weightKg: Number(form.get('weightKg')) || undefined,
      limitations: form.get('limitations'),
      availableDays: form.getAll('availableDays'),
      equipment: String(form.get('equipment') || '').split(',').map(item => item.trim()).filter(Boolean),
      currentPassword: form.get('currentPassword'),
      newPassword: form.get('newPassword')
    };
    if (['admin','trainer'].includes(user.role)) {
      payload.headline = form.get('headline');
      payload.bio = form.get('bio');
      payload.specialties = form.get('specialties');
      payload.certifications = form.get('certifications');
    }
    if (!payload.newPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
    }
    try {
      const result = await api('/auth/settings', { method: 'PATCH', body: JSON.stringify(payload) });
      setUser(result.user); notify(result.message);
      formElement.currentPassword.value = '';
      formElement.newPassword.value = '';
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  return <section className="dashboard section"><div className="dash-head"><div><p>ACCOUNT SETTINGS</p><h1>Keep your profile current.</h1></div></div>
    <form className="panel settings-form" onSubmit={save} autoComplete="off">
      <div className="form-row"><label>Full name<input name="name" defaultValue={user.name} required /></label><label>Main goal<select name="goal" defaultValue={user.goal}><option>Build strength</option><option>Lose weight</option><option>Improve fitness</option><option>Stay active</option></select></label></div>
      <div className="form-row"><label>Experience<select name="experience" defaultValue={user.profile?.experience}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Minutes per session<input name="preferredMinutes" type="number" min="10" max="180" defaultValue={user.profile?.preferredMinutes || 30}/></label></div>
      <fieldset><legend>Available days</legend><div className="day-picker">{days.map(day => <label key={day}><input type="checkbox" name="availableDays" value={day} defaultChecked={user.profile?.availableDays?.includes(day)}/><span>{day.slice(0,3)}</span></label>)}</div></fieldset>
      <div className="form-row"><label>Equipment<input name="equipment" defaultValue={user.profile?.equipment?.join(', ')} placeholder="Dumbbells, bands, treadmill"/></label><label>Weight in kg<input name="weightKg" type="number" min="25" max="350" defaultValue={user.profile?.weightKg}/></label></div>
      <label>Limitations or preferences<textarea name="limitations" defaultValue={user.profile?.limitations} placeholder="Keep this general; speak to a professional about medical concerns."/></label>
      {['admin','trainer'].includes(user.role) && <div className="trainer-settings"><span className="form-kicker">TRAINER PROFILE</span><div className="form-row"><label>Headline<input name="headline" defaultValue={user.trainerProfile?.headline} placeholder="Strength trainer for busy beginners"/></label><label>Specialties<input name="specialties" defaultValue={user.trainerProfile?.specialties?.join(', ')} placeholder="Strength, Mobility, Fat loss"/></label></div><label>Bio<textarea name="bio" defaultValue={user.trainerProfile?.bio} placeholder="Short training story and style."/></label><label>Certifications<input name="certifications" defaultValue={user.trainerProfile?.certifications?.join(', ')} placeholder="ACE CPT, Yoga 200HR"/></label></div>}
      <div className="password-section"><span className="form-kicker">CHANGE PASSWORD</span><div className="form-row"><PasswordField label="Current password" name="currentPassword" required={false} /><PasswordField label="New password" name="newPassword" minLength="8" required={false} /></div></div>
      <button className="button primary" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}<Icon name="check" /></button>
    </form>
  </section>;
}

function AccountAction({ type }) {
  const [params] = useSearchParams(); const { notify } = useAuth(); const navigate = useNavigate();
  const [message, setMessage] = useState(type === 'verify' ? 'Verifying your email...' : 'Choose a new password');
  useEffect(() => { if (type === 'verify') api('/auth/verify-email', { method:'POST', body: JSON.stringify({ token: params.get('token'), email: params.get('email') }) }).then(r => setMessage(r.message)).catch(e => setMessage(e.message)); }, []);
  const reset = async e => { e.preventDefault(); try { const result = await api('/auth/reset-password', { method:'POST', body: JSON.stringify({ token: params.get('token'), email: params.get('email'), password: new FormData(e.currentTarget).get('authPassword') }) }); notify(result.message); navigate('/auth'); } catch (e) { setMessage(e.message); } };
  return <section className="auth-form-wrap standalone"><div className="auth-form"><span className="form-kicker">ACCOUNT SECURITY</span><h2>{message}</h2>{type === 'reset' && <form onSubmit={reset}><PasswordField label="New password" minLength="8" /><button className="button primary full">Update password</button></form>}<Link to="/auth">Return to login</Link></div></section>;
}

export default App;
