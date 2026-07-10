export default function AdminClassForm({ user, trainers, onSubmit }) {
  return <form className="panel admin-form" onSubmit={onSubmit}>
    <span className="form-kicker">PUBLISH A SESSION</span>
    <h2>Add a class</h2>
    <div className="form-row"><label>Class title<input name="title" required/></label><label>Category<input name="category" required/></label></div>
    <div className="form-row"><label>Starts at<input name="startsAt" type="datetime-local" required/></label><label>Display schedule<input name="schedule" placeholder="Mon - 6:30 PM" required/></label></div>
    <div className="form-row"><label>Duration<input name="duration" type="number" defaultValue="45" required/></label><label>Capacity<input name="capacity" type="number" defaultValue="16" required/></label></div>
    <div className="form-row"><label>Level<select name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>{user.role === 'admin' ? <label>Trainer<select name="trainer" required><option value="">Choose trainer</option>{trainers.map(trainer => <option value={trainer._id} key={trainer._id}>{trainer.name}</option>)}</select></label> : <label>Trainer<input value={user.name} readOnly /></label>}</div>
    <button className="button primary full">Publish class</button>
  </form>;
}
