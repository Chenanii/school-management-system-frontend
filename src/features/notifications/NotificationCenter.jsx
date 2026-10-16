import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ClipboardCheck, FileCheck2, X } from 'lucide-react';
import { apiRequest } from '../../api.js';

const pageSize = 20;

function notificationIcon(type) {
  if (type === 'TERM_RESULT_PUBLISHED') return FileCheck2;
  if (type === 'ASSESSMENT_SUBMITTED') return CheckCheck;
  return ClipboardCheck;
}

function formatNotificationTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export default function NotificationCenter({ schoolId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const loadNotifications = useCallback(async ({ cursor = null, append = false, silent = false } = {}) => {
    if (!schoolId) {
      setNotifications([]);
      setUnreadCount(0);
      setNextCursor(null);
      return;
    }
    if (append) setLoadingMore(true);
    else if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams({ limit: String(pageSize) });
      if (cursor) query.set('cursor', cursor);
      const result = await apiRequest(`/notifications?${query}`);
      setNotifications((current) => {
        if (!append) return result.data;
        const existingIds = new Set(current.map(({ id }) => id));
        return [...current, ...result.data.filter(({ id }) => !existingIds.has(id))];
      });
      setUnreadCount(result.unreadCount);
      setNextCursor(result.nextCursor);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not load notifications.');
    } finally {
      if (append) setLoadingMore(false);
      else if (!silent) setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadNotifications();
    if (!schoolId) return undefined;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadNotifications({ silent: true });
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadNotifications, schoolId]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((current) => !current);
    if (!open && schoolId) loadNotifications({ silent: true });
  }

  async function markRead(notification) {
    if (notification.readAt || markingId) return;
    setMarkingId(notification.id);
    try {
      const result = await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? result.data : item
      )));
      setUnreadCount(result.unreadCount);
    } catch (requestError) {
      setError(requestError.message || 'Could not mark this notification as read.');
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      const result = await apiRequest('/notifications/read-all', { method: 'PATCH' });
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
      setUnreadCount(result.data.unreadCount);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    await loadNotifications({ cursor: nextCursor, append: true });
  }

  return (
    <div className="notification-center" ref={containerRef}>
      <button
        className="icon-button notification-button"
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={toggleOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-count" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-panel" id="notification-panel" aria-label="Notification inbox">
          <div className="notification-panel-heading">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p>
            </div>
            <div className="notification-panel-actions">
              <button
                className="notification-mark-all"
                type="button"
                disabled={!unreadCount || markingAll}
                onClick={markAllRead}
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
              <button className="icon-button notification-close" type="button" aria-label="Close notifications" onClick={() => setOpen(false)}>
                <X size={17} />
              </button>
            </div>
          </div>
          {error && (
            <div className="notification-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => loadNotifications()}>Retry</button>
            </div>
          )}
          {!schoolId ? (
            <div className="notification-empty">Select a school workspace to view its notifications.</div>
          ) : loading ? (
            <div className="notification-empty" role="status">Loading notifications...</div>
          ) : notifications.length ? (
            <>
              <ul className="notification-list">
                {notifications.map((notification) => {
                  const Icon = notificationIcon(notification.type);
                  return (
                    <li key={notification.id}>
                      <button
                        className={`notification-item ${notification.readAt ? '' : 'notification-item-unread'}`}
                        type="button"
                        onClick={() => markRead(notification)}
                        disabled={markingId === notification.id}
                      >
                        <span className={`notification-item-icon notification-icon-${notification.type.toLowerCase()}`}>
                          <Icon size={16} />
                        </span>
                        <span className="notification-item-content">
                          <span className="notification-item-title">{notification.title}</span>
                          <span className="notification-item-message">{notification.message}</span>
                          <time className="notification-item-time" dateTime={notification.createdAt}>
                            {formatNotificationTime(notification.createdAt)}
                          </time>
                        </span>
                        {!notification.readAt && <span className="notification-unread-dot" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {nextCursor && (
                <button className="notification-load-more" type="button" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : 'Load older notifications'}
                </button>
              )}
            </>
          ) : !error ? (
            <div className="notification-empty">
              <Bell size={20} />
              <span>No notifications yet. Important school updates will appear here.</span>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
