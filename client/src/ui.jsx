import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export const Icon = ({ name, size = 20 }) => {
  const paths = {
    bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    check: 'm5 12 4 4L19 6',
    clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    chart: 'M3 3v18h18M7 16l4-5 4 3 5-7',
    calendar: 'M3 9h18M8 3v4M16 3v4M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2',
    menu: 'M4 6h16M4 12h16M4 18h16',
    x: 'M18 6 6 18M6 6l12 12',
    plus: 'M12 5v14M5 12h14',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 3.8 3.8M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'bolt' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
};

export const Stat = ({ label, value, suffix = '', note }) => <article className="stat-card"><span>{label}</span><b>{value}<small>{suffix}</small></b><p>{note}</p></article>;

export const Empty = ({ text, link, action }) => <div className="empty"><span><Icon name="bolt"/></span><p>{text}</p>{action ? <button onClick={action}>{link} <Icon name="arrow" size={16}/></button> : <Link to="/classes">{link} <Icon name="arrow" size={16}/></Link>}</div>;

export const SkeletonGrid = ({ count = 4, className = '' }) => <div className={`skeleton-grid ${className}`}>{Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index}><span/><b/><p/><p/></div>)}</div>;

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [onCancel]);
  return <div className="modal-backdrop" onMouseDown={onCancel}>
    <div ref={dialogRef} className="modal confirm-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <button type="button" className="modal-close" onClick={onCancel} aria-label="Close"><Icon name="x"/></button>
      <span className="form-kicker">PLEASE CONFIRM</span>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-message">{message}</p>
      <div className="manager-actions"><button type="button" className="danger-btn" onClick={onConfirm}>{confirmLabel}</button><button type="button" className="button ghost" onClick={onCancel}>Keep it</button></div>
    </div>
  </div>;
}
