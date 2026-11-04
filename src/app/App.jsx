import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import Header from "../components/layout/Header.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";
import AuthPage from "../features/auth/AuthPage.jsx";
import useAuth from "../features/auth/useAuth.js";
import DirectoryPage from "../features/directory/DirectoryPage.jsx";
import useDirectoryData from "../features/directory/useDirectoryData.js";
import ClassLevelsPage from "../features/class-levels/ClassLevelsPage.jsx";
import ClassGroupsPage from "../features/class-groups/ClassGroupsPage.jsx";
import ClassSubjectsPage from "../features/class-subjects/ClassSubjectsPage.jsx";
import OverviewPage from "../features/dashboard/OverviewPage.jsx";
import useDashboardData from "../features/dashboard/useDashboardData.js";
import AcademicYearsPage from "../features/academic-years/AcademicYearsPage.jsx";
import GradeScalesPage from "../features/academic-years/GradeScalesPage.jsx";
import TeachingAssignmentsPage from "../features/teaching-assignments/TeachingAssignmentsPage.jsx";
import TermsPage from "../features/terms/TermsPage.jsx";
import AssessmentsPage from "../features/assessments/AssessmentsPage.jsx";
import FormTutorAssessmentsPage from "../features/assessments/FormTutorAssessmentsPage.jsx";
import ReportCardsPage from "../features/report-cards/ReportCardsPage.jsx";
import ReportDesignerPage from "../features/report-cards/ReportDesignerPage.jsx";
import MidTermReportCardsPage from "../features/mid-term-report-cards/MidTermReportCardPage.jsx";
import PromotionsPage from "../features/promotions/PromotionsPage.jsx";
import SubscriptionsPage from "../features/subscriptions/SubscriptionsPage.jsx";
import TermExpiryReminder from "../features/subscriptions/TermExpiryReminder.jsx";
import TeacherInvitationPage from "../features/teachers/TeacherInvitationPage.jsx";
import SubjectsPage from "../features/subjects/SubjectsPage.jsx";
import StudentsPage from "../features/students/StudentsPage.jsx";
import EnrollmentsPage from "../features/enrollments/EnrollmentsPage.jsx";
import UsersPage from "../features/users/UsersPage.jsx";
import AuditLogsPage from "../features/audit-logs/AuditLogsPage.jsx";
import SchoolProfilePage from "../features/schools/SchoolProfilePage.jsx";
import ParentPortalPage from "../features/parent-portal/ParentPortalPage.jsx";
import { sections } from "../shared/navigation.js";
import { workspacePath, workspaceRoute } from "./workspace-routing.js";
import SchoolAppearancePage from "../features/school-themes/SchoolAppearancePage.jsx";
import ClassAttendancePage from "../features/attendance/ClassAttendancePage.jsx";
import { fetchSchoolTheme } from "../features/school-themes/schoolThemeApi.js";
import { applySchoolTheme } from "../features/school-themes/schoolThemeRuntime.js";
import SchoolSetupWizard from "../features/onboarding/SchoolSetupWizard.jsx";
import { fetchSchoolSetupStatus } from "../features/onboarding/schoolSetupApi.js";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.jsx";
import ProfilesPage from "../features/users/ProfilesPage.jsx";
import LandingPage from "../features/landing/LandingPage.jsx";
import SchoolManagementPage from "../features/schools/SchoolManagementPage.jsx";

const pageIds = new Set(sections.map(({ id }) => id));

