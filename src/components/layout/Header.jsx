import { CalendarDays, ListChecks, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { initials } from '../../shared/utils/people.js';
import { sections } from '../../shared/navigation.js';
import NotificationCenter from '../../features/notifications/NotificationCenter.jsx';

export default function Header({ page, onMenu, user, schoolId, onNavigate, collapsed, onToggleCollapse, displayMode, onToggleDisplayMode, setupPending, setupHubOpen, setupProgress, onOpenSetup }) {
  const title = sections.find((item) => item.id === page)?.label || 'Overview';
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
        <button
          className="icon-button desktop-sidebar-toggle"
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div>
          <div className="text-sm font-semibold text-ink">{title}</div>
          <div className="mt-0.5 hidden text-xs text-muted sm:block">{today}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {setupPending && !setupHubOpen && (
          <button className="setup-checklist-shortcut" type="button" onClick={onOpenSetup}>
            <ListChecks size={16} /><span>Setup checklist</span><small>{setupProgress}</small>
          </button>
        )}
        <div className="topbar-date"><CalendarDays size={15} /><span>{today}</span></div>
        <button
          className="icon-button display-mode-toggle"
          type="button"
          onClick={onToggleDisplayMode}
          aria-label={`Switch to ${displayMode === 'DARK' ? 'light' : 'dark'} mode`}
          aria-pressed={displayMode === 'DARK'}
          title={`${displayMode === 'DARK' ? 'Dark' : 'Light'} mode · click to switch`}
        >
          {displayMode === 'DARK' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationCenter key={schoolId || 'no-school-context'} schoolId={schoolId} userRole={user.role} onNavigate={onNavigate} />
        <div className="topbar-profile">{initials(user) || 'A'}</div>
      </div>
    </header>
  );
}
