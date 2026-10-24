import { useEffect, useState } from 'react';
import { BookOpen, LoaderCircle, UserRound, UsersRound, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { formatDate, formatName } from '../../shared/utils/people.js';
import { roleLabel } from './userRoles.js';

export default function UserDetailsModal({ user, signOut, onClose, onEdit }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/users/${user.id}`)
      .then((result) => { if (!cancelled) setDetails(result.data); })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      });
    return () => { cancelled = true; };
  }, [user.id, signOut]);

  const profile = details || user;
  const teacherTerms = details?.teacher?.terms || [];
  const activeTermId = selectedTermId || details?.teacher?.currentTermId || teacherTerms[0]?.id || '';
  const assignments = (details?.teacher?.assignments || []).filter((assignment) => !activeTermId || assignment.termId === activeTermId);
  const tutorAssignments = details?.teacher?.formTutorAssignments || [];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-modal user-details-modal" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
        <div className="user-details-heading">
          <div className="person-avatar person-staff">{formatName(profile).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'}</div>
          <div className="min-w-0"><p className="eyebrow">User profile</p><h2 id="user-details-title">{formatName(profile)}</h2><p>{roleLabel(profile.role)} · {profile.status}</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close user details"><X size={18} /></button>
        </div>
        <div className="user-details-content">
          {error ? <div className="table-message">{error}</div> : !details ? <div className="table-message"><LoaderCircle size={18} className="animate-spin" /> Loading user details…</div> : <>
            <section className="user-details-section">
              <h3><UserRound size={16} /> Account information</h3>
              <dl className="user-details-grid">
                <div><dt>Email address</dt><dd>{details.email || '—'}</dd></div>
                <div><dt>Role</dt><dd>{roleLabel(details.role)}</dd></div>
                <div><dt>Staff number</dt><dd>{details.teacher?.staffNumber || '—'}</dd></div>
                <div><dt>Account status</dt><dd>{details.status}</dd></div>
                <div><dt>Account created</dt><dd>{formatDate(details.createdAt)}</dd></div>
                <div><dt>Last updated</dt><dd>{formatDate(details.updatedAt)}</dd></div>
              </dl>
            </section>
            {details.teacher && <>
              <section className="user-details-section">
                <div className="user-assignment-heading"><h3><BookOpen size={16} /> Teaching assignments <span>{assignments.length}</span></h3>
                  {teacherTerms.length > 1 && <label className="user-term-picker"><span className="sr-only">View teaching assignments for term</span><select value={activeTermId} onChange={(event) => setSelectedTermId(event.target.value)}>
                    {teacherTerms.map((term) => <option key={term.id} value={term.id}>{term.academicYear} · {term.sequence}. {term.name}{term.id === details.teacher.currentTermId ? ' (Current)' : ''}</option>)}
                  </select></label>}
                </div>
                {assignments.length ? <div className="user-assignment-list">{assignments.map((assignment) => <article key={assignment.id}>
                  <div><strong>{assignment.subject}</strong>{assignment.subjectCode && <small>{assignment.subjectCode}</small>}</div>
                  <p>{assignment.classLevel}{assignment.classGroup ? ` · ${assignment.classGroup}` : ''}{assignment.stream ? ` · ${assignment.stream}` : ''}</p>
                  <span>{assignment.academicYear} · {assignment.term}</span>
                </article>)}</div> : <p className="user-details-empty">No teaching assignments recorded.</p>}
              </section>
              <section className="user-details-section">
                <h3><UsersRound size={16} /> Form tutor assignments <span>{tutorAssignments.length}</span></h3>
                {tutorAssignments.length ? <div className="user-assignment-list">{tutorAssignments.map((assignment) => <article key={assignment.id}>
                  <div><strong>{assignment.classLevel} · {assignment.classGroup}</strong></div><span>{assignment.academicYear}</span>
                </article>)}</div> : <p className="user-details-empty">No form tutor assignments recorded.</p>}
              </section>
            </>}
          </>}
        </div>
        <div className="user-details-actions"><button className="secondary-button" type="button" onClick={onClose}>Close</button><button className="primary-button" type="button" onClick={() => onEdit(profile)}>Edit user</button></div>
      </section>
    </div>
  );
}
