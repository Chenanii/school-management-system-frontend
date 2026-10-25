import { useCallback, useEffect, useState } from 'react';
import { Building2, CreditCard, LoaderCircle, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import PlanFormModal from './PlanFormModal.jsx';
import SubscriptionStatusModal from './SubscriptionStatusModal.jsx';
import AssessmentPopup from '../assessments/AssessmentPopup.jsx';
import {
  formatPlanPrice,
  formatSubscriptionDate,
  getSubscriptionData,
  requestPlan,
  startCheckout,
  statusLabel
} from './subscriptionApi.js';

function PlanLimits({ plan }) {
  return (
    <div className="subscription-plan-limits">
      <span>{plan.maxStudents == null ? 'Unlimited' : plan.maxStudents} students</span>
      <span>{plan.maxStaff == null ? 'Unlimited' : plan.maxStaff} staff</span>
    </div>
  );
}

function PaymentCheckoutModal({ plan, loading, onClose, onPay }) {
  if (!plan) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose();
    }}>
      <section className="user-modal subscription-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Plan change awaiting payment</p>
            <h2 id="checkout-modal-title">Complete your subscription</h2>
            <p>{plan.name} · {formatPlanPrice(plan)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={loading} aria-label="Close"><X size={19} /></button>
        </div>
        <p className="checkout-modal-copy">Your plan will be activated after PayChangu confirms your payment.</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={loading}>Pay later</button>
          <button className="primary-button" type="button" onClick={onPay} disabled={loading}>
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {loading ? 'Opening checkout…' : 'Pay with PayChangu'}
          </button>
        </div>
      </section>
    </div>
  );
}

function FloatingPaymentReminder({ plan, onCompletePayment }) {
  if (!plan) return null;
  return (
    <aside className="subscription-payment-reminder" aria-label="Pending subscription payment">
      <div>
        <strong>Plan change awaiting payment</strong>
        <span>{plan.name} · {formatPlanPrice(plan)}</span>
      </div>
      <button className="primary-button" type="button" onClick={onCompletePayment}>
        <CreditCard size={15} /> Complete payment
      </button>
    </aside>
  );
}

function PlanManager({ signOut }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formPlan, setFormPlan] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getSubscriptionData('/subscriptions/manage/plans');
      setPlans(result.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <div className="subscription-section-heading">
        <div><h2>Plan catalogue</h2><p>Define billing, trials, capacity limits, and availability.</p></div>
        <button className="primary-button" onClick={() => { setFormPlan(null); setFormOpen(true); }}><Plus size={16} /> Add plan</button>
      </div>
      {error ? (
        <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
      ) : loading ? (
        <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading subscription plans…</span></div>
      ) : plans.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><CreditCard size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No plans configured</p><button className="text-button mt-3" onClick={() => { setFormPlan(null); setFormOpen(true); }}>Create the first plan</button></div>
      ) : (
        <div className="subscription-plan-grid">
          {plans.map((plan) => (
            <article className={`subscription-plan-card ${plan.isActive ? '' : 'subscription-plan-inactive'}`} key={plan.id}>
              <div className="subscription-plan-card-top">
                <div><span className="eyebrow">{plan.code}</span><h3>{plan.name}</h3></div>
                <span className={`subject-status subject-status-${plan.isActive ? 'active' : 'inactive'}`}>{plan.isActive ? 'Available' : 'Inactive'}</span>
              </div>
              <p className="subscription-plan-description">{plan.description || 'No plan description provided.'}</p>
              <strong className="subscription-plan-price">{formatPlanPrice(plan)}</strong>
              <PlanLimits plan={plan} />
              <div className="subscription-plan-meta">{plan.trialDays} day{plan.trialDays === 1 ? '' : 's'} trial · {plan.interval.toLowerCase()}</div>
              <button className="table-action subscription-edit-plan" onClick={() => { setFormPlan(plan); setFormOpen(true); }}><Pencil size={13} /> Edit plan</button>
            </article>
          ))}
        </div>
      )}
      {formOpen && (
        <PlanFormModal plan={formPlan} signOut={signOut} onClose={() => setFormOpen(false)} onSaved={() => {
          setFormOpen(false);
          refresh();
        }} />
      )}
    </>
  );
}

