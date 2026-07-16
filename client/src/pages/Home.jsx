import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Icon } from '../ui';

export default function Home() {
  const [stats, setStats] = useState({ members: 0, classes: 0, workouts: 0 });
  useEffect(() => { api('/classes/stats/summary').then(setStats).catch(() => {}); }, []);
  return <>
    <section className="home-hero">
      <div className="hero-copy">
        <div className="eyebrow dark"><span />Fitness operating system</div>
        <h1>Train with a rhythm your life can keep.</h1>
        <p>FitFlow turns trainer-led classes, AI coaching, and workout tracking into one calm weekly command center, so your routine feels planned before motivation has to fight for it.</p>
        <div className="hero-actions"><Link to="/auth" className="button primary">Build my week <Icon name="arrow" /></Link><Link to="/classes" className="button ghost">View live classes</Link></div>
        <div className="home-stats">
          <span><b>{stats.members || 0}</b>verified members</span>
          <span><b>{stats.classes}</b>live classes</span>
          <span><b>{stats.workouts}</b>workouts logged</span>
        </div>
      </div>
      <div className="hero-console" aria-hidden="true">
        <div className="console-top"><span>Weekly Flow</span><b>On track</b></div>
        <div className="console-ring"><div><strong>4</strong><span>sessions</span></div></div>
        <div className="console-stack">
          <div><i className="lime-dot"/><span>Mon</span><b>Strength Build</b><small>50 min</small></div>
          <div><i className="blue-dot"/><span>Wed</span><b>Flow State</b><small>45 min</small></div>
          <div><i className="orange-dot"/><span>Sat</span><b>Pulse HIIT</b><small>35 min</small></div>
        </div>
        <div className="coach-note"><Icon name="bolt" size={18}/><p>AI coach adjusts your plan around booked classes and real progress.</p></div>
      </div>
    </section>
    <section className="home-flow">
      <div><div className="eyebrow dark"><span />How it feels</div><h2>Less guessing.<br/>More showing up.</h2></div>
      <div className="flow-grid">
        <Feature number="01" title="Pick your signal" text="Explore live classes by category, level, trainer, schedule, and open spots." icon="calendar" />
        <Feature number="02" title="Lock the week" text="Book sessions, join waitlists, and keep your next workouts visible." icon="users" />
        <Feature number="03" title="Let the plan adapt" text="Log workouts and get a coaching plan that responds to your goal and availability." icon="chart" />
      </div>
    </section>
    <section className="home-showcase">
      <div className="showcase-card wide"><span>For members</span><h3>Dashboard that rewards consistency, not perfection.</h3><p>Bookings, workout totals, recent activity, and progress trends stay in one focused view.</p></div>
      <div className="showcase-card"><span>For trainers</span><h3>Own your schedule.</h3><p>Trainer accounts manage only their assigned classes.</p></div>
      <div className="showcase-card accent"><span>For admins</span><h3>Run the studio.</h3><p>Promote users, publish classes, edit sessions, and keep operations clear.</p></div>
    </section>
    <section className="home-cta"><div><span>Start small. Repeat often.</span><h2>Your first consistent week can start today.</h2></div><Link className="button primary" to="/auth">Start FitFlow <Icon name="arrow" /></Link></section>
    <Footer />
  </>;
}

function Feature({ number, title, text, icon }) {
  return <article className="feature"><div className="feature-top"><span>{number}</span><i><Icon name={icon} /></i></div><h3>{title}</h3><p>{text}</p></article>;
}

const Footer = () => <footer><Link to="/" className="brand light"><span><Icon name="bolt" size={18}/></span>FITFLOW</Link><p>Fitness for the beautifully imperfect.</p><span>(c) 2026 FitFlow - Built with the MERN stack</span></footer>;
