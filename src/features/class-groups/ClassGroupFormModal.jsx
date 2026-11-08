import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { formatClassLevel } from './classGroupApi.js';
import FormFeedback from '../../components/FormFeedback.jsx';

export default function ClassGroupFormModal({ group, classLevels, signOut, onClose, onSaved }) {
  const editing = Boolean(group);
  const hasLinkedRecords = (group?._count?.enrollments ?? 0) > 0 || (group?._count?.assignments ?? 0) > 0;
  const [form, setForm] = useState({ name: '', classLevelId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(group
      ? { name: group.name || '', classLevelId: group.classLevelId || '' }
      : { name: '', classLevelId: '' });
  }, [group]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiRequest(editing ? `/class-groups/${group.id}` : '/class-groups', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          classLevelId: form.classLevelId
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="class-group-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Class organization' : 'New class group'}</p>
            <h2 id="class-group-form-title">{editing ? 'Edit class group' : 'Add a class group'}</h2>
            <p>{editing ? 'Update the group name or its class level.' : 'Create a stream or section within a class level.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Class level
            <select className="text-input" name="classLevelId" value={form.classLevelId} onChange={updateField} required disabled={hasLinkedRecords}>
              <option value="">Select a class level</option>
              {classLevels.map((level) => (
                <option value={level.id} key={level.id}>{formatClassLevel(level)}</option>
              ))}
            </select>
            {hasLinkedRecords && <span className="field-hint">This group has enrolments or teaching assignments, so it cannot be moved to another class level.</span>}
          </label>
          <label className="field-label">
            Group name
            <input className="text-input" name="name" value={form.name} onChange={updateField} maxLength={50} placeholder="e.g. North, Blue, or A" required />
            <span className="field-hint">Group names must be unique within their class level.</span>
          </label>
          {error && <FormFeedback message={error} />}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || classLevels.length === 0}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add class group'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
