import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ClipboardList, Download, FileText, LoaderCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchAllPages, fetchClassGroupReportCards } from '../report-cards/reportCardApi.js';
import { fetchClassGroupMidTermReportCards } from '../mid-term-report-cards/midTermReportCardApi.js';

export default function ExamResultsStatus({ schoolId, onNavigate }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [termId, setTermId] = useState('');
  const [readiness, setReadiness] = useState({});
  const [reportStage, setReportStage] = useState('MID_TERM');
  const [loading, setLoading] = useState(true);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!schoolId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError('');
    Promise.all([fetchAllPages('/terms'), fetchAllPages('/class-groups'), fetchAllPages('/assessments'), fetchAllPages('/teaching-assignments')])
      .then(([termRows, groupRows, assessmentRows, assignmentRows]) => {
        if (cancelled) return;
        const orderedTerms = [...termRows].sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
        setTerms(orderedTerms);
        setGroups(groupRows);
        setAssessments(assessmentRows);
        setAssignments(assignmentRows);
        const active = orderedTerms.find((term) => term.status === 'OPEN' && term.academicYear?.isCurrent)
          || orderedTerms.find((term) => term.academicYear?.isCurrent)
          || orderedTerms.find((term) => term.status === 'OPEN')
          || orderedTerms[0];
        setTermId((current) => orderedTerms.some((term) => term.id === current) ? current : active?.id || '');
      })
      .catch((cause) => {
        if (!cancelled) setError(cause.message || 'Could not load exam progress.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [schoolId]);

  const term = terms.find((item) => item.id === termId);
  const termGroups = useMemo(() => groups.filter((group) => !term?.academicYearId || !group.academicYearId || group.academicYearId === term.academicYearId), [groups, term]);
  const termAssessments = assessments.filter((item) => item.termId === termId || item.term?.id === termId);

  useEffect(() => {
    let cancelled = false;
    if (!termId || !termGroups.length) { setReadiness({}); setReadinessLoading(false); return undefined; }
    setReadinessLoading(true);
    setReadiness({});
    setReportStage('MID_TERM');
    Promise.all(termGroups.map(async (group) => {
      try {
        const result = await fetchClassGroupMidTermReportCards(termId, group.id, { allowIncomplete: true });
        return [group.id, { cards: result.data || [], publication: result.publication || null }];
      } catch (cause) {
        return [group.id, { error: cause.message || 'Readiness unavailable' }];
      }
    })).then(async (midTermRows) => {
      if (cancelled) return;
      const midTermByGroup = Object.fromEntries(midTermRows);
      setReadiness(midTermByGroup);
      const hasUnknownClasses = midTermRows.some(([, row]) => row.error);
      const enrolledClasses = midTermRows.filter(([, row]) => row.cards?.length > 0);
      const allMidTermReportsPublished = !hasUnknownClasses
        && enrolledClasses.length > 0
        && enrolledClasses.every(([, row]) => Boolean(row.publication?.publishedAt));
      if (!allMidTermReportsPublished) return;

      const endTermRows = await Promise.all(termGroups.map(async (group) => {
        try {
          const result = await fetchClassGroupReportCards(termId, group.id, { allowIncomplete: true });
          return [group.id, { cards: result.data || [], publication: result.publication || null }];
        } catch (cause) {
          return [group.id, { error: cause.message || 'Readiness unavailable' }];
        }
      }));
      if (cancelled) return;
      setReadiness(Object.fromEntries(endTermRows));
      setReportStage('END_OF_TERM');
    }).finally(() => { if (!cancelled) setReadinessLoading(false); });
    return () => { cancelled = true; };
  }, [termId, termGroups]);

  const counts = {
    inProgress: termAssessments.filter((item) => ['DRAFT', 'OPEN'].includes(item.status)).length,
    review: termAssessments.filter((item) => item.status === 'SUBMITTED').length,
    approved: termAssessments.filter((item) => ['APPROVED', 'LOCKED'].includes(item.status)).length,
  };
  const totalCards = Object.values(readiness).reduce((sum, item) => sum + (item.cards?.length || 0), 0);
  const readyCards = Object.values(readiness).reduce((sum, item) => sum + (item.cards || []).filter((card) => card.complete).length, 0);
  const readinessErrorCount = Object.values(readiness).filter((item) => item.error).length;
  const readinessPercent = totalCards && !readinessErrorCount ? Math.round((readyCards / totalCards) * 100) : null;

  function exportStatusWorkbook() {
    const classFor = (groupId) => termGroups.find((group) => group.id === groupId);
    const teacherFor = (group, subjectId) => {
      const assignment = assignments.find((item) => {
        const assignmentSubjectId = item.subjectId || item.subject?.id || item.classSubject?.subject?.id || item.subjectStream?.subject?.id;
        const isClassAssignment = item.classGroupId === group?.id || item.classGroup?.id === group?.id;
        const isStreamAssignment = !item.classGroupId && item.subjectStream?.classLevelId === group?.classLevelId;
        const isLevelAssignment = !item.classGroupId && item.classSubject?.classLevelId === group?.classLevelId;
        return (item.termId === termId || item.term?.id === termId)
          && assignmentSubjectId === subjectId
          && (isClassAssignment || isStreamAssignment || isLevelAssignment);
      });
      return [assignment?.teacher?.firstName, assignment?.teacher?.lastName].filter(Boolean).join(' ') || assignment?.teacher?.email || 'Unassigned';
    };
    const blockerRows = [];
    termGroups.forEach((group) => {
      const groupLabel = [group.classLevel?.name, group.name].filter(Boolean).join(' · ') || group.name;
      (readiness[group.id]?.cards || []).forEach((card) => {
        const student = [card.student?.firstName, card.student?.middleName, card.student?.lastName].filter(Boolean).join(' ');
        if (!card.complete && card.summary?.requiredSubjects === 0) {
          blockerRows.push({ 'Report stage': reportStage === 'MID_TERM' ? 'Mid-term' : 'End-of-term', Class: groupLabel, Student: student, 'Admission number': card.student?.admissionNumber || '', Subject: '', 'Issue to resolve': 'No required subjects are configured for this class.', 'Responsible teacher': 'School administration' });
        }
        const subjectsWithIssues = reportStage === 'MID_TERM'
          ? (card.incompleteSubjects || []).map((subject) => ({ ...subject, issue: (subject.issues || []).map((item) => item.message).join(', ') }))
          : (card.missingSubjects || []);
        subjectsWithIssues.forEach((subject) => blockerRows.push({
          'Report stage': reportStage === 'MID_TERM' ? 'Mid-term' : 'End-of-term',
          Class: groupLabel,
          Student: student,
          'Admission number': card.student?.admissionNumber || '',
          Subject: subject.subjectName,
          'Issue to resolve': subject.issue || 'No published end-of-term result exists for this subject.',
          'Responsible teacher': teacherFor(group, subject.subjectId),
        }));
      });
    });
    const workflowRows = termAssessments.map((assessment) => {
      const assignment = assessment.teachingAssignment;
      const group = assignment?.classGroup || classFor(assignment?.classGroupId);
      const subject = assessment.subject?.name || assignment?.subject?.name || assignment?.classSubject?.subject?.name || assignment?.subjectStream?.subject?.name || '';
      const teacher = assignment?.teacher;
      return {
        Class: [group?.classLevel?.name, group?.name].filter(Boolean).join(' · ') || 'Class not set',
        Assessment: assessment.title,
        Subject: subject,
        Teacher: [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ') || teacher?.email || 'Unassigned',
        Status: assessment.status,
        'Assessment type': assessment.assessmentType?.replaceAll('_', ' ') || '',
      };
    });
    const summaryRows = [
      { Metric: 'Term', Value: `${term?.academicYear?.name ? `${term.academicYear.name} · ` : ''}${term?.sequence}. ${term?.name || ''}` },
      { Metric: 'Assessments in progress', Value: counts.inProgress },
      { Metric: 'Assessments awaiting review', Value: counts.review },
      { Metric: 'Assessments approved and report-ready', Value: counts.approved },
      { Metric: 'Students ready for reports', Value: readyCards },
      { Metric: 'Students checked for report readiness', Value: totalCards },
      { Metric: 'Student issue rows', Value: blockerRows.length },
      { Metric: 'Exported at', Value: new Date().toLocaleString() },
    ];
    const workbook = XLSX.utils.book_new();
    const addSheet = (name, rows, headers) => {
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.min(48, Math.max(header.length + 2, ...rows.map((row) => String(row[header] ?? '').length + 2))) }));
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    };
    addSheet('Student blockers', blockerRows, ['Report stage', 'Class', 'Student', 'Admission number', 'Subject', 'Issue to resolve', 'Responsible teacher']);
    addSheet('Assessment status', workflowRows, ['Class', 'Assessment', 'Subject', 'Teacher', 'Status', 'Assessment type']);
    addSheet('Term summary', summaryRows, ['Metric', 'Value']);
    const safeTerm = (term?.name || 'term').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    XLSX.writeFile(workbook, `exam-results-status-${safeTerm}.xlsx`);
  }

  return <section className="panel exam-results-status">
    <div className="exam-results-summary">
      <div className="exam-results-summary-main">
        <div className="exam-results-summary-heading"><div><p className="eyebrow">Examinations & results</p><h2>{reportStage === 'MID_TERM' ? 'Mid-term readiness' : 'End-of-term readiness'}</h2></div>
          <label className="exam-results-term"><span className="sr-only">Select term</span><select value={termId} onChange={(event) => setTermId(event.target.value)} disabled={loading || !terms.length}>{terms.map((item) => <option key={item.id} value={item.id}>{item.academicYear?.name ? `${item.academicYear.name} · ` : ''}{item.sequence}. {item.name}</option>)}</select></label>
        </div>
        {loading ? <div className="exam-results-progress-copy"><LoaderCircle size={16} className="animate-spin" /><span>Loading term progress…</span></div>
          : error ? <div className="exam-results-progress-copy exam-results-progress-error" role="alert">{error}</div>
            : !termId ? <div className="exam-results-progress-copy">No terms are available for this school.</div>
              : <>
                <div className="exam-results-progress-copy"><strong>{readinessLoading ? '…' : readinessPercent === null ? '—' : `${readinessPercent}%`}</strong><span>{readinessLoading ? `Checking ${reportStage === 'MID_TERM' ? 'mid-term' : 'end-of-term'} report readiness` : readinessErrorCount ? `Could not check ${readinessErrorCount} class${readinessErrorCount === 1 ? '' : 'es'}` : readinessPercent === null ? 'No student reports to check' : `${readyCards} of ${totalCards} students have complete ${reportStage === 'MID_TERM' ? 'mid-term' : 'end-of-term'} results`}</span></div>
                <div className="exam-results-progress-track" role="progressbar" aria-label={`${reportStage === 'MID_TERM' ? 'Mid-term' : 'End-of-term'} report readiness`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={readinessPercent ?? 0}><span style={{ width: `${readinessPercent ?? 0}%` }} /></div>
                <div className="exam-results-summary-meta"><span>{counts.review} awaiting review</span><span>{counts.inProgress} marks in progress</span><span>{counts.approved} approved for reports</span></div>
              </>}
      </div>
      <button className="exam-results-toggle" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="exam-results-details" disabled={loading || Boolean(error) || !termId}>
        {expanded ? 'Hide details' : 'View details'}<ChevronDown size={16} className={expanded ? 'is-expanded' : ''} />
      </button>
    </div>
    {expanded && <div id="exam-results-details" className="exam-results-details">
    {loading ? <div className="table-message"><LoaderCircle size={17} className="animate-spin" /><span>Loading exam progress…</span></div>
      : error ? <div className="table-message notice-error" role="alert">{error}</div>
        : !termId ? <div className="table-message">No terms are available for this school.</div>
          : <>
            <div className="exam-results-detail-heading"><div><h3>Class progress</h3><p>Assessment workflow and {reportStage === 'MID_TERM' ? 'mid-term report readiness' : 'end-of-term report readiness'}</p></div><button className="secondary-button" type="button" onClick={exportStatusWorkbook} disabled={readinessLoading}><Download size={15} />{readinessLoading ? 'Preparing report…' : 'Export Excel report'}</button></div>
            <div className="exam-results-metrics">
              <div><span>Marks in progress</span><strong>{counts.inProgress}</strong></div>
              <div><span>Awaiting review</span><strong>{counts.review}</strong></div>
              <div><span>Approved for reports</span><strong>{counts.approved}</strong></div>
              <div><span>Reports ready</span><strong>{readyCards} / {totalCards}</strong></div>
            </div>
            <div className="overflow-x-auto">
              <table className="people-table exam-results-table"><thead><tr><th>Class</th><th>Assessments</th><th>Report readiness</th><th></th></tr></thead>
                <tbody>{termGroups.map((group) => {
                  const row = readiness[group.id];
                  const classAssessments = termAssessments.filter((item) => item.teachingAssignment?.classGroupId === group.id || item.teachingAssignment?.classGroup?.id === group.id);
                  const complete = row?.cards?.filter((card) => card.complete).length || 0;
                  const total = row?.cards?.length || 0;
                  const blockers = [...new Set((row?.cards || []).flatMap((card) => reportStage === 'MID_TERM'
                    ? (card.incompleteSubjects || []).flatMap((subject) => (subject.issues || []).map((issue) => issue.message))
                    : (card.missingSubjects || []).map((subject) => subject.issue || `${subject.subjectName}: result missing`)))];
                  const label = [group.classLevel?.name, group.name].filter(Boolean).join(' · ') || group.name;
                  const workflow = classAssessments.length ? `${classAssessments.filter((item) => item.status === 'SUBMITTED').length} for review · ${classAssessments.filter((item) => ['DRAFT', 'OPEN'].includes(item.status)).length} in progress` : 'No assessments';
                  return <tr key={group.id}><td><strong>{label}</strong></td><td>{workflow}</td><td>{row?.error ? <span>{row.error}</span> : row?.publication ? <span className="exam-results-ready"><Check size={14} /> Published</span> : row?.cards ? <><span>{complete} of {total} students ready</span>{blockers.length > 0 && <small className="exam-results-blockers">{blockers.slice(0, 2).join(' · ')}{blockers.length > 2 ? ' · more issues' : ''}</small>}</> : 'Checking…'}</td><td><button className="text-button" type="button" onClick={() => onNavigate(reportStage === 'MID_TERM' ? 'mid-term-report-cards' : 'report-cards')} aria-label={`Open ${reportStage === 'MID_TERM' ? 'mid-term' : 'end-of-term'} reports for ${label}`}>Open <ArrowRight size={14} /></button></td></tr>;
                })}</tbody>
              </table>
            </div>
            {!termGroups.length && <div className="table-message">No classes are set up for this academic year.</div>}
            <div className="exam-results-actions"><button className="panel-footer" type="button" onClick={() => onNavigate('assessments')}><ClipboardList size={15} /> Review assessments</button><button className="panel-footer" type="button" onClick={() => onNavigate(reportStage === 'MID_TERM' ? 'mid-term-report-cards' : 'report-cards')}><FileText size={15} /> Open {reportStage === 'MID_TERM' ? 'mid-term reports' : 'end-of-term reports'}</button></div>
            <div className="exam-results-collapse-row"><button className="exam-results-toggle" type="button" onClick={() => setExpanded(false)}>Collapse details <ChevronDown size={16} className="is-expanded" /></button></div>
          </>}
    </div>}
  </section>;
}
