import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History, LoaderCircle, Search } from 'lucide-react';
import { apiRequest } from '../../api.js';

const emptyPagination = { page: 1, limit: 25, total: 0, totalPages: 1 };

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function displayAction(action) {
  return (action || 'ADMIN_ACTION').toLowerCase().replaceAll('_', ' ');
}

export default function AuditLogsPage({ signOut }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search.trim()) params.set('search', search.trim());
      if (entityType) params.set('entityType', entityType);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      try {
        const result = await apiRequest(`/audit-logs?${params}`);
        if (!cancelled) {
          setLogs(result.data || []);
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
    load();
    return () => { cancelled = true; };
  }, [page, search, entityType, from, to, refreshKey, signOut]);

  const clearFilters = () => { setSearch(''); setEntityType(''); setFrom(''); setTo(''); setPage(1); };

  return (
    <>
      <div className="welcome-row students-welcome">
        <div><p className="eyebrow">Administration</p><h1 className="page-title">Audit log<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Review administrative changes and requests across this school.</p></div>
        <span className="student-total">{pagination.total} records</span>
      </div>
      <section className="panel directory-panel audit-log-panel">
        <div className="enrollment-toolbar">
          <div className="relative enrollment-search"><Search size={17} className="search-icon" /><input className="search-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search user, action, or record" aria-label="Search audit log" /></div>
          <select className="filter-select" aria-label="Filter by record type" value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }}>
            <option value="">All record types</option>
            {['Student', 'Enrollment', 'Teacher', 'User', 'Assessment', 'AssessmentResult', 'ReportPublication', 'AcademicYear', 'Term', 'ClassLevel', 'ClassGroup', 'ClassSubject', 'Subject', 'TeachingAssignment', 'PromotionBatch', 'AdminApiRequest'].map((type) => <option key={type} value={type}>{type.replaceAll(/([A-Z])/g, ' $1').trim()}</option>)}
          </select>
          <label className="audit-date-filter">From<input className="filter-select" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
          <label className="audit-date-filter">To<input className="filter-select" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
          <button className="text-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
        {error ? <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div>
          : loading ? <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading audit records…</span></div>
            : logs.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><History size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No audit records found</p><p className="mt-1 text-xs text-muted">Try changing the filters, or check again after an administrative action.</p></div>
              : <div className="overflow-x-auto"><table className="people-table audit-log-table"><thead><tr><th>Date and time</th><th>Administrator</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>
                {logs.map((log) => <tr key={log.id}>
                  <td className="whitespace-nowrap text-muted">{formatDate(log.createdAt)}</td>
                  <td><div className="audit-actor"><strong>{[log.actor?.firstName, log.actor?.lastName].filter(Boolean).join(' ') || 'Former user'}</strong><span>{log.actor?.email || log.actor?.role?.replaceAll('_', ' ') || 'Account removed'}</span></div></td>
                  <td><span className="audit-action">{displayAction(log.action)}</span></td>
                  <td><div className="audit-entity"><strong>{log.entityType}</strong><span>{log.entityId}</span>{log.school && <small>{log.school.name}</small>}</div></td>
                  <td><details className="audit-details"><summary>View changes</summary><div className="audit-json-grid">{log.oldValues != null && <div><strong>Before</strong><pre>{JSON.stringify(log.oldValues, null, 2)}</pre></div>}<div><strong>After / request</strong><pre>{JSON.stringify(log.newValues ?? {}, null, 2)}</pre></div></div>{(log.ipAddress || log.userAgent) && <small>{log.ipAddress || 'IP unavailable'}{log.userAgent ? ` · ${log.userAgent}` : ''}</small>}</details></td>
                </tr>)}
              </tbody></table></div>}
        {!loading && !error && pagination.totalPages > 1 && <div className="pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>}
      </section>
    </>
  );
}
