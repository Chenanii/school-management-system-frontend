import { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Eye, LoaderCircle, Plus, Search } from 'lucide-react';
import { apiRequest } from '../../api.js';
import FeedbackState from '../../components/FeedbackState.jsx';
import { subjectStatuses } from './subjectApi.js';
import SubjectDetailsModal from './SubjectDetailsModal.jsx';
import SubjectFormModal from './SubjectFormModal.jsx';

const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function SubjectsPage({ signOut }) {
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formSubject, setFormSubject] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailSubject, setDetailSubject] = useState(null);
  const [updatingId, setUpdatingId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        if (status) params.set('status', status);
        const result = await apiRequest(`/subjects?${params}`);
        if (!cancelled) {
          setSubjects(result.data || []);
          setPagination(result.pagination || initialPagination);
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

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [page, search, status, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function updateStatusFilter(value) {
    setStatus(value);
    setPage(1);
  }

  function openCreate() {
    setFormSubject(null);
    setFormOpen(true);
  }

  function openEdit(subject) {
    setFormSubject(subject);
    setFormOpen(true);
  }

  async function updateStatus(subject, nextStatus) {
    if (nextStatus === subject.status) return;
    setActionError('');
    setUpdatingId(subject.id);
    try {
      await apiRequest(`/subjects/${subject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      refresh();
      if (detailSubject?.id === subject.id) {
        setDetailSubject((current) => ({ ...current, status: nextStatus }));
      }
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setUpdatingId('');
    }
  }

  const hasFilters = Boolean(search.trim() || status);

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic programme</p>
          <h1 className="page-title">Subjects<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Manage your subject catalogue and class-level curriculum.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Add subject</button>
      </div>
      {actionError && (
        <div className="notice-error" role="alert">
          <span>{actionError}</span>
          <button className="text-button" onClick={() => setActionError('')}>Dismiss</button>
        </div>
      )}
      <section className="panel directory-panel subject-directory-panel">
        <div className="subject-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input
              className="search-input"
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search subject name or code"
              aria-label="Search subjects"
            />
          </div>
          <label className="sr-only" htmlFor="subject-status-filter">Filter by status</label>
          <select id="subject-status-filter" className="filter-select subject-status-filter" value={status} onChange={(event) => updateStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {subjectStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'subject' : 'subjects'}</span>
        </div>
        {error ? (
          <FeedbackState status="error" title={error} onAction={refresh} />
        ) : loading ? (
          <FeedbackState status="loading" title="Loading subjects…" />
        ) : subjects.length === 0 ? (
          <FeedbackState status="empty" icon={BookOpen} title={hasFilters ? 'No subjects match these filters' : 'No subjects added yet'} description={hasFilters ? 'Try a different search or status filter.' : 'Add your school subjects to start building the curriculum.'} actionLabel={hasFilters ? undefined : 'Add your first subject'} onAction={hasFilters ? undefined : openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table subject-table">
              <thead>
                <tr><th>Subject</th><th>Code</th><th>Class levels</th><th>Assessments</th><th>Annual results</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>
                      <div className="subject-name-cell">
                        <div className="subject-avatar"><BookOpen size={16} /></div>
                        <span className="font-medium text-ink">{subject.name}</span>
                      </div>
                    </td>
                    <td><span className="subject-code">{subject.code}</span></td>
                    <td className="text-muted">{subject._count?.classLinks ?? 0}</td>
                    <td className="text-muted">{subject._count?.assessments ?? 0}</td>
                    <td className="text-muted">{subject._count?.annualResults ?? 0}</td>
                    <td><span className={`subject-status subject-status-${subject.status.toLowerCase()}`}>{subject.status.toLowerCase()}</span></td>
                    <td>
                      <div className="subject-actions">
                        <button className="table-action" onClick={() => setDetailSubject(subject)} aria-label={`View ${subject.name} curriculum`} title="View curriculum"><Eye size={14} /></button>
                        <button className="table-action" onClick={() => openEdit(subject)}>Edit</button>
                        <select
                          className="status-action"
                          aria-label={`Change status for ${subject.name}`}
                          value={subject.status}
                          disabled={updatingId === subject.id}
                          onChange={(event) => updateStatus(subject, event.target.value)}
                        >
                          {subjectStatuses.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                        </select>
                        {updatingId === subject.id && <LoaderCircle size={14} className="animate-spin text-green-700" />}
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
              <button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
      {formOpen && (
        <SubjectFormModal
          subject={formSubject}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
      {detailSubject && (
        <SubjectDetailsModal
          subject={detailSubject}
          signOut={signOut}
          onClose={() => setDetailSubject(null)}
          onChanged={refresh}
        />
      )}
    </>
  );
}
