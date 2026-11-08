import { ChevronRight, GraduationCap, Users } from 'lucide-react';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import StatusBadge from './StatusBadge.jsx';
import FeedbackState from '../../components/FeedbackState.jsx';

export default function PeopleTable({ people, type, loading, error, onRetry, compact = false, onViewAll, onViewAssignments, onEmptyAction }) {
  const isStudent = type === 'students';
  const title = isStudent ? 'Recently added students' : 'Staff directory';

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{compact ? title : (isStudent ? 'All students' : 'All staff')}</h2>
          <p className="mt-1 text-xs text-muted">{compact ? 'Your latest student records' : `${isStudent ? 'Student' : 'Staff'} records in your school`}</p>
        </div>
        {!compact && <span className="rounded-full bg-[#f1f3f0] px-3 py-1 text-xs font-medium text-muted">{people.length} shown</span>}
      </div>
      {error ? (
        <FeedbackState status="error" title={error} onAction={onRetry} />
      ) : loading ? (
        <FeedbackState status="loading" title="Loading records…" />
      ) : people.length === 0 ? (
        <FeedbackState
          status="empty"
          icon={isStudent ? GraduationCap : Users}
          title={`No ${isStudent ? 'students' : 'staff'} to show yet`}
          description="Once records are added, they’ll appear here."
          actionLabel={onEmptyAction ? (isStudent ? 'Add students' : 'Manage staff') : undefined}
          onAction={onEmptyAction}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="people-table">
            <thead>
              <tr>
                <th>{isStudent ? 'Student' : 'Staff member'}</th>
                <th>{isStudent ? 'Admission no.' : 'Email address'}</th>
                <th>{isStudent ? 'Date added' : 'Status'}</th>
                {!compact && isStudent && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const profile = person.user || person;
                return (
                  <tr key={person.id}>
                    <td>
                      <div className="flex min-w-[175px] items-center gap-3">
                        <div className={`person-avatar ${isStudent ? 'person-student' : 'person-staff'}`}>{initials(profile) || '?'}</div>
                        {isStudent || !onViewAssignments ? (
                          <span className="whitespace-nowrap font-medium text-ink">{formatName(profile)}</span>
                        ) : (
                          <button
                            type="button"
                            className="directory-person-link"
                            onClick={() => onViewAssignments(person)}
                            aria-label={`View teaching assignments for ${formatName(profile)}`}
                          >
                            {formatName(profile)}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-muted">{isStudent ? (person.admissionNumber || '-') : (profile.email || person.email || '-')}</td>
                    <td className="whitespace-nowrap text-muted">{isStudent ? formatDate(person.createdAt) : <StatusBadge status={person.status} />}</td>
                    {!compact && isStudent && <td><StatusBadge status={person.status} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {compact && people.length > 0 && (
        <button className="panel-footer" onClick={onViewAll}>
          View all students <ChevronRight size={15} />
        </button>
      )}
    </section>
  );
}
