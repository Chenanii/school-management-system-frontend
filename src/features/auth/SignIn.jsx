import { useState } from 'react';
import { GraduationCap, LoaderCircle, ShieldCheck } from 'lucide-react';
import Brand from '../../components/layout/Brand.jsx';
import { apiRequest } from '../../api.js';

export default function SignIn({ onSignIn, onAuthenticated, onCreateAccount, initialEmail = '', notice = '' }) {
  const [mode, setMode] = useState('signin');
  const [identifier, setIdentifier] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [parentNotice, setParentNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setParentNotice('');
    setChallengeId('');
    setCode('');
    setPassword('');
    setConfirmation('');
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSignIn(identifier, password);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestParentCode(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await apiRequest('/auth/parent-portal/verification', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });
      setChallengeId(result.challengeId);
      setParentNotice('If this contact is linked to a student and eligible for setup, a verification code has been sent.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function createParentAccount(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await apiRequest('/auth/parent-portal/register', {
        method: 'POST',
        body: JSON.stringify({ challengeId, identifier, code, password })
      });
      if (!result.data?.accessToken || result.data.user?.role !== 'PARENT') {
        throw new Error('Your parent account could not be created. Please try again.');
      }
      onAuthenticated(result.data);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  const parentSetup = mode === 'parent';
  const enteringCode = Boolean(challengeId);

  return (
    <main className="signin-page">
      <div className="signin-card">
        <Brand />
        <div className="mt-12">
          <p className="eyebrow">{parentSetup ? 'Family access' : 'Welcome back'}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {parentSetup ? 'Create parent account' : 'Sign in to your school'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {parentSetup
              ? 'Verify the email address or phone number the school has on your child’s record, then choose your password.'
              : 'Your school day, thoughtfully organized.'}
          </p>
        </div>
        {notice && <p className="form-success mt-5" role="status">{notice}</p>}
        <form
          onSubmit={parentSetup
            ? (enteringCode ? createParentAccount : requestParentCode)
            : handleSignIn}
          className="mt-8 space-y-5"
        >
          <label className="field-label">
            {parentSetup ? 'Email address or phone number linked to your child' : 'Email address or phone number'}
            <input
              className="text-input"
              type="text"
              autoComplete="username"
              placeholder={parentSetup ? 'Use the contact registered with the school' : 'you@school.edu or +265...'}
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setChallengeId('');
                setParentNotice('');
              }}
              required
              disabled={parentSetup && enteringCode}
            />
          </label>
          {!parentSetup ? (
            <label className="field-label">
              Password
              <input className="text-input" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          ) : enteringCode ? (
            <>
              {parentNotice && <p className="parent-access-notice" role="status">{parentNotice}</p>}
              <label className="field-label">
                6-digit verification code
                <input className="text-input parent-otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
              </label>
              <label className="field-label">
                Create a password
                <input className="text-input" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <span className="parent-access-help">Use at least 12 characters.</span>
              </label>
              <label className="field-label">
                Confirm password
                <input className="text-input" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </label>
              {password !== confirmation && confirmation && <p className="form-error" role="alert">Passwords do not match.</p>}
            </>
          ) : (
            <p className="parent-access-help">We’ll send a one-time code to the email or phone number already linked to your child’s school record.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button
            className="primary-button w-full justify-center"
            type="submit"
            disabled={busy || (parentSetup && enteringCode && password !== confirmation)}
          >
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
            {busy
              ? 'Please wait…'
              : parentSetup
                ? enteringCode ? 'Create parent account' : 'Send verification code'
                : 'Sign in'}
          </button>
          {parentSetup && enteringCode && (
            <button className="text-button parent-resend-code" type="button" onClick={() => changeMode('parent')}>
              Use a different contact or request a new code
            </button>
          )}
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck size={15} className="text-green-700" />
          Your school data is protected and private
        </div>
        {!parentSetup ? (
          <>
            <p className="mt-6 text-center text-sm text-muted">
              New to Schoolhouse?{' '}
              <button className="text-button" type="button" onClick={onCreateAccount}>Register your school</button>
            </p>
            <p className="mt-3 text-center text-sm text-muted">
              Parent or guardian?{' '}
              <button className="text-button" type="button" onClick={() => changeMode('parent')}>Create your parent account</button>
            </p>
          </>
        ) : (
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <button className="text-button" type="button" onClick={() => changeMode('signin')}>Sign in</button>
          </p>
        )}
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
