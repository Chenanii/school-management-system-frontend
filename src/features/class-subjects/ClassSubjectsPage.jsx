import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Boxes, ChevronLeft, ChevronRight, LoaderCircle, Network, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api.js';
import ClassSubjectFormModal from './ClassSubjectFormModal.jsx';
import { fetchAllPages } from './classSubjectApi.js';

const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

function levelName(level) {
  return `${level.levelOrder}. ${level.name}`;
}

function formatCreatedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function ClassSubjectsPage({ signOut }) {
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [levelsError, setLevelsError] = useState('');
  const [subjectsError, setSubjectsError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [removingId, setRemovingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    setLevelsError('');
    setSubjectsError('');
    Promise.all([
      fetchAllPages('/class-levels').catch((cause) => {
        if (!cancelled) {
          setLevelsError(cause.message);
          if (cause.status === 401) signOut();
        }
        return null;
      }),
      fetchAllPages('/subjects').catch((cause) => {
        if (!cancelled) {
          setSubjectsError(cause.message);
          if (cause.status === 401) signOut();
        }
        return null;
      })
    ]).then(([classLevels, allSubjects]) => {
      if (cancelled) return;
      if (classLevels) setLevels(classLevels.sort((left, right) => left.levelOrder - right.levelOrder));
      if (allSubjects) setSubjects(allSubjects);
    }).finally(() => {
      if (!cancelled) setLoadingOptions(false);
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
        if (subjectId) params.set('subjectId', subjectId);
        const result = await apiRequest(`/class-subjects?${params}`);
        if (!cancelled) {
          setLinks(result.data || []);
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
  }, [page, search, classLevelId, subjectId, refreshKey, signOut]);

  const activeSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === 'ACTIVE'),
    [subjects]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  async function removeLink(link) {
    const label = `${link.classLevel.name} — ${link.subject.name}`;
    if (!window.confirm(`Remove ${link.subject.name} from ${link.classLevel.name}?`)) return;
    setActionError('');
    setRemovingId(link.id);
    try {
      await apiRequest(`/class-subjects/${link.id}`, { method: 'DELETE' });
      refresh();
    } catch (cause) {
      setActionError(cause.message || `Could not remove ${label}.`);
      if (cause.status === 401) signOut();
    } finally {
      setRemovingId('');
    }
  }

  const hasFilters = Boolean(search.trim() || classLevelId || subjectId);
  const canCreate = !loadingOptions && !levelsError && !subjectsError && levels.length > 0 && activeSubjects.length > 0;

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic programme</p>
          <h1 className="page-title">Class subjects<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Build the curriculum by linking active subjects to class levels.</p>
        </div>
        <button className="primary-button add-user-button" onClick={() => setFormOpen(true)} disabled={!canCreate}>
          <Plus size={17} /> Link subject
        </button>
      </div>
      {(levelsError || subjectsError) && (
        <div className="notice-error" role="alert">
          <span>{levelsError && `Class levels: ${levelsError}`}{levelsError && subjectsError ? ' · ' : ''}{subjectsError && `Subjects: ${subjectsError}`}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      {actionError && (
        <div className="notice-error" role="alert">
          <span>{actionError}</span>
          <button className="text-button" onClick={() => setActionError('')}>Dismiss</button>
        </div>
      )}
      <section className="panel directory-panel class-subject-panel">
        <div className="class-subject-toolbar">
          <div className="relative w-full sm:max-w-[280px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search subjects or levels" aria-label="Search class subjects" />
          </div>
          <label className="sr-only" htmlFor="class-subject-level-filter">Filter by class level</label>
          <select id="class-subject-level-filter" className="filter-select" value={classLevelId} onChange={(event) => { setClassLevelId(event.target.value); setPage(1); }} disabled={loadingOptions}>
            <option value="">All class levels</option>
            {levels.map((level) => <option value={level.id} key={level.id}>{levelName(level)}</option>)}
          </select>
          <label className="sr-only" htmlFor="class-subject-subject-filter">Filter by subject</label>
          <select id="class-subject-subject-filter" className="filter-select" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setPage(1); }} disabled={loadingOptions}>
            <option value="">All subjects</option>
            {subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.code} — {subject.name}</option>)}
          </select>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'link' : 'links'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading curriculum links…</span></div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Network size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No curriculum links match these filters' : 'No class subjects linked yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasFilters ? 'Try changing the search or filters.' : 'Link active subjects to the levels where they are taught.'}</p>
            {!hasFilters && <button className="text-button mt-3" disabled={!canCreate} onClick={() => setFormOpen(true)}>Create the first class subject link</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table class-subject-table">
              <thead>
                <tr><th>Class level</th><th>Subject</th><th>Subject status</th><th>Teaching assignments</th><th>Added</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <div className="class-subject-identity">
                        <span className="class-subject-level-icon"><Boxes size={15} /></span>
                        <div><strong>{link.classLevel.name}</strong><span>Level order {link.classLevel.levelOrder}</span></div>
                      </div>
                    </td>
                    <td>
                      <div className="class-subject-identity">
                        <span className="class-subject-book-icon"><BookOpen size={15} /></span>
                        <div><strong>{link.subject.name}</strong><span>{link.subject.code}</span></div>
                      </div>
                    </td>
                    <td><span className={`subject-status subject-status-${link.subject.status.toLowerCase()}`}>{link.subject.status.toLowerCase()}</span></td>
                    <td className="text-muted">{link._count?.assignments ?? 0}</td>
                    <td className="whitespace-nowrap text-muted">{formatCreatedDate(link.createdAt)}</td>
                    <td>
                      <button
                        className="table-action class-subject-remove"
                        type="button"
                        onClick={() => removeLink(link)}
                        disabled={Boolean(removingId) || (link._count?.assignments ?? 0) > 0}
                        aria-label={`Remove ${link.subject.name} from ${link.classLevel.name}`}
                        title={(link._count?.assignments ?? 0) > 0 ? 'Remove or reassign teaching assignments first' : 'Remove curriculum link'}
                      >
                        {removingId === link.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Remove
                      </button>
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
        <ClassSubjectFormModal
          classLevels={levels}
          subjects={activeSubjects}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
