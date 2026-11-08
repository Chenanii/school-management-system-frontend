import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck, ClipboardList, Clock3, FileText, GraduationCap, LockKeyhole, School, Users } from 'lucide-react';
import StatCard from './StatCard.jsx';
import PeopleTable from '../directory/PeopleTable.jsx';
import StatusBadge from '../directory/StatusBadge.jsx';
import { formatName, initials } from '../../shared/utils/people.js';
import ClassDistributionPanel from '../students/ClassDistributionPanel.jsx';
import nexaLogo from '../../assets/Nexa-Logo-Final.png';

export default function OverviewPage({ summary, loading, error, onRetry, onNavigate, schoolSetup, onOpenSetup }) {
  if (summary.user.role === 'TEACHER') {
    return <TeacherOverview summary={summary} loading={loading} error={error} onRetry={onRetry} onNavigate={onNavigate} />;
  }
  if (summary.user.role === 'HEADTEACHER') {
    return <HeadteacherOverview summary={summary} loading={loading} error={error} onRetry={onRetry} onNavigate={onNavigate} />;
  }
  if (summary.user.role === 'EXAMS_OFFICER') {
    return <ExamOfficerOverview summary={summary} loading={loading} error={error} onRetry={onRetry} onNavigate={onNavigate} />;
  }
  const recent = summary.students.slice(0, 5);
  const canSeeSchoolRecords = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(summary.user.role);
  const quickActions = {
    SCHOOL_ADMIN: [
      { label: 'Add student', detail: 'Register a student', page: 'students', icon: GraduationCap },
      { label: 'Mark attendance', detail: 'Open a class register', page: 'attendance', icon: ClipboardCheck },
      { label: 'Enter results', detail: 'Work on assessments', page: 'assessments', icon: ClipboardList },
      { label: 'Invite staff', detail: 'Add a teacher or staff member', page: 'users', icon: Users }
    ],
    ACADEMIC_ADMIN: [
      { label: 'Add student', detail: 'Register a student', page: 'students', icon: GraduationCap },
      { label: 'Mark attendance', detail: 'Open a class register', page: 'attendance', icon: ClipboardCheck },
      { label: 'Enter results', detail: 'Work on assessments', page: 'assessments', icon: ClipboardList },
      { label: 'View reports', detail: 'Check published results', page: 'report-cards', icon: FileText }
    ],
    FORM_TUTOR: [
      { label: 'Mark attendance', detail: 'Open a class register', page: 'attendance', icon: ClipboardCheck },
      { label: 'Enter results', detail: 'Work on assessments', page: 'assessments', icon: ClipboardList },
      { label: 'View students', detail: 'Open your student register', page: 'students', icon: GraduationCap }
    ]
  }[summary.user.role] || [];
  const nextSetupStep = schoolSetup?.steps?.find((step) => !step.complete);

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
      {summary.user.role === 'SCHOOL_ADMIN' && schoolSetup && !schoolSetup.complete && (
        <section className="overview-setup-alert" role="status">
          <span className="overview-setup-alert-icon"><CalendarDays size={18} /></span>
          <div className="overview-setup-alert-copy">
            <strong>Finish setting up your school</strong>
            <span>{nextSetupStep ? 'Next suggested task: ' + nextSetupStep.title + '.' : 'Your setup progress is ready to review.'} You can continue at any time.</span>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenSetup}>Continue setup <ArrowRight size={15} /></button>
        </section>
      )}
      {quickActions.length > 0 && (
        <section className="dashboard-quick-actions" aria-labelledby="dashboard-quick-actions-title">
          <div className="dashboard-quick-actions-heading">
            <div><h2 id="dashboard-quick-actions-title">Quick actions</h2><p>Go straight to a common task.</p></div>
          </div>
          <div className="dashboard-quick-actions-grid">
            {quickActions.map(({ label, detail, page, icon: Icon }) => (
              <button className="dashboard-quick-action" type="button" key={page} onClick={() => onNavigate(page)}>
                <span className="dashboard-quick-action-icon"><Icon size={18} /></span>
                <span><strong>{label}</strong><small>{detail}</small></span>
                <ArrowUpRight size={16} className="dashboard-quick-action-arrow" />
              </button>
            ))}
          </div>
        </section>
      )}
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
        <PeopleTable people={recent} type="students" loading={loading} error={error} onRetry={onRetry} compact onViewAll={() => onNavigate('students')} onEmptyAction={() => onNavigate('students')} />
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
      <div className="dashboard-footnote"><Check size={14} /><span>Your school records are securely synced.</span><span className="footnote-spacer" /><span className="dashboard-credit"><img className="dashboard-nexa-logo" src={nexaLogo} alt="" /><span>Developed by <strong>Nexa Circuit LTD</strong></span></span></div>
    </>
  );
}

