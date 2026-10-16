import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ClipboardList, LoaderCircle, Plus, Search } from 'lucide-react';
import AssessmentFormModal from './AssessmentFormModal.jsx';
import AssessmentResultsModal from './AssessmentResultsModal.jsx';
import {
  assessmentStatusLabel,
  assessmentStatuses,
  assessmentTransitions,
  assessmentTypeLabel,
  assessmentTypes,
  fetchAllPages,
  fetchAssessments,
  transitionAssessment
} from './assessmentApi.js';

export default function AssessmentsPage({ signOut }) {
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

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const [termData, assignmentData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/teaching-assignments')
        ]);
        if (!cancelled) {
          setTerms(termData);
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
  }, [refreshKey, signOut]);

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
        assessment.teachingAssignment?.teacher?.firstName,
        assessment.teachingAssignment?.teacher?.lastName,
        termMap.get(assessment.termId)?.name,
        termMap.get(assessment.termId)?.academicYear?.name
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return text.includes(query);
    });
  }, [assessments, search, termMap]);

  const availableAssignments = useMemo(() => assignments.filter((assignment) =>
    assignment.term && ['DRAFT', 'OPEN'].includes(assignment.term.status)
  ), [assignments]);

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
    if (!nextStatus) return;
    setActionError('');
    setNotice('');
    setBusyId(assessment.id);
    try {
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

  const hasFilters = Boolean(termFilter || statusFilter || typeFilter || search.trim());

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Assessment & results</p>
          <h1 className="page-title">Assessments<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Create assessments, enter marks, and move work through review and approval.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingOptions || Boolean(optionsError) || availableAssignments.length === 0}>
          <Plus size={17} /> Create assessment
        </button>
      </div>
      {optionsError && (
        <div className="notice-error" role="alert">
          <span>Assessment choices could not be loaded: {optionsError}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      {actionError && (
        <div className="notice-error" role="alert">
          <span>{actionError}</span>
          <button className="text-button" onClick={() => setActionError('')}>Dismiss</button>
        </div>
      )}
      {notice && (
        <div className="teaching-assignment-notice" role="status">
          <span>{notice}</span>
          <button className="text-button" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}
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
              <thead><tr><th>Assessment</th><th>Class & subject</th><th>Term</th><th>Type</th><th>Result records</th><th>Max mark</th><th>Weight</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {filteredAssessments.map((assessment) => {
                  const assignment = assessment.teachingAssignment;
                  const group = assignment?.classGroup;
                  const className = [group?.classLevel?.name, group?.name].filter(Boolean).join(' · ');
                  const term = termMap.get(assessment.termId) || assessment.term;
                  const nextStatus = assessmentTransitions[assessment.status];
                  const canEdit = assessment.status === 'DRAFT' && (assessment._count?.results ?? 0) === 0;
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
                      <td className="whitespace-nowrap text-muted">{Number(assessment.maxMark)}</td>
                      <td className="whitespace-nowrap text-muted">{Number(assessment.weightPercent)}%</td>
                      <td><span className={`subject-status subject-status-${assessment.status.toLowerCase()}`}>{assessmentStatusLabel(assessment.status)}</span></td>
                      <td>
                        <div className="assessment-actions">
                          <button className="table-action" onClick={() => setResultsAssessment(assessment)} title="Enter or review marks">Results</button>
                          <button className="table-action" onClick={() => openEdit(assessment)} disabled={!canEdit} title={canEdit ? 'Edit assessment' : 'Only a draft assessment without results can be edited'}>Edit</button>
                          {nextStatus && (
                            <button className="table-action assessment-next-action" onClick={() => advanceStatus(assessment)} disabled={busyId === assessment.id} title={`Move to ${assessmentStatusLabel(nextStatus)}`}>
                              {busyId === assessment.id ? <LoaderCircle size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                              {assessmentStatusLabel(nextStatus)}
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
    </>
  );
}
