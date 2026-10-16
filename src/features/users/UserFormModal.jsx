import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { userRoles } from './userRoles.js';

const blankForm = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'TEACHER',
  status: 'ACTIVE',
  staffNumber: '',
  password: ''
};

export default function UserFormModal({ user, onClose, onSaved }) {
  const editing = Boolean(user);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const teacherRole = form.role === 'TEACHER' || form.role === 'FORM_TUTOR';

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'TEACHER',
        status: user.status || 'ACTIVE',
        staffNumber: user.teacher?.staffNumber || '',
        password: ''
      });
    } else {
      setForm(blankForm);
    }
  }, [user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const payload = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role
    };
    if (editing) {
      payload.status = form.status;
      if (teacherRole) payload.staffNumber = form.staffNumber.trim() || null;
    } else {
      payload.password = form.password;
      if (teacherRole && form.staffNumber.trim()) payload.staffNumber = form.staffNumber.trim();
    }

    try {
      await apiRequest(editing ? `/users/${user.id}` : '/users', {
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Update account' : 'New account'}</p>
            <h2 id="user-form-title">{editing ? 'Edit user' : 'Add a user'}</h2>
            <p>{editing ? 'Update this staff account’s details and access.' : 'Create a login for a member of your school staff.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="user-name-grid">
            <label className="field-label">
              First name
              <input className="text-input" name="firstName" autoComplete="given-name" maxLength={80} value={form.firstName} onChange={updateField} required />
            </label>
            <label className="field-label">
              Last name
              <input className="text-input" name="lastName" autoComplete="family-name" maxLength={80} value={form.lastName} onChange={updateField} required />
            </label>
          </div>
          <label className="field-label">
            Email address
            <input className="text-input" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
          </label>
          <div className="user-name-grid">
            <label className="field-label">
              Role
              <select className="text-input" name="role" value={form.role} onChange={updateField} required>
                {userRoles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {editing ? (
              <label className="field-label">
                Account status
                <select className="text-input" name="status" value={form.status} onChange={updateField}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            ) : (
              <label className="field-label">
                Staff number <span className="optional-label">Optional</span>
                <input className="text-input" name="staffNumber" maxLength={30} value={form.staffNumber} onChange={updateField} disabled={!teacherRole} />
              </label>
            )}
          </div>
          {editing && teacherRole && (
            <label className="field-label">
              Staff number <span className="optional-label">Optional</span>
              <input className="text-input" name="staffNumber" maxLength={30} value={form.staffNumber} onChange={updateField} />
            </label>
          )}
          {!editing && (
            <label className="field-label">
              Temporary password
              <input className="text-input" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" value={form.password} onChange={updateField} required />
              <span className="field-hint">Share this temporary password securely with the user.</span>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
