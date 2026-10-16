import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { savePlan } from './subscriptionApi.js';

export default function PlanFormModal({ plan, signOut, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: plan?.code || '',
    name: plan?.name || '',
    description: plan?.description || '',
    interval: plan?.interval || 'MONTHLY',
    priceMinor: plan ? String(plan.priceMinor) : '0',
    currency: plan?.currency || 'MWK',
    trialDays: plan ? String(plan.trialDays) : '14',
    maxStudents: plan?.maxStudents == null ? '' : String(plan.maxStudents),
    maxStaff: plan?.maxStaff == null ? '' : String(plan.maxStaff),
    isActive: plan?.isActive ?? true
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const data = {
      ...(plan ? {} : { code: form.code.trim() }),
      name: form.name.trim(),
      description: form.description.trim() || null,
      interval: form.interval,
      priceMinor: Number(form.priceMinor),
      currency: form.currency.trim().toUpperCase(),
      trialDays: Number(form.trialDays),
      maxStudents: form.maxStudents === '' ? null : Number(form.maxStudents),
      maxStaff: form.maxStaff === '' ? null : Number(form.maxStaff),
      isActive: form.isActive
    };
    try {
      await savePlan(plan?.id, data);
      onSaved();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="user-modal subscription-modal" role="dialog" aria-modal="true" aria-labelledby="plan-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Plan catalogue</p>
            <h2 id="plan-form-title">{plan ? 'Edit subscription plan' : 'Create a subscription plan'}</h2>
            <p>Enter prices in minor currency units for the selected currency.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          {!plan && (
            <label className="field-label">
              Plan code
              <input className="text-input" name="code" maxLength={50} pattern="[a-z0-9][a-z0-9_-]*" value={form.code} onChange={updateField} required />
              <span className="field-hint">Lowercase letters, numbers, hyphens, and underscores.</span>
            </label>
          )}
          <label className="field-label">
            Plan name
            <input className="text-input" name="name" maxLength={100} minLength={2} value={form.name} onChange={updateField} required />
          </label>
          <label className="field-label">
            Description <span className="optional-label">Optional</span>
            <textarea className="text-input subscription-description" name="description" maxLength={500} value={form.description} onChange={updateField} />
          </label>
          <div className="user-name-grid">
            <label className="field-label">
              Billing interval
              <select className="text-input" name="interval" value={form.interval} onChange={updateField}>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
            <label className="field-label">
              Price (minor units)
              <input className="text-input" type="number" name="priceMinor" min="0" max="2147483647" step="1" value={form.priceMinor} onChange={updateField} required />
            </label>
          </div>
          <div className="user-name-grid">
            <label className="field-label">
              Currency code
              <input className="text-input" name="currency" minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.currency} onChange={updateField} required />
            </label>
            <label className="field-label">
              Trial days
              <input className="text-input" type="number" name="trialDays" min="0" max="90" step="1" value={form.trialDays} onChange={updateField} required />
            </label>
          </div>
          <div className="user-name-grid">
            <label className="field-label">
              Student limit <span className="optional-label">Blank = unlimited</span>
              <input className="text-input" type="number" name="maxStudents" min="1" max="2147483647" step="1" value={form.maxStudents} onChange={updateField} />
            </label>
            <label className="field-label">
              Staff limit <span className="optional-label">Blank = unlimited</span>
              <input className="text-input" type="number" name="maxStaff" min="1" max="2147483647" step="1" value={form.maxStaff} onChange={updateField} />
            </label>
          </div>
          <label className="academic-year-current">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
            <span><strong>Available for new subscriptions</strong><small>Inactive plans remain visible in subscription history.</small></span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : plan ? 'Save plan' : 'Create plan'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
