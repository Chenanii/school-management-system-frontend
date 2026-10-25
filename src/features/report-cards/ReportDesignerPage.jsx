import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, LoaderCircle, Plus, Save, Settings2, X } from 'lucide-react';
import { apiRequest } from '../../api.js';

const sections = [
  { id: 'academicPerformance', label: 'Academic performance', description: 'Subject results and teacher comments' },
  { id: 'behaviorDiscipline', label: 'Behaviour & discipline', description: 'Conduct, responsibility, participation' },
  { id: 'coCurricular', label: 'Co-curricular activities', description: 'Sports, arts, clubs and participation' },
  { id: 'promotionRemarks', label: 'Promotion remarks', description: 'Promotion decision and teacher remarks' },
  { id: 'gradingKey', label: 'Grading key', description: 'School grade bands and descriptions' },
  { id: 'summary', label: 'Results summary', description: 'Average and report completion' },
  { id: 'signatures', label: 'Signatures', description: 'Teacher and headteacher sign-off' },
];
const headerFields = [
  { id: 'studentDetails', label: 'Student name & admission number', sample: 'Student details' },
  { id: 'classYear', label: 'Class & academic year', sample: 'Class and academic year' },
  { id: 'termDates', label: 'Term & next-term opening', sample: 'Term and next-term date' },
  { id: 'schoolContact', label: 'School contact details', sample: 'Address, phone and email' },
];
const initialSections = sections.map(({ id }) => id);
const defaults = {
  endOfTerm: { title: 'End-of-Term Report Card', showLogo: true, showContact: true, showSummary: true, showGradeDescription: true, showTeacherComments: true, showSignatures: true, footerText: 'Coursework contributes 20%, the mid-term exam 30%, and the final exam 50%.', sections: initialSections, headerSections: ['studentDetails', 'classYear', 'termDates'] },
  midTerm: { title: 'Mid-Term Report Card', showLogo: true, showContact: true, showSummary: true, showGradeDescription: true, showSignatures: true, footerText: 'Coursework contributes 40% and the mid-term exam 60%; absences count as zero.', sections: initialSections, headerSections: ['studentDetails', 'classYear', 'termDates'] },
};

function normaliseDesign(reportDesign) {
  return Object.fromEntries(Object.keys(defaults).map((key) => {
    const value = { ...defaults[key], ...(reportDesign?.[key] || {}) };
    value.sections = Array.isArray(reportDesign?.[key]?.sections)
      ? reportDesign[key].sections.filter((id) => sections.some((item) => item.id === id))
      : [...initialSections];
    value.headerSections = Array.isArray(reportDesign?.[key]?.headerSections)
      && reportDesign[key].headerSections.length === 3
      && new Set(reportDesign[key].headerSections).size === 3
      && reportDesign[key].headerSections.every((id) => headerFields.some((field) => field.id === id))
      ? [...reportDesign[key].headerSections]
      : [...defaults[key].headerSections];
    return [key, value];
  }));
}

