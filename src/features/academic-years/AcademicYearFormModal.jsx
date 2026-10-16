import { useEffect, useState } from 'react';
import { LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { createGradeScale, fetchGradeScales, saveAcademicYear } from './academicYearApi.js';

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

export default function AcademicYearFormModal({ year, signOut, onClose, onSaved }) {
  const editing = Boolean(year);
  const [form, setForm] = useState({
    name: year?.name || '',
    startDate: dateInputValue(year?.startDate),
    endDate: dateInputValue(year?.endDate),
    isCurrent: Boolean(year?.isCurrent),
    gradeScaleId: year?.gradeScaleId || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [gradeScales, setGradeScales] = useState([]);
  const [loadingGradeScales, setLoadingGradeScales] = useState(true);
  const [showScaleEditor, setShowScaleEditor] = useState(false);
  const [scaleName, setScaleName] = useState('');
  const [scaleDescription, setScaleDescription] = useState('');
  const [scaleMaxScore, setScaleMaxScore] = useState(100);
  const [boundaries, setBoundaries] = useState([{ grade: '', minScore: '0', description: '' }, { grade: '', minScore: '', description: '' }]);
  const [scaleError, setScaleError] = useState('');
  const [savingScale, setSavingScale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGradeScales()
      .then((scales) => { if (!cancelled) setGradeScales(scales); })
      .catch((cause) => {
        if (!cancelled) setScaleError(cause.message);
        if (cause.status === 401) signOut();
      })
      .finally(() => { if (!cancelled) setLoadingGradeScales(false); });
    return () => { cancelled = true; };
  }, [signOut]);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.startDate >= form.endDate) {
      setError('The end date must be after the start date.');
      return;
    }

    setSaving(true);
    try {
      const result = await saveAcademicYear(year?.id, {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent,
        gradeScaleId: form.gradeScaleId || null
      });
      onSaved(result.data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  function updateBoundary(index, field, value) {
    setBoundaries((current) => current.map((boundary, itemIndex) => itemIndex === index
      ? { ...boundary, [field]: value }
      : boundary));
  }

  async function saveScale() {
    setScaleError('');
    if (boundaries.some((boundary) => !boundary.grade.trim() || boundary.minScore === '')) {
      return setScaleError('Enter a grade label and minimum score for every row.');
    }
    const normalized = boundaries.map((boundary) => ({
      grade: boundary.grade.trim(),
      minScore: Number(boundary.minScore),
      description: boundary.description.trim() || null
    }));
    if (!scaleName.trim()) return setScaleError('Enter a name for this grade scale.');
    if (normalized.some((boundary) => !boundary.grade || boundary.minScore < 0 || boundary.minScore > scaleMaxScore)) {
      return setScaleError(`Enter a grade label and a minimum score from 0 to ${scaleMaxScore} for every row.`);
    }
    if (!normalized.some((boundary) => boundary.minScore === 0)) {
      return setScaleError('At least one boundary must start at 0 so every mark can receive a grade.');
    }
    if (new Set(normalized.map((boundary) => boundary.grade)).size !== normalized.length) {
      return setScaleError('Grade labels must be unique.');
    }
    if (new Set(normalized.map((boundary) => boundary.minScore)).size !== normalized.length) {
      return setScaleError('Minimum scores must be unique.');
    }
    setSavingScale(true);
    try {
      const result = await createGradeScale({
        name: scaleName.trim(),
        description: scaleDescription.trim() || null,
        maxScore: scaleMaxScore,
        boundaries: normalized
      });
      setGradeScales((current) => [...current, result.data].sort((left, right) => left.name.localeCompare(right.name)));
      setForm((current) => ({ ...current, gradeScaleId: result.data.id }));
      setShowScaleEditor(false);
      setScaleName('');
      setScaleDescription('');
      setScaleMaxScore(100);
      setBoundaries([{ grade: '', minScore: '0', description: '' }, { grade: '', minScore: '', description: '' }]);
    } catch (cause) {
      setScaleError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSavingScale(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="academic-year-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editing ? 'Academic calendar' : 'New academic calendar'}</p>
            <h2 id="academic-year-form-title">{editing ? 'Edit academic year' : 'Add an academic year'}</h2>
            <p>{editing ? 'Update the year, current-year selection, or grading scale.' : 'Set the school-year dates, grading scale, and current-year selection.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={submit}>
          <label className="field-label">
            Academic year name
            <input className="text-input" name="name" maxLength={50} value={form.name} onChange={updateField} placeholder="e.g. 2026–2027" required />
          </label>
        <div className="field-label">
          <span>Grade scale</span>
          <select className="text-input mt-2" value={form.gradeScaleId} onChange={(event) => setForm((current) => ({ ...current, gradeScaleId: event.target.value }))} disabled={loadingGradeScales || saving}>
            <option value="">{loadingGradeScales ? 'Loading grade scales…' : 'Select a grade scale'}</option>
            {gradeScales.map((scale) => <option key={scale.id} value={scale.id}>{scale.name} · {scale.maxScore === 50 ? '/ 50' : '%'} · {scale.boundaries?.length || 0} grade bands</option>)}
          </select>
          <span className="field-hint">Required to calculate term results. The scale is reused by academic years when selected.</span>
          <button className="text-button mt-2" type="button" onClick={() => { setShowScaleEditor((current) => !current); setScaleError(''); }} disabled={saving}>Create a grade scale</button>
        </div>
        {showScaleEditor && <section className="grade-scale-editor">
          <h3>Create a grade scale</h3>
          <p>Enter your school’s grade labels and minimum scores. Add a 0 boundary.</p>
          <label className="field-label">Scale name
            <input className="text-input" value={scaleName} onChange={(event) => setScaleName(event.target.value)} maxLength={60} placeholder="e.g. Secondary grades" />
          </label>
          <label className="field-label">Description <span className="optional-label">Optional</span>
            <input className="text-input" value={scaleDescription} onChange={(event) => setScaleDescription(event.target.value)} maxLength={250} />
          </label>
          <label className="field-label">Maximum score
            <select className="text-input" value={scaleMaxScore} onChange={(event) => setScaleMaxScore(Number(event.target.value))}><option value="50">50 points (primary)</option><option value="100">100 points / percentage (secondary)</option></select>
          </label>
          <div className="grade-scale-boundaries">
            {boundaries.map((boundary, index) => <div className="grade-scale-boundary-row" key={index}>
              <label className="field-label">Grade
                <input className="text-input" value={boundary.grade} onChange={(event) => updateBoundary(index, 'grade', event.target.value)} maxLength={12} placeholder="A" />
              </label>
              <label className="field-label">Minimum score
                <input className="text-input" type="number" min="0" max={scaleMaxScore} step="0.01" value={boundary.minScore} onChange={(event) => updateBoundary(index, 'minScore', event.target.value)} />
              </label>
              <label className="field-label">Description <span className="optional-label">Optional</span>
                <input className="text-input" value={boundary.description} onChange={(event) => updateBoundary(index, 'description', event.target.value)} maxLength={120} />
              </label>
              <button className="icon-button grade-scale-remove" type="button" onClick={() => setBoundaries((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={boundaries.length <= 1} aria-label={`Remove grade boundary ${index + 1}`}><Trash2 size={15} /></button>
            </div>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" type="button" onClick={() => setBoundaries((current) => [...current, { grade: '', minScore: '', description: '' }])} disabled={boundaries.length >= 20}><Plus size={14} /> Add grade band</button>
            <button className="primary-button" type="button" onClick={saveScale} disabled={savingScale}>{savingScale ? 'Saving scale…' : 'Save grade scale'}</button>
          </div>
          {scaleError && <p className="form-error" role="alert">{scaleError}</p>}
        </section>}
          <div className="user-name-grid">
            <label className="field-label">
              Start date
              <input className="text-input" type="date" name="startDate" value={form.startDate} onChange={updateField} required />
            </label>
            <label className="field-label">
              End date
              <input className="text-input" type="date" name="endDate" value={form.endDate} onChange={updateField} required />
            </label>
          </div>
          <label className="academic-year-current">
            <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={updateField} />
            <span>
              <strong>Set as current academic year</strong>
              <small>Making this current will unset the previously current year.</small>
            </span>
          </label>
          {editing && year.terms?.some((term) => ['FINALIZED', 'PUBLISHED', 'CLOSED'].includes(term.status)) && (
            <p className="form-hint">Dates are locked while this year contains a finalized, published, or closed term.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add academic year'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
