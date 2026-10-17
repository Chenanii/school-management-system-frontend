import { useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Search, Users } from 'lucide-react';
import { formatDate, formatName, initials } from '../../shared/utils/people.js';
import StatusBadge from '../directory/StatusBadge.jsx';
import UserFormModal from './UserFormModal.jsx';
import { roleLabel, userRoles } from './userRoles.js';
import useUsers from './useUsers.js';

export default function UsersPage({ signOut }) {
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const directory = useUsers({ enabled: true, signOut });
  const { users, pagination, loading, error, search, role, status, page } = directory;

  function openCreate() {
    setModalUser(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setModalUser(user);
    setModalOpen(true);
  }

  return (
    <>
      <div className="welcome-row users-welcome">
        <div>
          <p className="eyebrow">People & permissions</p>
          <h1 className="page-title">User management<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">Manage user accounts, roles, and access to your school workspace.</p>
        </div>
        <button className="primary-button add-user-button" onClick={openCreate}><Plus size={17} /> Add user</button>
      </div>
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
                <tr><th>Name</th><th>Email address</th><th>Role</th><th>Staff no.</th><th>Status</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex min-w-[170px] items-center gap-3">
                        <div className="person-avatar person-staff">{initials(user) || '?'}</div>
                        <span className="whitespace-nowrap font-medium text-ink">{formatName(user)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-muted">{user.email}</td>
                    <td className="whitespace-nowrap text-muted">{roleLabel(user.role)}</td>
                    <td className="whitespace-nowrap text-muted">{user.teacher?.staffNumber || '—'}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className="whitespace-nowrap text-muted">{formatDate(user.createdAt)}</td>
                    <td><button className="table-action" onClick={() => openEdit(user)}>Edit</button></td>
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
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            directory.refresh();
          }}
        />
      )}
    </>
  );
}
