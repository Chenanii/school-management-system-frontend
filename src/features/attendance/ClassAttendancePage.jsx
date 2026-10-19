import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCheck, LoaderCircle, UsersRound } from 'lucide-react';
import { fetchAttendanceClasses, fetchAttendanceSheet, fetchAttendanceTerms, saveAttendanceSheet } from './attendanceApi.js';

const MARKS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'EXCUSED', label: 'Excused' }
];

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function studentName(student) {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
}

function className(group) {
  return [group?.classLevel?.name, group?.name].filter(Boolean).join(' · ');
}

export default function ClassAttendancePage({ user, signOut }) {
  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [date, setDate] = useState(todayLocal);
  const [classes, setClasses] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAttendanceTerms()
      .then((rows) => {
        if (cancelled) return;
        setTerms(rows);
        const current = rows.find((term) => term.status === 'OPEN' && term.academicYear?.isCurrent) || rows.find((term) => term.status === 'OPEN') || rows[0];
        if (current) setTermId(current.id);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoadingTerms(false); });
    return () => { cancelled = true; };
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    setClasses([]);
    setClassGroupId('');
    setSheet(null);
    if (!termId) return undefined;
    setLoadingClasses(true);
    setError('');
    fetchAttendanceClasses(termId, date)
      .then((result) => {
        if (cancelled) return;
        const rows = result.data || [];
        setClasses(rows);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoadingClasses(false); });
    return () => { cancelled = true; };
  }, [termId, date, signOut]);

  useEffect(() => {
    let cancelled = false;
    setSheet(null);
    if (!termId || !classGroupId || !date) return undefined;
    setLoadingSheet(true);
    setError('');
    fetchAttendanceSheet({ termId, classGroupId, date })
      .then((result) => { if (!cancelled) setSheet(result.data); })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoadingSheet(false); });
    return () => { cancelled = true; };
  }, [termId, classGroupId, date, signOut]);

  const markedCount = sheet?.students.filter((row) => row.status).length || 0;
  const counts = useMemo(() => (sheet?.students || []).reduce((summary, row) => {
    if (row.status) summary[row.status] += 1;
    return summary;
  }, { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }), [sheet]);

  function updateStudent(enrollmentId, key, value) {
    setSheet((current) => ({
      ...current,
      students: current.students.map((row) => row.enrollmentId === enrollmentId ? { ...row, [key]: value } : row)
    }));
  }

  function markAllPresent() {
    setSheet((current) => ({ ...current, students: current.students.map((row) => ({ ...row, status: 'PRESENT' })) }));
  }

  async function save() {
    if (!sheet || markedCount !== sheet.students.length || !sheet.canRecord) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await saveAttendanceSheet({
        termId,
        classGroupId,
        date,
        records: sheet.students.map(({ enrollmentId, status, note }) => ({ enrollmentId, status, note }))
      });
      setNotice('Attendance saved for this class and date.');
      setSheet((current) => ({ ...current, saved: true }));
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  const canRecord = user.role === 'TEACHER' || user.role === 'FORM_TUTOR';

  return (
    <>
      <div className="welcome-row students-welcome">
        <div><p className="eyebrow">Student records</p><h1 className="page-title">Class attendance<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Form tutors take the daily register for their assigned class. School administrators can record registers and follow class summaries.</p></div>
      </div>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {notice && <div className="teaching-assignment-notice" role="status">{notice}</div>}
      <section className="panel attendance-panel">
        <div className="attendance-toolbar">
          <label className="field-label">Academic term
            <select className="filter-select" value={termId} onChange={(event) => setTermId(event.target.value)} disabled={loadingTerms}>
              <option value="">{loadingTerms ? 'Loading terms…' : 'Select a term'}</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.academicYear?.name} · {term.sequence}. {term.name}</option>)}
            </select>
          </label>
          <label className="field-label">Attendance date
            <input className="filter-select" type="date" value={date} onChange={(event) => { setDate(event.target.value); setClassGroupId(''); setNotice(''); }} />
          </label>
        </div>
        {!loadingTerms && !termId && <div className="table-message">There are no academic terms available for attendance.</div>}
        {!loadingClasses && termId && !classes.length && !error && <div className="table-message"><UsersRound size={20} />{canRecord ? 'No class groups are assigned to you as a form tutor for this term.' : 'No form tutor assignments are available for this term.'}</div>}
        {classes.length > 0 && <div className="attendance-class-list">{classes.map((item) => {
          const summary = item.attendance;
          const selected = classGroupId === item.classGroupId;
          return <button type="button" className={`attendance-class-card ${selected ? 'attendance-class-card-selected' : ''}`} key={item.classGroupId} onClick={() => { setClassGroupId(item.classGroupId); setNotice(''); }}>
            <span className="attendance-class-card-top"><strong>{className(item.classGroup)}</strong><span>{item.studentCount} students</span></span>
            <span className="attendance-class-card-summary">{summary.saved
              ? `${summary.summary.PRESENT} present · ${summary.summary.ABSENT} absent · ${summary.summary.LATE} late · ${summary.summary.EXCUSED} excused`
              : 'No register saved for this date'}</span>
            <span className="attendance-class-card-action">{summary.saved ? 'Open register' : 'Take register'} <span aria-hidden="true">→</span></span>
            {summary.saved && <span className="attendance-class-card-by">Recorded by {summary.recordedBy} · {summary.marked}/{summary.total} marked</span>}
          </button>;
        })}</div>}
        {loadingSheet ? <div className="table-message"><LoaderCircle size={18} className="animate-spin" /> Loading class register…</div> : sheet && <>
          <div className="attendance-summary">
            <div><span className="attendance-class-icon"><CalendarDays size={17} /></span><div><strong>{className(sheet.classGroup)}</strong><span>{sheet.term.academicYear.name} · {sheet.term.name} · Form tutor: {sheet.formTutor.firstName} {sheet.formTutor.lastName}</span></div></div>
            <div className="attendance-counts"><span>{counts.PRESENT} present</span><span>{counts.ABSENT} absent</span><span>{counts.LATE} late</span><span>{counts.EXCUSED} excused</span></div>
          </div>
          {!sheet.canRecord && <div className="attendance-readonly-note">Only the assigned form tutor can take or edit this register.</div>}
          {sheet.term.status !== 'OPEN' && <div className="attendance-readonly-note">Attendance can only be changed while the term is open.</div>}
          <div className="attendance-register-heading"><span><strong>{sheet.students.length}</strong> students · <strong>{markedCount}</strong> marked {sheet.saved && <span className="attendance-saved"><Check size={14} /> Saved</span>}</span>
            <div className="attendance-register-actions"><button className="text-button" type="button" onClick={() => setClassGroupId('')}>Choose another class</button>{sheet.canRecord && <button className="secondary-button" type="button" onClick={markAllPresent} disabled={!sheet.students.length}><CheckCheck size={15} /> Mark all present</button>}</div>
          </div>
          {!sheet.students.length ? <div className="table-message">No active students are enrolled in this class for the selected term.</div> : <div className="attendance-list">{sheet.students.map((row, index) => <div className="attendance-row" key={row.enrollmentId}>
            <span className="attendance-row-number">{index + 1}</span>
            <div className="attendance-student"><strong>{studentName(row.student)}</strong><span>{row.student.admissionNumber}</span></div>
            <select className={`filter-select attendance-status-select ${row.status ? `attendance-status-${row.status.toLowerCase()}` : ''}`} value={row.status || ''} onChange={(event) => updateStudent(row.enrollmentId, 'status', event.target.value)} disabled={!sheet.canRecord || sheet.term.status !== 'OPEN'} aria-label={`Attendance for ${studentName(row.student)}`}>
              <option value="">Mark attendance</option>{MARKS.map((mark) => <option key={mark.value} value={mark.value}>{mark.label}</option>)}
            </select>
            <input className="search-input attendance-note" value={row.note || ''} onChange={(event) => updateStudent(row.enrollmentId, 'note', event.target.value)} placeholder="Note (optional)" maxLength={300} aria-label={`Note for ${studentName(row.student)}`} disabled={!sheet.canRecord || sheet.term.status !== 'OPEN'} />
          </div>)}</div>}
          {sheet.canRecord && <div className="attendance-footer"><span>{sheet.saved ? 'You can update this register while the term is open.' : 'Mark every student before saving the register.'}</span><button className="primary-button" type="button" onClick={save} disabled={saving || !sheet.students.length || markedCount !== sheet.students.length || sheet.term.status !== 'OPEN'}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{saving ? 'Saving…' : sheet.saved ? 'Update attendance' : 'Save attendance'}</button></div>}
        </>}</section>
    </>
  );
}
