import { useState } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { acceptInvitation } from './teacherApi.js';
import PasswordInput from '../../components/PasswordInput.jsx';

export default function TeacherInvitationPage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await acceptInvitation(token, password);
      window.location.assign('/login');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page teacher-invitation-page">
      <section className="signin-card teacher-invitation-card">
        <a className="auth-back-link" href="/login"><ArrowLeft size={15} /> Back to sign in</a>
        <p className="eyebrow">Teacher onboarding</p>
        <h1 className="page-title">Set your password<span className="title-dot">.</span></h1>
        <p className="mt-2 text-sm text-muted">Choose a password to activate your teacher account.</p>
        {!token ? (
          <p className="form-error mt-5" role="alert">This invitation link is missing its token. Ask your school administrator to send a new invitation.</p>
        ) : (
          <form className="user-form" onSubmit={handleSubmit}>
            <label className="field-label">
              Password
              <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <span className="field-hint">Use at least 12 characters.</span>
            </label>
            <label className="field-label">
              Confirm password
              <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button w-full justify-center" type="submit" disabled={busy}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {busy ? 'Activating account…' : 'Activate account'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
