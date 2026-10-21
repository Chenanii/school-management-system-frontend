import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Circle, LoaderCircle, ListChecks, LogOut, RefreshCw } from 'lucide-react';
import AcademicYearsPage from '../academic-years/AcademicYearsPage.jsx';
import GradeScalesPage from '../academic-years/GradeScalesPage.jsx';
import TermsPage from '../terms/TermsPage.jsx';
import ClassLevelsPage from '../class-levels/ClassLevelsPage.jsx';
import ClassGroupsPage from '../class-groups/ClassGroupsPage.jsx';
import SubjectsPage from '../subjects/SubjectsPage.jsx';
import ClassSubjectsPage from '../class-subjects/ClassSubjectsPage.jsx';
import TeachersPage from '../teachers/TeachersPage.jsx';
import StudentsPage from '../students/StudentsPage.jsx';
import { fetchSchoolSetupStatus } from './schoolSetupApi.js';

const steps = [
  { id: 'calendar', title: 'Set your academic calendar', description: 'Create an academic year and at least one term so records have the right dates.', pages: [['academic-years', 'Academic years'], ['terms', 'Terms']] },
  { id: 'grading', title: 'Choose a grading scale', description: 'Define the grade boundaries your school uses to assess student results.', pages: [['grading-scales', 'Grading scales']] },
  { id: 'classes', title: 'Build your class structure', description: 'Add class levels, assign a grading scale to each one, and create at least one class group.', pages: [['class-levels', 'Class levels'], ['class-groups', 'Class groups']] },
  { id: 'curriculum', title: 'Set up your curriculum', description: 'Add subjects and link at least one subject to a class level.', pages: [['subjects', 'Subjects'], ['class-subjects', 'Class curriculum']] },
  { id: 'staff', title: 'Add a teacher', description: 'Add at least one teacher before managing teaching assignments and classes.', pages: [['staff', 'Teaching staff']] },
  { id: 'students', title: 'Enrol your first student', description: 'Add a student to an academic term so class registers and reports can start using real school data.', pages: [['students', 'Students']] }
];

const allowedPages = new Set(steps.flatMap((step) => step.pages.map(([page]) => page)));

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
      ['Assign a grading scale to each level', counts.gradeScales === 1 || counts.gradedClassLevels === counts.classLevels]
    ],
    curriculum: [
      ['Add at least one subject', counts.subjects > 0],
      ['Link a subject to a class level', counts.classSubjects > 0]
    ],
    staff: [['Add at least one teacher', counts.teachers > 0]],
    students: [
      ['Add at least one student', counts.students > 0],
      ['Enrol a student in an academic term', counts.activeEnrollments > 0]
    ]
  };
  return (requirements[stepId] || []).map(([label, complete]) => ({ label, complete: Boolean(complete) }));
}

function SetupPage({ page, user, signOut, onNavigate, onScaleCreated }) {
  if (page === 'academic-years') return <AcademicYearsPage signOut={signOut} onNavigate={onNavigate} />;
  if (page === 'terms') return <TermsPage signOut={signOut} />;
  if (page === 'grading-scales') return <GradeScalesPage signOut={signOut} onScaleCreated={onScaleCreated} />;
  if (page === 'class-levels') return <ClassLevelsPage signOut={signOut} onNavigate={onNavigate} />;
  if (page === 'class-groups') return <ClassGroupsPage signOut={signOut} />;
  if (page === 'subjects') return <SubjectsPage signOut={signOut} />;
  if (page === 'class-subjects') return <ClassSubjectsPage signOut={signOut} />;
  if (page === 'staff') return <TeachersPage signOut={signOut} />;
  if (page === 'students') return <StudentsPage user={user} signOut={signOut} />;
  return null;
}

