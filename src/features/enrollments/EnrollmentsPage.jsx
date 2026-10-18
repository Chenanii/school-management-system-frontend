import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search, UsersRound } from 'lucide-react';
import {
  createBulkEnrollments,
  createEnrollment,
  fetchAllPages,
  fetchEnrollments,
  fetchStudentEnrollments,
  fetchStudents,
  previewBulkEnrollment,
  previewSelectedBulkEnrollment,
  createSelectedBulkEnrollments,
  updateEnrollmentStatus,
  updateEnrollmentClassGroup,
  fetchSubjectStreamRoster,
  saveSubjectStreamRoster
} from './enrollmentApi.js';

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
const enrollmentStatuses = [
  'ACTIVE', 'COMPLETED', 'PROMOTED', 'REPEATING', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED'
];
const statusLabels = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  PROMOTED: 'Promoted',
  REPEATING: 'Repeating',
  TRANSFERRED: 'Transferred',
  WITHDRAWN: 'Withdrawn',
  GRADUATED: 'Graduated'
};

function studentName(student) {
  return [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ') || 'Student';
}

function termLabel(term) {
  return `${term.academicYear?.name || 'Academic year'} · ${term.sequence}. ${term.name}`;
}

function classLabel(group) {
  return [group?.classLevel?.name, group?.name].filter(Boolean).join(' · ');
}

function SubjectStreamPanel({ terms, groups, signOut, onSaved }) {
  const [termId, setTermId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const levels = [...new Map(groups.map((group) => [group.classLevelId, group.classLevel])).values()]
    .filter(Boolean).sort((left, right) => left.levelOrder - right.levelOrder);

  useEffect(() => {
    let cancelled = false;
    setAssignments([]);
    setAssignmentId('');
    setStudents([]);
    if (!termId || !classLevelId) return undefined;
    async function loadAssignments() {
      setLoadingAssignments(true);
      setError('');
      try {
        const result = await fetchAllPages('/teaching-assignments');
        if (!cancelled) {
          const streamsById = new Map();
          result.filter((item) => item.termId === termId && item.subjectStream?.classLevelId === classLevelId && item.subjectStream && item.classSubject?.isRequired !== true)
            .forEach((item) => { if (!streamsById.has(item.subjectStreamId)) streamsById.set(item.subjectStreamId, item); });
          setAssignments([...streamsById.values()]);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    }
    loadAssignments();
    return () => { cancelled = true; };
  }, [termId, classLevelId, signOut]);

  useEffect(() => {
    let cancelled = false;
    setStudents([]);
    setSelectedIds([]);
    if (!assignmentId) return undefined;
    async function loadRoster() {
      setLoadingStudents(true);
      setError('');
      try {
        const result = await fetchSubjectStreamRoster(assignmentId);
        if (!cancelled) {
          const roster = result.data?.students || [];
          setStudents(roster);
          setSelectedIds(roster.filter((item) => item.selected).map((item) => item.enrollmentId));
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    }
    loadRoster();
    return () => { cancelled = true; };
  }, [assignmentId, signOut]);

  const visibleStudents = students.filter(({ student }) => [studentName(student), student?.admissionNumber].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  function toggleStudent(enrollmentId) {
    setSelectedIds((current) => current.includes(enrollmentId)
      ? current.filter((id) => id !== enrollmentId)
      : [...current, enrollmentId]);
  }

  function toggleVisibleStudents() {
    const visibleIds = visibleStudents.map((item) => item.enrollmentId);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  }

  async function saveRoster() {
    setSaving(true);
    setError('');
    try {
      await saveSubjectStreamRoster(assignmentId, selectedIds);
      setStudents((current) => current.map((item) => ({ ...item, selected: selectedIds.includes(item.enrollmentId) })));
      onSaved(`${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'} assigned to the subject stream.`);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  return <section className="panel enrollment-bulk-panel">
    <div className="enrollment-section-heading"><div><h2>Subject streams</h2><p>Streams are created for a class level. Select students from any class group at that level; their class group enrollment remains unchanged.</p></div></div>
    <div className="enrollment-bulk-form">
      <label className="field-label">Academic term<select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setClassLevelId(''); setAssignmentId(''); }}><option value="">Select a term</option>{terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}</select></label>
      <label className="field-label">Class level<select className="text-input" value={classLevelId} onChange={(event) => { setClassLevelId(event.target.value); setAssignmentId(''); }} disabled={!termId}><option value="">Select a class level</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
      <label className="field-label">Optional subject stream<select className="text-input" value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)} disabled={!classLevelId || loadingAssignments}><option value="">{loadingAssignments ? 'Loading streams…' : 'Select a subject stream'}</option>{assignments.map((item) => <option key={item.subjectStreamId} value={item.id}>{item.subject?.name} · {item.subjectStream.name} · {item.teacher?.firstName} {item.teacher?.lastName}</option>)}</select></label>
    </div>
    {error && <div className="notice-error m-4" role="alert">{error}</div>}
    {classLevelId && !loadingAssignments && !assignments.length && <div className="table-message">No optional subject stream allocation was found for this class level and term. Go to Teaching assignments and assign a teacher to an optional or standalone subject. Required subjects include every active student automatically.</div>}
    {assignmentId && <>
      <div className="stream-roster-toolbar"><div className="relative enrollment-search"><Search size={17} className="search-icon" /><input className="search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" /></div><span>{selectedIds.length} selected · {students.length} enrolled</span><button className="secondary-button" type="button" onClick={toggleVisibleStudents} disabled={!visibleStudents.length}>{visibleStudents.length && visibleStudents.every((item) => selectedIds.includes(item.enrollmentId)) ? 'Clear visible' : 'Select visible'}</button></div>
      {loadingStudents ? <div className="table-message"><LoaderCircle size={18} className="animate-spin" /> Loading students…</div> : !students.length ? <div className="table-message">No active enrollments found in this class level and term.</div> : <div className="stream-roster-list">{visibleStudents.map(({ enrollmentId: id, student, classGroup }) => <label className="stream-roster-row" key={id}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleStudent(id)} /><span><strong>{studentName(student)}</strong><small>{student.admissionNumber} · {classGroup?.name || 'Class group'}</small></span>{selectedIds.includes(id) && <Check size={16} />}</label>)}</div>}
      <div className="enrollment-preview-footer"><span>Unselected students are dropped from this stream. Existing marks are retained.</span><button className="primary-button" type="button" onClick={saveRoster} disabled={saving || loadingStudents}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{saving ? 'Saving…' : 'Save student stream'}</button></div>
    </>}
  </section>;
}

function StudentEnrollmentModal({ terms, groups, classLevels, signOut, onClose, onSaved }) {
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [termId, setTermId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [previousEnrollmentId, setPreviousEnrollmentId] = useState('');
  const [previousEnrollments, setPreviousEnrollments] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoadingStudents(true);
      setOptionsError('');
      try {
        if (!termId) {
          if (!cancelled) setStudents([]);
          return;
        }
        const result = await fetchStudents(studentSearch, termId);
        if (!cancelled) setStudents(result.data || []);
      } catch (cause) {
        if (!cancelled) {
          setOptionsError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    }, studentSearch.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [studentSearch, termId, signOut]);

  useEffect(() => {
    let cancelled = false;
    setPreviousEnrollmentId('');
    setPreviousEnrollments([]);
    if (!studentId) return undefined;
    async function loadPreviousEnrollments() {
      setLoadingPrevious(true);
      try {
        const result = await fetchStudentEnrollments(studentId);
        if (!cancelled) {
          setPreviousEnrollments((result.data || []).filter((enrollment) =>
            ['ACTIVE', 'COMPLETED', 'PROMOTED', 'REPEATING'].includes(enrollment.status) &&
            !enrollment.nextEnrollment
          ));
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingPrevious(false);
      }
    }
    loadPreviousEnrollments();
    return () => { cancelled = true; };
  }, [studentId, signOut]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createEnrollment({
        studentId,
        termId,
        classLevelId,
        ...(classGroupId ? { classGroupId } : {}),
        ...(previousEnrollmentId ? { previousEnrollmentId } : {})
      });
      onSaved();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  const activeStudents = students.filter((student) => student.status === 'ACTIVE');
  const acceptingTerms = terms.filter((term) => ['DRAFT', 'OPEN'].includes(term.status));

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="user-modal enrollment-modal" role="dialog" aria-modal="true" aria-labelledby="enrollment-form-title">
        <div className="modal-heading">
          <div><p className="eyebrow">Student enrollment</p><h2 id="enrollment-form-title">Enroll a student</h2><p>Create a term enrollment, optionally linking its previous enrollment.</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <div className="user-name-grid">
            <label className="field-label">Academic term
              <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setStudentId(''); }} required>
                <option value="">Select a term</option>
                {acceptingTerms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
              </select>
            </label>
            <label className="field-label">Class level
              <select className="text-input" value={classLevelId} onChange={(event) => { setClassLevelId(event.target.value); setClassGroupId(''); }} required>
                <option value="">Select a class level</option>
                {classLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
            </label>
            <label className="field-label">Home class group <span className="optional-label">Can be assigned later</span>
              <select className="text-input" value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)} disabled={!classLevelId}>
                <option value="">Leave unassigned for now</option>
                {groups.filter((group) => group.classLevelId === classLevelId).map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
              </select>
            </label>
          </div>
          <label className="field-label">Student search
            <input className="text-input" type="search" value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudentId(''); }} placeholder="Name or admission number" required disabled={!termId} />
          </label>
          <label className="field-label">Active student
            <select className="text-input" value={studentId} onChange={(event) => setStudentId(event.target.value)} required disabled={!termId || loadingStudents}>
              <option value="">{!termId ? 'Select a term first' : loadingStudents ? 'Searching students…' : activeStudents.length ? 'Select a student' : 'No eligible students found'}</option>
              {activeStudents.map((student) => <option key={student.id} value={student.id}>{studentName(student)} · {student.admissionNumber}</option>)}
            </select>
          </label>
          {optionsError && <p className="form-error" role="alert">{optionsError}</p>}
          <label className="field-label">Previous enrollment <span className="optional-label">Optional</span>
            <select className="text-input" value={previousEnrollmentId} onChange={(event) => setPreviousEnrollmentId(event.target.value)} disabled={!studentId || loadingPrevious}>
              <option value="">{loadingPrevious ? 'Loading previous enrollments…' : 'No previous enrollment'}</option>
              {previousEnrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {termLabel(enrollment.term)} · {classLabel(enrollment.classGroup)} · {statusLabels[enrollment.status]}
                </option>
              ))}
            </select>
            <span className="field-hint">Choose an earlier enrollment to preserve the student’s progression history.</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving || loadingStudents || !acceptingTerms.length}>
              {saving && <LoaderCircle size={15} className="animate-spin" />}{saving ? 'Enrolling…' : 'Create enrollment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ManualBulkEnrollmentPanel({ terms, groups, signOut, onCompleted }) {
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [selected, setSelected] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const acceptingTerms = terms.filter((term) => ['DRAFT', 'OPEN'].includes(term.status));
  const selectedStudents = Object.values(selected);
  const selectedIds = selectedStudents.map((student) => student.id);
  const allOnPageSelected = students.length > 0 && students.every((student) => selected[student.id]);

  useEffect(() => {
    let cancelled = false;
    if (!termId) {
      setStudents([]);
      setPagination(emptyPagination);
      return undefined;
    }
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchStudents(search, termId, page);
        if (!cancelled) {
          setStudents(result.data || []);
          setPagination(result.pagination || emptyPagination);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search.trim() ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [termId, search, page, signOut]);

  function changeDestination(field, value) {
    if (field === 'termId') {
      setTermId(value);
      setSelected({});
      setStudents([]);
      setPagination(emptyPagination);
      setPage(1);
    } else {
      setClassGroupId(value);
    }
    setPreview(null);
    setNotice('');
  }

  function toggleStudent(student) {
    setSelected((current) => {
      if (current[student.id]) {
        const next = { ...current };
        delete next[student.id];
        return next;
      }
      if (Object.keys(current).length >= 500) return current;
      return { ...current, [student.id]: student };
    });
    setPreview(null);
  }

  function togglePage() {
    setSelected((current) => {
      const next = { ...current };
      if (allOnPageSelected) students.forEach((student) => { delete next[student.id]; });
      else students.forEach((student) => { if (Object.keys(next).length < 500) next[student.id] = student; });
      return next;
    });
    setPreview(null);
  }

  async function makePreview(event) {
    event?.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await previewSelectedBulkEnrollment({ targetTermId: termId, targetClassGroupId: classGroupId, studentIds: selectedIds });
      setPreview(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnrollment() {
    if (!preview?.summary.eligible) return;
    if (!window.confirm(`Enroll ${preview.summary.eligible} selected students in ${preview.destination.classLevel} · ${preview.destination.classGroupName}?`)) return;
    setWorking(true);
    setError('');
    try {
      const result = await createSelectedBulkEnrollments({ targetTermId: termId, targetClassGroupId: classGroupId, studentIds: selectedIds });
      setNotice(`${result.summary.created} students enrolled. ${result.summary.skipped} were skipped because their eligibility changed.`);
      setSelected({});
      setPreview(null);
      setPage(1);
      onCompleted();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="panel enrollment-bulk-panel">
      <div className="enrollment-section-heading"><div><h2>Enroll selected students</h2><p>Choose a term and stream, then tick eligible students. Students already enrolled in the term are excluded.</p></div></div>
      {error && <div className="notice-error mx-4 mb-3" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mx-4 mb-3" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      <form className="enrollment-bulk-form" onSubmit={makePreview}>
        <label className="field-label">Destination term
          <select className="text-input" value={termId} onChange={(event) => changeDestination('termId', event.target.value)} required>
            <option value="">Select term</option>
            {acceptingTerms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
          </select>
        </label>
        <label className="field-label">Destination class group / stream
          <select className="text-input" value={classGroupId} onChange={(event) => changeDestination('classGroupId', event.target.value)} required>
            <option value="">Select class group</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
          </select>
        </label>
      </form>
      <div className="enrollment-bulk-form">
        <label className="field-label">Search eligible students
          <input className="text-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setPreview(null); }} placeholder="Name or admission number" disabled={!termId} />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="people-table">
          <thead><tr><th><input type="checkbox" aria-label="Select all eligible students on this page" checked={allOnPageSelected} onChange={togglePage} disabled={!students.length || loading || selectedStudents.length >= 500 && !allOnPageSelected} /></th><th>Student</th><th>Admission no.</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="4">Loading eligible students…</td></tr> : students.length ? students.map((student) => (
              <tr key={student.id}>
                <td><input type="checkbox" checked={Boolean(selected[student.id])} onChange={() => toggleStudent(student)} disabled={!selected[student.id] && selectedStudents.length >= 500} aria-label={`Select ${studentName(student)}`} /></td>
                <td>{studentName(student)}</td><td>{student.admissionNumber}</td><td>{student.status}</td>
              </tr>
            )) : <tr><td colSpan="4">{termId ? 'No eligible students found for this term.' : 'Select a term to view eligible students.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="enrollment-preview-footer">
        <span>{selectedStudents.length} selected · Up to 500 students per batch</span>
        <div className="flex gap-2">
          <button className="secondary-button" type="button" onClick={() => setSelected({})} disabled={!selectedStudents.length || working}>Clear selection</button>
          <button className="primary-button" type="button" onClick={makePreview} disabled={loading || working || !termId || !classGroupId || !selectedStudents.length}>Preview selection</button>
        </div>
      </div>
      {pagination.totalPages > 1 && <div className="pagination"><span>Page {page} of {pagination.totalPages} · {pagination.total} eligible students</span><div className="flex gap-2"><button className="pagination-button" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="pagination-button" type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>}
      {preview && <div className="enrollment-bulk-preview">
        <div className="enrollment-preview-heading"><div><strong>{preview.destination.classLevel} · {preview.destination.classGroupName}</strong><span>{preview.destination.termName}, {preview.destination.academicYear}</span></div><div className="enrollment-preview-stats"><span>{preview.summary.eligible} eligible</span><span>{preview.summary.skipped} skipped</span></div></div>
        <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Student</th><th>Admission no.</th></tr></thead><tbody>{preview.eligible.map((student) => <tr key={student.studentId}><td>{studentName(student)}</td><td>{student.admissionNumber}</td></tr>)}</tbody></table></div>
        {preview.skipped.length > 0 && <details className="enrollment-skipped-details"><summary>Review {preview.skipped.length} skipped</summary><ul>{preview.skipped.map((student) => <li key={student.studentId}>{studentName(student)} · {student.reason.replaceAll('_', ' ').toLowerCase()}</li>)}</ul></details>}
        <div className="enrollment-preview-footer"><span>The server will check eligibility again before enrolling.</span><button className="primary-button" type="button" onClick={confirmEnrollment} disabled={working || !preview.summary.eligible}>{working ? 'Enrolling…' : `Enroll ${preview.summary.eligible} students`}</button></div>
      </div>}
    </section>
  );
}

function BulkEnrollmentPanel({ terms, groups, signOut, onCompleted }) {
  const [sourceTermId, setSourceTermId] = useState('');
  const [sourceClassGroupId, setSourceClassGroupId] = useState('');
  const [targetTermId, setTargetTermId] = useState('');
  const [targetClassGroupId, setTargetClassGroupId] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sourceTerms = terms.filter((term) => term.status !== 'DRAFT');
  const targetTerms = terms.filter((term) => ['DRAFT', 'OPEN'].includes(term.status));

  function clearPreview() {
    setPreview(null);
    setError('');
    setNotice('');
  }

  async function getPreview(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await previewBulkEnrollment({ sourceTermId, sourceClassGroupId, targetTermId, targetClassGroupId });
      setPreview(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }

  async function confirmBulk() {
    if (!preview?.summary.eligible) return;
    if (!window.confirm(`Enroll ${preview.summary.eligible} eligible students in ${preview.destination.termName}, ${preview.destination.academicYear}?`)) return;
    setCreating(true);
    setError('');
    setNotice('');
    try {
      const result = await createBulkEnrollments({ sourceTermId, sourceClassGroupId, targetTermId, targetClassGroupId });
      setNotice(`${result.summary.created} students enrolled successfully. ${result.summary.skipped} students were skipped.`);
      setPreview(null);
      onCompleted();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="panel enrollment-bulk-panel">
      <div className="enrollment-section-heading"><div><h2>Bulk progression</h2><p>Preview students moving between terms and classes before enrolling them.</p></div></div>
      {error && <div className="notice-error mx-4 mb-3" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mx-4 mb-3" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      <form className="enrollment-bulk-form" onSubmit={getPreview}>
        <label className="field-label">Source term
          <select className="text-input" value={sourceTermId} onChange={(event) => { setSourceTermId(event.target.value); clearPreview(); }} required>
            <option value="">Select source term</option>
            {sourceTerms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
          </select>
        </label>
        <label className="field-label">Source class
          <select className="text-input" value={sourceClassGroupId} onChange={(event) => { setSourceClassGroupId(event.target.value); clearPreview(); }} required>
            <option value="">Select source class</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
          </select>
        </label>
        <label className="field-label">Destination term
          <select className="text-input" value={targetTermId} onChange={(event) => { setTargetTermId(event.target.value); clearPreview(); }} required>
            <option value="">Select destination term</option>
            {targetTerms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
          </select>
        </label>
        <label className="field-label">Destination class
          <select className="text-input" value={targetClassGroupId} onChange={(event) => { setTargetClassGroupId(event.target.value); clearPreview(); }} required>
            <option value="">Select destination class</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
          </select>
        </label>
        <button className="primary-button" type="submit" disabled={loading || !sourceTermId || !sourceClassGroupId || !targetTermId || !targetClassGroupId}>
          {loading ? <LoaderCircle size={15} className="animate-spin" /> : <UsersRound size={15} />}{loading ? 'Preparing preview…' : 'Preview bulk enrollment'}
        </button>
      </form>
      {preview && (
        <div className="enrollment-bulk-preview">
          <div className="enrollment-preview-heading">
            <div><strong>{preview.source.classLevel} · {preview.source.classGroupName}</strong><span>{preview.source.termName}, {preview.source.academicYear} <ArrowRight size={13} /> {preview.destination.classLevel} · {preview.destination.classGroupName} · {preview.destination.termName}, {preview.destination.academicYear}</span></div>
            <div className="enrollment-preview-stats"><span>{preview.summary.eligible} eligible</span><span>{preview.summary.skipped} skipped</span></div>
          </div>
          {preview.eligible.length > 0 && (
            <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Eligible student</th><th>Admission no.</th></tr></thead><tbody>
              {preview.eligible.map((student) => <tr key={student.studentId}><td>{studentName(student)}</td><td>{student.admissionNumber}</td></tr>)}
            </tbody></table></div>
          )}
          {preview.skipped.length > 0 && (
            <details className="enrollment-skipped-details">
              <summary>Review {preview.skipped.length} skipped student{preview.skipped.length === 1 ? '' : 's'}</summary>
              <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Student</th><th>Admission no.</th><th>Why skipped</th></tr></thead><tbody>
                {preview.skipped.map((student) => <tr key={student.studentId}><td>{studentName(student)}</td><td>{student.admissionNumber}</td><td>{student.reason.replaceAll('_', ' ').toLowerCase()}</td></tr>)}
              </tbody></table></div>
            </details>
          )}
          <div className="enrollment-preview-footer">
            <span>The server rechecks eligibility when you confirm. Existing destination enrollments will not be duplicated.</span>
            <button className="primary-button" type="button" onClick={confirmBulk} disabled={creating || !preview.summary.eligible}>
              {creating && <LoaderCircle size={15} className="animate-spin" />}{creating ? 'Creating enrollments…' : `Enroll ${preview.summary.eligible} eligible`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function EnrollmentsPage({ user, signOut }) {
  const canManage = ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role);
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('register');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [termData, groupData, levelData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/class-groups'),
          fetchAllPages('/class-levels')
        ]);
        if (!cancelled) {
          setTerms(termData);
          setGroups(groupData);
          setClassLevels(levelData);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { cancelled = true; };
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoadingList(true);
      setError('');
      try {
        const result = await fetchEnrollments({ page, termId, classGroupId, status, search });
        if (!cancelled) {
          setEnrollments(result.data || []);
          setPagination(result.pagination || emptyPagination);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }, search.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [page, termId, classGroupId, status, search, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function clearFilters() {
    setTermId('');
    setClassGroupId('');
    setStatus('');
    setSearch('');
    setPage(1);
  }

  const hasFilters = Boolean(termId || classGroupId || status || search.trim());

  async function changeStatus(enrollment, nextStatus) {
    if (nextStatus === enrollment.status) return;
    const student = studentName(enrollment.student);
    if (!window.confirm(`Change ${student}'s enrollment status from ${statusLabels[enrollment.status]} to ${statusLabels[nextStatus]}?`)) return;
    setBusyId(enrollment.id);
    setError('');
    setNotice('');
    try {
      await updateEnrollmentStatus(enrollment.id, nextStatus);
      setNotice(`${student}'s enrollment is now ${statusLabels[nextStatus].toLowerCase()}.`);
      refresh();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  async function changeStream(enrollment, nextClassGroupId) {
    if (nextClassGroupId === enrollment.classGroupId) return;
    const student = studentName(enrollment.student);
    const destination = groups.find((group) => group.id === nextClassGroupId);
    if (!destination || !window.confirm(`Assign ${student} from ${classLabel(enrollment.classGroup) || 'no home group'} to ${classLabel(destination)} for this term?`)) return;
    setBusyId(enrollment.id);
    setError('');
    setNotice('');
    try {
      await updateEnrollmentClassGroup(enrollment.id, nextClassGroupId);
      setNotice(`${student} moved to ${classLabel(destination)}.`);
      refresh();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <div className="welcome-row students-welcome">
        <div><p className="eyebrow">Academic records</p><h1 className="page-title">Enrollments<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Manage student placement and progression between terms and classes.</p></div>
        {canManage && <button className="primary-button add-user-button" onClick={() => setFormOpen(true)} disabled={loadingOptions || !terms.length || !classLevels.length}><Plus size={17} /> Enroll student</button>}
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      {canManage && (
        <div className="enrollment-tabs" role="tablist" aria-label="Enrollment management">
          <button className={tab === 'register' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>Enrollment register</button>
          <button className={tab === 'bulk' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'bulk'} onClick={() => setTab('bulk')}>Bulk progression</button>
          <button className={tab === 'select' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'select'} onClick={() => setTab('select')}>Select students</button>
          <button className={tab === 'streams' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'streams'} onClick={() => setTab('streams')}>Subject streams</button>
        </div>
      )}
      {tab === 'bulk' && canManage && <BulkEnrollmentPanel terms={terms} groups={groups} signOut={signOut} onCompleted={refresh} />}
      {tab === 'select' && canManage && <ManualBulkEnrollmentPanel terms={terms} groups={groups} signOut={signOut} onCompleted={refresh} />}
      {tab === 'streams' && canManage && <SubjectStreamPanel terms={terms} groups={groups} signOut={signOut} onSaved={(message) => { setNotice(message); setTab('streams'); }} />}
      {tab === 'register' && (
        <section className="panel enrollment-register-panel">
          <div className="enrollment-toolbar">
            <div className="relative enrollment-search"><Search size={17} className="search-icon" /><input className="search-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search student name or admission no." aria-label="Search enrollments" /></div>
            <label className="sr-only" htmlFor="enrollment-term-filter">Filter by term</label>
            <select id="enrollment-term-filter" className="filter-select" value={termId} onChange={(event) => { setTermId(event.target.value); setPage(1); }} disabled={loadingOptions}>
              <option value="">All terms</option>{terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
            <label className="sr-only" htmlFor="enrollment-class-filter">Filter by class</label>
            <select id="enrollment-class-filter" className="filter-select" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); setPage(1); }} disabled={loadingOptions}>
              <option value="">All classes</option>{groups.map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
            </select>
            <label className="sr-only" htmlFor="enrollment-status-filter">Filter by status</label>
            <select id="enrollment-status-filter" className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">All statuses</option>{enrollmentStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
            </select>
            <span className="student-total">{pagination.total} enrollments</span>
          </div>
          {error && !enrollments.length ? <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
            : loadingList ? <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading enrollments…</span></div>
              : enrollments.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><UsersRound size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No enrollments match these filters' : 'No enrollments yet'}</p><p className="mt-1 text-xs text-muted">{hasFilters ? 'Change or clear the filters to see more enrollments.' : 'Enroll a student individually or use bulk progression for an entire class.'}</p>{hasFilters ? <button className="text-button mt-3" onClick={clearFilters}>Clear filters</button> : canManage && <button className="text-button mt-3" onClick={() => setFormOpen(true)}>Enroll the first student</button>}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="people-table enrollment-table">
                    <thead><tr><th>Student</th><th>Term</th><th>Class level</th><th>Home class group</th><th>Previous enrollment</th><th>Status</th><th>Created</th>{canManage && <th>Actions</th>}</tr></thead>
                    <tbody>{enrollments.map((enrollment) => {
                      const streamLockReason = enrollment._count?.results
                        ? 'Class group cannot be changed after assessment results have been entered.'
                        : enrollment.status !== 'ACTIVE'
                          ? 'Only active enrollments can be moved.'
                          : !['DRAFT', 'OPEN'].includes(enrollment.term.status)
                            ? 'Class group can only be changed while the term is open.'
                            : '';
                      return <tr key={enrollment.id}>
                        <td><div className="enrollment-student-cell"><strong>{studentName(enrollment.student)}</strong><span>{enrollment.student?.admissionNumber}</span></div></td>
                        <td className="whitespace-nowrap">{termLabel(enrollment.term)}</td>
                        <td className="whitespace-nowrap">{enrollment.classLevel?.name || enrollment.classGroup?.classLevel?.name || '—'}</td>
                        <td className="whitespace-nowrap">{canManage
                          ? <select className="enrollment-stream-select" aria-label={`Assign ${studentName(enrollment.student)} to a home class group`} title={streamLockReason || 'Assign or move this student to a home class group at the same class level.'} value={enrollment.classGroupId || ''} disabled={busyId === enrollment.id || Boolean(streamLockReason)} onChange={(event) => event.target.value && changeStream(enrollment, event.target.value)}>
                              {!enrollment.classGroupId && <option value="">Assign home group</option>}
                              {groups.filter((group) => group.classLevelId === enrollment.classLevelId).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                            </select>
                          : enrollment.classGroup ? classLabel(enrollment.classGroup) : 'Not assigned'}</td>
                        <td className="text-muted">{enrollment.previousEnrollment ? `${enrollment.previousEnrollment.status.toLowerCase()} · linked` : '—'}</td>
                        <td><span className={`subject-status subject-status-${enrollment.status.toLowerCase()}`}>{statusLabels[enrollment.status]}</span></td>
                        <td className="whitespace-nowrap text-muted">{new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(enrollment.createdAt))}</td>
                        {canManage && <td><div className="enrollment-status-control"><select className="status-action" aria-label={`Update ${studentName(enrollment.student)} enrollment status`} value={enrollment.status} disabled={busyId === enrollment.id} onChange={(event) => changeStatus(enrollment, event.target.value)}>{enrollmentStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>{busyId === enrollment.id && <LoaderCircle size={14} className="animate-spin text-green-700" />}</div></td>}
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              )}
          {!loadingList && pagination.totalPages > 1 && (
            <div className="pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
          )}
        </section>
      )}
      {formOpen && canManage && <StudentEnrollmentModal terms={terms} groups={groups} classLevels={classLevels} signOut={signOut} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); setNotice('Student enrolled successfully.'); setPage(1); refresh(); }} />}
    </>
  );
}
