import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ClipboardList, LoaderCircle, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import AssessmentFormModal from './AssessmentFormModal.jsx';
import AssessmentResultsModal from './AssessmentResultsModal.jsx';
import AssessmentPopup from './AssessmentPopup.jsx';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';
import FormTutorReportDetailsPanel from './FormTutorReportDetailsPanel.jsx';
import {
  assessmentStatusLabel,
  assessmentStatuses,
  assessmentTransitions,
  assessmentTypeLabel,
  assessmentTypes,
  deleteAssessment,
  fetchAllPages,
  fetchAssessmentResults,
  fetchAssessments,
  resetAssessment,
  transitionAssessment
} from './assessmentApi.js';

export default function AssessmentsPage({ user, signOut }) {
  const [assessments, setAssessments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [termFilter, setTermFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formAssessment, setFormAssessment] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resultsAssessment, setResultsAssessment] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [pendingReset, setPendingReset] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const [termData, assignmentData] = await Promise.all([
          user.role === 'TEACHER' ? Promise.resolve([]) : fetchAllPages('/terms'),
          fetchAllPages('/teaching-assignments')
        ]);
        if (!cancelled) {
          const assignmentTerms = assignmentData
            .map((assignment) => assignment.term)
            .filter((term) => term?.id);
          setTerms(user.role === 'TEACHER'
            ? [...new Map(assignmentTerms.map((term) => [term.id, term])).values()]
            : termData);
          setAssignments(assignmentData);
        }
      } catch (cause) {
        if (!cancelled) {
          setOptionsError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, signOut, user.role]);

  useEffect(() => {
    let cancelled = false;
    async function loadAssessments() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAssessments({
          termId: termFilter,
          status: statusFilter,
          assessmentType: typeFilter
        });
        if (!cancelled) setAssessments(result.data || []);
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAssessments();
    return () => {
      cancelled = true;
    };
  }, [termFilter, statusFilter, typeFilter, refreshKey, signOut]);

  const termMap = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);
  const currentTerm = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const isInProgress = (term) => term.startDate?.slice(0, 10) <= today && term.endDate?.slice(0, 10) >= today;
    const currentYearTerms = terms.filter((term) => term.academicYear?.isCurrent);
    return currentYearTerms.find(isInProgress)
      || currentYearTerms.find((term) => term.status === 'OPEN')
      || currentYearTerms.sort((left, right) => right.sequence - left.sequence)[0]
      || terms.find(isInProgress)
      || null;
  }, [terms]);
  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return assessments;
    return assessments.filter((assessment) => {
      const text = [
        assessment.title,
        assessment.subject?.name,
        assessment.subject?.code,
        assessment.teachingAssignment?.classGroup?.name,
        assessment.teachingAssignment?.classGroup?.classLevel?.name,
        assessment.teachingAssignment?.subjectStream?.name,
        assessment.teachingAssignment?.subjectStream?.classLevel?.name,
        assessment.teachingAssignment?.classSubject?.classLevel?.name,
        assessment.teachingAssignment?.teacher?.firstName,
        assessment.teachingAssignment?.teacher?.lastName,
        termMap.get(assessment.termId)?.name,
        termMap.get(assessment.termId)?.academicYear?.name
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return text.includes(query);
    });
  }, [assessments, search, termMap]);

  const availableAssignments = useMemo(() => assignments.filter((assignment) =>
    currentTerm && assignment.termId === currentTerm.id
  ), [assignments, currentTerm]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreate() {
    setFormAssessment(null);
    setFormOpen(true);
  }

  function openEdit(assessment) {
    setFormAssessment(assessment);
    setFormOpen(true);
  }

  async function advanceStatus(assessment) {
    const nextStatus = assessmentTransitions[assessment.status];
    const canTransition = user.role !== 'TEACHER' || ['DRAFT', 'OPEN'].includes(assessment.status);
    if (!nextStatus) return;
    setActionError('');
    setNotice('');
    setBusyId(assessment.id);
    try {
      if (nextStatus === 'SUBMITTED') {
        const resultResponse = await fetchAssessmentResults(assessment.id);
        const resultRows = resultResponse.data || [];
        if (resultRows.length === 0) {
          setActionError(['MID_TERM_EXAM', 'FINAL_EXAM'].includes(assessment.assessmentType)
            ? 'Assessment was not submitted to admins: no students are eligible yet. Save class attendance for the exam date first.'
            : 'Assessment was not submitted to admins: there are no active student enrollments for this assessment.');
          return;
        }
        const maxMark = Number(assessment.maxMark);
        const incompleteResults = resultRows.filter((result) => {
          if (assessment.adminReopened && ['MID_TERM_EXAM', 'FINAL_EXAM'].includes(assessment.assessmentType)
            && ['ABSENT', 'NOT_ENTERED'].includes(result.status) && (result.mark == null || result.mark === '')) return false;
          if (result.status !== 'PRESENT' || result.mark == null || String(result.mark).trim() === '') return true;
          const mark = Number(result.mark);
          return !Number.isFinite(mark) || mark < 0 || mark > maxMark;
        });
        if (incompleteResults.length > 0) {
          const names = incompleteResults.slice(0, 3).map((result) => (
            [result.student?.firstName, result.student?.lastName].filter(Boolean).join(' ')
              || result.student?.admissionNumber
              || 'student'
          ));
          const extraCount = incompleteResults.length - names.length;
          setActionError(
            `Assessment was not submitted to admins: ${incompleteResults.length} eligible student${incompleteResults.length === 1 ? '' : 's'} do not have a valid numeric mark. Enter a mark from 0 to ${maxMark} for every student${names.length ? ` (${names.join(', ')}${extraCount > 0 ? `, and ${extraCount} more` : ''})` : ''}.`,
          );
          return;
        }
      }
      await transitionAssessment(assessment.id);
      setNotice(`${assessment.title} moved to ${assessmentStatusLabel(nextStatus)}.`);
      refresh();
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  async function reopenAssessment(assessment) {
    setActionError('');
    setNotice('');
    setBusyId(assessment.id);
    try {
      const result = await resetAssessment(assessment.id);
      const invalidated = result.data?.invalidatedDraftTermResults ?? 0;
      setNotice(`${assessment.title} is open for editing. Existing marks were kept.${invalidated ? ` ${invalidated} draft term result(s) need recalculation.` : ''}`);
      refresh();
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  async function removeAssessment(assessment) {
    setActionError('');
    setNotice('');
    setBusyId(assessment.id);
    try {
      await deleteAssessment(assessment.id);
      setNotice(`${assessment.title} was deleted.`);
      refresh();
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  const hasFilters = Boolean(termFilter || statusFilter || typeFilter || search.trim());

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Assessment & results</p>
          <h1 className="page-title">Assessments<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">
            {user.role === 'TEACHER'
              ? 'Create assessments for your assigned classes and subjects, enter marks, and submit results for review.'
              : 'Create assessments, enter marks, and move work through review and approval.'}
          </p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingOptions || Boolean(optionsError) || availableAssignments.length === 0}>
          <Plus size={17} /> Create assessment
        </button>
      </div>
      <AssessmentPopup message={optionsError ? `Assessment choices could not be loaded: ${optionsError}` : ''} onDismiss={() => setOptionsError('')} actionLabel="Try again" onAction={refresh} />
      <AssessmentPopup message={actionError} onDismiss={() => setActionError('')} />
      <AssessmentPopup message={notice} type="success" onDismiss={() => setNotice('')} />
      {['TEACHER', 'SCHOOL_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER', 'SUPER_ADMIN'].includes(user.role) && <FormTutorReportDetailsPanel signOut={signOut} />}
      <div className="assessment-weight-guide">
        <div className="assessment-weight-guide-copy"><strong>How subject weighting works</strong><span>Mid-term reports use 40% coursework and 60% mid-term exam. End-of-term reports use 20% coursework, 30% mid-term exam and 50% final exam.</span></div>
        <div className="assessment-weight-guide-bar" aria-label="Mid-term: 40 percent coursework and 60 percent mid-term exam. End-of-term: 20 percent coursework, 30 percent mid-term exam and 50 percent final exam."><span>Mid-term <b>40% + 60%</b></span><span>End-of-term <b>20% + 30% + 50%</b></span></div>
      </div>
      <section className="panel directory-panel assessment-panel">
        <div className="assessment-toolbar">
          <div className="relative assessment-search">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, class, subject, or teacher" aria-label="Search assessments" />
          </div>
          <label className="sr-only" htmlFor="assessment-term-filter">Filter by term</label>
          <select id="assessment-term-filter" className="filter-select" value={termFilter} onChange={(event) => setTermFilter(event.target.value)}>
            <option value="">All terms</option>
            {terms.map((term) => <option value={term.id} key={term.id}>{term.academicYear?.name} · {term.sequence}. {term.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="assessment-status-filter">Filter by status</label>
          <select id="assessment-status-filter" className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {assessmentStatuses.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="assessment-type-filter">Filter by assessment type</label>
          <select id="assessment-type-filter" className="filter-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All types</option>
            {assessmentTypes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
          <span className="student-total">{filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading || loadingOptions ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading assessments…</span></div>
        ) : filteredAssessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No assessments match these filters' : 'No assessments created yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasFilters ? 'Try changing your search or filters.' : 'Create an assessment for a class and subject assignment.'}</p>
            {hasFilters
              ? <button className="text-button mt-3" onClick={() => { setSearch(''); setTermFilter(''); setStatusFilter(''); setTypeFilter(''); }}>Clear filters</button>
              : <button className="text-button mt-3" onClick={openCreate} disabled={availableAssignments.length === 0}>Create the first assessment</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table assessment-table">
              <thead><tr><th>Assessment</th><th>Class & subject</th><th>Term</th><th>Type</th><th>Result records</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {filteredAssessments.map((assessment) => {
                  const assignment = assessment.teachingAssignment;
                  const group = assignment?.classGroup;
                  const classLevel = group?.classLevel || assignment?.subjectStream?.classLevel || assignment?.classSubject?.classLevel;
                  const className = [classLevel?.name, group?.name, assignment?.subjectStream?.name ? `Stream ${assignment.subjectStream.name}` : ''].filter(Boolean).join(' · ');
                  const term = termMap.get(assessment.termId) || assessment.term;
                  const nextStatus = assessmentTransitions[assessment.status];
                  const canTransition = user.role !== 'TEACHER' || ['DRAFT', 'OPEN'].includes(assessment.status);
                  const canEdit = ['DRAFT', 'OPEN'].includes(assessment.status) && ((assessment._count?.results ?? 0) === 0 || (['MID_TERM_EXAM', 'FINAL_EXAM'].includes(assessment.assessmentType) && !assessment.assessmentDate));
                  const canDelete = assessment.status === 'DRAFT' && (assessment._count?.results ?? 0) === 0;
                  const canReset = ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role)
                    && ['SUBMITTED', 'APPROVED', 'LOCKED'].includes(assessment.status);
                  return (
                    <tr key={assessment.id}>
                      <td>
                        <div className="assessment-title-cell">
                          <span className="assessment-icon"><ClipboardList size={15} /></span>
                          <div><strong>{assessment.title}</strong><span>{assignment?.teacher ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}` : '—'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="assessment-class-cell">
                          <strong>{className || '—'}</strong>
                          <span>{assessment.subject?.code ? `${assessment.subject.code} · ` : ''}{assessment.subject?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">{term ? `${term.academicYear?.name || ''} · ${term.sequence}. ${term.name}` : '—'}</td>
                      <td className="whitespace-nowrap text-muted">{assessmentTypeLabel(assessment.assessmentType)}</td>
                      <td className="whitespace-nowrap text-muted">{Number(assessment._count?.results ?? 0)}</td>
                      <td><span className={`subject-status subject-status-${assessment.status.toLowerCase()}`}>{assessmentStatusLabel(assessment.status)}</span></td>
                      <td>
                        <div className="assessment-actions">
                          <button className="table-action" onClick={() => setResultsAssessment(assessment)} title="Enter or review marks">Results</button>
                          <button className="table-action" onClick={() => openEdit(assessment)} disabled={!canEdit} title={canEdit ? 'Edit assessment or set its missing exam date' : 'Only draft or open assessments without results can be edited'}>Edit</button>
                          {canDelete && <button className="table-action assessment-delete-action" onClick={() => setPendingDelete(assessment)} disabled={busyId === assessment.id} title="Delete draft assessment"><Trash2 size={14} /> Delete</button>}
                          {nextStatus && canTransition && (
                            <button className="table-action assessment-next-action" onClick={() => advanceStatus(assessment)} disabled={busyId === assessment.id} title={`Move to ${assessmentStatusLabel(nextStatus)}`}>
                              {busyId === assessment.id ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                              {assessmentStatusLabel(nextStatus)}
                            </button>
                          )}
                          {canReset && (
                            <button className="table-action assessment-reset-action" onClick={() => setPendingReset(assessment)} disabled={busyId === assessment.id} title="Reopen this assessment and keep its marks">
                              {busyId === assessment.id ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {formOpen && (
        <AssessmentFormModal
          assessment={formAssessment}
          assignments={availableAssignments}
          terms={terms}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice(formAssessment ? 'Assessment updated.' : 'Assessment created.');
            refresh();
          }}
        />
      )}
      {resultsAssessment && (
        <AssessmentResultsModal
          assessment={resultsAssessment}
          signOut={signOut}
          onClose={() => setResultsAssessment(null)}
          onSaved={() => refresh()}
        />
      )}
      {pendingReset && <ConfirmActionModal
        title="Reset assessment to open?"
        message={`Existing marks for “${pendingReset.title}” will be kept. Reopening also approves result corrections for students recorded absent on a mid-term or final exam. Any draft term results calculated from this class and subject will be cleared and must be recalculated.`}
        confirmLabel="Reset assessment"
        onCancel={() => setPendingReset(null)}
        onConfirm={() => { const assessment = pendingReset; setPendingReset(null); reopenAssessment(assessment); }}
      />}
      {pendingDelete && <ConfirmActionModal
        title="Delete this assessment?"
        message={`“${pendingDelete.title}” will be permanently deleted. Only draft assessments without saved results can be deleted.`}
        confirmLabel={busyId === pendingDelete.id ? 'Deleting…' : 'Delete assessment'}
        confirmDisabled={busyId === pendingDelete.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => { const assessment = pendingDelete; setPendingDelete(null); removeAssessment(assessment); }}
      />}
    </>
  );
}
