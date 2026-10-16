import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Eye, LoaderCircle, Plus } from 'lucide-react';
import { formatAcademicDate, academicYearStatus, fetchAcademicYears } from './academicYearApi.js';
import AcademicYearDetailsModal from './AcademicYearDetailsModal.jsx';
import AcademicYearFormModal from './AcademicYearFormModal.jsx';

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function AcademicYearsPage({ signOut }) {
  const [years, setYears] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formYear, setFormYear] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailYear, setDetailYear] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadYears() {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAcademicYears(page);
        if (!cancelled) {
          setYears(result.data || []);
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
    loadYears();
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreate() {
    setFormYear(null);
    setFormOpen(true);
  }

  function openEdit(year) {
    setDetailYear(null);
    setFormYear(year);
    setFormOpen(true);
  }

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">School calendar</p>
          <h1 className="page-title">Academic years<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Set school-year dates, configure grading scales, choose the current year, and review term calendars.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Add academic year</button>
      </div>
      <section className="panel directory-panel academic-year-panel">
        <div className="academic-year-toolbar">
          <span className="academic-year-total">{pagination.total} {pagination.total === 1 ? 'academic year' : 'academic years'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading academic years…</span></div>
        ) : years.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">No academic years added yet</p>
            <p className="mt-1 text-xs text-muted">Create a school year to organize terms and annual results.</p>
            <button className="text-button mt-3" onClick={openCreate}>Add your first academic year</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table academic-year-table">
              <thead>
                <tr><th>Academic year</th><th>Start date</th><th>End date</th><th>Grade scale</th><th>Terms</th><th>Annual results</th><th>Period</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {years.map((year) => {
                  const status = academicYearStatus(year);
                  return (
                    <tr key={year.id}>
                      <td>
                        <div className="academic-year-name-cell">
                          <span className="academic-year-icon"><CalendarDays size={16} /></span>
                          <span className="font-medium text-ink">{year.name}</span>
                          {year.isCurrent && <span className="academic-year-current-badge">Current</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">{formatAcademicDate(year.startDate)}</td>
                      <td className="whitespace-nowrap text-muted">{formatAcademicDate(year.endDate)}</td>
                      <td className="text-muted">{year.gradeScale ? `${year.gradeScale.name} · ${year.gradeScale.maxScore === 50 ? '/ 50' : '%'}` : <span className="text-amber-700">Not configured</span>}</td>
                      <td className="text-muted">{year.terms?.length ?? 0}</td>
                      <td className="text-muted">{year._count?.annualResults ?? 0}</td>
                      <td><span className={`subject-status subject-status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span></td>
                      <td>
                        <div className="academic-year-actions">
                          <button className="table-action" onClick={() => setDetailYear(year)} aria-label={`View ${year.name}`} title="View academic-year details"><Eye size={14} /></button>
                          <button className="table-action" onClick={() => openEdit(year)}>Edit</button>
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
        <AcademicYearFormModal
          year={formYear}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={(savedYear) => {
            setFormOpen(false);
            if (detailYear?.id === savedYear.id) setDetailYear(savedYear);
            refresh();
          }}
        />
      )}
      {detailYear && (
        <AcademicYearDetailsModal
          year={detailYear}
          signOut={signOut}
          onClose={() => setDetailYear(null)}
          onEdit={openEdit}
        />
      )}
    </>
  );
}
