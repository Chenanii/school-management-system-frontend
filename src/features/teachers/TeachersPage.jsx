import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Mail, Plus, Search, Users, XCircle } from 'lucide-react';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import TeacherFormModal from './TeacherFormModal.jsx';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';
import { fetchTeachers, resendInvitation, revokeInvitation, teacherInvitationStatus } from './teacherApi.js';

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function TeachersPage({ signOut }) {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formTeacher, setFormTeacher] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [pendingRevocation, setPendingRevocation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchTeachers({ search, page });
        if (!cancelled) {
          setTeachers(result.data || []);
          setPagination(result.pagination || emptyPagination);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [page, search, refreshKey, signOut]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreate() {
    setFormTeacher(null);
    setFormOpen(true);
  }

  function openEdit(teacher) {
    setFormTeacher(teacher);
    setFormOpen(true);
  }

  async function handleInvitationAction(teacher, action) {
    if (action === 'revoke') {
      setPendingRevocation(teacher);
      return;
    }
    setBusyId(teacher.id);
    setNotice('');
    try {
      await resendInvitation(teacher.id);
      setNotice(`A new invitation was sent to ${teacher.email}.`);
      refresh();
    } catch (cause) {
      setNotice(cause.message);
    } finally {
      setBusyId('');
    }
  }

  async function confirmRevocation() {
    const teacher = pendingRevocation;
    if (!teacher) return;
    setPendingRevocation(null);
    setBusyId(teacher.id);
    setNotice('');
    try {
      await revokeInvitation(teacher.id);
      setNotice(`Pending invitation revoked for ${formatName(teacher)}.`);
      refresh();
    } catch (cause) {
      setNotice(cause.message);
    } finally {
      setBusyId('');
    }
  }

  const hasSearch = Boolean(search.trim());

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">People & onboarding</p>
          <h1 className="page-title">Teachers<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Manage teacher profiles and send secure invitations to set up their accounts.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Add teacher</button>
      </div>
      {notice && (
        <div className="teacher-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><XCircle size={17} /></button>
        </div>
      )}
      <section className="panel directory-panel teacher-directory-panel">
        <div className="teacher-toolbar">
          <div className="relative w-full sm:max-w-[320px]">
            <Search size={17} className="search-icon" />
            <input
              className="search-input"
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search name, email, or staff number"
              aria-label="Search teachers"
            />
          </div>
          <span className="student-total">{pagination.total} {pagination.total === 1 ? 'teacher' : 'teachers'}</span>
        </div>
        {error ? (
          <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading teachers…</span></div>
        ) : teachers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{hasSearch ? 'No teachers match this search' : 'No teachers added yet'}</p>
            <p className="mt-1 text-xs text-muted">{hasSearch ? 'Try a different name, email, or staff number.' : 'Create teacher profiles and invite them to activate their accounts.'}</p>
            {!hasSearch && <button className="text-button mt-3" onClick={openCreate}>Add your first teacher</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table teacher-table">
              <thead>
                <tr><th>Teacher</th><th>Email address</th><th>Staff no.</th><th>Account / invitation</th><th>Assignments</th><th>Added</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const status = teacherInvitationStatus(teacher);
                  const invitation = teacher.invitations?.[0];
                  const canInvite = !teacher.user;
                  const canRevoke = canInvite && invitation && !invitation.acceptedAt && !invitation.revokedAt && new Date(invitation.expiresAt) > new Date();
                  return (
                    <tr key={teacher.id}>
                      <td>
                        <div className="flex min-w-[175px] items-center gap-3">
                          <div className="person-avatar person-staff">{initials(teacher) || '?'}</div>
                          <span className="whitespace-nowrap font-medium text-ink">{formatName(teacher)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">{teacher.email}</td>
                      <td className="whitespace-nowrap text-muted">{teacher.staffNumber || '—'}</td>
                      <td><span className={`subject-status subject-status-${status.tone}`}>{status.label}</span></td>
                      <td className="text-muted">{teacher._count?.assignments ?? 0}</td>
                      <td className="whitespace-nowrap text-muted">{formatDate(teacher.createdAt)}</td>
                      <td>
                        <div className="teacher-actions">
                          <button className="table-action" onClick={() => openEdit(teacher)}>Edit</button>
                          {canInvite && (
                            <button className="table-action" onClick={() => handleInvitationAction(teacher, 'resend')} disabled={busyId === teacher.id}>
                              {busyId === teacher.id ? <LoaderCircle size={14} className="animate-spin" /> : <Mail size={14} />}
                              {invitation && !invitation.revokedAt && new Date(invitation.expiresAt) > new Date() ? 'Resend' : 'Invite'}
                            </button>
                          )}
                          {canRevoke && (
                            <button className="table-action" onClick={() => handleInvitationAction(teacher, 'revoke')} disabled={busyId === teacher.id}>Revoke</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!error && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button className="pagination-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
      {formOpen && (
        <TeacherFormModal
          teacher={formTeacher}
          onClose={() => setFormOpen(false)}
          onSaved={(result) => {
            setFormOpen(false);
            if (!formTeacher && result.data?.invitationEmailSent === false) {
              setNotice('Teacher profile created, but the invitation email could not be sent. Check SMTP settings and use Invite to retry.');
            } else {
              setNotice(formTeacher ? 'Teacher profile updated.' : 'Teacher profile created and invitation email sent.');
            }
            refresh();
          }}
        />
      )}
      {pendingRevocation && <ConfirmActionModal
        title="Revoke invitation?"
        message={`The pending invitation for ${formatName(pendingRevocation)} will be revoked.`}
        confirmLabel="Revoke invitation"
        onCancel={() => setPendingRevocation(null)}
        onConfirm={confirmRevocation}
      />}
    </>
  );
}
