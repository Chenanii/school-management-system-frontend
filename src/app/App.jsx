import { useCallback, useEffect, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import AuthPage from '../features/auth/AuthPage.jsx';
import useAuth from '../features/auth/useAuth.js';
import DirectoryPage from '../features/directory/DirectoryPage.jsx';
import useDirectoryData from '../features/directory/useDirectoryData.js';
import ClassLevelsPage from '../features/class-levels/ClassLevelsPage.jsx';
import ClassGroupsPage from '../features/class-groups/ClassGroupsPage.jsx';
import ClassSubjectsPage from '../features/class-subjects/ClassSubjectsPage.jsx';
import OverviewPage from '../features/dashboard/OverviewPage.jsx';
import useDashboardData from '../features/dashboard/useDashboardData.js';
import AcademicYearsPage from '../features/academic-years/AcademicYearsPage.jsx';
import GradeScalesPage from '../features/academic-years/GradeScalesPage.jsx';
import TeachingAssignmentsPage from '../features/teaching-assignments/TeachingAssignmentsPage.jsx';
import TermsPage from '../features/terms/TermsPage.jsx';
import AssessmentsPage from '../features/assessments/AssessmentsPage.jsx';
import TermResultsPage from '../features/term-results/TermResultsPage.jsx';
import ReportCardsPage from '../features/report-cards/ReportCardsPage.jsx';
import MidTermReportCardsPage from '../features/mid-term-report-cards/MidTermReportCardPage.jsx';
import PromotionsPage from '../features/promotions/PromotionsPage.jsx';
import SubscriptionsPage from '../features/subscriptions/SubscriptionsPage.jsx';
import TeacherInvitationPage from '../features/teachers/TeacherInvitationPage.jsx';
import TeachersPage from '../features/teachers/TeachersPage.jsx';
import SubjectsPage from '../features/subjects/SubjectsPage.jsx';
import StudentsPage from '../features/students/StudentsPage.jsx';
import EnrollmentsPage from '../features/enrollments/EnrollmentsPage.jsx';
import UsersPage from '../features/users/UsersPage.jsx';
import AuditLogsPage from '../features/audit-logs/AuditLogsPage.jsx';
import SchoolProfilePage from '../features/schools/SchoolProfilePage.jsx';
import ParentPortalPage from '../features/parent-portal/ParentPortalPage.jsx';
import { sections } from '../shared/navigation.js';
import { workspacePath, workspaceRoute } from './workspace-routing.js';
import SchoolAppearancePage from '../features/school-themes/SchoolAppearancePage.jsx';
import ClassAttendancePage from '../features/attendance/ClassAttendancePage.jsx';
import { fetchSchoolTheme } from '../features/school-themes/schoolThemeApi.js';
import { applySchoolTheme } from '../features/school-themes/schoolThemeRuntime.js';

const pageIds = new Set(sections.map(({ id }) => id));

export default function App() {
  const { user, signIn, acceptAuthenticatedSession, signOut } = useAuth();
  const { summary, loading, error, loadSummary, selectSchool, updateCurrentSchool } = useDashboardData(signOut);
  const isTeacherInvitation = window.location.pathname === '/accept-invitation';
  const [page, setPage] = useState(() => workspaceRoute(window.location.pathname, pageIds).page);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [directoryPage, setDirectoryPage] = useState(1);

  const directory = useDirectoryData({
    user,
    page,
    search,
    directoryPage,
    schoolId: summary.school?.id,
    signOut
  });

  useEffect(() => {
    if (user && user.role !== 'PARENT') loadSummary(user);
  }, [user, loadSummary]);

  useEffect(() => {
    if (isTeacherInvitation || !summary.school?.slug) return;
    const route = workspaceRoute(window.location.pathname, pageIds);
    const nextPath = workspacePath(route.page, summary.school.slug);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({ page: route.page }, '', nextPath);
    }
  }, [isTeacherInvitation, summary.school?.slug]);

  useEffect(() => {
  if (
    !user ||
    user.role === 'PARENT' ||
    !summary.school?.id
  ) {
    return undefined;
  }

  let cancelled = false;

  function handleThemeUpdate(event) {
    applySchoolTheme(event.detail);
  }

  window.addEventListener('school-theme-updated', handleThemeUpdate);

  fetchSchoolTheme()
    .then((theme) => {
      if (!cancelled) applySchoolTheme(theme);
    })
    .catch((cause) => {
      if (!cancelled && cause.status === 401) signOut();
      // Theme loading should not prevent the rest of the dashboard from opening.
    });

  return () => {
    cancelled = true;
    window.removeEventListener('school-theme-updated', handleThemeUpdate);
  };
}, [user?.id, user?.role, summary.school?.id, signOut]);

  const navigate = useCallback((nextPage) => {
    setPage(nextPage);
    const nextPath = workspacePath(nextPage, summary.school?.slug);
    if (window.location.pathname !== nextPath) window.history.pushState({ page: nextPage }, '', nextPath);
    setSearch('');
    setDirectoryPage(1);
  }, [summary.school?.slug]);

  const onSchoolProfileSaved = useCallback((school) => {
    updateCurrentSchool(school);
    const nextPath = workspacePath(page, school.slug);
    window.history.replaceState({ page }, '', nextPath);
  }, [page, updateCurrentSchool]);

  useEffect(() => {
    function restorePageFromHistory() {
      setPage(workspaceRoute(window.location.pathname, pageIds).page);
      setSearch('');
      setDirectoryPage(1);
    }
    window.addEventListener('popstate', restorePageFromHistory);
    return () => window.removeEventListener('popstate', restorePageFromHistory);
  }, []);

  const retry = useCallback(() => {
    if (page === 'overview') loadSummary(user);
    else directory.retry();
  }, [page, directory.retry, loadSummary, user]);

  if (isTeacherInvitation) return <TeacherInvitationPage />;
  if (!user) return <AuthPage onSignIn={signIn} onAuthenticated={acceptAuthenticatedSession} />;
  if (user.role === 'PARENT') return <ParentPortalPage user={user} onSignOut={signOut} />;

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={navigate}
        user={user}
        school={summary.school}
        schools={summary.schools}
        schoolLoading={loading}
        onSchoolChange={selectSchool}
        onSignOut={signOut}
        open={mobileNav}
        onClose={() => setMobileNav(false)}
      />
      <main className="main-area">
        <Header page={page} onMenu={() => setMobileNav(true)} user={user} schoolId={summary.school?.id} onNavigate={navigate} />
        <div className="page-content" key={user.role === 'SUPER_ADMIN' ? summary.school?.id || 'no-school-context' : 'school-workspace'}>
          {user.role === 'SUPER_ADMIN' && !summary.school ? (
            loading ? (
              <div className="panel"><div className="empty-state">Loading schools...</div></div>
            ) : error ? (
              <div className="panel">
                <div className="empty-state" role="alert">
                  <p>{error}</p>
                  <button className="text-button mt-3" onClick={() => loadSummary(user)}>Try again</button>
                </div>
              </div>
            ) : (
              <div className="panel">
                <div className="empty-state">
                  <p className="text-sm font-semibold text-ink">
                    {summary.schools.length ? 'Select a school workspace' : 'No schools available'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {summary.schools.length
                      ? 'Choose a school from the selector in the sidebar to access its data.'
                      : 'There are no schools to select. Register a school or try again later.'}
                  </p>
                </div>
              </div>
            )
          ) : page === 'overview' ? (
            <OverviewPage
              summary={summary}
              loading={loading}
              error={error}
              onRetry={retry}
              onNavigate={navigate}
            />
          ) : page === 'academic-years' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <AcademicYearsPage signOut={signOut} />
          ) : page === 'grading-scales' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <GradeScalesPage signOut={signOut} />
          ) : page === 'terms' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <TermsPage signOut={signOut} />
          ) : page === 'teaching-assignments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <TeachingAssignmentsPage signOut={signOut} />
          ) : page === 'assessments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'EXAMS_OFFICER', 'TEACHER'].includes(user.role) ? (
            <AssessmentsPage user={user} signOut={signOut} />
          ) : page === 'term-results' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
          

          <TermResultsPage user={user} onNavigate={navigate} signOut={signOut} />
          ) : page === 'mid-term-report-cards' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER', 'TEACHER', 'FORM_TUTOR'].includes(user.role) ? (
            <MidTermReportCardsPage user={user} signOut={signOut} onNavigate={navigate} />
          ) : page === 'report-cards' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER', 'TEACHER'].includes(user.role) ? (
            <ReportCardsPage user={user} signOut={signOut} onNavigate={navigate} />
          ) : page === 'promotions' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN'].includes(user.role) ? (


            <PromotionsPage user={user} signOut={signOut} />
          ) : page === 'subscriptions' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <SubscriptionsPage user={user} signOut={signOut} />
          ) : page === 'school-profile' && ['SCHOOL_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <SchoolProfilePage signOut={signOut} onSaved={onSchoolProfileSaved} />
          ) : page === 'users' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <UsersPage signOut={signOut} />
          ) : page === 'audit-logs' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
            <AuditLogsPage signOut={signOut} />
          ) : page === 'students' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'TEACHER'].includes(user.role) ? (
            <StudentsPage user={user} signOut={signOut} />
          ) : page === 'enrollments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
            <EnrollmentsPage user={user} signOut={signOut} />
          ) : page === 'attendance' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER', 'TEACHER', 'FORM_TUTOR'].includes(user.role) ? (
            <ClassAttendancePage user={user} signOut={signOut} />
          ) : page === 'subjects' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <SubjectsPage signOut={signOut} />
          ) : page === 'class-levels' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <ClassLevelsPage signOut={signOut} onNavigate={navigate} />
          ) : page === 'class-groups' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <ClassGroupsPage signOut={signOut} />
          ) : page === 'class-subjects' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <ClassSubjectsPage signOut={signOut} />
          
          ) : page === 'school-appearance' &&
            ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <SchoolAppearancePage signOut={signOut} user={user} />
            
          ) : page === 'staff' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'].includes(user.role) ? (
            <TeachersPage signOut={signOut} />
          ) : (
            <DirectoryPage
              type={page}
              {...directory}
              onRetry={retry}
              search={search}
              setSearch={(value) => {
                setSearch(value);
                setDirectoryPage(1);
              }}
              page={directoryPage}
              setPage={setDirectoryPage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
