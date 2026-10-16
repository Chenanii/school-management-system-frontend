import { useEffect, useMemo, useState } from 'react';
import { FileText, LoaderCircle, Printer, Search } from 'lucide-react';
import { fetchAllPages, fetchReportCard, fetchTermEnrollments } from './reportCardApi.js';

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

function enrollmentLabel(enrollment) {
  const student = enrollment.student;
  return `${studentName(student)} · ${student.admissionNumber}`;
}

export default function ReportCardsPage({ signOut }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [search, setSearch] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      try {
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
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    setEnrollments([]);
    setEnrollmentId('');
    setReportCard(null);
    if (!termId || !classGroupId) return undefined;
    async function loadEnrollments() {
      setLoadingEnrollments(true);
      setError('');
      try {
        const data = await fetchTermEnrollments(termId, classGroupId);
        if (!cancelled) setEnrollments(data);
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoadingEnrollments(false);
      }
    }
    loadEnrollments();
    return () => { cancelled = true; };
  }, [termId, classGroupId, signOut]);

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return enrollments.filter((enrollment) => {
      if (!query) return true;
      const student = enrollment.student;
      return [studentName(student), student?.admissionNumber]
        .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
    });
  }, [enrollments, search]);

  async function loadReportCard(event) {
    event.preventDefault();
    if (!enrollmentId) return;
    setLoadingCard(true);
    setError('');
    try {
      const result = await fetchReportCard(enrollmentId);
      setReportCard(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoadingCard(false);
    }
  }

  return (
    <>
      <div className="welcome-row students-welcome report-card-page-header">
        <div>
          <p className="eyebrow">Student records</p>
          <h1 className="page-title">Report cards<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Preview published term results for students and print completed report cards.</p>
        </div>
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}

      <section className="panel report-card-selection">
        <div className="report-card-selection-heading"><div><h2>Find a student report card</h2><p>Choose an enrollment to view its published subject results.</p></div></div>
        <form className="report-card-filters" onSubmit={loadReportCard}>
          <label className="field-label">Academic term
            <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); setClassGroupId(''); setSearch(''); }} required disabled={loadingOptions}>
              <option value="">Select a term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
          </label>
          <label className="field-label">Class group
            <select className="text-input" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); setSearch(''); }} required disabled={!termId}>
              <option value="">Select a class group</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
            </select>
          </label>
          <label className="field-label">Student enrollment
            <select className="text-input" value={enrollmentId} onChange={(event) => { setEnrollmentId(event.target.value); setReportCard(null); }} required disabled={!classGroupId || loadingEnrollments}>
              <option value="">{loadingEnrollments ? 'Loading enrollments…' : 'Select a student'}</option>
              {filteredEnrollments.map((enrollment) => <option key={enrollment.id} value={enrollment.id}>{enrollmentLabel(enrollment)}</option>)}
            </select>
          </label>
          <label className="field-label report-card-search-label">Filter students
            <span className="report-card-search-wrap"><Search size={15} /><input className="text-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setEnrollmentId(''); setReportCard(null); }} placeholder="Name or admission number" disabled={!classGroupId} /></span>
          </label>
          <button className="primary-button" type="submit" disabled={loadingCard || !enrollmentId}>
            {loadingCard ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
            {loadingCard ? 'Loading…' : 'View report card'}
          </button>
        </form>
        {classGroupId && !loadingEnrollments && enrollments.length === 0 && <p className="report-card-empty-hint">No enrollments found for this class group and term.</p>}
      </section>

      {reportCard && (
        <section className="report-card-preview">
          {!reportCard.complete && (
            <div className="notice-error report-card-incomplete" role="status">
              <span>This report card is incomplete. {reportCard.summary.missingSubjects} subject result{reportCard.summary.missingSubjects === 1 ? '' : 's'} have not been published.</span>
            </div>
          )}
          <div className="report-card-actions no-print">
            <span>{reportCard.complete ? 'All required subject results are published.' : 'Only published results are shown; unpublished results are marked as pending.'}</span>
            <button className="primary-button" type="button" onClick={() => window.print()} disabled={!reportCard.complete}><Printer size={16} /> Print report card</button>
          </div>
          <article className="report-card-paper">
            <header className="report-card-school-heading">
              <div className="report-card-school-mark">{(reportCard.classGroup?.classLevel?.name || 'S').slice(0, 1)}</div>
              <div>
                <p className="eyebrow">Student academic report</p>
                <h2>Term Report Card</h2>
                <p>{reportCard.academicYear?.name} · {reportCard.term?.sequence}. {reportCard.term?.name}</p>
              </div>
            </header>
            <div className="report-card-student-summary">
              <div><span>Student name</span><strong>{studentName(reportCard.student)}</strong></div>
              <div><span>Admission number</span><strong>{reportCard.student?.admissionNumber || '—'}</strong></div>
              <div><span>Class</span><strong>{reportCard.classGroup?.classLevel?.name} · {reportCard.classGroup?.name}</strong></div>
              <div><span>Academic year</span><strong>{reportCard.academicYear?.name}</strong></div>
            </div>
            <div className="overflow-x-auto">
              <table className="people-table report-card-subject-table">
                <thead><tr><th>#</th><th>Subject</th><th>Final mark</th><th>Grade</th><th>Grade description</th><th>Teacher comment</th></tr></thead>
                <tbody>{reportCard.subjects.map((subject, index) => (
                  <tr key={subject.subjectId}>
                    <td>{index + 1}</td>
                    <td><strong>{subject.subjectName}</strong><span className="report-card-subject-code">{subject.subjectCode}</span></td>
                    <td className="report-card-mark">{subject.published && subject.finalMark != null ? `${Number(subject.finalMark).toFixed(2)}%` : 'Pending'}</td>
                    <td><strong>{subject.grade || '—'}</strong></td>
                    <td>{subject.gradeDescription || '—'}</td>
                    <td>{subject.teacherComment || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="report-card-summary">
              <div><span>Subjects published</span><strong>{reportCard.summary.publishedSubjects} / {reportCard.summary.requiredSubjects}</strong></div>
              <div><span>Average mark</span><strong>{reportCard.summary.averageMark == null ? '—' : `${reportCard.summary.averageMark}%`}</strong></div>
              <div><span>Report status</span><strong>{reportCard.complete ? 'Complete' : 'Incomplete'}</strong></div>
            </div>
            <footer className="report-card-signatures">
              <div><span>Class teacher</span><i /></div>
              <div><span>Headteacher</span><i /></div>
              <div><span>Date issued</span><strong>{formatDate(new Date())}</strong></div>
            </footer>
            <p className="report-card-generated">Generated from published school results · {formatDate(new Date())}</p>
          </article>
        </section>
      )}
      {!reportCard && !error && !loadingOptions && !terms.length && (
        <div className="panel table-message"><span>No academic terms are available.</span></div>
      )}
    </>
  );
}
