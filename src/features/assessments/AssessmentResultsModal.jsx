import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Save, X } from 'lucide-react';
import { fetchAssessmentResults, resultStatuses, saveAssessmentResults } from './assessmentApi.js';

function rowSnapshot(row) {
  return {
    mark: row.mark == null ? '' : String(row.mark),
    status: row.status || 'NOT_ENTERED',
    teacherComment: row.teacherComment || ''
  };
}

function changedRows(rows, originalRows) {
  return rows.filter((row) => {
    const current = rowSnapshot(row);
    const original = originalRows.get(row.enrollmentId);
    if (!original) {
      return current.status !== 'NOT_ENTERED' || current.mark !== '' || current.teacherComment !== '';
    }
    return current.status !== original.status
      || current.mark !== original.mark
      || current.teacherComment !== original.teacherComment;
  });
}

export default function AssessmentResultsModal({ assessment, signOut, onClose, onSaved }) {
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = !['DRAFT', 'OPEN'].includes(assessment.status);
  const dirtyRows = useMemo(() => changedRows(rows, originalRows), [originalRows, rows]);

  const loadResults = useCallback(async () => {
    setError('');
    try {
      const response = await fetchAssessmentResults(assessment.id);
      const data = response.data || [];
      setRows(data);
      setOriginalRows(new Map(data.map((row) => [row.enrollmentId, rowSnapshot(row)])));
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [assessment.id, signOut]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  function updateRow(enrollmentId, field, value) {
    setRows((current) => current.map((row) =>
      row.enrollmentId === enrollmentId
        ? {
            ...row,
            [field]: value,
            ...(field === 'status' && value !== 'PRESENT' ? { mark: '' } : {})
          }
        : row
    ));
  }

  async function saveChanges() {
    setError('');
    setNotice('');
    const invalid = dirtyRows.find((row) =>
      row.status === 'PRESENT'
      && (row.mark === '' || !Number.isFinite(Number(row.mark)) || Number(row.mark) < 0 || Number(row.mark) > Number(assessment.maxMark))
    );
    if (invalid) {
      setError(`Enter a mark from 0 to ${Number(assessment.maxMark)} for each student marked present.`);
      return;
    }
    if (dirtyRows.length === 0) {
      setNotice('There are no result changes to save.');
      return;
    }

    const payload = dirtyRows.map((row) => ({
      enrollmentId: row.enrollmentId,
      status: row.status,
      mark: row.status === 'PRESENT' ? Number(row.mark) : null,
      teacherComment: row.teacherComment.trim() || null
    }));
    setSaving(true);
    let savedCount = 0;
    try {
      for (let start = 0; start < payload.length; start += 500) {
        const batch = payload.slice(start, start + 500);
        await saveAssessmentResults(assessment.id, batch);
        savedCount += batch.length;
      }
      setNotice(`${payload.length} result${payload.length === 1 ? '' : 's'} saved.`);
      await loadResults();
      onSaved();
    } catch (cause) {
      setError(savedCount > 0
        ? `${savedCount} result${savedCount === 1 ? '' : 's'} saved before this error: ${cause.message}`
        : cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="user-modal assessment-results-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-results-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Results entry · Maximum {Number(assessment.maxMark)}</p>
            <h2 id="assessment-results-title">{assessment.title}</h2>
            <p>{assessment.teachingAssignment?.classGroup?.classLevel?.name} {assessment.teachingAssignment?.classGroup?.name} · {assessment.subject?.name}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close" disabled={saving}><X size={19} /></button>
        </div>
        {locked && <p className="form-hint mt-4">Results are read-only after the assessment is submitted.</p>}
        {notice && <p className="form-success mt-4" role="status">{notice}</p>}
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading student results…</span></div>
        ) : error && rows.length === 0 ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadResults();
            }}>Try again</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state assessment-results-empty">
            <p className="text-sm font-semibold text-ink">No active enrolments for this class and term</p>
            <p className="mt-1 text-xs text-muted">Enrol active students in the selected class group and term before entering results.</p>
          </div>
        ) : (
          <>
            <div className="assessment-results-count">{rows.length} active enrolments · {dirtyRows.length} unsaved changes</div>
            {error && <p className="form-error mt-3" role="alert">{error}</p>}
            <div className="overflow-x-auto assessment-results-scroll">
              <table className="people-table assessment-results-table">
                <thead><tr><th>Student</th><th>Result status</th><th>Mark</th><th>Teacher comment</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.enrollmentId}>
                      <td>
                        <div className="assessment-student-name">
                          <strong>{[row.student.firstName, row.student.middleName, row.student.lastName].filter(Boolean).join(' ')}</strong>
                          <span>{row.student.admissionNumber}</span>
                        </div>
                      </td>
                      <td>
                        <select className="assessment-result-select" value={row.status} disabled={locked || saving} onChange={(event) => updateRow(row.enrollmentId, 'status', event.target.value)} aria-label={`Result status for ${row.student.firstName} ${row.student.lastName}`}>
                          {resultStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <input className="assessment-mark-input" type="number" min="0" max={Number(assessment.maxMark)} step="0.01" value={row.mark} disabled={locked || saving || row.status !== 'PRESENT'} onChange={(event) => updateRow(row.enrollmentId, 'mark', event.target.value)} aria-label={`Mark for ${row.student.firstName} ${row.student.lastName}`} />
                      </td>
                      <td>
                        <input className="assessment-comment-input" type="text" maxLength={1000} value={row.teacherComment} disabled={locked || saving} onChange={(event) => updateRow(row.enrollmentId, 'teacherComment', event.target.value)} aria-label={`Teacher comment for ${row.student.firstName} ${row.student.lastName}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="modal-actions assessment-results-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Close</button>
          {!locked && rows.length > 0 && (
            <button className="primary-button" type="button" onClick={saveChanges} disabled={saving || loading || dirtyRows.length === 0}>
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving results…' : 'Save results'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
