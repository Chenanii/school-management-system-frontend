import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Users, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { formatClassLevel } from './classGroupApi.js';

export default function ClassGroupDetailsModal({ group, signOut, onClose, onEdit }) {
  const [details, setDetails] = useState(group);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetails = useCallback(async () => {
    setError('');
    try {
      const result = await apiRequest(`/class-groups/${group.id}`);
      setDetails(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [group.id, signOut]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="user-modal class-group-details-modal" role="dialog" aria-modal="true" aria-labelledby="class-group-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{formatClassLevel(details.classLevel)}</p>
            <h2 id="class-group-details-title">{details.name}</h2>
            <p>Summary of learners and teaching assignments currently associated with this group.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading class-group details…</span></div>
        ) : error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" type="button" onClick={() => {
              setLoading(true);
              loadDetails();
            }}>Try again</button>
          </div>
        ) : (
          <div className="class-group-detail-body">
            <div className="class-group-stat-grid">
              <div><span className="class-group-stat-icon"><Users size={16} /></span><strong>{details._count?.enrollments ?? 0}</strong><span>Enrolments</span></div>
              <div><span className="class-group-stat-icon"><span className="class-group-stat-dot" /></span><strong>{details._count?.assignments ?? 0}</strong><span>Teaching assignments</span></div>
            </div>
            <div className="class-group-level-summary">
              <span>Belongs to class level</span>
              <strong>{formatClassLevel(details.classLevel)}</strong>
              <p>A class group is organized under one class level. Its enrolments and teaching assignments are recorded against this group.</p>
            </div>
          </div>
        )}
        <div className="modal-actions class-group-details-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
          <button className="primary-button" type="button" onClick={() => onEdit(details)}>Edit class group</button>
        </div>
      </section>
    </div>
  );
}
