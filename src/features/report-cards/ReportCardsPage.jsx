import { useEffect, useState } from 'react';
import { FileText, LoaderCircle, Printer } from 'lucide-react';
import { fetchAllPages, fetchClassGroupReportCards } from './reportCardApi.js';
import { formatAcademicMark } from '../../shared/utils/academicMarks.js';

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

function ReportCardPaper({ reportCard }) {
  return (
    <article className="report-card-paper">
      <header className="report-card-school-heading"><div className="report-card-school-mark">{(reportCard.classGroup?.classLevel?.name || 'S').slice(0, 1)}</div><div><p className="eyebrow">Student academic report</p><h2>Term Report Card</h2><p>{reportCard.academicYear?.name} · {reportCard.term?.sequence}. {reportCard.term?.name}</p></div></header>
      <div className="report-card-student-summary"><div><span>Student name</span><strong>{studentName(reportCard.student)}</strong></div><div><span>Admission number</span><strong>{reportCard.student?.admissionNumber || '—'}</strong></div><div><span>Class</span><strong>{reportCard.classGroup?.classLevel?.name} · {reportCard.classGroup?.name}</strong></div><div><span>Academic year</span><strong>{reportCard.academicYear?.name}</strong></div></div>
      <div className="overflow-x-auto"><table className="people-table report-card-subject-table"><thead><tr><th>#</th><th>Subject</th><th>Final mark</th><th>Grade</th><th>Grade description</th><th>Teacher comment</th></tr></thead><tbody>{reportCard.subjects.map((subject, index) => <tr key={subject.subjectId}><td>{index + 1}</td><td><strong>{subject.subjectName}</strong><span className="report-card-subject-code">{subject.subjectCode}</span></td><td className="report-card-mark">{subject.published ? formatAcademicMark(subject.finalMark, reportCard.scoreOutOf) : 'Pending'}</td><td><strong>{subject.grade || '—'}</strong></td><td>{subject.gradeDescription || '—'}</td><td>{subject.teacherComment || '—'}</td></tr>)}</tbody></table></div>
      <div className="report-card-summary"><div><span>Subjects published</span><strong>{reportCard.summary.publishedSubjects} / {reportCard.summary.requiredSubjects}</strong></div><div><span>Average mark</span><strong>{formatAcademicMark(reportCard.summary.averageMark, reportCard.scoreOutOf)}</strong></div><div><span>Report status</span><strong>{reportCard.complete ? 'Complete' : 'Incomplete'}</strong></div></div>
      <footer className="report-card-signatures"><div><span>Class teacher</span><i /></div><div><span>Headteacher</span><i /></div><div><span>Date issued</span><strong>{formatDate(new Date())}</strong></div></footer><p className="report-card-generated">Generated from published school results · {formatDate(new Date())}</p>
    </article>
  );
}

export default function ReportCardsPage({ user, signOut }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [batchReportCards, setBatchReportCards] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    try {
      const result = await fetchClassGroupReportCards(termId, classGroupId);
      setBatchReportCards(result.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoadingBatch(false);
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
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}

      <section className="panel report-card-selection">
        <div className="report-card-selection-heading"><div><h2>Generate class report batch</h2><p>All active student reports for the selected term and class group will appear together.</p></div></div>
        <div className="report-card-filters">
          <label className="field-label">Academic term
            <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setClassGroupId(''); setBatchReportCards(null); }} required disabled={loadingOptions}>
              <option value="">Select a term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
          </label>
          <label className="field-label">Class group
            <select className="text-input" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); setBatchReportCards(null); }} required disabled={!termId}>
              <option value="">Select a class group</option>
              {availableGroups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
            </select>
          </label>
          {termId && classGroupId && <button className="primary-button report-card-batch-load" type="button" onClick={loadBatchReportCards} disabled={loadingBatch}>
            {loadingBatch ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
            {loadingBatch ? 'Loading class reports…' : 'View / download all reports'}
          </button>}
        </div>
      </section>
      {batchReportCards && <section className="report-card-preview report-card-batch">
        <div className="report-card-actions no-print"><span>{batchReportCards.length} student report{batchReportCards.length === 1 ? '' : 's'} loaded. Unpublished subjects appear as pending.</span><button className="primary-button" type="button" onClick={() => window.print()} disabled={!batchReportCards.length}><Printer size={16} /> Download / print all</button></div>
        {!batchReportCards.length ? <div className="panel table-message"><span>No active student enrollments found in this class group and term.</span></div> : batchReportCards.map((card) => <ReportCardPaper key={card.enrollment.id} reportCard={card} />)}
      </section>}
      {!error && !loadingOptions && !terms.length && (
        <div className="panel table-message"><span>{user.role === 'TEACHER' ? 'No teaching assignments are available for your account.' : 'No academic terms are available.'}</span></div>
      )}
    </>
  );
}
