import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { subjectStatuses } from './subjectApi.js';
import FormFeedback from '../../components/FormFeedback.jsx';

export default function SubjectFormModal({ subject, signOut, onClose, onSaved }) {
  const editing = Boolean(subject);
  const [form, setForm] = useState({ code: '', name: '', status: 'ACTIVE' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(subject ? {
      code: subject.code || '',
      name: subject.name || '',
      status: subject.status || 'ACTIVE'
    } : { code: '', name: '', status: 'ACTIVE' });
  }, [subject]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiRequest(editing ? `/subjects/${subject.id}` : '/subjects', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          ...(!editing || form.status !== subject.status ? { status: form.status } : {})
        })
      });
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Subject catalogue' : 'New subject'}</p>
            <h2 id="subject-form-title">{editing ? 'Edit subject' : 'Add a subject'}</h2>
            <p>{editing ? 'Update the subject code, name, or availability.' : 'Create a subject to include in your school curriculum.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Subject code
            <input
              className="text-input subject-code-input"
              name="code"
              value={form.code}
              onChange={updateField}
              maxLength={20}
              autoComplete="off"
              placeholder="e.g. MAT"
              required
            />
            <span className="field-hint">Codes are saved in uppercase.</span>
          </label>
          <label className="field-label">
            Subject name
            <input className="text-input" name="name" value={form.name} onChange={updateField} maxLength={100} placeholder="e.g. Mathematics" required />
          </label>
          {editing && (
            <label className="field-label">
              Status
              <select className="text-input" name="status" value={form.status} onChange={updateField}>
                {subjectStatuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
              </select>
            </label>
          )}
          {error && <FormFeedback message={error} />}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add subject'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
