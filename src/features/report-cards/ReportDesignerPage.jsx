import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, LoaderCircle, Plus, Save, X } from 'lucide-react';
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
  endOfTerm: { title: 'End-of-Term Report Card', headingColor: '#285d3e', titleColor: '#285d3e', titleFontSize: 17, titleBold: true, titleAlignment: 'center', headerLineColor: '#216b49', showLogo: true, showContact: true, showSummary: true, showGradeDescription: true, showTeacherComments: true, showSignatures: true, footerText: 'Coursework contributes 20%, the mid-term exam 30%, and the final exam 50%.', sections: initialSections, headerSections: ['studentDetails', 'classYear', 'termDates'] },
  midTerm: { title: 'Mid-Term Report Card', headingColor: '#285d3e', titleColor: '#285d3e', titleFontSize: 17, titleBold: true, titleAlignment: 'center', headerLineColor: '#216b49', showLogo: true, showContact: true, showSummary: true, showGradeDescription: true, showSignatures: true, footerText: 'Coursework contributes 40% and the mid-term exam 60%; absences count as zero.', sections: initialSections, headerSections: ['studentDetails', 'classYear', 'termDates'] },
};

function normaliseDesign(reportDesign) {
  return Object.fromEntries(Object.keys(defaults).map((key) => {
    const value = { ...defaults[key], ...(reportDesign?.[key] || {}) };
    value.headingColor = /^#[\da-f]{6}$/i.test(value.headingColor) ? value.headingColor : defaults[key].headingColor;
    value.titleColor = /^#[\da-f]{6}$/i.test(reportDesign?.[key]?.titleColor) ? reportDesign[key].titleColor : value.headingColor;
    value.titleFontSize = Number.isInteger(value.titleFontSize) && value.titleFontSize >= 12 && value.titleFontSize <= 36
      ? value.titleFontSize
      : defaults[key].titleFontSize;
    value.titleAlignment = ['left', 'center', 'right'].includes(value.titleAlignment) ? value.titleAlignment : defaults[key].titleAlignment;
    value.headerLineColor = /^#[\da-f]{6}$/i.test(value.headerLineColor) ? value.headerLineColor : defaults[key].headerLineColor;
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
  return <article className="report-design-preview-paper" style={{ '--report-heading-color': design.headingColor, '--report-header-line-color': design.headerLineColor }}>
    <header><div className="report-design-preview-logo-slot">{design.showLogo && (school?.logoDataUrl ? <img className="report-design-preview-logo-image" src={school.logoDataUrl} alt="School logo" /> : <div className="report-design-preview-logo">{(school?.name || 'S').slice(0, 1)}</div>)}</div><div className="report-design-preview-identity"><strong>{school?.name || 'Your school name'}</strong>{design.showContact && <p>{[school?.address, ...(!design.headerSections.includes('schoolContact') ? [school?.phone, school?.email] : [])].filter(Boolean).join(' · ') || 'School address'}</p>}<h2 style={{ color: design.titleColor, fontSize: `${design.titleFontSize}px`, fontWeight: design.titleBold ? 700 : 400, textAlign: design.titleAlignment }}>{design.title || 'Report title'}</h2></div><div className="report-design-preview-logo-slot report-design-preview-logo-slot-right">{design.showLogo && (school?.secondaryLogoDataUrl ? <img className="report-design-preview-logo-image" src={school.secondaryLogoDataUrl} alt="Additional school logo" /> : <span>Other logo</span>)}</div></header>
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
    <div className="welcome-row students-welcome"><div><p className="eyebrow">School setup</p><h1 className="page-title">Report designer<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Name your report, choose what it includes, then review the live preview.</p></div><div className="report-designer-save-area"><span className={`report-save-status ${dirty ? 'report-save-status-dirty' : ''}`} role="status">{saving ? 'Saving changes…' : dirty ? 'Unsaved changes' : 'All changes saved'}</span><button type="button" className="primary-button" disabled={!dirty || saving} onClick={save}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? 'Saving…' : 'Save design'}</button></div></div>
    {error && <div className="notice-error mb-4" role="alert">{error}</div>}{notice && <div className="notice-success mb-4" role="status">{notice}</div>}
    <div className="report-designer-tabs" role="group" aria-label="Report type"><button type="button" aria-pressed={type === 'endOfTerm'} className={type === 'endOfTerm' ? 'active' : ''} onClick={() => setType('endOfTerm')}>End-of-term</button><button type="button" aria-pressed={type === 'midTerm'} className={type === 'midTerm' ? 'active' : ''} onClick={() => setType('midTerm')}>Mid-term</button></div>
    <div className="report-designer-grid">
      <section className="panel report-designer-controls">
        <section className="report-designer-step">
          <div className="report-designer-step-heading"><span>1</span><div><h2>Report name</h2><p>Choose the title readers will see on this report.</p></div></div>
          <label className="form-field report-custom-title-field"><span>Custom report title</span><input value={current.title} maxLength={100} onChange={(event) => update('title', event.target.value)} /><small>{current.title.length}/100 characters</small></label>
        </section>
        <section className="report-designer-step">
          <div className="report-designer-step-heading"><span>2</span><div><h2>Appearance</h2><p>Set colors and title formatting.</p></div></div>
          <div className="report-title-style-fields">
            <label className="form-field report-heading-color-field"><span>Title color</span><input type="color" value={current.titleColor} onChange={(event) => update('titleColor', event.target.value)} /></label>
            <label className="form-field"><span>Title size</span><select value={current.titleFontSize} onChange={(event) => update('titleFontSize', Number(event.target.value))}>{[12, 14, 16, 17, 18, 20, 22, 24, 28, 32, 36].map((size) => <option key={size} value={size}>{size}px</option>)}</select></label>
            <label className="report-design-option"><input type="checkbox" checked={current.titleBold} onChange={(event) => update('titleBold', event.target.checked)} /><span>Bold title</span></label>
            <label className="form-field"><span>Title alignment</span><select value={current.titleAlignment} onChange={(event) => update('titleAlignment', event.target.value)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
            <label className="form-field report-heading-color-field"><span>Section heading color</span><input type="color" value={current.headingColor} onChange={(event) => update('headingColor', event.target.value)} /></label>
            <label className="form-field report-heading-color-field"><span>Header line color</span><input type="color" value={current.headerLineColor} onChange={(event) => update('headerLineColor', event.target.value)} /></label>
          </div>
          <div className="report-designer-options"><h3>Show on report</h3>{[['showLogo', 'School logos'], ['showContact', 'School contact details'], ['showGradeDescription', 'Grade descriptions'], ...(type === 'endOfTerm' ? [['showTeacherComments', 'Teacher comments']] : [])].map(([key, label]) => <label className="report-design-option" key={key}><input type="checkbox" checked={current[key]} onChange={(event) => update(key, event.target.checked)} /><span>{label}</span></label>)}</div>
          <label className="form-field"><span>Footer note</span><textarea rows={3} maxLength={500} value={current.footerText} onChange={(event) => update('footerText', event.target.value)} /><small>{current.footerText.length}/500 characters</small></label>
        </section>
        <section className="report-designer-step">
          <div className="report-designer-step-heading"><span>3</span><div><h2>Header information</h2><p>Select what appears in each of the three header blocks.</p></div></div>
          <div className="report-header-slots">{current.headerSections.map((id, index) => <label className="report-header-select" key={`header-${index}`}><span>Header block {index + 1}</span><select aria-label={`Header block ${index + 1}`} value={id} onChange={(event) => setHeaderSection(index, event.target.value)}>{headerFields.map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}</select></label>)}</div>
        </section>
        <section className="report-designer-step">
          <div className="report-designer-step-heading"><span>4</span><div><h2>Report sections</h2><p>Add content, then adjust the order using the arrows.</p></div><span className="report-section-count">{current.sections.length} selected</span></div>
          <h3 className="report-layout-subheading">Included sections</h3>
          <ol className="report-layout-canvas">{current.sections.map((id, index) => { const item = sections.find((section) => section.id === id); return <li className="report-layout-block" key={id}><span className="report-layout-number">{index + 1}</span><span className="report-layout-name"><b>{item.label}</b><small>{item.description}</small></span><button type="button" title="Move up" aria-label={`Move ${item.label} up`} disabled={index === 0} onClick={() => moveSection(index, index - 1)}><ArrowUp size={15} /></button><button type="button" title="Move down" aria-label={`Move ${item.label} down`} disabled={index === current.sections.length - 1} onClick={() => moveSection(index, index + 1)}><ArrowDown size={15} /></button><button type="button" title="Remove" aria-label={`Remove ${item.label}`} onClick={() => update('sections', current.sections.filter((sectionId) => sectionId !== id))}><X size={15} /></button></li>; })}</ol>
          {current.sections.length === 0 && <p className="report-elements-empty">No sections selected. Add a section below to build your report.</p>}
          <h3 className="report-layout-subheading">Available sections</h3>
          <div className="report-section-palette">{sections.filter(({ id }) => !current.sections.includes(id)).map((item) => <div className="report-section-chip" key={item.id}><span><b>{item.label}</b><small>{item.description}</small></span><button type="button" className="report-section-add" onClick={() => addSection(item.id)} aria-label={`Add ${item.label}`}><Plus size={16} /><span>Add</span></button></div>)}</div>
          {current.sections.length === sections.length && <p className="report-elements-empty">All available sections are included.</p>}
        </section>
      </section>
      <section className="panel report-design-preview report-designer-preview-panel"><div className="report-live-preview-heading"><div><p className="eyebrow">Live preview</p><small>Updates as you edit · {type === 'endOfTerm' ? 'End-of-term' : 'Mid-term'}</small></div><span>Print layout</span></div><Preview design={current} type={type} school={school} /></section>
    </div>
  </div>;
}
