import { useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Mail, Plus, Search, Users, XCircle } from 'lucide-react';
import ConfirmActionModal from '../../components/ConfirmActionModal.jsx';
import { apiRequest } from '../../api.js';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import StatusBadge from '../directory/StatusBadge.jsx';
import UserFormModal from './UserFormModal.jsx';
import UserDetailsModal from './UserDetailsModal.jsx';
import { roleLabel, userRoles } from './userRoles.js';
import useUsers from './useUsers.js';

export default function UsersPage({ signOut, user }) {
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingSuperAdmin, setCreatingSuperAdmin] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [notice, setNotice] = useState('');
  const [busyInviteId, setBusyInviteId] = useState('');
  const [pendingRevocation, setPendingRevocation] = useState(null);
  const directory = useUsers({ enabled: true, signOut });
  const { users, pagination, loading, error, search, role, status, page } = directory;

  function openCreate() {
    setCreatingSuperAdmin(false);
    setModalUser(null);
    setModalOpen(true);
  }

  function openCreateSuperAdmin() {
    setCreatingSuperAdmin(true);
    setModalUser(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setModalUser(user);
    setModalOpen(true);
  }

  async function resendInvite(user) {
    setBusyInviteId(user.id);
    setNotice('');
    try {
      const result = await apiRequest(`/users/${user.id}/resend-invitation`, { method: 'POST' });
      setNotice(result.message || `A new invitation was sent to ${user.email}.`);
      directory.refresh();
    } catch (cause) {
      setNotice(cause.message);
    } finally {
      setBusyInviteId('');
    }
  }

  async function revokeInvite() {
    const user = pendingRevocation;
    if (!user) return;
    setPendingRevocation(null);
    setBusyInviteId(user.id);
    setNotice('');
    try {
      const result = await apiRequest(`/users/${user.id}/revoke-invitation`, { method: 'POST' });
      setNotice(result.message || `The invitation for ${user.email} was revoked.`);
      directory.refresh();
    } catch (cause) {
      setNotice(cause.message);
    } finally {
      setBusyInviteId('');
    }
  }

  return (
    <>
      <div className="welcome-row users-welcome">
        <div>
          <p className="eyebrow">People & permissions</p>
          <h1 className="page-title">User management<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Manage all staff accounts, including teachers, their roles, and access to your school workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'SUPER_ADMIN' && <button className="secondary-button" onClick={openCreateSuperAdmin}><Plus size={17} /> Add super admin</button>}
          <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Add user</button>
        </div>
      </div>
      {notice && <div className="teaching-assignment-notice" role="status">{notice}<button className="text-button" type="button" onClick={() => setNotice('')}>Dismiss</button></div>}
      <section className="panel user-directory-panel">
        <div className="users-toolbar">
          <div className="relative min-w-[220px] flex-1 sm:max-w-[300px]">
            <Search size={17} className="search-icon" />
            <input className="search-input" type="search" value={search} onChange={(event) => directory.setSearch(event.target.value)} placeholder="Search name, email, or staff no." aria-label="Search users" />
          </div>
          <div className="users-filters">
            <label className="sr-only" htmlFor="user-role-filter">Filter by role</label>
            <select id="user-role-filter" className="filter-select" value={role} onChange={(event) => directory.setRole(event.target.value)}>
              <option value="">All roles</option>
              {userRoles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <label className="sr-only" htmlFor="user-status-filter">Filter by status</label>
            <select id="user-status-filter" className="filter-select" value={status} onChange={(event) => directory.setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <span className="user-total">{pagination.total} {pagination.total === 1 ? 'user' : 'users'}</span>
        </div>
        {error ? (
          <div className="table-message">
            <p>{error}</p>
            <button className="text-button mt-2" onClick={directory.refresh}>Try again</button>
          </div>
        ) : loading ? (
          <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading users…</span></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={22} /></div>
            <p className="mt-3 text-sm font-semibold text-ink">{search || role || status ? 'No users match these filters' : 'No user accounts yet'}</p>
            <p className="mt-1 text-xs text-muted">{search || role || status ? 'Try a different search or filter.' : 'Add staff users and set up their roles here.'}</p>
            {!search && !role && !status && <button className="text-button mt-3" onClick={openCreate}>Add your first user</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="people-table users-table">
              <thead>
                <tr><th>Name</th><th>Email address</th><th>Role</th><th>Staff no.</th><th>Status</th><th>Invitation</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Name">
                      <div className="flex min-w-[170px] items-center gap-3">
                        <div className="person-avatar person-staff">{initials(user) || '?'}</div>
                        <button className="user-name-link whitespace-nowrap font-medium text-ink" type="button" onClick={() => setDetailsUser(user)}>{formatName(user)}</button>
                      </div>
                    </td>
                    <td data-label="Email address" className="whitespace-nowrap text-muted">{user.email}</td>
                    <td data-label="Role" className="whitespace-nowrap text-muted">{roleLabel(user.role)}</td>
                    <td data-label="Staff no." className="whitespace-nowrap text-muted">{user.teacher?.staffNumber || '-'}</td>
                    <td data-label="Status"><StatusBadge status={user.status} /></td>
                    <td data-label="Invitation" className="whitespace-nowrap text-muted">{user.invitationStatus === 'PENDING' ? 'Pending' : user.invitationStatus === 'EXPIRED' ? 'Expired' : user.invitationStatus === 'REVOKED' ? 'Revoked' : '-'}</td>
                    <td data-label="Created" className="whitespace-nowrap text-muted">{formatDate(user.createdAt)}</td>
                    <td data-label="Actions" className="whitespace-nowrap">
                      {user.recordType === 'LEGACY_TEACHER_INVITATION'
                        ? <span className="text-muted">Teacher invitation</span>
                        : <><button className="table-action" onClick={() => setDetailsUser(user)}>View</button><button className="table-action ml-2" onClick={() => openEdit(user)}>Edit</button></>}
                      {(user.invitationStatus === 'PENDING' || user.invitationStatus === 'EXPIRED' || user.invitationStatus === 'REVOKED') && <>
                        <button className="table-action ml-2" type="button" onClick={() => resendInvite(user)} disabled={busyInviteId === user.id} aria-label={`Resend invitation to ${user.email}`}><Mail size={14} /> {busyInviteId === user.id ? 'Sending…' : 'Resend invite'}</button>
                        {user.invitationStatus === 'PENDING' && <button className="table-action ml-2" type="button" onClick={() => setPendingRevocation(user)} disabled={busyInviteId === user.id} aria-label={`Revoke invitation for ${user.email}`}><XCircle size={14} /> Revoke</button>}
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!error && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button className="pagination-button" disabled={page <= 1} onClick={() => directory.setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <button className="pagination-button" disabled={page >= pagination.totalPages} onClick={() => directory.setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
      {modalOpen && (
        <UserFormModal
          user={modalUser}
          superAdminMode={creatingSuperAdmin}
          onClose={() => { setModalOpen(false); setCreatingSuperAdmin(false); }}
          onSaved={(result) => {
            setModalOpen(false);
            setCreatingSuperAdmin(false);
            setNotice(modalUser
              ? result.roleChanged
                ? result.roleChangeEmailSent
                  ? `User role updated. A notification was sent to ${result.data?.email || 'the user'}.`
                  : 'User role updated, but its notification email could not be sent.'
                : 'User account updated.'
              : result.invitationEmailSent
              ? `Invitation sent to ${result.data?.email || 'the user'}. They can set their password from the email link.`
              : result.registrationEmailSent === false
                ? `User account created for ${result.data?.email || 'the user'}, but the notification email could not be sent.`
                : `User account created for ${result.data?.email || 'the user'}.`);
            directory.refresh();
          }}
        />
      )}
      {detailsUser && <UserDetailsModal user={detailsUser} signOut={signOut} onClose={() => setDetailsUser(null)} onEdit={(user) => { setDetailsUser(null); openEdit(user); }} />}
      {pendingRevocation && <ConfirmActionModal
        title="Revoke invitation?"
        message={`The pending invitation for ${formatName(pendingRevocation)} will be invalidated. You can send a new one later.`}
        confirmLabel="Revoke invitation"
        onCancel={() => setPendingRevocation(null)}
        onConfirm={revokeInvite}
      />}
    </>
  );
}
