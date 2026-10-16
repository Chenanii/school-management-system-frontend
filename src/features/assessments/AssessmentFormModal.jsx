import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { assessmentAssignmentLabel, assessmentTypes, saveAssessment } from './assessmentApi.js';

export default function AssessmentFormModal({ assessment, assignments, terms, signOut, onClose, onSaved }) {
  const editing = Boolean(assessment);
  const [form, setForm] = useState({
    title: assessment?.title || '',
    assessmentType: assessment?.assessmentType || 'COURSEWORK',
    maxMark: assessment?.maxMark?.toString() || '',
    weightPercent: assessment?.weightPercent?.toString() || '',
    teachingAssignmentId: assessment?.teachingAssignmentId || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedAssignment = assignments.find((item) => item.id === form.teachingAssignmentId);
  const selectedTerm = terms.find((item) => item.id === (selectedAssignment?.termId || assessment?.termId));
  const canCreateForSelectedTerm = !selectedTerm || ['DRAFT', 'OPEN'].includes(selectedTerm.status);
  const canEdit = !editing || assessment.status === 'DRAFT' && (assessment._count?.results ?? 0) === 0;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'assessmentType' ? {
        weightPercent: value === 'FINAL_EXAM' ? '60' : current.assessmentType === 'FINAL_EXAM' ? '40' : current.weightPercent
      } : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      assessmentType: form.assessmentType,
      maxMark: Number(form.maxMark),
      weightPercent: form.assessmentType === 'FINAL_EXAM' ? 60 : Number(form.weightPercent)
    };
    if (!editing) {
      payload.teachingAssignmentId = form.teachingAssignmentId;
      payload.termId = selectedAssignment?.termId;
    }
    try {
      await saveAssessment(assessment?.id, payload);
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Assessment setup' : 'New assessment'}</p>
            <h2 id="assessment-form-title">{editing ? 'Edit assessment' : 'Create an assessment'}</h2>
            <p>{editing ? 'Only draft assessments without results can be edited.' : 'Choose a teaching assignment to set the class, subject, and term.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {editing && (
          <p className="assessment-form-context">
            {assessment.teachingAssignment?.classGroup?.classLevel?.name} {assessment.teachingAssignment?.classGroup?.name}
            {' · '}{assessment.subject?.name}{' · '}{assessment.term?.name}
          </p>
        )}
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Assessment title
            <input className="text-input" name="title" maxLength={150} minLength={2} value={form.title} onChange={updateField} required disabled={!canEdit} placeholder="e.g. Algebra test" />
          </label>
          {!editing && (
            <label className="field-label">
              Teaching assignment
              <select className="text-input" name="teachingAssignmentId" value={form.teachingAssignmentId} onChange={updateField} required>
                <option value="">Select assignment</option>
                {assignments.map((assignment) => (
                  <option value={assignment.id} key={assignment.id}>
                    {assessmentAssignmentLabel(assignment)} · {assignment.term?.name}
                  </option>
                ))}
              </select>
              {assignments.length === 0 && <span className="field-hint">No assignments are available in terms that accept assessments.</span>}
            </label>
          )}
          <div className="user-name-grid">
            <label className="field-label">
              Assessment type
              <select className="text-input" name="assessmentType" value={form.assessmentType} onChange={updateField} required disabled={!canEdit}>
                {assessmentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="field-label">
              Maximum mark
              <input className="text-input" type="number" name="maxMark" min="0.01" max="100" step="0.01" value={form.maxMark} onChange={updateField} required disabled={!canEdit} />
            </label>
          </div>
          {form.assessmentType === 'FINAL_EXAM' ? (
            <div className="assessment-weight-fixed"><strong>Final exam contribution</strong><span>60% of the final subject result</span><small>The final exam is fixed at 60%; coursework and mid-term assessments share the remaining 40%.</small></div>
          ) : (
            <label className="field-label">
              Contribution to final mark (%)
              <input className="text-input" type="number" name="weightPercent" min="0" max="40" step="0.01" value={form.weightPercent} onChange={updateField} required disabled={!canEdit} />
              <span className="field-hint">This assessment’s share of the final subject result. Coursework and mid-term assessments together must total 40%.</span>
            </label>
          )}
          {!canCreateForSelectedTerm && !editing && <p className="form-error" role="alert">The selected teaching assignment belongs to a term that does not accept new assessments.</p>}
          {!canEdit && <p className="form-hint">This assessment cannot be edited after leaving draft status or after results have been recorded.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || !canEdit || (!editing && (!selectedAssignment || !canCreateForSelectedTerm))}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create assessment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
