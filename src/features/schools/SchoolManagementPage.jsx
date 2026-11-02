import { useCallback, useEffect, useState } from 'react';
import { Building2, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api.js';
import AssessmentPopup from '../assessments/AssessmentPopup.jsx';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';
import './school-management.css';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export default function SchoolManagementPage({ signOut, onDeleted }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSchools = useCallback(async () => {
    setError('');
    try {
      const result = await apiRequest('/schools');
      setSchools(result.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  async function deleteSchool() {
    if (!schoolToDelete || deleting) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/schools/${schoolToDelete.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: schoolToDelete.name })
      });
      setSchools((current) => current.filter((school) => school.id !== schoolToDelete.id));
      setNotice(`${schoolToDelete.name} and its school data have been deleted.`);
      setSchoolToDelete(null);
      await onDeleted?.();
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setDeleting(false);
    }
  }

  return <>
    <div className="welcome-row students-welcome">
      <div><p className="eyebrow">Platform administration</p><h1 className="page-title">Manage schools<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Review registered schools and remove mock or unwanted school data.</p></div>
      <button className="secondary-button" type="button" onClick={() => { setLoading(true); loadSchools(); }} disabled={loading}><RefreshCw size={15} /> Refresh</button>
    </div>
    <AssessmentPopup message={error} onDismiss={() => setError('')} />
    <AssessmentPopup message={notice} type="success" onDismiss={() => setNotice('')} />
    {loading ? <div className="panel table-message"><LoaderCircle size={20} className="animate-spin" /> Loading schools…</div> : schools.length === 0 ? (
      <div className="panel empty-state"><div className="empty-state-icon"><Building2 size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No schools found</p><p className="mt-2 text-xs text-muted">Registered schools will appear here.</p></div>
    ) : (
      <div className="school-management-list">
        {schools.map((school) => (
          <article className="panel school-management-card" key={school.id}>
            <div className="school-management-card-copy">
              <div className="school-management-title"><span className="class-distribution-icon"><Building2 size={18} /></span><div><h2>{school.name}</h2><p>/{school.slug} · Added {formatDate(school.createdAt)}</p></div></div>
              <div className="school-management-meta"><span className={`subject-status subject-status-${school.status.toLowerCase()}`}>{school.status}</span><span>{school._count?.users ?? 0} users</span><span>{school._count?.students ?? 0} students</span><span>{school.subscriptions?.[0]?.plan?.name || 'No subscription'}</span></div>
            </div>
            <button className="school-management-delete" type="button" onClick={() => setSchoolToDelete(school)} aria-label={`Delete ${school.name} and its data`}><Trash2 size={15} /> Delete school data</button>
          </article>
        ))}
      </div>
    )}
    {schoolToDelete && <ConfirmActionModal
      title={`Delete ${schoolToDelete.name}?`}
      message="This permanently deletes the school and all associated records, including its users, students, academic records, reports, and subscription data. This cannot be undone."
      confirmationText={schoolToDelete.name}
      confirmLabel={deleting ? 'Deleting school data…' : 'Delete school and all data'}
      confirmDisabled={deleting}
      tone="danger"
      onCancel={() => { if (!deleting) setSchoolToDelete(null); }}
      onConfirm={deleteSchool}
    />}
  </>;
}
