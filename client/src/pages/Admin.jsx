import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { ConfirmModal, Empty, Stat } from '../ui';

export default function Admin() {
  const { user, notify } = useAuth();
  const [overview, setOverview] = useState(null); const [users, setUsers] = useState([]); const [classes, setClasses] = useState([]); const [trainers, setTrainers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);
  const load = () => {
    api('/admin/overview').then(setOverview).catch(e => notify(e.message));
    api('/admin/classes').then(setClasses).catch(e => notify(e.message));
    api('/admin/trainers').then(setTrainers).catch(e => notify(e.message));
    if (user.role === 'admin') api('/admin/users').then(setUsers).catch(e => notify(e.message));
  };
  useEffect(load, []);
  const changeRole = async (id, role) => { try { await api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); notify('Role updated'); load(); } catch (e) { notify(e.message); } };
  const valuesFrom = form => {
    const data = Object.fromEntries(new FormData(form));
    data.duration = Number(data.duration);
    data.capacity = Number(data.capacity);
    data.startsAt = data.startsAt ? new Date(data.startsAt).toISOString() : undefined;
    if (!data.trainer) delete data.trainer;
    return data;
  };
  const addClass = async e => { e.preventDefault(); try { await api('/admin/classes', { method:'POST', body: JSON.stringify(valuesFrom(e.currentTarget)) }); e.currentTarget.reset(); notify('Class published'); load(); } catch (error) { notify(error.message); } };
  const updateClass = async e => { e.preventDefault(); try { await api(`/admin/classes/${e.currentTarget.dataset.id}`, { method:'PATCH', body: JSON.stringify(valuesFrom(e.currentTarget)) }); notify('Class updated'); load(); } catch (error) { notify(error.message); } };
  const cancelClass = async id => { try { await api(`/admin/classes/${id}`, { method:'DELETE' }); notify('Class cancelled'); setConfirm(null); load(); } catch (error) { notify(error.message); } };
  const localDate = value => value ? new Date(value).toISOString().slice(0, 16) : '';
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter(item => (roleFilter === 'all' || item.role === roleFilter) && [item.name, item.email, item.goal].join(' ').toLowerCase().includes(normalizedQuery));
  const filteredClasses = classes.filter(item => [item.title, item.category, item.coach, item.schedule, item.level].join(' ').toLowerCase().includes(normalizedQuery));
  return <section className="dashboard section"><div className="dash-head"><div><p>{user.role.toUpperCase()} WORKSPACE</p><h1>Run FitFlow clearly.</h1></div></div>{overview && <div className="stats-grid"><Stat label="Members" value={overview.members}/><Stat label="Classes" value={overview.classes}/><Stat label="Workouts logged" value={overview.workouts}/></div>}<div className="admin-tools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users, classes, trainers..." />{user.role === 'admin' && <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="all">All roles</option><option value="member">Members</option><option value="trainer">Trainers</option><option value="admin">Admins</option></select>}</div><div className="admin-grid"><form className="panel admin-form" onSubmit={addClass}><span className="form-kicker">PUBLISH A SESSION</span><h2>Add a real class</h2><div className="form-row"><label>Class title<input name="title" required/></label><label>Category<input name="category" required/></label></div><div className="form-row"><label>Public trainer name<input name="coach" defaultValue={user.name} required/><small>Shown to members on the class card.</small></label><label>Starts at<input name="startsAt" type="datetime-local" required/></label></div><div className="form-row"><label>Duration<input name="duration" type="number" defaultValue="45" required/></label><label>Capacity<input name="capacity" type="number" defaultValue="16" required/></label></div><div className="form-row"><label>Level<select name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>{user.role === 'admin' && <label>Assign staff login<select name="trainer"><option value="">No staff account</option>{trainers.map(trainer => <option value={trainer._id} key={trainer._id}>{trainer.name}</option>)}</select><small>Controls who can manage this class.</small></label>}</div><label>Display schedule<input name="schedule" placeholder="Mon - 6:30 PM" required/></label><button className="button primary full">Publish class</button></form>{user.role === 'admin' && <article className="panel"><div className="panel-title"><div><span>ACCESS CONTROL</span><h2>Team and members</h2></div></div><div className="user-list">{filteredUsers.length ? filteredUsers.map(item => <div key={item._id}><div><b>{item.name}</b><span>{item.email}</span></div><select value={item.role} onChange={e => changeRole(item._id,e.target.value)}><option>member</option><option>trainer</option><option>admin</option></select></div>) : <Empty text="No people match that search." link="Browse classes" />}</div></article>}</div>
    <article className="panel class-manager"><div className="panel-title"><div><span>CLASS OPERATIONS</span><h2>{user.role === 'trainer' ? 'Your sessions' : 'All sessions'}</h2></div></div><div className="managed-classes">{filteredClasses.length ? filteredClasses.map(item => <form key={item._id} data-id={item._id} onSubmit={updateClass}><div className="form-row"><label>Class title<input name="title" defaultValue={item.title} required/></label><label>Category<input name="category" defaultValue={item.category} required/></label></div><div className="form-row"><label>Public trainer name<input name="coach" defaultValue={item.coach} required/><small>Shown to members on the class card.</small></label><label>Starts at<input name="startsAt" type="datetime-local" defaultValue={localDate(item.startsAt)} required/></label></div><div className="form-row"><label>Duration<input name="duration" type="number" defaultValue={item.duration} required/></label><label>Capacity<input name="capacity" type="number" defaultValue={item.capacity} required/></label></div><div className="form-row"><label>Level<select name="level" defaultValue={item.level}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>{user.role === 'admin' && <label>Assign staff login<select name="trainer" defaultValue={item.trainer?._id || item.trainer || ''}><option value="">No staff account</option>{trainers.map(trainer => <option value={trainer._id} key={trainer._id}>{trainer.name}</option>)}</select><small>Controls who can manage this class.</small></label>}</div><label>Display schedule<input name="schedule" defaultValue={item.schedule} required/></label><div className="manager-actions"><button className="button primary">Save changes</button><button type="button" className="danger-btn" onClick={() => setConfirm({ title: 'Cancel this class?', message: `${item.title} will be hidden from members and removed from normal booking.`, action: () => cancelClass(item._id), label: 'Cancel class' })}>Cancel class</button></div></form>) : <Empty text="No classes match that search." link="Browse classes" />}</div></article>
    {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel={confirm.label} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
  </section>;
}
