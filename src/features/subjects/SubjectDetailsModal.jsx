import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { fetchAllPages } from './subjectApi.js';

export default function SubjectDetailsModal({ subject, signOut, onClose, onChanged }) {
  const [details, setDetails] = useState(subject);
  const [classLevels, setClassLevels] = useState([]);
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [error, setError] = useState('');

  const loadDetails = useCallback(async () => {
    setError('');
    try {
      const [subjectResult, levels] = await Promise.all([
        apiRequest(`/subjects/${subject.id}`),
        fetchAllPages('/class-levels')
      ]);
      setDetails(subjectResult.data);
      setClassLevels(levels);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [subject.id, signOut]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const linkedIds = useMemo(
    () => new Set((details.classLinks || []).map((link) => link.classLevelId)),
    [details.classLinks]
  );
  const availableLevels = classLevels.filter((level) => !linkedIds.has(level.id));

  async function addClassLevel(event) {
    event.preventDefault();
    if (!selectedClassLevel) return;
    setError('');
    setSaving(true);
    try {
      await apiRequest('/class-subjects', {
        method: 'POST',
        body: JSON.stringify({ subjectId: subject.id, classLevelId: selectedClassLevel })
      });
      setSelectedClassLevel('');
      await loadDetails();
      onChanged();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  async function removeClassLevel(link) {
    if (!window.confirm(`Remove ${link.classLevel.name} from ${subject.name}? Existing teaching assignments may prevent removal.`)) return;
    setError('');
    setRemovingId(link.id);
    try {
      await apiRequest(`/class-subjects/${link.id}`, { method: 'DELETE' });
      await loadDetails();
      onChanged();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setRemovingId('');
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving && !removingId) onClose();
    }}>
      <section className="user-modal subject-details-modal" role="dialog" aria-modal="true" aria-labelledby="subject-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Subject profile · {subject.code}</p>
            <h2 id="subject-details-title">{subject.name}</h2>
            <p>Manage the class levels that include this subject in their curriculum.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {error && <div className="form-error mt-4" role="alert">{error}</div>}
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading curriculum details…</span></div>
        ) : error && !details.classLinks ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadDetails();
            }}>Try again</button>
          </div>
        ) : (
          <div className="subject-profile-body">
            <div className="subject-metrics">
              <div><span>Classes using this subject</span><strong>{details._count?.classLinks ?? details.classLinks?.length ?? 0}</strong></div>
              <div><span>Assessments</span><strong>{details._count?.assessments ?? 0}</strong></div>
              <div><span>Status</span><strong className={`subject-status subject-status-${details.status.toLowerCase()}`}>{details.status.toLowerCase()}</strong></div>
            </div>
            <section className="subject-curriculum">
              <div className="subject-section-heading">
                <div>
                  <h3>Class-level curriculum</h3>
                  <p>Link this subject to the levels where it is taught.</p>
                </div>
              </div>
              {details.status === 'ACTIVE' ? (
                <form className="subject-link-form" onSubmit={addClassLevel}>
                  <label className="sr-only" htmlFor="subject-class-level">Choose a class level</label>
                  <select id="subject-class-level" className="filter-select" value={selectedClassLevel} onChange={(event) => setSelectedClassLevel(event.target.value)} disabled={saving || availableLevels.length === 0} required>
                    <option value="">Select class level</option>
                    {availableLevels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
                  </select>
                  <button className="primary-button" type="submit" disabled={saving || !selectedClassLevel}>
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={16} />}
                    Add to curriculum
                  </button>
                </form>
              ) : (
                <p className="form-hint">Activate this subject before adding it to more class levels.</p>
              )}
              {details.status === 'ACTIVE' && availableLevels.length === 0 && classLevels.length > 0 && (
                <p className="form-hint">This subject is already linked to every class level.</p>
              )}
              {details.classLinks?.length ? (
                <ul className="subject-class-list">
                  {details.classLinks.map((link) => (
                    <li key={link.id}>
                      <div className="subject-class-level">
                        <span className="subject-class-marker" />
                        <div>
                          <span>{link.classLevel.name}</span>
                          <span className="subject-assignment-count">
                            {link._count?.assignments ?? 0} teaching {link._count?.assignments === 1 ? 'assignment' : 'assignments'}
                          </span>
                        </div>
                      </div>
                      <button
                        className="table-action subject-remove-link"
                        type="button"
                        disabled={Boolean(removingId) || saving || (link._count?.assignments ?? 0) > 0}
                        onClick={() => removeClassLevel(link)}
                        aria-label={`Remove ${link.classLevel.name}`}
                        title={(link._count?.assignments ?? 0) > 0 ? 'Remove or reassign its teaching assignments first' : 'Remove class level'}
                      >
                        {removingId === link.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="subject-empty-links">This subject is not linked to any class levels yet.</div>
              )}
            </section>
            <div className="subject-usage-note">
              <strong>Academic records</strong>
              <span>{details._count?.assessments ?? 0} assessments · {details._count?.termResults ?? 0} term results · {details._count?.annualResults ?? 0} annual results</span>
            </div>
          </div>
        )}
        <div className="modal-actions subject-details-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}
