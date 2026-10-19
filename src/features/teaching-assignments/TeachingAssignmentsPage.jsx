import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, LoaderCircle, Plus, Search, Trash2, Users } from 'lucide-react';
import { apiRequest } from '../../api.js';
import TeachingAssignmentFormModal from './TeachingAssignmentFormModal.jsx';
import FormTutorAssignmentsModal from './FormTutorAssignmentsModal.jsx';
import {
  deleteAssignment,
  fetchAllPages,
  fetchAssignments,
  formatAssignmentClass,
  teacherDisplayName
} from './teachingAssignmentApi.js';

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function TeachingAssignmentsPage({ signOut }) {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formAssignment, setFormAssignment] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formTutorModalOpen, setFormTutorModalOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const [teacherData, groupData, classSubjectData, subjectData, termData] = await Promise.all([
          fetchAllPages('/teachers'),
          fetchAllPages('/class-groups'),
          fetchAllPages('/class-subjects'),
          fetchAllPages('/subjects'),
          fetchAllPages('/terms')
        ]);
        if (!cancelled) {
          setTeachers(teacherData);
          setClassGroups(groupData);
          setClassSubjects(classSubjectData);
          setSubjects(subjectData);
          setTerms(termData);
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
    async function loadAssignments() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAssignments({
          page,
          teacherId: teacherFilter,
          classGroupId: groupFilter,
          termId: termFilter
        });
        if (!cancelled) {
          setAssignments(result.data || []);
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
    }
    loadAssignments();
    return () => {
      cancelled = true;
    };
  }, [page, teacherFilter, groupFilter, termFilter, refreshKey, signOut]);

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers]);
  const termMap = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);
  const filteredAssignments = useMemo(() => {
    const query = quickSearch.trim().toLocaleLowerCase();
    if (!query) return assignments;
    return assignments.filter((assignment) => {
      const teacher = teacherMap.get(assignment.teacherId);
      const text = [
        teacherDisplayName(teacher),
        teacher?.email,
        assignment.classGroup?.name,
        assignment.classGroup?.classLevel?.name,
        assignment.subjectStream?.name,
        assignment.subject?.name,
        assignment.subject?.code,
        assignment.term?.name,
        termMap.get(assignment.termId)?.academicYear?.name
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return text.includes(query);
    });
  }, [assignments, quickSearch, teacherMap, termMap]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreate() {
    setFormAssignment(null);
    setFormOpen(true);
  }

  function openEdit(assignment) {
    setFormAssignment(assignment);
    setFormOpen(true);
  }

  function clearFilters() {
    setTeacherFilter('');
    setGroupFilter('');
    setTermFilter('');
    setQuickSearch('');
    setPage(1);
  }

  async function removeAssignment(assignment) {
    if (assignment._count?.assessments > 0) return;
    const teacherName = teacherDisplayName(teacherMap.get(assignment.teacherId));
    const scope = assignment.classGroup ? formatAssignmentClass(assignment.classGroup) : `${assignment.subjectStream?.classLevel?.name || 'Class level'} · ${assignment.subject?.name || 'Subject'} ${assignment.subjectStream?.name || ''}`.trim();
    if (!window.confirm(`Delete the teaching assignment for ${teacherName} in ${scope} for the full academic year? This removes its allocations for all three terms.`)) return;
    setNotice('');
    setBusyId(assignment.id);
    try {
      await deleteAssignment(assignment.id);
      setNotice({ message: 'Teaching assignment deleted for the full academic year.', error: false });
      refresh();
    } catch (cause) {
      setNotice({ message: cause.message, error: true });
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  const hasFilters = Boolean(teacherFilter || groupFilter || termFilter || quickSearch.trim());

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic programme</p>
          <h1 className="page-title">Teaching assignments<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">A teacher assignment covers the academic year. If a teacher changes, the replacement takes over from the selected term onward, while earlier terms keep their teacher. Existing assessments and student subject-stream records remain term-specific.</p>
          <p className="mt-2 text-sm text-muted">Teachers can be assigned to a required class subject or to a named section of an elective subject, such as Mathematics Core · A. Select students for each term under Enrollments → Subject streams.</p>
          <p className="mt-2 text-sm text-muted">Subject sections are attached to a class level. Students keep their home class group and join a separate section for each subject.</p>
          <p className="mt-2 text-sm text-muted">The list shows one term allocation per row so assessment history, teacher changes, and student stream rosters stay term-specific.</p>
        </div>
        <div className="teaching-assignment-header-actions">
          <button className="secondary-button" type="button" onClick={() => setFormTutorModalOpen(true)} disabled={loadingOptions || Boolean(optionsError)}>Form tutor assignments</button>
          <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingOptions || Boolean(optionsError)}><Plus size={17} /> Create assignment</button>
        </div>
      </div>
      {optionsError && (
        <div className="notice-error" role="alert">
          <span>Assignment choices could not be loaded: {optionsError}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      {notice && (
        <div className={notice.error ? 'notice-error' : 'teaching-assignment-notice'} role={notice.error ? 'alert' : 'status'}>
          <span>{notice.message}</span>
          <button className="text-button" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}
      <section className="panel directory-panel teaching-assignment-panel">
        <div className="teaching-assignment-toolbar">
          <div className="relative teaching-assignment-search">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={quickSearch} onChange={(event) => setQuickSearch(event.target.value)} placeholder="Search visible assignments" aria-label="Search visible assignments" />
          </div>
          <label className="sr-only" htmlFor="assignment-teacher-filter">Filter by teacher</label>
          <select id="assignment-teacher-filter" className="filter-select" value={teacherFilter} onChange={(event) => { setTeacherFilter(event.target.value); setPage(1); }}>
            <option value="">All teachers</option>
            {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacherDisplayName(teacher)}</option>)}
          </select>
          <label className="sr-only" htmlFor="assignment-group-filter">Filter by class group</label>
          <select id="assignment-group-filter" className="filter-select" value={groupFilter} onChange={(event) => { setGroupFilter(event.target.value); setPage(1); }}>
            <option value="">All class groups</option>
            {classGroups.map((group) => <option value={group.id} key={group.id}>{formatAssignmentClass(group)}</option>)}
          </select>
          <label className="sr-only" htmlFor="assignment-term-filter">Filter by term</label>
          <select id="assignment-term-filter" className="filter-select" value={termFilter} onChange={(event) => { setTermFilter(event.target.value); setPage(1); }}>
            <option value="">All terms</option>
            {terms.map((term) => <option value={term.id} key={term.id}>{term.academicYear?.name || 'Academic year'} · {term.sequence}. {term.name}</option>)}
          </select>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'term allocation' : 'term allocations'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading || loadingOptions ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading teaching assignments…</span></div>
        ) : filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No assignments match these filters' : 'No teaching assignments yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasFilters ? 'Try changing the filters or search terms.' : 'Create an assignment to connect a teacher with a class, subject, and term.'}</p>
            {hasFilters
              ? <button className="text-button mt-3" onClick={clearFilters}>Clear filters</button>
              : <button className="text-button mt-3" onClick={openCreate}>Create the first assignment</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table teaching-assignment-table">
              <thead>
                <tr><th>Teacher</th><th>Teaching group</th><th>Subject / section</th><th>Term</th><th>Assessments</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const teacher = teacherMap.get(assignment.teacherId);
                  const assessments = assignment._count?.assessments ?? 0;
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <div className="teaching-assignment-identity">
                          <span className="teaching-assignment-icon"><Users size={15} /></span>
                          <div><strong>{teacherDisplayName(teacher)}</strong><span>{teacher?.staffNumber || teacher?.email || 'Teacher profile'}</span></div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">{assignment.classGroup ? formatAssignmentClass(assignment.classGroup) : assignment.subjectStream?.classLevel?.name || 'Class level'}</td>
                      <td>
                        <div className="teaching-assignment-identity">
                          <span className="teaching-assignment-subject-icon"><BookOpen size={14} /></span>
                          <div><strong>{assignment.subject?.name || 'Subject'}{assignment.subjectStream?.name ? ` · ${assignment.subjectStream.name}` : ''}</strong><span>{assignment.subject?.code || 'Class subject'}{assignment.subjectStream?.classLevel?.name ? ` · ${assignment.subjectStream.classLevel.name}` : ''}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="teaching-assignment-identity">
                          <span className="teaching-assignment-term-icon"><CalendarDays size={14} /></span>
                          <div><strong>{assignment.term?.name || 'Term'}</strong><span>{termMap.get(assignment.termId)?.academicYear?.name || 'Academic year'}</span></div>
                        </div>
                      </td>
                      <td><span className="teaching-assessment-count"><ClipboardList size={14} /> {assessments}</span></td>
                      <td>
                        <div className="teaching-assignment-actions">
                          <button className="table-action" onClick={() => openEdit(assignment)}>Edit</button>
                          <button className="table-action teaching-assignment-delete" onClick={() => removeAssignment(assignment)} disabled={assessments > 0 || busyId === assignment.id} title={assessments > 0 ? 'Cannot delete while assessments exist' : 'Delete assignment'}>
                            {busyId === assignment.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!error && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
      {formOpen && (
        <TeachingAssignmentFormModal
          assignment={formAssignment}
          teachers={teachers}
          classGroups={classGroups}
          classSubjects={classSubjects}
          subjects={subjects}
          terms={terms}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice({ message: formAssignment ? 'Teaching assignment updated for the academic year.' : 'Teaching assignment created for all three terms.', error: false });
            refresh();
          }}
        />
      )}
      {formTutorModalOpen && <FormTutorAssignmentsModal teachers={teachers} terms={terms} signOut={signOut} onNotice={setNotice} onClose={() => setFormTutorModalOpen(false)} />}
    </>
  );
}
