import { useEffect, useState } from 'react';
import { ImagePlus, LoaderCircle, Save, Trash2, UserRound } from 'lucide-react';
import { apiRequest } from '../../api.js';
import { roleLabel } from './userRoles.js';
import AssessmentPopup from '../assessments/AssessmentPopup.jsx';

const maxSignatureBytes = 500 * 1024;
const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const emptyProfile = { firstName: '', lastName: '', email: '', phone: '', role: '', status: '', staffNumber: '', signatureDataUrl: '' };

export default function ProfilesPage({ signOut, onSaved }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest('/auth/profile')
      .then(({ data }) => { if (!cancelled) setProfile({ ...emptyProfile, ...data, email: data.email || '', phone: data.phone || '', signatureDataUrl: data.signatureDataUrl || '' }); })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [signOut]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function selectSignature(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!acceptedImageTypes.includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP signature image.');
      return;
    }
    if (file.size > maxSignatureBytes) {
      setError('The signature image must be 500 KB or smaller.');
      return;
    }
    try {
      const signatureDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The image could not be read.'));
        reader.onerror = () => reject(new Error('The image could not be read.'));
        reader.readAsDataURL(file);
      });
      setProfile((current) => ({ ...current, signatureDataUrl }));
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
      const { data } = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          email: profile.email.trim() || null,
          ...(profile.role !== 'PARENT' ? { phone: profile.phone.trim() || null } : {}),
          signatureDataUrl: profile.signatureDataUrl || null
        })
      });
      setProfile((current) => ({ ...current, ...data, email: data.email || '', phone: data.phone || '', signatureDataUrl: data.signatureDataUrl || '' }));
      onSaved({ id: data.id, firstName: data.firstName, lastName: data.lastName, email: data.email, role: data.role, status: data.status, schoolId: data.schoolId });
      setNotice('Your profile has been updated.');
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="panel"><div className="table-message"><LoaderCircle size={20} className="animate-spin" /> Loading your profile…</div></div>;

  return <>
    <div className="welcome-row students-welcome"><div><p className="eyebrow">Account settings</p><h1 className="page-title">My profile<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Update your personal details and signature used on report cards.</p></div></div>
    <AssessmentPopup message={error} onDismiss={() => setError('')} />
    <AssessmentPopup message={notice} type="success" onDismiss={() => setNotice('')} />
    <form className="panel profile-page-panel" onSubmit={submit}>
      <div className="profile-page-heading"><span className="class-distribution-icon"><UserRound size={18} /></span><div><h2>Personal information</h2><p>Your name and contact details shown in the school workspace.</p></div></div>
      <div className="profile-page-fields">
        <label className="field-label">First name<input className="text-input" name="firstName" value={profile.firstName} onChange={updateField} maxLength={80} required disabled={saving} /></label>
        <label className="field-label">Last name<input className="text-input" name="lastName" value={profile.lastName} onChange={updateField} maxLength={80} required disabled={saving} /></label>
        <label className="field-label">Email address<input className="text-input" type="email" name="email" value={profile.email} onChange={updateField} maxLength={254} disabled={saving || profile.role === 'PARENT'} /><span className="field-hint">{profile.role === 'PARENT' ? 'Parent email changes require verification.' : 'Used for account notifications and sign-in.'}</span></label>
        {profile.role !== 'PARENT' && <label className="field-label">Phone number<input className="text-input" type="tel" name="phone" value={profile.phone} onChange={updateField} maxLength={40} autoComplete="tel" placeholder="+265…" disabled={saving} /><span className="field-hint">Optional. Use this number to sign in with your password.</span></label>}
        <div className="profile-readonly"><span>Role</span><strong>{roleLabel(profile.role)}</strong></div>
        {profile.staffNumber && <div className="profile-readonly"><span>Staff number</span><strong>{profile.staffNumber}</strong></div>}
      </div>
      <section className="profile-signature-section">
        <div><h2>Report-card signature</h2><p>Upload a clear image of your actual signature. PNG, JPEG, or WebP, up to 500 KB.</p></div>
        <div className="profile-signature-control">
          <div className="profile-signature-preview">{profile.signatureDataUrl ? <img src={profile.signatureDataUrl} alt="Your saved signature" /> : <span><ImagePlus size={22} /> No signature uploaded</span>}</div>
          <div className="profile-signature-actions">
            <label className="secondary-button profile-upload-button"><ImagePlus size={15} /> {profile.signatureDataUrl ? 'Replace signature' : 'Upload signature'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectSignature} disabled={saving} /></label>
            {profile.signatureDataUrl && <button className="table-action" type="button" onClick={() => setProfile((current) => ({ ...current, signatureDataUrl: '' }))} disabled={saving}><Trash2 size={14} /> Remove</button>}
          </div>
        </div>
      </section>
      <div className="profile-page-footer"><span>Account status: {profile.status}</span><button className="primary-button" type="submit" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  </>;
}
