import { CalendarDays, Menu } from 'lucide-react';
import { initials } from '../../shared/utils/people.js';
import { sections } from '../../shared/navigation.js';
import NotificationCenter from '../../features/notifications/NotificationCenter.jsx';

export default function Header({ page, onMenu, user, schoolId, onNavigate }) {
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
        <div>
          <div className="text-sm font-semibold text-ink">{title}</div>
          <div className="mt-0.5 hidden text-xs text-muted sm:block">{today}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="topbar-date"><CalendarDays size={15} /><span>{today}</span></div>
        <NotificationCenter key={schoolId || 'no-school-context'} schoolId={schoolId} userRole={user.role} onNavigate={onNavigate} />
        <div className="topbar-profile">{initials(user) || 'A'}</div>
      </div>
    </header>
  );
}
