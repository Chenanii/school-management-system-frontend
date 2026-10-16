import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Calculator, Check, LoaderCircle, Megaphone, RefreshCw } from 'lucide-react';
import { calculateTermResults, fetchAllPages, fetchTermResults, updateTermResultsStatus } from './termResultApi.js';
import { formatAcademicMark } from '../../shared/utils/academicMarks.js';

function studentName(student) {
  return [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ') || 'Student';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(date);
}

function termLabel(term) {
  return `${term.academicYear?.name || 'Academic year'} · ${term.sequence}. ${term.name}`;
}

export default function TermResultsPage({ user, onNavigate, signOut }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [resultSet, setResultSet] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      try {
        const [termData, groupData, classSubjectData, subjectData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/class-groups'),
          fetchAllPages('/class-subjects'),
          fetchAllPages('/subjects')
        ]);
        if (!cancelled) {
          setTerms(termData);
          setGroups(groupData);
          setClassSubjects(classSubjectData);
          setAllSubjects(subjectData);
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

  const selectedGroup = groups.find((group) => group.id === classGroupId);
  const subjects = useMemo(() => {
    const linkedSubjectIds = new Set(classSubjects.map((link) => link.subjectId));
    const subjectsForLevel = new Set(
      classSubjects
        .filter((link) => link.classLevelId === selectedGroup?.classLevelId)
        .map((link) => link.subjectId)
    );
    return allSubjects
      .filter((subject) => subject.status === 'ACTIVE'
        && (!linkedSubjectIds.has(subject.id) || subjectsForLevel.has(subject.id)))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [allSubjects, classSubjects, selectedGroup]);

  function clearResults() {
    setResultSet(null);
    setError('');
    setErrorCode('');
    setNotice('');
  }

  async function loadResults(event) {
    event?.preventDefault();
    if (!termId || !classGroupId || !subjectId) return;
    setLoadingResults(true);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      const result = await fetchTermResults({ termId, classGroupId, subjectId });
      setResultSet(result);
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setLoadingResults(false);
    }
  }

  async function calculate() {
    setBusyAction('calculate');
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      const result = await calculateTermResults({ termId, classGroupId, subjectId });
      setNotice(`${result.count} term result${result.count === 1 ? '' : 's'} calculated. Review the results before finalizing.`);
      await loadResults();
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setBusyAction('');
    }
  }

  async function changeStatus(status) {
    const action = status === 'FINALIZED' ? 'finalize' : 'publish';
    if (!window.confirm(`${status === 'FINALIZED' ? 'Finalize' : 'Publish'} all ${resultSet.resultCount} results for this subject?`)) return;
    setBusyAction(action);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      const result = await updateTermResultsStatus({ termId, classGroupId, subjectId, status });
      setNotice(`${result.count} results ${status === 'FINALIZED' ? 'finalized' : 'published'} successfully.`);
      await loadResults();
    } catch (cause) {
      setError(cause.message);
      setErrorCode(cause.code || '');
      if (cause.status === 401) signOut();
    } finally {
      setBusyAction('');
    }
  }

  const results = resultSet?.data || [];
  const missingEnrollments = resultSet?.missingEnrollments || [];
  const resultStatuses = [...new Set(results.map((result) => result.status))];
  const complete = resultSet && resultSet.missingCount === 0 && results.length > 0;
  const allDraft = complete && results.every((result) => result.status === 'DRAFT' && result.finalMark != null && result.grade);
  const allFinalized = complete && results.every((result) => result.status === 'FINALIZED' && result.finalMark != null && result.grade);
  const selectedTerm = terms.find((term) => term.id === termId);
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic records</p>
          <h1 className="page-title">Term results<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Calculate, review, finalize, and publish subject results for a class and term.</p>
        </div>
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span>{errorCode === 'CLASS_LEVEL_GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" onClick={() => onNavigate('class-levels')}>Configure class-level grading scale</button>}{errorCode === 'GRADE_SCALE_NOT_CONFIGURED' && <button className="text-button" onClick={() => onNavigate('grading-scales')}>Create a grading scale</button>}<button className="text-button" onClick={() => { setError(''); setErrorCode(''); }}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}

      <section className="panel term-results-scope">
        <div className="term-results-heading"><div><h2>Choose result scope</h2><p>Results are calculated from locked assessments and the class level’s grading scale.</p></div></div>
        <form className="term-results-filters" onSubmit={loadResults}>
          <label className="field-label">Term
            <select className="text-input" value={termId} onChange={(event) => { setTermId(event.target.value); clearResults(); }} required disabled={loadingOptions}>
              <option value="">Select a term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
            </select>
          </label>
          <label className="field-label">Class group
            <select className="text-input" value={classGroupId} onChange={(event) => { setClassGroupId(event.target.value); setSubjectId(''); clearResults(); }} required disabled={loadingOptions}>
              <option value="">Select a class group</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
            </select>
          </label>
          <label className="field-label">Subject
            <select className="text-input" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); clearResults(); }} required disabled={!classGroupId || loadingOptions}>
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code ? `${subject.code} · ` : ''}{subject.name}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={loadingResults || !termId || !classGroupId || !subjectId}>
            {loadingResults ? <LoaderCircle size={16} className="animate-spin" /> : <BookOpenCheck size={16} />}
            {loadingResults ? 'Loading…' : 'Load results'}
          </button>
        </form>
        {!loadingOptions && (!terms.length || !groups.length) && <p className="term-results-hint">Add academic terms and class groups before viewing term results.</p>}
      </section>

      {resultSet && (
        <section className="panel term-results-panel">
          <div className="term-results-heading term-results-table-heading">
            <div>
              <p className="eyebrow">{selectedTerm ? termLabel(selectedTerm) : 'Selected term'}</p>
              <h2>{selectedGroup?.classLevel?.name} · {selectedGroup?.name} <span className="text-muted">/</span> {selectedSubject?.name}</h2>
              <p>{resultSet.resultCount} calculated · {resultSet.expectedCount} active enrollments · {resultSet.missingCount} missing</p>
            </div>
            <div className="term-results-actions">
              <button className="secondary-button" type="button" onClick={calculate} disabled={Boolean(busyAction) || !results.every((result) => result.status === 'DRAFT')}>
                {busyAction === 'calculate' ? <LoaderCircle size={15} className="animate-spin" /> : <Calculator size={15} />}
                Recalculate
              </button>
              <button className="secondary-button" type="button" onClick={() => changeStatus('FINALIZED')} disabled={!allDraft || Boolean(busyAction)}>
                {busyAction === 'finalize' ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                Finalize
              </button>
              <button className="primary-button" type="button" onClick={() => changeStatus('PUBLISHED')} disabled={!allFinalized || Boolean(busyAction)}>
                {busyAction === 'publish' ? <LoaderCircle size={15} className="animate-spin" /> : <Megaphone size={15} />}
                Publish
              </button>
            </div>
          </div>
          {missingEnrollments.length > 0 && (
            <div className="term-results-missing">
              <strong>{missingEnrollments.length} student result{missingEnrollments.length === 1 ? '' : 's'} not calculated</strong>
              <span>{missingEnrollments.map(({ student }) => `${studentName(student)} (${student.admissionNumber})`).join(', ')}</span>
            </div>
          )}
          {resultStatuses.length > 1 && <p className="term-results-warning">Results have mixed workflow statuses ({resultStatuses.join(', ')}). Finalize and publish require every active enrollment to be complete and at the same workflow stage.</p>}
          {results.length ? (
            <div className="overflow-x-auto">
              <table className="people-table term-results-table">
                <thead><tr><th>Student</th><th>Admission no.</th><th>Final mark</th><th>Grade</th><th>Grade description</th><th>Status</th><th>Calculated</th><th>Finalized</th><th>Published</th></tr></thead>
                <tbody>{results.map((result) => (
                  <tr key={result.id}>
                    <td><strong>{studentName(result.enrollment?.student)}</strong></td>
                    <td className="text-muted">{result.enrollment?.student?.admissionNumber || '—'}</td>
                    <td className="term-result-mark">{formatAcademicMark(result.finalMark, resultSet.scoreOutOf)}</td>
                    <td><strong>{result.grade || '—'}</strong></td>
                    <td className="text-muted">{result.gradeDescription || '—'}</td>
                    <td><span className={`subject-status subject-status-${result.status.toLowerCase()}`}>{result.status}</span></td>
                    <td className="whitespace-nowrap text-muted">{formatDate(result.calculatedAt)}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(result.finalizedAt)}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(result.publishedAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="table-message"><span>No results calculated for this scope yet. Check assessments, then calculate results.</span></div>}
          <div className="term-results-footer">
            <span>Calculation requires locked assessments, complete marks, coursework and mid-term weights totaling 40%, one final exam worth 60%, and a configured grade scale.</span>
            <button className="text-button" type="button" onClick={loadResults} disabled={loadingResults}><RefreshCw size={14} /> Refresh</button>
          </div>
        </section>
      )}
    </>
  );
}
