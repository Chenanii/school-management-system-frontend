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
  staffNumber: ''
};

export default function UserFormModal({ user, superAdminMode = false, onClose, onSaved }) {
  const editing = Boolean(user);
  const [form, setForm] = useState(() => ({ ...blankForm, role: superAdminMode ? 'SUPER_ADMIN' : blankForm.role }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const teacherRole = form.role === 'TEACHER' || form.role === 'FORM_TUTOR';
  const parentAccount = user?.role === 'PARENT';

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'TEACHER',
        status: user.status || 'ACTIVE',
        staffNumber: user.teacher?.staffNumber || '',
      });
    } else {
      setForm({ ...blankForm, role: superAdminMode ? 'SUPER_ADMIN' : blankForm.role });
    }
  }, [user, superAdminMode]);

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
      role: superAdminMode ? 'SUPER_ADMIN' : form.role
    };
    if (editing) {
      payload.status = form.status;
      if (teacherRole) payload.staffNumber = form.staffNumber.trim() || null;
    } else {
      if (teacherRole && form.staffNumber.trim()) payload.staffNumber = form.staffNumber.trim();
    }

    try {
      const endpoint = editing ? `/users/${user.id}` : superAdminMode ? '/users/super-admins' : '/users';
      const result = await apiRequest(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      onSaved(result);
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
            <p className="eyebrow">{editing ? 'Update account' : 'User onboarding'}</p>
            <h2 id="user-form-title">{editing ? 'Edit user' : superAdminMode ? 'Add a super admin' : 'Add a user'}</h2>
            <p>{editing ? 'Update this user account’s details and access.' : 'An invitation email will let the user set their own password.'}</p>
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
            <input className="text-input" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required disabled={parentAccount} />
            {parentAccount && <span className="field-hint">Parent email addresses must be changed through verified account setup.</span>}
          </label>
          <div className="user-name-grid">
            <label className="field-label">
              Role
              {superAdminMode ? <input className="text-input" value="Super admin" readOnly aria-label="Role" /> : <select className="text-input" name="role" value={form.role} onChange={updateField} required disabled={parentAccount}>
                {parentAccount && <option value="PARENT">Parent</option>}
                {userRoles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>}
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
          {!editing && <p className="field-hint">The account stays inactive until the user follows the one-time email link and chooses a password.</p>}
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
