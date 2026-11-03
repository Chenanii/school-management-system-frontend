import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { fetchAllPages } from '../enrollments/enrollmentApi.js';

const blankStudent = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: ''
};
const blankParent = { firstName: '', lastName: '', phone: '', email: '', relationship: '' };

function inputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function StudentFormModal({ student, onClose, onSaved }) {
  const editing = Boolean(student);
  const [step, setStep] = useState(0);
  const formRef = useRef(null);
  const [form, setForm] = useState(blankStudent);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [terms, setTerms] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [termId, setTermId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [parents, setParents] = useState([{ ...blankParent }]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(false);

  useEffect(() => {
    if (editing) return undefined;
    let cancelled = false;
    setOptionsLoading(true);
    Promise.all([fetchAllPages('/terms'), fetchAllPages('/class-levels')])
      .then(([termData, levelData]) => {
        if (!cancelled) {
          setTerms(termData.filter((term) => ['DRAFT', 'OPEN'].includes(term.status)));
          setClassLevels(levelData);
        }
      })
      .catch((cause) => { if (!cancelled) setError(cause.message); })
      .finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [editing]);

  useEffect(() => {
    setStep(0);
    setForm(student ? {
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      dateOfBirth: inputDate(student.dateOfBirth),
      gender: student.gender || ''
    } : blankStudent);
  }, [student]);

  useEffect(() => {
    if (!student) {
      setParents([{ ...blankParent }]);
      setParentsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setParentsLoading(true);
    apiRequest(`/students/${student.id}`)
      .then((result) => {
        if (cancelled) return;
        setParents((result.data.parents || []).map((link) => ({
          parentId: link.parent.id,
          firstName: link.parent.firstName || '',
          lastName: link.parent.lastName || '',
          phone: link.parent.phone || '',
          email: link.parent.email || '',
          relationship: link.relationship || ''
        })));
      })
      .catch((cause) => {
        if (!cancelled) setError(cause.message);
      })
      .finally(() => {
        if (!cancelled) setParentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [student?.id]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateParent(index, name, value) {
    setParents((current) => current.map((parent, parentIndex) => parentIndex === index ? { ...parent, [name]: value } : parent));
  }

  function advanceStep() {
    if (!formRef.current?.reportValidity()) return;
    setError('');
    setStep((current) => Math.min(current + 1, 2));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!editing && step < 2) return;
    setError('');
    setBusy(true);
    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender.trim() || null,
      parents: parents.map((parent) => ({
        ...parent,
        firstName: parent.firstName.trim(),
        lastName: parent.lastName.trim(),
        phone: parent.phone.trim(),
        email: parent.email.trim(),
        relationship: parent.relationship.trim() || undefined
      }))
    };
    if (parents.some((parent) => !parent.phone.trim() && !parent.email.trim())) {
      setError('Add a phone number or email address for each parent or guardian.');
      setBusy(false);
      return;
    }

    try {
      if (editing) {
        await apiRequest(`/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/students', {
          method: 'POST',
          body: JSON.stringify({ ...payload, termId, classLevelId })
        });
      }
      onSaved();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop student-form-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-modal student-modal" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Update student record' : 'New student'}</p>
            <h2 id="student-form-title">{editing ? 'Edit student' : 'Register a student'}</h2>
            <p>{editing ? 'Update the student’s personal details.' : 'Add a learner and enroll them in a class and term.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {!editing && <ol className="student-form-steps" aria-label="Student registration progress">
          {['Student details', 'Enrollment', 'Parent or guardian'].map((label, index) => (
            <li className={index === step ? 'student-form-step student-form-step-active' : index < step ? 'student-form-step student-form-step-complete' : 'student-form-step'} aria-current={index === step ? 'step' : undefined} key={label}>
              <span>{index + 1}</span><span>{label}</span>
            </li>
          ))}
        </ol>}
        <form ref={formRef} className="user-form student-form" onSubmit={handleSubmit}>
          {(editing || step === 0) && <>
          {editing ? (
            <label className="field-label">
              Student ID <span className="optional-label">System-generated · 10 characters</span>
              <input className="text-input" value={student.admissionNumber} readOnly />
            </label>
          ) : (
            <p className="field-label">Student ID <span className="optional-label">Generated automatically · 10 characters</span></p>
          )}
          <div className="user-name-grid">
            <label className="field-label">
              First name
              <input className="text-input" name="firstName" autoComplete="given-name" maxLength={100} value={form.firstName} onChange={updateField} required />
            </label>
            <label className="field-label">
              Last name
              <input className="text-input" name="lastName" autoComplete="family-name" maxLength={100} value={form.lastName} onChange={updateField} required />
            </label>
          </div>
          <label className="field-label">
            Middle name <span className="optional-label">Optional</span>
            <input className="text-input" name="middleName" autoComplete="additional-name" maxLength={100} value={form.middleName} onChange={updateField} />
          </label>
          <div className="user-name-grid">
            <label className="field-label">
              Date of birth <span className="optional-label">Optional</span>
              <input className="text-input" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={updateField} />
            </label>
            <label className="field-label">
              Gender <span className="optional-label">Optional</span>
              <select className="text-input" name="gender" value={form.gender} onChange={updateField}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
          </div>
          </>}
          {!editing && step === 1 && <div className="user-name-grid student-enrollment-fields">
            <label className="field-label">Academic term
              <select className="text-input" value={termId} onChange={(event) => setTermId(event.target.value)} required disabled={optionsLoading || busy}>
                <option value="">{optionsLoading ? 'Loading terms…' : 'Select a term'}</option>
                {terms.map((term) => <option key={term.id} value={term.id}>{term.academicYear?.name || 'Academic year'} · {term.sequence}. {term.name}</option>)}
              </select>
            </label>
            <label className="field-label">Class level
              <select className="text-input" value={classLevelId} onChange={(event) => setClassLevelId(event.target.value)} required disabled={optionsLoading || busy}>
                <option value="">{optionsLoading ? 'Loading class levels…' : 'Select a class level'}</option>
                {classLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
            </label>
          </div>}
          {(editing || step === 2) && <section className="student-parent-registration">
            <div className="student-parent-heading">
              <div>
                <strong>Parent or guardian details</strong>
                <span>{editing ? 'Add or update contacts here. Shared parent records apply to every linked sibling.' : 'Use the same email when registering siblings to link them to one parent record.'}</span>
              </div>
              <button className="text-button" type="button" onClick={() => setParents((current) => [...current, { ...blankParent }])} disabled={busy || parentsLoading || parents.length >= 5}>Add another</button>
            </div>
            {parentsLoading ? <p className="field-hint">Loading parent or guardian contacts…</p> : parents.length === 0 ? (
              <p className="field-hint">No parent or guardian is linked yet. Add one to record their contact details.</p>
            ) : parents.map((parent, index) => <div className="student-parent-fields" key={parent.parentId || index}>
              <label className="field-label">First name<input className="text-input" value={parent.firstName} onChange={(event) => updateParent(index, 'firstName', event.target.value)} required maxLength={80} disabled={busy || parentsLoading} /></label>
              <label className="field-label">Last name<input className="text-input" value={parent.lastName} onChange={(event) => updateParent(index, 'lastName', event.target.value)} required maxLength={80} disabled={busy || parentsLoading} /></label>
              <label className="field-label">Phone <span className="optional-label">Optional if email is provided</span><input className="text-input" type="tel" value={parent.phone} onChange={(event) => updateParent(index, 'phone', event.target.value)} required={!parent.email.trim()} maxLength={30} disabled={busy || parentsLoading} /></label>
              <label className="field-label">Email <span className="optional-label">Optional if phone is provided</span><input className="text-input" type="email" value={parent.email} onChange={(event) => updateParent(index, 'email', event.target.value)} required={!parent.phone.trim()} maxLength={254} disabled={busy || parentsLoading} /></label>
              <label className="field-label">Relationship <span className="optional-label">Optional</span><input className="text-input" value={parent.relationship} onChange={(event) => updateParent(index, 'relationship', event.target.value)} placeholder="Parent, guardian…" maxLength={40} disabled={busy || parentsLoading} /></label>
              <button className="text-button student-parent-remove" type="button" onClick={() => setParents((current) => current.filter((_, parentIndex) => parentIndex !== index))} disabled={busy || parentsLoading}>Remove</button>
            </div>)}
          </section>}
          {!editing && step === 2 && <p className="field-hint">The student, term enrollment, and parent contacts are saved together. Assign a home class group later from Enrollments; if any save fails, registration is rolled back.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            {editing ? <>
              <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="primary-button" type="submit" disabled={busy || parentsLoading || !parents.length || parents.some((parent) => !parent.firstName.trim() || !parent.lastName.trim() || (!parent.phone.trim() && !parent.email.trim()))}>
                {busy && <LoaderCircle size={16} className="animate-spin" />}
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </> : <>
              {step === 0
                ? <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Cancel</button>
                : <button className="secondary-button" type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} disabled={busy}>Back</button>}
              {step < 2 ? <button className="primary-button" type="button" onClick={advanceStep} disabled={busy || (step === 1 && (optionsLoading || !terms.length || !classLevels.length))}>Continue</button> : (
                <button className="primary-button" type="submit" disabled={busy || optionsLoading || parentsLoading || !terms.length || !classLevels.length || !parents.length || parents.some((parent) => !parent.firstName.trim() || !parent.lastName.trim() || (!parent.phone.trim() && !parent.email.trim()))}>
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  {busy ? 'Saving…' : 'Register and enroll'}
                </button>
              )}
            </>}
          </div>
        </form>
      </section>
    </div>
  );
}
