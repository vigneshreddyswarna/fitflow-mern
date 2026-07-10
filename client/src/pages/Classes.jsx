import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { Empty, Icon, SkeletonGrid } from '../ui';

function ClassCard({ item, index, onBook, actionLabel = 'Book' }) {
  return <article className="class-card" style={{'--accent': item.accent}}>
    <div className="class-art"><span>{String(index + 1).padStart(2, '0')}</span><div className="art-ring"/><b>{item.category.toUpperCase()}</b></div>
    <div className="class-body"><div className="class-meta"><span>{item.level}</span><span><Icon name="clock" size={15}/>{item.duration} min</span></div><h2><Link to={`/classes/${item._id}`}>{item.title}</Link></h2><p>Trainer: {item.trainer ? <Link to={`/trainers/${item.trainer}`}>{item.trainerName}</Link> : item.trainerName}</p><div className="class-footer"><div><small>{item.schedule}</small><b>{item.spotsLeft} spots left</b></div><button onClick={() => onBook(item._id)}>{actionLabel} <Icon name="arrow" size={17}/></button></div></div>
  </article>;
}

export default function Classes() {
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
    {loading ? <SkeletonGrid count={4} className="class-grid" /> : <div className="class-grid">{shown.map((item, index) => <ClassCard item={item} index={index} onBook={book} key={item._id} />)}</div>}
  </section>;
}

export function ClassDetail() {
  const { id } = useParams();
  const { user, notify } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api(`/classes/${id}`).then(setItem).catch(e => notify(e.message)).finally(() => setLoading(false)); }, [id]);
  const book = async () => {
    if (!user) return navigate('/auth');
    try { const data = await api(`/classes/${id}/book`, { method: 'POST' }); notify(data.message); setItem(current => ({ ...current, spotsLeft: data.spotsLeft ?? current.spotsLeft })); } catch (e) { notify(e.message); }
  };
  if (loading) return <section className="page section"><SkeletonGrid count={3} /></section>;
  if (!item) return <section className="page section"><Empty text="Class not found." link="Browse classes" /></section>;
  return <section className="class-detail section">
    <div className="class-detail-hero" style={{'--accent': item.accent}}>
      <div><div className="eyebrow dark"><span />{item.category}</div><h1>{item.title}</h1><p>{item.level} session with {item.trainerName}. Bring water, arrive early, and choose a pace you can repeat.</p></div>
      <aside><span>{item.schedule}</span><b>{item.spotsLeft} spots left</b><button className="button primary full" onClick={book}>Book this class <Icon name="arrow" /></button></aside>
    </div>
    <div className="class-detail-grid">
      <article className="panel"><div className="panel-title"><div><span>SESSION</span><h2>What to expect</h2></div></div><div className="detail-facts"><span>{item.duration} minutes</span><span>{item.level}</span><span>{item.capacity} capacity</span><span>{item.category}</span></div><p className="detail-copy">This class is trainer-led and built for steady progress. FitFlow tracks booking capacity and waitlists automatically, while your AI Coach can plan around sessions you book.</p></article>
      <article className="panel"><div className="panel-title"><div><span>TRAINER</span><h2>{item.trainerName}</h2></div></div><p className="detail-copy">{item.trainerProfile?.headline || 'Verified FitFlow trainer.'}</p>{item.trainer && <Link className="button ghost" to={`/trainers/${item.trainer}`}>View trainer profile</Link>}</article>
    </div>
    <section className="similar-classes"><h2>Similar classes</h2><div className="class-grid">{item.similar?.length ? item.similar.map((similar, index) => <ClassCard item={similar} index={index} actionLabel="View" onBook={(classId) => navigate(`/classes/${classId}`)} key={similar._id} />) : <Empty text="No similar classes yet." link="Browse classes" />}</div></section>
  </section>;
}
