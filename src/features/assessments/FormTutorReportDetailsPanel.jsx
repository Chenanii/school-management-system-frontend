import { useEffect, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { fetchAllPages, fetchClassGroupReportCards, saveEndOfTermReportDetails } from '../report-cards/reportCardApi.js';
import { fetchClassGroupMidTermReportCards, fetchFormTutorAttendanceClasses, saveMidTermReportDetails } from '../mid-term-report-cards/midTermReportCardApi.js';
import AssessmentPopup from './AssessmentPopup.jsx';

function displayName(student) {
  return [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(' ') || 'Student';
}

function StudentReportDetailsForm({ card, reportType }) {
  const [details, setDetails] = useState({ behaviorComments: {}, coCurricularComments: {}, promotedTo: card.nextEnrollment?.classLevel?.name || '', promotionRemarks: '', ...(card.reportDetails || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDetails({ behaviorComments: {}, coCurricularComments: {}, promotedTo: card.nextEnrollment?.classLevel?.name || '', promotionRemarks: '', ...(card.reportDetails || {}) });
  }, [card]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false);
    try {
      const save = reportType === 'MID_TERM' ? saveMidTermReportDetails : saveEndOfTermReportDetails;
      const { data } = await save(card.enrollment.id, details);
      setDetails((current) => ({ ...current, ...data })); setSaved(true);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  }

  function updateComment(group, key, value) {
    setDetails((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
    setSaved(false);
  }

  return <form className="form-tutor-report-student" onSubmit={submit}>
    <AssessmentPopup message={error} onDismiss={() => setError('')} />
    <AssessmentPopup message={saved ? 'Student report details saved.' : ''} type="success" onDismiss={() => setSaved(false)} />
    <div className="form-tutor-report-student-heading"><div><strong>{displayName(card.student)}</strong><span>{card.student?.admissionNumber || 'No admission number'} · {card.classGroup?.name || card.classLevel?.name || 'Class'}</span></div></div>
    <div className="form-tutor-report-fields">
      <label className="field-label">Classroom conduct<textarea className="text-input" rows={2} maxLength={500} value={details.behaviorComments?.classroomConduct || ''} onChange={(event) => updateComment('behaviorComments', 'classroomConduct', event.target.value)} /></label>
      <label className="field-label">Respect & responsibility<textarea className="text-input" rows={2} maxLength={500} value={details.behaviorComments?.respectResponsibility || ''} onChange={(event) => updateComment('behaviorComments', 'respectResponsibility', event.target.value)} /></label>
      <label className="field-label">Participation<textarea className="text-input" rows={2} maxLength={500} value={details.behaviorComments?.participation || ''} onChange={(event) => updateComment('behaviorComments', 'participation', event.target.value)} /></label>
      <label className="field-label">Sports<textarea className="text-input" rows={2} maxLength={500} value={details.coCurricularComments?.sports || ''} onChange={(event) => updateComment('coCurricularComments', 'sports', event.target.value)} /></label>
      <label className="field-label">Arts<textarea className="text-input" rows={2} maxLength={500} value={details.coCurricularComments?.arts || ''} onChange={(event) => updateComment('coCurricularComments', 'arts', event.target.value)} /></label>
      <label className="field-label">Clubs / other<textarea className="text-input" rows={2} maxLength={500} value={details.coCurricularComments?.clubsOther || ''} onChange={(event) => updateComment('coCurricularComments', 'clubsOther', event.target.value)} /></label>
      <label className="field-label">Promotion destination<input className="text-input" maxLength={120} value={details.promotedTo || ''} onChange={(event) => { setDetails((current) => ({ ...current, promotedTo: event.target.value })); setSaved(false); }} /></label>
      <label className="field-label">Promotion remarks<textarea className="text-input" rows={2} maxLength={1000} value={details.promotionRemarks || ''} onChange={(event) => { setDetails((current) => ({ ...current, promotionRemarks: event.target.value })); setSaved(false); }} /></label>
    </div>
    <div className="form-tutor-report-save"><button className="secondary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Saving…' : 'Save details'}</button></div>
  </form>;
}

export default function FormTutorReportDetailsPanel({ signOut }) {
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [termId, setTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [reportType, setReportType] = useState('MID_TERM');
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAllPages('/terms').then((rows) => { if (!cancelled) setTerms(rows); })
      .catch((cause) => { if (!cancelled) { setError(cause.message); if (cause.status === 401) signOut(); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    setGroups([]); setClassGroupId(''); setCards(null);
    if (!termId) return undefined;
    setLoadingGroups(true); setError('');
    fetchFormTutorAttendanceClasses(termId).then(({ data }) => {
      if (!cancelled) setGroups((data || []).map((item) => item.classGroup));
    }).catch((cause) => { if (!cancelled) { setError(cause.message); if (cause.status === 401) signOut(); } })
      .finally(() => { if (!cancelled) setLoadingGroups(false); });
    return () => { cancelled = true; };
  }, [termId, signOut]);

  async function loadStudents() {
    if (!termId || !classGroupId) return;
    setLoadingCards(true); setError(''); setCards(null);
    try {
      const result = reportType === 'MID_TERM'
        ? await fetchClassGroupMidTermReportCards(termId, classGroupId, { allowIncomplete: true })
        : await fetchClassGroupReportCards(termId, classGroupId, { allowIncomplete: true });
      setCards(result.data || []);
    } catch (cause) { setError(cause.message); if (cause.status === 401) signOut(); }
    finally { setLoadingCards(false); }
  }

  return <section className="panel form-tutor-report-panel">
    <AssessmentPopup message={error} onDismiss={() => setError('')} />
    <div className="panel-heading"><div><h2>Form tutor report details</h2><p>Enter behaviour and activity comments for each student. End-of-term reports also include promotion details.</p></div></div>
    <div className="form-tutor-report-toolbar">
      <label className="field-label">Report period<select className="filter-select" value={reportType} onChange={(event) => { setReportType(event.target.value); setCards(null); }}><option value="MID_TERM">Mid-term</option><option value="END_OF_TERM">End-of-term</option></select></label>
      <label className="field-label">Academic term<select className="filter-select" value={termId} onChange={(event) => setTermId(event.target.value)} disabled={loading}><option value="">{loading ? 'Loading terms…' : 'Select a term'}</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.academicYear?.name} · {term.sequence}. {term.name}</option>)}</select></label>
      <label className="field-label">Assigned class<select className="filter-select" value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)} disabled={!termId || loadingGroups}><option value="">{loadingGroups ? 'Loading classes…' : 'Select a class'}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}</select></label>
      <button className="primary-button" type="button" onClick={loadStudents} disabled={!termId || !classGroupId || loadingCards}>{loadingCards ? <LoaderCircle size={15} className="animate-spin" /> : null}{loadingCards ? 'Loading…' : 'Load students'}</button>
    </div>
    {termId && !loadingGroups && !error && groups.length === 0 && <div className="attendance-readonly-note">No classes are assigned to you as form tutor for this term.</div>}
    {cards && <div className="form-tutor-report-students">{cards.length ? cards.map((card) => <StudentReportDetailsForm key={card.enrollment.id} card={card} reportType={reportType} />) : <div className="table-message">No active students are enrolled in this class for the selected term.</div>}</div>}
  </section>;
}