function Preview({ design, type, school }) {
  return <article className="report-design-preview-paper">
    <header><div className="report-design-preview-logo-slot">{design.showLogo && (school?.logoDataUrl ? <img className="report-design-preview-logo-image" src={school.logoDataUrl} alt="School logo" /> : <div className="report-design-preview-logo">{(school?.name || 'S').slice(0, 1)}</div>)}</div><div className="report-design-preview-identity"><strong>{school?.name || 'Your school name'}</strong>{design.showContact && <p>{[school?.address, ...(!design.headerSections.includes('schoolContact') ? [school?.phone, school?.email] : [])].filter(Boolean).join(' · ') || 'School address'}</p>}<h2>{design.title || 'Report title'}</h2></div><div className="report-design-preview-logo-slot report-design-preview-logo-slot-right">{design.showLogo && (school?.secondaryLogoDataUrl ? <img className="report-design-preview-logo-image" src={school.secondaryLogoDataUrl} alt="Additional school logo" /> : <span>Other logo</span>)}</div></header>
    <div className="report-design-preview-header-sections">{design.headerSections.map((id) => <div className="report-design-preview-header-cell" key={id}><span>{headerFields.find((field) => field.id === id)?.sample}</span><b>{id === 'studentDetails' ? 'Happy Bandah · 000123' : id === 'classYear' ? 'Grade 2 South · 2025/2026' : id === 'termDates' ? 'Term Three · Opens 1 September' : 'School address · Phone · Email'}</b></div>)}</div>
    {design.sections.map((id) => <section className="report-design-preview-section" key={id}><h3>{sections.find((item) => item.id === id)?.label}</h3>
      {id === 'studentDetails' && <div className="report-design-preview-student"><b>Student name</b><b>Admission number</b><b>Class</b></div>}
      {id === 'academicPerformance' && <table><thead><tr><th>Subject</th><th>Mark</th><th>Grade</th>{design.showGradeDescription && <th>Grade description</th>}{type === 'endOfTerm' && design.showTeacherComments && <th>Comment</th>}</tr></thead><tbody><tr><td>Mathematics</td><td>78</td><td>A</td>{design.showGradeDescription && <td>Excellent</td>}{type === 'endOfTerm' && design.showTeacherComments && <td>Good work</td>}</tr><tr><td>English</td><td>66</td><td>B</td>{design.showGradeDescription && <td>Very good</td>}{type === 'endOfTerm' && design.showTeacherComments && <td>Keep it up</td>}</tr></tbody></table>}
      {id === 'behaviorDiscipline' && <table><tbody>{['Classroom conduct', 'Respect & responsibility', 'Participation'].map((label) => <tr key={label}><td>{label}</td><td>Teacher comment</td></tr>)}</tbody></table>}
      {id === 'coCurricular' && <table><tbody>{['Sports', 'Arts', 'Clubs'].map((label) => <tr key={label}><td>{label}</td><td>Participation / comment</td></tr>)}</tbody></table>}
      {id === 'promotionRemarks' && <p className="report-design-preview-writing">Promotion decision and remarks</p>}
      {id === 'gradingKey' && <div className="report-design-preview-grade-key">A* Outstanding　 A High　 B Good　 C Aspiring　 D Basic　 U Unclassified</div>}
      {id === 'summary' && <div className="report-design-preview-summary"><span>Average mark <b>72%</b></span><span>Report status <b>Complete</b></span></div>}
      {id === 'signatures' && <div className="report-design-preview-signatures"><span>Teacher</span><span>Headteacher</span><span>Date issued</span></div>}
    </section>)}
    <footer>{design.footerText || 'Footer note'} · {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</footer>
  </article>;
}

export default function ReportDesignerPage({ signOut }) {
  const [saved, setSaved] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [type, setType] = useState('endOfTerm');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [school, setSchool] = useState(null);
  const [draggingSection, setDraggingSection] = useState('');
  const [activeHeaderSlot, setActiveHeaderSlot] = useState(0);
  useEffect(() => {
    apiRequest('/schools/current').then(({ data }) => {
      setSchool(data);
      const value = normaliseDesign(data.reportDesign);
      setSaved(value); setDraft(value);
    }).catch((cause) => { setError(cause.message); if (cause.status === 401) signOut(); }).finally(() => setLoading(false));
  }, [signOut]);
  const current = draft[type];
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  function update(key, value) {
    setDraft((state) => ({ ...state, [type]: { ...state[type], [key]: value,
      ...(key === 'sections' ? { showSummary: value.includes('summary'), showSignatures: value.includes('signatures') } : {}),
    } }));
    setNotice('');
  }
  function moveSection(from, to) {
    if (to < 0 || to >= current.sections.length) return;
    const reordered = [...current.sections];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    update('sections', reordered);
  }
  function addSection(id) {
    if (!sections.some((item) => item.id === id) || current.sections.includes(id)) return;
    update('sections', [...current.sections, id]);
  }
  function setHeaderSection(index, id) {
    if (!headerFields.some((field) => field.id === id)) return;
    const next = [...current.headerSections];
    const existingIndex = next.indexOf(id);
    const replaced = next[index];
    next[index] = id;
    if (existingIndex !== -1 && existingIndex !== index) next[existingIndex] = replaced;
    update('headerSections', next);
  }
  function dropHeaderSection(event, index) {
    event.preventDefault(); event.stopPropagation();
    const fieldId = event.dataTransfer.getData('text/report-header-field');
    if (fieldId) setHeaderSection(index, fieldId);
  }
  function dropSection(event, targetIndex = current.sections.length) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/report-section');
    const fromIndex = current.sections.indexOf(draggedId);
    if (fromIndex < 0) {
      if (sections.some((item) => item.id === draggedId) && !current.sections.includes(draggedId)) {
        const next = [...current.sections]; next.splice(targetIndex, 0, draggedId); update('sections', next);
      }
      setDraggingSection('');
      return;
    }
    const next = [...current.sections];
    const [item] = next.splice(fromIndex, 1);
    const insertAt = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(Math.max(0, insertAt), 0, item);
    update('sections', next);
    setDraggingSection('');
  }
  async function save() {
    setSaving(true); setError(''); setNotice('');
    try {
      const { data } = await apiRequest('/schools/current', { method: 'PATCH', body: JSON.stringify({ reportDesign: draft }) });
      const value = normaliseDesign(data.reportDesign);
      setSaved(value); setDraft(value); setNotice('Report design saved. It will appear on generated reports.');
    } catch (cause) { setError(cause.message); if (cause.status === 401) signOut(); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="table-message"><LoaderCircle className="animate-spin" /> Loading report design…</div>;
  return <div className="report-designer-page">
    <div className="welcome-row students-welcome"><div><p className="eyebrow">School setup</p><h1 className="page-title">Report designer<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Choose elements, arrange the layout, and preview your report.</p></div><div className="report-designer-save-area">{dirty && <span className="report-dirty-indicator">Unsaved changes</span>}<button type="button" className="primary-button" disabled={!dirty || saving} onClick={save}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? 'Saving…' : 'Save design'}</button></div></div>
    {error && <div className="notice-error mb-4" role="alert">{error}</div>}{notice && <div className="notice-success mb-4" role="status">{notice}</div>}
    <div className="report-designer-tabs" role="group" aria-label="Report type"><button type="button" aria-pressed={type === 'endOfTerm'} className={type === 'endOfTerm' ? 'active' : ''} onClick={() => setType('endOfTerm')}>End-of-term</button><button type="button" aria-pressed={type === 'midTerm'} className={type === 'midTerm' ? 'active' : ''} onClick={() => setType('midTerm')}>Mid-term</button></div>
    <div className="report-designer-grid">
      <section className="panel report-designer-controls">
        <div className="report-elements-heading"><div><h2>Header choices</h2><p>Choose a slot, then drag or click a field.</p></div><span>3 slots</span></div>
        <div className="report-header-palette">{headerFields.map((field) => <button type="button" className={`report-section-chip report-header-chip ${current.headerSections.includes(field.id) ? 'report-header-chip-selected' : ''}`} key={field.id} draggable onClick={() => setHeaderSection(activeHeaderSlot, field.id)} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/report-header-field', field.id); }} title={`Use ${field.label} in header section ${activeHeaderSlot + 1}`}><GripVertical size={15} /><span><b>{field.label}</b><small>{current.headerSections.includes(field.id) ? `Used in section ${current.headerSections.indexOf(field.id) + 1}` : 'Available'}</small></span><Plus size={15} /></button>)}</div>
        <div className="report-elements-heading report-body-elements-heading"><div><h2>Report sections</h2><p>Drag onto the layout or select to add.</p></div><span>{sections.length - current.sections.length} left</span></div>
        <div className="report-section-palette">{sections.filter(({ id }) => !current.sections.includes(id)).map((item) => <button type="button" className="report-section-chip" key={item.id} draggable onClick={() => addSection(item.id)} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/report-section', item.id); setDraggingSection(item.id); }} onDragEnd={() => setDraggingSection('')} title={`Add ${item.label}`}><GripVertical size={15} /><span><b>{item.label}</b><small>{item.description}</small></span><Plus size={15} /></button>)}</div>
        {current.sections.length === sections.length && <p className="report-elements-empty">All available elements are in the layout.</p>}
        <details className="report-settings-details"><summary><Settings2 size={16} /> Report settings</summary>
          <div className="report-settings-fields"><label className="form-field"><span>Report title</span><input value={current.title} maxLength={100} onChange={(event) => update('title', event.target.value)} /></label>
          <div className="report-designer-options"><h3>Show in report</h3>{[['showLogo', 'School logo'], ['showContact', 'School contact details'], ['showGradeDescription', 'Grade descriptions'], ...(type === 'endOfTerm' ? [['showTeacherComments', 'Teacher comments']] : [])].map(([key, label]) => <label className="report-design-option" key={key}><input type="checkbox" checked={current[key]} onChange={(event) => update(key, event.target.checked)} /><span>{label}</span></label>)}</div>
          <label className="form-field"><span>Footer note</span><textarea rows={3} maxLength={500} value={current.footerText} onChange={(event) => update('footerText', event.target.value)} /><small>{current.footerText.length}/500</small></label></div>
        </details>
      </section>
      <section className="panel report-designer-layout-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropSection(event)}>
        <div className="report-header-builder">
          <div className="report-layout-heading"><div><h2>Report header</h2><p>Choose three information blocks to show below the school name and report title.</p></div><span>3 sections</span></div>
          <div className="report-header-slots">{current.headerSections.map((id, index) => <button type="button" className={`report-header-slot ${activeHeaderSlot === index ? 'report-header-slot-active' : ''}`} key={`${id}-${index}`} onClick={() => setActiveHeaderSlot(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropHeaderSection(event, index)}><span>Header section {index + 1}</span><b>{headerFields.find((field) => field.id === id)?.label}</b><small>{activeHeaderSlot === index ? 'Selected · drag or click a choice on the left' : 'Click to select this section'}</small></button>)}</div>
        </div>
        <div className="report-layout-heading"><div><h2>Report body</h2><p>Reorder sections by dragging or using the arrow controls.</p></div><span>{current.sections.length} sections</span></div>
        <div className="report-layout-canvas">{current.sections.map((id, index) => { const item = sections.find((section) => section.id === id); return <div className={`report-layout-block ${draggingSection === id ? 'report-layout-block-dragging' : ''}`} key={id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/report-section', id); setDraggingSection(id); }} onDragEnd={() => setDraggingSection('')} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); dropSection(event, index); }}><span className="report-layout-number">{index + 1}</span><span className="report-layout-handle"><GripVertical size={16} /></span><span className="report-layout-name"><b>{item.label}</b><small>{item.description}</small></span><button type="button" title="Move up" aria-label={`Move ${item.label} up`} disabled={index === 0} onClick={() => moveSection(index, index - 1)}><ArrowUp size={15} /></button><button type="button" title="Move down" aria-label={`Move ${item.label} down`} disabled={index === current.sections.length - 1} onClick={() => moveSection(index, index + 1)}><ArrowDown size={15} /></button><button type="button" title="Remove" aria-label={`Remove ${item.label}`} onClick={() => update('sections', current.sections.filter((sectionId) => sectionId !== id))}><X size={15} /></button></div>; })}{current.sections.length === 0 && <div className="report-layout-empty"><Plus size={20} /><b>Start your report layout</b><span>Choose an element from the left or drag it here.</span></div>}<div className={`report-layout-drop-target ${draggingSection ? 'report-layout-drop-active' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropSection(event)}>{draggingSection ? 'Drop to add or move to the end' : 'Drop a section here'}</div></div>
      </section>
      <section className="panel report-design-preview report-designer-preview-panel"><div className="report-live-preview-heading"><p className="eyebrow">Live preview</p><span>Print layout</span></div><Preview design={current} type={type} school={school} /></section>
    </div>
  </div>;
}
