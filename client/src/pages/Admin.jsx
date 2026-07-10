import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { ConfirmModal } from '../ui';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminClassForm from './admin/AdminClassForm';
import AdminClassManager from './admin/AdminClassManager';
import AdminPeople from './admin/AdminPeople';

const trainerName = item => item.trainer?.name || item.trainerName || item.coach || 'FitFlow Trainer';

export default function Admin() {
  const { user, notify } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    api('/admin/overview').then(setOverview).catch(e => notify(e.message));
    api('/admin/analytics').then(setAnalytics).catch(e => notify(e.message));
    api('/admin/classes').then(setClasses).catch(e => notify(e.message));
    api('/admin/trainers').then(setTrainers).catch(e => notify(e.message));
    if (user.role === 'admin') api('/admin/users').then(setUsers).catch(e => notify(e.message));
  };

  useEffect(load, []);

  const valuesFrom = form => {
    const data = Object.fromEntries(new FormData(form));
    data.duration = Number(data.duration);
    data.capacity = Number(data.capacity);
    data.startsAt = data.startsAt ? new Date(data.startsAt).toISOString() : undefined;
    if (!data.trainer) delete data.trainer;
    return data;
  };

  const changeRole = async (id, role) => {
    try { await api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); notify('Role updated'); load(); } catch (e) { notify(e.message); }
  };
  const addClass = async e => {
    e.preventDefault();
    try { await api('/admin/classes', { method:'POST', body: JSON.stringify(valuesFrom(e.currentTarget)) }); e.currentTarget.reset(); notify('Class published'); load(); } catch (error) { notify(error.message); }
  };
  const updateClass = async e => {
    e.preventDefault();
    try { await api(`/admin/classes/${e.currentTarget.dataset.id}`, { method:'PATCH', body: JSON.stringify(valuesFrom(e.currentTarget)) }); notify('Class updated'); load(); } catch (error) { notify(error.message); }
  };
  const cancelClass = async id => {
    try { await api(`/admin/classes/${id}`, { method:'DELETE' }); notify('Class cancelled'); setConfirm(null); load(); } catch (error) { notify(error.message); }
  };
  const markAttendance = async (classId, userId, status) => {
    try {
      await api(`/admin/classes/${classId}/attendance/${userId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      notify(status === 'attended' ? 'Attendance marked' : 'Member marked missed');
      load();
    } catch (error) { notify(error.message); }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter(item => (roleFilter === 'all' || item.role === roleFilter) && [item.name, item.email, item.goal].join(' ').toLowerCase().includes(normalizedQuery));
  const filteredClasses = classes.filter(item => [item.title, item.category, trainerName(item), item.schedule, item.level].join(' ').toLowerCase().includes(normalizedQuery));

  return <section className="dashboard section">
    <div className="dash-head"><div><p>{user.role.toUpperCase()} WORKSPACE</p><h1>Run FitFlow clearly.</h1></div></div>
    <AdminAnalytics overview={overview} analytics={analytics} />
    <div className="admin-tools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users, classes, trainers..." />{user.role === 'admin' && <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="all">All roles</option><option value="member">Members</option><option value="trainer">Trainers</option><option value="admin">Admins</option></select>}</div>
    <div className="admin-grid">
      <AdminClassForm user={user} trainers={trainers} onSubmit={addClass} />
      {user.role === 'admin' && <AdminPeople users={filteredUsers} onRoleChange={changeRole} />}
    </div>
    <AdminClassManager
      classes={filteredClasses}
      trainers={trainers}
      user={user}
      trainerName={trainerName}
      onUpdate={updateClass}
      onCancel={id => {
        const item = classes.find(klass => klass._id === id);
        setConfirm({ title: 'Cancel this class?', message: `${item?.title || 'This class'} will be hidden from members and removed from normal booking.`, action: () => cancelClass(id), label: 'Cancel class' });
      }}
      onAttendance={markAttendance}
    />
    {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel={confirm.label} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
  </section>;
}
