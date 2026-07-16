import { useState } from 'react';
import { Icon } from '../ui';

export default function PasswordField({ label = 'Password', name = 'authPassword', minLength, placeholder, required = true }) {
  const [shown, setShown] = useState(false);

  return <label>{label}<span className="password-field"><input name={name} type={shown ? 'text' : 'password'} placeholder={placeholder} minLength={minLength} autoComplete="new-password" required={required} /><button type="button" onClick={() => setShown(value => !value)} aria-label={shown ? 'Hide password' : 'Show password'} title={shown ? 'Hide password' : 'Show password'}><Icon name={shown ? 'eyeOff' : 'eye'} size={18}/></button></span></label>;
}
