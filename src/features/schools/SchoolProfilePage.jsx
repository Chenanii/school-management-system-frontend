import { useEffect, useState } from 'react';
import { Building2, LoaderCircle, Save, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api.js';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';

const emptyProfile = {
  name: '',
  slug: '',
  email: '',
  address: '',
  phone: '',
  logoDataUrl: '',
  secondaryLogoDataUrl: '',
  classTeacherSignerName: '',
  headteacherSignerName: '',
};

const maxLogoBytes = 512 * 1024;
const acceptedLogoTypes = ['image/png', 'image/jpeg', 'image/webp'];

function optionalValue(value) {
  return typeof value === 'string' ? value.trim() || null : null;
}

export default function SchoolProfilePage({ signOut, onSaved }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmLogoRemoval, setConfirmLogoRemoval] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest('/schools/current')
      .then(({ data }) => {
        if (!cancelled) {
          setProfile({
            ...emptyProfile,
            ...data,
            email: data.email || '',
            address: data.address || '',
            phone: data.phone || '',
            logoDataUrl: data.logoDataUrl || '',
            secondaryLogoDataUrl: data.secondaryLogoDataUrl || '',
            classTeacherSignerName: data.classTeacherSignerName || '',
            headteacherSignerName: data.headteacherSignerName || '',
          });
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [signOut]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function selectLogo(event, target = 'logoDataUrl') {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!acceptedLogoTypes.includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP logo image.');
      return;
    }
    if (file.size > maxLogoBytes) {
      setError('The logo must be 512 KB or smaller.');
      return;
    }
    try {
      const logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('The logo could not be read.'));
        reader.onerror = () => reject(new Error('The logo could not be read.'));
        reader.readAsDataURL(file);
      });
      setProfile((current) => ({ ...current, [target]: logoDataUrl }));
      setError('');
      setNotice('');
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { data } = await apiRequest('/schools/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profile.name.trim(),
          slug: profile.slug.trim(),
          email: optionalValue(profile.email),
          address: optionalValue(profile.address),
          phone: optionalValue(profile.phone),
          logoDataUrl: profile.logoDataUrl || null,
          secondaryLogoDataUrl: profile.secondaryLogoDataUrl || null,
          classTeacherSignerName: optionalValue(profile.classTeacherSignerName),
          headteacherSignerName: optionalValue(profile.headteacherSignerName),
        }),
      });
      setProfile((current) => ({
        ...current,
        ...data,
        email: data.email || '',
        address: data.address || '',
        phone: data.phone || '',
        logoDataUrl: data.logoDataUrl || '',
        secondaryLogoDataUrl: data.secondaryLogoDataUrl || '',
        classTeacherSignerName: data.classTeacherSignerName || '',
        headteacherSignerName: data.headteacherSignerName || '',
      }));
      setNotice('School profile saved. New report cards will use these details.');
      onSaved?.(data);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="panel"><div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /> Loading school profile…</div></div>;
  }

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">School workspace</p>
          <h1 className="page-title">School profile<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">These details appear on report cards generated for your school.</p>
        </div>
      </div>
      {error && <div className="notice-error mb-4" role="alert">{error}</div>}
      {notice && <div className="teaching-assignment-notice mb-4" role="status">{notice}</div>}
      <section className="panel school-profile-panel">
        <form className="user-form" onSubmit={submit}>
          <div className="school-profile-logos-grid">
            {[['logoDataUrl', 'School logo'], ['secondaryLogoDataUrl', 'Right-side report logo']].map(([field, label]) => <div className="school-profile-logo-row" key={field}>
              {profile[field] ? <img className="school-profile-logo" src={profile[field]} alt={`${label} preview`} /> : <div className="school-profile-logo-fallback"><Building2 size={24} /></div>}
              <div className="school-profile-logo-controls"><label className="field-label">{label}<input className="text-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectLogo(event, field)} disabled={saving} /><span className="field-hint">{field === 'secondaryLogoDataUrl' ? 'Shown on the right side of report headers. ' : ''}PNG, JPEG, or WebP; maximum 512 KB.</span></label>
                {profile[field] && <button className="table-action" type="button" onClick={() => field === 'logoDataUrl' ? setConfirmLogoRemoval(true) : setProfile((current) => ({ ...current, secondaryLogoDataUrl: '' }))} disabled={saving}><Trash2 size={14} /> Remove logo</button>}
              </div>
            </div>)}
          </div>
          <div className="school-profile-fields">
            <label className="field-label">School name<input className="text-input" name="name" value={profile.name} onChange={updateField} maxLength={160} required /></label>
            <label className="field-label">School email<input className="text-input" type="email" name="email" value={profile.email} onChange={updateField} /></label>
            <label className="field-label">Phone<input className="text-input" type="tel" name="phone" value={profile.phone} onChange={updateField} maxLength={40} /></label>
            <label className="field-label">School URL slug<input className="text-input" name="slug" value={profile.slug} onChange={updateField} maxLength={80} required /><span className="field-hint">Workspace URL: {window.location.origin}/{profile.slug || 'school-slug'}</span></label>
            <label className="field-label school-profile-address">Address<textarea className="text-input" name="address" value={profile.address} onChange={updateField} maxLength={500} rows={3} /></label>
          </div>
          <div>
            <h2 className="school-profile-section-title">Report-card signatories</h2>
            <p className="field-hint">Names will print above the signature lines on each report card.</p>
          </div>
          <div className="school-profile-fields">
            <label className="field-label">Class teacher name<input className="text-input" name="classTeacherSignerName" value={profile.classTeacherSignerName} onChange={updateField} maxLength={120} /></label>
            <label className="field-label">Headteacher name<input className="text-input" name="headteacherSignerName" value={profile.headteacherSignerName} onChange={updateField} maxLength={120} /></label>
          </div>
          <div className="modal-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save school profile'}
            </button>
          </div>
        </form>
      </section>
      {confirmLogoRemoval && <ConfirmActionModal
        title="Remove school logo?"
        message="The logo will be removed from the school profile when you save your changes."
        confirmLabel="Remove logo"
        onCancel={() => setConfirmLogoRemoval(false)}
        onConfirm={() => { setProfile((current) => ({ ...current, logoDataUrl: '' })); setConfirmLogoRemoval(false); }}
      />}
    </>
  );
}
