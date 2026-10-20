import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ className = 'text-input', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-input-wrap">
      <input {...props} className={className} type={visible ? 'text' : 'password'} />
      <button
        className="password-visibility-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
      </button>
    </span>
  );
}