export default function SchoolSetupWizard({ user, signOut, onComplete }) {
  const [status, setStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activePage, setActivePage] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const stepStatus = status?.steps?.find((step) => step.id === steps[activeStep].id);
  const canContinue = Boolean(stepStatus?.complete);
  const checklist = checklistFor(steps[activeStep].id, stepStatus?.counts);

  async function refreshStatus() {
    setLoading(true);
    setError('');
    try {
      const nextStatus = await fetchSchoolSetupStatus();
      setStatus(nextStatus);
      if (nextStatus.complete) onComplete();
      else setActiveStep(Math.max(0, nextStatus.steps.findIndex((step) => !step.complete)));
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshStatus(); }, [user?.id]);

  function navigateTo(page) {
    if (!allowedPages.has(page)) return;
    setActivePage(page);
    setShowGuide(false);
  }

  const routeFromPage = (page) => {
    if (allowedPages.has(page)) navigateTo(page);
  };

  const active = steps[activeStep];

  return (
    <div className="school-setup-workspace">
      {activePage ? <>
        <div className="school-setup-bar">
          <div><span className="school-setup-mark"><ListChecks size={17} /></span><div><strong>School setup</strong><span>{active.title}</span></div></div>
          <div className="school-setup-bar-actions">
            {active.pages.map(([page, label]) => <button className={activePage === page ? 'school-setup-tab-active' : ''} type="button" key={page} onClick={() => setActivePage(page)}>{label}</button>)}
            <button className="primary-button" type="button" onClick={() => { setShowGuide(true); refreshStatus(); }}>Continue Setup guide</button>
          </div>
        </div>
        <main className="school-setup-content"><SetupPage page={activePage} user={user} signOut={signOut} onNavigate={routeFromPage} onScaleCreated={refreshStatus} /></main>
      </> : null}

      {showGuide && <div className="modal-backdrop school-setup-backdrop" role="presentation">
        <section className="user-modal school-setup-modal" role="dialog" aria-modal="true" aria-labelledby="school-setup-title" aria-describedby="school-setup-description">
          <div className="school-setup-modal-top"><span className="school-setup-mark"><ListChecks size={18} /></span><span>Step {activeStep + 1} of {steps.length}</span><button className="text-button" type="button" onClick={signOut}><LogOut size={14} /> Sign out</button></div>
          <div className="school-setup-progress" aria-label={`${activeStep + 1} of ${steps.length} setup steps`}>
            {steps.map((step, index) => <span key={step.id} className={index <= activeStep ? 'school-setup-progress-active' : ''} />)}
          </div>
          {loading && !status ? <div className="school-setup-loading"><LoaderCircle size={22} className="animate-spin" /> Checking your setup…</div> : <>
            <p className="eyebrow">Welcome to your school workspace</p>
            <h1 id="school-setup-title">{active.title}</h1>
            <p id="school-setup-description" className="school-setup-description">{active.description}</p>
            <div className="school-setup-checklist">
              {checklist.map((item) => <div className="school-setup-check-row" key={item.label}>
                {item.complete ? <Check size={16} /> : <Circle size={16} />}
                <span>{item.label}</span>
              </div>)}
              {stepStatus?.complete && <div className="school-setup-complete"><Check size={15} /> This step is complete</div>}
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="school-setup-step-links">
              {active.pages.map(([page, label]) => <button className="primary-button" type="button" key={page} onClick={() => navigateTo(page)}>{label}</button>)}
              <button className="text-button" type="button" onClick={refreshStatus} disabled={loading}><RefreshCw size={14} /> {loading ? 'Checking…' : 'Refresh progress'}</button>
            </div>
            <div className="school-setup-modal-footer">
              <button className="secondary-button" type="button" onClick={() => setActiveStep((current) => Math.max(0, current - 1))} disabled={activeStep === 0}><ArrowLeft size={15} /> Back</button>
              {activeStep < steps.length - 1
                ? <button className="secondary-button" type="button" onClick={() => setActiveStep((current) => Math.min(steps.length - 1, current + 1))} disabled={!canContinue}>Next step <ArrowRight size={15} /></button>
                : <button className="primary-button" type="button" onClick={refreshStatus} disabled={!canContinue || loading}>{loading ? 'Checking…' : 'Finish setup'} <Check size={15} /></button>}
            </div>
          </>}
        </section>
      </div>}
    </div>
  );
}
