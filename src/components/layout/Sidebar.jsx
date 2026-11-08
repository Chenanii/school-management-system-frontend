import { useEffect, useState } from 'react';
import {
  ChevronDown,
  CircleHelp,
  LogOut,
  X
} from 'lucide-react';
import Brand from './Brand.jsx';
import { initials } from '../../shared/utils/people.js';
import { navigationGroupOrder, sections } from '../../shared/navigation.js';

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
  onClose,
  collapsed = false
}) {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [openGroups, setOpenGroups] = useState(() => {
    const activeSection = sections.find(({ id, roles }) => id === page && (!roles || roles.includes(user.role)));
    return { [activeSection?.group || 'Home']: true };
  });
  const schoolName = school?.name || (isSuperAdmin ? 'Select a school' : user.schoolName || 'My school');
  const visibleSections = sections.filter(({ roles }) => !roles || roles.includes(user.role));
  const sectionGroups = visibleSections.reduce((groups, section) => {
    const group = section.group || 'Workspace';
    groups.set(group, [...(groups.get(group) || []), section]);
    return groups;
  }, new Map());
  const orderedSectionGroups = [...sectionGroups.entries()].sort(([groupA], [groupB]) => (
    navigationGroupOrder.indexOf(groupA) - navigationGroupOrder.indexOf(groupB)
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const syncViewport = () => setIsMobile(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    const activeSection = sections.find(({ id, roles }) => id === page && (!roles || roles.includes(user.role)));
    const activeGroup = activeSection?.group;
    if (activeGroup) setOpenGroups((current) => current[activeGroup] ? current : { ...current, [activeGroup]: true });
  }, [page, user.role]);

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="school-switcher">
          {school?.logoDataUrl
            ? <img className="school-avatar school-avatar-logo" src={school.logoDataUrl} alt={`${schoolName} logo`} />
            : <div className="school-avatar">{schoolName.trim().charAt(0).toUpperCase() || 'S'}</div>}
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
          {orderedSectionGroups.map(([group, items]) => (
            <div className="sidebar-nav-group" key={group}>
              <button
                className="nav-caption nav-group-toggle"
                type="button"
                aria-expanded={Boolean(openGroups[group])}
                aria-controls={'sidebar-group-' + items[0].id}
                onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}
              >
                <span>{group}</span>
                <ChevronDown size={15} className={openGroups[group] ? '' : 'nav-group-chevron-closed'} />
              </button>
              <div
                id={'sidebar-group-' + items[0].id}
                className="sidebar-nav-items"
                hidden={!openGroups[group] && !(collapsed && !isMobile)}
              >
                {items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`nav-item ${page === id ? 'nav-item-active' : ''}`}
                    aria-current={page === id ? 'page' : undefined}
                    title={label}
                    onClick={() => { setPage(id); onClose(); }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a className="nav-item" href="mailto:nexacircuit@gmail.com?subject=School%20reporting%20support"><CircleHelp size={18} strokeWidth={1.8} /><span>Help & support</span></a>
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
