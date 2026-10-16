import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, LoaderCircle, X } from 'lucide-react';
import { fetchAcademicYear, formatAcademicDate } from './academicYearApi.js';

const termStatusLabels = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  MARKS_REVIEW: 'Marks review',
  FINALIZED: 'Finalized',
  PUBLISHED: 'Published',
  CLOSED: 'Closed'
};

export default function AcademicYearDetailsModal({ year, signOut, onClose, onEdit }) {
  const [details, setDetails] = useState(year);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetails = useCallback(async () => {
    setError('');
    try {
      const result = await fetchAcademicYear(year.id);
      setDetails(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut, year.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="user-modal academic-year-details-modal" role="dialog" aria-modal="true" aria-labelledby="academic-year-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Academic calendar</p>
            <h2 id="academic-year-details-title">{details.name}</h2>
            <p>{formatAcademicDate(details.startDate)} – {formatAcademicDate(details.endDate)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading academic-year details…</span></div>
        ) : error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadDetails();
            }}>Try again</button>
          </div>
        ) : (
          <div className="academic-year-detail-body">
            <div className="academic-year-summary">
              <div><strong>{details.terms?.length ?? 0}</strong><span>Terms</span></div>
              <div><strong>{details._count?.annualResults ?? 0}</strong><span>Annual results</span></div>
              <div><strong>{details.isCurrent ? 'Current' : 'Previous'}</strong><span>Year status</span></div>
              <div><strong>{details.gradeScale ? `${details.gradeScale.name} · ${details.gradeScale.maxScore === 50 ? '/ 50' : '%'}` : 'Not configured'}</strong><span>Grade scale</span></div>
            </div>
            <section className="academic-year-terms">
              <div className="class-level-section-title"><CalendarDays size={16} /><h3>Terms</h3></div>
              {details.terms?.length ? (
                <div className="academic-year-term-list">
                  {details.terms.map((term) => (
                    <article className="academic-year-term" key={term.id}>
                      <div className="academic-year-term-heading">
                        <div>
                          <strong>{term.sequence}. {term.name}</strong>
                          <span>{formatAcademicDate(term.startDate)} – {formatAcademicDate(term.endDate)}</span>
                        </div>
                        <span className={`subject-status subject-status-${term.status.toLowerCase().replace('_', '-')}`}>
                          {termStatusLabels[term.status] || term.status}
                        </span>
                      </div>
                      <div className="academic-year-term-counts">
                        <span><ClipboardList size={13} /> {term._count?.assessments ?? 0} assessments</span>
                        <span>{term._count?.enrollments ?? 0} enrolments</span>
                        <span>{term._count?.assignments ?? 0} assignments</span>
                        {term.annualWeightPercent !== null && term.annualWeightPercent !== undefined && (
                          <span>{Number(term.annualWeightPercent)}% annual weight</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="class-level-empty">No terms have been added for this academic year yet.</p>
              )}
            </section>
          </div>
        )}
        <div className="modal-actions academic-year-details-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
          <button className="primary-button" type="button" onClick={() => onEdit(details)}>Edit academic year</button>
        </div>
      </section>
    </div>
  );
}
