import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { createTeacher, updateTeacher } from './teacherApi.js';

export default function TeacherFormModal({ teacher, onClose, onSaved }) {
  const editing = Boolean(teacher);
  const [form, setForm] = useState({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    staffNumber: teacher?.staffNumber || ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      staffNumber: form.staffNumber.trim() || null
    };
    if (!editing) {
      data.email = form.email.trim();
      if (!data.staffNumber) delete data.staffNumber;
    }

    try {
      const result = editing
        ? await updateTeacher(teacher.id, data)
        : await createTeacher(data);
      onSaved(result);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Update teacher' : 'Teacher onboarding'}</p>
            <h2 id="teacher-form-title">{editing ? 'Edit teacher' : 'Add a teacher'}</h2>
            <p>{editing ? 'Update the teacher profile and staff number.' : 'An invitation email will let the teacher set their own password.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="user-name-grid">
            <label className="field-label">
              First name
              <input className="text-input" name="firstName" autoComplete="given-name" maxLength={100} value={form.firstName} onChange={updateField} required />
            </label>
            <label className="field-label">
              Last name
              <input className="text-input" name="lastName" autoComplete="family-name" maxLength={100} value={form.lastName} onChange={updateField} required />
            </label>
          </div>
          {!editing && (
            <label className="field-label">
              Email address
              <input className="text-input" name="email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={updateField} required />
            </label>
          )}
          <label className="field-label">
            Staff number <span className="optional-label">Optional</span>
            <input className="text-input" name="staffNumber" maxLength={50} value={form.staffNumber} onChange={updateField} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create and invite'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
