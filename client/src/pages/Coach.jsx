import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { Icon } from '../ui';

export default function Coach() {
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
