import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, LoaderCircle, Users, X } from 'lucide-react';
import { fetchTerm, formatTermDate, termStatusLabel, termTransitions, updateTermStatus } from './termApi.js';

export default function TermDetailsModal({ term, signOut, onClose, onEdit, onStatusChanged }) {
  const [details, setDetails] = useState(term);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDetails = useCallback(async () => {
    setError('');
    try {
      const result = await fetchTerm(term.id);
      setDetails(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut, term.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function changeStatus(status) {
    setActionError('');
    setBusy(true);
    try {
      const result = await updateTermStatus(details.id, status);
      setDetails(result.data);
      onStatusChanged(result.data);
    } catch (cause) {
      setActionError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBusy(false);
    }
  }

  const transitions = termTransitions[details.status] || [];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section className="user-modal term-details-modal" role="dialog" aria-modal="true" aria-labelledby="term-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{details.academicYear?.name || 'Academic year'} · Term {details.sequence}</p>
            <h2 id="term-details-title">{details.name}</h2>
            <p>{formatTermDate(details.startDate)} – {formatTermDate(details.endDate)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading term details…</span></div>
        ) : error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadDetails();
            }}>Try again</button>
          </div>
        ) : (
          <div className="term-detail-body">
            <div className="term-summary-grid">
              <div><span className="term-summary-icon"><ClipboardList size={16} /></span><strong>{details._count?.assessments ?? 0}</strong><span>Assessments</span></div>
              <div><span className="term-summary-icon"><Users size={16} /></span><strong>{details._count?.enrollments ?? 0}</strong><span>Enrolments</span></div>
              <div><span className="term-summary-icon"><CalendarDays size={16} /></span><strong>{details._count?.assignments ?? 0}</strong><span>Assignments</span></div>
            </div>
            <div className="term-status-row">
              <span>Term status</span>
              <span className={`subject-status subject-status-${details.status.toLowerCase().replace('_', '-')}`}>{termStatusLabel(details.status)}</span>
            </div>
            <div className="term-weight-row">
              <span>Annual result weight</span>
              <strong>{details.annualWeightPercent == null ? 'Not set' : `${Number(details.annualWeightPercent)}%`}</strong>
            </div>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
            {transitions.length > 0 && (
              <section className="term-workflow">
                <h3>Next status</h3>
                <p>Statuses must follow the school’s term workflow.</p>
                <div className="term-workflow-actions">
                  {transitions.map((status) => (
                    <button className="secondary-button" type="button" key={status} disabled={busy} onClick={() => changeStatus(status)}>
                      {busy && <LoaderCircle size={14} className="animate-spin" />} {termStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        <div className="modal-actions term-details-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Close</button>
          {['DRAFT', 'OPEN', 'MARKS_REVIEW'].includes(details.status) && (
            <button className="primary-button" type="button" onClick={() => onEdit(details)} disabled={busy}>Edit term</button>
          )}
        </div>
      </section>
    </div>
  );
}
