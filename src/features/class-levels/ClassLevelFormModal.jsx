import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';

export default function ClassLevelFormModal({ level, levels, signOut, onClose, onSaved }) {
  const editing = Boolean(level);
  const [form, setForm] = useState({ name: '', levelOrder: '', nextLevelId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(level ? {
      name: level.name || '',
      levelOrder: String(level.levelOrder),
      nextLevelId: level.nextLevelId || level.nextLevel?.id || ''
    } : { name: '', levelOrder: '', nextLevelId: '' });
  }, [level]);

  const availableNextLevels = useMemo(() => {
    const currentOrder = Number(form.levelOrder);
    return levels.filter((candidate) =>
      candidate.id !== level?.id
      && Number.isInteger(currentOrder)
      && candidate.levelOrder > currentOrder
    );
  }, [form.levelOrder, level?.id, levels]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name !== 'levelOrder') return { ...current, [name]: value };
      const nextOrder = Number(value);
      const selectedNext = levels.find((candidate) => candidate.id === current.nextLevelId);
      return {
        ...current,
        levelOrder: value,
        ...(selectedNext && selectedNext.levelOrder <= nextOrder ? { nextLevelId: '' } : {})
      };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      name: form.name.trim(),
      levelOrder: Number(form.levelOrder),
      nextLevelId: form.nextLevelId || null
    };

    try {
      await apiRequest(editing ? `/class-levels/${level.id}` : '/class-levels', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(body)
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="class-level-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Class structure' : 'New class level'}</p>
            <h2 id="class-level-form-title">{editing ? 'Edit class level' : 'Add a class level'}</h2>
            <p>{editing ? 'Update its display name, progression order, or next level.' : 'Define the level and where learners progress next.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Class level name
            <input className="text-input" name="name" value={form.name} onChange={updateField} maxLength={50} placeholder="e.g. Form 1" required />
          </label>
          <label className="field-label">
            Progression order
            <input className="text-input" name="levelOrder" type="number" value={form.levelOrder} onChange={updateField} min="1" max="100" step="1" required />
            <span className="field-hint">Use a unique whole number from 1 to 100. Learners progress to a higher order.</span>
          </label>
          <label className="field-label">
            Next class level <span className="optional-label">Optional</span>
            <select className="text-input" name="nextLevelId" value={form.nextLevelId} onChange={updateField}>
              <option value="">No next level assigned</option>
              {availableNextLevels.map((candidate) => (
                <option value={candidate.id} key={candidate.id}>{candidate.levelOrder}. {candidate.name}</option>
              ))}
            </select>
            <span className="field-hint">Only levels with a higher progression order can be selected.</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add class level'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
