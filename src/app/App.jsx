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
import TeachingAssignmentsPage from '../features/teaching-assignments/TeachingAssignmentsPage.jsx';
import TermsPage from '../features/terms/TermsPage.jsx';
import AssessmentsPage from '../features/assessments/AssessmentsPage.jsx';
import TermResultsPage from '../features/term-results/TermResultsPage.jsx';
import ReportCardsPage from '../features/report-cards/ReportCardsPage.jsx';
import PromotionsPage from '../features/promotions/PromotionsPage.jsx';
import SubscriptionsPage from '../features/subscriptions/SubscriptionsPage.jsx';
import TeacherInvitationPage from '../features/teachers/TeacherInvitationPage.jsx';
import TeachersPage from '../features/teachers/TeachersPage.jsx';
import SubjectsPage from '../features/subjects/SubjectsPage.jsx';
import StudentsPage from '../features/students/StudentsPage.jsx';
import EnrollmentsPage from '../features/enrollments/EnrollmentsPage.jsx';
import UsersPage from '../features/users/UsersPage.jsx';

export default function App() {
  const { user, signIn, signOut } = useAuth();
  const { summary, loading, error, loadSummary, selectSchool } = useDashboardData(signOut);
  const isTeacherInvitation = window.location.pathname === '/accept-invitation';
  const [page, setPage] = useState('overview');
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
    if (user) loadSummary(user);
  }, [user, loadSummary]);

  const navigate = useCallback((nextPage) => {
    setPage(nextPage);
    setSearch('');
    setDirectoryPage(1);
  }, []);

  const retry = useCallback(() => {
    if (page === 'overview') loadSummary(user);
    else directory.retry();
  }, [page, directory.retry, loadSummary, user]);

  if (isTeacherInvitation) return <TeacherInvitationPage />;
  if (!user) return <AuthPage onSignIn={signIn} />;

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
        <Header page={page} onMenu={() => setMobileNav(true)} user={user} />
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
          ) : page === 'academic-years' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <AcademicYearsPage signOut={signOut} />
          ) : page === 'terms' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <TermsPage signOut={signOut} />
          ) : page === 'teaching-assignments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <TeachingAssignmentsPage signOut={signOut} />
          ) : page === 'assessments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <AssessmentsPage signOut={signOut} />
          ) : page === 'term-results' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
            <TermResultsPage signOut={signOut} />
          ) : page === 'report-cards' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
            <ReportCardsPage signOut={signOut} />
          ) : page === 'promotions' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN'].includes(user.role) ? (
            <PromotionsPage user={user} signOut={signOut} />
          ) : page === 'subscriptions' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <SubscriptionsPage user={user} signOut={signOut} />
          ) : page === 'users' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <UsersPage signOut={signOut} />
          ) : page === 'students' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <StudentsPage signOut={signOut} />
          ) : page === 'enrollments' && ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role) ? (
            <EnrollmentsPage user={user} signOut={signOut} />
          ) : page === 'subjects' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <SubjectsPage signOut={signOut} />
          ) : page === 'class-levels' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <ClassLevelsPage signOut={signOut} />
          ) : page === 'class-groups' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <ClassGroupsPage signOut={signOut} />
          ) : page === 'class-subjects' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
            <ClassSubjectsPage signOut={signOut} />
          ) : page === 'staff' && ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (
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
