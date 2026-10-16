import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { saveTerm } from './termApi.js';

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function TermFormModal({ term, academicYears, initialAcademicYearId, signOut, onClose, onSaved }) {
  const editing = Boolean(term);
  const locked = ['FINALIZED', 'PUBLISHED', 'CLOSED'].includes(term?.status);
  const [form, setForm] = useState({
    name: term?.name || '',
    sequence: String(term?.sequence || ''),
    academicYearId: term?.academicYearId || initialAcademicYearId || '',
    startDate: dateInputValue(term?.startDate),
    endDate: dateInputValue(term?.endDate),
    annualWeightPercent: term?.annualWeightPercent ?? ''
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
    if (form.startDate >= form.endDate) {
      setError('The end date must be after the start date.');
      return;
    }
    if (!editing && !form.academicYearId) {
      setError('Select an academic year before creating a term.');
      return;
    }

    const data = {
      name: form.name.trim(),
      sequence: Number(form.sequence),
      startDate: form.startDate,
      endDate: form.endDate,
      ...(form.annualWeightPercent === ''
        ? (editing ? { annualWeightPercent: null } : {})
        : { annualWeightPercent: Number(form.annualWeightPercent) })
    };
    if (!editing) data.academicYearId = form.academicYearId;

    setSaving(true);
    try {
      await saveTerm(term?.id, data);
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="term-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'School calendar' : 'New term'}</p>
            <h2 id="term-form-title">{editing ? 'Edit term' : 'Add a term'}</h2>
            <p>{editing ? 'Update the term calendar. Its academic year cannot be changed.' : 'Create a term within an academic year. Term dates cannot overlap.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {editing && <p className="term-form-year">{term.academicYear?.name || 'Academic year'}</p>}
        <form className="user-form" onSubmit={submit}>
          {!editing && (
            <label className="field-label">
              Academic year
              <select className="text-input" name="academicYearId" value={form.academicYearId} onChange={updateField} required>
                <option value="">Select an academic year</option>
                {academicYears.map((year) => <option value={year.id} key={year.id}>{year.name}</option>)}
              </select>
            </label>
          )}
          <div className="user-name-grid">
            <label className="field-label">
              Term name
              <input className="text-input" name="name" maxLength={50} value={form.name} onChange={updateField} placeholder="e.g. Term 1" required disabled={locked} />
            </label>
            <label className="field-label">
              Sequence
              <select className="text-input" name="sequence" value={form.sequence} onChange={updateField} required disabled={locked}>
                <option value="">Select sequence</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </label>
          </div>
          <div className="user-name-grid">
            <label className="field-label">
              Start date
              <input className="text-input" type="date" name="startDate" value={form.startDate} onChange={updateField} required disabled={locked} />
            </label>
            <label className="field-label">
              End date
              <input className="text-input" type="date" name="endDate" value={form.endDate} onChange={updateField} required disabled={locked} />
            </label>
          </div>
          <label className="field-label">
            Annual result weight (%) <span className="optional-label">Optional</span>
            <input className="text-input" type="number" name="annualWeightPercent" min="0" max="100" step="0.01" value={form.annualWeightPercent} onChange={updateField} disabled={locked} />
            <span className="field-hint">A value from 0 to 100. Leave blank if no annual weight is set.</span>
          </label>
          {locked && <p className="form-hint">This term is finalized, published, or closed. Its details cannot be edited.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || (!editing && academicYears.length === 0) || locked}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add term'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
