import { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, LoaderCircle, Mail, Users, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { formatDate, formatName } from '../../shared/utils/people.js';
import StatusBadge from '../directory/StatusBadge.jsx';

export default function StudentDetailsModal({ student, isTeacher = false, onClose }) {
  const [details, setDetails] = useState(student);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const enrollmentFormTutor = selectedEnrollment?.classGroup?.formTutorAssignments?.find((assignment) =>
    assignment.academicYear?.id === selectedEnrollment.term?.academicYear?.id
  )?.teacher;

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest(`/students/${student.id}`);
        if (!cancelled) setDetails(result.data);
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDetails();
    return () => { cancelled = true; };
  }, [student.id]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-modal student-modal" role="dialog" aria-modal="true" aria-labelledby="student-details-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Student profile</p>
            <h2 id="student-details-title">{formatName(details)}</h2>
            <p>Student ID {details.admissionNumber}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {error ? <div className="table-message detail-message" role="alert">{error}</div>
          : loading ? <div className="table-message detail-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading student details…</span></div>
            : (
              <div className="student-details-content">
                <dl className="student-detail-list">
                  <div><dt>Status</dt><dd><StatusBadge status={details.status} /></dd></div>
                  <div><dt>Date of birth</dt><dd><CalendarDays size={14} />{formatDate(details.dateOfBirth)}</dd></div>
                  <div><dt>Gender</dt><dd>{details.gender || 'Not provided'}</dd></div>
                  <div><dt>Nationality</dt><dd>{details.nationality || 'Not provided'}</dd></div>
                  <div><dt>Enrolments</dt><dd>{details._count?.enrollments ?? details.enrollments?.length ?? 0}</dd></div>
                  {!isTeacher && <div><dt>Parents/guardians</dt><dd><Users size={14} />{details._count?.parents ?? details.parents?.length ?? 0}</dd></div>}
                </dl>
                <section className="student-history">
                  <h3>Recent enrolments</h3>
                  {!details.enrollments?.length ? <p>No enrolments recorded yet.</p> : details.enrollments.slice(0, 5).map((enrollment) => (
                    <button className="student-history-row student-enrollment-link" type="button" key={enrollment.id} onClick={() => setSelectedEnrollment(enrollment)} aria-label={`View class information for ${enrollment.term?.name || 'enrollment'}`}>
                      <div><strong>{enrollment.classLevel?.name || enrollment.classGroup?.classLevel?.name || 'Class'}{enrollment.classGroup?.name ? ` · ${enrollment.classGroup.name}` : ' · Home group not assigned'}</strong><span>{enrollment.term?.academicYear?.name} · {enrollment.term?.name}</span></div>
                      <StatusBadge status={enrollment.status} />
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </section>
                {!isTeacher && <section className="student-history">
                  <h3>Parents & guardians</h3>
                  {!details.parents?.length ? <p>No parent or guardian linked yet.</p> : details.parents.map((link) => {
                    const parent = link.parent;
                    const parentName = parent?.user ? formatName(parent.user) : [parent?.firstName, parent?.lastName].filter(Boolean).join(' ') || 'Parent / guardian';
                    return <div className="student-history-row" key={parent?.id || link.id}><div><strong>{parentName}</strong><span><Mail size={12} />{[parent?.email, parent?.phone].filter(Boolean).join(' · ') || 'Contact not provided'}</span></div></div>;
                  })}
                </section>}
              </div>
            )}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>
      </section>
      {selectedEnrollment && <div className="modal-backdrop student-class-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEnrollment(null); }}>
        <section className="user-modal student-class-info-modal" role="dialog" aria-modal="true" aria-labelledby="student-class-info-title">
          <div className="modal-heading">
            <div><p className="eyebrow">Enrollment class information</p><h2 id="student-class-info-title">{selectedEnrollment.classLevel?.name || selectedEnrollment.classGroup?.classLevel?.name || 'Class details'}</h2><p>{selectedEnrollment.classGroup?.name || 'Home class group not assigned'}</p></div>
            <button className="icon-button" type="button" onClick={() => setSelectedEnrollment(null)} aria-label="Close class information"><X size={19} /></button>
          </div>
          <dl className="student-class-info-grid">
            <div><dt>Class level</dt><dd>{selectedEnrollment.classLevel?.name || selectedEnrollment.classGroup?.classLevel?.name || '-'}</dd></div>
            <div><dt>Class group</dt><dd>{selectedEnrollment.classGroup?.name || 'Not assigned'}</dd></div>
            <div><dt>Academic year</dt><dd>{selectedEnrollment.term?.academicYear?.name || '-'}</dd></div>
            <div><dt>Term</dt><dd>{selectedEnrollment.term?.name || '-'}</dd></div>
            <div><dt>Form tutor</dt><dd>{enrollmentFormTutor ? `${enrollmentFormTutor.firstName} ${enrollmentFormTutor.lastName}` : 'Not assigned'}</dd></div>
            <div><dt>Enrollment status</dt><dd><StatusBadge status={selectedEnrollment.status} /></dd></div>
          </dl>
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setSelectedEnrollment(null)}>Back to student details</button></div>
        </section>
      </div>}
    </div>
  );
}
