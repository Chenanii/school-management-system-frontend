import { useEffect, useState } from 'react';
import { FileText, ListChecks, LoaderCircle, Printer, RotateCcw } from 'lucide-react';
import { fetchAllPages, fetchClassGroupReportCards, publishClassGroupEndOfTermReports, unpublishClassGroupEndOfTermReports, saveEndOfTermReportDetails } from './reportCardApi.js';
import { formatAcademicMark } from '../../shared/utils/academicMarks.js';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';
import cambridgeAssessmentLogo from '../../assets/cambridge-assessment-logo.png';

function studentName(student) {
  return [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ') || 'Student';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
}

function termLabel(term) {
  return `${term.academicYear?.name || 'Academic year'} · ${term.sequence}. ${term.name}`;
}

export function ReportCardPaper({ reportCard, canEditDetails = false }) {
  const [details, setDetails] = useState({ behaviorComments: {}, coCurricularComments: {}, promotedTo: reportCard.nextEnrollment?.classLevel?.name || '', promotionRemarks: '', ...(reportCard.reportDetails || {}) });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsNotice, setDetailsNotice] = useState('');
  const [detailsError, setDetailsError] = useState('');
  async function saveDetails() {
    setSavingDetails(true); setDetailsError(''); setDetailsNotice('');
    try { const { data } = await saveEndOfTermReportDetails(reportCard.enrollment.id, details); setDetails((current) => ({ ...current, ...data })); setDetailsNotice('Saved'); }
    catch (cause) { setDetailsError(cause.message); }
    finally { setSavingDetails(false); }
  }
  function detailField(group, key, label) {
    const value = group === 'promotion' ? details[key] : details[group]?.[key];
    return <td><span className="report-card-detail-print">{value || '—'}</span>{canEditDetails && <textarea className="report-card-detail-input no-print" aria-label={label} rows={2} maxLength={group === 'promotion' ? (key === 'promotedTo' ? 120 : 1000) : 500} value={value || ''} onChange={(event) => setDetails((current) => group === 'promotion' ? { ...current, [key]: event.target.value } : { ...current, [group]: { ...current[group], [key]: event.target.value } })} />}</td>;
  }
  const school = reportCard.school;
  const design = { title: 'End-of-Term Report Card', showLogo: true, showContact: true, showSummary: true, showGradeDescription: true, showTeacherComments: true, showSignatures: true, footerText: 'Coursework and mid-term average contribute 40%; the final exam contributes 60%.', sections: ['studentDetails', 'academicPerformance', 'behaviorDiscipline', 'coCurricular', 'promotionRemarks', 'gradingKey', 'summary', 'signatures'], headerSections: ['studentDetails', 'classYear', 'termDates'], ...(school?.reportDesign?.endOfTerm || {}) };
  const sections = {
    studentDetails: <div className="report-card-student-summary"><div><span>Student name</span><strong>{studentName(reportCard.student)}</strong></div><div><span>Admission number</span><strong>{reportCard.student?.admissionNumber || '—'}</strong></div><div><span>Class</span><strong>{reportCard.classLevel?.name || reportCard.classGroup?.classLevel?.name || '—'}</strong></div><div><span>Academic year · Term</span><strong>{reportCard.academicYear?.name} · {reportCard.term?.sequence}. {reportCard.term?.name}</strong></div></div>,
    academicPerformance: <><h3 className="report-card-section-title">Academic performance</h3>{reportCard.summary.requiredSubjects === 0 && <p className="report-card-no-subjects">No elective subject streams are assigned to this student for the selected term.</p>}<div className="overflow-x-auto"><table className="people-table report-card-subject-table"><thead><tr><th>#</th><th>Subject</th><th>Final mark</th><th>Grade</th>{design.showGradeDescription && <th>Grade description</th>}{design.showTeacherComments && <th>Teacher comment</th>}</tr></thead><tbody>{reportCard.subjects.map((subject, index) => <tr key={subject.subjectId}><td>{index + 1}</td><td><strong>{subject.subjectName}</strong><span className="report-card-subject-code">{subject.subjectCode}</span></td><td className="report-card-mark">{subject.complete ? formatAcademicMark(subject.finalMark, reportCard.scoreOutOf) : 'Pending'}</td><td><strong>{subject.grade || '—'}</strong></td>{design.showGradeDescription && <td>{subject.gradeDescription || '—'}</td>}{design.showTeacherComments && <td>{subject.teacherComment || '—'}</td>}</tr>)}</tbody></table></div></>,
    behaviorDiscipline: <><h3 className="report-card-section-title">Behaviour & discipline</h3><table className="people-table report-card-subject-table"><thead><tr><th>Area</th><th>Comment</th></tr></thead><tbody>{[['Classroom conduct', 'classroomConduct'], ['Respect & responsibility', 'respectResponsibility'], ['Participation', 'participation']].map(([item, key]) => <tr key={key}><td>{item}</td>{detailField('behaviorComments', key, `${item} comment`)}</tr>)}</tbody></table></>,
    coCurricular: <><h3 className="report-card-section-title">Co-curricular activities</h3><table className="people-table report-card-subject-table"><thead><tr><th>Activity type</th><th>Participation / comment</th></tr></thead><tbody>{[['Sports', 'sports'], ['Arts', 'arts'], ['Clubs / other', 'clubsOther']].map(([item, key]) => <tr key={key}><td>{item}</td>{detailField('coCurricularComments', key, `${item} comment`)}</tr>)}</tbody></table></>,
    promotionRemarks: <><h3 className="report-card-section-title">Promotion remarks</h3><p className="report-card-promotion-writein">Promoted to: <span className="report-card-detail-print">{details.promotedTo || reportCard.nextEnrollment?.classLevel?.name || '—'}</span>{canEditDetails && <input className="report-card-detail-input no-print" aria-label="Promotion destination" maxLength={120} value={details.promotedTo || ''} onChange={(event) => setDetails((current) => ({ ...current, promotedTo: event.target.value }))} />}</p>{reportCard.nextEnrollment?.term?.startDate && <p>Next term opens on: {formatDate(reportCard.nextEnrollment.term.startDate)}</p>}<label className="report-card-remarks-field"><span>Remarks</span><span className="report-card-detail-print">{details.promotionRemarks || '—'}</span>{canEditDetails && <textarea className="report-card-detail-input no-print" rows={3} maxLength={1000} value={details.promotionRemarks || ''} onChange={(event) => setDetails((current) => ({ ...current, promotionRemarks: event.target.value }))} />}</label></>,
    gradingKey: <><h3 className="report-card-section-title">Numerical grading system</h3><table className="people-table report-card-subject-table"><thead><tr><th>Grade</th><th>Marks ({reportCard.scoreOutOf})</th><th>Description</th></tr></thead><tbody>{(reportCard.gradeKey || []).map((item) => <tr key={item.grade}><td>{item.grade}</td><td>{item.minMark} – {item.maxMark}</td><td>{item.description || '—'}</td></tr>)}</tbody></table></>,
    summary: design.showSummary && <div className="report-card-summary"><div><span>Subjects published</span><strong>{reportCard.summary.publishedSubjects} / {reportCard.summary.requiredSubjects}</strong></div><div><span>Average mark</span><strong>{formatAcademicMark(reportCard.summary.averageMark, reportCard.scoreOutOf)}</strong></div><div><span>Report status</span><strong>{reportCard.complete ? 'Complete' : 'Incomplete'}</strong></div></div>,
    signatures: design.showSignatures && <footer className="report-card-signatures"><div><span>Class teacher signature</span><strong>{school?.classTeacherSignerName || 'Class teacher not assigned'}</strong><i /></div><div><span>Headteacher signature</span><strong>{school?.headteacherSignerName || 'Headteacher not assigned'}</strong><i /></div><div><span>Date issued</span><strong>{formatDate(reportCard.issuedAt)}</strong></div></footer>,
  };
  const headerItems = {
    studentDetails: <><span>Student name</span><strong>{studentName(reportCard.student)}</strong><small>Admission number · {reportCard.student?.admissionNumber || '—'}</small></>,
    classYear: <><span>Class · Academic year</span><strong>{reportCard.classGroup?.name || reportCard.classLevel?.name || '—'}</strong><small>{reportCard.academicYear?.name || '—'}</small></>,
    termDates: <><span>Term · Next term opens</span><strong>{reportCard.term?.sequence}. {reportCard.term?.name}</strong><small>{reportCard.nextEnrollment?.term?.startDate ? formatDate(reportCard.nextEnrollment.term.startDate) : '—'}</small></>,
    schoolContact: <><span>School contact</span><strong>{school?.address || '—'}</strong><small>{[school?.phone, school?.email].filter(Boolean).join(' · ') || '—'}</small></>,
  };
  return (
    <article className="report-card-paper">
      <header className="report-card-school-heading">
        <div className="report-card-school-logo-slot">{design.showLogo && (school?.logoDataUrl
          ? <img className="report-card-school-logo" src={school.logoDataUrl} alt={`${school.name} logo`} />
          : <div className="report-card-school-mark">{(school?.name || 'S').slice(0, 1).toUpperCase()}</div>)}</div>
        <div className="report-card-school-identity">
          <p className="eyebrow">Student academic report</p>
          <h1>{school?.name || 'School'}</h1>
          {design.showContact && (school?.address || (!design.headerSections.includes('schoolContact') && (school?.phone || school?.email))) && <p className="report-card-school-contact">{[school.address, ...(!design.headerSections.includes('schoolContact') ? [school.phone, school.email] : [])].filter(Boolean).join(' · ')}</p>}
          <h2>{design.title}</h2>
        </div>
        <div className="report-card-school-logo-slot report-card-school-logo-slot-right">{design.showLogo && school?.secondaryLogoDataUrl && <img className="report-card-school-logo" src={school.secondaryLogoDataUrl} alt={`${school.name} additional logo`} />}</div>
      </header>
      <div className="report-card-header-sections">{design.headerSections.map((id, index) => <div className="report-card-header-cell" key={`${id}-${index}`}>{headerItems[id]}</div>)}</div>
      {design.sections.filter((id) => sections[id] && !(id === 'studentDetails' && design.headerSections.includes('studentDetails'))).map((id) => <div className="report-card-configurable-section" key={id}>{sections[id]}</div>)}
      {canEditDetails && <div className="report-card-details-save no-print"><button className="secondary-button" type="button" onClick={saveDetails} disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save report details'}</button>{detailsNotice && <span role="status">{detailsNotice}</span>}{detailsError && <span className="notice-error" role="alert">{detailsError}</span>}</div>}
      <p className="report-card-generated">{design.footerText}{design.footerText ? ' · ' : ''}{formatDate(reportCard.issuedAt)}</p>
      <div className="report-card-assessment-brand"><img src={cambridgeAssessmentLogo} alt="Cambridge Assessment" /></div>
    </article>
  );
}

function ReadinessPanel({ reportCards, canPublish, publishing, onPublish }) {
  const incomplete = reportCards.filter((card) => !card.complete);
  const rows = incomplete.flatMap((card) => card.summary.requiredSubjects === 0
    ? [{ key: `${card.enrollment.id}-subjects`, student: studentName(card.student), admissionNumber: card.student?.admissionNumber, subject: '—', issue: 'No required subjects are configured for this class.' }]
    : card.missingSubjects.map((subject) => ({
        key: `${card.enrollment.id}-${subject.subjectId}`,
        student: studentName(card.student),
        admissionNumber: card.student?.admissionNumber,
        subject: subject.subjectName,
        issue: subject.issue || 'No published end-of-term result exists for this subject'
      })));

  return (
    <section className="panel report-card-selection no-print">
      <div className="report-card-selection-heading"><div><h2>End-of-term report readiness</h2><p>{incomplete.length} of {reportCards.length} student{reportCards.length === 1 ? '' : 's'} need attention. Approved and locked assessments still need to be calculated, finalized, and published.</p></div>{canPublish && <button className="primary-button" type="button" onClick={onPublish} disabled={publishing}>{publishing ? <LoaderCircle size={15} className="animate-spin" /> : null}{publishing ? 'Calculating and publishing…' : 'Calculate and publish all results'}</button>}</div>
      {incomplete.length === 0
        ? <div className="table-message">Every student is ready. Select “View / download all reports” to generate the reports.</div>
        : <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Student</th><th>Subject</th><th>What is missing</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td><strong>{row.student}</strong><span className="report-card-subject-code">{row.admissionNumber}</span></td><td>{row.subject}</td><td>{row.issue}</td></tr>)}</tbody></table></div>}
    </section>
  );
}

