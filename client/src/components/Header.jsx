import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { Icon } from '../ui';

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return <header className="header"><div className="nav-wrap">
    <Link to="/" className="brand"><span><Icon name="bolt" size={18} /></span>FITFLOW</Link>
    <nav id="primary-navigation" aria-label="Primary navigation" className={open ? 'nav open' : 'nav'}>
      <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
      <NavLink to="/classes" onClick={() => setOpen(false)}>Classes</NavLink>
      {user && <NavLink to="/dashboard" onClick={() => setOpen(false)}>My progress</NavLink>}
      {user && <NavLink to="/coach" onClick={() => setOpen(false)}>AI coach</NavLink>}
      {user && <NavLink to="/settings" onClick={() => setOpen(false)}>Settings</NavLink>}
      {user && ['admin','trainer'].includes(user.role) && <NavLink to="/admin" onClick={() => setOpen(false)}>Manage</NavLink>}
      {user ? <button className="text-btn" onClick={logout}>Log out</button> : <Link className="nav-cta" to="/auth">Get started <Icon name="arrow" size={16} /></Link>}
    </nav>
    <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} aria-controls="primary-navigation"><Icon name={open ? 'x' : 'menu'} /></button>
  </div></header>;
}
