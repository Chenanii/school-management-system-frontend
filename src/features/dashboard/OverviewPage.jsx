import { ArrowUpRight, BookOpen, Check, ChevronRight, ClipboardList, GraduationCap, School, Users } from 'lucide-react';
import StatCard from './StatCard.jsx';
import PeopleTable from '../directory/PeopleTable.jsx';
import StatusBadge from '../directory/StatusBadge.jsx';
import { formatName, initials } from '../../shared/utils/people.js';
import ClassDistributionPanel from '../students/ClassDistributionPanel.jsx';

export default function OverviewPage({ summary, loading, error, onRetry, onNavigate }) {
  if (summary.user.role === 'TEACHER') {
    return <TeacherOverview summary={summary} loading={loading} error={error} onRetry={onRetry} onNavigate={onNavigate} />;
  }
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
      {canSeeSchoolRecords && summary.school && <ClassDistributionPanel distribution={summary.classDistribution} loading={loading || !summary.classDistribution} compact />}
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

function TeacherOverview({ summary, loading, error, onRetry, onNavigate }) {
  const assignments = summary.teachingAssignments || [];
  const assessments = summary.assessments || [];
  const submitted = assessments.filter((assessment) => assessment.status === 'SUBMITTED').length;
  const open = assessments.filter((assessment) => ['DRAFT', 'OPEN'].includes(assessment.status)).length;
  const recentAssessments = [...assessments].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 5);

  return <>
    <div className="welcome-row">
      <div>
        <p className="eyebrow">Your teaching overview</p>
        <h1 className="page-title">Good day, {summary.user.firstName}<span className="title-dot">.</span></h1>
        <p className="mt-2 text-sm text-muted">Your classes, subjects, and assessment work at a glance.</p>
      </div>
      {summary.school?.logoDataUrl && <div className="dashboard-school-brand"><img src={summary.school.logoDataUrl} alt={`${summary.school.name} logo`} /><span>{summary.school.name}</span></div>}
    </div>
    {error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" onClick={onRetry}>Retry</button></div>}
    <div className="stats-grid">
      <StatCard icon={BookOpen} label="Teaching assignments" value={assignments.length} detail="Classes and subjects assigned to you" tone="stat-green" loading={loading} />
      <StatCard icon={ClipboardList} label="Open assessments" value={open} detail="Draft or ready for results entry" tone="stat-peach" loading={loading} />
      <StatCard icon={Check} label="Submitted for review" value={submitted} detail="Assessments awaiting admin review" tone="stat-lilac" loading={loading} />
    </div>
    <section className="panel directory-panel">
      <div className="panel-heading"><div><h2 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Recent assessments</h2><p className="mt-1 text-xs text-muted">Your latest assessment activity</p></div><button className="icon-button" onClick={() => onNavigate('assessments')} aria-label="View assessments"><ArrowUpRight size={17} /></button></div>
      {loading ? <div className="table-message"><span className="loading-line" /></div> : recentAssessments.length === 0 ? <div className="empty-state compact-empty"><div className="empty-state-icon"><ClipboardList size={21} /></div><p className="mt-3 text-sm font-semibold text-ink">No assessments yet</p><p className="mt-1 text-xs leading-5 text-muted">Assessments you create for your classes will appear here.</p></div> : <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Assessment</th><th>Class & subject</th><th>Status</th></tr></thead><tbody>{recentAssessments.map((assessment) => {
        const assignment = assessment.teachingAssignment;
        const classLevel = assignment?.classGroup?.classLevel || assignment?.subjectStream?.classLevel || assignment?.classSubject?.classLevel;
        const classLabel = [classLevel?.name, assignment?.classGroup?.name, assignment?.subjectStream?.name ? `Stream ${assignment.subjectStream.name}` : ''].filter(Boolean).join(' · ');
        return <tr key={assessment.id}><td className="font-medium text-ink">{assessment.title}</td><td className="text-muted">{[classLabel, assessment.subject?.name || assignment?.subject?.name].filter(Boolean).join(' · ') || '—'}</td><td><span className={`subject-status subject-status-${assessment.status.toLowerCase()}`}>{assessment.status.replaceAll('_', ' ')}</span></td></tr>;
      })}</tbody></table></div>}
      <button className="panel-footer" onClick={() => onNavigate('assessments')}>Go to assessments <ChevronRight size={15} /></button>
    </section>
    <div className="dashboard-footnote"><Check size={14} /><span>Your teaching assignments are up to date.</span><span className="footnote-spacer" /><span>Schoolhouse</span></div>
  </>;
}
