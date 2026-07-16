import { useState } from 'react';

export default function OtpField({ name }) {
  const [value, setValue] = useState('');
  const handleChange = event => setValue(event.target.value.replace(/\D/g, '').slice(0, 6));

  return <label>Verification code<input className="otp-input" name={name} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" placeholder="123456" autoComplete="new-password" autoCapitalize="none" spellCheck="false" value={value} onChange={handleChange} onInput={handleChange} required /></label>;
}
