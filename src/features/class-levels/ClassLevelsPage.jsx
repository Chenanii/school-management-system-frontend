import { useEffect, useState } from 'react';
import { Boxes, ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react';
import { apiRequest } from '../../api.js';
import FeedbackState from '../../components/FeedbackState.jsx';
import ClassLevelDetailsModal from './ClassLevelDetailsModal.jsx';
import ClassLevelFormModal from './ClassLevelFormModal.jsx';
import { fetchAllClassLevels } from './classLevelApi.js';

const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function ClassLevelsPage({ signOut, onNavigate }) {
  const [levels, setLevels] = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState('');
  const [allLevelsError, setAllLevelsError] = useState('');
  const [gradeScales, setGradeScales] = useState([]);
  const [gradeScalesError, setGradeScalesError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formLevel, setFormLevel] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailLevel, setDetailLevel] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPage() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        const result = await apiRequest(`/class-levels?${params}`);
        if (!cancelled) {
          setLevels(result.data || []);
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
    }
    loadPage();
    return () => {
      cancelled = true;
    };
  }, [page, search, refreshKey, signOut]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    setAllLevelsError('');
    fetchAllClassLevels()
      .then((result) => {
        if (!cancelled) setAllLevels(result);
      })
      .catch((cause) => {
        if (!cancelled) {
          setAllLevelsError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAll(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, signOut]);

  useEffect(() => {
    let cancelled = false;
    setGradeScalesError('');
    apiRequest('/grade-scales')
      .then((result) => { if (!cancelled) setGradeScales(result.data || []); })
      .catch((cause) => {
        if (!cancelled) setGradeScalesError(cause.message);
        if (cause.status === 401) signOut();
      });
    return () => { cancelled = true; };
  }, [refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setFormLevel(null);
    setFormOpen(true);
  }

  function openEdit(level) {
    setDetailLevel(null);
    setFormLevel(level);
    setFormOpen(true);
  }

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic structure</p>
          <h1 className="page-title">Class levels<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Organize grade levels and define learner progression through the school.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate} disabled={loadingAll}>
          <Plus size={17} /> Add class level
        </button>
      </div>
      {allLevelsError && (
        <div className="notice-error" role="alert">
          <span>Progression choices could not be loaded: {allLevelsError}</span>
          <button className="text-button" onClick={refresh}>Try again</button>
        </div>
      )}
      {gradeScalesError && <div className="notice-error mb-4" role="alert"><span>Grading scales could not be loaded: {gradeScalesError}</span><button className="text-button" onClick={refresh}>Try again</button></div>}
      {!gradeScalesError && gradeScales.length === 0 && <div className="teaching-assignment-notice mb-4" role="status"><span>Create at least one grading scale before calculating student results.</span><button className="text-button" type="button" onClick={() => onNavigate('grading-scales')}>Set up grading scales</button></div>}
      {!gradeScalesError && gradeScales.length > 1 && allLevels.some((level) => !level.gradeScaleId) && <div className="teaching-assignment-notice mb-4" role="status"><span>Assign a grading scale to every class level. Results cannot be calculated for levels without a selected scale.</span></div>}
      <section className="panel directory-panel class-level-panel">
        <div className="class-level-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input
              className="search-input"
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search class levels"
              aria-label="Search class levels"
            />
          </div>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'class level' : 'class levels'}</span>
        </div>
        {error ? (
          <FeedbackState status="error" title={error} onAction={refresh} />
        ) : loading ? (
          <FeedbackState status="loading" title="Loading class levels…" />
        ) : levels.length === 0 ? (
          <FeedbackState status="empty" icon={Boxes} title={search.trim() ? 'No class levels match this search' : 'No class levels added yet'} description={search.trim() ? 'Try another class-level name.' : 'Add the grade levels used by your school.'} actionLabel={search.trim() ? undefined : 'Add your first class level'} onAction={search.trim() ? undefined : openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table class-level-table">
              <thead>
                <tr><th>Order</th><th>Class level</th><th>Grading scale</th><th>Class groups</th><th>Subjects</th><th>Previous levels</th><th>Next level</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td><span className="class-level-order">{level.levelOrder}</span></td>
                    <td>
                      <div className="class-level-name-cell">
                        <span className="class-level-marker" />
                        <span className="font-medium text-ink">{level.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{level.gradeScale ? `${level.gradeScale.name} · ${level.gradeScale.maxScore === 50 ? '/ 50' : '%'}` : gradeScales.length === 1 ? `${gradeScales[0].name} · ${gradeScales[0].maxScore === 50 ? '/ 50' : '%'} (automatic)` : <span className="text-amber-700">Not assigned</span>}</td>
                    <td className="text-muted">{level._count?.groups ?? 0}</td>
                    <td className="text-muted">{level._count?.subjects ?? 0}</td>
                    <td className="text-muted">{level._count?.previousLevels ?? 0}</td>
                    <td className="whitespace-nowrap text-muted">{level.nextLevel ? `${level.nextLevel.levelOrder}. ${level.nextLevel.name}` : '-'}</td>
                    <td>
                      <div className="class-level-actions">
                        <button className="table-action" onClick={() => setDetailLevel(level)} aria-label={`View ${level.name}`} title="View class-level details"><Eye size={14} /></button>
                        <button className="table-action" onClick={() => openEdit(level)}>Edit</button>
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
        <ClassLevelFormModal
          level={formLevel}
          levels={allLevels}
          signOut={signOut}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
      {detailLevel && (
        <ClassLevelDetailsModal
          level={detailLevel}
          signOut={signOut}
          onClose={() => setDetailLevel(null)}
          onEdit={openEdit}
        />
      )}
    </>
  );
}
