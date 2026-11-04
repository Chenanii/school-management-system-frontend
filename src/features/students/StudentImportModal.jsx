import { useEffect, useState } from 'react';
import { Download, LoaderCircle, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiRequest } from '../../api.js';
import { fetchAllPages } from '../enrollments/enrollmentApi.js';

const templateHeaders = [
  'firstName', 'middleName', 'lastName', 'address', 'dateOfBirth', 'gender', 'nationality',
  'parentFirstName', 'parentLastName', 'parentPhone', 'parentEmail', 'relationship'
];

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const headerAliases = {
  firstname: 'firstName', studentfirstname: 'firstName',
  middlename: 'middleName', studentmiddlename: 'middleName',
  lastname: 'lastName', studentlastname: 'lastName', surname: 'lastName',
  address: 'address', studentaddress: 'address',
  dateofbirth: 'dateOfBirth', dob: 'dateOfBirth',
  gender: 'gender', sex: 'gender', nationality: 'nationality',
  parentfirstname: 'parentFirstName', guardianfirstname: 'parentFirstName', parentguardianfirstname: 'parentFirstName',
  parentlastname: 'parentLastName', guardianlastname: 'parentLastName', parentguardianlastname: 'parentLastName',
  parentphone: 'parentPhone', guardianphone: 'parentPhone', parentguardianphone: 'parentPhone',
  parentemail: 'parentEmail', guardianemail: 'parentEmail', parentguardianemail: 'parentEmail',
  relationship: 'relationship', parentrelationship: 'relationship', guardianrelationship: 'relationship'
};

function excelDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parts = XLSX.SSF.parse_date_code(value);
    if (parts) return `${String(parts.y).padStart(4, '0')}-${String(parts.m).padStart(2, '0')}-${String(parts.d).padStart(2, '0')}`;
  }
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return text;
}

async function parseFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file smaller than 5 MB.');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error('The file does not contain a worksheet.');
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: true, blankrows: false });
  if (!rawRows.length) throw new Error('The first worksheet has no student rows.');
  if (rawRows.length > 250) throw new Error('Import up to 250 students at a time.');

  return rawRows.map((raw, index) => {
    const row = {};
    for (const [header, value] of Object.entries(raw)) {
      const key = headerAliases[normalizeHeader(header)];
      if (key) row[key] = value;
    }
    return {
      rowNumber: index + 2,
      student: {
        firstName: String(row.firstName ?? '').trim(),
        middleName: String(row.middleName ?? '').trim() || null,
        lastName: String(row.lastName ?? '').trim(),
        address: String(row.address ?? '').trim() || null,
        dateOfBirth: excelDate(row.dateOfBirth),
        gender: String(row.gender ?? '').trim() || null,
        nationality: String(row.nationality ?? '').trim() || null,
        parents: [row.parentFirstName, row.parentLastName, row.parentPhone, row.parentEmail, row.relationship].some((value) => String(value ?? '').trim()) ? [{
          firstName: String(row.parentFirstName ?? '').trim(),
          lastName: String(row.parentLastName ?? '').trim(),
          phone: String(row.parentPhone ?? '').trim(),
          email: String(row.parentEmail ?? '').trim(),
          relationship: String(row.relationship ?? '').trim() || undefined
        }] : []
      }
    };
  });
}

function downloadTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders, [
    'Amina', '', 'Banda', '', '2012-04-18', 'Female', 'Malawian',
    'Chisomo', 'Banda', '+265991234567', 'parent@example.com', 'Mother'
  ]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, 'student-import-template.xlsx');
}

