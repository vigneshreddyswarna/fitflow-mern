import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { ConfirmModal, Empty, Icon, SkeletonGrid, Stat } from '../ui';

const ActivityChart = lazy(() => import('../ActivityChart'));

export default function Dashboard() {
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
