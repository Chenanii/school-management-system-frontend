import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import PeopleTable from './PeopleTable.jsx';

export default function DirectoryPage({
  type,
  people,
  loading,
  error,
  onRetry,
  search,
  setSearch,
  page,
  setPage,
  total,
  totalPages,
  onViewAssignments
}) {
  const isStudent = type === 'students';

  return (
    <>
      <div className="welcome-row directory-welcome">
        <div>
          <p className="eyebrow">Your school community</p>
          <h1 className="page-title">{isStudent ? 'Students' : 'Staff'}<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">{isStudent
            ? 'Keep track of every learner in your school.'
            : onViewAssignments
              ? 'Select a teacher’s name to review their class and subject assignments.'
              : 'Meet the people who make your school special.'}</p>
        </div>
        <div className="directory-count"><span>{total}</span><span>{isStudent ? 'students' : 'staff members'}</span></div>
      </div>
      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${isStudent ? 'students' : 'staff'}…`} aria-label={`Search ${isStudent ? 'students' : 'staff'}`} />
          </div>
          <span className="text-xs text-muted">{total === 0 ? 'No records' : `Showing ${Math.min((page - 1) * 20 + 1, total)}–${Math.min(page * 20, total)} of ${total}`}</span>
        </div>
        <PeopleTable people={people} type={type} loading={loading} error={error} onRetry={onRetry} onViewAssignments={onViewAssignments} />
        {!error && totalPages > 1 && (
          <div className="pagination">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
