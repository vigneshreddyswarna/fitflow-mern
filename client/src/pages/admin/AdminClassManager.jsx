import { Empty } from '../../ui';

const localDate = value => value ? new Date(value).toISOString().slice(0, 16) : '';
const attendanceFor = (item, userId) => (item.attendance || []).find(mark => (mark.user?._id || mark.user) === userId)?.status;

export default function AdminClassManager({ classes, trainers, user, trainerName, onUpdate, onCancel, onAttendance }) {
  return <article className="panel class-manager">
    <div className="panel-title"><div><span>CLASS OPERATIONS</span><h2>{user.role === 'trainer' ? 'Your sessions' : 'All sessions'}</h2></div></div>
    <div className="managed-classes">{classes.length ? classes.map(item => <form key={item._id} data-id={item._id} onSubmit={onUpdate}>
      <div className="form-row"><label>Class title<input name="title" defaultValue={item.title} required/></label><label>Category<input name="category" defaultValue={item.category} required/></label></div>
      <div className="form-row"><label>Starts at<input name="startsAt" type="datetime-local" defaultValue={localDate(item.startsAt)} required/></label><label>Display schedule<input name="schedule" defaultValue={item.schedule} required/></label></div>
      <div className="form-row"><label>Duration<input name="duration" type="number" defaultValue={item.duration} required/></label><label>Capacity<input name="capacity" type="number" defaultValue={item.capacity} required/></label></div>
      <div className="form-row"><label>Level<select name="level" defaultValue={item.level}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>{user.role === 'admin' ? <label>Trainer<select name="trainer" defaultValue={item.trainer?._id || item.trainer || ''} required><option value="">Choose trainer</option>{trainers.map(trainer => <option value={trainer._id} key={trainer._id}>{trainer.name}</option>)}</select></label> : <label>Trainer<input value={trainerName(item)} readOnly /></label>}</div>
      <div className="attendance-box"><span className="form-kicker">ROSTER</span>{item.attendees?.length ? item.attendees.map(member => <div className="attendance-row" key={member._id}><div><b>{member.name}</b><span>{member.email}</span></div><strong>{attendanceFor(item, member._id) || 'booked'}</strong><button type="button" onClick={() => onAttendance(item._id, member._id, 'attended')}>Attended</button><button type="button" onClick={() => onAttendance(item._id, member._id, 'missed')}>Missed</button></div>) : <p className="muted-line">No booked members yet.</p>}{Boolean((item.waitlist || []).length) && <div className="waitlist-mini"><b>Waitlist</b>{(item.waitlist || []).map(member => <span key={member._id}>{member.name}</span>)}</div>}</div>
      <div className="manager-actions"><button className="button primary">Save changes</button><button type="button" className="danger-btn" onClick={() => onCancel(item._id)}>Cancel class</button></div>
    </form>) : <Empty text="No classes match that search." link="Browse classes" />}</div>
  </article>;
}
