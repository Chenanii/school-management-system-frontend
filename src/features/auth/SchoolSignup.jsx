import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, ShieldCheck } from 'lucide-react';
import Brand from '../../components/layout/Brand.jsx';
import { apiRequest } from '../../api.js';
import PasswordInput from '../../components/PasswordInput.jsx';

function formatPrice(plan) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency
  });
  const amount = plan.priceMinor / (10 ** formatter.resolvedOptions().maximumFractionDigits);
  const price = formatter.format(amount);
  const interval = plan.interval === 'YEARLY' ? 'year' : 'month';
  return plan.priceMinor === 0 ? 'Free' : `${price} / ${interval}`;
}

export default function SchoolSignup({ onBack, onCreated }) {
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [step, setStep] = useState(1);
  const [plansRetry, setPlansRetry] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setPlansLoading(true);
      setPlansError('');
      try {
        const result = await apiRequest('/subscriptions/plans');
        if (cancelled) return;
        const availablePlans = result.data || [];
        setPlans(availablePlans);
        setPlanId((current) => current || availablePlans[0]?.id || '');
      } catch (cause) {
        if (!cancelled) setPlansError(cause.message);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }
    loadPlans();
    return () => { cancelled = true; };
  }, [plansRetry]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (adminPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (adminPassword.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }
    if (!planId) {
      setError('Choose an available subscription plan to continue.');
      return;
    }

    setBusy(true);
    try {
      await apiRequest('/schools/signup', {
        method: 'POST',
        body: JSON.stringify({
          schoolName,
          ...(schoolEmail.trim() ? { schoolEmail: schoolEmail.trim() } : {}),
          adminFirstName,
          adminLastName,
          adminEmail,
          adminPassword,
          planId
        })
      });
      onCreated(adminEmail);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function continueToAdmin(event) {
    event.preventDefault();
    setError('');
    if (!planId) {
      setError('Choose an available subscription plan to continue.');
      return;
    }
    setStep(2);
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <div className="flex items-center justify-between">
          <Brand />
          <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={15} /> Sign in</button>
        </div>
        <div className="mt-9">
          <p className="eyebrow">Get started</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">Register your school</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Create your school workspace and administrator account.</p>
        </div>
        <div className="signup-stepper" role="group" aria-label={`Step ${step} of 2`}>
          <div className={`signup-step ${step === 1 ? 'signup-step-current' : 'signup-step-complete'}`} aria-current={step === 1 ? 'step' : undefined}>
            <span>{step > 1 ? '✓' : '1'}</span><div><strong>School details</strong><small>School and plan</small></div>
          </div>
          <div className="signup-step-line" />
          <div className={`signup-step ${step === 2 ? 'signup-step-current' : ''}`} aria-current={step === 2 ? 'step' : undefined}>
            <span>2</span><div><strong>Administrator</strong><small>Account details</small></div>
          </div>
        </div>
        <form onSubmit={step === 1 ? continueToAdmin : handleSubmit} className="mt-7 space-y-5">
          {step === 1 ? <>
            <div className="signup-section">
              <h2>Tell us about your school</h2>
              <label className="field-label">
                School name
                <input className="text-input" type="text" autoComplete="organization" maxLength={160} placeholder="e.g. Greenfields Secondary School" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} required />
              </label>
              <label className="field-label">
                School email <span className="optional-label">Optional</span>
                <input className="text-input" type="email" autoComplete="email" placeholder="office@school.edu" value={schoolEmail} onChange={(event) => setSchoolEmail(event.target.value)} />
              </label>
            </div>
            <div className="signup-section">
              <h2>Choose a plan</h2>
              {plansLoading ? (
                <div className="plan-message"><LoaderCircle size={17} className="animate-spin" /> Loading available plans…</div>
              ) : plansError ? (
                <div className="form-error" role="alert">
                  {plansError}
                  <button className="text-button ml-2" type="button" onClick={() => setPlansRetry((count) => count + 1)}>Try again</button>
                </div>
              ) : plans.length === 0 ? (
                <p className="plan-message" role="status">No plans are available right now. Please contact your school platform administrator.</p>
              ) : (
                <div className="plan-options">
                  {plans.map((plan) => (
                    <label className={`plan-option ${planId === plan.id ? 'plan-option-selected' : ''}`} key={plan.id}>
                      <input type="radio" name="planId" value={plan.id} checked={planId === plan.id} onChange={() => setPlanId(plan.id)} />
                      <span className="plan-option-copy">
                        <span className="plan-option-name">{plan.name}</span>
                        <span className="plan-option-detail">{plan.description || `${plan.trialDays} day${plan.trialDays === 1 ? '' : 's'} trial`}</span>
                      </span>
                      <span className="plan-option-price">{formatPrice(plan)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </> : <div className="signup-section">
            <h2>Create your administrator account</h2>
            <div className="signup-name-grid">
              <label className="field-label">
                First name
                <input className="text-input" type="text" autoComplete="given-name" maxLength={80} value={adminFirstName} onChange={(event) => setAdminFirstName(event.target.value)} required />
              </label>
              <label className="field-label">
                Last name
                <input className="text-input" type="text" autoComplete="family-name" maxLength={80} value={adminLastName} onChange={(event) => setAdminLastName(event.target.value)} required />
              </label>
            </div>
            <label className="field-label">
              Administrator email
              <input className="text-input" type="email" autoComplete="username" placeholder="you@school.edu" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
            </label>
            <label className="field-label">
              Password
              <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
              <span className="field-hint">Use at least 12 characters.</span>
            </label>
            <label className="field-label">
              Confirm password
              <PasswordInput autoComplete="new-password" minLength={12} maxLength={128} placeholder="Enter your password again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
          </div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="signup-step-actions">
            {step === 2 && <button className="secondary-button" type="button" onClick={() => { setStep(1); setError(''); }}><ArrowLeft size={15} /> Back</button>}
            <button className="primary-button justify-center" type="submit" disabled={step === 1 ? plansLoading || Boolean(plansError) || plans.length === 0 : busy || plansLoading || Boolean(plansError) || plans.length === 0}>
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
              {busy ? 'Creating your school…' : step === 1 ? 'Continue to administrator' : 'Create school account'}
            </button>
          </div>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck size={15} className="text-green-700" />
          Your school data is protected and private
        </div>
      </section>
    </main>
  );
}
