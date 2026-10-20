import { useEffect, useState } from 'react';
import { FileText, ListChecks, LoaderCircle, Printer } from 'lucide-react';
// import { fetchAllPages } from './reportCardApi.js';
import { fetchAllPages } from '../report-cards/reportCardApi.js';
import { fetchClassGroupMidTermReportCards, fetchFormTutorAttendanceClasses, publishClassGroupMidTermReportCards } from './midTermReportCardApi.js';
import { formatAcademicMark } from '../../shared/utils/academicMarks.js';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';

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

function formatPercent(value) {
  return value === null || value === undefined ? '—' : `${value}%`;
}

export function MidTermReportCardPaper({ reportCard }) {
  const school = reportCard.school;
  return (
    <article className="report-card-paper">
      <header className="report-card-school-heading">
        {school?.logoDataUrl
          ? <img className="report-card-school-logo" src={school.logoDataUrl} alt={`${school.name} logo`} />
          : <div className="report-card-school-mark">{(school?.name || 'S').slice(0, 1).toUpperCase()}</div>}
        <div className="report-card-school-identity">
          <p className="eyebrow">Student academic report</p>
          <h1>{school?.name || 'School'}</h1>
          {(school?.address || school?.phone || school?.email) && <p className="report-card-school-contact">{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>}
          <h2>Mid-Term Report Card</h2>
          <p>{reportCard.academicYear?.name} · {reportCard.term?.sequence}. {reportCard.term?.name}</p>
        </div>
      </header>

      <div className="report-card-student-summary">
        <div><span>Student name</span><strong>{studentName(reportCard.student)}</strong></div>
        <div><span>Admission number</span><strong>{reportCard.student?.admissionNumber || '—'}</strong></div>
        <div><span>Class level</span><strong>{reportCard.classLevel?.name || reportCard.classGroup?.classLevel?.name || '—'}</strong></div>
        <div><span>Academic year</span><strong>{reportCard.academicYear?.name}</strong></div>
      </div>

      {reportCard.summary.subjects === 0 && <p className="report-card-no-subjects">No subjects are assigned to this student for the selected term.</p>}

      <div className="overflow-x-auto">
        <table className="people-table report-card-subject-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Subject</th>
              <th>Mid-term exam</th>
              <th>Average</th>
              <th>Mark</th>
              <th>Grade</th>
              <th>Grade description</th>
            </tr>
          </thead>
          <tbody>
            {reportCard.subjects.map((subject, index) => (
              <tr key={subject.subjectId}>
                <td>{index + 1}</td>
                <td><strong>{subject.subjectName}</strong><span className="report-card-subject-code">{subject.subjectCode}</span></td>
                <td>{subject.midTermExam.absent ? 'Absent' : formatPercent(subject.midTermExam.percent)}</td>
                <td>{formatPercent(subject.averagePercent)}</td>
                <td className="report-card-mark">{formatAcademicMark(subject.finalMark, reportCard.scoreOutOf)}</td>
                <td><strong>{subject.grade || '—'}</strong></td>
                <td>{subject.gradeDescription || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="report-card-summary">
        <div><span>Subjects graded</span><strong>{reportCard.summary.completeSubjects} / {reportCard.summary.subjects}</strong></div>
        <div><span>Average mark</span><strong>{formatAcademicMark(reportCard.summary.averageMark, reportCard.scoreOutOf)}</strong></div>
        <div><span>Report status</span><strong>{reportCard.complete ? 'Complete' : 'Incomplete'}</strong></div>
      </div>

      <footer className="report-card-signatures">
        <div><span>Class teacher</span><strong>{school?.classTeacherSignerName || ''}</strong><i /></div>
        <div><span>Headteacher</span><strong>{school?.headteacherSignerName || ''}</strong><i /></div>
        <div><span>Date issued</span><strong>{formatDate(new Date())}</strong></div>
      </footer>
      <p className="report-card-generated">Each subject grade averages approved and locked coursework and mid-term exams; absences count as zero · {formatDate(new Date())}</p>
    </article>
  );
}

function MissingItemsPanel({ reportCards }) {
  const rows = reportCards.flatMap((card) => card.incompleteSubjects.map((subject) => ({
    key: `${card.enrollment.id}-${subject.subjectId}`,
    student: studentName(card.student),
    admissionNumber: card.student?.admissionNumber,
    subject: subject.subjectName,
    issues: subject.issues.map((issue) => issue.message).join(', ')
  })));
  const incompleteStudents = reportCards.filter((card) => !card.complete).length;

  return (
    <section className="panel report-card-selection no-print">
      <div className="report-card-selection-heading">
        <div>
          <h2>Missing before mid-term reports can be finalised</h2>
          <p>{incompleteStudents} of {reportCards.length} student{reportCards.length === 1 ? '' : 's'} still need attention. Every subject needs at least 2 coursework assessments plus the mid-term exam, all approved and locked, with recorded results and a calculated grade.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="people-table">
          <thead><tr><th>Student</th><th>Subject</th><th>What is missing</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td><strong>{row.student}</strong><span className="report-card-subject-code">{row.admissionNumber}</span></td>
                <td>{row.subject}</td>
                <td>{row.issues}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MidTermReportCardsPage({ user, signOut, onNavigate }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formTutorGroups, setFormTutorGroups] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [batchReportCards, setBatchReportCards] = useState(null);
  const [missingReportCards, setMissingReportCards] = useState(null);
  const [publication, setPublication] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingAssignedGroups, setLoadingAssignedGroups] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [notice, setNotice] = useState('');
  const canPublish = ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'].includes(user.role);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      try {
        if (['TEACHER', 'FORM_TUTOR'].includes(user.role)) {
          const [assignments, termData] = await Promise.all([
            user.role === 'TEACHER' ? fetchAllPages('/teaching-assignments') : Promise.resolve([]),
            fetchAllPages('/terms')
          ]);
          if (!cancelled) {
            const uniqueById = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
            setTeacherAssignments(assignments);
            setTerms(user.role === 'TEACHER'
              ? uniqueById([...assignments.map((assignment) => assignment.term), ...termData].filter(Boolean))
              : termData);
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

  useEffect(() => {
    if (!['TEACHER', 'FORM_TUTOR'].includes(user.role) || !termId) {
      setFormTutorGroups([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingAssignedGroups(true);
    fetchFormTutorAttendanceClasses(termId)
      .then((result) => {
        if (!cancelled) setFormTutorGroups((result.data || []).map((item) => item.classGroup));
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoadingAssignedGroups(false); });
    return () => { cancelled = true; };
  }, [termId, signOut, user.role]);

  const availableGroups = ['TEACHER', 'FORM_TUTOR'].includes(user.role)
    ? [...new Map([
        ...groups.filter((group) => teacherAssignments.some((assignment) => assignment.classGroupId === group.id && assignment.termId === termId)),
        ...formTutorGroups
      ].map((group) => [group.id, group])).values()]
    : groups;

  function clearResults() {
    setBatchReportCards(null);
    setMissingReportCards(null);
    setPublication(null);
    setError('');
    setErrorCode('');
    setNotice('');
  }

  async function loadBatchReportCards() {
    if (!termId || !classGroupId) return;
    setLoadingBatch(true);
    clearResults();
    try {
      const result = await fetchClassGroupMidTermReportCards(termId, classGroupId);
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

  async function loadMissingItems() {
    setLoadingMissing(true);
    try {
      const result = await fetchClassGroupMidTermReportCards(termId, classGroupId, { allowIncomplete: true });
      setMissingReportCards(result.data || []);
      setPublication(result.publication || null);
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setLoadingMissing(false);
    }
  }

  async function publishMidTermReports() {
    if (!termId || !classGroupId || !canPublish) return;
    setPublishing(true);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      const result = await publishClassGroupMidTermReportCards(termId, classGroupId);
      setPublication(result.data);
      setNotice('Mid-term reports published for the whole class. Students and parents have been notified.');
      await loadMissingItems();
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setPublishing(false);
      setShowPublishConfirmation(false);
    }
  }

  return (
    <>
      <div className="welcome-row students-welcome report-card-page-header">
        <div>
          <p className="eyebrow">Student records</p>
          <h1 className="page-title">Mid-term reports<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Select an academic term and class group to view and download every student's mid-term report together.</p>
        </div>
      </div>

      {error && (
        <div className="notice-error mb-4" role="alert">
          <span>{error}</span>
          {errorCode === 'MID_TERM_RESULTS_INCOMPLETE' && !missingReportCards && (
            <button className="text-button" type="button" onClick={loadMissingItems} disabled={loadingMissing}>
              {loadingMissing ? 'Checking…' : 'Show what is missing'}
            </button>
          )}
          {errorCode === 'MID_TERM_RESULTS_INCOMPLETE' && <button className="text-button" type="button" onClick={() => onNavigate('assessments')}>Go to Assessments to approve and lock</button>}
          {errorCode === 'CLASS_LEVEL_GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" type="button" onClick={() => onNavigate('class-levels')}>Assign a grading scale to this class level</button>}
          {errorCode === 'GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" type="button" onClick={() => onNavigate('grading-scales')}>Create a grading scale</button>}
          <button className="text-button" type="button" onClick={() => { setError(''); setErrorCode(''); }}>Dismiss</button>
        </div>
      )}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" type="button" onClick={() => setNotice('')}>Dismiss</button></div>}

      <section className="panel report-card-selection">
        <div className="report-card-selection-heading">
          <div>
            <h2>Generate class mid-term batch</h2>
            <p>All active student reports for the selected term and class group will appear together once every subject is graded.</p>
          </div>
        </div>
        <div className="report-card-filters">
          <label className="field-label">Academic term
            <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setClassGroupId(''); clearResults(); }} required disabled={loadingOptions}>
              <option value="">Select a term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
          </label>
          <label className="field-label">Class group
            <select className="text-input" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); clearResults(); }} required disabled={!termId || loadingAssignedGroups}>
              <option value="">Select a class group</option>
              {availableGroups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
            </select>
          </label>
          {termId && classGroupId && (
            <button className="primary-button report-card-batch-load" type="button" onClick={loadBatchReportCards} disabled={loadingBatch}>
              {loadingBatch ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
              {loadingBatch ? 'Loading mid-term reports…' : 'View / download all reports'}
            </button>
          )}
          {termId && classGroupId && !batchReportCards && (
            <button className="secondary-button" type="button" onClick={loadMissingItems} disabled={loadingMissing || loadingBatch}>
              {loadingMissing ? <LoaderCircle size={16} className="animate-spin" /> : <ListChecks size={16} />}
              {loadingMissing ? 'Checking…' : 'Check readiness'}
            </button>
          )}
        </div>
      </section>

      {missingReportCards && !batchReportCards && (
        missingReportCards.length === 0
          ? <div className="panel table-message no-print"><span>No active student enrollments were found, so readiness could not be checked.</span></div>
          : missingReportCards.every((card) => card.complete && (card.incompleteSubjects?.length ?? 0) === 0)
            ? <div className="panel table-message no-print report-readiness-success" role="status"><span>{publication ? `Mid-term reports were published ${new Date(publication.publishedAt).toLocaleString()}.` : 'Every subject is ready for mid-term publication.'} Select “View / download all reports” to preview or print them.</span>{canPublish && !publication && <button className="primary-button" type="button" onClick={() => setShowPublishConfirmation(true)} disabled={publishing}>{publishing ? <LoaderCircle size={15} className="animate-spin" /> : null}{publishing ? 'Publishing mid-term reports…' : 'Publish mid-term reports for class'}</button>}</div>
            : <MissingItemsPanel reportCards={missingReportCards} />
      )}

      {batchReportCards && (
        <section className="report-card-preview report-card-batch">
          <div className="report-card-actions no-print">
            <span>{batchReportCards.length} complete mid-term report{batchReportCards.length === 1 ? '' : 's'} loaded. Every subject is graded from approved and locked assessments.</span>
            <button className="primary-button" type="button" onClick={() => window.print()} disabled={!batchReportCards.length}><Printer size={16} /> Download / print all</button>
          </div>
          {!batchReportCards.length
            ? <div className="panel table-message"><span>No active student enrollments found in this class group and term.</span></div>
            : batchReportCards.map((card) => <MidTermReportCardPaper key={card.enrollment.id} reportCard={card} />)}
        </section>
      )}

      {!error && !loadingOptions && !terms.length && (
        <div className="panel table-message"><span>{user.role === 'TEACHER' ? 'No teaching assignments are available for your account.' : 'No academic terms are available.'}</span></div>
      )}
      {showPublishConfirmation && <ConfirmActionModal
        title="Publish mid-term reports?"
        message="This releases mid-term reports for every active student in the selected class and term. Students and parents will be notified."
        confirmationText="PUBLISH MID-TERM"
        confirmLabel={publishing ? 'Publishing…' : 'Publish class reports'}
        tone="primary"
        confirmDisabled={publishing}
        onCancel={() => setShowPublishConfirmation(false)}
        onConfirm={publishMidTermReports}
      />}
    </>
  );
}