export default function App() {
  const { user, signIn, signOut, updateUser } = useAuth();
  const {
    summary,
    loading,
    error,
    loadSummary,
    selectSchool,
    updateCurrentSchool,
  } = useDashboardData(signOut);
  const isTeacherInvitation = window.location.pathname === "/accept-invitation";
  const isPasswordReset = window.location.pathname === "/reset-password";
  const isLandingPage = window.location.pathname === "/";
  const [page, setPage] = useState(
    () => workspaceRoute(window.location.pathname, pageIds).page,
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem("nexa-sidebar-collapsed") === "true");
  const [search, setSearch] = useState("");
  const [directoryPage, setDirectoryPage] = useState(1);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [schoolSetup, setSchoolSetup] = useState(null);
  const [schoolSetupLoading, setSchoolSetupLoading] = useState(false);
  const [schoolSetupError, setSchoolSetupError] = useState("");
  const requestSignOut = useCallback(() => setConfirmingSignOut(true), []);
  const confirmSignOut = useCallback(() => {
    setConfirmingSignOut(false);
    signOut();
  }, [signOut]);

  const directory = useDirectoryData({
    user,
    page,
    search,
    directoryPage,
    schoolId: summary.school?.id,
    signOut,
  });

  useEffect(() => {
    if (user && user.role !== "PARENT") loadSummary(user);
  }, [user, loadSummary]);

  useEffect(() => {
    window.localStorage.setItem("nexa-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const loadSchoolSetup = useCallback(async () => {
    if (user?.role !== "SCHOOL_ADMIN" || !user.schoolId) {
      setSchoolSetup(null);
      setSchoolSetupLoading(false);
      setSchoolSetupError("");
      return;
    }
    setSchoolSetupLoading(true);
    setSchoolSetupError("");
    try {
      setSchoolSetup(await fetchSchoolSetupStatus());
    } catch (cause) {
      setSchoolSetupError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSchoolSetupLoading(false);
    }
  }, [user?.id, user?.role, user?.schoolId, signOut]);

  const refreshSchoolSetup = useCallback(async () => {
    if (user?.role !== "SCHOOL_ADMIN" || !user.schoolId) return;
    try {
      setSchoolSetup(await fetchSchoolSetupStatus());
      setSchoolSetupError("");
    } catch (cause) {
      setSchoolSetupError(cause.message);
      if (cause.status === 401) signOut();
    }
  }, [user?.role, user?.schoolId, signOut]);

  useEffect(() => {
    loadSchoolSetup();
  }, [loadSchoolSetup]);

  useEffect(() => {
    if (isTeacherInvitation || !summary.school?.slug) return;
    const route = workspaceRoute(window.location.pathname, pageIds);
    const nextPath = workspacePath(route.page, summary.school.slug);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({ page: route.page }, "", nextPath);
    }
  }, [isTeacherInvitation, summary.school?.slug]);

  useEffect(() => {
    const schoolId = user?.role === "SUPER_ADMIN"
      ? summary.school?.id
      : user?.schoolId;
    if (!user || !schoolId) {
      return undefined;
    }

    let cancelled = false;

    function handleThemeUpdate(event) {
      applySchoolTheme(event.detail);
    }

    async function refreshSchoolTheme() {
      try {
        const theme = await fetchSchoolTheme();
        if (!cancelled) applySchoolTheme(theme);
      } catch (cause) {
        if (!cancelled && cause.status === 401) signOut();
        // Theme loading should not prevent the rest of the dashboard from opening.
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") refreshSchoolTheme();
    }

    window.addEventListener("school-theme-updated", handleThemeUpdate);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    refreshSchoolTheme();

    return () => {
      cancelled = true;
      window.removeEventListener("school-theme-updated", handleThemeUpdate);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [user?.id, user?.schoolId, user?.role, summary.school?.id, signOut]);

  const navigate = useCallback(
    (nextPage) => {
      setPage(nextPage);
      const nextPath = workspacePath(nextPage, summary.school?.slug);
      if (window.location.pathname !== nextPath)
        window.history.pushState({ page: nextPage }, "", nextPath);
      setSearch("");
      setDirectoryPage(1);
    },
    [summary.school?.slug],
  );

  const onSchoolProfileSaved = useCallback(
    (school) => {
      updateCurrentSchool(school);
      const nextPath = workspacePath(page, school.slug);
      window.history.replaceState({ page }, "", nextPath);
    },
    [page, updateCurrentSchool],
  );

  useEffect(() => {
    function restorePageFromHistory() {
      setPage(workspaceRoute(window.location.pathname, pageIds).page);
      setSearch("");
      setDirectoryPage(1);
    }
    window.addEventListener("popstate", restorePageFromHistory);
    return () => window.removeEventListener("popstate", restorePageFromHistory);
  }, []);

  const retry = useCallback(() => {
    if (page === "overview") loadSummary(user);
    else directory.retry();
  }, [page, directory.retry, loadSummary, user]);

  if (isTeacherInvitation) return <TeacherInvitationPage />;
  if (isPasswordReset) return <ResetPasswordPage />;
  if (!user && isLandingPage) return <LandingPage />;
  if (!user)
    return (
      <AuthPage
        onSignIn={signIn}
      />
    );
  if (user.role === "PARENT")
    return (
      <>
        <ParentPortalPage user={user} onSignOut={requestSignOut} />
        {confirmingSignOut && (
          <SignOutConfirmation
            onCancel={() => setConfirmingSignOut(false)}
            onConfirm={confirmSignOut}
          />
        )}
      </>
    );
  if (
    user.role === "SCHOOL_ADMIN" &&
    user.schoolId &&
    (schoolSetupLoading || !schoolSetup)
  ) {
    return (
      <main className="school-setup-loading-screen">
        {schoolSetupError ? (
          <section role="alert">
            <p>{schoolSetupError}</p>
            <button
              className="primary-button"
              type="button"
              onClick={loadSchoolSetup}
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <span className="school-setup-mark">
              <LoaderCircle size={20} className="animate-spin" />
            </span>
            <p>Preparing your school workspace…</p>
          </>
        )}
      </main>
    );
  }
  if (
    user.role === "SCHOOL_ADMIN" &&
    user.schoolId &&
    schoolSetup &&
    !schoolSetup.complete
  ) {
    return (
      <SchoolSetupWizard
        user={user}
        signOut={signOut}
        onComplete={() => {
          setSchoolSetup({ ...schoolSetup, complete: true });
          loadSummary(user);
        }}
      />
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "app-shell-sidebar-collapsed" : ""}`}>
      <Sidebar
        page={page}
        setPage={navigate}
        user={user}
        school={summary.school}
        schools={summary.schools}
        schoolLoading={loading}
        onSchoolChange={selectSchool}
        onSignOut={requestSignOut}
        open={mobileNav}
        onClose={() => setMobileNav(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="main-area">
        <Header
          page={page}
          onMenu={() => setMobileNav(true)}
          user={user}
          schoolId={summary.school?.id}
          onNavigate={navigate}
        />
        <div
          className="page-content"
          key={
            user.role === "SUPER_ADMIN"
              ? summary.school?.id || "no-school-context"
              : "school-workspace"
          }
        >
          {user.role === "SUPER_ADMIN" && !summary.school && page !== "subscriptions" && page !== "school-management" ? (
            loading ? (
              <div className="panel">
                <div className="empty-state">Loading schools...</div>
              </div>
            ) : error ? (
              <div className="panel">
                <div className="empty-state" role="alert">
                  <p>{error}</p>
                  <button
                    className="text-button mt-3"
                    onClick={() => loadSummary(user)}
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel">
                <div className="empty-state">
                  <p className="text-sm font-semibold text-ink">
                    {summary.schools.length
                      ? "Select a school workspace"
                      : "No schools available"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {summary.schools.length
                      ? "Choose a school from the selector in the sidebar to access its data."
                      : "There are no schools to select. Register a school or try again later."}
                  </p>
                </div>
              </div>
            )
          ) : page === "overview" ? (
            <OverviewPage
              summary={summary}
              loading={loading}
              error={error}
              onRetry={retry}
              onNavigate={navigate}
            />
          ) : page === "profiles" ? (
            <ProfilesPage signOut={signOut} onSaved={updateUser} />
          ) : page === "academic-years" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <AcademicYearsPage signOut={signOut} />
          ) : page === "grading-scales" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <GradeScalesPage signOut={signOut} onScaleCreated={refreshSchoolSetup} />
          ) : page === "terms" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <TermsPage user={user} signOut={signOut} />
          ) : page === "teaching-assignments" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <TeachingAssignmentsPage signOut={signOut} />
          ) : page === "assessments" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "EXAMS_OFFICER",
              "TEACHER",
              "FORM_TUTOR",
            ].includes(user.role) ? (
            user.role === "FORM_TUTOR" ? <FormTutorAssessmentsPage signOut={signOut} /> : <AssessmentsPage user={user} signOut={signOut} />
          ) : page === "mid-term-report-cards" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
              "EXAMS_OFFICER",
              "TEACHER",
              "FORM_TUTOR",
            ].includes(user.role) ? (
            <MidTermReportCardsPage
              user={user}
              signOut={signOut}
              onNavigate={navigate}
            />
          ) : page === "report-cards" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
              "EXAMS_OFFICER",
              "TEACHER",
            ].includes(user.role) ? (
            <ReportCardsPage
              user={user}
              signOut={signOut}
              onNavigate={navigate}
            />
          ) : page === "promotions" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
            ].includes(user.role) ? (
            <PromotionsPage user={user} signOut={signOut} />
          ) : page === "school-management" && user.role === "SUPER_ADMIN" ? (
            <SchoolManagementPage signOut={signOut} onDeleted={() => loadSummary(user)} />
          ) : page === "subscriptions" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(user.role) ? (
            <SubscriptionsPage user={user} signOut={signOut} />
          ) : page === "school-profile" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(user.role) ? (
            <SchoolProfilePage
              signOut={signOut}
              onSaved={onSchoolProfileSaved}
            />
          ) : page === "users" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <UsersPage signOut={signOut} user={user} />
          ) : page === "audit-logs" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
              "EXAMS_OFFICER",
            ].includes(user.role) ? (
            <AuditLogsPage signOut={signOut} />
          ) : page === "students" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER", "TEACHER"].includes(
              user.role,
            ) ? (
            <StudentsPage user={user} signOut={signOut} />
          ) : page === "enrollments" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
              "EXAMS_OFFICER",
            ].includes(user.role) ? (
            <EnrollmentsPage user={user} signOut={signOut} />
          ) : page === "attendance" &&
            [
              "SCHOOL_ADMIN",
              "SUPER_ADMIN",
              "HEADTEACHER",
              "ACADEMIC_ADMIN",
              "EXAMS_OFFICER",
              "TEACHER",
              "FORM_TUTOR",
            ].includes(user.role) ? (
            <ClassAttendancePage user={user} signOut={signOut} />
          ) : page === "subjects" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <SubjectsPage signOut={signOut} />
          ) : page === "class-levels" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <ClassLevelsPage signOut={signOut} onNavigate={navigate} />
          ) : page === "class-groups" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <ClassGroupsPage signOut={signOut} />
          ) : page === "class-subjects" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <ClassSubjectsPage signOut={signOut} />
          ) : page === "school-appearance" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(
              user.role,
            ) ? (
            <SchoolAppearancePage signOut={signOut} user={user} />
          ) : page === "report-designer" &&
            ["SCHOOL_ADMIN", "SUPER_ADMIN", "HEADTEACHER"].includes(user.role) ? (
            <ReportDesignerPage signOut={signOut} />
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
      <TermExpiryReminder user={user} schoolId={summary.school?.id} page={page} onNavigate={navigate} />
      {confirmingSignOut && (
        <SignOutConfirmation
          onCancel={() => setConfirmingSignOut(false)}
          onConfirm={confirmSignOut}
        />
      )}
    </div>
  );
}

function SignOutConfirmation({ onCancel, onConfirm }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="user-modal signout-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-confirm-title"
        aria-describedby="signout-confirm-description"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Sign out</p>
            <h2 id="signout-confirm-title">Are you sure?</h2>
            <p id="signout-confirm-description">
              You’ll need to sign in again to return to your school portal.
            </p>
          </div>
        </div>
        <div className="modal-actions signout-confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
