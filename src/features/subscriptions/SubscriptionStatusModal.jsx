import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { datetimeInputValue, datetimePayloadValue, statusLabel, subscriptionStatuses, updateSubscription } from './subscriptionApi.js';

export default function SubscriptionStatusModal({ subscription, signOut, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: subscription.status,
    currentPeriodEnd: datetimeInputValue(subscription.currentPeriodEnd),
    notes: subscription.notes || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.status === 'ACTIVE' && (!form.currentPeriodEnd || new Date(form.currentPeriodEnd) <= new Date())) {
      setError('Set a future paid-through date to activate the subscription.');
      return;
    }
    setSaving(true);
    try {
      const result = await updateSubscription(subscription.id, {
        status: form.status,
        currentPeriodEnd: datetimePayloadValue(form.currentPeriodEnd),
        notes: form.notes.trim() || null
      });
      onSaved(result.data);
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
      <section className="user-modal subscription-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-status-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{subscription.school?.name || 'School subscription'}</p>
            <h2 id="subscription-status-title">Update subscription</h2>
            <p>{subscription.plan?.name} · {statusLabel(subscription.status)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Subscription status
            <select className="text-input" name="status" value={form.status} onChange={updateField}>
              {subscriptionStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>
          <label className="field-label">
            Paid through <span className="optional-label">Optional except when activating</span>
            <input className="text-input" type="datetime-local" name="currentPeriodEnd" value={form.currentPeriodEnd} onChange={updateField} />
          </label>
          <label className="field-label">
            Admin notes <span className="optional-label">Optional</span>
            <textarea className="text-input subscription-description" name="notes" maxLength={1000} value={form.notes} onChange={updateField} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Updating…' : 'Update subscription'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
