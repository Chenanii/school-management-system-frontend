import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import FormFeedback from '../../components/FormFeedback.jsx';

export default function ClassSubjectFormModal({ classLevels, subjects, signOut, onClose, onSaved }) {
  const [classLevelId, setClassLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableSubjects = useMemo(() => {
    if (!classLevelId) return subjects;
    return subjects.filter((subject) =>
      !subject.classLinks?.some((link) => link.classLevelId === classLevelId)
    );
  }, [classLevelId, subjects]);

  useEffect(() => {
    if (subjectId && !availableSubjects.some((subject) => subject.id === subjectId)) {
      setSubjectId('');
    }
  }, [availableSubjects, subjectId]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiRequest('/class-subjects', {
        method: 'POST',
        body: JSON.stringify({ classLevelId, subjectId, isRequired })
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="class-subject-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Curriculum setup</p>
            <h2 id="class-subject-form-title">Link a subject</h2>
            <p>Choose a class level and an active subject to add it to the curriculum.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Class level
            <select className="text-input" value={classLevelId} onChange={(event) => setClassLevelId(event.target.value)} required>
              <option value="">Select a class level</option>
              {classLevels.map((level) => <option value={level.id} key={level.id}>{level.levelOrder}. {level.name}</option>)}
            </select>
          </label>
          <label className="field-label">
            Active subject
            <select className="text-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required disabled={!classLevelId}>
              <option value="">{!classLevelId ? 'Select a class level first' : 'Select a subject'}</option>
              {availableSubjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.code} - {subject.name}</option>)}
            </select>
            {classLevelId && availableSubjects.length === 0 && (
              <span className="field-hint">Every active subject is already linked to this class level.</span>
            )}
          </label>
          <label className="field-label">
            Requirement
            <select className="text-input" value={isRequired ? 'required' : 'optional'} onChange={(event) => setIsRequired(event.target.value === 'required')}>
              <option value="required">Required for every student</option>
              <option value="optional">Optional - students are assigned individually</option>
            </select>
            <span className="field-hint">Optional subjects only appear on a student’s report after they are assigned to that subject stream.</span>
          </label>
          {error && <FormFeedback message={error} />}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || !classLevelId || !subjectId}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Adding…' : 'Add to curriculum'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
