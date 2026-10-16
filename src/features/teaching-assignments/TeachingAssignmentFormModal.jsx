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
  const classLevels = [...new Map(classGroups.map((group) => [group.classLevelId, group.classLevel])).values()]
    .filter(Boolean).sort((left, right) => left.levelOrder - right.levelOrder);
  const [form, setForm] = useState({
    teacherId: assignment?.teacherId || '',
    classLevelId: assignment?.subjectStream?.classLevelId || assignment?.classGroup?.classLevelId || '',
    classGroupId: assignment?.classGroupId || '',
    subjectId: assignment?.subjectId || assignment?.subject?.id || '',
    termId: assignment?.termId || '',
    streamName: assignment?.subjectStream?.name || 'A'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      teacherId: assignment?.teacherId || '',
      classLevelId: assignment?.subjectStream?.classLevelId || assignment?.classGroup?.classLevelId || '',
      classGroupId: assignment?.classGroupId || '',
      subjectId: assignment?.subjectId || assignment?.subject?.id || '',
      termId: assignment?.termId || '',
      streamName: assignment?.subjectStream?.name || 'A'
    });
  }, [assignment]);

  const selectedLevel = classLevels.find((level) => level.id === form.classLevelId);
  const selectedClassSubject = classSubjects.find((link) =>
    link.classLevelId === form.classLevelId && link.subjectId === form.subjectId
  );
  const matchingSubjects = useMemo(() => {
    const linkedSubjectIds = new Set(classSubjects.map((link) => link.subjectId));
    const subjectsForLevel = new Set(
      classSubjects
        .filter((link) => link.classLevelId === selectedLevel?.id)
        .map((link) => link.subjectId)
    );
    return subjects.filter((subject) =>
      subject.status === 'ACTIVE'
      && (!linkedSubjectIds.has(subject.id) || subjectsForLevel.has(subject.id))
    ).sort((left, right) => left.name.localeCompare(right.name));
  }, [classSubjects, selectedLevel?.id, subjects]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'classLevelId' ? { classGroupId: '', subjectId: '', streamName: 'A' } : {}),
      ...(name === 'subjectId' ? { classGroupId: '', streamName: 'A' } : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.classGroupId;
      await saveAssignment(assignment?.id, payload);
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
            <p>{editing ? 'Update the teacher or assignment scope for this term.' : 'Assign a teacher to a class subject or a named subject section for this class level and term.'}</p>
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
            Class level
            <select className="text-input" name="classLevelId" value={form.classLevelId} onChange={updateField} required disabled={hasAssessments}>
              <option value="">Select a class level</option>
              {classLevels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
            </select>
          </label>
          <label className="field-label">
            Subject / stream
            <select className="text-input" name="subjectId" value={form.subjectId} onChange={updateField} required disabled={!selectedLevel || hasAssessments}>
              <option value="">{selectedLevel ? 'Select a subject' : 'Select a class level first'}</option>
              {matchingSubjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.code} · {subject.name}{subject._count?.classLinks === 0 ? ' · Standalone' : ''}
                </option>
              ))}
            </select>
            {!selectedLevel && !hasAssessments && <span className="field-hint">Choose a class level to see subjects available at that level.</span>}
            {selectedLevel && matchingSubjects.length === 0 && <span className="field-hint">There are no active standalone or class-linked subjects available.</span>}
          </label>
          {form.subjectId && <label className="field-label">
            Subject stream section
            <input className="text-input" name="streamName" value={form.streamName} onChange={updateField} placeholder="A, B, C" maxLength={30} required disabled={hasAssessments} />
            <span className="field-hint">{selectedClassSubject?.isRequired
              ? 'Required subjects use one teaching stream for the class level; every active student is included automatically.'
              : 'Students keep their home class group and are assigned individually to optional subject streams.'}</span>
          </label>}
          <label className="field-label">
            Term
            <select className="text-input" name="termId" value={form.termId} onChange={updateField} required disabled={hasAssessments}>
              <option value="">Select a term</option>
              {terms.map((term) => (
                <option value={term.id} key={term.id}>{term.academicYear?.name || 'Academic year'} · {term.sequence}. {term.name}</option>
              ))}
            </select>
          </label>
          {hasAssessments && <p className="form-hint">Class level, subject, and term are locked because assessments exist. You can still change the assigned teacher.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || teachers.length === 0 || classLevels.length === 0 || terms.length === 0}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create assignment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
