import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { saveAssignment, teacherDisplayName } from './teachingAssignmentApi.js';

const OPEN_STATUSES = ['DRAFT', 'OPEN'];

function initialForm(assignment) {
  return {
    assignmentType: assignment?.classGroupId ? 'CLASS' : 'STREAM',
    teacherId: assignment?.teacherId || '',
    academicYearId: assignment?.term?.academicYearId || '',
    classLevelId: assignment?.subjectStream?.classLevelId || assignment?.classGroup?.classLevelId || '',
    subjectId: assignment?.subjectId || assignment?.subject?.id || '',
    classGroupId: assignment?.classGroupId || '',
    streamName: assignment?.subjectStream?.name || 'A',
    effectiveFromTermId: assignment?.termId || ''
  };
}

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

  const [form, setForm] = useState(() => initialForm(assignment));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm(assignment));
    setError('');
  }, [assignment]);

  const isClass = form.assignmentType === 'CLASS';

  const classLevels = useMemo(
    () => [...new Map(classGroups.map((group) => [group.classLevelId, group.classLevel])).values()]
      .filter(Boolean)
      .sort((left, right) => left.levelOrder - right.levelOrder),
    [classGroups]
  );

  const academicYears = useMemo(
    () => [...new Map(terms
      .filter((term) => term.academicYear)
      .map((term) => [term.academicYear.id, term.academicYear])).values()]
      .sort((left, right) => right.name.localeCompare(left.name)),
    [terms]
  );

  const selectedLevel = classLevels.find((level) => level.id === form.classLevelId);

  const selectedYearTerms = useMemo(
    () => terms
      .filter((term) => term.academicYearId === form.academicYearId)
      .sort((left, right) => left.sequence - right.sequence),
    [terms, form.academicYearId]
  );

  const selectedClassSubject = classSubjects.find((link) =>
    link.classLevelId === form.classLevelId && link.subjectId === form.subjectId
  );

  const levelClassGroups = useMemo(
    () => classGroups
      .filter((group) => group.classLevelId === form.classLevelId)
      .filter((group) => !group.academicYearId || !form.academicYearId || group.academicYearId === form.academicYearId)
      .sort((left, right) => left.name.localeCompare(right.name)),
    [classGroups, form.classLevelId, form.academicYearId]
  );

  const matchingSubjects = useMemo(() => {
    const linkedSubjectIds = new Set(classSubjects.map((link) => link.subjectId));
    const subjectsForLevel = new Set(
      classSubjects
        .filter((link) => link.classLevelId === selectedLevel?.id)
        .map((link) => link.subjectId)
    );
    return subjects
      .filter((subject) =>
        subject.status === 'ACTIVE'
        && (!linkedSubjectIds.has(subject.id) || subjectsForLevel.has(subject.id))
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [classSubjects, selectedLevel?.id, subjects]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'assignmentType' ? { classGroupId: '', streamName: 'A' } : {}),
      ...(name === 'classLevelId' ? { classGroupId: '', subjectId: '', streamName: 'A' } : {}),
      ...(name === 'subjectId' ? { classGroupId: '', streamName: 'A' } : {}),
      ...(name === 'academicYearId' ? { classGroupId: '' } : {})
    }));
  }

  function buildPayload() {
    const payload = {
      assignmentType: form.assignmentType,
      teacherId: form.teacherId,
      classLevelId: form.classLevelId,
      subjectId: form.subjectId,
      academicYearId: form.academicYearId
    };

    if (isClass) payload.classGroupId = form.classGroupId;
    else payload.streamName = form.streamName.trim();

    // Only meaningful when editing; never send it on create.
    if (editing && form.effectiveFromTermId) payload.effectiveFromTermId = form.effectiveFromTermId;

    return payload;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveAssignment(assignment?.id, buildPayload());
      onSaved();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving
    && teachers.length > 0
    && classLevels.length > 0
    && academicYears.length > 0
    && (isClass ? Boolean(form.classGroupId) : Boolean(form.streamName.trim()));

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="teaching-assignment-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Teaching allocation' : 'New teaching allocation'}</p>
            <h2 id="teaching-assignment-form-title">{editing ? 'Edit assignment' : 'Assign a teacher'}</h2>
            <p>
              {editing
                ? 'A teacher change takes effect from the selected term onward; earlier terms keep their existing teacher.'
                : 'Assign a teacher once for all three terms in the selected academic year.'}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>

        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Assignment type
            <select
              className="text-input"
              name="assignmentType"
              value={form.assignmentType}
              onChange={updateField}
              disabled={hasAssessments}
            >
              <option value="CLASS">Class group: one teacher for a whole class</option>
              <option value="STREAM">Subject stream: a section made up of selected students</option>
            </select>
            <span className="field-hint">
              {isClass
                ? 'The teacher teaches this subject to every student in the chosen class group.'
                : 'Students keep their home class group and join the stream individually, or automatically for required subjects.'}
            </span>
          </label>

          <label className="field-label">
            Teacher
            <select className="text-input" name="teacherId" value={form.teacherId} onChange={updateField} required>
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacherDisplayName(teacher)} · {teacher.staffNumber || teacher.email}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Academic year
            <select
              className="text-input"
              name="academicYearId"
              value={form.academicYearId}
              onChange={updateField}
              required
              disabled={editing || hasAssessments}
            >
              <option value="">Select an academic year</option>
              {academicYears.map((year) => <option value={year.id} key={year.id}>{year.name}</option>)}
            </select>
          </label>

          <label className="field-label">
            Class level
            <select
              className="text-input"
              name="classLevelId"
              value={form.classLevelId}
              onChange={updateField}
              required
              disabled={hasAssessments}
            >
              <option value="">Select a class level</option>
              {classLevels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
            </select>
          </label>

          <label className="field-label">
            Subject
            <select
              className="text-input"
              name="subjectId"
              value={form.subjectId}
              onChange={updateField}
              required
              disabled={!selectedLevel || hasAssessments}
            >
              <option value="">{selectedLevel ? 'Select a subject' : 'Select a class level first'}</option>
              {matchingSubjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.code} · {subject.name}{subject._count?.classLinks === 0 ? ' · Standalone' : ''}
                </option>
              ))}
            </select>
            {!selectedLevel && !hasAssessments && (
              <span className="field-hint">Choose a class level to see subjects available at that level.</span>
            )}
            {selectedLevel && matchingSubjects.length === 0 && (
              <span className="field-hint">There are no active standalone or class-linked subjects available.</span>
            )}
          </label>

          {form.subjectId && isClass && (
            <label className="field-label">
              Class group
              <select
                className="text-input"
                name="classGroupId"
                value={form.classGroupId}
                onChange={updateField}
                required
                disabled={hasAssessments}
              >
                <option value="">{levelClassGroups.length ? 'Select a class group' : 'No class groups for this level'}</option>
                {levelClassGroups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
              </select>
            </label>
          )}

          {form.subjectId && !isClass && (
            <label className="field-label">
              Subject stream section
              <input
                className="text-input"
                name="streamName"
                value={form.streamName}
                onChange={updateField}
                placeholder="A, B, C"
                maxLength={30}
                required
                disabled={hasAssessments}
              />
              <span className="field-hint">
                {selectedClassSubject?.isRequired
                  ? 'Required subjects use one teaching stream for the class level; every active student is included automatically.'
                  : 'Students keep their home class group and are assigned individually to optional subject streams.'}
              </span>
            </label>
          )}

          {editing && (
            <label className="field-label">
              Teacher change effective from
              <select
                className="text-input"
                name="effectiveFromTermId"
                value={form.effectiveFromTermId}
                onChange={updateField}
                required
              >
                <option value="">Select a term</option>
                {selectedYearTerms.map((term) => {
                  const open = OPEN_STATUSES.includes(term.status);
                  return (
                    <option value={term.id} key={term.id} disabled={!open}>
                      {term.sequence}. {term.name}{open ? '' : ' · Not open for reassignment'}
                    </option>
                  );
                })}
              </select>
              <span className="field-hint">
                The incoming teacher can continue existing assessments and results from this term onward. Earlier terms remain assigned to the previous teacher.
              </span>
            </label>
          )}

          {hasAssessments && (
            <p className="form-hint">
              Type, class level, subject, and class group or stream are locked because this academic year has assessments. You can still reassign the teacher from a selected term onward.
            </p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={!canSubmit}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create assignment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
