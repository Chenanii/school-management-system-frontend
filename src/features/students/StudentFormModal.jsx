import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';

const blankStudent = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: ''
};

function inputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function StudentFormModal({ student, onClose, onSaved }) {
  const editing = Boolean(student);
  const [form, setForm] = useState(blankStudent);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(student ? {
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      dateOfBirth: inputDate(student.dateOfBirth),
      gender: student.gender || ''
    } : blankStudent);
  }, [student]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender.trim() || null
    };

    try {
      await apiRequest(editing ? `/students/${student.id}` : '/students', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      onSaved();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-modal student-modal" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Update student record' : 'New student'}</p>
            <h2 id="student-form-title">{editing ? 'Edit student' : 'Register a student'}</h2>
            <p>{editing ? 'Update the student’s personal details.' : 'Add a learner to your school register.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={handleSubmit}>
          {editing ? (
            <label className="field-label">
              Admission number <span className="optional-label">System-generated</span>
              <input className="text-input" value={student.admissionNumber} readOnly />
            </label>
          ) : (
            <p className="field-label">Admission number <span className="optional-label">Generated automatically after registration</span></p>
          )}
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
          <label className="field-label">
            Middle name <span className="optional-label">Optional</span>
            <input className="text-input" name="middleName" autoComplete="additional-name" maxLength={100} value={form.middleName} onChange={updateField} />
          </label>
          <div className="user-name-grid">
            <label className="field-label">
              Date of birth <span className="optional-label">Optional</span>
              <input className="text-input" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={updateField} />
            </label>
            <label className="field-label">
              Gender <span className="optional-label">Optional</span>
              <select className="text-input" name="gender" value={form.gender} onChange={updateField}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Register student'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
