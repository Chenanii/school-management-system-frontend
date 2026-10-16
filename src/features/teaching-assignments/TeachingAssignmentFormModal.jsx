import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { formatAssignmentClass, saveAssignment, teacherDisplayName } from './teachingAssignmentApi.js';

export default function TeachingAssignmentFormModal({
  assignment,
  teachers,
  classGroups,
  classSubjects,
  subjects,
  terms,
  signOut,
  onClose,
  onSaved
}) {
  const editing = Boolean(assignment);
  const hasAssessments = (assignment?._count?.assessments ?? 0) > 0;
  const [form, setForm] = useState({
    teacherId: assignment?.teacherId || '',
    classGroupId: assignment?.classGroupId || '',
    subjectId: assignment?.subjectId || assignment?.subject?.id || '',
    termId: assignment?.termId || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      teacherId: assignment?.teacherId || '',
      classGroupId: assignment?.classGroupId || '',
      subjectId: assignment?.subjectId || assignment?.subject?.id || '',
      termId: assignment?.termId || ''
    });
  }, [assignment]);

  const selectedGroup = classGroups.find((group) => group.id === form.classGroupId);
  const matchingSubjects = useMemo(() => {
    const linkedSubjectIds = new Set(classSubjects.map((link) => link.subjectId));
    const subjectsForLevel = new Set(
      classSubjects
        .filter((link) => link.classLevelId === selectedGroup?.classLevelId)
        .map((link) => link.subjectId)
    );
    return subjects.filter((subject) =>
      subject.status === 'ACTIVE'
      && (!linkedSubjectIds.has(subject.id) || subjectsForLevel.has(subject.id))
    ).sort((left, right) => left.name.localeCompare(right.name));
  }, [classSubjects, selectedGroup?.classLevelId, subjects]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'classGroupId' ? { subjectId: '' } : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveAssignment(assignment?.id, form);
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
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="teaching-assignment-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Teaching allocation' : 'New teaching allocation'}</p>
            <h2 id="teaching-assignment-form-title">{editing ? 'Edit assignment' : 'Assign a teacher'}</h2>
            <p>{editing ? 'Update the teacher or assignment scope for this term.' : 'Connect a teacher to a class group, subject, and term. Standalone subjects are available for every class group.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Teacher
            <select className="text-input" name="teacherId" value={form.teacherId} onChange={updateField} required>
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option value={teacher.id} key={teacher.id}>{teacherDisplayName(teacher)} · {teacher.staffNumber || teacher.email}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Class group
            <select className="text-input" name="classGroupId" value={form.classGroupId} onChange={updateField} required disabled={hasAssessments}>
              <option value="">Select a class group</option>
              {classGroups.map((group) => <option value={group.id} key={group.id}>{formatAssignmentClass(group)}</option>)}
            </select>
          </label>
          <label className="field-label">
            Subject
            <select className="text-input" name="subjectId" value={form.subjectId} onChange={updateField} required disabled={!selectedGroup || hasAssessments}>
              <option value="">{selectedGroup ? 'Select a subject' : 'Select a class group first'}</option>
              {matchingSubjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.code} · {subject.name}{subject._count?.classLinks === 0 ? ' · Standalone' : ''}
                </option>
              ))}
            </select>
            {!selectedGroup && !hasAssessments && <span className="field-hint">Choose a class group to see standalone subjects and subjects linked to that class level.</span>}
            {selectedGroup && matchingSubjects.length === 0 && <span className="field-hint">There are no active standalone or class-linked subjects available.</span>}
          </label>
          <label className="field-label">
            Term
            <select className="text-input" name="termId" value={form.termId} onChange={updateField} required disabled={hasAssessments}>
              <option value="">Select a term</option>
              {terms.map((term) => (
                <option value={term.id} key={term.id}>{term.academicYear?.name || 'Academic year'} · {term.sequence}. {term.name}</option>
              ))}
            </select>
          </label>
          {hasAssessments && <p className="form-hint">Class group, subject, and term are locked because assessments exist. You can still change the assigned teacher.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || teachers.length === 0 || classGroups.length === 0 || terms.length === 0}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create assignment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
