import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Save, UserRoundCog, X } from 'lucide-react';
import { fetchFormTutorAssignments, formatAssignmentClass, saveFormTutorAssignment, teacherDisplayName } from './teachingAssignmentApi.js';

export default function FormTutorAssignmentsModal({ teachers, terms, signOut, onNotice, onClose }) {
  const [academicYearId, setAcademicYearId] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState('');
  const [error, setError] = useState('');
  const years = useMemo(() => [...new Map(terms.filter((term) => term.academicYear).map((term) => [term.academicYear.id, term.academicYear])).values()].sort((a, b) => b.name.localeCompare(a.name)), [terms]);
  const availableTeachers = teachers.filter((teacher) => teacher.user?.status === 'ACTIVE' && ['TEACHER', 'FORM_TUTOR', 'SCHOOL_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(teacher.user?.role));

  useEffect(() => {
    if (!academicYearId && years.length) {
      const currentYear = years.find((year) => year.isCurrent);
      setAcademicYearId(currentYear?.id || years[0].id);
    }
  }, [academicYearId, years]);

  useEffect(() => {
    let cancelled = false;
    if (!academicYearId) {
      setGroups([]);
      return undefined;
    }
    setLoading(true);
    setError('');
    fetchFormTutorAssignments(academicYearId)
      .then((result) => {
        if (cancelled) return;
        const rows = result.data || [];
        setGroups(rows);
        setSelectedTeachers(Object.fromEntries(rows.map((group) => [group.id, group.formTutorAssignments?.[0]?.teacherId || ''])));
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [academicYearId, signOut]);

  async function save(group) {
    setSavingGroupId(group.id);
    setError('');
    try {
      const teacherId = selectedTeachers[group.id] || null;
      const result = await saveFormTutorAssignment({ academicYearId, classGroupId: group.id, teacherId });
      setGroups((current) => current.map((item) => item.id === group.id ? {
        ...item,
        formTutorAssignments: teacherId ? [{ teacherId, teacher: availableTeachers.find((teacher) => teacher.id === teacherId) }] : []
      } : item));
      const emailNotice = result.notificationEmailSent === true
        ? ' Notification email sent.'
        : result.notificationEmailSent === false
          ? ' Notification email could not be sent.'
          : '';
      onNotice({ message: `${teacherId ? 'Form tutor assignment saved.' : 'Form tutor assignment removed.'}${emailNotice}`, error: false });
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSavingGroupId('');
    }
  }

  return (
    <div className="modal-backdrop form-tutor-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingGroupId) onClose(); }}>
    <section className="user-modal form-tutor-modal" role="dialog" aria-modal="true" aria-labelledby="form-tutor-modal-title">
      <div className="form-tutor-heading">
        <div><span className="form-tutor-icon"><UserRoundCog size={18} /></span><div><h2 id="form-tutor-modal-title">Form tutor assignments</h2><p>Assign or reassign the teacher responsible for daily class attendance.</p></div></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close form tutor assignments"><X size={18} /></button>
      </div>
      <div className="form-tutor-year">
        <label className="field-label">Academic year
          <select className="filter-select" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} disabled={!years.length}>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </label>
      </div>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {loading ? <div className="table-message"><LoaderCircle size={18} className="animate-spin" /> Loading form tutor assignments…</div>
        : !groups.length ? <div className="table-message">Create class groups before assigning form tutors.</div>
          : <div className="form-tutor-list">{groups.map((group) => {
            const assignedTeacher = group.formTutorAssignments?.[0]?.teacher;
            const changed = (selectedTeachers[group.id] || '') !== (group.formTutorAssignments?.[0]?.teacherId || '');
            return <div className="form-tutor-row" key={group.id}>
              <div><strong>{formatAssignmentClass(group)}</strong><span>{assignedTeacher ? `Current form tutor: ${teacherDisplayName(assignedTeacher)}` : 'No form tutor assigned'}</span></div>
              <select className="filter-select" value={selectedTeachers[group.id] || ''} onChange={(event) => setSelectedTeachers((current) => ({ ...current, [group.id]: event.target.value }))} aria-label={`Form tutor for ${formatAssignmentClass(group)}`}>
                <option value="">Unassigned</option>
                {assignedTeacher && !availableTeachers.some((teacher) => teacher.id === assignedTeacher.id) && <option value={assignedTeacher.id}>{teacherDisplayName(assignedTeacher)} · current assignment</option>}
                {availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacherDisplayName(teacher)}{teacher.staffNumber ? ` · ${teacher.staffNumber}` : ''}</option>)}
              </select>
              <button className="secondary-button" type="button" disabled={!changed || savingGroupId === group.id} onClick={() => save(group)}>
                {savingGroupId === group.id ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                {assignedTeacher ? 'Save change' : 'Assign tutor'}
              </button>
            </div>;
          })}</div>}
    </section></div>
  );
}
