import { useEffect, useState } from 'react';
import { Award, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { createGradeScale, fetchGradeScales, updateGradeScale } from './academicYearApi.js';

const emptyBoundary = () => ({ grade: '', minScore: '', description: '' });

export default function GradeScalesPage({ signOut, onScaleCreated }) {
  const [scales, setScales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingScale, setEditingScale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [boundaries, setBoundaries] = useState([{ grade: '', minScore: '0', description: '' }, { grade: '', minScore: '', description: '' }]);
  const previewBands = boundaries
    .filter((item) => item.grade.trim() && item.minScore !== '' && Number(item.minScore) >= 0 && Number(item.minScore) <= maxScore)
    .map((item) => ({ ...item, score: Number(item.minScore) }))
    .sort((left, right) => right.score - left.score);

  async function loadScales() {
    setLoading(true);
    setError('');
    try {
      setScales(await fetchGradeScales());
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadScales(); }, []);

  function updateBoundary(index, field, value) {
    setBoundaries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function saveScale(event) {
    event.preventDefault();
    setError('');
    if (boundaries.some((item) => !item.grade.trim() || item.minScore === '')) {
      return setError('Enter a grade label and minimum score for every band.');
    }
    const normalized = boundaries.map((item) => ({
      grade: item.grade.trim(),
      minScore: Number(item.minScore),
      description: item.description.trim() || null
    }));
    if (!name.trim()) return setError('Enter a name for this grading scale.');
    if (normalized.length < 2) return setError('Add at least two grade bands.');
    if (normalized.some((item) => !item.grade || item.minScore < 0 || item.minScore > maxScore)) {
      return setError(`Enter a grade label and minimum score from 0 to ${maxScore} for every band.`);
    }
    if (!normalized.some((item) => item.minScore === 0)) return setError('At least one grade band must start at 0.');
    if (new Set(normalized.map((item) => item.grade)).size !== normalized.length) return setError('Grade labels must be unique.');
    if (new Set(normalized.map((item) => item.minScore)).size !== normalized.length) return setError('Minimum scores must be unique.');
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, maxScore, boundaries: normalized };
      const result = editingScale
        ? await updateGradeScale(editingScale.id, payload)
        : await createGradeScale(payload);
      setScales((current) => (editingScale
        ? current.map((scale) => scale.id === editingScale.id ? result.data : scale)
        : [...current, result.data]).sort((a, b) => a.name.localeCompare(b.name)));
      onScaleCreated?.();
      setName('');
      setDescription('');
      setMaxScore(100);
      setBoundaries([{ grade: '', minScore: '0', description: '' }, { grade: '', minScore: '', description: '' }]);
      setEditingScale(null);
      setCreating(false);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  function editScale(scale) {
    setError('');
    setEditingScale(scale);
    setName(scale.name);
    setDescription(scale.description || '');
    setMaxScore(scale.maxScore);
    setBoundaries(scale.boundaries.map((item) => ({
      grade: item.grade,
      minScore: String(Number(item.minScore)),
      description: item.description || ''
    })));
    setCreating(true);
  }

  function closeForm() {
    setCreating(false);
    setEditingScale(null);
    setError('');
  }

  return <>
    <div className="welcome-row students-welcome">
      <div>
        <p className="eyebrow">Academic calendar</p>
        <h1 className="page-title">Grading scales<span className="title-dot">.</span></h1>
        <p className="mt-2 text-sm text-muted">Choose whether results are scored out of 50 or as percentages, then assign the scale to an academic year.</p>
      </div>
      <button className="primary-button add-user-button" onClick={() => { if (creating) closeForm(); else { setEditingScale(null); setName(''); setDescription(''); setMaxScore(100); setBoundaries([{ grade: '', minScore: '0', description: '' }, { grade: '', minScore: '', description: '' }]); setError(''); setCreating(true); } }}><Plus size={17} /> {creating ? 'Close form' : 'Create grading scale'}</button>
    </div>

    {creating && <form className="panel grade-scale-page-form" onSubmit={saveScale}>
      <div className="grade-scale-form-heading"><div><p className="eyebrow">{editingScale ? 'Edit scale' : 'New scale'}</p><h2>{editingScale ? `Edit ${editingScale.name}` : 'Create a grading scale'}</h2><p>Choose the score range, then add a minimum score for each grade.</p></div><span className="grade-scale-form-step">{boundaries.length} grade bands</span></div>
      <div className="grade-scale-create-fields">
        <label className="field-label">Scale name<input className="text-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="e.g. Primary school grades" required /></label>
        <label className="field-label">Description <span className="optional-label">Optional</span><input className="text-input" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={250} placeholder="Who or what this scale applies to" /></label>
      </div>
      <fieldset className="grade-scale-format-picker">
        <legend>Score format</legend>
        <label className={maxScore === 50 ? 'grade-scale-format-option selected' : 'grade-scale-format-option'}>
          <input type="radio" name="maxScore" value="50" checked={maxScore === 50} onChange={() => setMaxScore(50)} />
          <span><strong>Primary</strong><small>Results scored out of 50</small></span>
          <b>/50</b>
        </label>
        <label className={maxScore === 100 ? 'grade-scale-format-option selected' : 'grade-scale-format-option'}>
          <input type="radio" name="maxScore" value="100" checked={maxScore === 100} onChange={() => setMaxScore(100)} />
          <span><strong>Secondary</strong><small>Results shown as percentages</small></span>
          <b>%</b>
        </label>
      </fieldset>
      <div className="grade-scale-band-heading"><div><h3>Grade bands</h3><p>Enter each grade’s minimum score. Include a band starting at 0.</p></div><span>0–{maxScore} {maxScore === 50 ? 'points' : 'percent'}</span></div>
      <div className="grade-scale-boundaries">
        <div className="grade-scale-boundary-header"><span>Grade</span><span>Minimum score</span><span>Description</span><span /></div>
        {boundaries.map((boundary, index) => <div className="grade-scale-boundary-row" key={index}>
          <label className="field-label"><span className="sr-only">Grade band {index + 1} label</span><input className="text-input" value={boundary.grade} onChange={(event) => updateBoundary(index, 'grade', event.target.value)} maxLength={12} placeholder="e.g. A" required /></label>
          <label className="field-label"><span className="sr-only">Grade band {index + 1} minimum score</span><input className="text-input" type="number" min="0" max={maxScore} step="0.01" value={boundary.minScore} onChange={(event) => updateBoundary(index, 'minScore', event.target.value)} placeholder="0" required /></label>
          <label className="field-label"><span className="sr-only">Grade band {index + 1} description (optional)</span><input className="text-input" value={boundary.description} onChange={(event) => updateBoundary(index, 'description', event.target.value)} maxLength={120} placeholder="Optional" /></label>
          <button className="icon-button grade-scale-remove" type="button" onClick={() => setBoundaries((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={boundaries.length <= 2} aria-label={`Remove grade band ${index + 1}`}><Trash2 size={15} /></button>
        </div>)}
      </div>
      <div className="grade-scale-preview">
        <div><strong>Live preview</strong><span>Higher minimum scores take priority.</span></div>
        {previewBands.length ? <div className="grade-scale-preview-bands">{previewBands.map((band, index) => {
          const upper = index === 0 ? `${maxScore}` : `below ${band.score === maxScore ? maxScore : previewBands[index - 1].score}`;
          const range = index === 0 ? `${band.score}–${upper}` : `${band.score}–${upper}`;
          return <span className="grade-scale-preview-band" key={`${band.grade}-${band.score}`}><b>{band.grade}</b><small>{range} {maxScore === 50 ? 'pts' : '%'}</small></span>;
        })}</div> : <p>Add grade labels and minimum scores to preview the scale.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="secondary-button" type="button" onClick={() => setBoundaries((current) => [...current, emptyBoundary()])} disabled={boundaries.length >= 20}><Plus size={14} /> Add grade band</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingScale ? 'Save changes' : 'Save grading scale'}</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>}

    <section className="panel directory-panel">
      <div className="panel-heading"><div><h2>Saved grading scales</h2><p>{scales.length} {scales.length === 1 ? 'scale' : 'scales'} available for academic years</p></div></div>
      {error && !creating ? <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={loadScales}>Try again</button></div> : loading ? <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading grading scales…</span></div> : scales.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><Award size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No grading scales yet</p><p className="mt-1 text-xs text-muted">Create a scale before calculating term results.</p></div> : <div className="overflow-x-auto"><table className="people-table"><thead><tr><th>Scale</th><th>Description</th><th>Maximum score</th><th>Grade bands</th><th>Grade boundaries</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{scales.map((scale) => <tr key={scale.id}><td className="font-medium text-ink">{scale.name}</td><td className="text-muted">{scale.description || '-'}</td><td className="text-muted">{scale.maxScore === 50 ? '50 points' : '100%'}</td><td className="text-muted">{scale.boundaries.length}</td><td><div className="grade-scale-chips">{scale.boundaries.map((item) => <span className="grade-scale-chip" key={item.id || `${item.grade}-${item.minScore}`}>{item.grade} ≥ {Number(item.minScore)}{scale.maxScore === 50 ? '' : '%'}</span>)}</div></td><td><button className="table-action" type="button" onClick={() => editScale(scale)}><Pencil size={14} /> Edit</button></td></tr>)}</tbody></table></div>}
      <p className="px-5 pb-4 text-xs text-muted">To use a scale, open Academic years, edit the relevant year, and select it under Grade scale.</p>
    </section>
  </>;
}
