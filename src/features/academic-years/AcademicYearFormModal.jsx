import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { saveAcademicYear } from './academicYearApi.js';

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function AcademicYearFormModal({ year, signOut, onClose, onSaved }) {
  const editing = Boolean(year);
  const [form, setForm] = useState({
    name: year?.name || '',
    startDate: dateInputValue(year?.startDate),
    endDate: dateInputValue(year?.endDate),
    isCurrent: Boolean(year?.isCurrent)
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
    if (form.startDate >= form.endDate) {
      setError('The end date must be after the start date.');
      return;
    }

    setSaving(true);
    try {
      const result = await saveAcademicYear(year?.id, {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="academic-year-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Academic calendar' : 'New academic calendar'}</p>
            <h2 id="academic-year-form-title">{editing ? 'Edit academic year' : 'Add an academic year'}</h2>
            <p>{editing ? 'Update the year dates or current-year selection.' : 'Set the school-year dates and current-year selection.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Academic year name
            <input className="text-input" name="name" maxLength={50} value={form.name} onChange={updateField} placeholder="e.g. 2026–2027" required />
          </label>
          <p className="field-hint">Grading scales are assigned to class levels. If the school has one scale, it is applied automatically.</p>
          <div className="user-name-grid">
            <label className="field-label">
              Start date
              <input className="text-input" type="date" name="startDate" value={form.startDate} onChange={updateField} required />
            </label>
            <label className="field-label">
              End date
              <input className="text-input" type="date" name="endDate" value={form.endDate} onChange={updateField} required />
            </label>
          </div>
          <label className="academic-year-current">
            <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={updateField} />
            <span>
              <strong>Set as current academic year</strong>
              <small>Making this current will unset the previously current year.</small>
            </span>
          </label>
          {editing && year.terms?.some((term) => ['FINALIZED', 'PUBLISHED', 'CLOSED'].includes(term.status)) && (
            <p className="form-hint">Dates are locked while this year contains a finalized, published, or closed term.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add academic year'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
