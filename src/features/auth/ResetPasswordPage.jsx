import { useState } from 'react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import Brand from '../../components/layout/Brand.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import { apiRequest } from '../../api.js';

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password })
      });
      setSuccess(result.data?.message || 'Your password has been reset. You can now sign in.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page">
      <div className="signin-card">
        <Brand />
        <div className="mt-12">
          <p className="eyebrow">Account access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">Choose a new password</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Set or reset your password. Use at least 12 characters. This link can only be used once.</p>
        </div>
        {!token ? <p className="form-error mt-6" role="alert">This password reset link is missing its token. Request a new link from the sign-in page.</p> : !success ? <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="field-label">New password
            <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label className="field-label">Confirm new password
            <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button w-full justify-center" type="submit" disabled={busy || password !== confirmation}>
            {busy && <LoaderCircle size={17} className="animate-spin" />}{busy ? 'Saving…' : 'Reset password'}
          </button>
        </form> : <p className="form-success mt-6" role="status">{success}</p>}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck size={15} className="text-green-700" />Your account remains protected</div>
        <p className="mt-6 text-center text-sm text-muted"><a className="text-button" href="/">Back to sign in</a></p>
      </div>
      <div className="signin-decoration" aria-hidden="true">
        <div className="decoration-orbit orbit-one" /><div className="decoration-orbit orbit-two" /><div className="decoration-orbit orbit-three" />
        <div className="decoration-copy"><span className="decoration-kicker">A better school day starts here</span><p>More time for<br />what matters most.</p><span className="decoration-caption">One calm place for your whole school.</span></div>
      </div>
    </main>
  );
}
