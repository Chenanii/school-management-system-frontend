import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search, UsersRound } from 'lucide-react';
import {
  createBulkEnrollments,
  createEnrollment,
  fetchAllPages,
  fetchEnrollments,
  fetchStudentEnrollments,
  fetchStudents,
  previewBulkEnrollment,
  updateEnrollmentStatus
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

function StudentEnrollmentModal({ terms, groups, signOut, onClose, onSaved }) {
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [termId, setTermId] = useState('');
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
        const result = await fetchStudents(studentSearch);
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
  }, [studentSearch, signOut]);

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
        classGroupId,
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
          <label className="field-label">Student search
            <input className="text-input" type="search" value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudentId(''); }} placeholder="Name or admission number" required />
          </label>
          <label className="field-label">Active student
            <select className="text-input" value={studentId} onChange={(event) => setStudentId(event.target.value)} required disabled={loadingStudents}>
              <option value="">{loadingStudents ? 'Searching students…' : 'Select a student'}</option>
              {activeStudents.map((student) => <option key={student.id} value={student.id}>{studentName(student)} · {student.admissionNumber}</option>)}
            </select>
          </label>
          {optionsError && <p className="form-error" role="alert">{optionsError}</p>}
          <div className="user-name-grid">
            <label className="field-label">Academic term
              <select className="text-input" value={termId} onChange={(event) => setTermId(event.target.value)} required>
                <option value="">Select a term</option>
                {acceptingTerms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
              </select>
            </label>
            <label className="field-label">Class group
              <select className="text-input" value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)} required>
                <option value="">Select a class group</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{classLabel(group)}</option>)}
              </select>
            </label>
          </div>
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
  const canManage = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
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
        const [termData, groupData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/class-groups')
        ]);
        if (!cancelled) {
          setTerms(termData);
          setGroups(groupData);
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

  return (
    <>
      <div className="welcome-row students-welcome">
        <div><p className="eyebrow">Academic records</p><h1 className="page-title">Enrollments<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Manage student placement and progression between terms and classes.</p></div>
        {canManage && <button className="primary-button add-user-button" onClick={() => setFormOpen(true)} disabled={loadingOptions || !terms.length || !groups.length}><Plus size={17} /> Enroll student</button>}
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      {canManage && (
        <div className="enrollment-tabs" role="tablist" aria-label="Enrollment management">
          <button className={tab === 'register' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>Enrollment register</button>
          <button className={tab === 'bulk' ? 'enrollment-tab enrollment-tab-active' : 'enrollment-tab'} role="tab" aria-selected={tab === 'bulk'} onClick={() => setTab('bulk')}>Bulk progression</button>
        </div>
      )}
      {tab === 'bulk' && canManage && <BulkEnrollmentPanel terms={terms} groups={groups} signOut={signOut} onCompleted={refresh} />}
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
                    <thead><tr><th>Student</th><th>Term</th><th>Class group</th><th>Previous enrollment</th><th>Status</th><th>Created</th>{canManage && <th>Update status</th>}</tr></thead>
                    <tbody>{enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td><div className="enrollment-student-cell"><strong>{studentName(enrollment.student)}</strong><span>{enrollment.student?.admissionNumber}</span></div></td>
                        <td className="whitespace-nowrap">{termLabel(enrollment.term)}</td>
                        <td className="whitespace-nowrap">{classLabel(enrollment.classGroup)}</td>
                        <td className="text-muted">{enrollment.previousEnrollment ? `${enrollment.previousEnrollment.status.toLowerCase()} · linked` : '—'}</td>
                        <td><span className={`subject-status subject-status-${enrollment.status.toLowerCase()}`}>{statusLabels[enrollment.status]}</span></td>
                        <td className="whitespace-nowrap text-muted">{new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(enrollment.createdAt))}</td>
                        {canManage && <td><div className="enrollment-status-control"><select className="status-action" aria-label={`Update ${studentName(enrollment.student)} enrollment status`} value={enrollment.status} disabled={busyId === enrollment.id} onChange={(event) => changeStatus(enrollment, event.target.value)}>{enrollmentStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>{busyId === enrollment.id && <LoaderCircle size={14} className="animate-spin text-green-700" />}</div></td>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
          {!loadingList && pagination.totalPages > 1 && (
            <div className="pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
          )}
        </section>
      )}
      {formOpen && canManage && <StudentEnrollmentModal terms={terms} groups={groups} signOut={signOut} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); setNotice('Student enrolled successfully.'); setPage(1); refresh(); }} />}
    </>
  );
}
