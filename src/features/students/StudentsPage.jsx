import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, LoaderCircle, Plus, Search, Users } from 'lucide-react';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import StatusBadge from '../directory/StatusBadge.jsx';
import StudentDetailsModal from './StudentDetailsModal.jsx';
import StudentFormModal from './StudentFormModal.jsx';
import useStudents from './useStudents.js';
import { API_BASE_URL, apiRequest, getAccessToken, getSchoolContextId } from '../../api.js';
import ClassDistributionPanel from './ClassDistributionPanel.jsx';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export default function StudentsPage({ user, signOut }) {
  const isTeacher = user.role === 'TEACHER';
  const canExportQr = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN'].includes(user.role);
  const directory = useStudents({ enabled: true, signOut });
  const { students, pagination, loading, error, search, status, academicYearId, classLevelId, classGroupId, page } = directory;
  const [classGroups, setClassGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [formStudent, setFormStudent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [updatingStudentId, setUpdatingStudentId] = useState('');
  const [actionError, setActionError] = useState('');
  const [classDistribution, setClassDistribution] = useState(null);
  const [loadingDistribution, setLoadingDistribution] = useState(!isTeacher);

  useEffect(() => {
    let cancelled = false;
    async function loadClassGroups() {
      try {
        const rows = [];
        let pageNumber = 1;
        let totalPages = 1;
        do {
          const params = new URLSearchParams({ page: String(pageNumber), limit: '100' });
          const result = await apiRequest(`/class-groups?${params}`);
          rows.push(...(result.data || []));
          totalPages = result.pagination?.totalPages || 1;
          pageNumber += 1;
        } while (pageNumber <= totalPages);
        if (!cancelled) setClassGroups(rows);
      } catch (cause) {
        if (!cancelled) setActionError(cause.message);
      }
    }
    loadClassGroups();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isTeacher) return undefined;
    let cancelled = false;
    apiRequest('/students/distribution')
      .then((result) => { if (!cancelled) setClassDistribution(result.data); })
      .catch((cause) => { if (!cancelled) setActionError(cause.message); })
      .finally(() => { if (!cancelled) setLoadingDistribution(false); });
    return () => { cancelled = true; };
  }, [isTeacher]);

  useEffect(() => {
    let cancelled = false;
    async function loadAcademicYears() {
      try {
        const years = new Map();
        let pageNumber = 1;
        let totalPages = 1;
        do {
          const params = new URLSearchParams({ page: String(pageNumber), limit: '100' });
          const result = await apiRequest(`/terms?${params}`);
          (result.data || []).forEach((term) => {
            if (term.academicYear) years.set(term.academicYear.id, term.academicYear);
          });
          totalPages = result.pagination?.totalPages || 1;
          pageNumber += 1;
        } while (pageNumber <= totalPages);
        if (!cancelled) setAcademicYears([...years.values()].sort((a, b) => b.name.localeCompare(a.name)));
      } catch (cause) {
        if (!cancelled) setActionError(cause.message);
      }
    }
    loadAcademicYears();
    return () => { cancelled = true; };
  }, []);

  const classLevels = useMemo(() => {
    const levels = new Map();
    classGroups.forEach((group) => {
      if (group.classLevel) levels.set(group.classLevel.id, group.classLevel);
    });
    return [...levels.values()].sort((a, b) => a.levelOrder - b.levelOrder);
  }, [classGroups]);
  const visibleClassGroups = classGroups.filter((group) => !classLevelId || group.classLevelId === classLevelId);

  async function downloadFilteredStudents() {
    setExporting(true);
    setActionError('');
    try {
      const rows = [];
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (academicYearId) params.set('academicYearId', academicYearId);
      if (classLevelId) params.set('classLevelId', classLevelId);
      if (classGroupId) params.set('classGroupId', classGroupId);
      const first = await apiRequest(`/students?${params}`);
      rows.push(...(first.data || []));
      for (let currentPage = 2; currentPage <= (first.pagination?.totalPages || 1); currentPage += 1) {
        params.set('page', String(currentPage));
        const result = await apiRequest(`/students?${params}`);
        rows.push(...(result.data || []));
      }
      const cell = (value) => {
        let text = value == null ? '' : String(value);
        if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const heading = ['Student', 'Admission number', 'Parent phone', 'Date of birth', 'Gender', 'Class level', 'Class group', 'Enrollment status', 'Student status'];
      const lines = [heading, ...rows.map((student) => {
        const enrollment = student.enrollments?.[0];
        return [formatName(student), student.admissionNumber, student.parents?.[0]?.parent?.phone, student.dateOfBirth?.slice(0, 10), student.gender, enrollment?.classLevel?.name, enrollment?.classGroup?.name, enrollment?.status, student.status];
      })].map((row) => row.map(cell).join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students-filtered.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setActionError(cause.message);
    } finally {
      setExporting(false);
    }
  }

  async function downloadStudentIdsWithQr() {
    setExporting(true);
    setActionError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (academicYearId) params.set('academicYearId', academicYearId);
      if (classLevelId) params.set('classLevelId', classLevelId);
      if (classGroupId) params.set('classGroupId', classGroupId);
      const headers = new Headers();
      const token = getAccessToken();
      const schoolId = getSchoolContextId();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (schoolId) headers.set('X-School-ID', schoolId);
      const response = await fetch(`${API_BASE_URL}/students/qr-export?${params}`, { headers });
      if (!response.ok) {
        let message = 'Student IDs and QR codes could not be exported.';
        try { message = (await response.json()).error?.message || message; } catch { /* use fallback */ }
        const cause = new Error(message);
        cause.status = response.status;
        throw cause;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-ids-and-qr-codes.html';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setExporting(false);
    }
  }

  function openCreate() {
    setFormStudent(null);
    setFormOpen(true);
  }

  function openEdit(student) {
    setFormStudent(student);
    setFormOpen(true);
  }

  async function updateStatus(student, nextStatus) {
    if (nextStatus === student.status) return;
    setActionError('');
    setUpdatingStudentId(student.id);
    try {
      await apiRequest(`/students/${student.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      directory.refresh();
    } catch (cause) {
      setActionError(cause.message);
    } finally {
      setUpdatingStudentId('');
    }
  }

  const noFilters = !search && !status && !academicYearId && !classLevelId && !classGroupId;

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Your school community</p>
          <h1 className="page-title">Students<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">{isTeacher ? 'View learners enrolled in your assigned classes.' : 'Keep track of every learner in your school.'}</p>
        </div>
        {!isTeacher && <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Register student</button>}
      </div>
      {actionError && <div className="notice-error" role="alert"><span>{actionError}</span><button className="text-button" onClick={() => setActionError('')}>Dismiss</button></div>}
      {!isTeacher && <ClassDistributionPanel distribution={classDistribution} loading={loadingDistribution} />}
      <section className="panel directory-panel student-directory-panel">
        <div className="student-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => directory.setSearch(event.target.value)} placeholder="Search name or admission no." aria-label="Search students" />
          </div>
          <label className="sr-only" htmlFor="student-status-filter">Filter by status</label>
          <select id="student-status-filter" className="filter-select student-status-filter" value={status} onChange={(event) => directory.setStatus(event.target.value)}>
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="student-academic-year-filter">Filter by academic year</label>
          <select id="student-academic-year-filter" className="filter-select student-status-filter" value={academicYearId} onChange={(event) => directory.setAcademicYearId(event.target.value)}>
            <option value="">All academic years</option>
            {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="student-class-level-filter">Filter by class level</label>
          <select id="student-class-level-filter" className="filter-select student-status-filter" value={classLevelId} onChange={(event) => directory.setClassLevelId(event.target.value)}>
            <option value="">All class levels</option>
            {classLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="student-class-group-filter">Filter by class group</label>
          <select id="student-class-group-filter" className="filter-select student-status-filter" value={classGroupId} onChange={(event) => directory.setClassGroupId(event.target.value)}>
            <option value="">All class groups</option>
            {visibleClassGroups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
          </select>
          <button className="secondary-button" type="button" onClick={downloadFilteredStudents} disabled={exporting || loading}>
            {exporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}{exporting ? 'Preparing…' : 'Export Excel'}
          </button>
          {canExportQr && <button className="secondary-button" type="button" onClick={downloadStudentIdsWithQr} disabled={exporting || loading}>
            {exporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}{exporting ? 'Preparing…' : 'Export IDs + QR'}
          </button>}
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'student' : 'students'}</span>
        </div>
        {error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" onClick={directory.refresh}>Try again</button>
          </div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading students…</span></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{isTeacher ? 'No students in your assigned classes' : noFilters ? 'No students registered yet' : 'No students match these filters'}</p>
            <p className="mt-1 text-xs text-muted">{isTeacher ? 'Students appear here when enrolled in one of your assigned classes.' : noFilters ? 'Add your first student to start building the school register.' : 'Try a different search or status filter.'}</p>
            {!isTeacher && noFilters && <button className="text-button mt-3" onClick={openCreate}>Register your first student</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table students-table">
              <thead>
                <tr><th>Student</th><th>Student ID</th><th>Parent phone</th><th>Class level</th><th>Class group</th><th>Date of birth</th><th>Gender</th><th>Enrolments</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="flex min-w-[180px] items-center gap-3">
                        <div className="person-avatar person-student">{initials(student) || '?'}</div>
                        <span className="whitespace-nowrap font-medium text-ink">{formatName(student)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-muted">{student.admissionNumber}</td>
                    <td className="whitespace-nowrap text-muted">{student.parents?.[0]?.parent?.phone || '—'}</td>
                    <td className="whitespace-nowrap text-muted">{student.enrollments?.[0]?.classLevel?.name || '—'}</td>
                    <td className="whitespace-nowrap text-muted">{student.enrollments?.[0]?.classGroup?.name || 'Unassigned'}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(student.dateOfBirth)}</td>
                    <td className="whitespace-nowrap text-muted">{student.gender || '—'}</td>
                    <td className="text-muted">{student._count?.enrollments ?? 0}</td>
                    <td><StatusBadge status={student.status} /></td>
                    <td>
                      <div className="student-actions">
                        <button className="table-action" onClick={() => setDetailStudent(student)} aria-label={`View ${formatName(student)}`} title="View profile"><Eye size={14} /></button>
                        {!isTeacher && <button className="table-action" onClick={() => openEdit(student)} aria-label={`Edit ${formatName(student)}`}>Edit</button>}
                        {!isTeacher && <>
                        <select
                          className="status-action"
                          aria-label={`Change status for ${formatName(student)}`}
                          value={student.status}
                          disabled={updatingStudentId === student.id}
                          onChange={(event) => updateStatus(student, event.target.value)}
                        >
                          {statuses.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                        {updatingStudentId === student.id && <LoaderCircle size={14} className="animate-spin text-green-700" />}
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!error && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button className="pagination-button" disabled={page <= 1} onClick={() => directory.setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => directory.setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
      {!isTeacher && formOpen && (
        <StudentFormModal
          student={formStudent}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            directory.refresh();
          }}
        />
      )}
      {detailStudent && <StudentDetailsModal student={detailStudent} isTeacher={isTeacher} onClose={() => setDetailStudent(null)} />}
    </>
  );
}
