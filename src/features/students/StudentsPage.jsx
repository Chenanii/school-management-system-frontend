import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, LoaderCircle, Plus, Search, Users } from 'lucide-react';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import StatusBadge from '../directory/StatusBadge.jsx';
import StudentDetailsModal from './StudentDetailsModal.jsx';
import StudentFormModal from './StudentFormModal.jsx';
import useStudents from './useStudents.js';
import { apiRequest } from '../../api.js';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export default function StudentsPage({ user, signOut }) {
  const isTeacher = user.role === 'TEACHER';
  const directory = useStudents({ enabled: true, signOut });
  const { students, pagination, loading, error, search, status, page } = directory;
  const [formStudent, setFormStudent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [updatingStudentId, setUpdatingStudentId] = useState('');
  const [actionError, setActionError] = useState('');

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

  const noFilters = !search && !status;

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
      <section className="panel directory-panel student-directory-panel">
        <div className="student-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => directory.setSearch(event.target.value)} placeholder="Search name or admission no." aria-label="Search students" />
          </div>
          {!isTeacher && <><label className="sr-only" htmlFor="student-status-filter">Filter by status</label>
          <select id="student-status-filter" className="filter-select student-status-filter" value={status} onChange={(event) => directory.setStatus(event.target.value)}>
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select></>}
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
                <tr><th>Student</th><th>Admission no.</th><th>Date of birth</th><th>Gender</th><th>Enrolments</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
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
