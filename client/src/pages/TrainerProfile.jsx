import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { Empty, Icon, SkeletonGrid } from '../ui';

export default function TrainerProfile() {
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