export default function ReportCardsPage({ user, signOut, onNavigate }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [batchReportCards, setBatchReportCards] = useState(null);
  const [readinessReportCards, setReadinessReportCards] = useState(null);
  const [publication, setPublication] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [publishingClassResults, setPublishingClassResults] = useState(false);
  const [unpublishingClassResults, setUnpublishingClassResults] = useState(false);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [showUnpublishConfirmation, setShowUnpublishConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [notice, setNotice] = useState('');
  const [unpublishWindowOpen, setUnpublishWindowOpen] = useState(false);
  const canPublishResults = ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role);

  useEffect(() => {
    const publishedAt = publication?.publishedAt ? new Date(publication.publishedAt).getTime() : NaN;
    const remaining = publishedAt + 15_000 - Date.now();
    if (!Number.isFinite(publishedAt) || remaining <= 0) {
      setUnpublishWindowOpen(false);
      return undefined;
    }

    setUnpublishWindowOpen(true);
    const timeout = window.setTimeout(() => setUnpublishWindowOpen(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [publication]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      try {
        if (user.role === 'TEACHER') {
          const assignments = await fetchAllPages('/teaching-assignments');
          if (!cancelled) {
            const uniqueById = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
            setTeacherAssignments(assignments);
            setTerms(uniqueById(assignments.map((assignment) => assignment.term).filter(Boolean)));
            setGroups(uniqueById(assignments.map((assignment) => assignment.classGroup).filter(Boolean)));
          }
          return;
        }
        const [termData, groupData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/class-groups')
        ]);
        if (!cancelled) {
          setTerms(termData);
          setGroups(groupData);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { cancelled = true; };
  }, [signOut, user.role]);

  const availableGroups = user.role === 'TEACHER'
    ? groups.filter((group) => teacherAssignments.some((assignment) => assignment.classGroupId === group.id && assignment.termId === termId))
    : groups;

  async function loadBatchReportCards() {
    if (!termId || !classGroupId) return;
    setLoadingBatch(true);
    setBatchReportCards(null);
    setReadinessReportCards(null);
    setPublication(null);
    setError('');
    setErrorCode('');
    try {
      const result = await fetchClassGroupReportCards(termId, classGroupId);
      setBatchReportCards(result.data || []);
      setPublication(result.publication || null);
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setLoadingBatch(false);
    }
  }

  async function loadReadiness() {
    if (!termId || !classGroupId) return;
    setLoadingReadiness(true);
    setError('');
    setErrorCode('');
    try {
      const result = await fetchClassGroupReportCards(termId, classGroupId, { allowIncomplete: true });
      setReadinessReportCards(result.data || []);
      setPublication(result.publication || null);
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setLoadingReadiness(false);
    }
  }

  async function publishClassResults() {
    if (!termId || !classGroupId || !canPublishResults) return;
    setPublishingClassResults(true);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      const result = await publishClassGroupEndOfTermReports(termId, classGroupId);
      setPublication(result.data || null);
      setNotice(`End-of-term reports published ${new Date(result.data.publishedAt).toLocaleString()}.`);
      await loadReadiness();
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setPublishingClassResults(false);
      setShowPublishConfirmation(false);
    }
  }

  async function unpublishClassResults() {
    if (!termId || !classGroupId || !canPublishResults) return;
    setUnpublishingClassResults(true);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      await unpublishClassGroupEndOfTermReports(termId, classGroupId);
      setBatchReportCards(null);
      setReadinessReportCards(null);
      setPublication(null);
      setNotice('End-of-term reports are unpublished and hidden from students and parents. You can republish them after testing.');
      await loadReadiness();
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setUnpublishingClassResults(false);
      setShowUnpublishConfirmation(false);
    }
  }

  return (
    <>
      <div className="welcome-row students-welcome report-card-page-header">
        <div>
          <p className="eyebrow">Student records</p>
          <h1 className="page-title">Report cards<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Select an academic term and class group to view and download every student report together.</p>
        </div>
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span>{errorCode === 'END_OF_TERM_ASSESSMENTS_INCOMPLETE' && !readinessReportCards && <button className="text-button" type="button" onClick={loadReadiness} disabled={loadingReadiness}>{loadingReadiness ? 'Checking…' : 'Check readiness'}</button>}{errorCode === 'CLASS_LEVEL_GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" type="button" onClick={() => onNavigate('class-levels')}>Assign a grading scale to this class level</button>}{errorCode === 'GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" type="button" onClick={() => onNavigate('grading-scales')}>Create a grade scale</button>}<button className="text-button" onClick={() => { setError(''); setErrorCode(''); }}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" type="button" onClick={() => setNotice('')}>Dismiss</button></div>}

      <section className="panel report-card-selection">
        <div className="report-card-selection-heading"><div><h2>Generate class report batch</h2><p>All active student reports for the selected term and class group will appear together.</p></div></div>
        <div className="report-card-filters">
          <label className="field-label">Academic term
            <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setClassGroupId(''); setBatchReportCards(null); setReadinessReportCards(null); setPublication(null); setError(''); setErrorCode(''); }} required disabled={loadingOptions}>
              <option value="">Select a term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
          </label>
          <label className="field-label">Class group
            <select className="text-input" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); setBatchReportCards(null); setReadinessReportCards(null); setPublication(null); setError(''); setErrorCode(''); }} required disabled={!termId}>
              <option value="">Select a class group</option>
              {availableGroups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
            </select>
          </label>
          {termId && classGroupId && <button className="primary-button report-card-batch-load" type="button" onClick={loadBatchReportCards} disabled={loadingBatch}>
            {loadingBatch ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
            {loadingBatch ? 'Loading class reports…' : 'View / download all reports'}
          </button>}
          {termId && classGroupId && !batchReportCards && <button className="secondary-button" type="button" onClick={loadReadiness} disabled={loadingReadiness || loadingBatch}>
            {loadingReadiness ? <LoaderCircle size={16} className="animate-spin" /> : <ListChecks size={16} />}
            {loadingReadiness ? 'Checking readiness…' : 'Check readiness'}
          </button>}
        </div>
      </section>
      {readinessReportCards && !batchReportCards && (readinessReportCards.length === 0
        ? <div className="panel table-message no-print"><span>No active student enrollments were found, so readiness could not be checked.</span></div>
        : readinessReportCards.every((card) => card.complete)
          ? <div className="panel table-message no-print report-readiness-success" role="status">
            <span>{publication ? `End-of-term reports were published ${new Date(publication.publishedAt).toLocaleString()}.` : 'Every subject result is ready for end-of-term publication.'} Select “View / download all reports” to preview or print them.</span>
            {canPublishResults && !publication && <button className="primary-button" type="button" onClick={() => setShowPublishConfirmation(true)} disabled={publishingClassResults}>{publishingClassResults ? <LoaderCircle size={15} className="animate-spin" /> : null}{publishingClassResults ? 'Publishing results…' : 'Publish end-of-term reports for class'}</button>}
            {canPublishResults && publication && unpublishWindowOpen && <button className="secondary-button" type="button" onClick={() => setShowUnpublishConfirmation(true)} disabled={unpublishingClassResults}><RotateCcw size={15} /> Unpublish for testing</button>}
          </div>
          : <ReadinessPanel reportCards={readinessReportCards} canPublish={canPublishResults} publishing={publishingClassResults} onPublish={() => setShowPublishConfirmation(true)} />)}
      {batchReportCards && <section className="report-card-preview report-card-batch">
        <div className="report-card-actions no-print"><span>{batchReportCards.length} complete student report{batchReportCards.length === 1 ? '' : 's'} loaded. Marks are calculated directly from locked assessments{publication ? ' and published for this class.' : '.'}</span>{canPublishResults && publication && unpublishWindowOpen && <button className="secondary-button" type="button" onClick={() => setShowUnpublishConfirmation(true)} disabled={unpublishingClassResults}><RotateCcw size={15} /> Unpublish for testing</button>}<button className="primary-button" type="button" onClick={() => window.print()} disabled={!batchReportCards.length}><Printer size={16} /> Download / print all</button></div>
        {!batchReportCards.length ? <div className="panel table-message"><span>No active student enrollments found in this class group and term.</span></div> : batchReportCards.map((card) => <ReportCardPaper key={card.enrollment.id} reportCard={card} />)}
      </section>}
      {showPublishConfirmation && <ConfirmActionModal
        title="Calculate and publish end-of-term results?"
        message="The system will calculate results from approved and locked assessments, finalize them, and release every subject for the selected class and term to students and parents. Nothing will be published if a required mark or calculation is incomplete."
        confirmationText="PUBLISH END-OF-TERM"
        confirmLabel={publishingClassResults ? 'Calculating and publishing…' : 'Calculate and publish all results'}
        tone="primary"
        confirmDisabled={publishingClassResults}
        onCancel={() => setShowPublishConfirmation(false)}
        onConfirm={publishClassResults}
      />}
      {showUnpublishConfirmation && <ConfirmActionModal
        title="Unpublish end-of-term reports?"
        message="This hides reports for the selected class and term from students and parents, and allows the assessments to be reviewed before publishing again."
        confirmationText="UNPUBLISH END-OF-TERM"
        confirmLabel={unpublishingClassResults ? 'Unpublishing…' : 'Unpublish reports'}
        tone="danger"
        confirmDisabled={unpublishingClassResults}
        onCancel={() => setShowUnpublishConfirmation(false)}
        onConfirm={unpublishClassResults}
      />}
      {!error && !loadingOptions && !terms.length && (
        <div className="panel table-message"><span>{user.role === 'TEACHER' ? 'No teaching assignments are available for your account.' : 'No academic terms are available.'}</span></div>
      )}
    </>
  );
}