function HeadteacherOverview({ summary, loading, error, onRetry, onNavigate }) {
  const assessments = summary.assessments || [];
  const terms = summary.terms || [];
  const currentYearTerms = terms.filter((term) => term.academicYear?.isCurrent);
  const currentTerm = currentYearTerms.find((term) => term.status === 'OPEN') || currentYearTerms[0];
  const awaitingAssessmentReview = assessments.filter((assessment) => assessment.status === 'SUBMITTED');
  const termFollowUps = terms.filter((term) => term.status === 'MARKS_REVIEW').slice(0, 4);
  const followUpCount = awaitingAssessmentReview.length + terms.filter((term) => term.status === 'MARKS_REVIEW').length;
  const actions = [
    { label: 'Students', detail: 'Review the student register', page: 'students', icon: GraduationCap },
    { label: 'Teaching Assignments', detail: 'Manage classes, subjects, and teachers', page: 'teaching-assignments', icon: BookOpen },
    { label: 'Academic years', detail: 'Update school-year dates', page: 'academic-years', icon: CalendarDays },
    { label: 'Terms', detail: 'Edit term dates and results stages', page: 'terms', icon: CalendarDays },
    { label: 'Assessments', detail: 'Review submitted marks', page: 'assessments', icon: ClipboardList },
    { label: 'Report cards', detail: 'Check and publish results', page: 'report-cards', icon: FileText }
  ];

  return <>
    <div className="welcome-row exam-dashboard-welcome">
      <div>
        <p className="eyebrow">School leadership</p>
        <h1 className="page-title">Good day, {summary.user.firstName}<span className="title-dot">.</span></h1>
        <p className="mt-2 text-sm text-muted">A school-wide view of people, teaching, and academic progress.</p>
      </div>
      {summary.school?.logoDataUrl && <div className="dashboard-school-brand"><img src={summary.school.logoDataUrl} alt={`${summary.school.name} logo`} /><span>{summary.school.name}</span></div>}
    </div>
    {error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" onClick={onRetry}>Retry</button></div>}

    <div className="exam-workflow-stats headteacher-stats">
      <div className="exam-workflow-stat"><span className="stat-icon stat-green"><GraduationCap size={19} /></span><span className="exam-workflow-stat-copy"><strong>{loading || error ? '-' : summary.studentCount ?? 0}</strong><span>Students</span><small>Across the school</small></span></div>
      <div className="exam-workflow-stat"><span className="stat-icon stat-peach"><Users size={19} /></span><span className="exam-workflow-stat-copy"><strong>{loading || error ? '-' : summary.teacherCount ?? 0}</strong><span>Teaching staff</span><small>On the school team</small></span></div>
      <div className="exam-workflow-stat"><span className="stat-icon stat-lilac"><ClipboardCheck size={19} /></span><span className="exam-workflow-stat-copy"><strong>{loading || error ? '-' : followUpCount}</strong><span>Academic follow-ups</span><small>Assessment and term decisions</small></span><span className="exam-stat-count">{loading ? 'Loading' : error ? 'Unavailable' : `${followUpCount} ${followUpCount === 1 ? 'item' : 'items'}`}</span></div>
    </div>

    <section className="headteacher-term-banner">
      <span className="headteacher-term-icon"><CalendarDays size={18} /></span>
      <div><small>Current academic term</small><strong>{loading ? 'Loading term…' : currentTerm ? `${currentTerm.academicYear?.name || 'Academic year'} · ${currentTerm.sequence}. ${currentTerm.name}` : 'No open term for the current academic year'}</strong></div>
      {currentTerm && <span className={`headteacher-term-status headteacher-term-status-${currentTerm.status.toLowerCase()}`}>{currentTerm.status.replaceAll('_', ' ')}</span>}
      <button className="text-button exam-view-all" type="button" onClick={() => onNavigate('terms')}>Update current term <ArrowRight size={15} /></button>
    </section>

    <section className="headteacher-followups">
      <div className="exam-quick-actions-heading"><div><h2>Leadership follow-up</h2><p>Items that may need your review or a school-level decision.</p></div></div>
      <div className="headteacher-followup-grid">
        <section className="panel headteacher-followup-panel">
          <div className="panel-heading"><div><h3>Assessments awaiting review</h3><p>{awaitingAssessmentReview.length} submitted for approval</p></div><button className="icon-button" type="button" onClick={() => onNavigate('assessments')} aria-label="Open assessments"><ArrowUpRight size={17} /></button></div>
          {loading ? <div className="table-message"><span className="loading-line" /></div> : error ? <div className="headteacher-empty">Assessment review data is unavailable. Retry the dashboard to refresh it.</div> : awaitingAssessmentReview.length ? <div className="headteacher-followup-list">{awaitingAssessmentReview.slice(0, 5).map((assessment) => {
            const assignment = assessment.teachingAssignment;
            const subject = assessment.subject?.name || assignment?.subject?.name || assignment?.classSubject?.subject?.name || 'Subject';
            return <button type="button" className="headteacher-followup-row" key={assessment.id} onClick={() => onNavigate('assessments')}><span className="headteacher-followup-mark"><ClipboardCheck size={15} /></span><span className="headteacher-followup-copy"><strong>{assessment.title}</strong><small>{[examClassLabel(assessment), subject, assessment.term?.name].filter(Boolean).join(' · ')}</small></span><ChevronRight size={16} /></button>;
          })}</div> : <div className="headteacher-empty"><span><Check size={16} /></span><span>No submitted assessments are waiting for review.</span></div>}
          <button className="panel-footer" type="button" onClick={() => onNavigate('assessments')}>Review assessments <ChevronRight size={15} /></button>
        </section>

        <section className="panel headteacher-followup-panel">
          <div className="panel-heading"><div><h3>Terms ready for final review</h3><p>Review marks and finalize term results</p></div><button className="icon-button" type="button" onClick={() => onNavigate('terms')} aria-label="Open academic calendar"><ArrowUpRight size={17} /></button></div>
          {loading ? <div className="table-message"><span className="loading-line" /></div> : error ? <div className="headteacher-empty">Term milestone data is unavailable. Retry the dashboard to refresh it.</div> : termFollowUps.length ? <div className="headteacher-followup-list">{termFollowUps.map((term) => <button type="button" className="headteacher-followup-row" key={term.id} onClick={() => onNavigate('terms')}><span className="headteacher-followup-mark headteacher-followup-mark-term"><FileText size={15} /></span><span className="headteacher-followup-copy"><strong>{term.academicYear?.name} · {term.sequence}. {term.name}</strong><small>Review results and finalize the term</small></span><span className="headteacher-term-status headteacher-term-status-review">Review</span></button>)}</div> : <div className="headteacher-empty"><span><Check size={16} /></span><span>No terms are waiting at a results milestone.</span></div>}
          <button className="panel-footer" type="button" onClick={() => onNavigate('terms')}>Open academic calendar <ChevronRight size={15} /></button>
        </section>
      </div>
    </section>

    {summary.classDistribution && <ClassDistributionPanel distribution={summary.classDistribution} loading={loading} compact />}
    <section className="exam-quick-actions headteacher-tools">
      <div className="exam-quick-actions-heading"><div><h2>School oversight</h2><p>Common areas for day-to-day leadership.</p></div></div>
      <div className="exam-action-grid">{actions.map(({ label, detail, page, icon: Icon }) => <button className="exam-action-card" type="button" key={page} onClick={() => onNavigate(page)}><span className="exam-action-icon"><Icon size={18} /></span><span className="exam-action-copy"><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight size={16} className="exam-action-arrow" /></button>)}</div>
    </section>
    <div className="dashboard-footnote"><Check size={14} /><span>School oversight at a glance</span><span className="footnote-spacer" /><span className="dashboard-credit"><img className="dashboard-nexa-logo" src={nexaLogo} alt="" /><span>Developed by <strong>Nexa Circuit LTD</strong></span></span></div>
  </>;
}

function examClassLabel(assessment) {
  const assignment = assessment.teachingAssignment;
  const level = assignment?.classGroup?.classLevel || assignment?.subjectStream?.classLevel || assignment?.classSubject?.classLevel;
  return [level?.name, assignment?.classGroup?.name, assignment?.subjectStream?.name ? `Stream ${assignment.subjectStream.name}` : '']
    .filter(Boolean).join(' · ') || 'Class not set';
}

function ExamOfficerOverview({ summary, loading, error, onRetry, onNavigate }) {
  const dataUnavailable = loading || Boolean(error);
  const assessments = summary.assessments || [];
  const open = assessments.filter((item) => item.status === 'OPEN');
  const awaitingReview = assessments.filter((item) => item.status === 'SUBMITTED');
  const readyToLock = assessments.filter((item) => item.status === 'APPROVED');
  const statusOrder = { SUBMITTED: 0, APPROVED: 1, OPEN: 2, DRAFT: 3 };
  const workQueue = assessments
    .filter((item) => item.status !== 'LOCKED')
    .sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4))
    .slice(0, 6);
  const workflowStats = [
    { label: 'Marks in progress', value: open.length, hint: 'Open assessments', icon: Clock3, tone: 'stat-peach' },
    { label: 'Awaiting review', value: awaitingReview.length, hint: 'Submitted for approval', icon: ClipboardCheck, tone: 'stat-lilac' },
    { label: 'Ready to lock', value: readyToLock.length, hint: 'Approved assessments', icon: LockKeyhole, tone: 'stat-green' }
  ];
  const actions = [
    { label: 'Assessments', detail: 'Review marks and workflow', page: 'assessments', icon: ClipboardList },
    { label: 'Mid-term reports', detail: 'Check readiness and publish', page: 'mid-term-report-cards', icon: FileText },
    { label: 'End-of-term reports', detail: 'Publish class results', page: 'report-cards', icon: GraduationCap },
    { label: 'Class attendance', detail: 'Open registers and summaries', page: 'attendance', icon: ClipboardCheck }
  ];

  return <>
    <div className="welcome-row exam-dashboard-welcome">
      <div>
        <p className="eyebrow">Examinations & results</p>
        <h1 className="page-title">Good day, {summary.user.firstName}<span className="title-dot">.</span></h1>
        <p className="mt-2 text-sm text-muted">Track assessment progress, clear review work, and prepare published reports.</p>
      </div>
      {summary.school?.logoDataUrl && <div className="dashboard-school-brand"><img src={summary.school.logoDataUrl} alt={`${summary.school.name} logo`} /><span>{summary.school.name}</span></div>}
    </div>
    {error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" onClick={onRetry}>Retry</button></div>}

    <div className="exam-workflow-stats">
      {workflowStats.map(({ label, value, hint, icon: Icon, tone }) => (
        <div className="exam-workflow-stat" key={label}>
          <span className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.8} /></span>
          <span className="exam-workflow-stat-copy"><strong>{dataUnavailable ? '-' : value}</strong><span>{label}</span><small>{hint}</small></span>
          <span className="exam-stat-count">{loading ? 'Loading' : error ? 'Unavailable' : `${value} ${value === 1 ? 'item' : 'items'}`}</span>
        </div>
      ))}
    </div>

    <section className="panel exam-work-queue">
      <div className="panel-heading">
        <div><h2 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Assessment work queue</h2><p className="mt-1 text-xs text-muted">Items that still need an exam workflow action</p></div>
        <button className="text-button exam-view-all" type="button" onClick={() => onNavigate('assessments')}>View all <ArrowRight size={15} /></button>
      </div>
      {loading ? <div className="table-message"><span className="loading-line" /></div> : error ? (
        <div className="exam-queue-empty"><span className="exam-queue-error-mark">!</span><div><strong>Assessment queue unavailable</strong><p>Retry loading the dashboard to check current work.</p></div></div>
      ) : workQueue.length === 0 ? (
        <div className="exam-queue-empty"><span><Check size={17} /></span><div><strong>Everything is up to date</strong><p>No assessments are waiting for an exam workflow action.</p></div></div>
      ) : <div className="overflow-x-auto"><table className="people-table exam-queue-table">
        <thead><tr><th>Assessment</th><th>Class & subject</th><th>Term</th><th>Status</th></tr></thead>
        <tbody>{workQueue.map((assessment) => {
          const assignment = assessment.teachingAssignment;
          const subject = assessment.subject?.name || assignment?.subject?.name || assignment?.classSubject?.subject?.name || 'Subject';
          const type = assessment.assessmentType?.replaceAll('_', ' ').toLowerCase() || 'assessment';
          const status = { DRAFT: 'Needs opening', OPEN: 'Marks in progress', SUBMITTED: 'Awaiting review', APPROVED: 'Ready to lock' }[assessment.status] || assessment.status;
          return <tr key={assessment.id}>
            <td><strong>{assessment.title}</strong><span className="exam-queue-meta">{type}</span></td>
            <td><strong>{examClassLabel(assessment)}</strong><span className="exam-queue-meta">{subject}</span></td>
            <td>{assessment.term?.name || '-'}</td>
            <td><span className={`exam-queue-status exam-queue-status-${assessment.status.toLowerCase()}`}>{status}</span></td>
          </tr>;
        })}</tbody>
      </table></div>}
      <button className="panel-footer" type="button" onClick={() => onNavigate('assessments')}>Open assessment management <ChevronRight size={15} /></button>
    </section>

    <section className="exam-quick-actions">
      <div className="exam-quick-actions-heading"><div><h2>Exam officer tools</h2><p>Go straight to a key part of the examination cycle.</p></div></div>
      <div className="exam-action-grid">{actions.map(({ label, detail, page, icon: Icon }) => (
        <button className="exam-action-card" type="button" key={page} onClick={() => onNavigate(page)}>
          <span className="exam-action-icon"><Icon size={18} /></span><span className="exam-action-copy"><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight size={16} className="exam-action-arrow" />
        </button>
      ))}</div>
    </section>
    <div className="dashboard-footnote"><Check size={14} /><span>Assessment workflow at a glance</span><span className="footnote-spacer" /><span className="dashboard-credit"><img className="dashboard-nexa-logo" src={nexaLogo} alt="" /><span>Developed by <strong>Nexa Circuit LTD</strong></span></span></div>
  </>;
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
        return <tr key={assessment.id}><td className="font-medium text-ink">{assessment.title}</td><td className="text-muted">{[classLabel, assessment.subject?.name || assignment?.subject?.name].filter(Boolean).join(' · ') || '-'}</td><td><span className={`subject-status subject-status-${assessment.status.toLowerCase()}`}>{assessment.status.replaceAll('_', ' ')}</span></td></tr>;
      })}</tbody></table></div>}
      <button className="panel-footer" onClick={() => onNavigate('assessments')}>Go to assessments <ChevronRight size={15} /></button>
    </section>
    <div className="dashboard-footnote"><Check size={14} /><span>Your teaching assignments are up to date.</span><span className="footnote-spacer" /><span className="dashboard-credit"><img className="dashboard-nexa-logo" src={nexaLogo} alt="" /><span>Developed by <strong>Nexa Circuit LTD</strong></span></span></div>
  </>;
}
