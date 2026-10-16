import { useCallback, useEffect, useState } from 'react';
import { BookOpen, LoaderCircle, Users, X } from 'lucide-react';
import { apiRequest } from '../../api.js';

export default function ClassLevelDetailsModal({ level, signOut, onClose, onEdit }) {
  const [details, setDetails] = useState(level);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetails = useCallback(async () => {
    setError('');
    try {
      const result = await apiRequest(`/class-levels/${level.id}`);
      setDetails(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [level.id, signOut]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="user-modal class-level-details-modal" role="dialog" aria-modal="true" aria-labelledby="class-level-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Class structure · Level {details.levelOrder}</p>
            <h2 id="class-level-details-title">{details.name}</h2>
            <p>Review learner groups, curriculum subjects, and progression links for this level.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading class-level details…</span></div>
        ) : error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadDetails();
            }}>Try again</button>
          </div>
        ) : (
          <div className="class-level-detail-body">
            <div className="class-level-summary">
              <div><strong>{details._count?.groups ?? details.groups?.length ?? 0}</strong><span>Class groups</span></div>
              <div><strong>{details._count?.subjects ?? details.subjects?.length ?? 0}</strong><span>Curriculum subjects</span></div>
              <div><strong>{details._count?.previousLevels ?? details.previousLevels?.length ?? 0}</strong><span>Progress into this level</span></div>
            </div>
            <section className="class-level-detail-section">
              <div className="class-level-section-title"><Users size={16} /><h3>Class groups</h3></div>
              {details.groups?.length ? (
                <div className="class-level-group-list">
                  {details.groups.map((group) => (
                    <div className="class-level-group-row" key={group.id}>
                      <span className="class-level-group-icon"><Users size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <strong>{group.name}</strong>
                        <span>{group._count?.enrollments ?? 0} learners · {group._count?.assignments ?? 0} teaching assignments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="class-level-empty">No class groups have been created for this level yet.</p>
              )}
            </section>
            <section className="class-level-detail-section">
              <div className="class-level-section-title"><BookOpen size={16} /><h3>Curriculum</h3></div>
              {details.subjects?.length ? (
                <div className="class-level-subject-list">
                  {details.subjects.map((link) => (
                    <div className="class-level-subject-chip" key={link.id}>
                      <span>{link.subject.name}</span>
                      <span>{link.subject.code}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="class-level-empty">No subjects are linked to this level yet.</p>
              )}
            </section>
            <section className="class-level-progression">
              <div>
                <span>Previous level{details.previousLevels?.length === 1 ? '' : 's'}</span>
                <strong>{details.previousLevels?.length ? details.previousLevels.map((item) => `${item.levelOrder}. ${item.name}`).join(', ') : 'Starting level'}</strong>
              </div>
              <div>
                <span>Next level</span>
                <strong>{details.nextLevel ? `${details.nextLevel.levelOrder}. ${details.nextLevel.name}` : 'No next level assigned'}</strong>
              </div>
            </section>
          </div>
        )}
        <div className="modal-actions class-level-details-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
          <button className="primary-button" type="button" onClick={() => onEdit(details)}>Edit class level</button>
        </div>
      </section>
    </div>
  );
}
