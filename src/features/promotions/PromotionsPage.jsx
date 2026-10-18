import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, Check, ChevronRight, ClipboardCheck, LoaderCircle, RefreshCw, Settings2, UsersRound } from 'lucide-react';
import {
  approvePromotion,
  fetchAllPages,
  fetchPromotionBatch,
  fetchPromotionPreview,
  savePromotionPolicy
} from './promotionApi.js';

const outcomeLabels = { PROMOTE: 'Promote', REPEAT: 'Repeat', GRADUATE: 'Graduate' };

function termLabel(term) {
  return `${term.name} · ${term.academicYear?.name || 'Academic year'}`;
}

function studentName(student) {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || 'Student';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(date);
}

function BatchDetails({ batch, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="user-modal promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-batch-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Approved promotion batch</p>
            <h2 id="promotion-batch-title">{batch.classGroup?.classLevel?.name} {batch.classGroup?.name}</h2>
            <p>{termLabel(batch.sourceTerm)} <ArrowRight size={13} className="inline" /> {termLabel(batch.destinationTerm)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="promotion-batch-meta">
          <span>Approved {formatDate(batch.approvedAt)}</span>
          <span>By {[batch.approvedBy?.firstName, batch.approvedBy?.lastName].filter(Boolean).join(' ') || batch.approvedBy?.email || 'Administrator'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="people-table">
            <thead><tr><th>Enrollment</th><th>Outcome</th><th>Recommendation</th><th>Average</th><th>Override reason</th></tr></thead>
            <tbody>
              {(Array.isArray(batch.decisions) ? batch.decisions : []).map((decision) => (
                <tr key={decision.sourceEnrollmentId}>
                  <td className="text-muted">{decision.sourceEnrollmentId}</td>
                  <td>{outcomeLabels[decision.outcome] || decision.outcome}</td>
                  <td>{outcomeLabels[decision.recommendedOutcome] || decision.recommendedOutcome}</td>
                  <td>{decision.metrics?.average == null ? '—' : `${decision.metrics.average}%`}</td>
                  <td>{decision.overrideReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Close</button></div>
      </section>
    </div>
  );
}

function PolicyEditor({ policy, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    minimumAverage: String(policy.minimumAverage),
    passMark: String(policy.passMark),
    minimumSubjectsPassed: String(policy.minimumSubjectsPassed),
    requiredSubjectIds: policy.requiredSubjectIds || []
  }));
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      minimumAverage: String(policy.minimumAverage),
      passMark: String(policy.passMark),
      minimumSubjectsPassed: String(policy.minimumSubjectsPassed),
      requiredSubjectIds: policy.requiredSubjectIds || []
    });
    setError('');
  }, [policy]);

  function toggleSubject(id) {
    setForm((current) => ({
      ...current,
      requiredSubjectIds: current.requiredSubjectIds.includes(id)
        ? current.requiredSubjectIds.filter((subjectId) => subjectId !== id)
        : [...current.requiredSubjectIds, id]
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await onSave(policy.classLevelId, {
        minimumAverage: Number(form.minimumAverage),
        passMark: Number(form.passMark),
        minimumSubjectsPassed: Number(form.minimumSubjectsPassed),
        requiredSubjectIds: form.requiredSubjectIds
      });
    } catch (cause) {
      setError(cause.message);
    }
  }

  return (
    <form className="panel promotion-policy-card" onSubmit={submit}>
      <div className="promotion-policy-heading">
        <div><h3>{policy.classLevelName}</h3><p>{policy.isDefault ? 'Using the system default policy' : 'Custom policy saved'}</p></div>
        <span className={`subject-status ${policy.isDefault ? 'subject-status-inactive' : 'subject-status-active'}`}>{policy.isDefault ? 'Default' : 'Custom'}</span>
      </div>
      <p className="px-5 pb-3 text-xs text-muted">Promotion thresholds use percentages for every school. Primary report marks out of 50 are converted to percentages for these checks.</p>
      <div className="promotion-policy-fields">
        <label className="field-label">Minimum average (%)
          <input className="text-input" type="number" min="0" max="100" step="0.01" value={form.minimumAverage} onChange={(event) => setForm({ ...form, minimumAverage: event.target.value })} required />
        </label>
        <label className="field-label">Pass mark (%)
          <input className="text-input" type="number" min="0" max="100" step="0.01" value={form.passMark} onChange={(event) => setForm({ ...form, passMark: event.target.value })} required />
        </label>
        <label className="field-label">Minimum subjects passed
          <input className="text-input" type="number" min="0" max={policy.subjects.length} step="1" value={form.minimumSubjectsPassed} onChange={(event) => setForm({ ...form, minimumSubjectsPassed: event.target.value })} required />
        </label>
      </div>
      <fieldset className="promotion-required-subjects">
        <legend>Required pass subjects</legend>
        {policy.subjects.length ? policy.subjects.map((subject) => (
          <label key={subject.id}>
            <input type="checkbox" checked={form.requiredSubjectIds.includes(subject.id)} onChange={() => toggleSubject(subject.id)} />
            <span>{subject.name}{subject.code ? ` (${subject.code})` : ''}</span>
          </label>
        )) : <p className="field-hint">No subjects are assigned to this class level.</p>}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="promotion-policy-footer">
        <span>Changing a policy does not alter previously approved batches.</span>
        <button className="primary-button" type="submit" disabled={saving || policy.subjects.length === 0}>
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
          {saving ? 'Saving…' : 'Save policy'}
        </button>
      </div>
    </form>
  );
}

export default function PromotionsPage({ user, signOut }) {
  const [tab, setTab] = useState('process');
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sourceTermId, setSourceTermId] = useState('');
  const [destinationTermId, setDestinationTermId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [preview, setPreview] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyPolicyId, setBusyPolicyId] = useState('');
  const [approving, setApproving] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchLoadingId, setBatchLoadingId] = useState('');
  const canManagePolicies = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEADTEACHER','ACADEMIC_ADMIN'].includes(user.role);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [termData, groupData, policyResult, batchData] = await Promise.all([
          fetchAllPages('/terms'),
          fetchAllPages('/class-groups'),
          canManagePolicies ? fetchAllPages('/promotions/policies') : Promise.resolve([]),
          fetchAllPages('/promotions/batches')
        ]);
        if (cancelled) return;
        setTerms(termData);
        setGroups(groupData);
        setPolicies(policyResult);
        setBatches(batchData);
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [canManagePolicies, refreshKey, signOut]);

  const sourceTermOptions = useMemo(() => {
    const termsByYear = new Map();
    terms.forEach((term) => {
      const yearId = term.academicYearId;
      termsByYear.set(yearId, [...(termsByYear.get(yearId) || []), term]);
    });
    return terms.filter((term) => {
      const yearTerms = termsByYear.get(term.academicYearId) || [];
      return yearTerms.length && term.sequence === Math.max(...yearTerms.map((item) => item.sequence));
    }).sort((left, right) => new Date(left.academicYear?.startDate) - new Date(right.academicYear?.startDate));
  }, [terms]);

  const destinationTermOptions = useMemo(() => {
    const source = terms.find((term) => term.id === sourceTermId);
    if (!source) return [];
    const years = [...new Map(terms.map((term) => [term.academicYearId, term.academicYear])).values()]
      .filter(Boolean)
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate));
    const sourceYearIndex = years.findIndex((year) => year.id === source.academicYearId);
    const nextYear = years[sourceYearIndex + 1];
    if (!nextYear) return [];
    const firstSequence = Math.min(...terms.filter((term) => term.academicYearId === nextYear.id).map((term) => term.sequence));
    return terms.filter((term) => term.academicYearId === nextYear.id && term.sequence === firstSequence);
  }, [terms, sourceTermId]);

  const selectedGroup = groups.find((group) => group.id === classGroupId);
  const destinationGroupsFor = (outcome) => {
    if (!selectedGroup) return [];
    const classLevelId = outcome === 'REPEAT'
      ? selectedGroup.classLevelId
      : selectedGroup.classLevel?.nextLevelId;
    return groups.filter((group) => group.classLevelId === classLevelId);
  };

  function changeScope(name, value) {
    if (name === 'source') {
      setSourceTermId(value);
      setDestinationTermId('');
    } else if (name === 'destination') setDestinationTermId(value);
    else setClassGroupId(value);
    setPreview(null);
    setDecisions({});
    setError('');
    setNotice('');
  }

  async function loadPreview(event) {
    event.preventDefault();
    setPreviewLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await fetchPromotionPreview({ sourceTermId, destinationTermId, classGroupId });
      setPreview(result.data);
      setDecisions(Object.fromEntries(result.data.students.map((student) => [student.enrollmentId, {
        outcome: student.recommendedOutcome || student.allowedOutcomes[0],
        destinationClassGroupId: student.recommendedOutcome === 'GRADUATE'
          ? ''
          : destinationGroupsForValue(groups, selectedGroup, student.recommendedOutcome)[0]?.id || '',
        overrideReason: ''
      }])));
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setPreviewLoading(false);
    }
  }

  function updateDecision(student, key, value) {
    setDecisions((current) => {
      const decision = { ...current[student.enrollmentId], [key]: value };
      if (key === 'outcome') {
        const destinations = destinationGroupsForValue(groups, selectedGroup, value);
        decision.destinationClassGroupId = value === 'GRADUATE' ? '' : destinations[0]?.id || '';
        if (value === student.recommendedOutcome) decision.overrideReason = '';
      }
      return { ...current, [student.enrollmentId]: decision };
    });
  }

  async function submitApproval() {
    if (!preview || preview.ineligibleCount > 0) return;
    const missingChoice = preview.students.some((student) => {
      const decision = decisions[student.enrollmentId];
      return !decision || (decision.outcome !== 'GRADUATE' && !decision.destinationClassGroupId) ||
        (decision.outcome !== student.recommendedOutcome && !decision.overrideReason.trim());
    });
    if (missingChoice) {
      setError('Choose a destination for every student and provide a reason for each overridden recommendation.');
      return;
    }
    if (!window.confirm(`Approve outcomes for ${preview.totalStudents} students? This will update their enrollments for the destination term.`)) return;
    setApproving(true);
    setError('');
    setNotice('');
    try {
      const result = await approvePromotion({ sourceTermId, destinationTermId, classGroupId },
        preview.students.map((student) => ({
          enrollmentId: student.enrollmentId,
          outcome: decisions[student.enrollmentId].outcome,
          ...(decisions[student.enrollmentId].destinationClassGroupId ? { destinationClassGroupId: decisions[student.enrollmentId].destinationClassGroupId } : {}),
          ...(decisions[student.enrollmentId].overrideReason.trim() ? { overrideReason: decisions[student.enrollmentId].overrideReason.trim() } : {})
        }))
      );
      setNotice(`Promotion batch approved. ${result.data.processedCount} student outcomes were processed.`);
      setPreview(null);
      setDecisions({});
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setApproving(false);
    }
  }

  async function savePolicy(classLevelId, data) {
    setBusyPolicyId(classLevelId);
    try {
      await savePromotionPolicy(classLevelId, data);
      setNotice('Promotion policy saved.');
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      if (cause.status === 401) signOut();
      throw cause;
    } finally {
      setBusyPolicyId('');
    }
  }

  async function openBatch(batchId) {
    setBatchLoadingId(batchId);
    try {
      const result = await fetchPromotionBatch(batchId);
      setSelectedBatch(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setBatchLoadingId('');
    }
  }

  if (loading) return <div className="panel table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading promotion workspace…</span></div>;

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">Academic progression</p>
          <h1 className="page-title">Promotions<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Review published results, apply progression policies, and process next-year enrollments.</p>
        </div>
      </div>
      {error && <div className="notice-error mb-4" role="alert"><span>{error}</span><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
      <div className="promotion-tabs" role="tablist" aria-label="Promotion management">
        <button className={tab === 'process' ? 'promotion-tab promotion-tab-active' : 'promotion-tab'} role="tab" aria-selected={tab === 'process'} onClick={() => setTab('process')}><ClipboardCheck size={16} /> Process promotions</button>
        {canManagePolicies && <button className={tab === 'policies' ? 'promotion-tab promotion-tab-active' : 'promotion-tab'} role="tab" aria-selected={tab === 'policies'} onClick={() => setTab('policies')}><Settings2 size={16} /> Policies</button>}
        <button className={tab === 'history' ? 'promotion-tab promotion-tab-active' : 'promotion-tab'} role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}><RefreshCw size={16} /> Batch history <span>{batches.length}</span></button>
      </div>

      {tab === 'process' && (
        <section className="panel promotion-process-panel">
          <div className="promotion-section-heading"><div><h2>Prepare a promotion batch</h2><p>Only published results from the last term of an academic year can be processed.</p></div></div>
          <form className="promotion-scope-form" onSubmit={loadPreview}>
            <label className="field-label">Source class group
              <select className="text-input" value={classGroupId} onChange={(event) => changeScope('group', event.target.value)} required>
                <option value="">Select a class group</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
              </select>
            </label>
            <label className="field-label">Source (final) term
              <select className="text-input" value={sourceTermId} onChange={(event) => changeScope('source', event.target.value)} required>
                <option value="">Select source term</option>
                {sourceTermOptions.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
              </select>
            </label>
            <label className="field-label">Destination (first) term
              <select className="text-input" value={destinationTermId} onChange={(event) => changeScope('destination', event.target.value)} required disabled={!destinationTermOptions.length}>
                <option value="">{destinationTermOptions.length ? 'Select destination term' : 'No following academic year found'}</option>
                {destinationTermOptions.map((term) => <option key={term.id} value={term.id}>{termLabel(term)}</option>)}
              </select>
            </label>
            <button className="primary-button promotion-preview-button" type="submit" disabled={previewLoading || !classGroupId || !sourceTermId || !destinationTermId}>
              {previewLoading ? <LoaderCircle size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {previewLoading ? 'Generating…' : 'Generate preview'}
            </button>
          </form>
          {(!terms.length || !groups.length) && <p className="promotion-empty-hint">Set up academic years, terms, class levels, and class groups before processing promotions.</p>}
        </section>
      )}

      {tab === 'process' && preview && (
        <section className="panel promotion-preview-panel">
          <div className="promotion-section-heading">
            <div><h2>{preview.source.classLevelName} · {groups.find((group) => group.id === preview.source.classGroupId)?.name}</h2><p>{preview.source.termName}, {preview.source.academicYear} <ArrowRight size={13} className="inline" /> {preview.destination.termName}, {preview.destination.academicYear}</p></div>
            <button className="text-button" onClick={() => setPreview(null)}>Clear preview</button>
          </div>
          <div className="promotion-summary">
            <div><UsersRound size={17} /><strong>{preview.totalStudents}</strong><span>Students</span></div>
            <div><Check size={17} /><strong>{preview.eligibleCount}</strong><span>Ready</span></div>
            <div><BookOpenCheck size={17} /><strong>{preview.ineligibleCount}</strong><span>Missing results</span></div>
          </div>
          {preview.ineligibleCount > 0 && <p className="promotion-blocked-note">All subject results must be published and include final marks before any batch can be approved. Resolve missing results, then generate a fresh preview.</p>}
          <div className="overflow-x-auto">
            <table className="people-table promotion-student-table">
              <thead><tr><th>Student</th><th>Average</th><th>Passed</th><th>Eligibility</th><th>Outcome</th><th>Destination class</th><th>Override reason</th></tr></thead>
              <tbody>
                {preview.students.map((student) => {
                  const decision = decisions[student.enrollmentId] || {};
                  const destinations = destinationGroupsFor(decision.outcome);
                  const missing = student.missingSubjectIds.length + student.missingMarkSubjectIds.length;
                  return (
                    <tr key={student.enrollmentId}>
                      <td><div className="promotion-student-name"><strong>{studentName(student.student)}</strong><span>{student.student.admissionNumber}</span></div></td>
                      <td>{student.metrics.average == null ? '—' : `${student.metrics.average}%`}</td>
                      <td>{student.metrics.subjectsPassed}/{student.metrics.subjectsAssessed}</td>
                      <td>{student.eligible ? <span className="subject-status subject-status-active">Ready</span> : <span className="subject-status subject-status-inactive">{missing} missing</span>}</td>
                      <td>
                        <select className="text-input promotion-decision-select" value={decision.outcome || ''} disabled={!student.eligible} onChange={(event) => updateDecision(student, 'outcome', event.target.value)}>
                          {student.allowedOutcomes.map((outcome) => <option key={outcome} value={outcome}>{outcomeLabels[outcome]}</option>)}
                        </select>
                      </td>
                      <td>
                        {decision.outcome === 'GRADUATE' ? <span className="text-muted">No enrollment</span> : (
                          <select className="text-input promotion-decision-select" value={decision.destinationClassGroupId || ''} disabled={!student.eligible || !destinations.length} onChange={(event) => updateDecision(student, 'destinationClassGroupId', event.target.value)}>
                            <option value="">Select class</option>
                            {destinations.map((group) => <option key={group.id} value={group.id}>{group.classLevel?.name} · {group.name}</option>)}
                          </select>
                        )}
                      </td>
                      <td>{decision.outcome !== student.recommendedOutcome && student.eligible
                        ? <input className="text-input promotion-reason-input" value={decision.overrideReason || ''} maxLength={500} placeholder="Required for override" onChange={(event) => updateDecision(student, 'overrideReason', event.target.value)} />
                        : <span className="text-muted">{student.eligible ? '—' : 'Resolve published results first'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="promotion-approval-footer">
            <p>Recommendations use the {preview.policy.isDefault ? 'default' : 'saved'} policy: minimum average {preview.policy.minimumAverage}%, pass mark {preview.policy.passMark}%.</p>
            <button className="primary-button" type="button" onClick={submitApproval} disabled={approving || preview.ineligibleCount > 0 || !preview.totalStudents}>
              {approving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={15} />}
              {approving ? 'Approving batch…' : 'Approve promotion batch'}
            </button>
          </div>
        </section>
      )}

      {tab === 'policies' && canManagePolicies && (
        <div className="promotion-policy-list">
          <div className="promotion-section-heading"><div><h2>Promotion policies</h2><p>Set average and subject pass requirements per class level.</p></div></div>
          {policies.length ? policies.map((policy) => (
            <PolicyEditor key={policy.classLevelId} policy={policy} onSave={savePolicy} saving={busyPolicyId === policy.classLevelId} />
          )) : <div className="panel table-message"><span>No class levels are configured.</span></div>}
        </div>
      )}

      {tab === 'history' && (
        <section className="panel promotion-history-panel">
          <div className="promotion-section-heading"><div><h2>Approved batches</h2><p>Completed class-group promotion and graduation decisions.</p></div><span className="subscription-record-count">{batches.length} batches</span></div>
          {batches.length ? (
            <div className="overflow-x-auto">
              <table className="people-table">
                <thead><tr><th>Class group</th><th>From</th><th>To</th><th>Status</th><th>Approved</th><th>Approved by</th><th /></tr></thead>
                <tbody>{batches.map((batch) => (
                  <tr key={batch.id}>
                    <td><strong>{batch.classGroup?.classLevel?.name} · {batch.classGroup?.name}</strong></td>
                    <td>{termLabel(batch.sourceTerm)}</td><td>{termLabel(batch.destinationTerm)}</td>
                    <td><span className="subject-status subject-status-active">{batch.status}</span></td>
                    <td>{formatDate(batch.approvedAt)}</td>
                    <td>{[batch.approvedBy?.firstName, batch.approvedBy?.lastName].filter(Boolean).join(' ') || batch.approvedBy?.email}</td>
                    <td><button className="table-action" onClick={() => openBatch(batch.id)} disabled={batchLoadingId === batch.id}>{batchLoadingId === batch.id ? <LoaderCircle size={14} className="animate-spin" /> : 'Details'}</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="table-message"><span>No promotion batches have been approved yet.</span></div>}
        </section>
      )}
      {selectedBatch && <BatchDetails batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}
    </>
  );
}

function destinationGroupsForValue(groups, selectedGroup, outcome) {
  if (!selectedGroup) return [];
  const classLevelId = outcome === 'REPEAT'
    ? selectedGroup.classLevelId
    : selectedGroup.classLevel?.nextLevelId;
  return groups.filter((group) => group.classLevelId === classLevelId);
}
