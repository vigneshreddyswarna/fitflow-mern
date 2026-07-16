import { Stat } from '../../ui';

export default function AdminAnalytics({ overview, analytics }) {
  return <>
    {overview && <div className="stats-grid"><Stat label="Members" value={overview.members}/><Stat label="Classes" value={overview.classes}/><Stat label="Workouts logged" value={overview.workouts}/></div>}
    {analytics && <div className="analytics-grid">
      <article className="panel"><span className="form-kicker">BOOKINGS</span><h2>{analytics.totals.totalBookings}</h2><p>{analytics.totals.fillRate}% capacity filled</p></article>
      <article className="panel"><span className="form-kicker">ATTENDANCE</span><h2>{analytics.totals.attendanceRate}%</h2><p>{analytics.totals.attended} attended / {analytics.totals.missed} missed</p></article>
      <article className="panel"><span className="form-kicker">WAITLIST</span><h2>{analytics.totals.waitlisted}</h2><p>Members waiting for a spot</p></article>
      <article className="panel"><span className="form-kicker">TOP CLASS</span><h2>{analytics.topClasses[0]?.title || 'None yet'}</h2><p>{analytics.topClasses[0]?.bookings || 0} bookings</p></article>
    </div>}
  </>;
}
