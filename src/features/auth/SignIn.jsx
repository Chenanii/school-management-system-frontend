import { useState } from 'react';
import { GraduationCap, LoaderCircle, ShieldCheck } from 'lucide-react';
import Brand from '../../components/layout/Brand.jsx';

export default function SignIn({ onSignIn, onCreateAccount, initialEmail = '', notice = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSignIn(email, password);
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
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">Sign in to your school</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Your school day, thoughtfully organized.</p>
        </div>
        {notice && <p className="form-success mt-5" role="status">{notice}</p>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="field-label">
            Email address
            <input className="text-input" type="email" autoComplete="username" placeholder="you@school.edu" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field-label">
            Password
            <input className="text-input" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button w-full justify-center" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck size={15} className="text-green-700" />
          Your school data is protected and private
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          New to Schoolhouse?{' '}
          <button className="text-button" type="button" onClick={onCreateAccount}>Register your school</button>
        </p>
      </div>
      <div className="signin-decoration" aria-hidden="true">
        <div className="decoration-orbit orbit-one" />
        <div className="decoration-orbit orbit-two" />
        <div className="decoration-orbit orbit-three" />
        <div className="decoration-copy">
          <span className="decoration-kicker">A better school day starts here</span>
          <p>More time for<br />what matters most.</p>
          <span className="decoration-caption">One calm place for your whole school.</span>
        </div>
        <div className="decoration-sticker"><GraduationCap size={25} /></div>
      </div>
    </main>
  );
}
