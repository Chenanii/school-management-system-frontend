import { ArrowUpRight, BookOpen, Check, ChevronRight, ClipboardList, GraduationCap, School, Users } from 'lucide-react';
import StatCard from './StatCard.jsx';
import PeopleTable from '../directory/PeopleTable.jsx';
import StatusBadge from '../directory/StatusBadge.jsx';
import { formatName, initials } from '../../shared/utils/people.js';

export default function OverviewPage({ summary, loading, error, onRetry, onNavigate }) {
  const recent = summary.students.slice(0, 5);
  const canSeeSchoolRecords = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(summary.user.role);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">Your school at a glance</p>
          <h1 className="page-title">Good day, {summary.user.firstName}<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Here’s what’s happening across your school.</p>
        </div>
        {summary.school?.logoDataUrl && (
          <div className="dashboard-school-brand">
            <img src={summary.school.logoDataUrl} alt={`${summary.school.name} logo`} />
            <span>{summary.school.name}</span>
          </div>
        )}
        <div className="welcome-illustration" aria-hidden="true">
          <div className="illustration-sun" />
          <div className="illustration-book"><BookOpen size={37} strokeWidth={1.4} /></div>
          <div className="illustration-spark spark-one">✳</div>
          <div className="illustration-spark spark-two">✳</div>
        </div>
      </div>
      {error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" onClick={onRetry}>Retry</button></div>}
      <div className="stats-grid">
        <StatCard icon={GraduationCap} label="Total students" value={summary.studentCount} detail={summary.studentCount === null ? 'School administrator access required' : 'Registered in your school'} tone="stat-green" loading={loading} />
        <StatCard icon={Users} label="Total staff" value={summary.teacherCount} detail={summary.teacherCount === null ? 'School administrator access required' : 'Teachers on your team'} tone="stat-peach" loading={loading} />
        {summary.user.role === 'SUPER_ADMIN' ? (
          <StatCard icon={School} label="Schools managed" value={summary.schoolsManaged} detail="Schools on the platform" tone="stat-lilac" loading={loading} />
        ) : (
          <div className="stat-card stat-card-accent">
          <div className="accent-card-top"><div className="stat-icon stat-lilac"><ClipboardList size={19} strokeWidth={1.8} /></div><span className="accent-spark">✳</span></div>
          <p className="mt-5 text-[15px] font-semibold text-ink">A little progress adds up</p>
          <p className="mt-1 text-xs leading-5 text-muted">Keep student and staff records up to date for a clearer picture of your school.</p>
          </div>
        )}
      </div>
      {canSeeSchoolRecords && summary.user.role !== 'SUPER_ADMIN' && <div className="content-grid">
        <PeopleTable people={recent} type="students" loading={loading} error={error} onRetry={onRetry} compact onViewAll={() => onNavigate('students')} />
        <section className="panel staff-panel">
          <div className="panel-heading">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Your staff</h2>
              <p className="mt-1 text-xs text-muted">A quick look at your team</p>
            </div>
            <button className="icon-button" onClick={() => onNavigate('staff')} aria-label="View staff"><ArrowUpRight size={17} /></button>
          </div>
          {loading ? <div className="table-message"><span className="loading-line" /></div>
            : summary.teachers.length === 0 ? <div className="empty-state compact-empty"><div className="empty-state-icon"><Users size={21} /></div><p className="mt-3 text-sm font-semibold text-ink">Your team starts here</p><p className="mt-1 text-xs leading-5 text-muted">Staff profiles will appear as they join your school.</p></div>
              : <div className="staff-list">{summary.teachers.slice(0, 4).map((teacher) => {
                const profile = teacher.user || teacher;
                return <div className="staff-row" key={teacher.id}><div className="person-avatar person-staff">{initials(profile) || '?'}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink">{formatName(profile)}</div><div className="mt-0.5 truncate text-xs text-muted">{profile.email || teacher.email || 'Staff member'}</div></div><StatusBadge status={teacher.status} /></div>;
              })}</div>}
          <button className="panel-footer" onClick={() => onNavigate('staff')}>View staff <ChevronRight size={15} /></button>
        </section>
      </div>}
      <div className="dashboard-footnote"><Check size={14} /><span>Your school records are securely synced.</span><span className="footnote-spacer" /><span>Schoolhouse</span></div>
    </>
  );
}
