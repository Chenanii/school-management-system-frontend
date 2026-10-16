import { useEffect, useState } from 'react';
import { Boxes, ChevronLeft, ChevronRight, Eye, LoaderCircle, Plus, Search, UsersRound } from 'lucide-react';
import { apiRequest } from '../../api.js';
import ClassGroupDetailsModal from './ClassGroupDetailsModal.jsx';
import ClassGroupFormModal from './ClassGroupFormModal.jsx';
import { fetchAllPages, formatClassLevel } from './classGroupApi.js';

const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function ClassGroupsPage({ signOut }) {
  const [groups, setGroups] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [levelsError, setLevelsError] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formGroup, setFormGroup] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingLevels(true);
    setLevelsError('');
    fetchAllPages('/class-levels')
      .then((levels) => {
        if (!cancelled) {
          setClassLevels(levels.sort((left, right) => left.levelOrder - right.levelOrder));
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setLevelsError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLevels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, signOut]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        if (classLevelId) params.set('classLevelId', classLevelId);
        const result = await apiRequest(`/class-groups?${params}`);
        if (!cancelled) {
          setGroups(result.data || []);
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
  }, [page, search, classLevelId, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setFormGroup(null);
    setFormOpen(true);
  }

  function openEdit(group) {
    setDetailGroup(null);
    setFormGroup(group);
    setFormOpen(true);
  }

  const hasFilters = Boolean(search.trim() || classLevelId);

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic structure</p>
          <h1 className="page-title">Class groups<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Organize streams and sections within each class level.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingLevels || Boolean(levelsError) || classLevels.length === 0}>
          <Plus size={17} /> Add class group
        </button>
      </div>
      {levelsError && (
        <div className="notice-error" role="alert">
          <span>Class levels could not be loaded: {levelsError}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      <section className="panel directory-panel class-group-panel">
        <div className="class-group-toolbar">
          <div className="relative w-full sm:max-w-[300px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search group or class level" aria-label="Search class groups" />
          </div>
          <label className="sr-only" htmlFor="class-group-level-filter">Filter by class level</label>
          <select id="class-group-level-filter" className="filter-select class-group-level-filter" value={classLevelId} onChange={(event) => { setClassLevelId(event.target.value); setPage(1); }} disabled={loadingLevels}>
            <option value="">All class levels</option>
            {classLevels.map((level) => <option value={level.id} key={level.id}>{formatClassLevel(level)}</option>)}
          </select>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'class group' : 'class groups'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading class groups…</span></div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><UsersRound size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No class groups match these filters' : 'No class groups added yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasFilters ? 'Try another search or class level.' : 'Create groups such as streams or sections within a class level.'}</p>
            {!hasFilters && <button className="text-button mt-3" onClick={openCreate} disabled={loadingLevels || Boolean(levelsError) || classLevels.length === 0}>Add your first class group</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table class-group-table">
              <thead>
                <tr><th>Class group</th><th>Class level</th><th>Enrolments</th><th>Teaching assignments</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <div className="class-group-name-cell">
                        <span className="class-group-icon"><UsersRound size={16} /></span>
                        <span className="font-medium text-ink">{group.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="class-group-level-cell">
                        <span className="class-group-level-marker"><Boxes size={14} /></span>
                        <span>{formatClassLevel(group.classLevel)}</span>
                      </div>
                    </td>
                    <td className="text-muted">{group._count?.enrollments ?? 0}</td>
                    <td className="text-muted">{group._count?.assignments ?? 0}</td>
                    <td className="whitespace-nowrap text-muted">
                      {group.createdAt && !Number.isNaN(new Date(group.createdAt).getTime())
                        ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(group.createdAt))
                        : '—'}
                    </td>
                    <td>
                      <div className="class-group-actions">
                        <button className="table-action" onClick={() => setDetailGroup(group)} aria-label={`View ${group.name}`} title="View group details"><Eye size={14} /></button>
                        <button className="table-action" onClick={() => openEdit(group)}>Edit</button>
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
        <ClassGroupFormModal
          group={formGroup}
          classLevels={classLevels}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
      {detailGroup && (
        <ClassGroupDetailsModal
          group={detailGroup}
          signOut={signOut}
          onClose={() => setDetailGroup(null)}
          onEdit={openEdit}
        />
      )}
    </>
  );
}
