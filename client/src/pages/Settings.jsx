import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import PasswordField from '../components/PasswordField';
import { Icon } from '../ui';

export default function Settings() {
  const { user, setUser, notify } = useAuth();
  const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true);
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: form.get('name'),
      goal: form.get('goal'),
      experience: form.get('experience'),
      preferredMinutes: Number(form.get('preferredMinutes')),
      weightKg: Number(form.get('weightKg')) || undefined,
      limitations: form.get('limitations'),
      availableDays: form.getAll('availableDays'),
      equipment: String(form.get('equipment') || '').split(',').map(item => item.trim()).filter(Boolean),
      currentPassword: form.get('currentPassword'),
      newPassword: form.get('newPassword')
    };
    if (['admin','trainer'].includes(user.role)) {
      payload.headline = form.get('headline');
      payload.bio = form.get('bio');
      payload.specialties = form.get('specialties');
      payload.certifications = form.get('certifications');
    }
    if (!payload.newPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
    }
    try {
      const result = await api('/auth/settings', { method: 'PATCH', body: JSON.stringify(payload) });
      setUser(result.user); notify(result.message);
      formElement.currentPassword.value = '';
      formElement.newPassword.value = '';
    } catch (error) { notify(error.message); } finally { setBusy(false); }
  };
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  return <section className="dashboard section"><div className="dash-head"><div><p>ACCOUNT SETTINGS</p><h1>Keep your profile current.</h1></div></div>
    <form className="panel settings-form" onSubmit={save} autoComplete="off">
      <div className="form-row"><label>Full name<input name="name" defaultValue={user.name} required /></label><label>Main goal<select name="goal" defaultValue={user.goal}><option>Build strength</option><option>Lose weight</option><option>Improve fitness</option><option>Stay active</option></select></label></div>
      <div className="form-row"><label>Experience<select name="experience" defaultValue={user.profile?.experience}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Minutes per session<input name="preferredMinutes" type="number" min="10" max="180" defaultValue={user.profile?.preferredMinutes || 30}/></label></div>
      <fieldset><legend>Available days</legend><div className="day-picker">{days.map(day => <label key={day}><input type="checkbox" name="availableDays" value={day} defaultChecked={user.profile?.availableDays?.includes(day)}/><span>{day.slice(0,3)}</span></label>)}</div></fieldset>
      <div className="form-row"><label>Equipment<input name="equipment" defaultValue={user.profile?.equipment?.join(', ')} placeholder="Dumbbells, bands, treadmill"/></label><label>Weight in kg<input name="weightKg" type="number" min="25" max="350" defaultValue={user.profile?.weightKg}/></label></div>
      <label>Limitations or preferences<textarea name="limitations" defaultValue={user.profile?.limitations} placeholder="Keep this general; speak to a professional about medical concerns."/></label>
      {['admin','trainer'].includes(user.role) && <div className="trainer-settings"><span className="form-kicker">TRAINER PROFILE</span><div className="form-row"><label>Headline<input name="headline" defaultValue={user.trainerProfile?.headline} placeholder="Strength trainer for busy beginners"/></label><label>Specialties<input name="specialties" defaultValue={user.trainerProfile?.specialties?.join(', ')} placeholder="Strength, Mobility, Fat loss"/></label></div><label>Bio<textarea name="bio" defaultValue={user.trainerProfile?.bio} placeholder="Short training story and style."/></label><label>Certifications<input name="certifications" defaultValue={user.trainerProfile?.certifications?.join(', ')} placeholder="ACE CPT, Yoga 200HR"/></label></div>}
      <div className="password-section"><span className="form-kicker">CHANGE PASSWORD</span><div className="form-row"><PasswordField label="Current password" name="currentPassword" required={false} /><PasswordField label="New password" name="newPassword" minLength="8" required={false} /></div></div>
      <button className="button primary" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}<Icon name="check" /></button>
    </form>
  </section>;
}
