import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Eye, LoaderCircle, Plus, Users } from 'lucide-react';
import { fetchAllPages, fetchTerms, formatTermDate, termStatusLabel, termStatuses, termTransitions, updateTermStatus } from './termApi.js';
import TermDetailsModal from './TermDetailsModal.jsx';
import TermFormModal from './TermFormModal.jsx';
import ToastMessage from '../../components/ToastMessage.jsx';

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function TermsPage({ user, signOut }) {
  const [terms, setTerms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [academicYearId, setAcademicYearId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(true);
  const [yearsError, setYearsError] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formTerm, setFormTerm] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTerm, setDetailTerm] = useState(null);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingYears(true);
    setYearsError('');
    fetchAllPages('/academic-years')
      .then((years) => {
        if (!cancelled) {
          setAcademicYears(years.sort((left, right) => new Date(left.startDate) - new Date(right.startDate)));
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setYearsError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingYears(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, signOut]);

  useEffect(() => {
    let cancelled = false;
    async function loadTerms() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchTerms({ page, academicYearId, status });
        if (!cancelled) {
          setTerms(result.data || []);
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
    loadTerms();
    return () => {
      cancelled = true;
    };
  }, [page, academicYearId, status, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreate() {
    setFormTerm(null);
    setFormOpen(true);
  }

  function openEdit(term) {
    setDetailTerm(null);
    setFormTerm(term);
    setFormOpen(true);
  }

  async function changeStatus(term, nextStatus) {
    setActionError('');
    setActionNotice('');
    setBusyId(term.id);
    try {
      const result = await updateTermStatus(term.id, nextStatus);
      setActionNotice(`${term.name} moved to ${termStatusLabel(result.data.status)}.`);
      if (detailTerm?.id === term.id) setDetailTerm(result.data);
      refresh();
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusyId('');
    }
  }

  const hasFilters = Boolean(academicYearId || status);

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">School calendar</p>
          <h1 className="page-title">Terms<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Manage term dates and guide each term through the results workflow.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingYears || Boolean(yearsError) || academicYears.length === 0}>
          <Plus size={17} /> Add term
        </button>
      </div>
      {yearsError && (
        <div className="notice-error" role="alert">
          <span>Academic years could not be loaded: {yearsError}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      {actionError && <ToastMessage onDismiss={() => setActionError('')}>{actionError}</ToastMessage>}
      {actionNotice && <ToastMessage type="success" onDismiss={() => setActionNotice('')}>{actionNotice}</ToastMessage>}
      <section className="panel directory-panel term-panel">
        <div className="term-toolbar">
          <label className="sr-only" htmlFor="term-year-filter">Filter by academic year</label>
          <select id="term-year-filter" className="filter-select" value={academicYearId} onChange={(event) => { setAcademicYearId(event.target.value); setPage(1); }}>
            <option value="">All academic years</option>
            {academicYears.map((year) => <option value={year.id} key={year.id}>{year.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="term-status-filter">Filter by term status</label>
          <select id="term-status-filter" className="filter-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {termStatuses.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'term' : 'terms'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading || loadingYears ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading terms…</span></div>
        ) : terms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No terms match these filters' : 'No terms have been added yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasFilters ? 'Try changing the academic year or term status.' : 'Create academic years first, then define their terms and dates.'}</p>
            {hasFilters
              ? <button className="text-button mt-3" onClick={() => { setAcademicYearId(''); setStatus(''); setPage(1); }}>Clear filters</button>
              : <button className="text-button mt-3" onClick={openCreate} disabled={academicYears.length === 0}>Add the first term</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table term-table">
              <thead>
                <tr><th>Term</th><th>Academic year</th><th>Dates</th><th>Status</th><th>Assessments</th><th>Enrolments</th><th>Assignments</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {terms.map((term) => {
                  const transitions = (termTransitions[term.status] || []).filter((nextStatus) => nextStatus !== 'FINALIZED' || user?.role === 'HEADTEACHER');
                  return (
                    <tr key={term.id}>
                      <td data-label="Term">
                        <div className="term-name-cell">
                          <span className="term-sequence">{term.sequence}</span>
                          <span className="font-medium text-ink">{term.name}</span>
                        </div>
                      </td>
                      <td data-label="Academic year" className="whitespace-nowrap text-muted">{term.academicYear?.name || '—'}</td>
                      <td data-label="Dates" className="whitespace-nowrap text-muted">{formatTermDate(term.startDate)} – {formatTermDate(term.endDate)}</td>
                      <td data-label="Status">
                        <div className="term-status-cell">
                          <span className={`subject-status subject-status-${term.status.toLowerCase().replace('_', '-')}`}>{termStatusLabel(term.status)}</span>
                          {transitions.length > 0 && (
                            <select
                              className="term-status-action"
                              aria-label={`Change status for ${term.name}`}
                              value=""
                              disabled={busyId === term.id}
                              onChange={(event) => changeStatus(term, event.target.value)}
                            >
                              <option value="">Next…</option>
                              {transitions.map((nextStatus) => <option value={nextStatus} key={nextStatus}>{termStatusLabel(nextStatus)}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                      <td data-label="Assessments"><span className="term-count"><ClipboardList size={13} /> {term._count?.assessments ?? 0}</span></td>
                      <td data-label="Enrolments"><span className="term-count"><Users size={13} /> {term._count?.enrollments ?? 0}</span></td>
                      <td data-label="Assignments" className="text-muted">{term._count?.assignments ?? 0}</td>
                      <td data-label="Actions"><button className="table-action" onClick={() => setDetailTerm(term)} aria-label={`View ${term.name}`} title="View term details"><Eye size={14} /></button></td>
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
        <TermFormModal
          term={formTerm}
          academicYears={academicYears}
          initialAcademicYearId={academicYearId}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
      {detailTerm && (
        <TermDetailsModal
          term={detailTerm}
          user={user}
          signOut={signOut}
          onClose={() => setDetailTerm(null)}
          onEdit={openEdit}
          onStatusChanged={(updated) => {
            setDetailTerm(updated);
            setActionNotice(`${updated.name} moved to ${termStatusLabel(updated.status)}.`);
            refresh();
          }}
        />
      )}
    </>
  );
}
