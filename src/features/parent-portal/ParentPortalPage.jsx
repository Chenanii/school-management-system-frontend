import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LogOut,
  Printer,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { apiRequest } from '../../api.js';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import NotificationCenter from '../notifications/NotificationCenter.jsx';
import { ReportCardPaper } from '../report-cards/ReportCardsPage.jsx';
import { MidTermReportCardPaper } from '../mid-term-report-cards/MidTermReportCardPage.jsx';
import { formatAcademicMark } from '../../shared/utils/academicMarks.js';

function markLabel(value) {
  return value == null ? '—' : Number(value).toFixed(1).replace(/\.0$/, '');
}

function displayClass(enrollment) {
  if (!enrollment) return 'No class placement';
  return [
    enrollment.classLevel?.name || 'Class',
    enrollment.classGroup?.name,
  ].filter(Boolean).join(' · ');
}

function groupAnnualResults(results) {
  return results.reduce((groups, result) => {
    const year = result.academicYear.name;
    groups[year] = [...(groups[year] || []), result];
    return groups;
  }, {});
}

export default function ParentPortalPage({ user, onSignOut }) {
  const [overview, setOverview] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [midTermReportCard, setMidTermReportCard] = useState(null);
  const [midTermPortalReport, setMidTermPortalReport] = useState(null);
  const [loadingMidTermPortalReport, setLoadingMidTermPortalReport] = useState(false);
  const [downloadingEnrollmentId, setDownloadingEnrollmentId] = useState('');
  const [reportCardError, setReportCardError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/parent-portal/overview');
      setOverview(result.data);
      setSelectedStudentId((current) => (
        result.data.students.some(({ id }) => id === current)
          ? current
          : result.data.students[0]?.id || ''
      ));
    } catch (cause) {
      setError(cause.message || 'Could not load your family portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const student = overview?.students.find(({ id }) => id === selectedStudentId) || overview?.students[0] || null;
  const enrollments = student?.enrollments || [];

  useEffect(() => {
    setSelectedEnrollmentId(student?.currentEnrollment?.id || enrollments[0]?.id || '');
  }, [student?.id]);

  const enrollment = useMemo(
    () => enrollments.find(({ id }) => id === selectedEnrollmentId) || student?.currentEnrollment || enrollments[0] || null,
    [enrollments, selectedEnrollmentId, student],
  );
  const termResults = enrollment?.termResults || [];
  const annualResults = student?.annualResults || [];
  const annualGroups = useMemo(() => groupAnnualResults(annualResults), [annualResults]);
  const endOfTermPublished = Boolean(enrollment?.endOfTermPublishedAt)
    || ['PUBLISHED', 'CLOSED'].includes(enrollment?.term?.status);

  useEffect(() => {
    let cancelled = false;
    setMidTermPortalReport(null);
    setReportCardError('');
    if (!enrollment?.midTermPublishedAt) {
      setLoadingMidTermPortalReport(false);
      return () => { cancelled = true; };
    }
    setLoadingMidTermPortalReport(true);
    apiRequest(`/parent-portal/enrollments/${enrollment.id}/mid-term-report-card`)
      .then((response) => {
        if (!cancelled) setMidTermPortalReport({ enrollmentId: enrollment.id, reportCard: response.data });
      })
      .catch((cause) => {
        if (!cancelled) setReportCardError(cause.message || 'Could not load this mid-term report.');
      })
      .finally(() => { if (!cancelled) setLoadingMidTermPortalReport(false); });
    return () => { cancelled = true; };
  }, [enrollment?.id, enrollment?.midTermPublishedAt]);

  async function downloadReportCard() {
    if (!enrollment || !endOfTermPublished || termResults.length === 0) return;
    setDownloadingEnrollmentId(enrollment.id);
    setReportCardError('');
    setReportCard(null);
    setMidTermReportCard(null);
    try {
      const response = await apiRequest(`/parent-portal/enrollments/${enrollment.id}/report-card`);
      setReportCard(response.data);
      window.setTimeout(() => window.print(), 100);
    } catch (cause) {
      setReportCardError(cause.message || 'Could not prepare this report card.');
    } finally {
      setDownloadingEnrollmentId('');
    }
  }

  async function downloadMidTermReportCard() {
    if (!enrollment?.midTermPublishedAt) return;
    setDownloadingEnrollmentId(enrollment.id);
    setReportCardError('');
    setReportCard(null);
    setMidTermReportCard(null);
    try {
      const cachedReport = midTermPortalReport?.enrollmentId === enrollment.id
        ? midTermPortalReport.reportCard
        : (await apiRequest(`/parent-portal/enrollments/${enrollment.id}/mid-term-report-card`)).data;
      setMidTermReportCard(cachedReport);
      window.setTimeout(() => window.print(), 100);
    } catch (cause) {
      setReportCardError(cause.message || 'Could not prepare this mid-term report card.');
    } finally {
      setDownloadingEnrollmentId('');
    }
  }

  function openNotificationDestination(destination) {
    const targetId = destination === 'parent-term-results' ? 'parent-term-results' : 'parent-progress';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading && !overview) {
    return <main className="parent-portal-page"><div className="parent-portal-loading" role="status">Loading your family portal...</div></main>;
  }

  if (error && !overview) {
    return (
      <main className="parent-portal-page">
        <div className="parent-portal-error" role="alert">
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={loadOverview}><RefreshCw size={15} /> Try again</button>
          <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="parent-portal-page">
      <header className="parent-portal-header">
        <div className="parent-school-mark">
          {overview?.school.logoDataUrl
            ? <img src={overview.school.logoDataUrl} alt="" />
            : <span><GraduationCap size={20} /></span>}
          <div>
            <strong>{overview?.school.name || user.school?.name || 'School portal'}</strong>
            <span>Family portal</span>
          </div>
        </div>
        <div className="parent-portal-account">
          <NotificationCenter schoolId={overview?.school?.id || user.schoolId} userRole={user.role} onNavigate={openNotificationDestination} />
          <span>{initials(user) || 'P'}</span>
          <div><strong>{user.firstName} {user.lastName}</strong><small>Parent / guardian</small></div>
          <button className="parent-signout-button" type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>

      <section className="parent-portal-content" id="parent-progress">
        <div className="parent-portal-welcome">
          <div>
            <p className="eyebrow">Your family</p>
            <h1>Student progress</h1>
            <p>Published results and school information for your linked children.</p>
          </div>
          {student && <div className="parent-linked-count"><UserRound size={17} /><span>{overview.students.length} linked {overview.students.length === 1 ? 'student' : 'students'}</span></div>}
        </div>

        {error && <div className="parent-portal-inline-error" role="alert">{error}<button type="button" onClick={loadOverview}>Refresh</button></div>}
        {!overview?.students.length ? (
          <section className="parent-portal-empty">
            <div><GraduationCap size={24} /></div>
            <h2>No student profiles are linked yet</h2>
            <p>Contact the school office and ask them to check the email address or phone number on your student records.</p>
          </section>
        ) : (
          <>
            <div className="parent-student-picker" aria-label="Choose a student">
              {overview.students.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`parent-student-tab ${item.id === student?.id ? 'parent-student-tab-active' : ''}`}
                  aria-pressed={item.id === student?.id}
                  onClick={() => setSelectedStudentId(item.id)}
                >
                  <span>{initials(item) || 'S'}</span>
                  <span><strong>{formatName(item)}</strong><small>{item.admissionNumber}</small></span>
                  {item.id === student?.id && <CheckCircle2 size={17} />}
                </button>
              ))}
            </div>

            {student && (
              <>
                <section className="parent-student-summary">
                  <div className="parent-student-summary-main">
                    <div className="parent-student-avatar">{initials(student) || 'S'}</div>
                    <div>
                      <p className="eyebrow">Student profile</p>
                      <h2>{formatName(student)}</h2>
                      <span>Admission number · {student.admissionNumber}</span>
                    </div>
                  </div>
                  <div className="parent-student-facts">
                    <div><span>Current class</span><strong>{displayClass(student.currentEnrollment)}</strong></div>
                    <div><span>Current term</span><strong>{student.currentEnrollment?.term?.name || 'Not enrolled'}</strong></div>
                    <div><span>Academic year</span><strong>{student.currentEnrollment?.term?.academicYear?.name || '—'}</strong></div>
                    <div><span>Date of birth</span><strong>{formatDate(student.dateOfBirth)}</strong></div>
                  </div>
                </section>

                <section className="parent-results-section" id="parent-term-results">
                  <div className="parent-section-heading">
                    <div>
                      <span className="parent-section-icon"><BookOpen size={18} /></span>
                      <div><h2>Term results</h2><p>Only results officially published by the school are shown.</p></div>
                    </div>
                    {enrollments.length > 0 && (
                      <label className="parent-term-select">
                        <span className="sr-only">Choose academic term</span>
                        <CalendarDays size={16} />
                        <select value={enrollment?.id || ''} onChange={(event) => setSelectedEnrollmentId(event.target.value)}>
                          {enrollments.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.term?.academicYear?.name} · {item.term?.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} />
                      </label>
                    )}
                  </div>
                  {reportCardError && <div className="parent-portal-inline-error" role="alert">{reportCardError}</div>}
                  {enrollment && endOfTermPublished && <div className="parent-results-actions no-print">
                    <button className="secondary-button" type="button" onClick={downloadReportCard} disabled={!termResults.length || downloadingEnrollmentId === enrollment.id}>
                      <Printer size={16} /> {downloadingEnrollmentId === enrollment.id ? 'Preparing report card…' : 'Download end-of-term report card'}
                    </button>
                  </div>}
                  {enrollment?.midTermPublishedAt && <div className="parent-results-actions no-print">
                    <button className="secondary-button" type="button" onClick={downloadMidTermReportCard} disabled={downloadingEnrollmentId === enrollment.id}>
                      <Printer size={16} /> {downloadingEnrollmentId === enrollment.id ? 'Preparing report card…' : 'Download mid-term report card'}
                    </button>
                  </div>}
                  {enrollment?.midTermPublishedAt && (loadingMidTermPortalReport
                    ? <div className="parent-results-empty" role="status">Loading published mid-term results…</div>
                    : midTermPortalReport?.enrollmentId === enrollment.id && <div className="parent-results-table-wrap">
                      <table className="parent-results-table">
                        <caption className="parent-midterm-results-caption">Published mid-term results</caption>
                        <thead><tr><th>Subject</th><th>Mid-term exam</th><th>Average mark</th><th>Grade</th><th>Grade description</th></tr></thead>
                        <tbody>{midTermPortalReport.reportCard.subjects.map((result) => (
                          <tr key={result.subjectId}>
                            <td><strong>{result.subjectName}</strong><small>{result.subjectCode}</small></td>
                            <td>{result.midTermExam.absent ? 'Absent' : result.midTermExam.percent == null ? '—' : `${result.midTermExam.percent}%`}</td>
                            <td>{formatAcademicMark(result.finalMark, midTermPortalReport.reportCard.scoreOutOf)}</td>
                            <td><span className="parent-grade-chip">{result.grade || '—'}</span></td>
                            <td>{result.gradeDescription || '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>)}
                  {!enrollment ? (
                    <div className="parent-results-empty">No enrollment history is available for this student.</div>
                  ) : termResults.length ? (
                    <>
                    <div className="parent-results-table-wrap">
                      <table className="parent-results-table">
                        <thead><tr><th>Subject</th><th>Mark</th><th>Grade</th><th>Teacher comment</th></tr></thead>
                        <tbody>
                          {termResults.map((result) => (
                            <tr key={result.id}>
                              <td><strong>{result.subject.name}</strong><small>{result.subject.code}</small></td>
                              <td>{markLabel(result.finalMark)}</td>
                              <td><span className="parent-grade-chip">{result.grade || '—'}</span></td>
                              <td>{result.teacherComment || result.gradeDescription || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  ) : (
                    <div className="parent-results-empty"><BookOpen size={18} /><span>No end-of-term subject results have been published for {enrollment.term?.name || 'this term'} yet.{enrollment.midTermPublishedAt ? ' Published mid-term results are shown below.' : ' Published results will appear here once the school releases them.'}</span></div>
                  )}
                </section>

                <section className="parent-results-section parent-annual-section">
                  <div className="parent-section-heading">
                    <div>
                      <span className="parent-section-icon parent-annual-icon"><GraduationCap size={18} /></span>
                      <div><h2>Annual results</h2><p>Published year-end subject results.</p></div>
                    </div>
                  </div>
                  {annualResults.length ? (
                    <div className="parent-annual-groups">
                      {Object.entries(annualGroups).map(([year, results]) => (
                          <div className="parent-annual-group" key={year}>
                            <h3>{year}</h3>
                            <div className="parent-results-table-wrap">
                              <table className="parent-results-table">
                                <thead><tr><th>Subject</th><th>Mark</th><th>Grade</th><th>Description</th></tr></thead>
                                <tbody>{results.map((result) => (
                                  <tr key={result.id}>
                                    <td><strong>{result.subject.name}</strong><small>{result.subject.code}</small></td>
                                    <td>{markLabel(result.finalMark)}</td>
                                    <td><span className="parent-grade-chip">{result.grade || '—'}</span></td>
                                    <td>{result.gradeDescription || '—'}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="parent-results-empty">No annual results have been published for this student yet.</div>
                  )}
                </section>
              </>
            )}
          </>
        )}
        <footer className="parent-portal-footer">For attendance, fee statements, or other school services, please contact the school office.</footer>
      </section>
      {(reportCard || midTermReportCard) && <div className="parent-report-card-print">{reportCard ? <ReportCardPaper reportCard={reportCard} /> : <MidTermReportCardPaper reportCard={midTermReportCard} />}</div>}
    </main>
  );
}