export default function StudentImportModal({ onClose, onImported }) {
  const [terms, setTerms] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [termId, setTermId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAllPages('/terms'), fetchAllPages('/class-levels')])
      .then(([termRows, levels]) => {
        if (cancelled) return;
        setTerms(termRows);
        setClassLevels(levels);
        if (termRows.length === 1 && ['DRAFT', 'OPEN'].includes(termRows[0].status)) setTermId(termRows[0].id);
        if (levels.length === 1) setClassLevelId(levels[0].id);
      })
      .catch((cause) => { if (!cancelled) setError(cause.message); });
    return () => { cancelled = true; };
  }, []);

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setResults([]);
    setReviewing(false);
    setFinished(false);
    try {
      setRows(await parseFile(file));
      setFileName(file.name);
    } catch (cause) {
      setRows([]);
      setFileName('');
      setError(cause.message || 'The file could not be read.');
    } finally {
      event.target.value = '';
    }
  }

  async function importRows(event) {
    event.preventDefault();
    setError('');
    setResults([]);
    const rowProblems = rows.map(({ rowNumber, student }) => {
      if (!student.firstName || !student.lastName) return { rowNumber, message: 'Student first and last names are required.' };
      if (student.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(student.dateOfBirth)) return { rowNumber, message: 'Date of birth must be YYYY-MM-DD or DD/MM/YYYY.' };
      return null;
    });
    const invalidRows = rowProblems.filter(Boolean);
    if (!rows.length || !termId || !classLevelId) {
      setError('Choose a file, academic term, and class level before importing.');
      return;
    }
    if (invalidRows.length) {
      setResults(invalidRows);
      setError(`${invalidRows.length} row${invalidRows.length === 1 ? '' : 's'} need correction. Fix the file and select it again.`);
      return;
    }

    if (!reviewing) {
      setReviewing(true);
      return;
    }

    setBusy(true);
    const outcomes = [];
    try {
      for (let index = 0; index < rows.length; index += 1) {
        const item = rows[index];
        setProgress(`Importing student ${index + 1} of ${rows.length}…`);
        try {
          await apiRequest('/students', {
            method: 'POST',
            body: JSON.stringify({ ...item.student, termId, classLevelId })
          });
          outcomes.push({ rowNumber: item.rowNumber, success: true, message: 'Imported' });
        } catch (cause) {
          outcomes.push({ rowNumber: item.rowNumber, message: cause.message || 'Import failed.' });
        }
        setResults([...outcomes]);
      }
      const imported = outcomes.filter((outcome) => outcome.success).length;
      setProgress(`Imported ${imported} of ${rows.length} students.`);
      setFinished(true);
      if (imported) onImported();
    } finally {
      setBusy(false);
    }
  }

  const completeCount = results.filter((result) => result.success).length;
  const selectedTerm = terms.find((term) => term.id === termId);
  const selectedClassLevel = classLevels.find((level) => level.id === classLevelId);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="student-import-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Student register</p>
            <h2 id="student-import-title">Import students</h2>
            <p>Upload an Excel workbook or CSV. Each row needs a student name; parent/guardian details and address are optional.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={busy} aria-label="Close"><X size={19} /></button>
        </div>
        <form className="user-form" onSubmit={importRows}>
          <button className="text-button self-start" type="button" onClick={downloadTemplate}><Download size={15} /> Download Excel template</button>
          {!reviewing ? <>
            <label className="field-label">Academic term
              <select className="text-input" value={termId} onChange={(event) => setTermId(event.target.value)} required disabled={busy}>
                <option value="">Select a term</option>
                {terms.map((term) => {
                  const acceptingEnrollments = ['DRAFT', 'OPEN'].includes(term.status);
                  return <option key={term.id} value={term.id} disabled={!acceptingEnrollments}>
                    {term.academicYear?.name} · {term.sequence}. {term.name} ({term.status.toLowerCase().replaceAll('_', ' ')})
                  </option>;
                })}
              </select>
              <span className="field-hint">All terms are shown. Only terms in draft or open status accept new enrollments.</span>
            </label>
            <label className="field-label">Class level
              <select className="text-input" value={classLevelId} onChange={(event) => setClassLevelId(event.target.value)} required disabled={busy}>
                <option value="">Select a class level</option>
                {classLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
            </label>
            <label className="field-label">Excel or CSV file
              <input className="text-input" type="file" accept=".xlsx,.xls,.csv" onChange={chooseFile} required={!rows.length} disabled={busy} />
              <span className="field-hint">First worksheet only · up to 250 rows and 5 MB. Parent/guardian columns and address are optional. Columns: {templateHeaders.join(', ')}.</span>
            </label>
            {fileName && <p className="field-hint">{fileName} · {rows.length} student rows ready</p>}
          </> : <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Confirm import choices">
            <h3 className="font-semibold text-ink">Confirm import choices</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Academic term</dt><dd className="font-medium text-ink">{selectedTerm?.academicYear?.name} · {selectedTerm?.sequence}. {selectedTerm?.name}</dd></div>
              <div><dt className="text-muted">Class level</dt><dd className="font-medium text-ink">{selectedClassLevel?.name}</dd></div>
              <div><dt className="text-muted">File</dt><dd className="break-all font-medium text-ink">{fileName}</dd></div>
              <div><dt className="text-muted">Students to import</dt><dd className="font-medium text-ink">{rows.length}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Each student will be enrolled in the selected term and class level. Please confirm these choices before continuing.</p>
          </section>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {progress && <p className="form-success" role="status">{progress}</p>}
          {results.some((result) => !result.success) && <div className="max-h-36 overflow-y-auto rounded-lg border border-red-200 p-3 text-sm" role="status">
            {results.filter((result) => !result.success).map((result) => <p key={result.rowNumber}>Row {result.rowNumber}: {result.message}</p>)}
          </div>}
          {completeCount > 0 && <p className="field-hint">Successful imports: {completeCount}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Close</button>
            {reviewing && <button className="secondary-button" type="button" onClick={() => setReviewing(false)} disabled={busy}>Change choices</button>}
            <button className="primary-button" type="submit" disabled={busy || finished || !rows.length || !termId || !classLevelId}>
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              {busy ? 'Importing…' : finished ? 'Import complete' : reviewing ? 'Confirm and import' : 'Review import'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