function SubscriptionManager({ signOut }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusSubscription, setStatusSubscription] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [result, paymentResult] = await Promise.all([
        getSubscriptionData('/subscriptions/manage/subscriptions'),
        getSubscriptionData('/subscriptions/manage/payments')
      ]);
      setSubscriptions(result.data || []);
      setPayments(paymentResult.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <div className="subscription-section-heading">
        <div><h2>School subscriptions</h2><p>Review subscription history and confirm payment or status changes.</p></div>
        <span className="subscription-record-count">{subscriptions.length} records</span>
      </div>
      {error ? (
        <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
      ) : loading ? (
        <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading school subscriptions…</span></div>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><Building2 size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No school subscriptions yet</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="people-table subscription-table">
            <thead><tr><th>School</th><th>Plan</th><th>Status</th><th>Period ends</th><th>Trial ends</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td><div className="subscription-school-cell"><strong>{subscription.school?.name || 'School'}</strong><span>{subscription.school?.slug}{subscription.school?.email ? ` · ${subscription.school.email}` : ''}</span></div></td>
                  <td><div className="subscription-plan-cell"><strong>{subscription.plan?.name}</strong><span>{formatPlanPrice(subscription.plan)}</span></div></td>
                  <td><span className={`subject-status subject-status-${subscription.status.toLowerCase().replace('_', '-')}`}>{statusLabel(subscription.status)}</span></td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.currentPeriodEnd)}</td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.trialEndsAt)}</td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.createdAt)}</td>
                  <td><button className="table-action" onClick={() => setStatusSubscription(subscription)}>Update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {statusSubscription && (
        <SubscriptionStatusModal
          subscription={statusSubscription}
          signOut={signOut}
          onClose={() => setStatusSubscription(null)}
          onSaved={() => {
            setStatusSubscription(null);
            refresh();
          }}
        />
      )}
      <div className="subscription-section-heading mt-6"><div><h2>Payment ledger</h2><p>Provider verified status for every checkout attempt.</p></div><span className="subscription-record-count">{payments.length} records</span></div>
      <div className="overflow-x-auto">
        <table className="people-table subscription-table">
          <thead><tr><th>School</th><th>Plan</th><th>Reference</th><th>Amount</th><th>Status</th><th>Paid/created</th></tr></thead>
          <tbody>{payments.map((payment) => (
            <tr key={payment.id}>
              <td><div className="subscription-school-cell"><strong>{payment.school?.name || 'School'}</strong><span>{payment.school?.slug}</span></div></td>
              <td>{payment.plan?.name}</td><td className="font-mono text-xs">{payment.txRef}</td>
              <td>{payment.currency} {(payment.amount / 100).toFixed(2)}</td>
              <td><span className={`subject-status subject-status-${payment.status.toLowerCase()}`}>{statusLabel(payment.status)}</span></td>
              <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(payment.verifiedAt || payment.createdAt)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

function SchoolSubscription({ signOut }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState(() => {
    const status = new URLSearchParams(window.location.search).get('payment_status');
    if (status === 'success') return 'Payment confirmed by PayChangu. Your subscription is active.';
    if (status === 'failed') return 'PayChangu reports that this payment did not complete. You can retry checkout.';
    if (status === 'pending') return 'Payment is still pending verification. Check payment history again shortly.';
    return '';
  });
  const [actionIsError, setActionIsError] = useState(() => new URLSearchParams(window.location.search).get('payment_status') === 'failed');
  const [requesting, setRequesting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [payments, setPayments] = useState([]);
  const [checkoutSubscriptionId, setCheckoutSubscriptionId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [subscriptionResult, plansResult, paymentResult] = await Promise.all([
        getSubscriptionData('/subscriptions/current'),
        getSubscriptionData('/subscriptions/plans'),
        getSubscriptionData('/subscriptions/payments')
      ]);
      setSubscription(subscriptionResult.data);
      setPlans(plansResult.data || []);
      setPayments(paymentResult.data || []);
      setCheckoutSubscriptionId(subscriptionResult.data?.pendingChange?.plan?.priceMinor > 0
        ? subscriptionResult.data.pendingChange.id
        : '');
      setSelectedPlan('');
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  async function submitRequest(event) {
    event.preventDefault();
    if (!selectedPlan) return;
    setRequesting(true);
    setActionMessage('');
    setActionIsError(false);
    try {
      const result = await requestPlan(selectedPlan);
      const status = result.data?.status;
      if (status === 'ACTIVE') setActionMessage('Your plan has been changed successfully.');
      else setActionMessage('');
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setActionMessage(cause.message);
      setActionIsError(true);
      if (cause.status === 401) signOut();
    } finally {
      setRequesting(false);
    }
  }

  async function payForSubscription(subscriptionId) {
    setRequesting(true);
    setActionMessage('');
    try {
      const result = await startCheckout(subscriptionId);
      window.location.assign(result.data.checkoutUrl);
    } catch (cause) {
      setActionMessage(cause.message);
      setActionIsError(true);
      if (cause.status === 401) signOut();
    } finally { setRequesting(false); }
  }

  const current = subscription?.current;
  const pendingChange = subscription?.pendingChange;
  const pendingPaymentExists = payments.some((payment) => payment.subscriptionId === pendingChange?.id && payment.status === 'PENDING');
  const renewalAllowed = Boolean(current?.currentPeriodEnd &&
    new Date(current.currentPeriodEnd).getTime() > Date.now() &&
    new Date(current.currentPeriodEnd).getTime() - Date.now() <= 28 * 24 * 60 * 60 * 1000);
  const selectedIsAlreadyRequested = (selectedPlan === current?.planId && !renewalAllowed) || selectedPlan === pendingChange?.planId;

  if (loading) {
    return <div className="panel subscription-loading"><LoaderCircle size={20} className="animate-spin text-green-700" /><span>Loading your subscription…</span></div>;
  }
  return (
    <div className="school-subscription-content">
      <AssessmentPopup message={error} duration={15000} onDismiss={() => setError('')} actionLabel="Try again" onAction={() => setRefreshKey((value) => value + 1)} />
      <AssessmentPopup
        message={actionMessage}
        duration={pendingChange?.plan?.priceMinor > 0 ? 0 : 15000}
        type={actionIsError ? 'error' : 'success'}
        onDismiss={() => setActionMessage('')}
      />
      <section className="panel subscription-current-panel">
        <div className="subscription-current-icon"><CreditCard size={20} /></div>
        <div className="subscription-current-copy">
          <p className="eyebrow">Current subscription</p>
          {current ? (
            <>
              <h2>{current.plan.name}</h2>
              <p>{formatPlanPrice(current.plan)} · {statusLabel(current.status)}</p>
              <PlanLimits plan={current.plan} />
              {current.status === 'TRIALING' && <span className="subscription-renewal">Trial ends {formatSubscriptionDate(current.trialEndsAt)}</span>}
              {current.currentPeriodEnd && <span className="subscription-renewal">Paid through {formatSubscriptionDate(current.currentPeriodEnd)}</span>}
            </>
          ) : (
            <>
              <h2>No active subscription</h2>
              <p>Choose a plan below to request access for your school.</p>
            </>
          )}
        </div>
        {current && <span className={`subject-status subject-status-${current.status.toLowerCase().replace('_', '-')}`}>{statusLabel(current.status)}</span>}
      </section>
      <section className="panel school-plan-selection">
        <div className="subscription-section-heading">
          <div><h2>Available plans</h2><p>Select a plan to apply or send a change request to the platform administrator.</p></div>
        </div>
        {plans.length === 0 ? (
          <div className="plan-message">No plans are available at this time. Please contact the platform administrator.</div>
        ) : (
          <form onSubmit={submitRequest}>
            <div className="subscription-plan-grid">
              {plans.map((plan) => {
                const isCurrent = current?.planId === plan.id;
                const isPending = pendingChange?.planId === plan.id;
                const canRenewCurrent = isCurrent && renewalAllowed;
                return (
                  <label className={`subscription-plan-card subscription-choice-card ${selectedPlan === plan.id ? 'subscription-choice-selected' : ''}`} key={plan.id}>
                    <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)} disabled={(isCurrent && !canRenewCurrent) || isPending || pendingPaymentExists} />
                    <div className="subscription-plan-card-top">
                      <div><span className="eyebrow">{plan.interval.toLowerCase()}</span><h3>{plan.name}</h3></div>
                      {(isCurrent || isPending) && <span className="subject-status subject-status-active">{canRenewCurrent ? 'Renewal available' : isCurrent ? 'Current' : 'Requested'}</span>}
                    </div>
                    <p className="subscription-plan-description">{plan.description || `${plan.trialDays} day${plan.trialDays === 1 ? '' : 's'} trial`}</p>
                    <strong className="subscription-plan-price">{formatPlanPrice(plan)}</strong>
                    <PlanLimits plan={plan} />
                    <span className="subscription-plan-meta">{plan.trialDays} day{plan.trialDays === 1 ? '' : 's'} trial</span>
                  </label>
                );
              })}
            </div>
            <div className="subscription-request-footer">
              {pendingPaymentExists && <span>Complete or verify the pending checkout before requesting another plan.</span>}
              <button className="primary-button" type="submit" disabled={requesting || !selectedPlan || plans.length === 0 || selectedIsAlreadyRequested}>
                {requesting ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={15} />}
                {requesting ? 'Sending request…' : 'Request plan change'}
              </button>
            </div>
          </form>
        )}
      </section>
      {subscription?.recent?.length > 0 && (
        <section className="panel subscription-history-panel">
          <div className="subscription-section-heading"><div><h2>Subscription history</h2><p>Recent subscription records for this school.</p></div></div>
          <div className="subscription-history-list">
            {subscription.recent.map((item) => (
              <div className="subscription-history-row" key={item.id}>
                <div><strong>{item.plan?.name}</strong><span>{formatSubscriptionDate(item.createdAt)} · {formatPlanPrice(item.plan)}</span></div>
                <span className={`subject-status subject-status-${item.status.toLowerCase().replace('_', '-')}`}>{statusLabel(item.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {payments.length > 0 && (
        <section className="panel subscription-history-panel">
          <div className="subscription-section-heading"><div><h2>Payment history</h2><p>Payment status is updated only after PayChangu confirms the transaction.</p></div></div>
          <div className="subscription-history-list">
            {payments.map((payment) => (
              <div className="subscription-history-row" key={payment.id}>
                <div><strong>{payment.plan?.name || payment.txRef}</strong><span>{payment.txRef} · {formatSubscriptionDate(payment.createdAt)} · {payment.currency} {(payment.amount / 100).toFixed(2)}</span></div>
                <span className={`subject-status subject-status-${payment.status.toLowerCase()}`}>{statusLabel(payment.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <PaymentCheckoutModal
        plan={pendingChange?.id === checkoutSubscriptionId ? pendingChange.plan : null}
        loading={requesting}
        onClose={() => setCheckoutSubscriptionId('')}
        onPay={() => payForSubscription(checkoutSubscriptionId)}
      />
      <FloatingPaymentReminder
        plan={pendingChange?.plan?.priceMinor > 0 && !checkoutSubscriptionId ? pendingChange.plan : null}
        onCompletePayment={() => setCheckoutSubscriptionId(pendingChange.id)}
      />
    </div>
  );
}

export default function SubscriptionsPage({ user, signOut }) {
  const [view, setView] = useState('subscriptions');

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">{user.role === 'SUPER_ADMIN' ? 'Platform billing' : 'School billing'}</p>
          <h1 className="page-title">Subscriptions<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">{user.role === 'SUPER_ADMIN' ? 'Manage plan offerings and school subscription status.' : 'Review your school’s plan, request changes, and check billing history.'}</p>
        </div>
      </div>
      {user.role === 'SUPER_ADMIN' ? (
        <>
          <div className="subscription-tabs" role="tablist" aria-label="Subscription administration">
            <button className={view === 'subscriptions' ? 'subscription-tab subscription-tab-active' : 'subscription-tab'} role="tab" aria-selected={view === 'subscriptions'} onClick={() => setView('subscriptions')}><Building2 size={15} /> School subscriptions</button>
            <button className={view === 'plans' ? 'subscription-tab subscription-tab-active' : 'subscription-tab'} role="tab" aria-selected={view === 'plans'} onClick={() => setView('plans')}><CreditCard size={15} /> Plan catalogue</button>
          </div>
          <section className="panel subscription-admin-panel">
            {view === 'plans' ? <PlanManager signOut={signOut} /> : <SubscriptionManager signOut={signOut} />}
          </section>
        </>
      ) : (
        <SchoolSubscription signOut={signOut} />
      )}
    </>
  );
}
