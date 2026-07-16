import { Empty } from '../../ui';

export default function AdminPeople({ users, onRoleChange, readOnly = false }) {
  return <article className="panel">
    <div className="panel-title"><div><span>ACCESS CONTROL</span><h2>Team and members</h2></div></div>
    <div className="user-list">{users.length ? users.map(item => <div key={item._id}><div><b>{item.name}</b><span>{item.email}</span></div><select value={item.role} disabled={readOnly} onChange={e => onRoleChange(item._id,e.target.value)}><option>member</option><option>trainer</option><option>admin</option></select></div>) : <Empty text="No people match that search." link="Browse classes" />}</div>
  </article>;
}
