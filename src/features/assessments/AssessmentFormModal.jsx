import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { assessmentAssignmentLabel, assessmentTypes, saveAssessment } from './assessmentApi.js';
import AssessmentPopup from './AssessmentPopup.jsx';

function termContextLabel(term) {
  if (!term) return 'Term information unavailable';
  const year = term.academicYear?.name || 'Academic year unavailable';
  return `${term.name} · ${year}`;
}

export default function AssessmentFormModal({ assessment, assignments, terms, signOut, onClose, onSaved }) {
  const editing = Boolean(assessment);
  const [form, setForm] = useState({
    title: assessment?.title || '',
    assessmentType: assessment?.assessmentType || 'COURSEWORK',
    assessmentDate: assessment?.assessmentDate ? new Date(assessment.assessmentDate).toISOString().slice(0, 10) : '',
    teachingAssignmentId: assessment?.teachingAssignmentId || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedAssignment = assignments.find((item) => item.id === form.teachingAssignmentId);
  const selectedTerm = terms.find((item) => item.id === (selectedAssignment?.termId || assessment?.termId));
  const canCreateForSelectedTerm = !selectedTerm || ['DRAFT', 'OPEN'].includes(selectedTerm.status);
  const canEdit = !editing || ['DRAFT', 'OPEN'].includes(assessment.status) && (assessment._count?.results ?? 0) === 0;
  const isExam = ['MID_TERM_EXAM', 'FINAL_EXAM'].includes(form.assessmentType);
  const canSetExamDateOnly = Boolean(editing && isExam && !assessment.assessmentDate && ['DRAFT', 'OPEN'].includes(assessment.status));

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const payload = canSetExamDateOnly ? { assessmentDate: form.assessmentDate } : {
      title: form.title.trim(),
      assessmentType: form.assessmentType
    };
    if (!canSetExamDateOnly && isExam) payload.assessmentDate = form.assessmentDate;
    else if (!canSetExamDateOnly && editing && assessment.assessmentDate) payload.assessmentDate = null;
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
      <AssessmentPopup message={error || (!canCreateForSelectedTerm && !editing ? 'The selected teaching assignment belongs to a term that does not accept new assessments.' : '')} onDismiss={() => setError('')} />
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Assessment setup' : 'New assessment'}</p>
            <h2 id="assessment-form-title">{editing ? 'Edit assessment' : 'Create an assessment'}</h2>
            <p>{editing ? 'Draft or open assessments without saved results can be edited.' : 'Choose a teaching assignment to set the class, subject, and term. Marks are entered out of 100.'}</p>
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
                    {assessmentAssignmentLabel(assignment)} · {termContextLabel(assignment.term)}
                  </option>
                ))}
              </select>
              {selectedAssignment && <span className="field-hint">Selected term: {termContextLabel(selectedAssignment.term)}</span>}
              {assignments.length === 0 && <span className="field-hint">No teaching assignments are available for the current term.</span>}
            </label>
          )}
          <label className="field-label">
            Assessment type
            <select className="text-input" name="assessmentType" value={form.assessmentType} onChange={updateField} required disabled={!canEdit}>
              {assessmentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {isExam && <label className="field-label">
            Exam date
            <input className="text-input" type="date" name="assessmentDate" value={form.assessmentDate} onChange={updateField} required disabled={!canEdit && !canSetExamDateOnly} />
            <span className="field-hint">Only students marked present in class attendance on this date can receive a result.</span>
          </label>}
          {!canEdit && <p className="form-hint">This assessment cannot be edited after submission or after results have been recorded.</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || (!canEdit && !canSetExamDateOnly) || (isExam && !form.assessmentDate) || (!editing && (!selectedAssignment || !canCreateForSelectedTerm))}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create assessment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
