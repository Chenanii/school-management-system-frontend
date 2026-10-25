import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CreditCard } from 'lucide-react';
import { formatPlanPrice, getSubscriptionData } from './subscriptionApi.js';

const reminderRoles = new Set(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER']);

function dateLabel(value) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function TermExpiryReminder({ user, schoolId, page, onNavigate }) {
  const [reminder, setReminder] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  const refresh = useCallback(async () => {
    const [reminderResult, subscriptionResult] = await Promise.allSettled([
      getSubscriptionData('/subscriptions/reminder'),
      user?.role === 'SCHOOL_ADMIN' && schoolId
        ? getSubscriptionData('/subscriptions/current')
        : Promise.resolve(null)
    ]);
    setReminder(reminderResult.status === 'fulfilled' && reminderResult.value.data?.showReminder
      ? reminderResult.value.data
      : null);
    const pending = subscriptionResult.status === 'fulfilled'
      ? subscriptionResult.value?.data?.pendingChange
      : null;
    setPendingPayment(pending?.plan?.priceMinor > 0 ? pending : null);
  }, [user?.id, user?.role, schoolId]);

  useEffect(() => {
    if (!reminderRoles.has(user?.role) || (user?.role === 'SUPER_ADMIN' && !schoolId)) {
      setReminder(null);
      setPendingPayment(null);
      return undefined;
    }
    refresh();
    const timer = window.setInterval(refresh, 60 * 1000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.role, schoolId, refresh]);

  const showPaymentReminder = user?.role === 'SCHOOL_ADMIN' && pendingPayment && page !== 'subscriptions';
  if (!reminder && !showPaymentReminder) return null;
  const urgent = Boolean(reminder && reminder.daysRemaining <= 21);
  return (
    <>
      {showPaymentReminder && (
        <aside className="subscription-payment-reminder" aria-label="Subscription payment required" role="status" aria-live="polite">
          <div>
            <strong>Plan awaiting payment</strong>
            <span>{pendingPayment.plan.name} · {formatPlanPrice(pendingPayment.plan)}</span>
          </div>
          <button className="primary-button" type="button" onClick={() => onNavigate('subscriptions')}>
            <CreditCard size={15} /> Complete payment
          </button>
        </aside>
      )}
      {reminder && (
        <aside className={`term-expiry-reminder ${showPaymentReminder ? 'term-expiry-reminder-offset' : ''} ${urgent ? 'term-expiry-reminder-urgent' : ''}`} role="status" aria-live="polite">
          <div className="term-expiry-reminder-heading">
            {urgent ? <AlertTriangle size={18} /> : <CalendarClock size={18} />}
            <strong>{reminder.termName} ends in {reminder.daysRemaining} days</strong>
          </div>
          <p>Subscription access ends {dateLabel(reminder.termEndDate)}.</p>
          {urgent && <p className="term-expiry-reminder-warning">Mid-term and end-of-term reports are restricted during the final three weeks.</p>}
          <button className="primary-button" type="button" onClick={() => onNavigate('subscriptions')}>
            <CreditCard size={15} /> Review subscription
          </button>
        </aside>
      )}
    </>
  );
}
