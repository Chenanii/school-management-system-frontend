import {
  ArrowUpRight,
  CalendarDays,
  CircleHelp,
  LogOut,
  X
} from 'lucide-react';
import Brand from './Brand.jsx';
import { initials } from '../../shared/utils/people.js';
import { sections } from '../../shared/navigation.js';

export default function Sidebar({
  page,
  setPage,
  user,
  school,
  schools = [],
  schoolLoading = false,
  onSchoolChange,
  onSignOut,
  open,
  onClose
}) {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const schoolName = school?.name || (isSuperAdmin ? 'Select a school' : user.schoolName || 'My school');
  const visibleSections = sections.filter(({ roles }) => !roles || roles.includes(user.role));
  const sectionGroups = visibleSections.reduce((groups, section) => {
    const group = section.group || 'Workspace';
    groups.set(group, [...(groups.get(group) || []), section]);
    return groups;
  }, new Map());

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="school-switcher">
          <div className="school-avatar">{schoolName.trim().charAt(0).toUpperCase() || 'S'}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink" title={schoolName}>{schoolName}</div>
            {isSuperAdmin ? (
              <select
                className="school-context-select"
                aria-label="Select school workspace"
                value={school?.id || ''}
                onChange={(event) => onSchoolChange(event.target.value)}
                disabled={schoolLoading || schools.length === 0}
              >
                <option value="">{schoolLoading ? 'Loading schools...' : 'Select a school'}</option>
                {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            ) : (
              <div className="mt-0.5 text-xs text-muted">School workspace</div>
            )}
          </div>
        </div>
        <nav className="sidebar-navigation" aria-label="Main navigation">
          {[...sectionGroups.entries()].map(([group, items]) => (
            <div className="sidebar-nav-group" key={group}>
              <div className="nav-caption">{group}</div>
              <div className="space-y-1">
                {items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`nav-item ${page === id ? 'nav-item-active' : ''}`}
                    aria-current={page === id ? 'page' : undefined}
                    onClick={() => { setPage(id); onClose(); }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                    {id === 'students' && <span className="nav-arrow"><ArrowUpRight size={14} /></span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="nav-caption mt-8">Your school</div>
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><CalendarDays size={17} /></div>
          <p className="mt-3 text-sm font-semibold text-ink">A fresh start</p>
          <p className="mt-1 text-xs leading-5 text-muted">Your school workspace is ready. Add your students and staff to get going.</p>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item"><CircleHelp size={18} strokeWidth={1.8} /><span>Help & support</span></button>
          <div className="profile-row">
            <div className="profile-avatar">{initials(user) || 'A'}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink" title={`${user.firstName} ${user.lastName}`}>{user.firstName} {user.lastName}</div>
              <div className="truncate text-xs text-muted" title={schoolName}>{schoolName}</div>
              <div className="truncate text-[10px] capitalize text-muted">{user.role?.replaceAll('_', ' ').toLowerCase()}</div>
            </div>
            <button className="icon-button" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}
