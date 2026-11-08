import { useEffect, useState } from 'react';
import { ArrowRight, Check, Circle, LoaderCircle, ListChecks, RefreshCw } from 'lucide-react';
import { fetchSchoolSetupStatus } from './schoolSetupApi.js';

const steps = [
  { id: 'calendar', title: 'Set your academic calendar', description: 'Create an academic year and at least one term so records have the right dates.', pages: [['academic-years', 'Academic years'], ['terms', 'Terms']] },
  { id: 'grading', title: 'Choose a grading scale', description: 'Define the grade boundaries your school uses to assess student results.', pages: [['grading-scales', 'Grading scales']] },
  { id: 'classes', title: 'Build your class structure', description: 'Add class levels, assign a grading scale, and create class groups.', pages: [['class-levels', 'Class levels'], ['class-groups', 'Class groups']] },
  { id: 'curriculum', title: 'Set up your curriculum', description: 'Add subjects and link them to the class levels that teach them.', pages: [['subjects', 'Subjects'], ['class-subjects', 'Class curriculum']] },
  { id: 'staff', title: 'Invite your staff', description: 'Invite teachers now. You can assign their classes and subjects later.', pages: [['users', 'Manage staff']] },
  { id: 'students', title: 'Add your first students', description: 'Add students and enrol them in an academic term to start using registers and reports.', pages: [['students', 'Add students']] }
];

function checklistFor(stepId, counts = {}) {
  const requirements = {
    calendar: [
      ['Create an academic year', counts.academicYears > 0],
      ['Create at least one term', counts.terms > 0]
    ],
    grading: [
      ['Create a grading scale', counts.gradeScales > 0],
      ['Add at least two grade boundaries', counts.gradeBoundaries >= 2]
    ],
    classes: [
      ['Add at least one class level', counts.classLevels > 0],
      ['Add at least one class group', counts.classGroups > 0],
      ['Assign a grading scale to each level', counts.classLevels > 0 && (counts.gradeScales === 1 || counts.gradedClassLevels === counts.classLevels)]
    ],
    curriculum: [
      ['Add at least one subject', counts.subjects > 0],
      ['Link a subject to a class level', counts.classSubjects > 0]
    ],
    staff: [['Invite at least one teacher', counts.teachers > 0]],
    students: [
      ['Add at least one student', counts.students > 0],
      ['Enrol a student in an academic term', counts.activeEnrollments > 0]
    ]
  };
  return (requirements[stepId] || []).map(([label, complete]) => ({ label, complete: Boolean(complete) }));
}

export default function SchoolSetupChecklist({ user, school, signOut, onNavigate, onDismiss, onComplete, onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshStatus() {
    setLoading(true);
    setError('');
    try {
      const nextStatus = await fetchSchoolSetupStatus();
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
      if (nextStatus.complete) onComplete();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshStatus(); }, [user?.id]);

  const completedCount = status?.steps?.filter((step) => step.complete).length || 0;
  const totalCount = status?.steps?.length || steps.length;
  const nextStepId = status?.steps?.find((step) => !step.complete)?.id;

  return (
    <section className="school-setup-hub" aria-labelledby="school-setup-hub-title">
      <header className="school-setup-hub-heading">
        <div>
          <p className="eyebrow">SCHOOL SETUP</p>
          <h1 id="school-setup-hub-title">Get {school?.name || user.schoolName || 'your school'} ready</h1>
          <p>Work through these tasks at your own pace. You can use your workspace and come back to this checklist any time.</p>
        </div>
        <button className="secondary-button setup-workspace-button" type="button" onClick={onDismiss}>
          Go to workspace <ArrowRight size={16} />
        </button>
      </header>

      <section className="school-setup-progress-card" aria-label="Setup progress">
        <div className="school-setup-progress-copy">
          <span className="school-setup-mark"><ListChecks size={18} /></span>
          <div>
            <strong>{status ? completedCount + ' of ' + totalCount + ' tasks complete' : 'Checking setup progress…'}</strong>
            <span>Skip tasks and return later. Some tasks need information from another task first.</span>
          </div>
          <button className="icon-button" type="button" onClick={refreshStatus} disabled={loading} aria-label="Refresh setup progress" title="Refresh progress">
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <RefreshCw size={17} />}
          </button>
        </div>
        <div
          className="school-setup-progress-track"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={completedCount}
        >
          <span style={{ width: (totalCount ? (completedCount / totalCount) * 100 : 0) + '%' }} />
        </div>
      </section>

      {error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" type="button" onClick={refreshStatus}>Try again</button></div>}

      <div className="school-setup-task-grid">
        {steps.map((step) => {
          const stepStatus = status?.steps?.find((item) => item.id === step.id);
          const requirements = checklistFor(step.id, stepStatus?.counts);
          const isComplete = Boolean(stepStatus?.complete);
          const isSuggested = !isComplete && step.id === nextStepId;
          return (
            <article className={'school-setup-task-card ' + (isComplete ? 'school-setup-task-complete' : '')} key={step.id}>
              <div className="school-setup-task-heading">
                <span className={'school-setup-task-status ' + (isComplete ? 'is-complete' : '')}>
                  {isComplete ? <Check size={15} /> : <Circle size={14} />}
                </span>
                <div>
                  <h2>{step.title}</h2>
                  <span className="school-setup-task-state">{isComplete ? 'Complete' : isSuggested ? 'Suggested next' : 'To do'}</span>
                </div>
              </div>
              <p className="school-setup-task-description">{step.description}</p>
              <ul className="school-setup-task-requirements">
                {requirements.map((item) => (
                  <li key={item.label} className={item.complete ? 'requirement-complete' : ''}>
                    {item.complete ? <Check size={14} /> : <Circle size={13} />}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <div className="school-setup-task-actions">
                {step.pages.map(([page, label]) => (
                  <button className="text-button" type="button" key={page} onClick={() => onNavigate(page)}>
                    {label}<ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <p className="school-setup-hub-footnote">You can return to this checklist from the top bar. Skipped tasks stay open until you complete them.</p>
    </section>
  );
}
